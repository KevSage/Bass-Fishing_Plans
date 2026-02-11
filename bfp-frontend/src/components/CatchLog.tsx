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
} from "@/components/UnifiedIcons";

// API and EXIF imports
import { usePlatformAuth } from "@/hooks/usePlatformAuth";
import { useNativeAuth } from "@/context/NativeAuthContext";
import { isNativePlatform } from "@/lib/platform";
import {
  createCatch,
  listCatches,
  listCatchesMobile,
  deleteCatch as deleteCatchApi,
  updateCatch as updateCatchApi,
  resolveLake,
  type CatchRecord,
  type CreateCatchInput,
  getPresignedUrl,
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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

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
  caughtAt: string;
  createdAt: string;
  source: "camera" | "library" | "manual";
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
  if (!API_BASE_URL) return null;

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
      url = `${API_BASE_URL}/weather/history?lat=${cleanLat}&lon=${cleanLng}&dt=${unixTimestamp}`;
      console.log('[Weather] Fetching historical weather for:', new Date(catchTime).toISOString());
    } else {
      // Use current weather endpoint
      url = `${API_BASE_URL}/weather/current?lat=${cleanLat}&lon=${cleanLng}`;
      console.log('[Weather] Fetching current weather');
    }

    const res = await fetch(url);
    if (!res.ok) {
      console.warn('[Weather] API returned:', res.status);
      // Fall back to current weather if historical fails
      if (isHistorical) {
        console.log('[Weather] Falling back to current weather');
        const fallbackUrl = `${API_BASE_URL}/weather/current?lat=${cleanLat}&lon=${cleanLng}`;
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
  sparse: { min: 1, max: 3, color: "#F59E0B", pulseSpeed: 3 },
  moderate: { min: 4, max: 9, color: "#F97316", pulseSpeed: 2 },
  hot: { min: 10, max: Infinity, color: "#EF4444", pulseSpeed: 1.2 },
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
    if (globalEntriesCache) {
      return {
        isOpen: false,
        view: "list",
        entries: globalEntriesCache,
        selectedEntry: null,
        isEditing: false,
        visibleCount: ENTRIES_PER_PAGE,
      };
    }
    const cached = localStorage.getItem(API_CACHE_KEY);
    const offline = localStorage.getItem(OFFLINE_KEY);
    const initialEntries = [
      ...(offline ? JSON.parse(offline) : []),
      ...(cached ? JSON.parse(cached) : []),
    ];
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
      const offline = getOfflineCatches();
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
          globalEntriesCache = [...offline, ...apiEntries];
          localStorage.setItem(API_CACHE_KEY, JSON.stringify(apiEntries));
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
            globalEntriesCache = [...offline, ...apiEntries];
            localStorage.setItem(API_CACHE_KEY, JSON.stringify(apiEntries));
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
      setState((s) => ({ ...s, entries: [...offline, ...apiEntries] }));
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getOfflineCatches, state.entries.length, nativeAuth.userEmail, nativeAuth.userId]);

  useEffect(() => {
    // On native, also check that we have the email/userId before fetching
    if (isNativePlatform()) {
      if (isSignedIn && nativeAuth.userEmail && nativeAuth.userId) {
        fetchCatches();
      }
    } else {
      if (isSignedIn) fetchCatches();
    }
  }, [fetchCatches, isSignedIn, nativeAuth.userEmail, nativeAuth.userId]);

  const syncOfflineCatches = useCallback(async () => {
    const offline = getOfflineCatches();
    if (offline.length === 0) return;
    setIsLoading(true);
    const token = await getToken();
    if (!token) {
      setIsLoading(false);
      return;
    }
    const remaining: CatchEntry[] = [];
    let syncedCount = 0;
    for (const entry of offline) {
      try {
        const input = entryToApiInput(entry, activeLake);
        input.source = entry.source || "manual";
        await createCatch(input, token);
        syncedCount++;
      } catch (e) {
        remaining.push(entry);
      }
    }
    localStorage.setItem(OFFLINE_KEY, JSON.stringify(remaining));
    await fetchCatches();
    if (syncedCount > 0) alert(`Synced ${syncedCount} catches.`);
    setIsLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLake, fetchCatches, getOfflineCatches]);

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
    (entry?: CatchEntry) =>
      setState((s) => ({
        ...s,
        isOpen: true,
        view: "form",
        selectedEntry: entry || null,
        isEditing: !!entry?.id,
      })),
    [],
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
        const token = await getToken();
        if (!token) throw new Error("Offline");
        const input = entryToApiInput(catchData, activeLake);
        const response = await createCatch(input, token);
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
      } catch (err) {
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
      const updatedEntries = state.entries.map((c) =>
        c.id === id ? { ...c, ...updates } : c,
      );
      globalEntriesCache = updatedEntries;
      setState((s) => ({
        ...s,
        entries: updatedEntries,
        selectedEntry: updatedEntries.find((c) => c.id === id) || null,
        view: "detail",
        isEditing: false,
      }));
      try {
        const token = await getToken();
        if (token) {
          const currentEntry = state.entries.find((e) => e.id === id);
          if (currentEntry) {
            const merged = { ...currentEntry, ...updates };
            const apiInput = entryToApiInput(merged, activeLake);
            await updateCatchApi(id, apiInput, token);
            fetchCatches();
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
        const token = await getToken();
        if (token) {
          await deleteCatchApi(id, token);
          const apiOnly = remaining.filter((c) => !c.isOffline);
          localStorage.setItem(API_CACHE_KEY, JSON.stringify(apiOnly));
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
              onSave={(data) => {
                if (isEditing && selectedEntry) {
                  updateCatch(selectedEntry.id, data);
                } else {
                  addCatch(data as Omit<CatchEntry, "id" | "createdAt">);
                  if (!selectedEntry?.id) onDraftDone?.();
                  if (disableListView) close();
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
      <style>{` .catch-modal-overlay { position: fixed; inset: 0; z-index: 2500; background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; padding: 16px; } .catch-modal { width: 100%; max-width: 380px; max-height: 86vh; border-radius: 24px; background: rgba(18, 18, 24, 0.95); backdrop-filter: blur(24px); border: 1px solid rgba(255, 255, 255, 0.08); box-shadow: 0 25px 60px rgba(0, 0, 0, 0.6); display: flex; flex-direction: column; overflow: hidden; color: white; } `}</style>
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
  return (
    <>
      <div className="catch-modal-header">
        <div className="catch-header-title">
          <FishIcon size={20} /> <span>Catch Log</span>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {hasOffline && onSync && (
            <button onClick={onSync} className="catch-sync-btn">
              <RefreshIcon size={16} /> <span>Sync</span>
            </button>
          )}
          <button onClick={onClose} className="catch-close-btn">
            <CloseIcon />
          </button>
        </div>
      </div>
      {activeLake && (
        <div className="catch-lake-context">{activeLake.name}</div>
      )}
      <div className="catch-modal-body">
        {hasOffline && (
          <div className="catch-offline-banner">
            <CloudOffIcon size={14} />{" "}
            <span>Sync when you have reception.</span>
          </div>
        )}
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
      <style>{` .catch-modal-header { padding: 20px 24px; border-bottom: 1px solid rgba(255, 255, 255, 0.06); display: flex; justify-content: space-between; align-items: center; color: white; } .catch-header-title { display: flex; align-items: center; gap: 10px; font-weight: 700; font-size: 1.05rem; } .catch-close-btn { width: 36px; height: 36px; border-radius: 10px; border: none; background: rgba(255, 255, 255, 0.05); color: rgba(255, 255, 255, 0.6); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; } .catch-close-btn:hover { background: rgba(255, 255, 255, 0.1); color: #fff; } .catch-lake-context { padding: 12px 24px; background: rgba(74, 144, 226, 0.1); color: #4A90E2; font-size: 0.85rem; font-weight: 600; border-bottom: 1px solid rgba(255, 255, 255, 0.06); } .catch-modal-body { flex: 1; overflow-y: auto; padding: 16px; } .catch-empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 48px 24px; color: rgba(255, 255, 255, 0.4); text-align: center; gap: 12px; } .catch-empty-state p { margin: 0; font-size: 1rem; color: rgba(255, 255, 255, 0.6); } .catch-empty-state span { font-size: 0.85rem; } .catch-list { display: flex; flex-direction: column; gap: 8px; } .catch-list-item { display: flex; align-items: center; gap: 12px; padding: 12px; background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 14px; cursor: pointer; transition: all 0.2s; text-align: left; width: 100%; } .catch-list-item:hover { background: rgba(255, 255, 255, 0.06); border-color: rgba(255, 255, 255, 0.1); } .catch-item-thumb { width: 52px; height: 52px; border-radius: 10px; overflow: hidden; flex-shrink: 0; background: rgba(0, 0, 0, 0.3); position: relative; object-fit: contain; } .catch-item-species { margin-left: 8px; font-size: 0.7rem; color: rgba(255, 255, 255, 0.4); text-transform: uppercase; letter-spacing: 0.05em; } .catch-item-thumb img { width: 100%; height: 100%; object-fit: cover; } .catch-item-no-img { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: rgba(255, 255, 255, 0.2); } .catch-item-info { flex: 1; min-width: 0; } .catch-item-time { font-size: 0.95rem; font-weight: 600; color: #fff; } .catch-item-details { font-size: 0.8rem; color: rgba(255, 255, 255, 0.5); margin-top: 2px; } .catch-item-date { font-size: 0.75rem; color: rgba(255, 255, 255, 0.35); flex-shrink: 0; } .catch-load-more { width: 100%; padding: 14px; margin-top: 8px; border: 1px dashed rgba(255, 255, 255, 0.15); border-radius: 12px; background: transparent; color: rgba(255, 255, 255, 0.5); font-size: 0.9rem; font-weight: 600; cursor: pointer; transition: all 0.2s; } .catch-load-more:hover { border-color: rgba(255, 255, 255, 0.25); color: rgba(255, 255, 255, 0.7); background: rgba(255, 255, 255, 0.03); } .catch-modal-footer { padding: 16px 24px 24px; border-top: 1px solid rgba(255, 255, 255, 0.06); } .catch-add-btn { width: 100%; padding: 16px; border-radius: 14px; border: none; background: linear-gradient(135deg, #4A90E2 0%, #357ABD 100%); color: #fff; font-size: 1rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s; box-shadow: 0 8px 24px rgba(74, 144, 226, 0.25); } .catch-sync-btn { display: flex; align-items: center; gap: 6px; padding: 0 12px; height: 36px; border-radius: 10px; border: 1px solid rgba(245, 158, 11, 0.3); background: rgba(245, 158, 11, 0.1); color: #FBBF24; font-size: 0.8rem; font-weight: 600; cursor: pointer; } .catch-offline-banner { margin-bottom: 12px; padding: 10px 12px; border-radius: 10px; background: rgba(245, 158, 11, 0.1); border: 1px dashed rgba(245, 158, 11, 0.3); color: #FBBF24; font-size: 0.75rem; display: flex; align-items: center; gap: 8px; } .catch-list-item.is-offline { border-style: dashed; border-color: rgba(245, 158, 11, 0.3); } .catch-item-offline-badge { position: absolute; bottom: 2px; right: 2px; background: #FBBF24; color: #000; width: 16px; height: 16px; border-radius: 50%; display: flex; align-items: center; justify-content: center; } `}</style>
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

  return (
    <div className="catch-detail-container">
      {/* 1. COMPACT HERO IMAGE (340px) */}
      <div className="catch-hero">
        {entry.photoUrl || entry.imageData ? (
          <img src={entry.photoUrl || entry.imageData} alt="Catch" />
        ) : (
          <div className="catch-hero-placeholder">
            <FishIcon size={56} style={{ opacity: 0.5 }} />
          </div>
        )}
        <div className="catch-hero-gradient" />
        <div className="catch-hero-overlay-top">
          <button onClick={onBack} className="catch-icon-btn glass">
            {readOnly ? <CloseIcon size={20} /> : <BackIcon size={20} />}
          </button>
          {!readOnly && (onEdit || onDelete) && (
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="catch-icon-btn glass"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="1" />
                  <circle cx="19" cy="12" r="1" />
                  <circle cx="5" cy="12" r="1" />
                </svg>
              </button>
              {showMenu && (
                <div className="catch-menu-dropdown">
                  {onEdit && (
                    <button
                      onClick={() => {
                        onEdit();
                        setShowMenu(false);
                      }}
                      className="catch-menu-item"
                    >
                      <EditIcon size={16} /> Edit Details
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => {
                        onDelete();
                        setShowMenu(false);
                      }}
                      className="catch-menu-item danger"
                    >
                      <TrashIcon size={16} /> Delete Catch
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2. CONTENT BODY - Pulled up tighter */}
      <div className="catch-body">
        {/* Header Grid */}
        <div className="catch-primary-header">
          <div className="catch-title-block">
            <h2 className="catch-lure-title">{formatLureName(entry.lure)}</h2>
            <div className="catch-subtitle">
              {formatCatchDate(entry.caughtAt)}
              <span className="separator">•</span>
              {formatCatchTime(entry.caughtAt)}
            </div>
          </div>
          {entry.weight && (
            <div className="catch-stat-stack">
              {isPB && (
                <div className="catch-pb-badge-mini">
                  <TrophyIcon size={10} /> <span>PB</span>
                </div>
              )}
              <div className="catch-stat-block">
                <span className="catch-stat-value">{entry.weight}</span>
                <span className="catch-stat-unit">LBS</span>
              </div>
            </div>
          )}
        </div>

        {/* Tags / Chips */}
        <div className="catch-tags-row">
          {entry.species && (
            <span className="catch-chip species">
              {getSpeciesLabel(entry.species)}
            </span>
          )}
          {entry.length && (
            <span className="catch-chip stat">{entry.length}" Length</span>
          )}
          {entry.color && (
            <span className="catch-chip color">
              {formatLureName(entry.color)}
            </span>
          )}
        </div>

        {/* NEW: WEATHER SUMMARY CARD */}
        {(entry.temp || entry.windSpeed || entry.pressure) && (
          <div className="catch-section">
            <div className="catch-weather-card">
              <div className="weather-row">
                <div className="weather-item">
                  <ThermometerIcon size={16} className="weather-icon" />
                  <span>
                    {entry.temp ? `${Math.round(entry.temp)}°` : "--"}
                  </span>
                </div>
                <div className="weather-item">
                  <WindIcon size={16} className="weather-icon" />
                  <span>
                    {entry.windSpeed
                      ? `${Math.round(entry.windSpeed)}mph`
                      : "--"}{" "}
                    {entry.windDir || ""}
                  </span>
                </div>
                <div className="weather-item">
                  <ActivityIcon size={16} className="weather-icon" />
                  <span>
                    {entry.pressure ? `${Math.round(entry.pressure)}mb` : "--"}
                  </span>
                </div>
              </div>
              {entry.skyCondition && (
                <div className="weather-condition">
                  {entry.skyCondition.includes("Rain") ? (
                    <DropletsIcon size={14} />
                  ) : entry.skyCondition.includes("Cloud") ? (
                    <CloudIcon size={14} />
                  ) : (
                    <SunIcon size={14} />
                  )}
                  <span>{entry.skyCondition}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="catch-divider" />

        {/* Location Card */}
        <div className="catch-section">
          <div className="catch-location-card">
            <div className="catch-loc-icon-wrapper">
              <LocationIcon size={18} />
            </div>
            <div className="catch-loc-details">
              <div className="catch-loc-name">{entry.lakeName}</div>
              <div className="catch-loc-coords">
                {formatCoord(entry.catchLat, entry.catchLng)}
              </div>
            </div>
            {(onLocationClick || onFlyToLocation) && (
              <button
                className="catch-map-btn"
                onClick={() =>
                  onLocationClick
                    ? onLocationClick()
                    : onFlyToLocation?.(entry.catchLat, entry.catchLng)
                }
              >
                View
              </button>
            )}
          </div>
        </div>

        {/* Notes */}
        {entry.notes && (
          <div className="catch-section">
            <h4 className="catch-section-label">Notes</h4>
            <div className="catch-notes-box">
              <p className="catch-notes-text">{entry.notes}</p>
            </div>
          </div>
        )}
      </div>

      <style>{`
        /* ... (Keep existing detailed styles from previous file, they were good) ... */
        .catch-detail-container { display: flex; flex-direction: column; height: 100%; background: #121218; overflow-y: auto; }
        .catch-hero { position: relative; width: 100%; height: clamp(250px, 40vh, 350px); flex-shrink: 0; background: #000; overflow: hidden; }
        .catch-hero img { width: 100%; height: 100%; object-fit: cover; }
        .catch-hero-gradient { position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 40%, #121218 100%); z-index: 1; }
        .catch-hero-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #1a1a2e 0%, #0f172a 100%); color: rgba(255,255,255,0.15); }
        .catch-hero-overlay-top { position: absolute; top: 0; left: 0; right: 0; padding: 16px; display: flex; justify-content: space-between; z-index: 20; }
        .catch-icon-btn { width: 40px; height: 40px; border-radius: 50%; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #fff; transition: all 0.2s; }
        .catch-icon-btn.glass { background: rgba(0, 0, 0, 0.4); backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.15); }
        .catch-icon-btn:hover { background: rgba(255,255,255,0.25); transform: scale(1.05); }
        .catch-menu-dropdown { position: absolute; top: 100%; right: 0; margin-top: 8px; background: #1a1a1a; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 4px; min-width: 140px; box-shadow: 0 10px 40px rgba(0,0,0,0.5); display: flex; flex-direction: column; gap: 2px; animation: fadeIn 0.1s ease-out; }
        .catch-menu-item { display: flex; align-items: center; gap: 8px; width: 100%; padding: 10px 12px; background: transparent; border: none; color: #fff; font-size: 0.9rem; font-weight: 500; text-align: left; border-radius: 8px; cursor: pointer; }
        .catch-menu-item:hover { background: rgba(255,255,255,0.1); }
        .catch-menu-item.danger { color: #f87171; }
        .catch-menu-item.danger:hover { background: rgba(220, 38, 38, 0.15); }
        .catch-body { padding: 0 24px 40px; position: relative; top: -40px; z-index: 2; }
        .catch-primary-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 20px; }
        .catch-title-block { flex: 1; padding-right: 12px; }
        .catch-lure-title { font-size: 2rem; font-weight: 800; color: #fff; margin: 0 0 6px 0; line-height: 1.1; letter-spacing: -0.02em; text-shadow: 0 4px 20px rgba(0,0,0,0.8); }
        .catch-subtitle { font-size: 0.9rem; color: rgba(255,255,255,0.8); font-weight: 500; display: flex; align-items: center; gap: 8px; text-shadow: 0 2px 4px rgba(0,0,0,0.8); }
        .separator { opacity: 0.5; }
        .catch-stat-stack { display: flex; flex-direction: column; align-items: flex-end; justify-content: flex-end; min-width: 70px; }
        .catch-pb-badge-mini { background: linear-gradient(135deg, #fbbf24 0%, #d97706 100%); color: #fff; padding: 3px 8px; border-radius: 8px; font-weight: 800; font-size: 0.6rem; letter-spacing: 0.05em; display: flex; align-items: center; gap: 4px; margin-bottom: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.3); }
        .catch-stat-value { display: block; font-size: 2.5rem; font-weight: 900; color: #fff; line-height: 1; letter-spacing: -0.03em; text-shadow: 0 4px 20px rgba(0,0,0,0.8); }
        .catch-stat-unit { font-size: 0.75rem; color: #60A5FA; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; text-shadow: 0 2px 4px rgba(0,0,0,0.8); }
        .catch-tags-row { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 24px; }
        .catch-chip { padding: 6px 14px; border-radius: 20px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.8); font-size: 0.8rem; font-weight: 600; }
        .catch-chip.species { background: rgba(52, 211, 153, 0.15); color: #6ee7b7; border-color: rgba(52, 211, 153, 0.3); }
        .catch-chip.stat { background: rgba(96, 165, 250, 0.15); color: #93c5fd; border-color: rgba(96, 165, 250, 0.3); }
        .catch-chip.color { background: rgba(167, 139, 250, 0.15); color: #c4b5fd; border-color: rgba(167, 139, 250, 0.3); } /* Added missing style for color chip */
        
        /* WEATHER CARD */
        .catch-weather-card {
          background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 12px; margin-bottom: 20px;
        }
        .weather-row { display: flex; justify-content: space-around; margin-bottom: 8px; }
        .weather-item { display: flex; flex-direction: column; align-items: center; gap: 4px; font-size: 0.85rem; color: rgba(255,255,255,0.9); font-weight: 600; }
        .weather-icon { color: #4A90E2; opacity: 0.9; }
        .weather-condition { display: flex; align-items: center; justify-content: center; gap: 6px; font-size: 0.8rem; color: rgba(255,255,255,0.6); padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.05); }

        .catch-divider { height: 1px; background: rgba(255,255,255,0.08); margin-bottom: 24px; }
        .catch-location-card { display: flex; align-items: center; padding: 14px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 14px; }
        .catch-loc-icon-wrapper { color: #4A90E2; padding: 8px; background: rgba(74, 144, 226, 0.1); border-radius: 10px; margin-right: 12px; }
        .catch-loc-details { flex: 1; }
        .catch-loc-name { font-size: 0.95rem; font-weight: 700; color: #fff; margin-bottom: 2px; }
        .catch-loc-coords { font-size: 0.8rem; color: rgba(255,255,255,0.5); font-family: monospace; }
        .catch-map-btn { padding: 6px 12px; background: transparent; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: #fff; font-size: 0.8rem; font-weight: 600; cursor: pointer; transition: all 0.2s; }
        .catch-map-btn:hover { background: rgba(255,255,255,0.1); border-color: #fff; }
        .catch-section-label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.15em; color: rgba(255,255,255,0.4); margin-bottom: 10px; font-weight: 700; }
        .catch-notes-box { background: rgba(255,255,255,0.02); padding: 14px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.04); }
        .catch-notes-text { font-size: 0.9rem; line-height: 1.6; color: rgba(255,255,255,0.8); white-space: pre-wrap; margin: 0; }
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
  onSave: (data: Partial<CatchEntry>) => void;
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
  const [isResolving, setIsResolving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isAutoResolving, setIsAutoResolving] = useState(false);

  // Weather Fetching State
  const [isFetchingWeather, setIsFetchingWeather] = useState(false);

  const [lakeName, setLakeName] = useState(
    entry?.lakeName ||
      (activeLake?.name === "Photo Upload" ? "" : activeLake?.name) ||
      "",
  );
  const [lure, setLure] = useState(entry?.lure || "");
  const [color, setColor] = useState(entry?.color || "");
  const [species, setSpecies] = useState<BassSpecies>(
    entry?.species || "largemouth",
  );
  const [weight, setWeight] = useState(entry?.weight?.toString() || "");
  const [length, setLength] = useState(entry?.length?.toString() || "");
  const [notes, setNotes] = useState(entry?.notes || "");
  const [source, setSource] = useState<"camera" | "library" | "manual">(
    entry?.source || initialSource,
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
  const [caughtAt, setCaughtAt] = useState(
    initialDateTime?.toISOString() ||
      entry?.caughtAt ||
      new Date().toISOString(),
  );
  const [exifStatus, setExifStatus] = useState<
    "idle" | "extracting" | "found-all" | "found-time" | "none"
  >("idle");
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const checkLakeMatch = async (lat: number, lng: number) => {
    try {
      setIsAutoResolving(true);
      const token = await getToken();
      if (!token) return;
      const resolution = await resolveLake(lat, lng, token);
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
        // Fetch historical weather for this specific time/location
        autoFetchWeather(
          exif.latitude!,
          exif.longitude!,
          exif.dateTime!.toISOString(),
        );
      } else if (foundLoc) {
        setExifStatus("found-all");
        // Fetch current weather for location? No, keep it manual if time unknown
      } else if (foundTime) {
        setExifStatus("found-time");
      } else {
        setExifStatus("none");
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
      const token = await getToken();
      if (!token) throw new Error("No token available");
      const { upload_url, public_url } = await getPresignedUrl(
        fileToUpload.name,
        fileToUpload.type,
        token,
      );
      await uploadFileToR2(upload_url, fileToUpload);
      setPhotoUrl(public_url);
      setIsUploading(false);
    } catch (err) {
      console.error("Upload failed:", err);
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

      // Extract EXIF data (same as web flow)
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
          autoFetchWeather(
            exif.latitude!,
            exif.longitude!,
            exif.dateTime!.toISOString(),
          );
        } else if (foundLoc) {
          setExifStatus("found-all");
        } else if (foundTime) {
          setExifStatus("found-time");
        } else {
          setExifStatus("none");
        }
      } catch (err) {
        console.warn("EXIF extraction failed:", err);
        setExifStatus("none");
      }

      // Compress and upload (same as web flow)
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

      // Upload to R2
      try {
        setIsUploading(true);
        const token = await getToken();
        if (!token) throw new Error("No token available");
        const { upload_url, public_url } = await getPresignedUrl(
          fileToUpload.name,
          fileToUpload.type,
          token,
        );
        await uploadFileToR2(upload_url, fileToUpload);
        setPhotoUrl(public_url);
      } catch (err) {
        console.error("Upload failed:", err);
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
    if (!lure || !activeLake) return;
    setIsResolving(true);
    try {
      const token = await getToken();
      let lakeId = activeLake.id;
      let lakeType = "unresolved";
      let finalLakeName = lakeName || activeLake.name;
      if (token && (catchLat !== 0 || catchLng !== 0)) {
        try {
          const resolution = await resolveLake(catchLat, catchLng, token);
          if (resolution.resolved) {
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
      onSave(data);
    } catch (e) {
      // Fallback
      const fallbackData: Partial<CatchEntry> = {
        // ... (Keep existing fallback)
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
        caughtAt,
        source,
        lakeId: activeLake.id,
        lakeType: "unresolved",
      };
      onSave(fallbackData);
    } finally {
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
        {/* ... (Keep existing Photo & Name fields) ... */}
        <div className="catch-form-field">
          <label className="catch-form-label">Location Name</label>
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
        </div>
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

        {/* ... (Keep existing Lure/Species/Color fields) ... */}
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
          {locationStatus === "exif" ? (
            <div className="catch-location-display exif">
              <LocationIcon size={16} />
              <span>{formatCoord(catchLat, catchLng)}</span>
              <span className="catch-location-source">From photo</span>
            </div>
          ) : locationStatus === "success" ||
            (catchLat !== 0 && catchLng !== 0) ? (
            <div className="catch-location-display">
              <LocationIcon size={16} />
              <span>{formatCoord(catchLat, catchLng)}</span>
              <button
                type="button"
                onClick={handleGetLocation}
                className="catch-location-refresh"
              >
                Refresh
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleGetLocation}
              className="catch-location-btn"
              disabled={locationStatus === "loading"}
            >
              <LocationIcon size={18} />
              <span>
                {locationStatus === "loading"
                  ? "Getting location..."
                  : locationStatus === "error"
                    ? "Retry Location"
                    : "Get Current Location"}
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
      <style>{` 
        .catch-form-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; border-bottom: 1px solid rgba(255,255,255,0.06); background: rgba(18,18,24,0.92); }
        .catch-cancel-btn { border: none; background: transparent; color: rgba(255,255,255,0.65); font-weight: 600; font-size: 0.85rem; padding: 6px 10px; border-radius: 10px; cursor: pointer; transition: all 0.2s; }
        .catch-cancel-btn:hover { background: rgba(255,255,255,0.06); color: #fff; }
        .catch-form-title { font-weight: 700; font-size: 0.95rem; letter-spacing: 0.2px; color: #fff; }
        .catch-form-body { padding: 14px 16px 18px; overflow: auto; }
        .catch-form-field { display: flex; flex-direction: column; gap: 8px; margin-bottom: 14px; }
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

  // 1. CONTAINER: Managed by Mapbox for positioning ONLY.
  const container = document.createElement("div");
  container.className = `catch-pin-container catch-pin-${tier}`;
  container.style.width = "14px";
  container.style.height = "14px";
  container.style.cursor = "pointer";

  // 2. INNER VISUAL: Managed by us for scaling/styling.
  const visual = document.createElement("div");
  visual.className = "catch-pin-visual";
  visual.style.width = "100%";
  visual.style.height = "100%";
  visual.style.background = `radial-gradient(circle at 30% 30%, ${config.color}, ${config.color}dd)`;
  visual.style.borderRadius = "50%";
  visual.style.boxShadow = `0 0 8px ${config.color}80`;
  visual.style.border = "2px solid rgba(255, 255, 255, 0.6)";

  visual.style.transition =
    "transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s ease";
  visual.style.transformOrigin = "center center";

  // Pulse animation
  const pulse = document.createElement("div");
  pulse.style.cssText = `
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 100%;
    height: 100%;
    border-radius: 50%;
    border: 2px solid ${config.color};
    animation: catch-pin-pulse-${tier} ${config.pulseSpeed}s infinite ease-out;
    pointer-events: none;
  `;

  visual.appendChild(pulse);
  container.appendChild(visual);

  container.addEventListener("click", (e) => {
    e.stopPropagation();
    onClick(entry);
  });

  return container;
}

export function injectCatchPinStyles(): void {
  const styleId = "catch-pin-styles";
  if (document.getElementById(styleId)) return;

  const style = document.createElement("style");
  style.id = styleId;
  style.textContent = `
    @keyframes catch-pin-pulse-sparse {
      0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.8; }
      100% { transform: translate(-50%, -50%) scale(2.5); opacity: 0; }
    }
    @keyframes catch-pin-pulse-moderate {
      0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.8; }
      100% { transform: translate(-50%, -50%) scale(2.5); opacity: 0; }
    }
    @keyframes catch-pin-pulse-hot {
      0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.8; }
      100% { transform: translate(-50%, -50%) scale(2.5); opacity: 0; }
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
