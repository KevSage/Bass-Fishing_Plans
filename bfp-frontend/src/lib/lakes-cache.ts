// src/lib/lakes-cache.ts
/**
 * Lakes caching system for offline support.
 *
 * Strategy:
 * 1. On app load, return cached lakes immediately (fast startup)
 * 2. Fetch latest from API in background
 * 3. If newer version, update cache and notify
 * 4. If offline or API fails, use cached data
 * 5. Fallback to bundled lakes.json if no cache
 */

import { getApiBaseUrl } from "./platform";

const CACHE_KEY = "bc_lakes_cache";
const VERSION_KEY = "bc_lakes_version";

export interface LakeEntry {
  name: string;
  state: string;
  city?: string;
  latitude: number;
  longitude: number;
  acres?: number;
  tier: number;
  anchors?: { lat: number; lng: number }[];
  bbox?: [number, number, number, number];
}

interface LakesCache {
  lakes: LakeEntry[];
  version: string;
  cachedAt: number;
}

/**
 * Get cached lakes from localStorage.
 */
export function getCachedLakes(): LakeEntry[] | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const data: LakesCache = JSON.parse(cached);
    return data.lakes;
  } catch (e) {
    console.warn("[LakesCache] Failed to read cache:", e);
    return null;
  }
}

/**
 * Get cached version string.
 */
export function getCachedVersion(): string | null {
  try {
    return localStorage.getItem(VERSION_KEY);
  } catch {
    return null;
  }
}

/**
 * Save lakes to cache.
 */
function saveLakesToCache(lakes: LakeEntry[], version: string): void {
  try {
    const cache: LakesCache = {
      lakes,
      version,
      cachedAt: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    localStorage.setItem(VERSION_KEY, version);
    console.log(`[LakesCache] Saved ${lakes.length} lakes, version ${version}`);
  } catch (e) {
    console.warn("[LakesCache] Failed to save cache:", e);
  }
}

/**
 * Fetch lakes from API with version check.
 * Returns null if cached version is current (304).
 */
export async function fetchLakesFromApi(): Promise<{
  lakes: LakeEntry[];
  version: string;
  wasUpdated: boolean;
} | null> {
  const apiBase = getApiBaseUrl();
  const cachedVersion = getCachedVersion();

  try {
    const headers: Record<string, string> = {};
    if (cachedVersion) {
      headers["If-None-Match"] = `"${cachedVersion}"`;
    }

    const response = await fetch(`${apiBase}/lakes/known`, { headers });

    // 304 Not Modified - cache is current
    if (response.status === 304) {
      console.log("[LakesCache] Cache is current (304)");
      return null;
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const { lakes, version } = data;

    // Save to cache
    saveLakesToCache(lakes, version);

    return {
      lakes,
      version,
      wasUpdated: cachedVersion !== version,
    };
  } catch (e) {
    console.warn("[LakesCache] Failed to fetch from API:", e);
    return null;
  }
}

/**
 * Check if an update is available without downloading full data.
 */
export async function checkForLakesUpdate(): Promise<boolean> {
  const apiBase = getApiBaseUrl();
  const cachedVersion = getCachedVersion();

  if (!cachedVersion) return true; // No cache, need update

  try {
    const response = await fetch(`${apiBase}/lakes/known/version`);
    if (!response.ok) return false;

    const data = await response.json();
    return data.version !== cachedVersion;
  } catch {
    return false;
  }
}

/**
 * Initialize lakes data.
 * Returns cached data immediately, fetches updates in background.
 *
 * @param bundledLakes - Fallback lakes from static import
 * @param onUpdate - Callback when new lakes are fetched
 */
export async function initializeLakes(
  bundledLakes: LakeEntry[],
  onUpdate?: (lakes: LakeEntry[]) => void
): Promise<LakeEntry[]> {
  // 1. Try cache first (immediate)
  const cached = getCachedLakes();
  const initialLakes = cached || bundledLakes;

  console.log(
    `[LakesCache] Initial load: ${initialLakes.length} lakes from ${cached ? "cache" : "bundle"}`
  );

  // 2. Fetch updates in background
  fetchLakesFromApi()
    .then((result) => {
      if (result && result.wasUpdated && onUpdate) {
        console.log(
          `[LakesCache] Updated to version ${result.version} (${result.lakes.length} lakes)`
        );
        onUpdate(result.lakes);
      }
    })
    .catch((e) => {
      console.warn("[LakesCache] Background fetch failed:", e);
    });

  return initialLakes;
}

/**
 * Force refresh lakes from API.
 */
export async function refreshLakes(): Promise<LakeEntry[] | null> {
  // Clear version to force full fetch
  localStorage.removeItem(VERSION_KEY);

  const result = await fetchLakesFromApi();
  return result?.lakes || null;
}
