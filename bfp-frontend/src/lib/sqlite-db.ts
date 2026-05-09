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

// Use window to store singleton state (survives module reloads from HMR/bundling)
interface SQLiteGlobalState {
  id: string;  // Debug ID to track if same object
  db: SQLiteDBConnection | null;
  initPromise: Promise<void> | null;
  initStarted: boolean;
  sqlite: SQLiteConnection | null;
}

declare global {
  interface Window {
    __sqliteState?: SQLiteGlobalState;
  }
}

// Note: State is initialized lazily in getState() to avoid module loading issues

// Get state from window (with fallback for SSR)
function getState(): SQLiteGlobalState {
  if (typeof window !== 'undefined') {
    if (!window.__sqliteState) {
      const id = `state_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      console.log('[SQLite] Creating new window.__sqliteState with id:', id);
      window.__sqliteState = {
        id,
        db: null,
        initPromise: null,
        initStarted: false,
        sqlite: null,
      };
    }
    console.log('[SQLite] getState returning id:', window.__sqliteState.id, 'initStarted:', window.__sqliteState.initStarted);
    return window.__sqliteState;
  }
  // Fallback for SSR - will create new each time but that's ok
  console.warn('[SQLite] No window object, using ephemeral state');
  return { id: 'ephemeral', db: null, initPromise: null, initStarted: false, sqlite: null };
}

// Lazy-init SQLite connection
function getSqlite(): SQLiteConnection {
  const state = getState();
  if (!state.sqlite) {
    state.sqlite = new SQLiteConnection(CapacitorSQLite);
  }
  return state.sqlite;
}

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

export interface LocalLake {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radius_km: number;
  lake_type: 'known' | 'custom';
  user_email: string | null;  // NULL for known lakes
  city: string | null;
  state: string | null;
  updated_at: string;
  is_synced: boolean;
  bbox: [number, number, number, number] | null;  // [min_lng, min_lat, max_lng, max_lat]
}

export interface LakeResolutionResult {
  resolved: boolean;
  lake_id: string | null;
  lake_name: string | null;
  lake_type: 'known' | 'custom' | 'unresolved';
  distance_km: number | null;
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

-- Lakes table for offline lake resolution
CREATE TABLE IF NOT EXISTS lakes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  radius_km REAL DEFAULT 0.5,
  lake_type TEXT CHECK(lake_type IN ('known', 'custom')) DEFAULT 'known',
  user_email TEXT,  -- NULL for known lakes, set for user's custom lakes
  city TEXT,
  state TEXT,
  updated_at TEXT NOT NULL,
  is_synced INTEGER DEFAULT 1,
  bbox TEXT  -- JSON: [min_lng, min_lat, max_lng, max_lat] for polygon matching
);

-- Sync metadata table
CREATE TABLE IF NOT EXISTS sync_metadata (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
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
CREATE INDEX IF NOT EXISTS idx_lakes_location ON lakes(lat, lng);
CREATE INDEX IF NOT EXISTS idx_lakes_user ON lakes(user_email);
`;

/**
 * Run database migrations for schema updates
 */
async function runMigrations(database: SQLiteDBConnection): Promise<void> {
  try {
    // Migration 1: Add bbox column to lakes table if it doesn't exist
    // SQLite doesn't support ADD COLUMN IF NOT EXISTS, so we check first
    const tableInfo = await database.query("PRAGMA table_info(lakes)");
    const columns = tableInfo.values?.map((row: any) => row.name) || [];

    if (!columns.includes('bbox')) {
      console.log('[SQLite] Running migration: Adding bbox column to lakes');
      await database.execute('ALTER TABLE lakes ADD COLUMN bbox TEXT');
      // Clear last sync timestamp to force re-sync of all lakes with bbox data
      await database.run("DELETE FROM sync_metadata WHERE key = 'last_lake_sync_at'");
      console.log('[SQLite] Migration complete: bbox column added, will re-sync lakes');
    }
  } catch (error) {
    console.warn('[SQLite] Migration warning:', error);
    // Non-fatal - migrations are best-effort
  }
}

/**
 * Helper: Promise with timeout
 */
function withTimeout<T>(promise: Promise<T>, ms: number, operation: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`[SQLite] ${operation} timed out after ${ms}ms`));
    }, ms);

    promise
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

/**
 * Initialize the SQLite database
 * Note: We skip isConnection/isDatabase checks as they hang on some iOS versions.
 * Instead, we just try to create/open directly and handle errors.
 */
export async function initDatabase(): Promise<void> {
  const state = getState();
  const sqlite = getSqlite();

  if (!Capacitor.isNativePlatform()) {
    console.log('[SQLite] Not on native platform, skipping init');
    return;
  }

  // If already initialized, skip
  if (state.db) {
    console.log('[SQLite] Already initialized, skipping');
    return;
  }

  console.log('[SQLite] initDatabase() starting...');
  const startTime = Date.now();

  try {
    // Step 1: Create connection directly (skip isConnection/isDatabase checks - they can hang)
    console.log('[SQLite] Step 1: Creating connection...');

    // Wrap in explicit promise to catch any sync errors
    let connectionPromise: Promise<SQLiteDBConnection>;
    try {
      connectionPromise = sqlite.createConnection(
        DB_NAME,
        false,      // encrypted
        'no-encryption',
        DB_VERSION,
        false       // readonly
      );
      console.log('[SQLite] Step 1a: createConnection() called, promise created');
    } catch (syncErr) {
      console.error('[SQLite] Step 1a SYNC ERROR:', syncErr);
      throw syncErr;
    }

    try {
      state.db = await withTimeout(connectionPromise, 10000, 'createConnection');
      console.log(`[SQLite] Step 1b done: Connection object received (${Date.now() - startTime}ms)`, state.db ? 'valid' : 'NULL');
    } catch (createErr: any) {
      console.error('[SQLite] Step 1b ERROR:', createErr?.message || createErr);
      // If connection already exists, try to retrieve it
      if (createErr?.message?.includes('already exists') || createErr?.message?.includes('Connection')) {
        console.log('[SQLite] Connection may already exist, trying to retrieve...');
        try {
          state.db = await withTimeout(
            sqlite.retrieveConnection(DB_NAME, false),
            5000,
            'retrieveConnection'
          );
          console.log(`[SQLite] Retrieved existing connection (${Date.now() - startTime}ms)`);
        } catch (retrieveErr) {
          console.error('[SQLite] Failed to retrieve connection:', retrieveErr);
          throw createErr; // Throw original error
        }
      } else {
        throw createErr;
      }
    }

    if (!state.db) {
      console.error('[SQLite] db is null/undefined after createConnection');
      throw new Error('Failed to create database connection - db is null');
    }

    console.log('[SQLite] Step 1 complete: db object type =', typeof state.db);

    // Step 2: Open database
    console.log('[SQLite] Step 2: Opening database...');
    try {
      await withTimeout(state.db.open(), 10000, 'open');
      console.log(`[SQLite] Step 2 done: Database opened (${Date.now() - startTime}ms)`);
    } catch (openErr: any) {
      // Database might already be open
      if (openErr?.message?.includes('already open')) {
        console.log('[SQLite] Database already open, continuing...');
      } else {
        throw openErr;
      }
    }

    // Step 3: Execute schema
    console.log('[SQLite] Step 3: Executing schema...');
    await withTimeout(state.db.execute(SCHEMA), 10000, 'execute schema');
    console.log(`[SQLite] Step 3 done: Schema created/verified (${Date.now() - startTime}ms)`);

    // Step 4: Run migrations
    console.log('[SQLite] Step 4: Running migrations...');
    await runMigrations(state.db);
    console.log(`[SQLite] Step 4 done: Migrations complete (${Date.now() - startTime}ms)`);

    // Mark as initialized
    await Preferences.set({ key: 'sqlite_initialized', value: 'true' });
    console.log(`[SQLite] initDatabase() complete! Total time: ${Date.now() - startTime}ms`);

  } catch (error) {
    console.error(`[SQLite] Init error after ${Date.now() - startTime}ms:`, error);
    // Reset db on failure so next attempt starts fresh
    state.db = null;
    throw error;
  }
}

/**
 * Get database connection (initializes if needed)
 */
export async function getDb(): Promise<SQLiteDBConnection> {
  const state = getState();
  console.log(`[SQLite] getDb called: db=${!!state.db}, initStarted=${state.initStarted}, initPromise=${!!state.initPromise}`);

  if (!Capacitor.isNativePlatform()) {
    console.error('[SQLite] getDb called on non-native platform');
    throw new Error('SQLite only available on native platforms');
  }

  // If already have a valid connection, return it
  if (state.db) {
    console.log('[SQLite] getDb: returning existing db');
    return state.db;
  }

  // If initialization is already in progress, wait for it with timeout
  if (state.initPromise) {
    console.log('[SQLite] getDb: Init already in progress, waiting for initPromise...');
    try {
      await Promise.race([
        state.initPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('getDb wait timeout')), 15000))
      ]);
    } catch (e) {
      console.warn('[SQLite] getDb: Wait for init failed:', e);
    }
    if (state.db) {
      console.log('[SQLite] getDb: db available after waiting');
      return state.db;
    }
    // If we were waiting and still no db, throw (don't start another init)
    console.error('[SQLite] getDb: Init was in progress but still no db');
    throw new Error('Database initialization in progress but failed');
  }

  // Prevent race conditions - if init started but no promise, wait a bit
  if (state.initStarted && !state.db) {
    console.log('[SQLite] getDb: Init started but not complete (no promise), waiting...');
    for (let i = 0; i < 50; i++) {  // Wait up to 5 seconds
      await new Promise(resolve => setTimeout(resolve, 100));
      if (state.db) {
        console.log('[SQLite] getDb: db became available after waiting');
        return state.db;
      }
      if (state.initPromise) {
        // Promise appeared, wait for it
        console.log('[SQLite] getDb: initPromise appeared, waiting for it');
        try {
          await state.initPromise;
        } catch (e) {
          console.warn('[SQLite] getDb: initPromise failed:', e);
        }
        if (state.db) return state.db;
      }
      if (!state.initStarted) break;  // Init failed, try again
    }
    if (state.initStarted && !state.db) {
      console.error('[SQLite] getDb: Init still in progress after 5s, throwing');
      throw new Error('Database initialization timeout');
    }
  }

  // Start initialization with mutex
  console.log('[SQLite] getDb: Starting new initialization...');
  state.initStarted = true;
  state.initPromise = initDatabase();
  console.log('[SQLite] getDb: initPromise created, awaiting...');

  try {
    console.log('[SQLite] getDb: About to await initPromise');
    await state.initPromise;
    console.log('[SQLite] getDb: initPromise resolved successfully');
  } catch (initError: any) {
    console.error('[SQLite] getDb: initDatabase FAILED:', initError?.message || initError);
    console.error('[SQLite] getDb: Full error:', JSON.stringify(initError, Object.getOwnPropertyNames(initError)));
    state.initStarted = false;
    state.initPromise = null;
    throw initError;
  }

  state.initPromise = null;  // Clear promise but keep initStarted true

  if (!state.db) {
    console.error('[SQLite] getDb: db is still null after init');
    state.initStarted = false;
    throw new Error('Failed to initialize database');
  }

  console.log('[SQLite] getDb: initialization complete, returning db');
  return state.db;
}

/**
 * Close the database connection
 */
export async function closeDatabase(): Promise<void> {
  const state = getState();
  if (state.db) {
    try {
      const sqlite = getSqlite();
      await sqlite.closeConnection(DB_NAME, false);
    } catch (e) {
      console.warn('[SQLite] Error closing connection:', e);
    }
    state.db = null;
    state.initStarted = false;
    state.initPromise = null;
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
  console.log('[SQLite] createLocalCatch called');
  try {
    const database = await getDb();
    console.log('[SQLite] createLocalCatch: got database connection');
    const now = new Date().toISOString();
    const localId = generateLocalId();

  const newCatch: LocalCatch = {
    ...catchData,
    local_id: localId,
    // Preserve server_id if provided (for catches downloaded from server)
    server_id: catchData.server_id || null,
    created_at: now,
    updated_at: now,
    // If server_id is provided, it's already synced
    is_synced: !!catchData.server_id,
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

  // Only add to sync queue if this is a new local catch (no server_id)
  // Catches downloaded from server already have server_id and don't need to sync up
  if (!newCatch.server_id) {
    await addToSyncQueue(localId, 'create');
  }

  console.log('[SQLite] Created catch:', localId, newCatch.server_id ? '(from server)' : '(local)');
  return newCatch;

  } catch (error) {
    console.error('[SQLite] createLocalCatch ERROR:', error);
    throw error;
  }
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

// =============================================================================
// LAKE OPERATIONS
// =============================================================================

/**
 * Convert database row to LocalLake
 */
function rowToLake(row: any): LocalLake {
  let bbox: [number, number, number, number] | null = null;
  if (row.bbox) {
    try {
      bbox = JSON.parse(row.bbox);
    } catch (e) {
      // Invalid bbox JSON, ignore
    }
  }
  return {
    id: row.id,
    name: row.name,
    lat: row.lat,
    lng: row.lng,
    radius_km: row.radius_km || 0.5,
    lake_type: row.lake_type,
    user_email: row.user_email,
    city: row.city,
    state: row.state,
    updated_at: row.updated_at,
    is_synced: row.is_synced === 1,
    bbox,
  };
}

/**
 * Upsert a lake (insert or update)
 */
export async function upsertLake(lake: LocalLake): Promise<void> {
  const database = await getDb();

  const sql = `
    INSERT INTO lakes (id, name, lat, lng, radius_km, lake_type, user_email, city, state, updated_at, is_synced, bbox)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      lat = excluded.lat,
      lng = excluded.lng,
      radius_km = excluded.radius_km,
      lake_type = excluded.lake_type,
      user_email = excluded.user_email,
      city = excluded.city,
      state = excluded.state,
      updated_at = excluded.updated_at,
      is_synced = excluded.is_synced,
      bbox = excluded.bbox
  `;

  await database.run(sql, [
    lake.id,
    lake.name,
    lake.lat,
    lake.lng,
    lake.radius_km,
    lake.lake_type,
    lake.user_email,
    lake.city,
    lake.state,
    lake.updated_at,
    lake.is_synced ? 1 : 0,
    lake.bbox ? JSON.stringify(lake.bbox) : null,
  ]);
}

/**
 * Bulk upsert lakes (for sync)
 */
export async function upsertLakes(lakes: LocalLake[]): Promise<void> {
  for (const lake of lakes) {
    await upsertLake(lake);
  }
  console.log(`[SQLite] Upserted ${lakes.length} lakes`);
}

/**
 * Get all lakes
 */
export async function getAllLakes(): Promise<LocalLake[]> {
  const database = await getDb();
  const result = await database.query('SELECT * FROM lakes ORDER BY name');
  if (!result.values) return [];
  return result.values.map(rowToLake);
}

/**
 * Get lakes for a user (known + user's custom lakes)
 */
export async function getLakesForUser(userEmail: string): Promise<LocalLake[]> {
  const database = await getDb();
  const result = await database.query(
    `SELECT * FROM lakes
     WHERE lake_type = 'known' OR user_email = ?
     ORDER BY name`,
    [userEmail.toLowerCase()]
  );
  if (!result.values) return [];
  return result.values.map(rowToLake);
}

/**
 * Resolve lake from GPS coordinates (local query)
 * Matching priority (same as backend):
 * 1. Inside bbox (with buffer for bank anglers)
 * 2. Within radius_km of lake center
 */
export async function resolveLakeLocal(
  lat: number,
  lng: number,
  userEmail?: string,
  radiusKm: number = 1.0
): Promise<LakeResolutionResult> {
  try {
    console.log(`[SQLite] resolveLakeLocal called: (${lat.toFixed(4)}, ${lng.toFixed(4)})`);

    const database = await getDb();
    console.log('[SQLite] Database connection obtained');

    // Debug: Check how many lakes we have
    const countResult = await database.query("SELECT COUNT(*) as count FROM lakes");
    const lakeCount = countResult.values?.[0]?.count || 0;
    console.log(`[SQLite] ${lakeCount} lakes in database`);

    if (lakeCount === 0) {
      console.log('[SQLite] No lakes in database - sync may have failed');
      return {
        resolved: false,
        lake_id: null,
        lake_name: null,
        lake_type: 'unresolved',
        distance_km: null,
      };
    }

  // Buffer for bank anglers (~0.5km in degrees)
  const BANK_BUFFER_DEG = 0.005;

  // Helper: Check if point is inside bbox with bank buffer
  const pointInBboxWithBuffer = (bbox: [number, number, number, number]): boolean => {
    const [minLng, minLat, maxLng, maxLat] = bbox;
    return (
      lat >= (minLat - BANK_BUFFER_DEG) && lat <= (maxLat + BANK_BUFFER_DEG) &&
      lng >= (minLng - BANK_BUFFER_DEG) && lng <= (maxLng + BANK_BUFFER_DEG)
    );
  };

  // Helper: Calculate Haversine distance in km
  const haversine = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const toRad = (x: number) => x * Math.PI / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat/2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng/2) ** 2;
    return 2 * 6371 * Math.asin(Math.sqrt(a));
  };

  // Get all lakes (known + user's custom)
  const sql = `
    SELECT * FROM lakes
    WHERE lake_type = 'known' OR user_email = ?
  `;
  const result = await database.query(sql, [userEmail?.toLowerCase() || '']);

  if (!result.values || result.values.length === 0) {
    return {
      resolved: false,
      lake_id: null,
      lake_name: null,
      lake_type: 'unresolved',
      distance_km: null,
    };
  }

  // PASS 1: Check bbox matches (most accurate for large/irregular lakes)
  for (const row of result.values) {
    if (row.bbox) {
      try {
        const bbox = JSON.parse(row.bbox) as [number, number, number, number];
        if (pointInBboxWithBuffer(bbox)) {
          const dist = haversine(lat, lng, row.lat, row.lng);
          console.log(`[SQLite] BBOX MATCH: "${row.name}" (${row.lake_type}), dist=${dist.toFixed(3)}km`);
          return {
            resolved: true,
            lake_id: row.id,
            lake_name: row.name,
            lake_type: row.lake_type,
            distance_km: dist,
          };
        }
      } catch (e) {
        // Invalid bbox JSON, skip
      }
    }
  }

  // PASS 2: Center-point distance for lakes without bbox or edge cases
  let nearestLake: any = null;
  let nearestDist = Infinity;

  for (const row of result.values) {
    const dist = haversine(lat, lng, row.lat, row.lng);
    if (dist <= radiusKm && dist < nearestDist) {
      nearestLake = row;
      nearestDist = dist;
    }
  }

  if (nearestLake) {
    console.log(`[SQLite] CENTER MATCH: "${nearestLake.name}" at ${nearestDist.toFixed(3)}km`);
    return {
      resolved: true,
      lake_id: nearestLake.id,
      lake_name: nearestLake.name,
      lake_type: nearestLake.lake_type,
      distance_km: nearestDist,
    };
  }

  console.log(`[SQLite] No lake found within ${radiusKm}km`);
  return {
    resolved: false,
    lake_id: null,
    lake_name: null,
    lake_type: 'unresolved',
    distance_km: null,
  };

  } catch (error: any) {
    console.error('[SQLite] resolveLakeLocal ERROR:', error?.message || error);
    console.error('[SQLite] resolveLakeLocal Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error || {})));
    // Return unresolved on error - caller will fall back to API
    return {
      resolved: false,
      lake_id: null,
      lake_name: null,
      lake_type: 'unresolved',
      distance_km: null,
    };
  }
}

/**
 * Create a custom lake (saves locally, queues for sync)
 */
export async function createCustomLake(
  name: string,
  lat: number,
  lng: number,
  userEmail: string,
  city?: string,
  state?: string,
): Promise<LocalLake> {
  const now = new Date().toISOString();
  const localId = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const lake: LocalLake = {
    id: localId,
    name,
    lat,
    lng,
    radius_km: 0.5,
    lake_type: 'custom',
    user_email: userEmail.toLowerCase(),
    city: city || null,
    state: state || null,
    updated_at: now,
    is_synced: false,
    bbox: null,  // Custom lakes don't have bbox
  };

  await upsertLake(lake);
  await addToSyncQueue(localId, 'create', { entity: 'lake' });

  console.log('[SQLite] Created custom lake:', localId, name);
  return lake;
}

/**
 * Get lake count (for debugging/stats)
 */
export async function getLakeCount(): Promise<{ known: number; custom: number }> {
  const database = await getDb();

  const knownResult = await database.query(
    "SELECT COUNT(*) as count FROM lakes WHERE lake_type = 'known'"
  );
  const customResult = await database.query(
    "SELECT COUNT(*) as count FROM lakes WHERE lake_type = 'custom'"
  );

  return {
    known: knownResult.values?.[0]?.count || 0,
    custom: customResult.values?.[0]?.count || 0,
  };
}

// =============================================================================
// SYNC METADATA OPERATIONS
// =============================================================================

/**
 * Get sync metadata value
 */
export async function getSyncMetadata(key: string): Promise<string | null> {
  const database = await getDb();
  const result = await database.query(
    'SELECT value FROM sync_metadata WHERE key = ?',
    [key]
  );
  return result.values?.[0]?.value || null;
}

/**
 * Set sync metadata value
 */
export async function setSyncMetadata(key: string, value: string): Promise<void> {
  const database = await getDb();
  await database.run(
    `INSERT INTO sync_metadata (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [key, value]
  );
}
