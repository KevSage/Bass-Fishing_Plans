/**
 * Sync Service for Offline-First Architecture
 *
 * Handles bidirectional sync between local SQLite and remote server:
 * - Initial sync: Download all catches from server on first launch
 * - Upload sync: Push local catches to server when on WiFi
 * - Photo sync: Download photos to local filesystem
 */

import { Network, type ConnectionStatus } from '@capacitor/network';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';
import {
  getCatches,
  getUnsyncedCatches,
  getCatchByServerId,
  createLocalCatch,
  markCatchSynced,
  markCatchSyncFailed,
  updateLocalCatch,
  getPendingSyncItems,
  updateSyncQueueItem,
  purgeSyncedDeletions,
  isSQLiteAvailable,
  LocalCatch,
} from './sqlite-db';
import {
  listCatchesMobile,
  createCatchMobile,
  updateCatchMobile,
  deleteCatchMobile,
  CatchRecord,
} from './catches-api';

// =============================================================================
// TYPES
// =============================================================================

export interface SyncStatus {
  isInitialSyncComplete: boolean;
  lastSyncAt: string | null;
  pendingUploads: number;
  isSyncing: boolean;
  error: string | null;
}

// Sync state
let isSyncing = false;
let syncListeners: ((status: SyncStatus) => void)[] = [];

// =============================================================================
// SYNC STATUS
// =============================================================================

/**
 * Get current sync status
 */
export async function getSyncStatus(userEmail: string): Promise<SyncStatus> {
  const initialSyncComplete = await Preferences.get({ key: 'initial_sync_complete' });
  const lastSync = await Preferences.get({ key: 'last_sync_at' });

  let pendingUploads = 0;
  if (isSQLiteAvailable()) {
    const unsynced = await getUnsyncedCatches(userEmail);
    pendingUploads = unsynced.length;
  }

  return {
    isInitialSyncComplete: initialSyncComplete.value === 'true',
    lastSyncAt: lastSync.value || null,
    pendingUploads,
    isSyncing,
    error: null,
  };
}

/**
 * Subscribe to sync status changes
 */
export function onSyncStatusChange(listener: (status: SyncStatus) => void): () => void {
  syncListeners.push(listener);
  return () => {
    syncListeners = syncListeners.filter(l => l !== listener);
  };
}

/**
 * Notify listeners of sync status change
 */
async function notifySyncStatusChange(userEmail: string): Promise<void> {
  const status = await getSyncStatus(userEmail);
  syncListeners.forEach(l => l(status));
}

// =============================================================================
// INITIAL SYNC (Download from Server)
// =============================================================================

/**
 * Perform initial sync - download all catches from server
 * Should be called on first app launch after update
 */
export async function performInitialSync(
  userEmail: string,
  userId: string
): Promise<{ success: boolean; downloaded: number; error?: string }> {
  if (!isSQLiteAvailable()) {
    return { success: false, downloaded: 0, error: 'SQLite not available' };
  }

  // Check if already done
  const initialSyncComplete = await Preferences.get({ key: 'initial_sync_complete' });
  if (initialSyncComplete.value === 'true') {
    console.log('[Sync] Initial sync already complete');
    return { success: true, downloaded: 0 };
  }

  // Check network
  const networkStatus = await Network.getStatus();
  if (!networkStatus.connected) {
    console.log('[Sync] No network, deferring initial sync');
    return { success: false, downloaded: 0, error: 'No network connection' };
  }

  console.log('[Sync] Starting initial sync...');
  isSyncing = true;
  await notifySyncStatusChange(userEmail);

  try {
    // Fetch all catches from server
    const response = await listCatchesMobile(userEmail, userId, 1000, 0);
    const serverCatches = response.catches;

    console.log(`[Sync] Fetched ${serverCatches.length} catches from server`);

    let downloaded = 0;

    for (const serverCatch of serverCatches) {
      // Check if we already have this catch
      const existing = await getCatchByServerId(serverCatch.id);
      if (existing) {
        console.log(`[Sync] Catch ${serverCatch.id} already exists locally`);
        continue;
      }

      // Insert into local database
      await createLocalCatch({
        user_email: userEmail,
        server_id: serverCatch.id,
        lake_id: serverCatch.lake_id,
        lake_type: serverCatch.lake_type,
        lake_name: serverCatch.lake_name,
        lake_lat: serverCatch.lat,
        lake_lng: serverCatch.lng,
        catch_lat: serverCatch.lat,
        catch_lng: serverCatch.lng,
        species: serverCatch.species,
        weight: serverCatch.weight,
        length: serverCatch.length,
        lure: serverCatch.lure,
        color: serverCatch.color,
        notes: serverCatch.notes,
        photo_local_path: null,
        photo_url: serverCatch.photo_url,
        photo_pending: false,
        temp: serverCatch.temp || null,
        wind_speed: serverCatch.wind_speed || null,
        wind_direction: serverCatch.wind_direction || null,
        pressure: serverCatch.pressure || null,
        sky_condition: serverCatch.sky_condition || null,
        caught_at: `${serverCatch.date}T${serverCatch.time || '12:00'}:00`,
        source: serverCatch.source as any,
      });

      // Mark as already synced (since it came from server)
      // Note: createLocalCatch sets is_synced=false, so we need to update it
      const createdCatch = await getCatchByServerId(serverCatch.id);
      if (createdCatch) {
        await updateLocalCatch(createdCatch.local_id, { is_synced: true });
      }

      downloaded++;
    }

    // Mark initial sync as complete
    await Preferences.set({ key: 'initial_sync_complete', value: 'true' });
    await Preferences.set({ key: 'last_sync_at', value: new Date().toISOString() });

    console.log(`[Sync] Initial sync complete: ${downloaded} catches downloaded`);

    isSyncing = false;
    await notifySyncStatusChange(userEmail);

    return { success: true, downloaded };

  } catch (error: any) {
    console.error('[Sync] Initial sync failed:', error);
    isSyncing = false;
    await notifySyncStatusChange(userEmail);
    return { success: false, downloaded: 0, error: error.message };
  }
}

// =============================================================================
// UPLOAD SYNC (Push to Server)
// =============================================================================

/**
 * Sync unsynced catches to server
 * Should be called when on WiFi
 */
export async function syncToServer(
  userEmail: string,
  userId: string
): Promise<{ success: boolean; uploaded: number; errors: number }> {
  if (!isSQLiteAvailable()) {
    return { success: false, uploaded: 0, errors: 0 };
  }

  // Check network - only sync on WiFi
  const networkStatus = await Network.getStatus();
  if (!networkStatus.connected) {
    console.log('[Sync] No network, skipping upload sync');
    return { success: false, uploaded: 0, errors: 0 };
  }

  // Optional: Check if on WiFi specifically
  // if (networkStatus.connectionType !== 'wifi') {
  //   console.log('[Sync] Not on WiFi, skipping sync');
  //   return { success: false, uploaded: 0, errors: 0 };
  // }

  if (isSyncing) {
    console.log('[Sync] Sync already in progress');
    return { success: false, uploaded: 0, errors: 0 };
  }

  console.log('[Sync] Starting upload sync...');
  isSyncing = true;
  await notifySyncStatusChange(userEmail);

  let uploaded = 0;
  let errors = 0;

  try {
    // Get pending sync queue items
    const queueItems = await getPendingSyncItems();
    console.log(`[Sync] Processing ${queueItems.length} queue items`);

    for (const item of queueItems) {
      try {
        if (item.operation === 'create') {
          await syncCreateCatch(item.local_id, userEmail, userId);
          await updateSyncQueueItem(item.id, true);
          uploaded++;
        } else if (item.operation === 'update') {
          await syncUpdateCatch(item.local_id, userEmail, userId);
          await updateSyncQueueItem(item.id, true);
          uploaded++;
        } else if (item.operation === 'delete') {
          await syncDeleteCatch(item.local_id, userEmail, userId);
          await updateSyncQueueItem(item.id, true);
          uploaded++;
        }
      } catch (err: any) {
        console.error(`[Sync] Failed to sync ${item.operation}:`, item.local_id, err);
        await updateSyncQueueItem(item.id, false, err.message);
        await markCatchSyncFailed(item.local_id, err.message);
        errors++;
      }
    }

    // Cleanup: Remove catches that were deleted and synced
    await purgeSyncedDeletions();

    // Update last sync time
    await Preferences.set({ key: 'last_sync_at', value: new Date().toISOString() });

    console.log(`[Sync] Upload sync complete: ${uploaded} uploaded, ${errors} errors`);

  } catch (error: any) {
    console.error('[Sync] Upload sync failed:', error);
    errors++;
  }

  isSyncing = false;
  await notifySyncStatusChange(userEmail);

  return { success: errors === 0, uploaded, errors };
}

/**
 * Sync a new catch to server
 */
async function syncCreateCatch(
  localId: string,
  userEmail: string,
  userId: string
): Promise<void> {
  const localCatch = await getCatches(userEmail).then(
    catches => catches.find(c => c.local_id === localId)
  );

  if (!localCatch) {
    throw new Error('Catch not found locally');
  }

  if (localCatch.server_id) {
    console.log('[Sync] Catch already has server_id, skipping create');
    return;
  }

  // Convert to API format
  const input = localCatchToApiInput(localCatch);

  // Create on server
  const response = await createCatchMobile(input, userEmail, userId);

  if (response.success && response.catch_id) {
    await markCatchSynced(localId, response.catch_id);
  } else {
    throw new Error('Server did not return catch_id');
  }
}

/**
 * Sync an updated catch to server
 */
async function syncUpdateCatch(
  localId: string,
  userEmail: string,
  userId: string
): Promise<void> {
  const localCatch = await getCatches(userEmail).then(
    catches => catches.find(c => c.local_id === localId)
  );

  if (!localCatch) {
    throw new Error('Catch not found locally');
  }

  if (!localCatch.server_id) {
    // No server_id means it was never synced - treat as create
    await syncCreateCatch(localId, userEmail, userId);
    return;
  }

  const input = localCatchToApiInput(localCatch);
  await updateCatchMobile(localCatch.server_id, input, userEmail, userId);

  // Mark as synced
  await updateLocalCatch(localId, { is_synced: true, sync_error: null });
}

/**
 * Sync a deleted catch to server
 */
async function syncDeleteCatch(
  localId: string,
  userEmail: string,
  userId: string
): Promise<void> {
  const localCatch = await getCatches(userEmail).then(
    catches => catches.find(c => c.local_id === localId)
  );

  // If no server_id, nothing to delete on server
  if (!localCatch?.server_id) {
    return;
  }

  await deleteCatchMobile(localCatch.server_id, userEmail, userId);

  // Mark as synced (will be purged later)
  await updateLocalCatch(localId, { is_synced: true });
}

// =============================================================================
// PHOTO SYNC
// =============================================================================

/**
 * Download a photo to local filesystem
 */
export async function downloadPhoto(
  photoUrl: string,
  localId: string
): Promise<string | null> {
  if (!photoUrl) return null;

  try {
    // Fetch the image
    const response = await fetch(photoUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch photo: ${response.status}`);
    }

    const blob = await response.blob();

    // Convert to base64
    const reader = new FileReader();
    const base64Promise = new Promise<string>((resolve, reject) => {
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
    });
    reader.readAsDataURL(blob);

    const base64Data = await base64Promise;

    // Save to filesystem
    const fileName = `catch_${localId}_${Date.now()}.jpg`;
    const result = await Filesystem.writeFile({
      path: `catches/${fileName}`,
      data: base64Data,
      directory: Directory.Data,
      recursive: true,
    });

    console.log('[Sync] Photo downloaded:', result.uri);

    // Update catch with local path
    await updateLocalCatch(localId, {
      photo_local_path: result.uri,
      photo_pending: false,
    });

    return result.uri;

  } catch (error) {
    console.error('[Sync] Photo download failed:', error);
    return null;
  }
}

/**
 * Download all photos for catches that have URLs but no local path
 */
export async function downloadAllPhotos(userEmail: string): Promise<number> {
  if (!isSQLiteAvailable()) return 0;

  const catches = await getCatches(userEmail);
  let downloaded = 0;

  for (const c of catches) {
    if (c.photo_url && !c.photo_local_path) {
      const result = await downloadPhoto(c.photo_url, c.local_id);
      if (result) downloaded++;
    }
  }

  console.log(`[Sync] Downloaded ${downloaded} photos`);
  return downloaded;
}

// =============================================================================
// NETWORK LISTENERS
// =============================================================================

let networkListenerRegistered = false;

/**
 * Start listening for network changes to trigger sync
 */
export function startNetworkListener(
  userEmail: string,
  userId: string
): void {
  if (networkListenerRegistered) return;

  Network.addListener('networkStatusChange', async (status: ConnectionStatus) => {
    console.log('[Sync] Network status changed:', status.connected, status.connectionType);

    if (status.connected) {
      // Try initial sync if not done
      const initialComplete = await Preferences.get({ key: 'initial_sync_complete' });
      if (initialComplete.value !== 'true') {
        await performInitialSync(userEmail, userId);
      }

      // Sync to server on any connection (or limit to WiFi)
      // if (status.connectionType === 'wifi') {
      await syncToServer(userEmail, userId);
      // }
    }
  });

  networkListenerRegistered = true;
  console.log('[Sync] Network listener registered');
}

/**
 * Stop network listener
 */
export async function stopNetworkListener(): Promise<void> {
  await Network.removeAllListeners();
  networkListenerRegistered = false;
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Convert LocalCatch to API input format
 */
function localCatchToApiInput(c: LocalCatch): any {
  // Parse caught_at to get date and time
  const caughtAt = new Date(c.caught_at);
  const date = caughtAt.toISOString().split('T')[0];
  const time = caughtAt.toTimeString().slice(0, 5);

  return {
    date,
    time,
    species: c.species || 'largemouth',
    lat: c.catch_lat,
    lng: c.catch_lng,
    weight: c.weight,
    length: c.length,
    lure: c.lure,
    color: c.color,
    notes: c.notes,
    photo_url: c.photo_url,
    lake_id: c.lake_id,
    lake_type: c.lake_type,
    lake_name: c.lake_name,
    source: c.source,
    temp: c.temp,
    wind_speed: c.wind_speed,
    wind_direction: c.wind_direction,
    pressure: c.pressure,
    sky_condition: c.sky_condition,
  };
}

/**
 * Manual sync trigger (for user-initiated sync)
 */
export async function manualSync(
  userEmail: string,
  userId: string
): Promise<{ downloaded: number; uploaded: number; errors: number }> {
  let downloaded = 0;
  let uploaded = 0;
  let errors = 0;

  // First, try initial sync if not done
  const initialResult = await performInitialSync(userEmail, userId);
  downloaded = initialResult.downloaded;
  if (initialResult.error) errors++;

  // Then, upload any pending changes
  const uploadResult = await syncToServer(userEmail, userId);
  uploaded = uploadResult.uploaded;
  errors += uploadResult.errors;

  return { downloaded, uploaded, errors };
}
