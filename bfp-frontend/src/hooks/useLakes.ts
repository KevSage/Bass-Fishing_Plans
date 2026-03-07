// src/hooks/useLakes.ts
/**
 * React hook for accessing lakes data with offline support.
 *
 * Usage:
 *   const { lakes, isLoading, refresh } = useLakes();
 */

import { useState, useEffect, useCallback } from "react";
import {
  LakeEntry,
  getCachedLakes,
  initializeLakes,
  refreshLakes,
} from "@/lib/lakes-cache";

// Import bundled lakes as fallback
import bundledLakesRaw from "@/data/lakes.json";

const bundledLakes = bundledLakesRaw as LakeEntry[];

interface UseLakesResult {
  lakes: LakeEntry[];
  isLoading: boolean;
  isUpdating: boolean;
  lastUpdated: Date | null;
  refresh: () => Promise<void>;
}

// Global state to share across components
let globalLakes: LakeEntry[] | null = null;
let globalInitPromise: Promise<LakeEntry[]> | null = null;
const listeners = new Set<(lakes: LakeEntry[]) => void>();

function notifyListeners(lakes: LakeEntry[]) {
  globalLakes = lakes;
  listeners.forEach((fn) => fn(lakes));
}

/**
 * Initialize lakes once (shared across all hook instances).
 */
function getInitPromise(): Promise<LakeEntry[]> {
  if (globalInitPromise) return globalInitPromise;

  globalInitPromise = initializeLakes(bundledLakes, (updatedLakes) => {
    notifyListeners(updatedLakes);
  });

  return globalInitPromise;
}

export function useLakes(): UseLakesResult {
  const [lakes, setLakes] = useState<LakeEntry[]>(() => {
    // Start with cached or bundled
    return globalLakes || getCachedLakes() || bundledLakes;
  });
  const [isLoading, setIsLoading] = useState(!globalLakes);
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    // Subscribe to updates
    const handleUpdate = (newLakes: LakeEntry[]) => {
      setLakes(newLakes);
      setLastUpdated(new Date());
    };
    listeners.add(handleUpdate);

    // Initialize if needed
    if (!globalLakes) {
      setIsLoading(true);
      getInitPromise().then((initialLakes) => {
        setLakes(initialLakes);
        setIsLoading(false);
        globalLakes = initialLakes;
      });
    }

    return () => {
      listeners.delete(handleUpdate);
    };
  }, []);

  const refresh = useCallback(async () => {
    setIsUpdating(true);
    try {
      const newLakes = await refreshLakes();
      if (newLakes) {
        notifyListeners(newLakes);
        setLastUpdated(new Date());
      }
    } finally {
      setIsUpdating(false);
    }
  }, []);

  return {
    lakes,
    isLoading,
    isUpdating,
    lastUpdated,
    refresh,
  };
}

/**
 * Get lakes synchronously (for non-React code).
 * Returns cached/bundled lakes immediately.
 */
export function getLakesSync(): LakeEntry[] {
  return globalLakes || getCachedLakes() || bundledLakes;
}

/**
 * Find a lake by ID or name.
 */
export function findLakeById(id: string): LakeEntry | undefined {
  const lakes = getLakesSync();
  return lakes.find(
    (lake) =>
      lake.name === id ||
      `${lake.name.toLowerCase().replace(/\s+/g, "-")}-${lake.state.toLowerCase()}` === id
  );
}

/**
 * Search lakes by name.
 */
export function searchLakes(query: string, limit = 10): LakeEntry[] {
  if (!query || query.length < 2) return [];

  const lakes = getLakesSync();
  const lowerQuery = query.toLowerCase();

  return lakes
    .filter((lake) => lake.name.toLowerCase().includes(lowerQuery))
    .slice(0, limit);
}
