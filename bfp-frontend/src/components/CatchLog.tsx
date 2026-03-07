// src/components/CatchLog.tsx

import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from "react";
import mapboxgl from "mapbox-gl";
import {
  FishIcon,
  BackIcon,
  EditIcon,
  TrashIcon,
  LocationIcon,
  CameraIcon,
  CloseIcon,
  TrophyIcon,
  MapPinIcon,
  ThermometerIcon,
  WindIcon,
  ActivityIcon,
  CloudIcon,
  SunIcon,
  DropletsIcon,
  MoreVerticalIcon,
} from "@/components/UnifiedIcons";

// API and EXIF imports
import { usePlatformAuth } from "@/hooks/usePlatformAuth";
import { useNativeAuth } from "@/context/NativeAuthContext";
import { isNativePlatform } from "@/lib/platform";
import {
  createCatch,
  createCatchMobile,
  listCatches,
  listCatchesMobile,
  deleteCatch as deleteCatchApi,
  deleteCatchMobile,
  updateCatch as updateCatchApi,
  updateCatchMobile,
  resolveLake,
  resolveLakeMobile,
  type CatchRecord,
  type CreateCatchInput,
  getPresignedUrl,
  getPresignedUrlMobile,
  uploadFileToR2,
} from "@/lib/catches-api";
import {
  extractExifData,
  formatDateForApi,
  formatTimeForApi,
} from "@/lib/exif-utils";
// IMPORT COMPRESSION UTILITY
import { compressImage } from "@/lib/image-utils";
// IMPORT CAPACITOR CAMERA FOR NATIVE iOS/Android
import {
  capturePhoto,
  type CapturedPhoto,
} from "@/lib/capacitor-camera";
import { Keyboard } from "@capacitor/keyboard";
import { getApiBaseUrl } from "@/lib/platform";
// IMPORT LOCATION SEARCH FOR LAKE AUTOCOMPLETE
import { LocationSearch } from "@/components/LocationSearch";
// IMPORT MEMBER STATUS FOR PRO CHECK
import { useMemberStatus } from "@/hooks/useMemberStatus";
// IMPORT FORM DRAFT UTILITIES
import { saveCatchFormDraft, loadCatchFormDraft, loadCatchFormDraftAsync, clearCatchFormDraft } from "@/lib/form-draft";
// IMPORT NAVIGATION
import { useNavigate, useLocation } from "react-router-dom";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

// =============================================================================
// ICONS (Offline & Sync)
// =============================================================================
const CloudOffIcon = ({
  size = 16,
  className = "",
}: {
  size?: number;
  className?: string;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M22.61 16.95A5 5 0 0 0 18 10h-1.26a8 8 0 0 0-7.05-6M5 5a8 8 0 0 0 4 7h1.8" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);
const RefreshIcon = ({
  size = 16,
  className = "",
}: {
  size?: number;
  className?: string;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M23 4v6h-6" />
    <path d="M1 20v-6h6" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

// =============================================================================
// TYPES
// =============================================================================
export type BassSpecies = "largemouth" | "smallmouth" | "spotted";

export type CatchEntry = {
  id: string;
  lakeId: string | null;
  lakeType: "known" | "custom" | "unresolved";
  lakeName: string;
  lakeLat: number;
  lakeLng: number;
  catchLat: number;
  catchLng: number;
  city?: string;
  state?: string;
  lure: string;
  color?: string;
  species?: BassSpecies;
  weight?: number;
  length?: number;
  notes?: string;
  photoUrl?: string;
  imageData?: string;
  pendingPhotoBase64?: string; // Base64 photo data waiting to be uploaded when back online
  caughtAt: string;
  createdAt: string;
  source: "camera" | "library" | "manual" | "demo";
  isOffline?: boolean;

  // Weather Fields
  temp?: number;
  windSpeed?: number;
  windDir?: string;
  pressure?: number;
  skyCondition?: string;
};

export type ActiveLake = {
  id?: string;
  name: string;
  lat: number;
  lng: number;
} | null;

type ModalView = "list" | "detail" | "form";

type CatchLogState = {
  isOpen: boolean;
  view: ModalView;
  entries: CatchEntry[];
  selectedEntry: CatchEntry | null;
  isEditing: boolean;
  visibleCount: number;
};

// =============================================================================
// API CONVERTERS
// =============================================================================
export function apiRecordToEntry(record: CatchRecord): CatchEntry {
  // Debug: Log location from API
  console.log("[CatchLog] apiRecordToEntry:", {
    id: record.id,
    lat: record.lat,
    lng: record.lng,
    lakeName: record.lake_name,
  });

  return {
    id: record.id,
    lakeId: record.lake_id,
    lakeType: record.lake_type,
    lakeName: record.lake_name || "Unknown Water",
    lakeLat: record.lat,
    lakeLng: record.lng,
    catchLat: record.lat,
    catchLng: record.lng,
    city: record.city || undefined,
    state: record.state || undefined,
    lure: record.lure || "",
    color: record.color || undefined,
    species: (record.species as BassSpecies) || undefined,
    weight: record.weight || undefined,
    length: record.length || undefined,
    temp: record.temp,
    windSpeed: record.wind_speed,
    windDir: record.wind_direction,
    pressure: record.pressure,
    skyCondition: record.sky_condition,
    notes: record.notes || undefined,
    photoUrl: record.photo_url || undefined,
    caughtAt: (() => {
      const timeStr = record.time || "12:00:00";
      const fullTime = timeStr.length === 5 ? `${timeStr}:00` : timeStr;
      return `${record.date}T${fullTime}`;
    })(),
    createdAt: record.created_at,
    source: record.source,
    isOffline: false,

    // Map Weather (if backend supports it in future)
    // temp: record.temp,
    // windSpeed: record.wind_speed,
    // etc...
  };
}

function entryToApiInput(
  entry: Partial<CatchEntry>,
  activeLake: ActiveLake,
): CreateCatchInput {
  const caughtAt = entry.caughtAt ? new Date(entry.caughtAt) : new Date();

  return {
    date: formatDateForApi(caughtAt),
    time: formatTimeForApi(caughtAt),
    species: entry.species || "largemouth",
    lat: entry.catchLat || activeLake?.lat || 0,
    lng: entry.catchLng || activeLake?.lng || 0,
    weight: entry.weight,
    length: entry.length,
    lure: entry.lure,
    color: entry.color,
    notes: entry.notes,
    photo_url: entry.photoUrl || entry.imageData,
    lake_id: entry.lakeId || undefined,
    lake_type: entry.lakeType || "unresolved",
    lake_name: entry.lakeName || activeLake?.name,
    city: entry.city,
    state: entry.state,
    source: entry.source || "manual",

    // ✅ NEW: Pass Weather Data
    // We map frontend "camelCase" to backend "snake_case"
    temp: entry.temp,
    wind_speed: entry.windSpeed,
    wind_direction: entry.windDir,
    pressure: entry.pressure,
    sky_condition: entry.skyCondition,
  };
}

// =============================================================================
// WEATHER FETCHER (Current & Historical)
// =============================================================================
async function fetchWeatherForLocation(
  lat: number,
  lng: number,
  timestamp: string,
) {
  const apiBase = getApiBaseUrl();
  if (!apiBase) return null;

  try {
    const cleanLat = Number(lat).toFixed(4);
    const cleanLng = Number(lng).toFixed(4);

    // Check if timestamp is more than 1 hour in the past
    const catchTime = new Date(timestamp).getTime();
    const now = Date.now();
    const oneHourMs = 60 * 60 * 1000;
    const isHistorical = (now - catchTime) > oneHourMs;

    let url: string;
    if (isHistorical) {
      // Use historical weather endpoint
      const unixTimestamp = Math.floor(catchTime / 1000);
      url = `${apiBase}/weather/history?lat=${cleanLat}&lon=${cleanLng}&dt=${unixTimestamp}`;
      console.log('[Weather] Fetching historical weather for:', new Date(catchTime).toISOString());
    } else {
      // Use current weather endpoint
      url = `${apiBase}/weather/current?lat=${cleanLat}&lon=${cleanLng}`;
      console.log('[Weather] Fetching current weather');
    }

    const res = await fetch(url);
    if (!res.ok) {
      console.warn('[Weather] API returned:', res.status);
      // Fall back to current weather if historical fails
      if (isHistorical) {
        console.log('[Weather] Falling back to current weather');
        const fallbackUrl = `${apiBase}/weather/current?lat=${cleanLat}&lon=${cleanLng}`;
        const fallbackRes = await fetch(fallbackUrl);
        if (!fallbackRes.ok) return null;
        const fallbackJson = await fallbackRes.json();
        return {
          temp: fallbackJson.temp_f,
          windSpeed: fallbackJson.wind_mph,
          windDir: fallbackJson.wind_direction,
          pressure: fallbackJson.pressure_mb,
          skyCondition: fallbackJson.sky_condition,
        };
      }
      return null;
    }

    const json = await res.json();
    return {
      temp: json.temp_f,
      windSpeed: json.wind_mph,
      windDir: json.wind_direction,
      pressure: json.pressure_mb,
      skyCondition: json.sky_condition,
    };
  } catch (err) {
    console.error("Weather fetch failed:", err);
    return null;
  }
}

// =============================================================================
// CONSTANTS (Lure & Density Configs)
// =============================================================================
export const LURE_OPTIONS = [
  {
    category: "Horizontal Reaction",
    value: "shallow crankbait",
    label: "Shallow Crankbait",
  },
  {
    category: "Horizontal Reaction",
    value: "mid crankbait",
    label: "Mid Crankbait",
  },
  {
    category: "Horizontal Reaction",
    value: "deep crankbait",
    label: "Deep Crankbait",
  },
  {
    category: "Horizontal Reaction",
    value: "lipless crankbait",
    label: "Lipless Crankbait",
  },
  {
    category: "Horizontal Reaction",
    value: "flat-sided crankbait",
    label: "Flat-sided Crankbait",
  },
  {
    category: "Horizontal Reaction",
    value: "chatterbait",
    label: "Chatterbait",
  },
  { category: "Horizontal Reaction", value: "swim jig", label: "Swim Jig" },
  {
    category: "Horizontal Reaction",
    value: "spinnerbait",
    label: "Spinnerbait",
  },
  { category: "Horizontal Reaction", value: "underspin", label: "Underspin" },
  {
    category: "Horizontal Reaction",
    value: "paddle tail swimbait",
    label: "Paddle Tail Swimbait",
  },
  { category: "Vertical Reaction", value: "jerkbait", label: "Jerkbait" },
  { category: "Vertical Reaction", value: "blade bait", label: "Blade Bait" },
  {
    category: "Vertical Reaction",
    value: "jighead minnow",
    label: "Jighead Minnow",
  },
  { category: "Bottom Contact", value: "texas rig", label: "Texas Rig" },
  { category: "Bottom Contact", value: "carolina rig", label: "Carolina Rig" },
  { category: "Bottom Contact", value: "football jig", label: "Football Jig" },
  { category: "Bottom Contact", value: "casting jig", label: "Casting Jig" },
  { category: "Bottom Contact", value: "shaky head", label: "Shaky Head" },
  { category: "Bottom Contact", value: "ned rig", label: "Ned Rig" },
  { category: "Finesse", value: "neko rig", label: "Neko Rig" },
  { category: "Finesse", value: "wacky rig", label: "Wacky Rig" },
  { category: "Finesse", value: "soft jerkbait", label: "Soft Jerkbait" },
  { category: "Finesse", value: "dropshot", label: "Dropshot" },
  { category: "Topwater", value: "walking bait", label: "Walking Bait" },
  { category: "Topwater", value: "buzzbait", label: "Buzzbait" },
  { category: "Topwater", value: "whopper plopper", label: "Whopper Plopper" },
  { category: "Topwater", value: "wake bait", label: "Wake Bait" },
  {
    category: "Topwater",
    value: "hollow body frog",
    label: "Hollow Body Frog",
  },
  { category: "Topwater", value: "popping frog", label: "Popping Frog" },
  { category: "Topwater", value: "popper", label: "Popper" },
];
const LURE_GROUPS = LURE_OPTIONS.reduce(
  (acc, lure) => {
    if (!acc[lure.category]) acc[lure.category] = [];
    acc[lure.category].push(lure);
    return acc;
  },
  {} as Record<string, typeof LURE_OPTIONS>,
);
const COLOR_OPTIONS = [
  { value: "black", label: "Black" },
  { value: "black/blue", label: "Black/Blue" },
  { value: "junebug", label: "Junebug" },
  { value: "green pumpkin", label: "Green Pumpkin" },
  { value: "watermelon", label: "Watermelon" },
  { value: "watermelon red", label: "Watermelon Red" },
  { value: "green", label: "Green" },
  { value: "brown", label: "Brown" },
  { value: "peanut butter & jelly", label: "Peanut Butter & Jelly" },
  { value: "white", label: "White" },
  { value: "chartreuse", label: "Chartreuse" },
  { value: "chartreuse/white", label: "Chartreuse/White" },
  { value: "sexy shad", label: "Sexy Shad" },
  { value: "shad", label: "Shad" },
  { value: "bone", label: "Bone" },
  { value: "pearl", label: "Pearl" },
  { value: "bluegill", label: "Bluegill" },
  { value: "perch", label: "Perch" },
  { value: "crawfish", label: "Crawfish" },
  { value: "red", label: "Red" },
  { value: "orange", label: "Orange" },
  { value: "firetiger", label: "Firetiger" },
  { value: "citrus shad", label: "Citrus Shad" },
  { value: "gold", label: "Gold" },
  { value: "chrome", label: "Chrome" },
  { value: "natural", label: "Natural" },
  { value: "smoke", label: "Smoke" },
  { value: "clear", label: "Clear" },
];
export const SPECIES_OPTIONS: { value: BassSpecies; label: string }[] = [
  { value: "largemouth", label: "Largemouth" },
  { value: "smallmouth", label: "Smallmouth" },
  { value: "spotted", label: "Spotted" },
];
const DENSITY_CONFIG = {
  sparse: { min: 1, max: 3, color: "#F59E0B", pingSpeed: 3.0, pingCount: 1, glowRadius: 6 },
  moderate: { min: 4, max: 9, color: "#F97316", pingSpeed: 2.2, pingCount: 2, glowRadius: 8 },
  hot: { min: 10, max: Infinity, color: "#E25555", pingSpeed: 1.6, pingCount: 3, glowRadius: 12 },
};
const DENSITY_RADIUS_METERS = 100;
const ENTRIES_PER_PAGE = 10;

// =============================================================================
// HELPERS
// =============================================================================

function getDistanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function getDensityTier(
  catchEntry: CatchEntry,
  allCatches: CatchEntry[],
): keyof typeof DENSITY_CONFIG {
  const nearbyCount = allCatches.filter((c) => {
    if (c.id === catchEntry.id) return false;
    const dist = getDistanceMeters(
      catchEntry.catchLat,
      catchEntry.catchLng,
      c.catchLat,
      c.catchLng,
    );
    return dist <= DENSITY_RADIUS_METERS;
  }).length;
  const total = nearbyCount + 1;
  if (total >= DENSITY_CONFIG.hot.min) return "hot";
  if (total >= DENSITY_CONFIG.moderate.min) return "moderate";
  return "sparse";
}

function formatCatchDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatCatchTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatCatchDateTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatCoord(lat: number, lng: number): string {
  const latDir = lat >= 0 ? "N" : "S";
  const lngDir = lng >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(4)}°${latDir}, ${Math.abs(lng).toFixed(4)}°${lngDir}`;
}

function formatLureName(value: string): string {
  return value
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function isPersonalBest(entry: CatchEntry, allEntries: CatchEntry[]): boolean {
  if (!entry.weight) return false;
  const species = entry.species || "largemouth";
  const otherCatches = allEntries.filter(
    (c) =>
      c.id !== entry.id && (c.species || "largemouth") === species && c.weight,
  );
  if (otherCatches.length === 0) return true;
  const maxWeight = Math.max(...otherCatches.map((c) => Number(c.weight)));
  return Number(entry.weight) > maxWeight;
}

function getSpeciesLabel(species?: BassSpecies): string {
  if (!species) return "Largemouth";
  return (
    SPECIES_OPTIONS.find((s) => s.value === species)?.label || "Largemouth"
  );
}

// =============================================================================
// GLOBAL CACHE (The Fix for Stale/Slow Data)
// =============================================================================
let globalEntriesCache: CatchEntry[] | null = null;
const API_CACHE_KEY = "bc_api_catches_cache";
const LAST_CATCH_DEFAULTS_KEY = "bc_last_catch_defaults";

// Store last used lure/color/species for auto-population
type LastCatchDefaults = {
  lure?: string;
  color?: string;
  species?: BassSpecies;
  timestamp: number;
};

function saveLastCatchDefaults(lure: string, color: string, species: BassSpecies) {
  const defaults: LastCatchDefaults = {
    lure: lure || undefined,
    color: color || undefined,
    species,
    timestamp: Date.now(),
  };
  localStorage.setItem(LAST_CATCH_DEFAULTS_KEY, JSON.stringify(defaults));
}

function loadLastCatchDefaults(): LastCatchDefaults | null {
  try {
    const stored = localStorage.getItem(LAST_CATCH_DEFAULTS_KEY);
    if (!stored) return null;
    const defaults: LastCatchDefaults = JSON.parse(stored);
    // Only use if within 24 hours
    const twentyFourHours = 24 * 60 * 60 * 1000;
    if (Date.now() - defaults.timestamp > twentyFourHours) {
      return null;
    }
    return defaults;
  } catch {
    return null;
  }
}

// Global callback for when entries are updated (helps with race conditions)
let globalEntriesUpdateCallback: (() => void) | null = null;

export function onEntriesUpdate(callback: () => void): () => void {
  globalEntriesUpdateCallback = callback;
  return () => { globalEntriesUpdateCallback = null; };
}

// Direct access to global cache - bypasses React state for marker rendering
export function getGlobalEntries(): CatchEntry[] {
  return globalEntriesCache || [];
}

// =============================================================================
// CUSTOM HOOK: useCatchLog
// =============================================================================
export function useCatchLog(
  activeLake: ActiveLake,
  options?: { disableListView?: boolean },
) {
  const { getToken, isSignedIn } = usePlatformAuth();
  // Get native auth credentials for mobile endpoints
  const nativeAuth = useNativeAuth();
  const OFFLINE_KEY = "offline_catches";

  const [state, setState] = useState<CatchLogState>(() => {
    // Load from globalEntriesCache if available (preserves data across component remounts)
    // Otherwise load from localStorage
    if (globalEntriesCache && globalEntriesCache.length > 0) {
      console.log('[CatchLog] INIT - source: globalEntriesCache, entries:', globalEntriesCache.length);
      return {
        isOpen: false,
        view: "list",
        entries: globalEntriesCache,
        selectedEntry: null,
        isEditing: false,
        visibleCount: ENTRIES_PER_PAGE,
      };
    }

    // No cache - load from localStorage
    const cached = localStorage.getItem(API_CACHE_KEY);
    const offline = localStorage.getItem(OFFLINE_KEY);
    const cachedEntries: CatchEntry[] = cached ? JSON.parse(cached) : [];
    const offlineEntries: CatchEntry[] = offline ? JSON.parse(offline) : [];

    // Merge offline + cached, keeping offline entries that aren't already in cache
    const offlineIds = new Set(offlineEntries.map(e => e.id));
    const uniqueCached = cachedEntries.filter(e => !offlineIds.has(e.id));
    const initialEntries = [...offlineEntries, ...uniqueCached];

    console.log('[CatchLog] INIT - source: localStorage, cached:', cachedEntries.length, 'offline:', offlineEntries.length, 'merged:', initialEntries.length);

    if (initialEntries.length > 0) globalEntriesCache = initialEntries;

    return {
      isOpen: false,
      view: "list",
      entries: initialEntries,
      selectedEntry: null,
      isEditing: false,
      visibleCount: ENTRIES_PER_PAGE,
    };
  });

  const [isLoading, setIsLoading] = useState(state.entries.length === 0);
  const [error, setError] = useState<string | null>(null);

  // Version counter to signal when entries change (helps trigger re-renders in consumers)
  const [entriesVersion, setEntriesVersion] = useState(0);

  const getOfflineCatches = useCallback((): CatchEntry[] => {
    try {
      const stored = localStorage.getItem(OFFLINE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error(e);
      return [];
    }
  }, []);

  const fetchCatches = useCallback(async () => {
    if (state.entries.length === 0) setIsLoading(true);
    setError(null);
    try {
      let apiEntries: CatchEntry[] = [];

      const isNative = isNativePlatform();
      const hasNativeAuth = !!(nativeAuth.userEmail && nativeAuth.userId);

      console.log('[CatchLog] fetchCatches - isNative:', isNative, 'hasNativeAuth:', hasNativeAuth, 'email:', nativeAuth.userEmail);

      // Use mobile endpoint on native platforms
      if (isNative && hasNativeAuth) {
        try {
          console.log('[CatchLog] Fetching via mobile endpoint...');
          const response = await listCatchesMobile(nativeAuth.userEmail!, nativeAuth.userId!, 500, 0);
          console.log('[CatchLog] Mobile response catches:', response.catches?.length);
          apiEntries = response.catches.map(apiRecordToEntry);
        } catch (apiErr) {
          console.warn("Mobile catch fetch failed:", apiErr);
        }
      } else if (!isNative) {
        // Web platform: use JWT token
        const token = await getToken();
        if (token) {
          try {
            const response = await listCatches(token, 500, 0);
            apiEntries = response.catches.map(apiRecordToEntry);
          } catch (apiErr) {
            console.warn("Background fetch failed:", apiErr);
          }
        }
      } else {
        // Native but no auth yet - skip and wait for auth
        console.log('[CatchLog] Native platform but no auth yet, skipping fetch');
        setIsLoading(false);
        return;
      }

      // Filter out offline catches that have been synced (exist on server)
      // Match by caughtAt time + lake + weight to detect duplicates
      const offline = getOfflineCatches();
      const trulyOffline = offline.filter((offlineEntry) => {
        const matchesServerEntry = apiEntries.some((apiEntry) =>
          apiEntry.caughtAt === offlineEntry.caughtAt &&
          apiEntry.lakeName === offlineEntry.lakeName &&
          apiEntry.weight === offlineEntry.weight
        );
        return !matchesServerEntry; // Keep only if NOT on server
      });

      // Update offline storage with only truly offline catches
      if (trulyOffline.length !== offline.length) {
        console.log(`[CatchLog] Cleaned ${offline.length - trulyOffline.length} synced catches from offline storage`);
        localStorage.setItem(OFFLINE_KEY, JSON.stringify(trulyOffline));
      }

      // Also preserve any local-only entries from current state that aren't in API
      // (these might be entries that were created but not yet synced)
      const apiIds = new Set(apiEntries.map(e => e.id));
      const offlineIds = new Set(trulyOffline.map(e => e.id));
      const localOnlyEntries = state.entries.filter(e =>
        !apiIds.has(e.id) && !offlineIds.has(e.id) && e.id.startsWith('offline-')
      );

      // Preserve demo catches (source: "demo") - these are for App Store screenshots
      const demoEntries = state.entries.filter(e => e.source === "demo");

      // If we found local-only entries, add them to offline storage
      if (localOnlyEntries.length > 0) {
        console.log('[CatchLog] Found', localOnlyEntries.length, 'local-only entries, preserving them');
        const updatedOffline = [...localOnlyEntries, ...trulyOffline];
        localStorage.setItem(OFFLINE_KEY, JSON.stringify(updatedOffline));
      }

      // If API fetch failed (no apiEntries) and no offline catches, preserve existing cache
      if (apiEntries.length === 0 && trulyOffline.length === 0 && localOnlyEntries.length === 0) {
        console.log('[CatchLog] Offline or API failed - preserving cached data');
        setIsLoading(false);
        return;
      }

      const mergedEntries = [...demoEntries, ...localOnlyEntries, ...trulyOffline, ...apiEntries];
      console.log('[CatchLog] FETCH COMPLETE - apiEntries:', apiEntries.length, 'trulyOffline:', trulyOffline.length, 'localOnly:', localOnlyEntries.length, 'demo:', demoEntries.length, 'merged:', mergedEntries.length);
      globalEntriesCache = mergedEntries;

      // Only update API cache if we actually got data from the API
      if (apiEntries.length > 0) {
        localStorage.setItem(API_CACHE_KEY, JSON.stringify(apiEntries));
      }

      setState((s) => {
        // Log if selectedEntry would change from this fetch
        if (s.selectedEntry) {
          const fromEntries = mergedEntries.find((e) => e.id === s.selectedEntry!.id);
          if (fromEntries) {
            console.log('[CatchLog] fetchCatches - selectedEntry vs entries:', {
              selectedLat: s.selectedEntry.catchLat,
              selectedLng: s.selectedEntry.catchLng,
              entriesLat: fromEntries.catchLat,
              entriesLng: fromEntries.catchLng,
              match: s.selectedEntry.catchLat === fromEntries.catchLat &&
                     s.selectedEntry.catchLng === fromEntries.catchLng,
            });
          }
        }
        // Keep selectedEntry unchanged - trust the optimistic update
        return { ...s, entries: mergedEntries };
      });
      setEntriesVersion((v) => {
        console.log('[CatchLog] Incrementing entriesVersion to:', v + 1);
        return v + 1;
      });
      // Notify any listeners that entries have been updated
      if (globalEntriesUpdateCallback) {
        console.log('[CatchLog] Calling globalEntriesUpdateCallback');
        setTimeout(() => globalEntriesUpdateCallback?.(), 50);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getOfflineCatches, state.entries.length, nativeAuth.userEmail, nativeAuth.userId]);

  // Track which auth credentials we've fetched for
  const lastFetchedAuthRef = useRef<string | null>(null);

  useEffect(() => {
    const isNative = isNativePlatform();
    const authKey = isNative
      ? `${nativeAuth.userEmail}:${nativeAuth.userId}`
      : isSignedIn ? "web-signed-in" : null;

    // Skip if no auth available
    if (!authKey || authKey.includes("undefined")) return;

    // Skip if we already fetched for this auth
    if (lastFetchedAuthRef.current === authKey) return;

    // Fetch and mark as fetched
    lastFetchedAuthRef.current = authKey;
    fetchCatches();
  }, [fetchCatches, isSignedIn, nativeAuth.userEmail, nativeAuth.userId]);

  const syncOfflineCatches = useCallback(async () => {
    const offline = getOfflineCatches();
    if (offline.length === 0) return;
    setIsLoading(true);

    const isNative = isNativePlatform();
    const hasNativeAuth = !!(nativeAuth.userEmail && nativeAuth.userId);

    // On native, use mobile endpoint; on web, use JWT
    if (isNative && !hasNativeAuth) {
      console.log('[CatchLog] syncOfflineCatches: No native auth, skipping');
      setIsLoading(false);
      return;
    }

    const token = isNative ? null : await getToken();
    if (!isNative && !token) {
      console.log('[CatchLog] syncOfflineCatches: No web token, skipping');
      setIsLoading(false);
      return;
    }

    const remaining: CatchEntry[] = [];
    let syncedCount = 0;
    let photosUploaded = 0;

    for (const entry of offline) {
      try {
        const input = entryToApiInput(entry, activeLake);
        input.source = entry.source || "manual";

        // Upload pending photo if present
        if (entry.pendingPhotoBase64 && !entry.photoUrl) {
          try {
            console.log('[CatchLog] Uploading pending photo for offline catch:', entry.id);
            // Convert base64 to File
            const base64Data = entry.pendingPhotoBase64.split(',')[1] || entry.pendingPhotoBase64;
            const byteCharacters = atob(base64Data);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'image/jpeg' });
            const file = new File([blob], `catch_${Date.now()}.jpeg`, { type: 'image/jpeg' });

            // Get presigned URL and upload
            let upload_url: string;
            let public_url: string;

            if (isNative && hasNativeAuth) {
              const result = await getPresignedUrlMobile(file.name, file.type, nativeAuth.userEmail!, nativeAuth.userId!);
              upload_url = result.upload_url;
              public_url = result.public_url;
            } else {
              const result = await getPresignedUrl(file.name, file.type, token!);
              upload_url = result.upload_url;
              public_url = result.public_url;
            }

            await uploadFileToR2(upload_url, file);
            console.log('[CatchLog] Pending photo uploaded:', public_url);
            input.photo_url = public_url;
            photosUploaded++;
          } catch (uploadErr) {
            console.error('[CatchLog] Failed to upload pending photo:', uploadErr);
            // Keep the catch with pendingPhotoBase64 for next sync attempt
            remaining.push(entry);
            continue;
          }
        }

        if (isNative && hasNativeAuth) {
          await createCatchMobile(input, nativeAuth.userEmail!, nativeAuth.userId!);
        } else {
          await createCatch(input, token!);
        }
        syncedCount++;
      } catch (e) {
        console.error('[CatchLog] Failed to sync catch:', e);
        remaining.push(entry);
      }
    }
    localStorage.setItem(OFFLINE_KEY, JSON.stringify(remaining));
    await fetchCatches();
    if (syncedCount > 0) {
      const photoMsg = photosUploaded > 0 ? ` (${photosUploaded} photos uploaded)` : '';
      alert(`Synced ${syncedCount} catches${photoMsg}.`);
    }
    setIsLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLake, fetchCatches, getOfflineCatches, nativeAuth.userEmail, nativeAuth.userId]);

  const lakeCatches = useMemo(() => {
    if (!activeLake) return [];
    return state.entries
      .filter(
        (c) =>
          c.lakeName === activeLake.name ||
          (Math.abs(c.lakeLat - activeLake.lat) < 0.01 &&
            Math.abs(c.lakeLng - activeLake.lng) < 0.01),
      )
      .sort(
        (a, b) =>
          new Date(b.caughtAt).getTime() - new Date(a.caughtAt).getTime(),
      );
  }, [state.entries, activeLake]);

  const todayCatches = useMemo(() => {
    const todayString = new Date().toDateString();
    return lakeCatches.filter((c) => {
      const catchDate = new Date(c.caughtAt).toDateString();
      return catchDate === todayString;
    });
  }, [lakeCatches]);

  const open = useCallback(
    () =>
      setState((s) => ({
        ...s,
        isOpen: true,
        view: "list",
        selectedEntry: null,
        isEditing: false,
      })),
    [],
  );
  const close = useCallback(
    () => setState((s) => ({ ...s, isOpen: false })),
    [],
  );
  const showList = useCallback(
    () =>
      setState((s) => ({
        ...s,
        view: "list",
        selectedEntry: null,
        isEditing: false,
      })),
    [],
  );
  const showDetail = useCallback(
    (entry: CatchEntry) =>
      setState((s) => ({
        ...s,
        isOpen: true,
        view: "detail",
        selectedEntry: entry,
        isEditing: false,
      })),
    [],
  );
  const showForm = useCallback(
    (entry?: CatchEntry) => {
      console.log("[CatchLog] showForm called, entry:", entry ? "has entry" : "no entry", "activeLake:", activeLake?.name || "null");
      setState((s) => {
        console.log("[CatchLog] showForm setState, prev isOpen:", s.isOpen, "-> new isOpen: true");
        return {
          ...s,
          isOpen: true,
          view: "form",
          selectedEntry: entry || null,
          isEditing: !!entry?.id,
        };
      });
    },
    [activeLake],
  );
  const loadMore = useCallback(
    () =>
      setState((s) => ({
        ...s,
        visibleCount: s.visibleCount + ENTRIES_PER_PAGE,
      })),
    [],
  );

  const addCatch = useCallback(
    async (catchData: Omit<CatchEntry, "id" | "createdAt">) => {
      if (!activeLake) return null;
      const tempId = `offline-${Date.now()}`;
      const newEntry: CatchEntry = {
        ...catchData,
        id: tempId,
        createdAt: new Date().toISOString(),
        isOffline: false,
      };

      try {
        setIsLoading(true);
        const input = entryToApiInput(catchData, activeLake);

        let response: { success: boolean; catch_id: string };

        // Use mobile endpoint on native platforms
        if (isNativePlatform() && nativeAuth.userEmail && nativeAuth.userId) {
          response = await createCatchMobile(input, nativeAuth.userEmail, nativeAuth.userId);
        } else {
          const token = await getToken();
          if (!token) throw new Error("Offline");
          response = await createCatch(input, token);
        }

        const savedEntry = { ...newEntry, id: response.catch_id };
        const newEntries = [savedEntry, ...state.entries];
        globalEntriesCache = newEntries;
        setState((s) => ({
          ...s,
          entries: newEntries,
          view: "list",
          selectedEntry: null,
          isEditing: false,
          isOpen: options?.disableListView ? false : s.isOpen,
        }));
        return savedEntry;
      } catch (err: any) {
        // LOG THE ERROR so we know why uploads fail
        console.error('[CatchLog] Upload failed:', err?.message || err);
        console.error('[CatchLog] Saving to offline storage');

        const offlineEntry = { ...newEntry, isOffline: true };
        try {
          const currentOffline = getOfflineCatches();
          localStorage.setItem(
            OFFLINE_KEY,
            JSON.stringify([offlineEntry, ...currentOffline]),
          );
          const newEntries = [offlineEntry, ...state.entries];
          setState((s) => ({
            ...s,
            entries: newEntries,
            view: "list",
            selectedEntry: null,
            isEditing: false,
            isOpen: options?.disableListView ? false : s.isOpen,
          }));
          return offlineEntry;
        } catch (storageErr) {
          setError("Storage full. Cannot save catch.");
          return null;
        }
      } finally {
        setIsLoading(false);
      }
    },
    [
      activeLake,
      getToken,
      getOfflineCatches,
      options?.disableListView,
      state.entries,
    ],
  );

  const updateCatch = useCallback(
    async (id: string, updates: Partial<CatchEntry>) => {
      // Debug: Log location update
      console.log("[CatchLog] updateCatch called:", {
        id,
        updateLat: updates.catchLat,
        updateLng: updates.catchLng,
      });

      const updatedEntries = state.entries.map((c) =>
        c.id === id ? { ...c, ...updates } : c,
      );
      globalEntriesCache = updatedEntries;

      const updatedEntry = updatedEntries.find((c) => c.id === id);
      console.log("[CatchLog] Optimistic update applied:", {
        entryLat: updatedEntry?.catchLat,
        entryLng: updatedEntry?.catchLng,
      });

      setState((s) => ({
        ...s,
        entries: updatedEntries,
        selectedEntry: updatedEntry || null,
        view: "detail",
        isEditing: false,
      }));
      try {
        const currentEntry = state.entries.find((e) => e.id === id);
        if (currentEntry) {
          const merged = { ...currentEntry, ...updates };
          const apiInput = entryToApiInput(merged, activeLake);

          console.log("[CatchLog] Sending to API:", {
            lat: apiInput.lat,
            lng: apiInput.lng,
          });

          // Use mobile endpoint on native platforms
          if (isNativePlatform() && nativeAuth.userEmail && nativeAuth.userId) {
            console.log("[CatchLog] Updating via mobile endpoint:", id);
            await updateCatchMobile(id, apiInput, nativeAuth.userEmail, nativeAuth.userId);

            // Sync localStorage with optimistic data (don't call fetchCatches -
            // it could return stale data and overwrite the correct optimistic update)
            const apiOnlyEntries = updatedEntries.filter((c) => !c.isOffline);
            localStorage.setItem(API_CACHE_KEY, JSON.stringify(apiOnlyEntries));
            console.log("[CatchLog] Update successful, caches synced");
          } else {
            const token = await getToken();
            if (token) {
              await updateCatchApi(id, apiInput, token);

              // Sync localStorage with optimistic data
              const apiOnlyEntries = updatedEntries.filter((c) => !c.isOffline);
              localStorage.setItem(API_CACHE_KEY, JSON.stringify(apiOnlyEntries));
              console.log("[CatchLog] Update successful, caches synced");
            }
          }
        }
      } catch (err) {
        console.error("Failed to update catch:", err);
        alert("Failed to save changes. Please check your connection.");
        fetchCatches();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeLake, state.entries, fetchCatches],
  );

  const deleteCatch = useCallback(
    async (id: string) => {
      const remaining = state.entries.filter((c) => c.id !== id);
      globalEntriesCache = remaining;
      setState((s) => ({
        ...s,
        entries: remaining,
        view: "list",
        selectedEntry: null,
        isEditing: false,
      }));
      try {
        // Use mobile endpoint on native platforms
        if (isNativePlatform() && nativeAuth.userEmail && nativeAuth.userId) {
          console.log("[CatchLog] Deleting via mobile endpoint:", id);
          await deleteCatchMobile(id, nativeAuth.userEmail, nativeAuth.userId);
          const apiOnly = remaining.filter((c) => !c.isOffline);
          localStorage.setItem(API_CACHE_KEY, JSON.stringify(apiOnly));
        } else {
          const token = await getToken();
          if (token) {
            await deleteCatchApi(id, token);
            const apiOnly = remaining.filter((c) => !c.isOffline);
            localStorage.setItem(API_CACHE_KEY, JSON.stringify(apiOnly));
          }
        }
      } catch (err) {
        if (id.startsWith("offline-")) {
          const offline = getOfflineCatches();
          localStorage.setItem(
            OFFLINE_KEY,
            JSON.stringify(offline.filter((c) => c.id !== id)),
          );
        } else {
          console.error("Delete failed", err);
          fetchCatches();
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [getOfflineCatches, state.entries, fetchCatches],
  );

  return {
    isOpen: state.isOpen,
    view: state.view,
    selectedEntry: state.selectedEntry,
    isEditing: state.isEditing,
    entries: state.entries,
    lakeCatches,
    entriesVersion, // Version counter to detect when entries update
    visibleCatches: todayCatches.slice(0, state.visibleCount),
    hasMore: todayCatches.length > state.visibleCount,
    activeLake,
    isLoading,
    error,
    open,
    close,
    showList,
    showDetail,
    showForm,
    loadMore,
    addCatch,
    updateCatch,
    deleteCatch,
    refresh: fetchCatches,
    syncOfflineCatches,
    hasOffline: state.entries.some((e) => e.isOffline),
  };
}
export type UseCatchLogReturn = ReturnType<typeof useCatchLog>;

// =============================================================================
// COMPONENT: CatchButton
// =============================================================================
type CatchButtonProps = {
  onClick: () => void;
  catchCount: number;
  disabled?: boolean;
};
export function CatchButton({
  onClick,
  catchCount,
  disabled,
}: CatchButtonProps) {
  return (
    <>
      <button
        onClick={onClick}
        disabled={disabled}
        className="catch-float-btn"
        aria-label="Open catch log"
      >
        <FishIcon size={26} />
        {catchCount > 0 && <span className="catch-badge">{catchCount}</span>}
      </button>
      <style>{` .catch-float-btn { position: fixed; top: 50%; left: 20px; transform: translateY(-50%); width: 58px; height: 58px; border-radius: 50%; border: 1px solid rgba(255, 255, 255, 0.15); background: rgba(15, 15, 20, 0.7); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.15); color: rgba(255, 255, 255, 0.9); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); z-index: 1000; } .catch-float-btn:hover:not(:disabled) { transform: translateY(-52%) scale(1.05); background: rgba(20, 20, 28, 0.85); border-color: rgba(255, 255, 255, 0.3); box-shadow: 0 12px 40px rgba(0, 0, 0, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.3); color: #fff; } .catch-float-btn:active:not(:disabled) { transform: translateY(-50%) scale(0.95); } .catch-float-btn:disabled { opacity: 0.4; cursor: not-allowed; filter: grayscale(1); background: rgba(10, 10, 10, 0.6); border-color: rgba(255,255,255,0.05); } .catch-badge { position: absolute; top: -2px; right: -2px; min-width: 20px; height: 20px; border-radius: 10px; background: linear-gradient(135deg, #4A90E2, #357ABD); color: #fff; font-size: 0.75rem; font-weight: 700; display: flex; align-items: center; justify-content: center; padding: 0 5px; box-shadow: 0 4px 10px rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2); } `}</style>
    </>
  );
}

// =============================================================================
// COMPONENT: CatchLogModal
// =============================================================================
export type CatchLogModalProps = UseCatchLogReturn & {
  onFlyToLocation?: (lat: number, lng: number) => void;
  onDraftDone?: () => void;
  disableListView?: boolean;
  galleryOnly?: boolean;
};

export function CatchLogModal(props: CatchLogModalProps) {
  const {
    isOpen,
    view,
    selectedEntry,
    isEditing,
    visibleCatches,
    hasMore,
    activeLake,
    close,
    showList,
    showDetail,
    showForm,
    loadMore,
    addCatch,
    updateCatch,
    deleteCatch,
    entries,
    onFlyToLocation,
    onDraftDone,
    syncOfflineCatches,
    hasOffline,
    disableListView,
    galleryOnly,
  } = props;

  if (!isOpen) return null;
  if (view === "list" && disableListView) return null;

  const handleFlyToLocation = (lat: number, lng: number) => {
    if (onFlyToLocation) {
      close();
      onFlyToLocation(lat, lng);
    }
  };

  return (
    <>
      <div className="catch-modal-overlay" onClick={close}>
        <div className="catch-modal" onClick={(e) => e.stopPropagation()}>
          {view === "list" && !disableListView && (
            <CatchListView
              catches={visibleCatches}
              allEntries={entries}
              hasMore={hasMore}
              activeLake={activeLake}
              onSelectCatch={showDetail}
              onAddNew={() => showForm()}
              onLoadMore={loadMore}
              onClose={close}
              onSync={syncOfflineCatches}
              hasOffline={hasOffline}
            />
          )}
          {view === "detail" && selectedEntry && (
            <CatchDetailView
              entry={selectedEntry}
              allEntries={entries}
              onBack={showList}
              onEdit={() => showForm(selectedEntry)}
              onDelete={() => {
                if (confirm("Delete this catch?"))
                  deleteCatch(selectedEntry.id);
              }}
              onFlyToLocation={handleFlyToLocation}
              readOnly={false}
            />
          )}
          {view === "form" && (
            <CatchFormView
              entry={selectedEntry}
              isEditing={isEditing}
              activeLake={activeLake}
              galleryOnly={galleryOnly}
              onSave={async (data) => {
                if (isEditing && selectedEntry) {
                  await updateCatch(selectedEntry.id, data);
                  return null;
                } else {
                  const result = await addCatch(data as Omit<CatchEntry, "id" | "createdAt">);
                  if (!selectedEntry?.id) onDraftDone?.();
                  if (disableListView) close();
                  return result;
                }
              }}
              onCancel={() => {
                if (!isEditing && !selectedEntry?.id) {
                  onDraftDone?.();
                  if (disableListView) close();
                  else showList();
                  return;
                }
                if (selectedEntry) showDetail(selectedEntry);
                else if (disableListView) close();
                else showList();
              }}
            />
          )}
        </div>
      </div>
      <style>{` .catch-modal-overlay { position: fixed; inset: 0; z-index: 2500; background: rgba(0, 0, 0, 0.85); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; padding: 12px; padding-top: calc(env(safe-area-inset-top, 0px) + 12px); padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 12px); } .catch-modal { width: 100%; max-width: 380px; max-height: 90vh; border-radius: 24px; background: rgba(18, 18, 24, 0.95); backdrop-filter: blur(24px); border: 1px solid rgba(255, 255, 255, 0.08); box-shadow: 0 25px 60px rgba(0, 0, 0, 0.6); display: flex; flex-direction: column; overflow: hidden; color: white; } `}</style>
    </>
  );
}

// =============================================================================
// SUB-COMPONENT: CatchListView
// =============================================================================
type CatchListViewProps = {
  catches: CatchEntry[];
  allEntries: CatchEntry[];
  hasMore: boolean;
  activeLake: ActiveLake;
  onSelectCatch: (entry: CatchEntry) => void;
  onAddNew: () => void;
  onLoadMore: () => void;
  onClose: () => void;
  onSync?: () => void;
  hasOffline?: boolean;
};
function CatchListView(props: CatchListViewProps) {
  const {
    catches,
    hasMore,
    activeLake,
    onSelectCatch,
    onAddNew,
    onLoadMore,
    onClose,
    onSync,
    hasOffline,
  } = props;

  // Calculate bag weight for today's catches
  const bagWeight = catches.reduce((sum, c) => sum + (c.weight || 0), 0);
  return (
    <>
      <div className="catch-modal-header">
        <div className="catch-header-title">
          <FishIcon size={20} /> <span>Catch Log</span>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} className="catch-close-btn">
            <CloseIcon />
          </button>
        </div>
      </div>
      {activeLake && (
        <div className="catch-lake-context">{activeLake.name}</div>
      )}
      {hasOffline && onSync && (
        <div className="catch-offline-banner">
          <CloudOffIcon size={14} />
          <span>You have offline catches waiting to sync</span>
          <button className="catch-sync-btn" onClick={onSync} style={{ marginLeft: "auto" }}>
            <RefreshIcon size={14} /> Sync Now
          </button>
        </div>
      )}
      <div className="catch-modal-body">
        {!activeLake ? (
          <div className="catch-empty-state">
            <p>Select a lake to view catches</p>
          </div>
        ) : catches.length === 0 ? (
          <div className="catch-empty-state">
            <FishIcon size={48} /> <p>No catches today</p>
          </div>
        ) : (
          <div className="catch-list">
            {catches.map((entry) => (
              <button
                key={entry.id}
                className={`catch-list-item ${entry.isOffline ? "is-offline" : ""}`}
                onClick={() => onSelectCatch(entry)}
              >
                <div className="catch-item-thumb">
                  {entry.photoUrl || entry.imageData ? (
                    <img
                      src={entry.photoUrl || entry.imageData}
                      alt="Catch"
                      style={{ opacity: entry.isOffline ? 0.7 : 1 }}
                    />
                  ) : (
                    <div className="catch-item-no-img">
                      <FishIcon size={20} />
                    </div>
                  )}
                  {entry.isOffline && (
                    <div className="catch-item-offline-badge">
                      <CloudOffIcon size={10} />
                    </div>
                  )}
                </div>
                <div className="catch-item-info">
                  <div className="catch-item-time">
                    {formatCatchTime(entry.caughtAt)}{" "}
                    {entry.species && entry.species !== "largemouth" && (
                      <span className="catch-item-species">
                        {getSpeciesLabel(entry.species)}
                      </span>
                    )}
                  </div>
                  <div className="catch-item-details">
                    {entry.weight && `${entry.weight} lbs`}{" "}
                    {entry.weight && entry.length && " • "}{" "}
                    {entry.length && `${entry.length}"`}{" "}
                    {!entry.weight &&
                      !entry.length &&
                      formatLureName(entry.lure)}
                  </div>
                </div>
                <div className="catch-item-date">
                  {formatCatchDate(entry.caughtAt)}
                </div>
              </button>
            ))}
            {hasMore && (
              <button className="catch-load-more" onClick={onLoadMore}>
                View More
              </button>
            )}
          </div>
        )}
      </div>
      {catches.length > 0 && bagWeight > 0 && (
        <div className="catch-bag-weight">
          <span className="bag-weight-label">Bag Weight</span>
          <span className="bag-weight-value">{bagWeight.toFixed(2)} lbs</span>
        </div>
      )}
      <style>{` .catch-bag-weight { padding: 12px 24px; border-top: 1px solid rgba(255, 255, 255, 0.06); display: flex; justify-content: space-between; align-items: center; background: rgba(74, 144, 226, 0.05); } .bag-weight-label { font-size: 0.85rem; color: rgba(255, 255, 255, 0.6); font-weight: 500; } .bag-weight-value { font-size: 1.1rem; color: #4A90E2; font-weight: 700; } .catch-modal-header { padding: 20px 24px; border-bottom: 1px solid rgba(255, 255, 255, 0.06); display: flex; justify-content: space-between; align-items: center; color: white; } .catch-header-title { display: flex; align-items: center; gap: 10px; font-weight: 700; font-size: 1.05rem; } .catch-close-btn { width: 36px; height: 36px; border-radius: 10px; border: none; background: rgba(255, 255, 255, 0.05); color: rgba(255, 255, 255, 0.6); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; } .catch-close-btn:hover { background: rgba(255, 255, 255, 0.1); color: #fff; } .catch-lake-context { padding: 12px 24px; background: rgba(74, 144, 226, 0.1); color: #4A90E2; font-size: 0.85rem; font-weight: 600; border-bottom: 1px solid rgba(255, 255, 255, 0.06); } .catch-modal-body { flex: 1; overflow-y: auto; padding: 16px; } .catch-empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 48px 24px; color: rgba(255, 255, 255, 0.4); text-align: center; gap: 12px; } .catch-empty-state p { margin: 0; font-size: 1rem; color: rgba(255, 255, 255, 0.6); } .catch-empty-state span { font-size: 0.85rem; } .catch-list { display: flex; flex-direction: column; gap: 8px; } .catch-list-item { display: flex; align-items: center; gap: 12px; padding: 12px; background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 14px; cursor: pointer; transition: all 0.2s; text-align: left; width: 100%; } .catch-list-item:hover { background: rgba(255, 255, 255, 0.06); border-color: rgba(255, 255, 255, 0.1); } .catch-item-thumb { width: 52px; height: 52px; border-radius: 10px; overflow: hidden; flex-shrink: 0; background: rgba(0, 0, 0, 0.3); position: relative; object-fit: contain; } .catch-item-species { margin-left: 8px; font-size: 0.7rem; color: rgba(255, 255, 255, 0.4); text-transform: uppercase; letter-spacing: 0.05em; } .catch-item-thumb img { width: 100%; height: 100%; object-fit: cover; } .catch-item-no-img { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: rgba(255, 255, 255, 0.2); } .catch-item-info { flex: 1; min-width: 0; } .catch-item-time { font-size: 0.95rem; font-weight: 600; color: #fff; } .catch-item-details { font-size: 0.8rem; color: rgba(255, 255, 255, 0.5); margin-top: 2px; } .catch-item-date { font-size: 0.75rem; color: rgba(255, 255, 255, 0.35); flex-shrink: 0; } .catch-load-more { width: 100%; padding: 14px; margin-top: 8px; border: 1px dashed rgba(255, 255, 255, 0.15); border-radius: 12px; background: transparent; color: rgba(255, 255, 255, 0.5); font-size: 0.9rem; font-weight: 600; cursor: pointer; transition: all 0.2s; } .catch-load-more:hover { border-color: rgba(255, 255, 255, 0.25); color: rgba(255, 255, 255, 0.7); background: rgba(255, 255, 255, 0.03); } .catch-modal-footer { padding: 16px 24px 24px; border-top: 1px solid rgba(255, 255, 255, 0.06); } .catch-add-btn { width: 100%; padding: 16px; border-radius: 14px; border: none; background: linear-gradient(135deg, #4A90E2 0%, #357ABD 100%); color: #fff; font-size: 1rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s; box-shadow: 0 8px 24px rgba(74, 144, 226, 0.25); } .catch-sync-btn { display: flex; align-items: center; gap: 6px; padding: 0 12px; height: 36px; border-radius: 10px; border: 1px solid rgba(245, 158, 11, 0.3); background: rgba(245, 158, 11, 0.1); color: #FBBF24; font-size: 0.8rem; font-weight: 600; cursor: pointer; } .catch-offline-banner { margin-bottom: 12px; padding: 10px 12px; border-radius: 10px; background: rgba(245, 158, 11, 0.1); border: 1px dashed rgba(245, 158, 11, 0.3); color: #FBBF24; font-size: 0.75rem; display: flex; align-items: center; gap: 8px; } .catch-list-item.is-offline { border-style: dashed; border-color: rgba(245, 158, 11, 0.3); } .catch-item-offline-badge { position: absolute; bottom: 2px; right: 2px; background: #FBBF24; color: #000; width: 16px; height: 16px; border-radius: 50%; display: flex; align-items: center; justify-content: center; } `}</style>
    </>
  );
}

// =============================================================================
// SUB-COMPONENT: CatchDetailView (Refined Detail View)
// =============================================================================
export type CatchDetailViewProps = {
  entry: CatchEntry;
  allEntries?: CatchEntry[];
  onBack: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onFlyToLocation?: (lat: number, lng: number) => void;
  readOnly?: boolean;
  onLocationClick?: () => void;
};

export function CatchDetailView({
  entry,
  allEntries = [],
  onBack,
  onEdit,
  onDelete,
  onFlyToLocation,
  readOnly = false,
  onLocationClick,
}: CatchDetailViewProps) {
  const isPB = isPersonalBest(entry, allEntries);
  const [showMenu, setShowMenu] = React.useState(false);
  const [isSharing, setIsSharing] = React.useState(false);
  const shareCardRef = React.useRef<HTMLDivElement>(null);

  // Calculate season from catch date
  const getSeason = (date: Date): string => {
    const month = date.getMonth();
    if (month >= 2 && month <= 4) return "Pre-Spawn";
    if (month >= 5 && month <= 6) return "Spawn / Post-Spawn";
    if (month >= 7 && month <= 9) return "Summer";
    return "Winter";
  };
  const season = getSeason(new Date(entry.caughtAt));

  // Build conditions string
  const getConditionsString = (): string => {
    const parts: string[] = [];
    if (entry.temp) parts.push(`${Math.round(entry.temp)}°`);
    if (entry.windSpeed) parts.push(`${Math.round(entry.windSpeed)}mph wind`);
    if (entry.pressure) parts.push(`${Math.round(entry.pressure)}mb`);
    if (entry.skyCondition) parts.push(entry.skyCondition);
    return parts.length > 0 ? parts.join(" • ") : "";
  };

  // Share as image
  const handleShare = async () => {
    if (!shareCardRef.current) return;
    setIsSharing(true);

    try {
      const html2canvas = (await import('html2canvas')).default;

      // Capture the card at high resolution - background-image is properly handled
      const canvas = await html2canvas(shareCardRef.current, {
        backgroundColor: '#0f0f12',
        scale: 3, // 3x scale for high quality output
        useCORS: true,
        allowTaint: true,
        onclone: () => {
          // No longer need to hide orb - it's been removed from the hero
        },
      });

      // Convert to PNG (lossless) for best quality
      canvas.toBlob(async (blob) => {
        if (!blob) {
          setIsSharing(false);
          return;
        }

        const file = new File([blob], 'bass-clarity-catch.png', { type: 'image/png' });

        if (navigator.share && navigator.canShare?.({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: 'My Bass Catch',
            });
          } catch (e) {
            // User cancelled - that's ok
          }
        } else {
          // Fallback: download the image
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'bass-clarity-catch.png';
          a.click();
          URL.revokeObjectURL(url);
        }
        setIsSharing(false);
      }, 'image/png'); // PNG for lossless quality
    } catch (e) {
      console.error('Share failed:', e);
      setIsSharing(false);
    }
  };

  return (
    <div className="catch-detail-container">
      {/* Action bar - outside shareable area */}
      <div className="catch-action-bar">
        <button onClick={onBack} className="catch-icon-btn glass">
          {readOnly ? <CloseIcon size={20} /> : <BackIcon size={20} />}
        </button>
        {!readOnly && (onEdit || onDelete) && (
          <div className="catch-menu-wrapper">
            <button
              className="catch-icon-btn glass"
              onClick={() => setShowMenu(!showMenu)}
            >
              <MoreVerticalIcon size={20} />
            </button>
            {showMenu && (
              <div className="catch-menu-dropdown">
                {onEdit && (
                  <button onClick={() => { onEdit(); setShowMenu(false); }} className="catch-menu-item">
                    <EditIcon size={16} /> Edit
                  </button>
                )}
                {onDelete && (
                  <button onClick={() => { onDelete(); setShowMenu(false); }} className="catch-menu-item danger">
                    <TrashIcon size={16} /> Delete
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* SHAREABLE CARD - This gets captured for sharing */}
      <div ref={shareCardRef} className="catch-share-card">
        {/* Hero Image - Using background-image so html2canvas captures the cropped version */}
        <div className="catch-hero">
          {entry.photoUrl || entry.imageData ? (
            <div
              className="catch-hero-image"
              style={{ backgroundImage: `url(${entry.photoUrl || entry.imageData})` }}
            />
          ) : (
            <div className="catch-hero-placeholder">
              <FishIcon size={48} style={{ opacity: 0.3 }} />
            </div>
          )}
          <div className="catch-hero-gradient" />
        </div>

        {/* Catch Info Container - Compact */}
        <div className="catch-info-container">
          {/* Primary Stats Row */}
          <div className="catch-primary-row">
            <div className="catch-species-lure">
              <span className="catch-species">{getSpeciesLabel(entry.species)} Bass</span>
              <span className="catch-lure">{formatLureName(entry.lure)}{entry.color ? ` (${formatLureName(entry.color)})` : ''}</span>
            </div>
            {entry.weight && (
              <div className="catch-weight-block">
                {isPB && (
                  <div className="catch-pb-badge">
                    <TrophyIcon size={12} /> PB
                  </div>
                )}
                <span className="catch-weight-value">{entry.weight}</span>
                <span className="catch-weight-unit">LBS</span>
              </div>
            )}
          </div>

          {/* Date & Season */}
          <div className="catch-meta-row">
            <span>{formatCatchDate(entry.caughtAt)} • {formatCatchTime(entry.caughtAt)}</span>
            <span className="catch-season-badge">{season}</span>
          </div>

          {/* Conditions - Table format */}
          {(entry.temp || entry.windSpeed || entry.pressure || entry.skyCondition) && (
            <div className="catch-conditions-grid">
              {entry.temp && (
                <div className="cond-item">
                  <span className="cond-label">Temp</span>
                  <span className="cond-value">{Math.round(entry.temp)}°</span>
                </div>
              )}
              {entry.windSpeed && (
                <div className="cond-item">
                  <span className="cond-label">Wind</span>
                  <span className="cond-value">{Math.round(entry.windSpeed)}mph</span>
                </div>
              )}
              {entry.pressure && (
                <div className="cond-item">
                  <span className="cond-label">Pressure</span>
                  <span className="cond-value">{Math.round(entry.pressure)}mb</span>
                </div>
              )}
              {entry.skyCondition && (
                <div className="cond-item">
                  <span className="cond-label">Conditions</span>
                  <span className="cond-icon">
                    {entry.skyCondition.includes('Rain') ? (
                      <DropletsIcon size={18} />
                    ) : entry.skyCondition.includes('Cloud') ? (
                      <CloudIcon size={18} />
                    ) : (
                      <SunIcon size={18} />
                    )}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Location - Lake name only, no coords for privacy */}
          <div className="catch-location-row">
            <LocationIcon size={14} />
            <span className="catch-loc-name">{entry.lakeName}</span>
          </div>

          {/* Brand Footer - Centered */}
          <div className="catch-brand-footer">
            <img src="/images/splash-logo.png" alt="" className="brand-logo" />
            <div className="brand-text-col">
              <span className="brand-text">Bass Clarity</span>
              <span className="brand-url">bassclarity.com</span>
            </div>
          </div>
        </div>
      </div>

      {/* Share & Location Buttons - Outside shareable card */}
      <div className="catch-actions-footer">
        {(onLocationClick || onFlyToLocation) && (
          <button
            className="catch-action-btn secondary"
            onClick={() => onLocationClick ? onLocationClick() : onFlyToLocation?.(entry.catchLat, entry.catchLng)}
          >
            <LocationIcon size={18} />
            View on Map
          </button>
        )}
        <button className="catch-action-btn primary" onClick={handleShare} disabled={isSharing}>
          {isSharing ? (
            <>Generating...</>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
              Share Catch
            </>
          )}
        </button>
      </div>

      <style>{`
        /* BRANDED CATCH CARD STYLES */
        .catch-detail-container { position: relative; display: flex; flex-direction: column; height: 100%; background: #0a0a0a; overflow-y: auto; }

        /* Action Bar */
        .catch-action-bar { display: flex; justify-content: space-between; padding: 12px 16px; background: transparent; position: absolute; top: 0; left: 0; right: 0; z-index: 30; }
        .catch-icon-btn { width: 36px; height: 36px; border-radius: 50%; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #fff; transition: all 0.2s; }
        .catch-icon-btn.glass { background: rgba(0, 0, 0, 0.5); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.2); }

        /* Menu dropdown */
        .catch-menu-wrapper { position: relative; }
        .catch-menu-dropdown { position: absolute; top: 100%; right: 0; margin-top: 8px; background: rgba(15,15,18,0.95); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 4px; min-width: 120px; box-shadow: 0 10px 30px rgba(0,0,0,0.6); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); }
        .catch-menu-item { display: flex; align-items: center; gap: 10px; width: 100%; padding: 10px 14px; border: none; background: transparent; color: #fff; font-size: 0.9rem; cursor: pointer; border-radius: 8px; transition: background 0.15s; }
        .catch-menu-item:hover { background: rgba(255,255,255,0.08); }
        .catch-menu-item.danger { color: #ef4444; }
        .catch-menu-item.danger:hover { background: rgba(239, 68, 68, 0.15); }

        /* Shareable Card Container */
        .catch-share-card { position: relative; margin: 0 8px 8px 8px; border-radius: 16px; overflow: hidden; background: #0f0f12; }

        /* Hero Image - Using background-image for proper html2canvas capture */
        .catch-hero { position: relative; width: 100%; height: 380px; background: #000; }
        .catch-hero-image { width: 100%; height: 100%; background-size: cover; background-position: center 20%; background-repeat: no-repeat; }
        .catch-hero-gradient { position: absolute; inset: 0; background: linear-gradient(to bottom, transparent 0%, transparent 70%, #0f0f12 100%); pointer-events: none; }
        .catch-hero-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #0f0f12; color: rgba(255,255,255,0.1); }

        /* Orb - Radar ping style watermark that doubles as edit menu */
        .catch-orb-wrapper { position: absolute; bottom: 50px; left: 14px; z-index: 20; }
        .catch-orb-btn {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          position: relative;
          padding: 0;
          cursor: pointer;
        }
        .catch-orb-core {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #4A90E2;
          box-shadow: 0 0 12px rgba(74, 144, 226, 0.9), 0 0 4px rgba(74, 144, 226, 1);
          z-index: 10;
          position: relative;
        }
        /* Radar ping rings - expanding outward */
        .catch-orb-ping {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 1.5px solid rgba(74, 144, 226, 0.7);
          background: transparent;
          pointer-events: none;
          animation: radar-ping 2.4s infinite cubic-bezier(0.2, 0, 0.4, 1);
        }
        .catch-orb-ping.ping-1 { animation-delay: 0s; }
        .catch-orb-ping.ping-2 { animation-delay: 0.8s; }
        .catch-orb-ping.ping-3 { animation-delay: 1.6s; }
        @keyframes radar-ping {
          0% {
            width: 16px;
            height: 16px;
            opacity: 0.8;
            border-color: rgba(74, 144, 226, 0.8);
          }
          100% {
            width: 44px;
            height: 44px;
            opacity: 0;
            border-color: rgba(74, 144, 226, 0);
          }
        }
        .catch-orb-dropdown { position: absolute; top: 100%; left: 0; margin-top: 8px; background: rgba(15,15,18,0.95); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 4px; min-width: 100px; box-shadow: 0 10px 30px rgba(0,0,0,0.6); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); }
        .orb-menu-item { display: flex; align-items: center; gap: 8px; width: 100%; padding: 10px 12px; background: transparent; border: none; color: #fff; font-size: 0.85rem; font-weight: 500; text-align: left; border-radius: 8px; cursor: pointer; }
        .orb-menu-item:hover { background: rgba(255,255,255,0.1); }
        .orb-menu-item.danger { color: #f87171; }

        .catch-pb-overlay { position: absolute; top: 12px; right: 12px; background: linear-gradient(135deg, #fbbf24 0%, #d97706 100%); color: #fff; padding: 4px 10px; border-radius: 20px; font-weight: 800; font-size: 0.7rem; letter-spacing: 0.05em; display: flex; align-items: center; gap: 4px; box-shadow: 0 2px 10px rgba(0,0,0,0.4); z-index: 10; }

        /* Info Container - Compact padding */
        .catch-info-container { padding: 8px 14px 8px; position: relative; margin-top: -30px; z-index: 5; }

        /* Primary Row - Species/Lure + Weight */
        .catch-primary-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px; }
        .catch-species-lure { display: flex; flex-direction: column; gap: 1px; flex: 1; padding-right: 10px; }
        .catch-species { font-size: 0.75rem; font-weight: 700; color: #4A90E2; text-transform: uppercase; letter-spacing: 0.05em; }
        .catch-lure { font-size: 1rem; font-weight: 700; color: #fff; line-height: 1.2; }
        .catch-weight-block { display: flex; flex-direction: column; align-items: flex-end; flex-shrink: 0; }
        .catch-pb-badge { background: linear-gradient(135deg, #fbbf24 0%, #d97706 100%); color: #fff; padding: 3px 8px; border-radius: 12px; font-weight: 800; font-size: 0.65rem; letter-spacing: 0.05em; display: flex; align-items: center; gap: 4px; margin-bottom: 4px; }
        .catch-weight-value { font-size: 2.2rem; font-weight: 900; color: #fff; line-height: 1; letter-spacing: -0.02em; }
        .catch-weight-unit { font-size: 0.65rem; color: #4A90E2; font-weight: 800; letter-spacing: 0.1em; }

        /* Meta Row - Date & Season */
        .catch-meta-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.06); font-size: 0.75rem; color: rgba(255,255,255,0.5); }
        .catch-season-badge { background: rgba(74, 144, 226, 0.15); color: #4A90E2; padding: 2px 8px; border-radius: 10px; font-size: 0.65rem; font-weight: 700; letter-spacing: 0.03em; }

        /* Conditions - Grid/Table format */
        .catch-conditions-grid { display: flex; justify-content: space-around; margin-bottom: 6px; padding: 6px 0; }
        .cond-item { display: flex; flex-direction: column; align-items: center; gap: 2px; }
        .cond-label { font-size: 0.65rem; font-weight: 600; color: rgba(255,255,255,0.7); text-transform: uppercase; letter-spacing: 0.05em; }
        .cond-value { font-size: 0.95rem; font-weight: 700; color: #4A90E2; }
        .cond-icon { color: #4A90E2; display: flex; align-items: center; }

        /* Location Row - Lake name only */
        .catch-location-row { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; padding: 6px 10px; background: rgba(255,255,255,0.03); border-radius: 8px; }
        .catch-location-row svg { color: #4A90E2; flex-shrink: 0; }
        .catch-loc-name { font-size: 0.85rem; font-weight: 600; color: #fff; }

        /* Brand Footer - Centered */
        .catch-brand-footer { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 0; margin-top: -4px; }
        .brand-text-col { display: flex; flex-direction: column; gap: 1px; }
        .brand-text { font-size: 1.1rem; font-weight: 700; color: rgba(255,255,255,0.8); letter-spacing: 0.02em; }
        .brand-url { font-size: 0.7rem; color: rgba(255,255,255,0.35); font-weight: 500; }
        .brand-logo { width: 56px; height: 56px; object-fit: contain; }

        /* Action Footer */
        .catch-actions-footer { display: flex; gap: 10px; padding: 12px 16px 20px; }
        .catch-action-btn { flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 14px 16px; border-radius: 12px; font-size: 0.9rem; font-weight: 600; cursor: pointer; transition: all 0.2s; border: none; }
        .catch-action-btn.primary { background: linear-gradient(135deg, #4A90E2 0%, #357ABD 100%); color: #fff; box-shadow: 0 4px 16px rgba(74, 144, 226, 0.3); }
        .catch-action-btn.primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .catch-action-btn.secondary { background: rgba(255,255,255,0.05); color: #fff; border: 1px solid rgba(255,255,255,0.1); }
        .catch-action-btn:active:not(:disabled) { transform: scale(0.98); }

        @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}

// =============================================================================
// SUB-COMPONENT: CatchFormView (Updated with Weather Fields)
// =============================================================================
export type CatchFormViewProps = {
  entry: CatchEntry | null;
  isEditing: boolean;
  activeLake: ActiveLake;
  onSave: (data: Partial<CatchEntry>) => Promise<CatchEntry | null> | void;
  onCancel: () => void;
  initialSource?: "camera" | "library" | "manual";
  initialCoords?: { lat: number; lng: number };
  initialDateTime?: Date;
  galleryOnly?: boolean;
};
export function CatchFormView({
  entry,
  isEditing,
  activeLake,
  onSave,
  onCancel,
  initialSource = "manual",
  initialCoords,
  initialDateTime,
  galleryOnly = false,
}: CatchFormViewProps) {
  const { getToken } = usePlatformAuth();
  const nativeAuth = useNativeAuth();
  const { isActive: isPro } = useMemberStatus();
  const navigate = useNavigate();
  const routeLocation = useLocation();
  const [isResolving, setIsResolving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isAutoResolving, setIsAutoResolving] = useState(false);

  // Upgrade modal state for lake not found
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [pendingLakeQuery, setPendingLakeQuery] = useState("");

  // Weather Fetching State
  const [isFetchingWeather, setIsFetchingWeather] = useState(false);

  const [lakeName, setLakeName] = useState(
    entry?.lakeName ||
      (activeLake?.name === "Photo Upload" ? "" : activeLake?.name) ||
      "",
  );
  // Auto-populate lure/color/species from last catch (for new catches only)
  const lastDefaults = !entry ? loadLastCatchDefaults() : null;
  const [lure, setLure] = useState(entry?.lure || lastDefaults?.lure || "");
  const [color, setColor] = useState(entry?.color || lastDefaults?.color || "");
  const [species, setSpecies] = useState<BassSpecies>(
    entry?.species || lastDefaults?.species || "largemouth",
  );
  const [weight, setWeight] = useState(entry?.weight?.toString() || "");
  const [length, setLength] = useState(entry?.length?.toString() || "");
  const [notes, setNotes] = useState(entry?.notes || "");
  const [source, setSource] = useState<"camera" | "library" | "manual">(
    // Demo entries default to "manual" in the form
    entry?.source === "demo" ? "manual" : (entry?.source || initialSource),
  );
  const [catchLat, setCatchLat] = useState(
    initialCoords?.lat || entry?.catchLat || activeLake?.lat || 0,
  );
  const [catchLng, setCatchLng] = useState(
    initialCoords?.lng || entry?.catchLng || activeLake?.lng || 0,
  );

  // Weather Fields
  const [temp, setTemp] = useState(entry?.temp?.toString() || "");
  const [windSpeed, setWindSpeed] = useState(
    entry?.windSpeed?.toString() || "",
  );
  const [pressure, setPressure] = useState(entry?.pressure?.toString() || "");
  const [sky, setSky] = useState(entry?.skyCondition || "");

  type LocationStatus = "idle" | "loading" | "success" | "error" | "exif";
  const [locationStatus, setLocationStatus] = useState<LocationStatus>(
    initialCoords ? "exif" : entry ? "success" : "idle",
  );
  const [photoUrl, setPhotoUrl] = useState(entry?.photoUrl || "");
  const [photoPreview, setPhotoPreview] = useState(
    entry?.imageData || entry?.photoUrl || "",
  );
  // Pending photo base64 - stored when upload fails due to network issues
  const [pendingPhotoBase64, setPendingPhotoBase64] = useState(entry?.pendingPhotoBase64 || "");
  const [uploadFailed, setUploadFailed] = useState(false);
  const [caughtAt, setCaughtAt] = useState(
    initialDateTime?.toISOString() ||
      entry?.caughtAt ||
      new Date().toISOString(),
  );
  const [exifStatus, setExifStatus] = useState<
    "idle" | "extracting" | "found-all" | "found-time" | "none"
  >("idle");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manual date/time pickers - shown when no EXIF data
  const [showManualDateTime, setShowManualDateTime] = useState(false);
  const [manualDate, setManualDate] = useState(() => {
    const d = initialDateTime || (entry?.caughtAt ? new Date(entry.caughtAt) : new Date());
    return d.toISOString().split('T')[0]; // YYYY-MM-DD
  });
  const [manualTime, setManualTime] = useState(() => {
    const d = initialDateTime || (entry?.caughtAt ? new Date(entry.caughtAt) : new Date());
    return d.toTimeString().slice(0, 5); // HH:MM
  });

  // Inline map picker for editing location
  const [showMapPicker, setShowMapPicker] = useState(false);
  const mapPickerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);

  // Prevent duplicate save submissions
  const isSavingRef = useRef(false);

  // Auto-Fetch Weather Logic
  const autoFetchWeather = async (lat: number, lng: number, time: string) => {
    setIsFetchingWeather(true);
    const data = await fetchWeatherForLocation(lat, lng, time);
    if (data) {
      if (data.temp) setTemp(Math.round(data.temp).toString());
      if (data.windSpeed) setWindSpeed(Math.round(data.windSpeed).toString());
      if (data.pressure) setPressure(Math.round(data.pressure).toString());
      if (data.skyCondition) setSky(data.skyCondition);
    }
    setIsFetchingWeather(false);
  };

  useEffect(() => {
    // If opening new form with coordinates (Live or EXIF), try fetching weather
    if (
      !isEditing &&
      (initialCoords || (catchLat && catchLng && source === "camera"))
    ) {
      autoFetchWeather(catchLat, catchLng, caughtAt);
    }
  }, [initialCoords]); // Only run once on mount if coords exist

  // Restore form draft if returning from LakeBuilder
  useEffect(() => {
    const navState = routeLocation.state as any;
    console.log("[CatchForm] useEffect navState:", navState);
    if (navState?.fromLakeBuilder && !isEditing) {
      console.log("[CatchForm] Returning from LakeBuilder, loading draft...");

      // First try sync (memory) draft
      let draft = loadCatchFormDraft();
      console.log("[CatchForm] Sync draft loaded:", draft ? "yes" : "no");

      if (draft) {
        restoreDraft(draft);
      } else {
        // Try async (Capacitor Preferences) draft
        loadCatchFormDraftAsync().then((asyncDraft) => {
          console.log("[CatchForm] Async draft loaded:", asyncDraft ? "yes" : "no");
          if (asyncDraft) {
            restoreDraft(asyncDraft);
          }
        });
      }

      // Set location from LakeBuilder return data (always do this)
      if (navState.catchLat && navState.catchLng) {
        setCatchLat(navState.catchLat);
        setCatchLng(navState.catchLng);
        setLocationStatus("success");
      }
      if (navState.lakeName) {
        setLakeName(navState.lakeName);
      }
    }

    function restoreDraft(draft: any) {
      console.log("[CatchForm] Restoring fields:", {
        hasPhotoUrl: !!draft.photoUrl,
        hasPhotoPreview: !!draft.photoPreview,
      });
      if (draft.lure) setLure(draft.lure);
      if (draft.color) setColor(draft.color);
      if (draft.species) setSpecies(draft.species as any);
      if (draft.weight) setWeight(draft.weight);
      if (draft.length) setLength(draft.length);
      if (draft.notes) setNotes(draft.notes);
      if (draft.photoUrl) setPhotoUrl(draft.photoUrl);
      // Use photoPreview if available, otherwise fall back to photoUrl for display
      if (draft.photoPreview) {
        setPhotoPreview(draft.photoPreview);
      } else if (draft.photoUrl) {
        setPhotoPreview(draft.photoUrl);
      }
      if (draft.caughtAt) setCaughtAt(draft.caughtAt);
      if (draft.source) setSource(draft.source as any);
      if (draft.temp) setTemp(draft.temp);
      if (draft.windSpeed) setWindSpeed(draft.windSpeed);
      if (draft.pressure) setPressure(draft.pressure);
      if (draft.sky) setSky(draft.sky);
      if (draft.manualDate) setManualDate(draft.manualDate);
      if (draft.manualTime) setManualTime(draft.manualTime);
      // If we have manual date/time, show the pickers and set exif status
      if (draft.manualDate && draft.manualTime) {
        setShowManualDateTime(true);
        setExifStatus("none");
      }
      // Clear the draft
      clearCatchFormDraft();
    }
  }, [routeLocation.state, isEditing]);

  const checkLakeMatch = async (lat: number, lng: number) => {
    try {
      setIsAutoResolving(true);
      let resolution;

      if (isNativePlatform() && nativeAuth.userEmail && nativeAuth.userId) {
        // Use mobile endpoint
        resolution = await resolveLakeMobile(lat, lng, nativeAuth.userEmail, nativeAuth.userId);
      } else {
        // Use web endpoint with JWT
        const token = await getToken();
        if (!token) return;
        resolution = await resolveLake(lat, lng, token);
      }

      if (resolution.resolved && resolution.lake_name) {
        setLakeName(resolution.lake_name);
      }
    } catch (err) {
      console.error("Failed to auto-resolve lake:", err);
    } finally {
      setIsAutoResolving(false);
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus("error");
      return;
    }
    setLocationStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCatchLat(position.coords.latitude);
        setCatchLng(position.coords.longitude);
        setLocationStatus("success");
        setSource("camera");
        checkLakeMatch(position.coords.latitude, position.coords.longitude);
        // Fetch current weather
        autoFetchWeather(
          position.coords.latitude,
          position.coords.longitude,
          new Date().toISOString(),
        );
      },
      () => setLocationStatus("error"),
      { enableHighAccuracy: true },
    );
  };

  // Initialize map picker when shown
  useEffect(() => {
    if (!showMapPicker || !mapPickerRef.current || !MAPBOX_TOKEN) return;

    // Clean up existing map
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Set token
    mapboxgl.accessToken = MAPBOX_TOKEN;

    // Center on current coords or default to US center
    const centerLat = catchLat || 32.5;
    const centerLng = catchLng || -96.8;

    // Use saved map style or default to dark
    const savedStyle = localStorage.getItem("bc_mapbox_style") || "mapbox://styles/kaiwenphoenix/cmlssh825005w01s6awzzdncn";

    const map = new mapboxgl.Map({
      container: mapPickerRef.current,
      style: savedStyle,
      center: [centerLng, centerLat],
      zoom: catchLat ? 14 : 5,
    });

    mapInstanceRef.current = map;

    // Add draggable marker
    const marker = new mapboxgl.Marker({
      draggable: true,
      color: "#4A90E2",
    })
      .setLngLat([centerLng, centerLat])
      .addTo(map);

    markerRef.current = marker;

    // Update coords when marker is dragged
    marker.on("dragend", () => {
      const lngLat = marker.getLngLat();
      setCatchLat(lngLat.lat);
      setCatchLng(lngLat.lng);
    });

    // Allow clicking on map to move marker
    map.on("click", (e) => {
      marker.setLngLat(e.lngLat);
      setCatchLat(e.lngLat.lat);
      setCatchLng(e.lngLat.lng);
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [showMapPicker]);

  // Handle confirming the pin drop location
  const handleConfirmLocation = () => {
    setShowMapPicker(false);
    setLocationStatus("success");
    // Check for lake match at new coordinates
    checkLakeMatch(catchLat, catchLng);
    // Fetch weather for the new location
    autoFetchWeather(catchLat, catchLng, caughtAt);
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setExifStatus("extracting");
    setSource((entry?.source as any) || initialSource);
    try {
      const exif = await extractExifData(file);
      let foundLoc = false;
      let foundTime = false;
      if (exif.latitude && exif.longitude) {
        setCatchLat(exif.latitude);
        setCatchLng(exif.longitude);
        setLocationStatus("exif");
        foundLoc = true;
        checkLakeMatch(exif.latitude, exif.longitude);
      }
      if (exif.dateTime) {
        setCaughtAt(exif.dateTime.toISOString());
        foundTime = true;
      }
      if (foundLoc && foundTime) {
        setExifStatus("found-all");
        setShowManualDateTime(false);
        // Fetch historical weather for this specific time/location
        autoFetchWeather(
          exif.latitude!,
          exif.longitude!,
          exif.dateTime!.toISOString(),
        );
      } else if (foundLoc) {
        setExifStatus("found-all");
        setShowManualDateTime(true); // Show time picker - has location but no time
      } else if (foundTime) {
        setExifStatus("found-time");
        setShowManualDateTime(false); // Has time, just needs location
      } else {
        setExifStatus("none");
        setShowManualDateTime(true); // Show date/time pickers - no EXIF data
        // Reset to current date/time
        const now = new Date();
        setManualDate(now.toISOString().split('T')[0]);
        setManualTime(now.toTimeString().slice(0, 5));
        setCaughtAt(now.toISOString());
      }
    } catch (err) {
      console.warn("EXIF extraction failed:", err);
      setExifStatus("none");
    }
    // ... (Keep existing compression/upload logic)
    let fileToUpload = file;
    try {
      fileToUpload = await compressImage(file);
      const reader = new FileReader();
      reader.onload = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(fileToUpload);
    } catch (err) {
      const reader = new FileReader();
      reader.onload = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
    try {
      setIsUploading(true);

      let upload_url: string;
      let public_url: string;

      // Use mobile endpoint on native platforms
      if (isNativePlatform() && nativeAuth.userEmail && nativeAuth.userId) {
        const result = await getPresignedUrlMobile(
          fileToUpload.name,
          fileToUpload.type,
          nativeAuth.userEmail,
          nativeAuth.userId,
        );
        upload_url = result.upload_url;
        public_url = result.public_url;
      } else {
        const token = await getToken();
        if (!token) throw new Error("No token available");
        const result = await getPresignedUrl(
          fileToUpload.name,
          fileToUpload.type,
          token,
        );
        upload_url = result.upload_url;
        public_url = result.public_url;
      }

      await uploadFileToR2(upload_url, fileToUpload);
      setPhotoUrl(public_url);
      setIsUploading(false);
    } catch (err) {
      console.error("Upload failed:", err);
      // Save photo locally for later upload when back online
      if (photoPreview) {
        console.log("[Upload] Saving photo locally for offline sync");
        setPendingPhotoBase64(photoPreview);
        setUploadFailed(true);
      }
      setIsUploading(false);
    }
  };

  /**
   * Handle native camera/library photo capture (iOS/Android)
   * Uses Capacitor Camera plugin for native experience
   * When galleryOnly is true, skips camera option and goes straight to photo library
   */
  const handleNativePhoto = async () => {
    try {
      // If galleryOnly, force library selection; otherwise show camera+library prompt
      const result = await capturePhoto(galleryOnly ? 'library' : undefined);
      if (!result) return; // User cancelled

      const { file, source: photoSource } = result;
      setExifStatus("extracting");
      setSource(photoSource);

      // CAMERA vs LIBRARY have different location strategies:
      // - CAMERA: Device GPS is PRIMARY (you're at the catch location right now)
      // - LIBRARY: EXIF GPS is PRIMARY (photo was taken at a different time/place)

      if (photoSource === 'camera') {
        // CAMERA SOURCE: Get device GPS immediately (primary), use EXIF only for time
        console.log('[CatchForm] Camera source - using device GPS as primary');
        const now = new Date();
        setCaughtAt(now.toISOString());

        // Get device GPS first (primary location source for camera)
        if (navigator.geolocation) {
          setLocationStatus("loading");
          navigator.geolocation.getCurrentPosition(
            (position) => {
              console.log('[CatchForm] Device GPS success:', position.coords.latitude, position.coords.longitude);
              setCatchLat(position.coords.latitude);
              setCatchLng(position.coords.longitude);
              setLocationStatus("success");
              checkLakeMatch(position.coords.latitude, position.coords.longitude);
              autoFetchWeather(position.coords.latitude, position.coords.longitude, now.toISOString());
              setExifStatus("found-all"); // We have location from device
            },
            (err) => {
              console.warn('[CatchForm] Device GPS failed:', err);
              setLocationStatus("error");
              setExifStatus("none");
              // Fallback: try EXIF location
              extractExifData(file).then(exif => {
                if (exif.latitude && exif.longitude) {
                  setCatchLat(exif.latitude);
                  setCatchLng(exif.longitude);
                  setLocationStatus("exif");
                  checkLakeMatch(exif.latitude, exif.longitude);
                }
              }).catch(() => {});
            },
            { enableHighAccuracy: true, timeout: 15000 }
          );
        }
      } else {
        // LIBRARY SOURCE: Use EXIF data (primary), no device GPS fallback
        try {
          const exif = await extractExifData(file);
          let foundLoc = false;
          let foundTime = false;

          if (exif.latitude && exif.longitude) {
            setCatchLat(exif.latitude);
            setCatchLng(exif.longitude);
            setLocationStatus("exif");
            foundLoc = true;
            checkLakeMatch(exif.latitude, exif.longitude);
          }

          if (exif.dateTime) {
            setCaughtAt(exif.dateTime.toISOString());
            foundTime = true;
          }

          if (foundLoc && foundTime) {
            setExifStatus("found-all");
            autoFetchWeather(exif.latitude!, exif.longitude!, exif.dateTime!.toISOString());
          } else if (foundLoc) {
            setExifStatus("found-all");
          } else if (foundTime) {
            setExifStatus("found-time");
            // No GPS in EXIF for library photo - user should pick location on map
            // Don't use device GPS - that's where they are NOW, not where photo was taken
          } else {
            // No EXIF data - show manual date/time pickers
            setExifStatus("none");
            setShowManualDateTime(true);
            const now = new Date();
            setManualDate(now.toISOString().split('T')[0]);
            setManualTime(now.toTimeString().slice(0, 5));
            setCaughtAt(now.toISOString());
          }
        } catch (err) {
          console.warn("EXIF extraction failed:", err);
          setExifStatus("none");
          setShowManualDateTime(true);
          const now = new Date();
          setManualDate(now.toISOString().split('T')[0]);
          setManualTime(now.toTimeString().slice(0, 5));
          setCaughtAt(now.toISOString());
        }
      }

      // Small delay to let UI render before starting heavy compression
      await new Promise(resolve => setTimeout(resolve, 50));

      // Compress and convert to base64 (need base64 for offline fallback)
      let fileToUpload = file;
      let base64Data = "";

      // Helper to read file as base64
      const readAsBase64 = (f: File): Promise<string> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(f);
        });
      };

      try {
        fileToUpload = await compressImage(file);
        base64Data = await readAsBase64(fileToUpload);
        setPhotoPreview(base64Data);
      } catch (err) {
        base64Data = await readAsBase64(file);
        setPhotoPreview(base64Data);
      }

      // Upload to R2
      try {
        setIsUploading(true);

        let upload_url: string;
        let public_url: string;

        // Use mobile endpoint on native platforms
        if (isNativePlatform() && nativeAuth.userEmail && nativeAuth.userId) {
          const result = await getPresignedUrlMobile(
            fileToUpload.name,
            fileToUpload.type,
            nativeAuth.userEmail,
            nativeAuth.userId,
          );
          upload_url = result.upload_url;
          public_url = result.public_url;
        } else {
          const token = await getToken();
          if (!token) throw new Error("No token available");
          const result = await getPresignedUrl(
            fileToUpload.name,
            fileToUpload.type,
            token,
          );
          upload_url = result.upload_url;
          public_url = result.public_url;
        }

        console.log("[Upload] Starting R2 upload, size:", (fileToUpload.size / 1024).toFixed(1), "KB");
        await uploadFileToR2(upload_url, fileToUpload);
        console.log("[Upload] R2 upload success, public_url:", public_url);
        setPhotoUrl(public_url);
      } catch (err: any) {
        console.error("[Upload] Failed:", err?.message || err?.toString?.() || JSON.stringify(err));
        console.error("[Upload] Error details:", {
          name: err?.name,
          message: err?.message,
          status: err?.status,
          stack: err?.stack?.slice(0, 200),
        });
        // Save photo locally for later upload when back online
        // Use base64Data directly (not state) to avoid race condition
        if (base64Data) {
          console.log("[Upload] Saving photo locally for offline sync");
          setPendingPhotoBase64(base64Data);
          setUploadFailed(true);
        }
      } finally {
        setIsUploading(false);
      }
    } catch (err) {
      console.error("Native photo capture error:", err);
    }
  };

  /**
   * Handle photo button click - use native on iOS/Android, web file input on browser
   */
  const handlePhotoButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (isNativePlatform()) {
      // Use native camera/library picker
      handleNativePhoto();
    } else {
      // Fall back to web file input
      fileInputRef.current?.click();
    }
  };

  const handleSubmit = async () => {
    // Prevent duplicate submissions
    if (isSavingRef.current) {
      console.log('[CatchForm] Save already in progress, ignoring click');
      return;
    }
    if (!lure || !activeLake) return;
    isSavingRef.current = true;
    setIsResolving(true);
    try {
      const token = await getToken();
      let lakeId = activeLake.id;
      let lakeType = "unresolved";
      let finalLakeName = lakeName || activeLake.name;
      if (catchLat !== 0 || catchLng !== 0) {
        try {
          let resolution;
          console.log('[CatchLog] Lake resolve check:', {
            isNative: isNativePlatform(),
            hasEmail: !!nativeAuth.userEmail,
            hasUserId: !!nativeAuth.userId,
            hasToken: !!token,
            coords: { catchLat, catchLng }
          });
          if (isNativePlatform() && nativeAuth.userEmail && nativeAuth.userId) {
            // Use mobile endpoint for native platforms
            console.log('[CatchLog] Using mobile lake resolution');
            resolution = await resolveLakeMobile(catchLat, catchLng, nativeAuth.userEmail, nativeAuth.userId);
            console.log('[CatchLog] Mobile resolution result:', resolution);
          } else if (token) {
            // Use standard endpoint for web
            resolution = await resolveLake(catchLat, catchLng, token);
          }
          if (resolution?.resolved) {
            lakeType = resolution.lake_type;
            lakeId = resolution.lake_id || undefined;
            finalLakeName = resolution.lake_name || activeLake.name;
          } else {
            if (lakeName.trim()) finalLakeName = lakeName;
            else finalLakeName = "Unknown Water";
          }
        } catch (err) {
          console.warn("Lake resolution failed", err);
        }
      }
      const data: Partial<CatchEntry> = {
        lakeName: finalLakeName,
        lakeLat: activeLake.lat,
        lakeLng: activeLake.lng,
        catchLat: catchLat || activeLake.lat,
        catchLng: catchLng || activeLake.lng,
        lure,
        color: color || undefined,
        species,
        weight: weight ? parseFloat(weight) : undefined,
        length: length ? parseFloat(length) : undefined,
        notes: notes || undefined,
        photoUrl: photoUrl || undefined,
        imageData: photoPreview || undefined,
        pendingPhotoBase64: pendingPhotoBase64 || undefined, // Photo waiting to upload when online
        caughtAt,
        source,
        lakeId: lakeId,
        lakeType: lakeType as any,
        // Save Weather
        temp: temp ? parseFloat(temp) : undefined,
        windSpeed: windSpeed ? parseFloat(windSpeed) : undefined,
        pressure: pressure ? parseFloat(pressure) : undefined,
        skyCondition: sky || undefined,
      };
      // Save last used lure/color/species for next catch auto-population
      if (lure || color || species) {
        saveLastCatchDefaults(lure, color, species);
      }
      // Await the actual save - this is the key fix!
      const result = await onSave(data);
      console.log('[CatchForm] Save completed:', result ? 'success' : 'offline');
    } catch (e) {
      console.error('[CatchForm] Save error, using fallback:', e);
      // Fallback
      const fallbackData: Partial<CatchEntry> = {
        lakeName: lakeName || activeLake.name || "Unknown Water",
        lakeLat: activeLake.lat,
        lakeLng: activeLake.lng,
        catchLat: catchLat || activeLake.lat,
        catchLng: catchLng || activeLake.lng,
        lure,
        color: color || undefined,
        species,
        weight: weight ? parseFloat(weight) : undefined,
        length: length ? parseFloat(length) : undefined,
        notes: notes || undefined,
        photoUrl: photoUrl || undefined,
        imageData: photoPreview || undefined,
        pendingPhotoBase64: pendingPhotoBase64 || undefined, // Photo waiting to upload when online
        caughtAt,
        source,
        lakeId: activeLake.id,
        lakeType: "unresolved",
      };
      // Save last used lure/color/species for next catch auto-population
      if (lure || color || species) {
        saveLastCatchDefaults(lure, color, species);
      }
      await onSave(fallbackData);
    } finally {
      // Always reset saving state
      isSavingRef.current = false;
      setIsResolving(false);
    }
  };

  const canSubmit = lure && activeLake && !isResolving && !isUploading;

  return (
    <>
      <div className="catch-form-header">
        <button onClick={onCancel} className="catch-cancel-btn">
          Cancel
        </button>
        <span className="catch-form-title">
          {isEditing ? "Edit Catch" : "Log Catch"}
        </span>
        <div style={{ width: 60 }} />
      </div>
      <div className="catch-form-body">
        {/* PHOTO FIELD - First so user uploads image before entering details */}
        <div className="catch-form-field">
          <label className="catch-form-label">Photo</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            {...(source === "camera" ? { capture: "environment" as any } : {})}
            onChange={handleImageSelect}
            style={{ display: "none" }}
          />
          {photoPreview ? (
            <div className="catch-image-preview">
              <img src={photoPreview} alt="Preview" />
              <button
                type="button"
                onClick={() => {
                  setPhotoPreview("");
                  setPhotoUrl("");
                  setPendingPhotoBase64("");
                  setUploadFailed(false);
                  setExifStatus("idle");
                }}
                className="catch-image-remove"
              >
                <CloseIcon size={12} />
              </button>
              {isUploading && (
                <div
                  className="catch-exif-badge extracting"
                  style={{ bottom: 40 }}
                >
                  Uploading...
                </div>
              )}
              {exifStatus === "extracting" && !isUploading && (
                <div className="catch-exif-badge extracting">
                  Reading metadata...
                </div>
              )}
              {exifStatus === "found-all" && (
                <div className="catch-exif-badge found">
                  📍 Location & Time extracted
                </div>
              )}
              {exifStatus === "found-time" && (
                <div className="catch-exif-badge partial">
                  📅 Time extracted (No GPS)
                </div>
              )}
              {exifStatus === "none" && (
                <div className="catch-exif-badge none">
                  No GPS data in photo
                </div>
              )}
              {uploadFailed && pendingPhotoBase64 && (
                <div className="catch-exif-badge" style={{ background: "rgba(255, 165, 0, 0.9)", color: "#000" }}>
                  📶 Photo saved locally - will upload when online
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={handlePhotoButtonClick}
              className="catch-photo-btn"
            >
              <CameraIcon size={20} />
              <span>{isNativePlatform() ? "Add Photo" : "Upload Photo"}</span>
            </button>
          )}
        </div>

        {/* DATE/TIME PICKERS - Show when no EXIF time data */}
        {showManualDateTime && (
          <div className="catch-form-field">
            <label className="catch-form-label">When did you catch this?</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <input
                type="date"
                value={manualDate}
                onChange={(e) => {
                  setManualDate(e.target.value);
                  const combined = new Date(`${e.target.value}T${manualTime}:00`);
                  setCaughtAt(combined.toISOString());
                }}
                className="catch-form-input"
                style={{ colorScheme: 'dark' }}
              />
              <input
                type="time"
                value={manualTime}
                onChange={(e) => {
                  setManualTime(e.target.value);
                  const combined = new Date(`${manualDate}T${e.target.value}:00`);
                  setCaughtAt(combined.toISOString());
                }}
                className="catch-form-input"
                style={{ colorScheme: 'dark' }}
              />
            </div>
          </div>
        )}

        {/* LOCATION NAME - Show search when no location set yet */}
        <div className="catch-form-field">
          <label className="catch-form-label">Location Name</label>
          {locationStatus !== "success" && (exifStatus === "none" || locationStatus === "idle") ? (
            <LocationSearch
              initialValue={lakeName}
              placeholder={isAutoResolving ? "Checking location..." : "Search for a lake..."}
              lakesOnly={true}
              onSelect={(location) => {
                // Save form draft before navigating to pin drop
                saveCatchFormDraft({
                  lakeName: location.name,
                  lure,
                  color,
                  species,
                  weight,
                  length,
                  notes,
                  photoUrl,
                  photoPreview,
                  caughtAt,
                  source,
                  temp,
                  windSpeed,
                  pressure,
                  sky,
                  manualDate,
                  manualTime,
                });
                // Dismiss keyboard before navigation to prevent black space
                if (isNativePlatform()) {
                  Keyboard.hide().catch(() => {});
                }
                // Small delay to let keyboard dismiss complete
                setTimeout(() => {
                  // Navigate to LakeBuilder for pin drop on known lake
                  navigate("/lake-builder", {
                    state: {
                      mode: "catch_upload",
                      knownLake: true, // Flag to skip boundary drawing
                      suggestedName: location.name,
                      lat: location.latitude,
                      lng: location.longitude,
                      returnTo: "/insights",
                    },
                  });
                }, 100);
              }}
              onNotFound={(query) => {
                setPendingLakeQuery(query);
                if (isPro) {
                  // Pro users: prompt to add lake (will redirect to LakeBuilder)
                  setShowUpgradeModal(true);
                } else {
                  // Free users: show upgrade modal
                  setShowUpgradeModal(true);
                }
              }}
            />
          ) : (
            <input
              type="text"
              value={lakeName}
              onChange={(e) => setLakeName(e.target.value)}
              className="catch-form-input"
              placeholder={
                isAutoResolving
                  ? "Checking location..."
                  : "Name this location (e.g., My Secret Pond)"
              }
            />
          )}
        </div>

        {/* LURE/SPECIES/COLOR FIELDS */}
        <div className="catch-form-field">
          <label className="catch-form-label">Lure *</label>
          <select
            value={lure}
            onChange={(e) => setLure(e.target.value)}
            className="catch-form-select"
          >
            <option value="">Select a lure...</option>
            {Object.entries(LURE_GROUPS).map(([cat, lures]) => (
              <optgroup key={cat} label={cat}>
                {lures.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {/* ... (Skipping verbose fields for brevity, they remain unchanged) ... */}
        <div className="catch-form-field">
          <label className="catch-form-label">Species</label>
          <div className="catch-species-selector">
            {SPECIES_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`catch-species-btn ${species === opt.value ? "active" : ""}`}
                onClick={() => setSpecies(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* ✅ RESTORED COLOR FIELD */}
        <div className="catch-form-field">
          <label className="catch-form-label">Color (optional)</label>
          <select
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="catch-form-select"
          >
            <option value="">Select color...</option>
            {COLOR_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="catch-form-row">
          <div className="catch-form-field">
            <label className="catch-form-label">Weight (lbs)</label>
            <input
              type="number"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="catch-form-input"
              placeholder="0.0"
            />
          </div>
          <div className="catch-form-field">
            <label className="catch-form-label">Length (in)</label>
            <input
              type="number"
              step="0.25"
              value={length}
              onChange={(e) => setLength(e.target.value)}
              className="catch-form-input"
              placeholder="0"
            />
          </div>
        </div>

        {/* --- WEATHER SECTION (INSIGHTS) --- */}
        <div className="catch-section-divider">
          <span className="divider-label">Conditions</span>
        </div>
        <div className="catch-form-row three-col">
          <div className="catch-form-field">
            <label className="catch-form-label">Temp (°F)</label>
            <input
              type="number"
              value={temp}
              onChange={(e) => setTemp(e.target.value)}
              className="catch-form-input"
              placeholder={isFetchingWeather ? "..." : "--"}
            />
          </div>
          <div className="catch-form-field">
            <label className="catch-form-label">Wind (mph)</label>
            <input
              type="number"
              value={windSpeed}
              onChange={(e) => setWindSpeed(e.target.value)}
              className="catch-form-input"
              placeholder={isFetchingWeather ? "..." : "--"}
            />
          </div>
          <div className="catch-form-field">
            <label className="catch-form-label">Pressure</label>
            <input
              type="number"
              value={pressure}
              onChange={(e) => setPressure(e.target.value)}
              className="catch-form-input"
              placeholder={isFetchingWeather ? "..." : "--"}
            />
          </div>
        </div>

        <div className="catch-form-field">
          <label className="catch-form-label">Sky / Conditions</label>
          <input
            type="text"
            value={sky}
            onChange={(e) => setSky(e.target.value)}
            className="catch-form-input"
            placeholder={
              isFetchingWeather ? "Fetching history..." : "e.g. Sunny, Overcast"
            }
          />
        </div>

        {/* ... (Keep Location & Time fields) ... */}
        <div className="catch-form-field">
          <label className="catch-form-label">Catch Location</label>
          {showMapPicker ? (
            <div className="catch-map-picker">
              <div
                ref={mapPickerRef}
                style={{
                  width: "100%",
                  height: 200,
                  borderRadius: 12,
                  overflow: "hidden",
                }}
              />
              <p className="catch-map-picker-hint">
                Tap map or drag pin to set location
              </p>
              <div className="catch-map-picker-actions">
                <button
                  type="button"
                  onClick={() => setShowMapPicker(false)}
                  className="catch-map-picker-cancel"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmLocation}
                  className="catch-map-picker-confirm"
                >
                  Confirm Location
                </button>
              </div>
            </div>
          ) : locationStatus === "exif" || locationStatus === "success" ||
            (catchLat !== 0 && catchLng !== 0) ? (
            <div className="catch-location-display">
              <LocationIcon size={16} />
              <span>{formatCoord(catchLat, catchLng)}</span>
              {locationStatus === "exif" && (
                <span className="catch-location-source">From photo</span>
              )}
              <button
                type="button"
                onClick={() => setShowMapPicker(true)}
                className="catch-location-edit"
              >
                Edit
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowMapPicker(true)}
              className="catch-location-btn"
              disabled={locationStatus === "loading"}
            >
              <LocationIcon size={18} />
              <span>
                {locationStatus === "loading"
                  ? "Getting location..."
                  : locationStatus === "error"
                    ? "Set Location"
                    : "Set Location"}
              </span>
            </button>
          )}
        </div>

        {/* ✅ RESTORED TIME FIELD */}
        <div className="catch-form-field">
          <label className="catch-form-label">
            Time{" "}
            {exifStatus === "found-time" && (
              <span className="catch-form-hint-inline">(from photo)</span>
            )}
          </label>
          <div className="catch-time-display">
            {formatCatchDateTime(caughtAt)}
          </div>
        </div>

        <div className="catch-form-field">
          <label className="catch-form-label">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="catch-form-textarea"
            placeholder="Structure, technique, conditions..."
            rows={3}
          />
        </div>
      </div>
      <div className="catch-form-footer">
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="catch-save-btn"
        >
          {isUploading
            ? "Uploading Photo..."
            : isResolving
              ? "Resolving..."
              : isEditing
                ? "Save Changes"
                : "Save Catch"}
        </button>
      </div>

      {/* UPGRADE MODAL - Lake Not Found */}
      {showUpgradeModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowUpgradeModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: 320,
              padding: 32,
              textAlign: "center",
              borderRadius: 24,
              background: "rgba(15, 15, 20, 0.95)",
              backdropFilter: "blur(24px)",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 25px 60px rgba(0,0,0,0.6)",
            }}
          >
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: "50%",
                background: "rgba(74, 144, 226, 0.15)",
                color: "#4A90E2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
              }}
            >
              <LocationIcon size={30} />
            </div>
            <h3 style={{ margin: "0 0 10px", fontSize: "1.25rem", fontWeight: 700, color: "#fff" }}>
              {isPro ? "Add New Lake?" : "Pro Feature"}
            </h3>
            <p style={{ margin: "0 0 24px", opacity: 0.7, lineHeight: 1.5, fontSize: "0.95rem", color: "#fff" }}>
              {isPro
                ? `"${pendingLakeQuery}" isn't in our database. Add it from the map?`
                : "Upgrade to Pro to log catches on any water body"}
            </p>
            {isPro ? (
              <>
                <button
                  onClick={() => {
                    // Save form draft before navigating
                    saveCatchFormDraft({
                      lakeName,
                      lure,
                      color,
                      species,
                      weight,
                      length,
                      notes,
                      photoUrl,
                      photoPreview,
                      caughtAt,
                      source,
                      temp,
                      windSpeed,
                      pressure,
                      sky,
                      manualDate,
                      manualTime,
                      pendingLakeQuery,
                    });
                    setShowUpgradeModal(false);
                    // Dismiss keyboard before navigation to prevent black space
                    if (isNativePlatform()) {
                      Keyboard.hide().catch(() => {});
                    }
                    // Small delay to let keyboard dismiss complete
                    setTimeout(() => {
                      // Navigate to LakeBuilder with catch_upload mode
                      navigate("/lake-builder", {
                        state: {
                          mode: "catch_upload",
                          suggestedName: pendingLakeQuery,
                          returnTo: "/insights",
                          lat: 0, // Will be set by user pin drop
                          lng: 0,
                        },
                      });
                    }, 100);
                  }}
                  style={{
                    width: "100%",
                    padding: 14,
                    background: "linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)",
                    border: "none",
                    borderRadius: 16,
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: "1rem",
                    cursor: "pointer",
                    boxShadow: "0 8px 20px rgba(74, 144, 226, 0.3)",
                  }}
                >
                  Add Lake from Map
                </button>
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "rgba(255,255,255,0.4)",
                    marginTop: 16,
                    fontSize: "0.9rem",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    setShowUpgradeModal(false);
                    window.location.href = "/upgrade";
                  }}
                  style={{
                    width: "100%",
                    padding: 14,
                    background: "linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)",
                    border: "none",
                    borderRadius: 16,
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: "1rem",
                    cursor: "pointer",
                    boxShadow: "0 8px 20px rgba(74, 144, 226, 0.3)",
                  }}
                >
                  Upgrade to Unlock
                </button>
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "rgba(255,255,255,0.4)",
                    marginTop: 16,
                    fontSize: "0.9rem",
                    cursor: "pointer",
                  }}
                >
                  Not Now
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <style>{` 
        .catch-form-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; border-bottom: 1px solid rgba(255,255,255,0.06); background: rgba(18,18,24,0.92); }
        .catch-cancel-btn { border: none; background: transparent; color: rgba(255,255,255,0.65); font-weight: 600; font-size: 0.85rem; padding: 6px 10px; border-radius: 10px; cursor: pointer; transition: all 0.2s; }
        .catch-cancel-btn:hover { background: rgba(255,255,255,0.06); color: #fff; }
        .catch-form-title { font-weight: 700; font-size: 0.95rem; letter-spacing: 0.2px; color: #fff; }
        .catch-form-body { padding: 14px 16px 18px; overflow: auto; min-height: 400px; }
        .catch-form-field { display: flex; flex-direction: column; gap: 8px; margin-bottom: 14px; animation: fadeInField 0.2s ease-out; }
        @keyframes fadeInField { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
        .catch-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .catch-form-label { font-size: 0.78rem; font-weight: 700; color: rgba(255,255,255,0.6); letter-spacing: 0.2px; }
        .catch-form-input, .catch-form-select, .catch-form-textarea { width: 100%; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 10px 12px; color: #fff; outline: none; font-size: 0.9rem; transition: all 0.2s; }
        .catch-form-input:focus, .catch-form-select:focus, .catch-form-textarea:focus { border-color: rgba(74,144,226,0.55); box-shadow: 0 0 0 3px rgba(74,144,226,0.15); }
        .catch-form-select { appearance: none; background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.5)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e"); background-repeat: no-repeat; background-position: right 10px center; background-size: 16px; }
        .catch-form-select optgroup, .catch-form-select option { background: #1a1a1a; color: white; }
        .catch-photo-btn { width: 100%; display: flex; align-items: center; justify-content: center; gap: 10px; padding: 12px 14px; border-radius: 14px; border: 1px dashed rgba(255,255,255,0.18); background: rgba(255,255,255,0.03); color: rgba(255,255,255,0.8); font-weight: 700; cursor: pointer; transition: all 0.2s; }
        .catch-image-preview { position: relative; width: 100%; height: 300px; border-radius: 14px; overflow: hidden; border: 1px solid rgba(255,255,255,0.10); background: rgba(0,0,0,0.25); }
        .catch-image-preview img { width: 100%; height: 100%; object-fit: contain; }
        .catch-image-remove { position: absolute; top: 10px; right: 10px; width: 28px; height: 28px; border-radius: 10px; border: none; background: rgba(0,0,0,0.45); color: rgba(255,255,255,0.9); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; }
        .catch-exif-badge { position: absolute; left: 10px; bottom: 10px; padding: 6px 10px; border-radius: 999px; font-size: 0.75rem; font-weight: 700; border: 1px solid rgba(255,255,255,0.12); backdrop-filter: blur(10px); background: rgba(18,18,24,0.75); color: rgba(255,255,255,0.85); }
        .catch-exif-badge.extracting { border-color: rgba(74,144,226,0.25); color: rgba(74,144,226,0.95); }
        .catch-exif-badge.found { border-color: rgba(34,197,94,0.25); color: rgba(34,197,94,0.95); }
        .catch-exif-badge.partial { border-color: rgba(251,191,36,0.25); color: rgba(251,191,36,0.95); }
        .catch-exif-badge.none { border-color: rgba(255,255,255,0.10); color: rgba(255,255,255,0.70); }
        .catch-species-selector { display: flex; flex-wrap: wrap; gap: 8px; }
        .catch-species-btn { padding: 8px 10px; border-radius: 999px; border: 1px solid rgba(255,255,255,0.10); background: rgba(255,255,255,0.03); color: rgba(255,255,255,0.75); font-weight: 700; font-size: 0.8rem; cursor: pointer; transition: all 0.2s; }
        .catch-species-btn:hover { background: rgba(255,255,255,0.06); color: #fff; }
        .catch-species-btn.active { background: rgba(74,144,226,0.16); border-color: rgba(74,144,226,0.35); color: #4A90E2; }
        .catch-location-display { padding: 12px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; display: flex; align-items: center; gap: 8px; color: rgba(255,255,255,0.8); font-size: 0.9rem; }
        .catch-location-display.exif { border-color: rgba(16, 185, 129, 0.3); background: rgba(16, 185, 129, 0.1); }
        .catch-location-source { margin-left: auto; font-size: 0.65rem; padding: 2px 6px; border-radius: 4px; background: rgba(255, 255, 255, 0.1); color: rgba(255, 255, 255, 0.6); }
        .catch-location-refresh { margin-left: auto; font-size: 0.75rem; color: #4A90E2; background: transparent; border: none; cursor: pointer; text-decoration: underline; }
        .catch-location-edit { margin-left: auto; font-size: 0.75rem; color: #4A90E2; background: transparent; border: none; cursor: pointer; text-decoration: underline; }
        .catch-map-picker { display: flex; flex-direction: column; gap: 12px; }
        .catch-map-picker-hint { font-size: 0.75rem; color: rgba(255,255,255,0.5); text-align: center; margin: 0; }
        .catch-map-picker-actions { display: flex; gap: 10px; }
        .catch-map-picker-cancel { flex: 1; padding: 10px; border-radius: 10px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.7); font-weight: 600; cursor: pointer; }
        .catch-map-picker-confirm { flex: 1; padding: 10px; border-radius: 10px; background: rgba(74,144,226,0.2); border: 1px solid rgba(74,144,226,0.4); color: #4A90E2; font-weight: 700; cursor: pointer; }
        .catch-location-btn { width: 100%; padding: 12px; border-radius: 12px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); color: rgba(255, 255, 255, 0.8); cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s; }
        .catch-location-btn:hover { background: rgba(255, 255, 255, 0.1); border-color: rgba(255, 255, 255, 0.2); }
        .catch-time-display { padding: 12px 14px; background: rgba(255, 255, 255, 0.03); border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.06); color: rgba(255, 255, 255, 0.6); font-size: 0.9rem; }
        .catch-form-hint-inline { font-weight: 400; opacity: 0.5; font-size: 0.65rem; margin-left: 4px; }
        .catch-form-footer { padding: 12px 16px 16px; border-top: 1px solid rgba(255,255,255,0.06); background: rgba(18,18,24,0.92); }
        .catch-save-btn { width: 100%; padding: 12px 14px; border-radius: 14px; border: 1px solid rgba(74,144,226,0.35); background: rgba(74,144,226,0.14); color: #fff; font-weight: 800; cursor: pointer; transition: all .2s; }
        .catch-save-btn:hover { background: rgba(74,144,226,0.20); border-color: rgba(74,144,226,0.55); }
        .catch-save-btn:disabled { opacity: 0.45; cursor: not-allowed; }
        .catch-section-divider { display: flex; align-items: center; margin: 16px 0 12px; }
        .catch-section-divider::before, .catch-section-divider::after { content: ""; flex: 1; height: 1px; background: rgba(255,255,255,0.1); }
        .divider-label { padding: 0 10px; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.1em; color: rgba(255,255,255,0.4); font-weight: 700; }
        .catch-form-row.three-col { grid-template-columns: 1fr 1fr 1fr; }
      `}</style>
    </>
  );
}

// =============================================================================
// MAP PIN RENDERING LOGIC (Moved to bottom to fix TS hoisting)
// =============================================================================

export function createCatchMarker(
  entry: CatchEntry,
  allCatches: CatchEntry[],
  onClick: (entry: CatchEntry) => void,
): HTMLElement {
  const tier = getDensityTier(entry, allCatches);
  const config = DENSITY_CONFIG[tier];

  // 1. CONTAINER: Large touch target (44x44 minimum for iOS).
  const container = document.createElement("div");
  container.className = `catch-pin-container catch-pin-${tier}`;
  container.style.width = "44px";
  container.style.height = "44px";
  container.style.cursor = "pointer";
  container.style.overflow = "visible";
  container.style.display = "flex";
  container.style.alignItems = "center";
  container.style.justifyContent = "center";

  // 2. INNER VISUAL: The actual pin (16px centered in 44px touch target).
  const visual = document.createElement("div");
  visual.className = "catch-pin-visual";
  visual.style.position = "relative";
  visual.style.overflow = "visible";
  visual.style.width = "16px";
  visual.style.height = "16px";
  visual.style.background = `radial-gradient(circle at 35% 35%, ${config.color}ff, ${config.color}cc 60%, ${config.color}99)`;
  visual.style.borderRadius = "50%";
  visual.style.boxShadow = `0 0 ${config.glowRadius}px ${config.color}, 0 0 ${config.glowRadius * 2}px ${config.color}60`;
  visual.style.border = "2px solid rgba(255, 255, 255, 0.85)";

  visual.style.transition =
    "transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s ease";
  visual.style.transformOrigin = "center center";

  // Radar ping animation - multiple rings for higher density
  // sparse: 1 ring, moderate: 2 rings, hot: 3 rings
  const baseDelay = Math.random() * 1.5; // Stagger between pins
  for (let i = 0; i < config.pingCount; i++) {
    const ping = document.createElement("div");
    ping.className = "catch-pin-ping";
    // Stagger each ring within the same pin
    const ringDelay = baseDelay + (i * config.pingSpeed / config.pingCount);
    ping.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) scale(0.5);
      width: 100%;
      height: 100%;
      border-radius: 50%;
      border: ${tier === "hot" ? "2.5px" : "2px"} solid ${config.color};
      box-shadow: 0 0 8px ${config.color}90, inset 0 0 4px ${config.color}40;
      -webkit-animation: catch-ping-${tier} ${config.pingSpeed}s infinite cubic-bezier(0, 0.5, 0.5, 1);
      animation: catch-ping-${tier} ${config.pingSpeed}s infinite cubic-bezier(0, 0.5, 0.5, 1);
      -webkit-animation-delay: ${ringDelay}s;
      animation-delay: ${ringDelay}s;
      pointer-events: none;
    `;
    visual.appendChild(ping);
  }

  container.appendChild(visual);

  // Handle both click and touch for better mobile response
  const handleTap = (e: Event) => {
    e.stopPropagation();
    e.preventDefault();
    onClick(entry);
  };

  container.addEventListener("click", handleTap);
  container.addEventListener("touchend", handleTap, { passive: false });

  return container;
}

export function injectCatchPinStyles(): void {
  const styleId = "catch-pin-styles";
  if (document.getElementById(styleId)) return;

  const style = document.createElement("style");
  style.id = styleId;
  style.textContent = `
    /* Sparse: Single sharp ping - amber ring */
    @-webkit-keyframes catch-ping-sparse {
      0% { -webkit-transform: translate(-50%, -50%) scale(0.5); transform: translate(-50%, -50%) scale(0.5); opacity: 0.9; }
      20% { opacity: 0.8; }
      100% { -webkit-transform: translate(-50%, -50%) scale(3.0); transform: translate(-50%, -50%) scale(3.0); opacity: 0; }
    }
    @keyframes catch-ping-sparse {
      0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0.9; }
      20% { opacity: 0.8; }
      100% { transform: translate(-50%, -50%) scale(3.0); opacity: 0; }
    }
    /* Moderate: Double ping - orange rings */
    @-webkit-keyframes catch-ping-moderate {
      0% { -webkit-transform: translate(-50%, -50%) scale(0.5); transform: translate(-50%, -50%) scale(0.5); opacity: 0.95; }
      15% { opacity: 0.85; }
      100% { -webkit-transform: translate(-50%, -50%) scale(3.5); transform: translate(-50%, -50%) scale(3.5); opacity: 0; }
    }
    @keyframes catch-ping-moderate {
      0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0.95; }
      15% { opacity: 0.85; }
      100% { transform: translate(-50%, -50%) scale(3.5); opacity: 0; }
    }
    /* Hot: Triple ping - red rings, maximum visibility */
    @-webkit-keyframes catch-ping-hot {
      0% { -webkit-transform: translate(-50%, -50%) scale(0.5); transform: translate(-50%, -50%) scale(0.5); opacity: 1; }
      10% { opacity: 0.9; }
      100% { -webkit-transform: translate(-50%, -50%) scale(4.0); transform: translate(-50%, -50%) scale(4.0); opacity: 0; }
    }
    @keyframes catch-ping-hot {
      0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; }
      10% { opacity: 0.9; }
      100% { transform: translate(-50%, -50%) scale(4.0); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
}

export function createCatchMarkers(
  map: mapboxgl.Map,
  catches: CatchEntry[],
  onPinClick: (entry: CatchEntry) => void,
): mapboxgl.Marker[] {
  injectCatchPinStyles();

  const markers = catches.map((entry) => {
    const el = createCatchMarker(entry, catches, onPinClick);

    // Create marker but don't add to map yet
    const marker = new mapboxgl.Marker({ element: el }).setLngLat([
      entry.catchLng,
      entry.catchLat,
    ]);

    marker.addTo(map);
    return marker;
  });

  // Initial visibility update
  updateCatchMarkersForZoom(map, markers);

  // Setup zoom listener
  const onZoom = () => updateCatchMarkersForZoom(map, markers);
  map.on("zoom", onZoom);

  // Store cleanup function
  (markers as any)._zoomCleanup = () => map.off("zoom", onZoom);

  return markers;
}

function updateCatchMarkersForZoom(
  map: mapboxgl.Map,
  markers: mapboxgl.Marker[],
): void {
  const zoom = map.getZoom();
  const MIN_ZOOM = 9;
  const MAX_ZOOM = 14;

  if (typeof zoom !== "number") return;

  const scale = Math.min(
    1,
    Math.max(0.4, ((zoom - MIN_ZOOM) / (MAX_ZOOM - MIN_ZOOM)) * 0.6 + 0.4),
  );
  const opacity = zoom < MIN_ZOOM ? 0 : 1;

  markers.forEach((marker) => {
    const container = marker.getElement();
    if (container) {
      // Target the visual child, NOT the container itself
      const visual = container.firstElementChild as HTMLElement;
      if (visual) {
        visual.style.transform = `scale(${scale})`;
        visual.style.opacity = String(opacity);
      }

      // Handle pointer events on the container
      container.style.pointerEvents = opacity < 0.1 ? "none" : "auto";
    }
  });
}

export function removeCatchMarkers(markers: mapboxgl.Marker[]): void {
  if ((markers as any)._zoomCleanup) {
    (markers as any)._zoomCleanup();
  }
  markers.forEach((m) => m.remove());
}
