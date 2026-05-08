/**
 * SQLite Database Service for Offline-First Catch Storage
 *
 * This module provides local-first storage for catches using SQLite.
 * All catches are stored locally first, then synced to the server in the background.
 */

import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

// Database configuration
const DB_NAME = 'bass_clarity_catches';
const DB_VERSION = 1;

// Singleton connection
let db: SQLiteDBConnection | null = null;
const sqlite = new SQLiteConnection(CapacitorSQLite);

// =============================================================================
// TYPES
// =============================================================================

export interface LocalCatch {
  local_id: string;           // UUID generated client-side
  server_id: string | null;   // Set after sync to server
  user_email: string;

  // Lake info
  lake_id: string | null;
  lake_type: 'known' | 'custom' | 'unresolved';
  lake_name: string | null;
  lake_lat: number;
  lake_lng: number;

  // Catch location
  catch_lat: number;
  catch_lng: number;

  // Catch details
  species: string;
  weight: number | null;
  length: number | null;
  lure: string | null;
  color: string | null;
  notes: string | null;

  // Photo
  photo_local_path: string | null;  // Local file path
  photo_url: string | null;          // Cloud URL after upload
  photo_pending: boolean;             // True if photo needs upload

  // Weather
  temp: number | null;
  wind_speed: number | null;
  wind_direction: string | null;
  pressure: number | null;
  sky_condition: string | null;

  // Metadata
  caught_at: string;          // ISO timestamp
  source: 'camera' | 'library' | 'manual' | 'demo';
  created_at: string;
  updated_at: string;

  // Sync status
  is_synced: boolean;
  is_deleted: boolean;        // Soft delete for sync
  sync_error: string | null;
}

export interface SyncQueueItem {
  id: number;
  entity_type: 'catch';
  local_id: string;
  operation: 'create' | 'update' | 'delete' | 'upload_photo';
  payload: string | null;     // JSON
  attempts: number;
  max_attempts: number;
  last_attempt_at: string | null;
  next_attempt_at: string | null;
  error: string | null;
  created_at: string;
}

// =============================================================================
// DATABASE INITIALIZATION
// =============================================================================

const SCHEMA = `
-- Main catches table
CREATE TABLE IF NOT EXISTS catches (
  local_id TEXT PRIMARY KEY,
  server_id TEXT UNIQUE,
  user_email TEXT NOT NULL,

  -- Lake info
  lake_id TEXT,
  lake_type TEXT CHECK(lake_type IN ('known', 'custom', 'unresolved')) DEFAULT 'unresolved',
  lake_name TEXT,
  lake_lat REAL,
  lake_lng REAL,

  -- Catch location
  catch_lat REAL NOT NULL,
  catch_lng REAL NOT NULL,

  -- Catch details
  species TEXT,
  weight REAL,
  length REAL,
  lure TEXT,
  color TEXT,
  notes TEXT,

  -- Photo (store file path, not base64)
  photo_local_path TEXT,
  photo_url TEXT,
  photo_pending INTEGER DEFAULT 0,

  -- Weather
  temp REAL,
  wind_speed REAL,
  wind_direction TEXT,
  pressure REAL,
  sky_condition TEXT,

  -- Metadata
  caught_at TEXT NOT NULL,
  source TEXT CHECK(source IN ('camera', 'library', 'manual', 'demo')) DEFAULT 'manual',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

  -- Sync status
  is_synced INTEGER DEFAULT 0,
  is_deleted INTEGER DEFAULT 0,
  sync_error TEXT
);

-- Sync queue for pending operations
CREATE TABLE IF NOT EXISTS sync_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_type TEXT NOT NULL DEFAULT 'catch',
  local_id TEXT NOT NULL,
  operation TEXT NOT NULL CHECK(operation IN ('create', 'update', 'delete', 'upload_photo')),
  payload TEXT,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 5,
  last_attempt_at TEXT,
  next_attempt_at TEXT,
  error TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_catches_user ON catches(user_email);
CREATE INDEX IF NOT EXISTS idx_catches_lake ON catches(lake_id);
CREATE INDEX IF NOT EXISTS idx_catches_synced ON catches(is_synced);
CREATE INDEX IF NOT EXISTS idx_catches_server_id ON catches(server_id);
CREATE INDEX IF NOT EXISTS idx_sync_queue_next ON sync_queue(next_attempt_at);
CREATE INDEX IF NOT EXISTS idx_sync_queue_local_id ON sync_queue(local_id);
`;

/**
 * Initialize the SQLite database
 */
export async function initDatabase(): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    console.log('[SQLite] Not on native platform, skipping init');
    return;
  }

  try {
    // Check if database exists
    const dbExists = await sqlite.isDatabase(DB_NAME);

    // Create connection
    db = await sqlite.createConnection(
      DB_NAME,
      false,      // encrypted
      'no-encryption',
      DB_VERSION,
      false       // readonly
    );

    await db.open();
    console.log('[SQLite] Database opened');

    // Execute schema
    await db.execute(SCHEMA);
    console.log('[SQLite] Schema created/verified');

    // Mark as initialized
    await Preferences.set({ key: 'sqlite_initialized', value: 'true' });

  } catch (error) {
    console.error('[SQLite] Init error:', error);
    throw error;
  }
}

/**
 * Get database connection (initializes if needed)
 */
export async function getDb(): Promise<SQLiteDBConnection> {
  if (!Capacitor.isNativePlatform()) {
    throw new Error('SQLite only available on native platforms');
  }

  if (!db) {
    await initDatabase();
  }

  if (!db) {
    throw new Error('Failed to initialize database');
  }

  return db;
}

/**
 * Close the database connection
 */
export async function closeDatabase(): Promise<void> {
  if (db) {
    await sqlite.closeConnection(DB_NAME, false);
    db = null;
    console.log('[SQLite] Database closed');
  }
}

// =============================================================================
// CATCH CRUD OPERATIONS
// =============================================================================

/**
 * Generate a UUID for local catch ID
 */
export function generateLocalId(): string {
  return `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a new catch (saves locally, queues for sync)
 */
export async function createLocalCatch(
  catchData: Omit<LocalCatch, 'local_id' | 'created_at' | 'updated_at' | 'is_synced' | 'is_deleted' | 'sync_error'>
): Promise<LocalCatch> {
  const database = await getDb();
  const now = new Date().toISOString();
  const localId = generateLocalId();

  const newCatch: LocalCatch = {
    ...catchData,
    local_id: localId,
    server_id: null,
    created_at: now,
    updated_at: now,
    is_synced: false,
    is_deleted: false,
    sync_error: null,
  };

  const sql = `
    INSERT INTO catches (
      local_id, server_id, user_email,
      lake_id, lake_type, lake_name, lake_lat, lake_lng,
      catch_lat, catch_lng,
      species, weight, length, lure, color, notes,
      photo_local_path, photo_url, photo_pending,
      temp, wind_speed, wind_direction, pressure, sky_condition,
      caught_at, source, created_at, updated_at,
      is_synced, is_deleted, sync_error
    ) VALUES (
      ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?
    )
  `;

  await database.run(sql, [
    newCatch.local_id,
    newCatch.server_id,
    newCatch.user_email,
    newCatch.lake_id,
    newCatch.lake_type,
    newCatch.lake_name,
    newCatch.lake_lat,
    newCatch.lake_lng,
    newCatch.catch_lat,
    newCatch.catch_lng,
    newCatch.species,
    newCatch.weight,
    newCatch.length,
    newCatch.lure,
    newCatch.color,
    newCatch.notes,
    newCatch.photo_local_path,
    newCatch.photo_url,
    newCatch.photo_pending ? 1 : 0,
    newCatch.temp,
    newCatch.wind_speed,
    newCatch.wind_direction,
    newCatch.pressure,
    newCatch.sky_condition,
    newCatch.caught_at,
    newCatch.source,
    newCatch.created_at,
    newCatch.updated_at,
    newCatch.is_synced ? 1 : 0,
    newCatch.is_deleted ? 1 : 0,
    newCatch.sync_error,
  ]);

  // Add to sync queue
  await addToSyncQueue(localId, 'create');

  console.log('[SQLite] Created catch:', localId);
  return newCatch;
}

/**
 * Get all catches for a user
 */
export async function getCatches(userEmail: string): Promise<LocalCatch[]> {
  const database = await getDb();

  const result = await database.query(
    `SELECT * FROM catches
     WHERE user_email = ? AND is_deleted = 0
     ORDER BY caught_at DESC`,
    [userEmail.toLowerCase()]
  );

  if (!result.values) return [];

  return result.values.map(rowToCatch);
}

/**
 * Get a single catch by local_id
 */
export async function getCatchByLocalId(localId: string): Promise<LocalCatch | null> {
  const database = await getDb();

  const result = await database.query(
    'SELECT * FROM catches WHERE local_id = ?',
    [localId]
  );

  if (!result.values || result.values.length === 0) return null;
  return rowToCatch(result.values[0]);
}

/**
 * Get a single catch by server_id
 */
export async function getCatchByServerId(serverId: string): Promise<LocalCatch | null> {
  const database = await getDb();

  const result = await database.query(
    'SELECT * FROM catches WHERE server_id = ?',
    [serverId]
  );

  if (!result.values || result.values.length === 0) return null;
  return rowToCatch(result.values[0]);
}

/**
 * Update a catch
 */
export async function updateLocalCatch(
  localId: string,
  updates: Partial<LocalCatch>
): Promise<void> {
  const database = await getDb();
  const now = new Date().toISOString();

  // Build dynamic UPDATE query
  const fields: string[] = ['updated_at = ?'];
  const values: any[] = [now];

  const allowedFields = [
    'server_id', 'lake_id', 'lake_type', 'lake_name', 'lake_lat', 'lake_lng',
    'catch_lat', 'catch_lng', 'species', 'weight', 'length', 'lure', 'color',
    'notes', 'photo_local_path', 'photo_url', 'photo_pending', 'temp',
    'wind_speed', 'wind_direction', 'pressure', 'sky_condition', 'caught_at',
    'source', 'is_synced', 'is_deleted', 'sync_error'
  ];

  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key)) {
      fields.push(`${key} = ?`);
      // Convert booleans to integers for SQLite
      if (typeof value === 'boolean') {
        values.push(value ? 1 : 0);
      } else {
        values.push(value);
      }
    }
  }

  values.push(localId);

  const sql = `UPDATE catches SET ${fields.join(', ')} WHERE local_id = ?`;
  await database.run(sql, values);

  // If not just a sync status update, add to sync queue
  const syncOnlyFields = ['is_synced', 'server_id', 'sync_error'];
  const hasNonSyncChanges = Object.keys(updates).some(k => !syncOnlyFields.includes(k));

  if (hasNonSyncChanges) {
    // Mark as needing sync
    await database.run(
      'UPDATE catches SET is_synced = 0 WHERE local_id = ?',
      [localId]
    );
    await addToSyncQueue(localId, 'update');
  }

  console.log('[SQLite] Updated catch:', localId);
}

/**
 * Soft delete a catch (marks for sync, then deletes)
 */
export async function deleteLocalCatch(localId: string): Promise<void> {
  const database = await getDb();

  // Check if catch has server_id (needs to be deleted from server too)
  const catchRecord = await getCatchByLocalId(localId);

  if (catchRecord?.server_id) {
    // Has been synced - mark for deletion and queue sync
    await database.run(
      'UPDATE catches SET is_deleted = 1, is_synced = 0, updated_at = ? WHERE local_id = ?',
      [new Date().toISOString(), localId]
    );
    await addToSyncQueue(localId, 'delete');
  } else {
    // Never synced - just delete locally
    await database.run('DELETE FROM catches WHERE local_id = ?', [localId]);
    // Remove any pending sync queue items
    await database.run('DELETE FROM sync_queue WHERE local_id = ?', [localId]);
  }

  console.log('[SQLite] Deleted catch:', localId);
}

/**
 * Get unsynced catches
 */
export async function getUnsyncedCatches(userEmail: string): Promise<LocalCatch[]> {
  const database = await getDb();

  const result = await database.query(
    `SELECT * FROM catches
     WHERE user_email = ? AND is_synced = 0
     ORDER BY created_at ASC`,
    [userEmail.toLowerCase()]
  );

  if (!result.values) return [];
  return result.values.map(rowToCatch);
}

/**
 * Mark a catch as synced with server ID
 */
export async function markCatchSynced(localId: string, serverId: string): Promise<void> {
  const database = await getDb();

  await database.run(
    `UPDATE catches
     SET server_id = ?, is_synced = 1, sync_error = NULL, updated_at = ?
     WHERE local_id = ?`,
    [serverId, new Date().toISOString(), localId]
  );

  // Remove from sync queue
  await database.run(
    'DELETE FROM sync_queue WHERE local_id = ? AND operation IN (?, ?)',
    [localId, 'create', 'update']
  );

  console.log('[SQLite] Marked synced:', localId, '->', serverId);
}

/**
 * Mark a catch sync as failed
 */
export async function markCatchSyncFailed(localId: string, error: string): Promise<void> {
  const database = await getDb();

  await database.run(
    'UPDATE catches SET sync_error = ?, updated_at = ? WHERE local_id = ?',
    [error, new Date().toISOString(), localId]
  );

  console.log('[SQLite] Sync failed:', localId, error);
}

/**
 * Permanently delete synced deletions (cleanup after server confirms delete)
 */
export async function purgeSyncedDeletions(): Promise<void> {
  const database = await getDb();

  await database.run(
    'DELETE FROM catches WHERE is_deleted = 1 AND is_synced = 1'
  );
}

// =============================================================================
// SYNC QUEUE OPERATIONS
// =============================================================================

/**
 * Add an item to the sync queue
 */
export async function addToSyncQueue(
  localId: string,
  operation: 'create' | 'update' | 'delete' | 'upload_photo',
  payload?: object
): Promise<void> {
  const database = await getDb();

  // Check for existing queue item with same local_id and operation
  const existing = await database.query(
    'SELECT id FROM sync_queue WHERE local_id = ? AND operation = ?',
    [localId, operation]
  );

  if (existing.values && existing.values.length > 0) {
    // Update existing queue item
    await database.run(
      `UPDATE sync_queue
       SET payload = ?, attempts = 0, error = NULL, next_attempt_at = CURRENT_TIMESTAMP
       WHERE local_id = ? AND operation = ?`,
      [payload ? JSON.stringify(payload) : null, localId, operation]
    );
  } else {
    // Insert new queue item
    await database.run(
      `INSERT INTO sync_queue (local_id, operation, payload, next_attempt_at)
       VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
      [localId, operation, payload ? JSON.stringify(payload) : null]
    );
  }

  console.log('[SQLite] Queued sync:', operation, localId);
}

/**
 * Get pending sync queue items
 */
export async function getPendingSyncItems(): Promise<SyncQueueItem[]> {
  const database = await getDb();

  const result = await database.query(
    `SELECT * FROM sync_queue
     WHERE attempts < max_attempts
       AND (next_attempt_at IS NULL OR next_attempt_at <= CURRENT_TIMESTAMP)
     ORDER BY created_at ASC
     LIMIT 20`
  );

  if (!result.values) return [];
  return result.values as SyncQueueItem[];
}

/**
 * Update sync queue item after attempt
 */
export async function updateSyncQueueItem(
  id: number,
  success: boolean,
  error?: string
): Promise<void> {
  const database = await getDb();

  if (success) {
    // Remove from queue on success
    await database.run('DELETE FROM sync_queue WHERE id = ?', [id]);
  } else {
    // Increment attempts and set next retry time (exponential backoff)
    const backoffSeconds = Math.min(300, Math.pow(2, 1) * 5); // Max 5 minutes
    await database.run(
      `UPDATE sync_queue
       SET attempts = attempts + 1,
           last_attempt_at = CURRENT_TIMESTAMP,
           next_attempt_at = datetime('now', '+' || ? || ' seconds'),
           error = ?
       WHERE id = ?`,
      [backoffSeconds, error || null, id]
    );
  }
}

/**
 * Clear completed sync queue items
 */
export async function clearSyncQueue(): Promise<void> {
  const database = await getDb();
  await database.run('DELETE FROM sync_queue');
}

// =============================================================================
// MIGRATION FROM LOCALSTORAGE
// =============================================================================

/**
 * Migrate existing catches from localStorage to SQLite
 */
export async function migrateFromLocalStorage(userEmail: string): Promise<number> {
  const migrationKey = 'sqlite_migration_complete';
  const migrated = await Preferences.get({ key: migrationKey });

  if (migrated.value === 'true') {
    console.log('[SQLite] Migration already complete');
    return 0;
  }

  console.log('[SQLite] Starting migration from localStorage...');

  let migratedCount = 0;

  try {
    // Get offline catches
    const offlineData = localStorage.getItem('offline_catches');
    const offlineCatches = offlineData ? JSON.parse(offlineData) : [];

    // Get cached catches
    const cacheData = localStorage.getItem('bc_catches_cache');
    const cachedCatches = cacheData ? JSON.parse(cacheData) : [];

    // Merge and dedupe by ID
    const allCatches = [...offlineCatches, ...cachedCatches];
    const uniqueCatches = new Map();

    for (const c of allCatches) {
      if (!uniqueCatches.has(c.id)) {
        uniqueCatches.set(c.id, c);
      }
    }

    // Insert each catch into SQLite
    for (const [id, c] of uniqueCatches) {
      try {
        const isOffline = c.isOffline || id.startsWith('offline-');

        await createLocalCatch({
          user_email: userEmail,
          server_id: isOffline ? null : id,
          lake_id: c.lakeId || null,
          lake_type: c.lakeType || 'unresolved',
          lake_name: c.lakeName || null,
          lake_lat: c.lakeLat || 0,
          lake_lng: c.lakeLng || 0,
          catch_lat: c.catchLat || c.lakeLat || 0,
          catch_lng: c.catchLng || c.lakeLng || 0,
          species: c.species || 'largemouth',
          weight: c.weight || null,
          length: c.length || null,
          lure: c.lure || null,
          color: c.color || null,
          notes: c.notes || null,
          photo_local_path: null,
          photo_url: c.photoUrl || null,
          photo_pending: false,
          temp: c.temp || null,
          wind_speed: c.windSpeed || null,
          wind_direction: c.windDir || null,
          pressure: c.pressure || null,
          sky_condition: c.skyCondition || null,
          caught_at: c.caughtAt || c.createdAt || new Date().toISOString(),
          source: c.source || 'manual',
        });

        migratedCount++;
      } catch (err) {
        console.error('[SQLite] Failed to migrate catch:', id, err);
      }
    }

    // Mark migration complete
    await Preferences.set({ key: migrationKey, value: 'true' });

    // Clear old localStorage (optional - keep as backup for now)
    // localStorage.removeItem('offline_catches');
    // localStorage.removeItem('bc_catches_cache');

    console.log(`[SQLite] Migration complete: ${migratedCount} catches`);

  } catch (error) {
    console.error('[SQLite] Migration error:', error);
  }

  return migratedCount;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Convert a database row to LocalCatch type
 */
function rowToCatch(row: any): LocalCatch {
  return {
    local_id: row.local_id,
    server_id: row.server_id,
    user_email: row.user_email,
    lake_id: row.lake_id,
    lake_type: row.lake_type,
    lake_name: row.lake_name,
    lake_lat: row.lake_lat,
    lake_lng: row.lake_lng,
    catch_lat: row.catch_lat,
    catch_lng: row.catch_lng,
    species: row.species,
    weight: row.weight,
    length: row.length,
    lure: row.lure,
    color: row.color,
    notes: row.notes,
    photo_local_path: row.photo_local_path,
    photo_url: row.photo_url,
    photo_pending: row.photo_pending === 1,
    temp: row.temp,
    wind_speed: row.wind_speed,
    wind_direction: row.wind_direction,
    pressure: row.pressure,
    sky_condition: row.sky_condition,
    caught_at: row.caught_at,
    source: row.source,
    created_at: row.created_at,
    updated_at: row.updated_at,
    is_synced: row.is_synced === 1,
    is_deleted: row.is_deleted === 1,
    sync_error: row.sync_error,
  };
}

/**
 * Check if SQLite is available (native platform)
 */
export function isSQLiteAvailable(): boolean {
  return Capacitor.isNativePlatform();
}
