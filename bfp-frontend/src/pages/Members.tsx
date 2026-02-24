// src/pages/Members.tsx

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import { usePlatformAuth, usePlatformUser } from "@/hooks/usePlatformAuth";
import { useNativeAuth } from "@/context/NativeAuthContext";
import { isNativePlatform, getApiBaseUrl } from "@/lib/platform";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import "@/styles/members.css";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import polylabel from "polylabel";
import { MapLoadingScreen } from "@/components/MapLoadingScreen";
// API Imports
import { generateMemberPlan, RateLimitError } from "@/lib/api";
import {
  listFavorites,
  listFavoritesMobile,
  addFavorite,
  addFavoriteMobile,
  removeFavorite,
  removeFavoriteMobile,
  listCustomLakes,
  listCustomLakesMobile,
  createCustomLake,
  createCustomLakeMobile,
  updateCustomLake,
  type CustomLake,
  type FavoriteLake as ApiFavoriteLake,
} from "@/lib/catches-api";

import { useMemberStatus } from "@/hooks/useMemberStatus";
import { LocationSearch } from "@/components/LocationSearch";
import { PlanGenerationLoader } from "@/components/PlanGenerationLoader";
import { WeatherOverlay } from "@/components/WeatherOverlay";
import { MapTargetCard } from "@/features/map/map_target_card";
import { getWeatherSnapshot, hasWeatherChanged, type WeatherSnapshot } from "@/lib/map-target-logic";

// --- CATCH LOG IMPORTS ---
import {
  CatchLogModal,
  useCatchLog,
  createCatchMarkers,
  removeCatchMarkers,
  onEntriesUpdate,
  getGlobalEntries,
  type ActiveLake,
  type CatchEntry,
} from "@/components/CatchLog";

// --- IMAGE UTILS ---
import { compressImage } from "@/lib/image-utils";

// --- DATA IMPORT ---
import LAKES_DATA from "../data/lakes.json";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

// =============================================================================
// LURE POOL FOR USER SELECTION
// =============================================================================

// Helper to capitalize each word for display
const capitalize = (str: string) =>
  str.replace(/\b\w/g, (c) => c.toUpperCase());

const LURE_CATEGORIES = [
  {
    name: "Horizontal Reaction",
    lures: [
      "shallow crankbait",
      "mid crankbait",
      "deep crankbait",
      "lipless crankbait",
      "flat-sided crankbait",
      "chatterbait",
      "swim jig",
      "spinnerbait",
      "underspin",
      "paddle tail swimbait",
    ],
  },
  {
    name: "Vertical Reaction",
    lures: ["jerkbait", "blade bait", "jighead minnow"],
  },
  {
    name: "Bottom Contact",
    lures: [
      "texas rig",
      "carolina rig",
      "football jig",
      "casting jig",
      "shaky head",
      "ned rig",
    ],
  },
  {
    name: "Finesse",
    lures: ["neko rig", "wacky rig", "soft jerkbait", "dropshot"],
  },
  {
    name: "Topwater",
    lures: [
      "walking bait",
      "buzzbait",
      "whopper plopper",
      "wake bait",
      "hollow body frog",
      "popping frog",
      "popper",
    ],
  },
];

// =============================================================================
// ICONS & UI COMPONENTS
// =============================================================================

const LockIcon = ({
  size = 12,
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
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  </svg>
);

const StarIcon = ({
  size = 24,
  filled = false,
}: {
  size?: number;
  filled?: boolean;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth={filled ? "0" : "2"}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const PolygonIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
  </svg>
);

const CloudIcon = ({ size = 22 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    strokeWidth="1.5"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path
      d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const LightningIcon = ({ size = 20 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);
const CameraIcon = ({ size = 20 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);
const LogIcon = ({ size = 20 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    <line x1="8" y1="7" x2="16" y2="7" />
    <line x1="8" y1="11" x2="16" y2="11" />
    <line x1="8" y1="15" x2="12" y2="15" />
  </svg>
);
const RadarIcon = ({ size = 22 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 2a10 10 0 1 0 10 10" />
    <path d="M12 12a4 4 0 1 0 4 4" />
    <path d="M12 12v-8" />
  </svg>
);

// --- UPGRADE MODAL COMPONENT ---
function UpgradeModal({
  isOpen,
  onClose,
  message,
  sampleUrl = "/plan?token=FSt4LZJLD62XHHTmYOL1ZoWua6V34U9c9TGVbKt1vEU",
}: {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  sampleUrl?: string;
}) {
  const navigate = useNavigate();
  if (!isOpen) return null;

  const handleViewSample = () => {
    const DEV_SAMPLE_URL =
      "/plan?token=FSt4LZJLD62XHHTmYOL1ZoWua6V34U9c9TGVbKt1vEU";
    const PROD_SAMPLE_URL =
      "/plan?token=ByW0Xj_COI5ek3gimQnLQ6rsyrhkvGO9X7R8Aw6Rhus";
    const targetUrl = import.meta.env.PROD ? PROD_SAMPLE_URL : DEV_SAMPLE_URL;
    navigate(targetUrl);
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <div
        className="glass-panel modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 320,
          padding: 32,
          textAlign: "center",
          alignItems: "center",
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
            marginBottom: 20,
          }}
        >
          <LockIcon size={30} />
        </div>
        <h3
          style={{ margin: "0 0 10px 0", fontSize: "1.25rem", fontWeight: 700 }}
        >
          Pro Feature
        </h3>
        <p
          style={{
            margin: "0 0 24px 0",
            opacity: 0.7,
            lineHeight: 1.5,
            fontSize: "0.95rem",
          }}
        >
          {message}
        </p>
        <button
          onClick={() => navigate("/upgrade")}
          style={{
            width: "100%",
            padding: "14px",
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
          onClick={handleViewSample}
          style={{
            width: "100%",
            padding: "12px",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 12,
            color: "#fff",
            fontWeight: 600,
            marginTop: 12,
            cursor: "pointer",
          }}
        >
          View Sample Pro Plan
        </button>
        <button
          onClick={onClose}
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
      </div>
    </div>
  );
}

// =============================================================================
// TYPES & HELPERS
// =============================================================================

type LakeData = {
  name: string;
  state: string;
  city?: string;
  latitude: number;
  longitude: number;
  acres?: number;
  tier: number;
  id?: string;
  bbox?: [number, number, number, number];
  anchors?: { lat: number; lng: number }[];
};

type FavoriteLake = {
  id: string;
  lake_type: "known" | "custom";
  name: string;
  city?: string;
  state?: string;
  lat: number;
  lng: number;
  zoom: number;
  image?: string;
  acres?: number;
  tier?: number;
  anchors?: { lat: number; lng: number }[];
};

function isWaterFeature(f: mapboxgl.MapboxGeoJSONFeature): boolean {
  // Classic styles (dark-v11, outdoors-v12, etc.)
  if (f.source === "composite" && f.sourceLayer === "water") return true;

  // Mapbox Standard-based styles use different layer structure
  const layerId = (f.layer?.id || "").toLowerCase();
  if (layerId.includes("water")) return true;

  // Check source layer for water variants
  const sourceLayer = (f.sourceLayer || "").toLowerCase();
  if (sourceLayer.includes("water")) return true;

  return false;
}

const createOrbMarker = () => {
  const el = document.createElement("div");
  el.className = "orb-marker-map";
  return el;
};

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

function getMatchRadius(acres?: number): number {
  if (!acres) return 1000;
  if (acres > 30000) return 10000;
  if (acres > 10000) return 7500;
  if (acres > 5000) return 5000;
  return 1000;
}

function getZoomForLake(acres?: number): number {
  if (!acres) return 14;
  if (acres > 30000) return 10;
  if (acres > 10000) return 11;
  if (acres > 5000) return 12;
  if (acres > 1000) return 13;
  return 14;
}

function pointInPolygon(
  point: { lat: number; lng: number },
  polygon: { lat: number; lng: number }[],
): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng,
      yi = polygon[i].lat;
    const xj = polygon[j].lng,
      yj = polygon[j].lat;
    const intersect =
      yi > point.lat !== yj > point.lat &&
      point.lng <
        ((xj - xi) * (point.lat - yi)) / (yj - yi + Number.EPSILON) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function findWaterCenter(
  lake: { 
    lat: number; 
    lng: number; 
    latitude?: number;
    longitude?: number;
    anchors?: { lat: number; lng: number }[] 
  }
): { lat: number; lng: number } {
  /**
   * Find the optimal "visual center" of a lake.
   * For lakes with boundaries (anchors), uses Pole of Inaccessibility algorithm
   * to find the point inside the polygon that's furthest from all edges.
   * This ensures the center is always in water, even for irregular/branching lakes.
   * 
   * For lakes without boundaries, returns the stored lat/lng.
   */
  
  // Use stored coordinates if no polygon
  if (!lake.anchors || lake.anchors.length < 3) {
    return { 
      lat: lake.lat || lake.latitude || 0, 
      lng: lake.lng || lake.longitude || 0 
    };
  }
  
  try {
    // Convert to polylabel format: [[lng, lat], [lng, lat], ...]
    const polygon = [lake.anchors.map(a => [a.lng, a.lat])];
    
    // Get pole of inaccessibility (tolerance = 1.0 for precision)
    const [lng, lat] = polylabel(polygon, 1.0);
    
    return { lat, lng };
  } catch (err) {
    console.error("Error calculating water center:", err);
    // Fallback to stored coordinates
    return { 
      lat: lake.lat || lake.latitude || 0, 
      lng: lake.lng || lake.longitude || 0 
    };
  }
}


function findUserLakeByAnchors(
  lat: number,
  lng: number,
  userLakes: Array<CustomLake & { anchors?: { lat: number; lng: number }[] }>,
): (CustomLake & { anchors?: { lat: number; lng: number }[] }) | null {
  const p = { lat, lng };
  for (const lake of userLakes) {
    const anchors = (lake as any).anchors as
      | { lat: number; lng: number }[]
      | undefined;
    if (anchors && anchors.length >= 3) {
      if (pointInPolygon(p, anchors)) return lake as any;
    }
  }
  return null;
}

type PolygonMatchResult = {
  source: "custom" | "favorite" | "known";
  id: string;
  name: string;
  city?: string;
  state?: string;
  lat: number;
  lng: number;
  acres?: number;
} | null;

function findLakeByPolygon(
  lat: number,
  lng: number,
  customLakes: Array<CustomLake & { anchors?: { lat: number; lng: number }[] }>,
  favorites: FavoriteLake[],
): PolygonMatchResult {
  const p = { lat, lng };
  for (const lake of customLakes) {
    const anchors = (lake as any).anchors as
      | { lat: number; lng: number }[]
      | undefined;
    if (anchors && anchors.length >= 3 && pointInPolygon(p, anchors)) {
      const isFavorite = favorites.some((f) => f.id === lake.id);
      return {
        source: isFavorite ? "favorite" : "custom",
        id: lake.id,
        name: lake.name,
        city: lake.city || undefined,
        state: lake.state || undefined,
        lat: lake.lat,
        lng: lake.lng,
        acres: (lake as any).acres,
      };
    }
  }
  for (const lake of LAKES_DATA as LakeData[]) {
    const anchors = lake.anchors as { lat: number; lng: number }[] | undefined;
    if (anchors && anchors.length >= 3 && pointInPolygon(p, anchors)) {
      const favorite = favorites.find(
        (f) =>
          f.name.toLowerCase() === lake.name.toLowerCase() ||
          (Math.abs(f.lat - lake.latitude) < 0.01 &&
            Math.abs(f.lng - lake.longitude) < 0.01),
      );
      return {
        source: favorite ? "favorite" : "known",
        id: favorite?.id || lake.name,
        name: lake.name,
        city: lake.city,
        state: lake.state,
        lat: lake.latitude,
        lng: lake.longitude,
        acres: lake.acres,
      };
    }
  }
  return null;
}

function findNearestLake(lat: number, lng: number): LakeData | null {
  const bboxMatch = (LAKES_DATA as LakeData[]).find((l) => {
    if (!l.bbox) return false;
    const [minLng, minLat, maxLng, maxLat] = l.bbox;
    return lat >= minLng && lat <= maxLng && lng >= minLng && lng <= maxLng;
  });
  if (bboxMatch) return bboxMatch;
  let nearest: LakeData | null = null;
  let minDist = Infinity;
  const candidates = (LAKES_DATA as LakeData[]).filter(
    (l) =>
      Math.abs(l.latitude - lat) < 0.3 && Math.abs(l.longitude - lng) < 0.3,
  );
  for (const lake of candidates) {
    const dist = getDistanceMeters(lat, lng, lake.latitude, lake.longitude);
    const threshold = getMatchRadius(lake.acres);
    if (dist <= threshold && dist < minDist) {
      minDist = dist;
      nearest = lake;
    }
  }
  return nearest;
}

function findNearestFavorite(
  lat: number,
  lng: number,
  favorites: FavoriteLake[],
): FavoriteLake | null {
  let nearest: FavoriteLake | null = null;
  let minDist = Infinity;
  for (const fav of favorites) {
    const dist = getDistanceMeters(lat, lng, fav.lat, fav.lng);
    const threshold = getMatchRadius(fav.acres);
    if (dist <= threshold && dist < minDist) {
      minDist = dist;
      nearest = fav;
    }
  }
  return nearest;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function Members() {
  const { user } = usePlatformUser();
  const { getToken } = usePlatformAuth();
  const nativeAuth = useNativeAuth();
  const { isActive, isLoading: statusLoading, plansRemaining, refetch } = useMemberStatus();
  const navigate = useNavigate();
  const location = useLocation();
  const [dataVersion, setDataVersion] = useState(0);
  const [mapKey, setMapKey] = useState(0); // For forcing map re-init after navigation
  const [mapReady, setMapReady] = useState(false); // Triggers catch marker re-render when map loads
  const [searchParams, setSearchParams] = useSearchParams();

  // Refresh entitlements after purchase (critical for immediate Pro unlock)
  useEffect(() => {
    if (searchParams.get("upgraded") === "true") {
      refetch();
      searchParams.delete("upgraded");
      setSearchParams(searchParams, { replace: true });
    }
  }, []);

  // --- WEATHER STATE & CACHING ---
  const [showWeather, setShowWeather] = useState(false);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [tipReady, setTipReady] = useState(false);
  const [tipSeen, setTipSeen] = useState(false);

  // 🧠 CACHE: Persists weather data for 30 minutes
  const weatherCache = useRef<
    Record<
      string,
      {
        data: any;
        timestamp: number;
        snapshot: WeatherSnapshot | null; // For change detection
        tipSeen: boolean;
      }
    >
  >({});

  const CACHE_DURATION = 30 * 60 * 1000; // 30 Minutes
  const getGeoKey = (lat: number, lng: number) =>
    `${lat.toFixed(4)},${lng.toFixed(4)}`;

  // --- PERSISTENT STATE ---
  const [favorites, setFavorites] = useState<FavoriteLake[]>([]);
  const [customLakes, setCustomLakes] = useState<
    Array<CustomLake & { anchors?: { lat: number; lng: number }[] }>
  >([]);

  // NEW: Upgrade Modal State
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState<string>("");

  const triggerUpgrade = (msg: string) => {
    setUpgradeMessage(msg);
    setShowUpgradeModal(true);
  };

  // Lake Context Menu State
  const [lakeContextMenu, setLakeContextMenu] = useState<{
    lake: FavoriteLake;
    x: number;
    y: number;
  } | null>(null);

  // Home Lake ID (stored in localStorage, first position in switcher)
  const HOME_LAKE_KEY = "bc_home_lake_id";
  const [homeLakeId, setHomeLakeId] = useState<string | null>(() => {
    return localStorage.getItem(HOME_LAKE_KEY);
  });

  // Sort favorites to put home lake first
  const sortedFavorites = useMemo(() => {
    if (!homeLakeId) return favorites;
    const home = favorites.find(f => f.id === homeLakeId);
    if (!home) return favorites;
    return [home, ...favorites.filter(f => f.id !== homeLakeId)];
  }, [favorites, homeLakeId]);

  const setAsHomeLake = useCallback((lakeId: string) => {
    localStorage.setItem(HOME_LAKE_KEY, lakeId);
    setHomeLakeId(lakeId);
    setLakeContextMenu(null);
  }, []);

  // Long-press handlers for lake options menu
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const longPressTriggeredRef = useRef(false);

  const handleLongPressStart = useCallback((lake: FavoriteLake) => {
    longPressTriggeredRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      longPressTriggeredRef.current = true;
      // Haptic feedback on iOS via Capacitor
      try {
        import('@capacitor/haptics').then(({ Haptics, ImpactStyle }) => {
          Haptics.impact({ style: ImpactStyle.Medium });
        }).catch(() => {});
      } catch (err) {}
      setLakeContextMenu({ lake, x: 0, y: 0 }); // x,y not used now (centered)
    }, 500);
  }, []);

  const handleLongPressEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  // Derived suggestion data
  const lakeSuggestionsData = useMemo(() => {
    const base = (
      LAKES_DATA as Array<{ name: string; city?: string; state?: string }>
    ).map((l) => ({ name: l.name, city: l.city, state: l.state }));
    const user = (customLakes || []).map((l) => ({
      name: l.name,
      city: l.city ?? undefined,
      state: l.state ?? undefined,
    }));
    const seen = new Set<string>();
    const out: Array<{ name: string; city?: string; state?: string }> = [];
    for (const item of [...user, ...base]) {
      const key = `${(item.name || "").toLowerCase()}|${(item.state || "").toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(item);
    }
    return out;
  }, [customLakes]);

  // --- ONBOARDING STATE ---
  const [showTutorial, setShowTutorial] = useState(false);
  useEffect(() => {
    const hasSeen = localStorage.getItem("bc_has_seen_onboarding");
    if (!hasSeen) {
      setTimeout(() => setShowTutorial(true), 1000);
    }
  }, []);
  const dismissTutorial = () => {
    localStorage.setItem("bc_has_seen_onboarding", "true");
    setShowTutorial(false);
  };

  // --- WELCOME BANNER (for new signups) ---
  const [showWelcome, setShowWelcome] = useState(false);
  useEffect(() => {
    if (searchParams.get("welcome") === "true") {
      setShowWelcome(true);
      // Remove the query param from URL without reload
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
  }, [searchParams]);

  // Favorites Panel State
  const [showFavorites, setShowFavorites] = useState(false);

  // Theme detection based on map style
  const mapStyle = localStorage.getItem("bc_mapbox_style") || "mapbox://styles/kaiwenphoenix/cmlssh825005w01s6awzzdncn";
  const isLightTheme = mapStyle.includes("light-v11");

  // Get static-compatible style for thumbnails (custom styles don't work with Static API)
  const getStaticStyle = () => {
    if (mapStyle.includes("satellite")) return "mapbox/satellite-v9";
    if (mapStyle.includes("outdoors")) return "mapbox/outdoors-v12";
    return "mapbox/dark-v11"; // Default for custom dark or dark-v11
  };
  const staticStyle = getStaticStyle();

  // Plan State
  const [lastPlanUrl, setLastPlanUrl] = useState<string | null>(() =>
    localStorage.getItem("aiq_last_plan_url"),
  );
  const [lastPlanLake, setLastPlanLake] = useState<string | null>(() =>
    localStorage.getItem("aiq_last_plan_lake"),
  );

  // Strategy/Generate Modals
  const [showReplaceConfirm, setShowReplaceConfirm] = useState(false);
  const [showGenerateConfirm, setShowGenerateConfirm] = useState(false);

  // Lure Selection Mode (includes "view" to view existing plan)
  const [lureSelectionMode, setLureSelectionMode] = useState<"ai" | "user" | "view">("ai");
  const [userPrimaryLure, setUserPrimaryLure] = useState<string>("");
  const [userSecondaryLure, setUserSecondaryLure] = useState<string>("");

  // Rate Limiting / Loading
  const [rateLimitInfo, setRateLimitInfo] = useState<{
    message: string;
    secondsRemaining: number;
  } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Live Camera Draft
  const [draftEntry, setDraftEntry] = useState<Partial<any> | null>(null);
  const clearDraftEntry = useCallback(() => setDraftEntry(null), []);

  // Favorite Navigation State - persist to sessionStorage
  const [viewingFavoriteId, setViewingFavoriteIdState] = useState<string | null>(
    () => sessionStorage.getItem("aiq_active_lake_id"),
  );
  const setViewingFavoriteId = (id: string | null) => {
    if (id) {
      sessionStorage.setItem("aiq_active_lake_id", id);
    } else {
      sessionStorage.removeItem("aiq_active_lake_id");
    }
    setViewingFavoriteIdState(id);
  };

  // Ephemeral Name
  const [manualWaterName, setManualWaterName] = useState("");

  // Inputs
  const [inputMode, setInputMode] = useState<"search" | "manual">("search");
  const [waterName, setWaterName] = useState("");
  const [locationDetails, setLocationDetails] = useState<{
    city?: string;
    state?: string;
  }>({});
  const [selectedCoords, setSelectedCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [accessType, setAccessType] = useState<"boat" | "bank">("boat");

  // Map Refs
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const markerElementRef = useRef<HTMLDivElement | null>(null);
  const catchMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const liveCameraInputRef = useRef<HTMLInputElement>(null);

  const initialized = useRef(false);
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync refs
  const showModalRef = useRef(false);
  const showFavoritesRef = useRef(false);
  const viewingFavoriteIdRef = useRef<string | null>(null);
  const favoritesRef = useRef(favorites);
  const customLakesRef = useRef(customLakes);
  const pendingLakeSelectRef = useRef<string | null>(null);
  const initialSessionRestoreRef = useRef(false);

  useEffect(() => {
    showModalRef.current = showModal;
  }, [showModal]);
  useEffect(() => {
    showFavoritesRef.current = showFavorites;
  }, [showFavorites]);
  useEffect(() => {
    viewingFavoriteIdRef.current = viewingFavoriteId;
  }, [viewingFavoriteId]);
  useEffect(() => {
    favoritesRef.current = favorites;
  }, [favorites]);
  useEffect(() => {
    customLakesRef.current = customLakes;
  }, [customLakes]);

  // Handle Return from LakeBuilder
  const processedRefreshRef = useRef<number | null>(null);
  useEffect(() => {
    const refreshTimestamp = location.state?.timestamp;
    if (
      location.state?.refresh &&
      refreshTimestamp !== processedRefreshRef.current
    ) {
      processedRefreshRef.current = refreshTimestamp;
      setDataVersion((v) => v + 1);
      if (location.state.lakeId) {
        pendingLakeSelectRef.current = location.state.lakeId;
      }
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // --- API FETCHERS ---
  useEffect(() => {
    let mounted = true;
    async function fetchFavs() {
      try {
        let res;
        if (isNativePlatform() && nativeAuth.userEmail && nativeAuth.userId) {
          // Use mobile endpoint
          res = await listFavoritesMobile(nativeAuth.userEmail, nativeAuth.userId);
        } else {
          // Use web endpoint with JWT
          const token = await getToken();
          if (!token) return;
          res = await listFavorites(token);
        }

        if (mounted && res.favorites) {
          const mapped = res.favorites.map((f: any) => {
            // Known lakes: hydrate from LAKES_DATA (backend has no access to lakes.json)
            if (f.lake_type === "known") {
              const lakeData = (LAKES_DATA as LakeData[]).find(
                (l) => l.name === f.lake_id
              );
              if (lakeData) {
                const acres = lakeData.acres || undefined;
                const imageZoom = getZoomForLake(acres);
                return {
                  id: f.lake_id,
                  lake_type: "known",
                  name: lakeData.name,
                  lat: lakeData.latitude,
                  lng: lakeData.longitude,
                  city: lakeData.city,
                  state: lakeData.state,
                  acres: acres,
                  tier: lakeData.tier,
                  zoom: imageZoom,
                  image: `https://api.mapbox.com/styles/v1/${staticStyle}/static/${lakeData.longitude},${lakeData.latitude},${imageZoom},0/600x400?access_token=${MAPBOX_TOKEN}`,
                } as FavoriteLake;
              }
              return null;
            }
            // Custom lakes: already hydrated by backend
            const acres = f.acres || undefined;
            const imageZoom = getZoomForLake(acres);
            return {
              id: f.lake_id,
              lake_type: f.lake_type,
              name: f.name,
              lat: f.lat,
              lng: f.lng,
              city: f.city,
              state: f.state,
              acres: acres,
              tier: f.tier,
              zoom: imageZoom,
              image: `https://api.mapbox.com/styles/v1/${staticStyle}/static/${f.lng},${f.lat},${imageZoom},0/600x400?access_token=${MAPBOX_TOKEN}`,
            } as FavoriteLake;
          }).filter((f): f is FavoriteLake => f !== null);
          setFavorites(mapped);
        }
      } catch (err) {
        console.error("Error fetching favorites:", err);
      }
    }
    fetchFavs();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataVersion, nativeAuth.userEmail]);

  useEffect(() => {
    let mounted = true;
    async function fetchCustomLakes() {
      try {
        let res;
        if (isNativePlatform() && nativeAuth.userEmail && nativeAuth.userId) {
          // Use mobile endpoint
          res = await listCustomLakesMobile(nativeAuth.userEmail, nativeAuth.userId);
        } else {
          // Use web endpoint with JWT
          const token = await getToken();
          if (!token) return;
          res = await listCustomLakes(token);
        }

        if (!mounted) return;
        setCustomLakes((res.lakes as any) || []);
      } catch (err) {
        console.error("Error fetching custom lakes:", err);
      }
    }
    fetchCustomLakes();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataVersion, nativeAuth.userEmail]);

  // Handle pending lake selection after returning from LakeBuilder
  useEffect(() => {
    if (!pendingLakeSelectRef.current) return;
    if (favorites.length === 0) return;
    const targetId = pendingLakeSelectRef.current;
    const lakeIndex = favorites.findIndex((f) => f.id === targetId);
    const lake = lakeIndex >= 0 ? favorites[lakeIndex] : null;
    if (lake) {
      setWaterName(lake.name);
      setViewingFavoriteId(lake.id);
      setLocationDetails({ city: lake.city, state: lake.state });
      setSelectedCoords({ lat: lake.lat, lng: lake.lng });
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.flyTo({
            center: [lake.lng, lake.lat],
            zoom: getZoomForLake(lake.acres),
            duration: 2000,
          });
        }
      }, 300);
      pendingLakeSelectRef.current = null;
    }
  }, [favorites, dataVersion]);

  // Restore stored lake view when returning from another page
  useEffect(() => {
    // Only run once after favorites load
    if (initialSessionRestoreRef.current) return;
    if (favorites.length === 0) return;
    if (!mapRef.current) return;

    // Check if there's a stored viewingFavoriteId from sessionStorage
    const storedLakeId = viewingFavoriteId;
    if (!storedLakeId) return;

    // Don't restore if we have URL params (those take priority)
    const urlLat = searchParams.get("lat");
    const urlLng = searchParams.get("lng");
    if (urlLat && urlLng) {
      initialSessionRestoreRef.current = true;
      return;
    }

    // Find the stored lake in favorites
    const lake = favorites.find((f) => f.id === storedLakeId);
    if (!lake) {
      // Lake not found, clear the stored ID
      setViewingFavoriteId(null);
      initialSessionRestoreRef.current = true;
      return;
    }

    // Restore the lake view
    initialSessionRestoreRef.current = true;
    setWaterName(lake.name);
    setLocationDetails({ city: lake.city, state: lake.state });
    setSelectedCoords({ lat: lake.lat, lng: lake.lng });

    // Fly to the stored lake
    setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.flyTo({
          center: [lake.lng, lake.lat],
          zoom: getZoomForLake(lake.acres),
          duration: 1500,
        });
      }
    }, 500);
  }, [favorites, viewingFavoriteId, searchParams]);

  // Navigate to Home Lake on initial app load
  const initialHomeLakeNavigatedRef = useRef(false);
  useEffect(() => {
    // Only run once
    if (initialHomeLakeNavigatedRef.current) return;
    // Wait for map to be ready and favorites to load
    if (!mapReady || favorites.length === 0) return;

    // Don't navigate if we have URL params (those take priority)
    const urlLat = searchParams.get("lat");
    const urlLng = searchParams.get("lng");
    if (urlLat && urlLng) {
      initialHomeLakeNavigatedRef.current = true;
      return;
    }

    initialHomeLakeNavigatedRef.current = true;

    // If there's a viewingFavoriteId from session, fly to that lake
    if (viewingFavoriteId) {
      const sessionLake = favorites.find((f) => f.id === viewingFavoriteId);
      if (sessionLake && mapRef.current) {
        console.log("[Members] Restoring session lake:", sessionLake.name);
        // Also set the state in case it wasn't fully restored
        setWaterName(sessionLake.name);
        setLocationDetails({ city: sessionLake.city, state: sessionLake.state });
        setSelectedCoords({ lat: sessionLake.lat, lng: sessionLake.lng });
        mapRef.current.flyTo({
          center: [sessionLake.lng, sessionLake.lat],
          zoom: getZoomForLake(sessionLake.acres),
          duration: 1500,
        });
      }
      return;
    }

    // No session - find home lake: either stored homeLakeId or first favorite
    const homeId = localStorage.getItem(HOME_LAKE_KEY);
    const homeLake = homeId
      ? favorites.find((f) => f.id === homeId) || favorites[0]
      : favorites[0];

    if (!homeLake) return;

    // Navigate to home lake
    console.log("[Members] Initial navigation to home lake:", homeLake.name);
    setWaterName(homeLake.name);
    setViewingFavoriteId(homeLake.id);
    setLocationDetails({ city: homeLake.city, state: homeLake.state });
    setSelectedCoords({ lat: homeLake.lat, lng: homeLake.lng });

    // Fly to home lake - map is ready so we can fly immediately
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [homeLake.lng, homeLake.lat],
        zoom: getZoomForLake(homeLake.acres),
        duration: 1500,
      });
    }
  }, [mapReady, favorites, viewingFavoriteId, searchParams]);

  // --- DERIVED STATE ---
  const isCurrentLocationSaved = useMemo(() => {
    if (!selectedCoords) return false;
    return favorites.some(
      (lake) =>
        lake.name === waterName ||
        (Math.abs(lake.lat - selectedCoords.lat) < 0.001 &&
          Math.abs(lake.lng - selectedCoords.lng) < 0.001),
    );
  }, [favorites, selectedCoords, waterName]);

  const currentFavorite = useMemo(
    () => favorites.find((f) => f.id === viewingFavoriteId) || null,
    [favorites, viewingFavoriteId],
  );

  const hydrateLakeData = (
    name: string,
    lat: number,
    lng: number,
  ): LakeData | undefined => {
    const normalize = (s: string) => s.toLowerCase().replace("lake", "").trim();
    const query = normalize(name);
    
    // 1. Try EXACT name match first (highest priority)
    let match = (LAKES_DATA as LakeData[]).find(
      (l) => normalize(l.name) === query
    );
    if (match) return match;
    
    // 2. For lakes with boundaries, check if point is inside polygon
    for (const lake of LAKES_DATA as LakeData[]) {
      if (lake.anchors && lake.anchors.length >= 3) {
        if (pointInPolygon({ lat, lng }, lake.anchors as any)) {
          return lake;
        }
      }
    }
    
    // 3. Fuzzy name match (but avoid partial matches that are too broad)
    match = (LAKES_DATA as LakeData[]).find((l) => {
      const lakeName = normalize(l.name);
      // Both must be longer than 3 chars to avoid false matches like "bay", "arm", etc.
      if (query.length < 4 || lakeName.length < 4) return false;
      return lakeName.includes(query) || query.includes(lakeName);
    });
    if (match) return match;
    
    // 4. Finally, proximity for lakes without boundaries (tightened to 0.01°)
    match = (LAKES_DATA as LakeData[]).find((l) => {
      // If lake has boundaries, skip - polygon check already handled it
      if (l.anchors && l.anchors.length >= 3) {
        return false;
      }
      
      // For lakes without boundaries, use tight proximity
      return (
        Math.abs(l.latitude - lat) < 0.01 &&
        Math.abs(l.longitude - lng) < 0.01
      );
    });
    
    return match;
  };

  const activeLake = useMemo<ActiveLake | null>(() => {
    if (currentFavorite)
      return {
        name: currentFavorite.name,
        lat: currentFavorite.lat,
        lng: currentFavorite.lng,
        id: currentFavorite.id,
      };
    if (waterName && selectedCoords)
      return {
        name: waterName,
        lat: selectedCoords.lat,
        lng: selectedCoords.lng,
      };
    return null;
  }, [currentFavorite, waterName, selectedCoords]);

  const catchLog = useCatchLog(activeLake);
  const isCatchLogOpenRef = useRef(false);
  const lastDraftOpenedRef = useRef<string | null>(null);

  useEffect(() => {
    isCatchLogOpenRef.current = catchLog.isOpen;
  }, [catchLog.isOpen]);

  useEffect(() => {
    console.log("[LiveCamera] draftEntry useEffect triggered", {
      hasDraft: !!draftEntry,
      activeLake: activeLake?.name || "null",
      catchLogIsOpen: catchLog.isOpen,
    });

    // If no draft, reset tracking
    if (!draftEntry) {
      lastDraftOpenedRef.current = null;
      return;
    }

    // Wait for activeLake to be ready - it updates from the same state changes
    if (!activeLake) {
      console.log("[LiveCamera] Waiting for activeLake to be set");
      return;
    }

    // Don't open if already open
    if (catchLog.isOpen) {
      console.log("[LiveCamera] CatchLog already open, skipping");
      return;
    }

    const key = `${draftEntry.caughtAt ?? ""}|${draftEntry.lakeName ?? ""}`;
    console.log("[LiveCamera] Draft key:", key, "lastKey:", lastDraftOpenedRef.current);
    if (lastDraftOpenedRef.current === key) {
      console.log("[LiveCamera] Skipping - same key");
      return;
    }
    lastDraftOpenedRef.current = key;
    console.log("[LiveCamera] Calling catchLog.showForm with draftEntry");
    catchLog.showForm(draftEntry as any);
    console.log("[LiveCamera] After showForm - checking state");
  }, [draftEntry, activeLake, catchLog.isOpen, catchLog.showForm]);

  const lakeLabelData = useMemo(() => {
    if (!selectedCoords) return null;
    
    // Use the same sophisticated matching logic as map clicks
    const polygonMatch = findLakeByPolygon(
      selectedCoords.lat,
      selectedCoords.lng,
      customLakesRef.current as any,
      favorites,
    );
    
    const nearbyFavorite = !polygonMatch
      ? findNearestFavorite(selectedCoords.lat, selectedCoords.lng, favorites)
      : null;
    
    // Check if saved: either polygon match with source="favorite" or nearby favorite
    const isSaved = 
      (polygonMatch && polygonMatch.source === "favorite") ||
      !!nearbyFavorite;
    
    const isKnown =
      waterName !== "" &&
      !waterName.startsWith("Water near") &&
      !waterName.startsWith("Dropped Pin");
    const canEditBoundary =
      isSaved &&
      (currentFavorite?.lake_type === "custom" ||
        !hydrateLakeData(waterName, selectedCoords.lat, selectedCoords.lng));
    return {
      name: waterName,
      city: locationDetails.city,
      state: locationDetails.state,
      lat: selectedCoords.lat,
      lng: selectedCoords.lng,
      isSaved,
      isKnown,
      canEditBoundary,
    };
  }, [selectedCoords, waterName, locationDetails, favorites, currentFavorite]);

  // Force update trigger for when entries are loaded
  const [forceUpdate, setForceUpdate] = useState(0);

  // Register callback to be notified when entries are updated (handles race condition)
  useEffect(() => {
    const unsubscribe = onEntriesUpdate(() => {
      console.log('[Members] Entries updated callback - forcing marker refresh');
      setForceUpdate((v) => v + 1);
    });
    return unsubscribe;
  }, []);

  // Helper to filter catches for active lake (bypasses React state timing issues)
  const getFilteredCatches = useCallback((): CatchEntry[] => {
    if (!activeLake) return [];

    // Read directly from global cache to bypass React state timing
    const allEntries = getGlobalEntries();

    return allEntries.filter(
      (c) =>
        c.lakeName === activeLake.name ||
        (Math.abs(c.lakeLat - activeLake.lat) < 0.01 &&
          Math.abs(c.lakeLng - activeLake.lng) < 0.01)
    );
  }, [activeLake]);

  // Create catch markers when map is ready, lake changes, or entries update
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    // Use direct global cache read instead of React state
    const catches = getFilteredCatches();

    console.log('[Members] Creating catch markers:', {
      catchesFromGlobalCache: catches.length,
      catchesFromHook: catchLog.lakeCatches.length,
      activeLake: activeLake?.name,
      forceUpdate,
    });

    removeCatchMarkers(catchMarkersRef.current);
    catchMarkersRef.current = [];
    catchMarkersRef.current = createCatchMarkers(
      map,
      catches,
      (entry) => catchLog.showDetail(entry),
    );

    return () => {
      removeCatchMarkers(catchMarkersRef.current);
    };
  }, [getFilteredCatches, catchLog.lakeCatches, mapReady, activeLake, forceUpdate]);

  // --- WEATHER EFFECTS & CACHING ---

  // 1. COORDINATE CHANGE HANDLER (Immediate Cache Check)
  // 1. CACHE CHECK ON LOCATION CHANGE
  useEffect(() => {
    if (!selectedCoords) {
      setWeatherData(null);
      setTipReady(false);
      setTipSeen(false);
      return;
    }

    const key = getGeoKey(selectedCoords.lat, selectedCoords.lng);
    const now = Date.now();
    const cached = weatherCache.current[key];
    if (cached && now - cached.timestamp < CACHE_DURATION) {
      console.log("🌦️ Cache HIT - Restoring state for:", key);
      setWeatherData(cached.data);
      setTipReady(true); // Tips always ready instantly
      setTipSeen(cached.tipSeen);
    } else {
      console.log("🌦️ Cache MISS - Resetting state for:", key);
      setWeatherData(null);
      setTipReady(false);
      setTipSeen(false);
    }
  }, [selectedCoords?.lat, selectedCoords?.lng]);

  // 2. FETCH LOGIC - Tips load instantly, alerts only on weather change
  useEffect(() => {
    if (showWeather && selectedCoords && !weatherData) {
      const key = getGeoKey(selectedCoords.lat, selectedCoords.lng);
      const baseUrl = getApiBaseUrl();

      fetch(
        `${baseUrl}/weather/current?lat=${selectedCoords.lat}&lon=${selectedCoords.lng}`,
      )
        .then((res) => {
          if (!res.ok) throw new Error("Weather fetch failed");
          return res.json();
        })
        .then((data) => {
          const newSnapshot = getWeatherSnapshot(data);
          const cached = weatherCache.current[key];
          const previousSnapshot = cached?.snapshot || null;

          // Check if weather has changed significantly
          const weatherChanged = hasWeatherChanged(previousSnapshot, newSnapshot);

          setWeatherData(data);
          setTipReady(true); // Tips always ready instantly

          // Only reset tipSeen if weather actually changed (triggers new alert)
          if (weatherChanged && previousSnapshot) {
            console.log("🌦️ Weather CHANGED - New alert triggered");
            setTipSeen(false);
          }

          weatherCache.current[key] = {
            data,
            timestamp: Date.now(),
            snapshot: newSnapshot,
            tipSeen: weatherChanged ? false : (cached?.tipSeen || false),
          };
        })
        .catch((err) => console.error("Weather fetch failed:", err));
    }
  }, [showWeather, selectedCoords, weatherData]);

  // 3. MARK SEEN LOGIC - When user opens weather overlay
  useEffect(() => {
    if (showWeather && tipReady && selectedCoords) {
      setTipSeen(true);
      const key = getGeoKey(selectedCoords.lat, selectedCoords.lng);
      if (weatherCache.current[key]) {
        weatherCache.current[key].tipSeen = true;
      }
    }
  }, [showWeather, tipReady, selectedCoords]);

  // --- MAP INIT ---
  useEffect(() => {
    isMountedRef.current = true;
    setMapReady(false); // Reset until new map loads
    if (initialized.current || !mapContainer.current || !MAPBOX_TOKEN) return;
    initialized.current = true;
    mapboxgl.accessToken = MAPBOX_TOKEN;

    const defaultCenter: [number, number] = [-86.7816, 33.5186];
    let initialZoom = 6;
    const urlLat = searchParams.get("lat");
    const urlLng = searchParams.get("lng");
    const urlLake = searchParams.get("lake");
    let startCenter = defaultCenter;
    if (urlLat && urlLng) {
      startCenter = [parseFloat(urlLng), parseFloat(urlLat)];
      initialZoom = 12;
    }

    // Get saved map style or use default (Dark theme matches app UI)
    // Reset to default if saved style is no longer available (e.g., Light was removed)
    const validStyles = [
      "mapbox://styles/kaiwenphoenix/cmlssh825005w01s6awzzdncn",
      "mapbox://styles/mapbox/dark-v11", // Keep old dark as fallback
      "mapbox://styles/mapbox/outdoors-v12",
      "mapbox://styles/mapbox/satellite-streets-v12",
    ];
    const defaultStyle = "mapbox://styles/kaiwenphoenix/cmlssh825005w01s6awzzdncn";
    let savedMapStyle = localStorage.getItem("bc_mapbox_style");
    if (!savedMapStyle || !validStyles.includes(savedMapStyle)) {
      savedMapStyle = defaultStyle;
      localStorage.setItem("bc_mapbox_style", defaultStyle);
    }

    const m = new mapboxgl.Map({
      container: mapContainer.current,
      style: savedMapStyle,
      center: startCenter,
      zoom: initialZoom,
      pitch: 0,
      preserveDrawingBuffer: true,
      attributionControl: false,
    });

    mapRef.current = m;
    m.dragRotate.disable();
    m.touchZoomRotate.disableRotation();

    // Signal map is ready for catch markers
    m.on("load", () => {
      setMapReady(true);

      // Hide road/highway layers for satellite style (cleaner look)
      if (savedMapStyle?.includes("satellite")) {
        const style = m.getStyle();
        if (style?.layers) {
          style.layers.forEach((layer) => {
            const id = layer.id.toLowerCase();
            // Hide roads, highways, motorways, and their labels
            if (
              id.includes("road") ||
              id.includes("highway") ||
              id.includes("motorway") ||
              id.includes("trunk") ||
              id.includes("street") ||
              id.includes("bridge") ||
              id.includes("tunnel") ||
              (id.includes("label") && (id.includes("road") || id.includes("path")))
            ) {
              m.setLayoutProperty(layer.id, "visibility", "none");
            }
          });
        }
      }
    });

    const navControl = new mapboxgl.NavigationControl({ showCompass: false });
    const geoControl = new mapboxgl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: false,
      showUserLocation: true,
    });
    m.addControl(navControl, "top-right");
    m.addControl(geoControl, "top-right");

    class RecenterControl implements mapboxgl.IControl {
      _container: HTMLDivElement | undefined;
      onAdd(): HTMLElement {
        this._container = document.createElement("div");
        this._container.className = "mapboxgl-ctrl mapboxgl-ctrl-group";
        this._container.innerHTML = `<button class="mapboxgl-ctrl-recenter" type="button"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/></svg></button>`;
        this._container
          .querySelector("button")
          ?.addEventListener("click", () => {
            const coords = selectedCoords;
            if (coords && mapRef.current) {
              mapRef.current.flyTo({
                center: [coords.lng, coords.lat],
                zoom: 13,
                duration: 1500,
              });
            } else if (navigator.geolocation && mapRef.current) {
              navigator.geolocation.getCurrentPosition((pos) => {
                mapRef.current?.flyTo({
                  center: [pos.coords.longitude, pos.coords.latitude],
                  zoom: 12,
                  duration: 1500,
                });
              });
            }
          });
        return this._container;
      }
      onRemove() {
        this._container?.parentNode?.removeChild(this._container);
      }
    }
    m.addControl(new RecenterControl(), "top-right");

    if (urlLat && urlLng) {
      const lat = parseFloat(urlLat);
      const lng = parseFloat(urlLng);
      setSelectedCoords({ lat, lng });
      setWaterName(urlLake ? decodeURIComponent(urlLake) : "Pinned Location");
      setInputMode("manual");
      if (markerRef.current) markerRef.current.remove();
      const markerEl = createOrbMarker();
      markerElementRef.current = markerEl;
      markerRef.current = new mapboxgl.Marker({ element: markerEl })
        .setLngLat([lng, lat])
        .addTo(m);
    }

    const onClick = async (e: mapboxgl.MapMouseEvent) => {
      if (!mapRef.current || !isMountedRef.current) return;
      if (
        isCatchLogOpenRef.current ||
        showModalRef.current ||
        showFavoritesRef.current
      ) {
        if (showFavoritesRef.current) setShowFavorites(false);
        return;
      }
      if (viewingFavoriteIdRef.current) {
        setViewingFavoriteId(null);
      }
      if (abortControllerRef.current) abortControllerRef.current.abort();
      abortControllerRef.current = new AbortController();

      try {
        const { lng, lat } = e.lngLat;
        const features = mapRef.current.queryRenderedFeatures(e.point);
        const water = features.find(isWaterFeature);

        if (!water) {
          if (selectedCoords && !waterName && !manualWaterName.trim()) {
            clearActiveLake();
          }
          return;
        }

        setSelectedCoords({ lat, lng });
        setInputMode("manual");
        setLocationDetails({});
        setManualWaterName("");
        setViewingFavoriteId(null);
        setShowWeather(false);

        if (markerRef.current) markerRef.current.remove();
        if (markerElementRef.current) markerElementRef.current.remove();
        const markerEl = createOrbMarker();
        markerElementRef.current = markerEl;
        markerRef.current = new mapboxgl.Marker({ element: markerEl })
          .setLngLat([lng, lat])
          .addTo(mapRef.current);

        const vectorName: string | undefined = water?.properties?.name;
        const polygonMatch = findLakeByPolygon(
          lat,
          lng,
          customLakesRef.current as any,
          favoritesRef.current,
        );
        let dbMatch: LakeData | undefined;
        if (!polygonMatch && vectorName) {
          const searchName = vectorName.toLowerCase();
          dbMatch = (LAKES_DATA as LakeData[]).find((l) =>
            l.name.toLowerCase().includes(searchName),
          );
        }
        const nearbyFavorite = !polygonMatch
          ? findNearestFavorite(lat, lng, favoritesRef.current)
          : null;
        const nearbyUserLake =
          !polygonMatch && !nearbyFavorite
            ? findUserLakeByAnchors(lat, lng, customLakesRef.current as any)
            : null;
        const nearbyLake =
          !polygonMatch && !nearbyFavorite && !nearbyUserLake
            ? dbMatch || findNearestLake(lat, lng)
            : null;

        if (polygonMatch) {
          if (polygonMatch.source === "favorite") {
            setViewingFavoriteId(polygonMatch.id);
          }
          setWaterName(polygonMatch.name);
          setLocationDetails({
            city: polygonMatch.city,
            state: polygonMatch.state,
          });
        } else if (nearbyFavorite) {
          setViewingFavoriteId(nearbyFavorite.id);
          setWaterName(nearbyFavorite.name);
          setLocationDetails({
            city: nearbyFavorite.city,
            state: nearbyFavorite.state,
          });
        } else if (nearbyUserLake) {
          setWaterName(nearbyUserLake.name);
          setLocationDetails({
            city: (nearbyUserLake as any).city,
            state: (nearbyUserLake as any).state,
          });
        } else if (nearbyLake) {
          setWaterName(nearbyLake.name);
          setLocationDetails({
            city: nearbyLake.city,
            state: nearbyLake.state,
          });
        } else {
          // Unknown water body - gate for free users
          if (!isActive) {
            // Free user clicked unknown water - show upgrade modal and don't select
            if (markerRef.current) markerRef.current.remove();
            if (markerElementRef.current) markerElementRef.current.remove();
            markerRef.current = null;
            markerElementRef.current = null;
            setSelectedCoords(null);
            setWaterName("");
            setManualWaterName("");
            triggerUpgrade("Upgrade to Pro to explore any water body");
            return;
          }
          // Pro user - allow selecting unknown water
          setWaterName(vectorName || "Dropped Pin Location");
        }

        if (
          !polygonMatch &&
          !nearbyFavorite &&
          (!nearbyLake || !nearbyLake.city)
        ) {
          try {
            const response = await fetch(
              `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}`,
              { signal: abortControllerRef.current.signal },
            );
            if (!isMountedRef.current) return;
            const data = await response.json();
            const context = data?.features?.[0]?.context;
            if (context) {
              const city =
                context.find((c: any) => String(c.id).startsWith("place"))
                  ?.text || "";
              const state =
                context
                  .find((c: any) => String(c.id).startsWith("region"))
                  ?.short_code?.replace("US-", "") || "";
              setLocationDetails({ city, state });
              if (
                !vectorName &&
                !nearbyLake &&
                !nearbyUserLake &&
                !nearbyFavorite
              ) {
                if (city || state)
                  setWaterName(
                    `Water near ${[city, state].filter(Boolean).join(", ")}`,
                  );
                else setWaterName("Dropped Pin Location");
              }
            }
          } catch (e2: any) {
            if (e2.name !== "AbortError") console.error("Geocode failed:", e2);
          }
        }
      } catch (err) {
        console.debug(err);
      }
    };
    m.on("click", onClick);
    return () => {
      isMountedRef.current = false;
      initialized.current = false;
      m.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, mapKey]);

  // --- MAP RECOVERY: Re-initialize if map was destroyed but container exists ---
  useEffect(() => {
    // Check if map needs recovery after navigation
    if (!mapRef.current && mapContainer.current && !initialized.current && MAPBOX_TOKEN) {
      // Force re-run of map init by incrementing key
      const timer = setTimeout(() => {
        if (!mapRef.current && mapContainer.current && !initialized.current) {
          setMapKey(k => k + 1);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [mapKey]);

  // --- AUTO-DETECTION: Detect lake based on map center and zoom ---
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMountedRef.current) return;
    
    const handleAutoDetect = () => {
      // Don't auto-detect if user has manually selected a lake (has marker)
      if (selectedCoords || markerRef.current) return;

      const center = map.getCenter();
      const zoom = map.getZoom();
      
      // Only detect at reasonable zoom levels
      if (zoom < 9) {
        if (waterName && !selectedCoords) {
          setWaterName("");
          setLocationDetails({});
        }
        return;
      }
      
      // Priority 1: Check custom lakes with boundaries
      const customMatch = findLakeByPolygon(
        center.lat,
        center.lng,
        customLakesRef.current as any,
        favoritesRef.current,
      );
      
      if (customMatch) {
        // Check if zoom is appropriate for this lake
        const minZoom = getZoomForLake(customMatch.acres ?? 0) - 1;
        if (zoom >= minZoom) {
          if (waterName !== customMatch.name) {
            setWaterName(customMatch.name);
            setLocationDetails({
              city: customMatch.city,
              state: customMatch.state,
            });
          }
          return;
        }
      }
      
      // Priority 2: Check known lakes from LAKES_DATA
      for (const lake of LAKES_DATA as LakeData[]) {
        // Skip if zoom too low for this lake size
        const minZoom = getZoomForLake(lake.acres ?? 0) - 1;
        if (zoom < minZoom) continue;
        
        // Check if has boundaries
        if (lake.anchors && lake.anchors.length >= 3) {
          if (pointInPolygon({ lat: center.lat, lng: center.lng }, lake.anchors as any)) {
            if (waterName !== lake.name) {
              setWaterName(lake.name);
              setLocationDetails({
                city: lake.city,
                state: lake.state,
              });
            }
            return;
          }
        } else {
          // No boundaries - check proximity with distance threshold based on size
          const lakeAcres = lake.acres ?? 0;
          const maxDistance = lakeAcres > 1000 ? 500 : lakeAcres > 100 ? 200 : 100;
          const distance = getDistanceMeters(center.lat, center.lng, lake.latitude, lake.longitude);
          
          if (distance <= maxDistance) {
            if (waterName !== lake.name) {
              setWaterName(lake.name);
              setLocationDetails({
                city: lake.city,
                state: lake.state,
              });
            }
            return;
          }
        }
      }
      
      // No lake detected - clear name if not manually selected
      if (waterName && !selectedCoords) {
        setWaterName("");
        setLocationDetails({});
      }
    };
    
    // Debounce to avoid excessive calls during pan/zoom
    let timeoutId: NodeJS.Timeout;
    const debouncedHandler = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleAutoDetect, 300);
    };
    
    map.on('move', debouncedHandler);
    map.on('zoom', debouncedHandler);
    
    // Run once on mount
    handleAutoDetect();
    
    return () => {
      clearTimeout(timeoutId);
      map.off('move', debouncedHandler);
      map.off('zoom', debouncedHandler);
    };
  }, [selectedCoords, waterName, customLakesRef.current, favoritesRef.current]);

  // --- HANDLERS ---
  const handleLiveCameraClick = () => {
    if (!isActive) {
      triggerUpgrade(
        "Live session logging is a Pro feature. Upload catches later via Insights.",
      );
      return;
    }
    if (liveCameraInputRef.current) {
      liveCameraInputRef.current.value = "";
      liveCameraInputRef.current.click();
    }
  };

  const handleLiveCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("[LiveCamera] handleLiveCapture triggered");
    const file = e.target.files?.[0];
    if (!file) {
      console.log("[LiveCamera] No file selected");
      return;
    }
    console.log("[LiveCamera] File selected:", file.name, file.size);
    console.log("[LiveCamera] Current activeLake:", activeLake?.name || "null");

    // Compress image
    console.log("[LiveCamera] Starting image compression...");
    let compressedFile = file;
    try {
      compressedFile = await compressImage(file);
      console.log("[LiveCamera] Compression complete, size:", compressedFile.size);
    } catch (err) {
      console.warn("[LiveCamera] Compression failed, using original", err);
    }

    // Get GPS position with manual timeout (navigator timeout is unreliable in WebView)
    console.log("[LiveCamera] Getting GPS position...");
    let latitude = 0;
    let longitude = 0;
    let lakeName = waterName || activeLake?.name || "Unknown Water";
    let useGps = false;

    // Helper to calculate distance in km between two coordinates
    const getDistanceKm = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
      const R = 6371; // Earth's radius in km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLng = (lng2 - lng1) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    };

    // Get the current lake's anchors (boundary) if available
    const currentFav = favorites.find(f => f.name === lakeName);
    const lakeAnchors = currentFav?.anchors;
    console.log("[LiveCamera] Lake anchors available:", !!lakeAnchors, lakeAnchors?.length || 0, "points");

    // Try to get real-time GPS first
    try {
      const gpsPromise = new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) {
          console.log("[LiveCamera] No geolocation API");
          return reject("No Geo");
        }
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true, // we want precise location for hot spots
          timeout: 3000,
          maximumAge: 10000,
        });
      });

      // Manual timeout that actually works in WebView
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("GPS timeout")), 3000);
      });

      const pos = await Promise.race([gpsPromise, timeoutPromise]);
      const gpsLat = pos.coords.latitude;
      const gpsLng = pos.coords.longitude;
      console.log("[LiveCamera] GPS success:", gpsLat, gpsLng);

      // Check if GPS is within vicinity of the active lake (10km radius)
      if (selectedCoords) {
        const distanceKm = getDistanceKm(gpsLat, gpsLng, selectedCoords.lat, selectedCoords.lng);
        console.log("[LiveCamera] Distance from lake center:", distanceKm.toFixed(2), "km");

        if (distanceKm <= 10) {
          // User is near the lake - check if GPS point is actually on water
          if (lakeAnchors && lakeAnchors.length >= 3) {
            const isOnWater = pointInPolygon({ lat: gpsLat, lng: gpsLng }, lakeAnchors);
            console.log("[LiveCamera] GPS point in lake boundary:", isOnWater);

            if (isOnWater) {
              // GPS is confirmed on water - use it for precise hot spot
              latitude = gpsLat;
              longitude = gpsLng;
              useGps = true;
              console.log("[LiveCamera] Using real GPS - confirmed on water");
            } else {
              // GPS is near lake but not on water (on shore?) - snap to lake center
              const waterCenter = findWaterCenter(currentFav as any);
              latitude = waterCenter.lat;
              longitude = waterCenter.lng;
              console.log("[LiveCamera] GPS near lake but not on water - using visual center:", latitude, longitude);
            }
          } else {
            // No boundary data - use GPS since we're within 10km
            latitude = gpsLat;
            longitude = gpsLng;
            useGps = true;
            console.log("[LiveCamera] No lake boundary - using GPS within vicinity");
          }
        } else {
          // User is far from lake (testing from home?) - use lake coordinates
          if (lakeAnchors && lakeAnchors.length >= 3 && currentFav) {
            const waterCenter = findWaterCenter(currentFav as any);
            latitude = waterCenter.lat;
            longitude = waterCenter.lng;
            console.log("[LiveCamera] GPS too far - using lake visual center:", latitude, longitude);
          } else {
            latitude = selectedCoords.lat;
            longitude = selectedCoords.lng;
            console.log("[LiveCamera] GPS too far - using lake center:", latitude, longitude);
          }
        }
      } else {
        // No selected coords, use GPS and try to find nearest lake
        latitude = gpsLat;
        longitude = gpsLng;
        useGps = true;
        const fav = findNearestFavorite(latitude, longitude, favorites);
        const db = findNearestLake(latitude, longitude);
        if (fav) lakeName = fav.name;
        else if (db) lakeName = db.name;
        console.log("[LiveCamera] No active lake, resolved from GPS:", lakeName);
      }
    } catch (gpsErr) {
      console.warn("[LiveCamera] GPS failed or timed out:", gpsErr);
      // Fall back to lake visual center (guaranteed on water) or lake center
      if (currentFav && lakeAnchors && lakeAnchors.length >= 3) {
        const waterCenter = findWaterCenter(currentFav as any);
        latitude = waterCenter.lat;
        longitude = waterCenter.lng;
        console.log("[LiveCamera] GPS failed - using lake visual center:", latitude, longitude);
      } else if (selectedCoords) {
        latitude = selectedCoords.lat;
        longitude = selectedCoords.lng;
        console.log("[LiveCamera] GPS failed - using lake center:", latitude, longitude);
      }
    }

    console.log("[LiveCamera] Final location:", { latitude, longitude, lakeName, useGps });
    const reader = new FileReader();
    reader.onload = (ev) => {
      console.log("[LiveCamera] FileReader onload triggered");
      const imageData = ev.target?.result as string;
      console.log("[LiveCamera] Image data length:", imageData?.length || 0);

      // Set selectedCoords and waterName so activeLake is populated for the catch form
      console.log("[LiveCamera] Setting coords:", { latitude, longitude, lakeName });
      if (latitude && longitude) {
        setSelectedCoords({ lat: latitude, lng: longitude });
        setWaterName(lakeName);
      }

      const newDraft = {
        caughtAt: new Date().toISOString(),
        lakeName: lakeName,
        lakeLat: latitude || 0,
        lakeLng: longitude || 0,
        imageData: imageData,
        catchLat: latitude || 0,
        catchLng: longitude || 0,
        lure: "",
        weight: 0,
        species: "Largemouth Bass",
        source: "camera",
      };
      console.log("[LiveCamera] Setting draftEntry - useEffect will handle showForm");
      setDraftEntry(newDraft);
      // Don't call showForm here - let the useEffect handle it after state updates
      // This avoids stale closure issues with catchLog
    };
    console.log("[LiveCamera] Setting up FileReader for file size:", compressedFile.size);
    reader.onerror = (err) => {
      console.error("[LiveCamera] FileReader error:", err);
    };
    reader.readAsDataURL(compressedFile);
    console.log("[LiveCamera] Started FileReader.readAsDataURL");
  };

  const handleCloseScoutModal = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setShowModal(false);
  };

  const clearActiveLake = useCallback(() => {
    setSelectedCoords(null);
    setWaterName("");
    setManualWaterName("");
    setLocationDetails({});
    setViewingFavoriteId(null);
    setShowWeather(false);
    if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }
    if (markerElementRef.current) {
      markerElementRef.current.remove();
      markerElementRef.current = null;
    }
  }, []);

  const handleSearchSelect = useCallback(
    async (location: {
      name: string;
      latitude: number;
      longitude: number;
      city?: string;
      state?: string;
      acres?: number;
    }) => {
      setShowModal(false);
      setWaterName(location.name);
      setLocationDetails({ city: location.city, state: location.state });
      setSelectedCoords({ lat: location.latitude, lng: location.longitude });
      setInputMode("manual");
      if (mapRef.current) {
        const dbLake = (LAKES_DATA as LakeData[]).find(
          (l) =>
            l.name.toLowerCase() === location.name.toLowerCase() ||
            (Math.abs(l.latitude - location.latitude) < 0.01 &&
              Math.abs(l.longitude - location.longitude) < 0.01),
        );
        const acres = location.acres || dbLake?.acres;
        const zoom = getZoomForLake(acres);
        mapRef.current.flyTo({
          center: [location.longitude, location.latitude],
          zoom,
          duration: 3000,
          essential: true,
        });
        if (markerRef.current) markerRef.current.remove();
        const markerEl = createOrbMarker();
        markerElementRef.current = markerEl;
        markerRef.current = new mapboxgl.Marker({ element: markerEl })
          .setLngLat([location.longitude, location.latitude])
          .addTo(mapRef.current);
      }
    },
    [],
  );

  const performGeneration = useCallback(async () => {
    setShowGenerateConfirm(false);
    setShowReplaceConfirm(false);
    const targetName = currentFavorite ? currentFavorite.name : waterName;
    const targetCoords = currentFavorite
      ? { lat: currentFavorite.lat, lng: currentFavorite.lng }
      : selectedCoords;
    if (!user?.primaryEmailAddress?.emailAddress || !targetCoords) return;
    setErr(null);
    setRateLimitInfo(null);
    setLoading(true);
    try {
      const response = await generateMemberPlan({
        email: user.primaryEmailAddress.emailAddress,
        water: {
          name: targetName || "Selected Water",
          lat: targetCoords.lat,
          lon: targetCoords.lng,
        },
        access_type: accessType,
        // Pass user-selected lures if in "user" mode
        ...(lureSelectionMode === "user" && userPrimaryLure
          ? { user_primary_lure: userPrimaryLure }
          : {}),
        ...(lureSelectionMode === "user" && userSecondaryLure
          ? { user_secondary_lure: userSecondaryLure }
          : {}),
      });
      const tokenUrl = `/plan?token=${response.token}&owner=1`;
      localStorage.setItem("aiq_last_plan_url", tokenUrl);
      localStorage.setItem("aiq_last_plan_lake", targetName || "");
      setLastPlanUrl(tokenUrl);
      setLastPlanLake(targetName || "");
      navigate(tokenUrl, { state: { planResponse: response } });
    } catch (e: any) {
      if (e instanceof RateLimitError) {
        setRateLimitInfo({
          message: e.message,
          secondsRemaining: e.seconds_remaining,
        });
      } else {
        setErr(e?.message ?? "Failed to generate plan.");
      }
      setLoading(false);
    }
  }, [user, selectedCoords, waterName, accessType, currentFavorite, navigate, lureSelectionMode, userPrimaryLure, userSecondaryLure]);

  const handleStrategyClick = useCallback(
    (e?: React.MouseEvent) => {
      e?.preventDefault();
      e?.stopPropagation();

      // Free user check - only verify they have generations remaining
      if (!isActive && plansRemaining <= 0) {
        triggerUpgrade(
          "You've used your 5 free plans. Upgrade to unlock unlimited AI plans.",
        );
        return;
      }

      const targetName = currentFavorite ? currentFavorite.name : waterName;
      if (!targetName && !activeLake) return;
      const hasPlan = !!lastPlanUrl;
      const isSameLake = lastPlanLake === targetName;

      // Reset lure selection state when opening modal
      setLureSelectionMode("ai");
      setUserPrimaryLure("");
      setUserSecondaryLure("");

      // Always show the unified generate modal
      // Only show replace confirm if changing lakes with existing plan
      if (hasPlan && !isSameLake) {
        setShowReplaceConfirm(true);
      } else {
        setShowGenerateConfirm(true);
      }
    },
    [
      isActive,
      activeLake,
      waterName,
      currentFavorite,
      lastPlanUrl,
      lastPlanLake,
      plansRemaining,
    ],
  );

  const handleWeatherClick = useCallback(() => {
    // Weather is available for all users on any known lake
    setShowWeather((prev) => !prev);
  }, []);

  const handleRemoveSpecificLake = useCallback(
    async (lake: FavoriteLake) => {
      // Optimistically remove from favorites
      setFavorites((prev) => prev.filter((f) => f.id !== lake.id));

      // If we're currently viewing this favorite, clear the viewingFavoriteId
      if (viewingFavoriteId === lake.id) {
        setViewingFavoriteId(null);
      }

      try {
        if (isNativePlatform() && nativeAuth.isSignedIn && nativeAuth.userEmail && nativeAuth.userId) {
          // Use mobile endpoint for native app
          await removeFavoriteMobile(nativeAuth.userEmail, nativeAuth.userId, lake.id, lake.lake_type);
        } else {
          // Use web endpoint with JWT
          const token = await getToken();
          if (!token) throw new Error("No token");
          await removeFavorite(lake.id, lake.lake_type, token);
        }
      } catch (err) {
        console.error("Failed to remove favorite", err);
        // Rollback on error
        setFavorites((prev) => [...prev, lake]);
        if (viewingFavoriteId === lake.id) {
          setViewingFavoriteId(lake.id);
        }
        alert("Failed to remove lake.");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [viewingFavoriteId, nativeAuth.isSignedIn, nativeAuth.userEmail, nativeAuth.userId],
  );

  const toggleFavoriteLake = useCallback(
    async (e?: React.MouseEvent) => {
      e?.preventDefault();
      e?.stopPropagation();
      if (!waterName || !selectedCoords) {
        console.log("[toggleFavorite] Early return - no waterName or selectedCoords", { waterName, selectedCoords });
        return;
      }

      console.log("[toggleFavorite] isCurrentLocationSaved:", isCurrentLocationSaved, "waterName:", waterName, "favorites:", favorites.length);

      if (isCurrentLocationSaved) {
        // REMOVAL - handleRemoveSpecificLake handles its own auth
        let fav: FavoriteLake | null = null;

        // First try: match by name (most reliable)
        fav = favorites.find(f => f.name === waterName) || null;

        // Second try: polygon matching
        if (!fav) {
          const polygonMatch = findLakeByPolygon(
            selectedCoords.lat,
            selectedCoords.lng,
            customLakesRef.current as any,
            favorites,
          );
          if (polygonMatch && polygonMatch.source === "favorite") {
            fav = favorites.find(f => f.id === polygonMatch.id) || null;
          }
        }

        // Third try: coordinate proximity (same threshold as isCurrentLocationSaved)
        if (!fav) {
          fav = favorites.find(f =>
            Math.abs(f.lat - selectedCoords.lat) < 0.001 &&
            Math.abs(f.lng - selectedCoords.lng) < 0.001
          ) || null;
        }

        console.log("[toggleFavorite] Found fav:", fav?.name || "null");
        if (fav) {
          if (confirm(`Remove ${fav.name}?`)) handleRemoveSpecificLake(fav);
        }
        return;
      }

      // ADDING - need token for web, mobile adding not yet supported
      const token = await getToken();
      if (!token) {
        console.log("[toggleFavorite] Early return - no token");
        return;
      }

      if (!isActive && favorites.length >= 1) {
        triggerUpgrade(
          "Free users can track 1 Home Lake. Upgrade to track unlimited waters.",
        );
        return;
      }
      const dbMatch = hydrateLakeData(
        manualWaterName || waterName,
        selectedCoords.lat,
        selectedCoords.lng,
      );
      let lakeId = "";
      let lakeType: "known" | "custom" = "known";
      let shouldCreateCustom = false;
      if (dbMatch && dbMatch.name) {
        // Lake exists in lakes.json - use name as the identifier.
        // Backend matches known lakes by name (no id field needed).
        lakeId = dbMatch.name;
        lakeType = "known";
      } else {
        // Truly unlisted water - create as custom lake
        lakeType = "custom";
        shouldCreateCustom = true;
      }
      const performCustomCreation = async () => {
        const nameToSave = manualWaterName || waterName;
        const lakeInput = {
          name: nameToSave,
          lat: selectedCoords.lat,
          lng: selectedCoords.lng,
          city: locationDetails.city || "",
          state: locationDetails.state || "",
          anchors: dbMatch?.anchors || [],
        };

        // Use mobile endpoint on native platforms
        let createRes;
        if (isNativePlatform() && nativeAuth.userEmail && nativeAuth.userId) {
          createRes = await createCustomLakeMobile(
            nativeAuth.userEmail,
            nativeAuth.userId,
            lakeInput,
          );
        } else {
          createRes = await createCustomLake(lakeInput, token!);
        }

        if (createRes.success) {
          return (createRes as any).lake_id;
        } else {
          const existingLake = (createRes as any).existing_lake;
          if (
            existingLake &&
            nameToSave &&
            existingLake.name !== nameToSave
          ) {
            try {
              await updateCustomLake(
                existingLake.id,
                { name: nameToSave },
                token!,
              );
            } catch (err) {
              console.error("Failed to update lake name:", err);
            }
          }
          return existingLake?.id;
        }
      };
      // Helper to add favorite on either platform
      const addFavoriteCrossPlatform = async (id: string, type: "known" | "custom") => {
        if (isNativePlatform() && nativeAuth.userEmail && nativeAuth.userId) {
          await addFavoriteMobile(nativeAuth.userEmail, nativeAuth.userId, id, type);
        } else {
          await addFavorite(id, type, token!);
        }
      };

      try {
        if (shouldCreateCustom) {
          lakeId = await performCustomCreation();
          if (!lakeId) throw new Error("Failed to get lake ID");
        } else {
          try {
            await addFavoriteCrossPlatform(lakeId, "known");
          } catch (knownErr: any) {
            lakeType = "custom";
            lakeId = await performCustomCreation();
            if (!lakeId) throw new Error("Failed fallback creation");
            await addFavoriteCrossPlatform(lakeId, "custom");
            return;
          }
        }
        if (lakeType === "custom") await addFavoriteCrossPlatform(lakeId, "custom");
        const zoom = mapRef.current?.getZoom() || 10;
        const imageUrl = `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/${selectedCoords.lng},${selectedCoords.lat},${Math.min(zoom, 13)},0/600x400?access_token=${MAPBOX_TOKEN}`;
        const newLake: FavoriteLake = {
          id: lakeId,
          lake_type: lakeType,
          name: manualWaterName || waterName,
          city: locationDetails.city,
          state: locationDetails.state,
          lat: selectedCoords.lat,
          lng: selectedCoords.lng,
          zoom: zoom,
          image: imageUrl,
          acres: dbMatch?.acres,
          tier: dbMatch?.tier,
        };
        setFavorites((prev) => [...prev, newLake]);
        setViewingFavoriteId(lakeId);
      } catch (err) {
        console.error("Failed to save favorite", err);
        alert("Error saving lake. Please try again.");
      }
    },
    [
      isActive,
      waterName,
      manualWaterName,
      selectedCoords,
      locationDetails,
      isCurrentLocationSaved,
      favorites,
      getToken,
      handleRemoveSpecificLake,
      nativeAuth,
    ],
  );

  const handleReturnToPlan = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (lastPlanUrl) navigate(lastPlanUrl);
  };
  const handleOpenScoutModal = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (selectedCoords) setInputMode("manual");
    else setInputMode("search");
    setShowModal(true);
  };
  const handleEditBoundary = () => {
    if (!isActive) {
      triggerUpgrade("Custom mapping tools are available in Pro.");
      return;
    }
    if (currentFavorite && selectedCoords) {
      navigate("/lake-builder", {
        state: {
          lat: selectedCoords.lat,
          lng: selectedCoords.lng,
          suggestedName: currentFavorite.name,
          city: currentFavorite.city,
          state: currentFavorite.state,
          lakeId: currentFavorite.id,
        },
      });
    }
  };
  const handleCatchLogClick = () => {
    if (!isActive) {
      triggerUpgrade(
        "Catchlog tracks catches for your current trip. Historical catches remain available via Map pins and Insights.",
      );
      return;
    }
    catchLog.open();
  };

  if (loading)
    return (
      <PlanGenerationLoader
        lakeName={waterName || "Selected Water"}
        onComplete={() => setLoading(false)}
      />
    );
  if (statusLoading) return <MapLoadingScreen />;

  return (
    <div
      className={isLightTheme ? "theme-light" : "theme-dark"}
      style={{ position: "fixed", inset: 0, background: isLightTheme ? "#f5f5f5" : "#0a0a0a", overflow: "hidden" }}
    >
      <input
        type="file"
        ref={liveCameraInputRef}
        accept="image/*"
        capture="environment"
        style={{ display: "none" }}
        onChange={handleLiveCapture}
      />
      <div style={{ width: "100%", height: "100%" }}>
        <style>{`.mapboxgl-ctrl-top-right { top: 180px !important; }`}</style>
        <div ref={mapContainer} style={{ width: "100%", height: "100%" }} />
      </div>

      <CatchLogModal
        {...catchLog}
        onDraftDone={clearDraftEntry}
        onFlyToLocation={(lat, lng) => {
          if (mapRef.current) {
            mapRef.current.flyTo({
              center: [lng, lat],
              zoom: 15,
              duration: 1500,
              essential: true,
            });
          }
        }}
      />
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        message={upgradeMessage}
      />

      {/* WELCOME BANNER - Shows for new signups */}
      {showWelcome && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.8)",
            backdropFilter: "blur(4px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
          onClick={() => setShowWelcome(false)}
        >
          <div
            style={{
              background: "linear-gradient(135deg, #1a1a2e 0%, #0a0a0a 100%)",
              borderRadius: 24,
              padding: "32px 28px",
              maxWidth: 420,
              width: "100%",
              border: "1px solid rgba(74, 144, 226, 0.3)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
              textAlign: "center",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: 64,
                height: 64,
                background: "rgba(34, 197, 94, 0.15)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
              }}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#4ade80"
                strokeWidth="2.5"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2
              style={{
                color: "#fff",
                fontSize: "1.5rem",
                fontWeight: 700,
                marginBottom: 12,
              }}
            >
              Welcome to Bass Clarity!
            </h2>
            <p
              style={{
                color: "rgba(255,255,255,0.7)",
                fontSize: "1rem",
                lineHeight: 1.6,
                marginBottom: 24,
              }}
            >
              Your account is now active. Tap any lake on the map to get started
              with AI-powered fishing strategies.
            </p>
            <div
              style={{
                background: "rgba(74, 144, 226, 0.1)",
                border: "1px solid rgba(74, 144, 226, 0.2)",
                borderRadius: 12,
                padding: "14px 16px",
                marginBottom: 24,
                textAlign: "left",
              }}
            >
              <p
                style={{
                  color: "rgba(255,255,255,0.8)",
                  fontSize: "0.9rem",
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                <strong style={{ color: "#4A90E2" }}>Tip:</strong> You can always
                return here by tapping the blue profile icon in the navigation bar.
                Subscriptions are optional and help support development.
              </p>
            </div>
            <button
              onClick={() => setShowWelcome(false)}
              style={{
                width: "100%",
                padding: "16px 24px",
                fontSize: "1.1rem",
                fontWeight: 700,
                background: "linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)",
                border: "none",
                borderRadius: 14,
                color: "#fff",
                cursor: "pointer",
                marginBottom: 12,
              }}
            >
              Start Exploring
            </button>
            <button
              onClick={() => {
                setShowWelcome(false);
                navigate("/subscribe");
              }}
              style={{
                width: "100%",
                padding: "14px 24px",
                fontSize: "0.95rem",
                fontWeight: 600,
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: 14,
                color: "rgba(255,255,255,0.7)",
                cursor: "pointer",
              }}
            >
              Support Bass Clarity →
            </button>
          </div>
        </div>
      )}

      {/* WEATHER OVERLAY */}
      {showWeather && selectedCoords && (
        <WeatherOverlay
          locationName={waterName}
          onClose={() => setShowWeather(false)}
          weatherData={weatherData}
          showTip={tipReady}
        />
      )}

      {/* TACTICAL TARGET CARD - Hidden if weather closed or data missing */}
      {showWeather && weatherData && (
        <div className="absolute top-24 left-4 z-50">
          <MapTargetCard weather={weatherData} />
        </div>
      )}

      {/* TOP GRADIENT BAR */}
      {!showModal &&
        !catchLog.isOpen &&
        (() => {
          const suggestedMatch = (() => {
            if (
              !lakeLabelData ||
              lakeLabelData.isKnown ||
              !manualWaterName ||
              manualWaterName.length < 3
            ) {
              return null;
            }
            const query = manualWaterName.toLowerCase().trim();
            const match = lakeSuggestionsData.find((l) => {
              const name = l.name.toLowerCase();
              return (
                name.includes(query) ||
                query.includes(name.replace("lake ", "").trim())
              );
            });
            if (match && match.name.toLowerCase() !== query) {
              return match;
            }
            return null;
          })();
          const handleAcceptSuggestion = () => {
            if (suggestedMatch) {
              setWaterName(suggestedMatch.name);
              setManualWaterName(suggestedMatch.name);
              if (suggestedMatch.city || suggestedMatch.state) {
                setLocationDetails({
                  city: suggestedMatch.city,
                  state: suggestedMatch.state,
                });
              }
            }
          };
          const handleSaveLakeName = () => {
            if (manualWaterName.trim()) {
              setWaterName(manualWaterName.trim());
              toggleFavoriteLake();
            }
          };

          return (
            <div className="top-gradient-bar">
              {selectedCoords && lakeLabelData ? (
                <div className="top-bar-card">
                  <button
                    className="top-bar-close"
                    onClick={clearActiveLake}
                    aria-label="Clear selection"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                  <div className="top-bar-content-centered">
                    <div className="top-bar-name-row">
                      <button
                        className={`top-bar-star-btn ${isCurrentLocationSaved ? "saved" : ""}`}
                        onClick={toggleFavoriteLake}
                        aria-label={
                          isCurrentLocationSaved
                            ? "Remove Favorite"
                            : "Save Favorite"
                        }
                      >
                        <StarIcon size={24} filled={isCurrentLocationSaved} />
                      </button>
                      {lakeLabelData.isKnown ? (
                        <>
                          <h2 className="top-bar-lake-name">
                            {lakeLabelData.name}
                          </h2>
                          {viewingFavoriteId === homeLakeId && homeLakeId && (
                            <span className="top-bar-home-badge" title="Home Lake">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 3L4 9v12h5v-7h6v7h5V9l-8-6z" />
                              </svg>
                            </span>
                          )}
                        </>
                      ) : (
                        <>
                          <input
                            type="text"
                            className="top-bar-name-input"
                            placeholder="Name this water..."
                            value={manualWaterName}
                            onChange={(e) => setManualWaterName(e.target.value)}
                            autoComplete="off"
                            spellCheck={false}
                          />
                          <button
                            className="top-bar-save-btn"
                            onClick={handleSaveLakeName}
                            disabled={!manualWaterName.trim()}
                            aria-label="Save lake name"
                          >
                            <svg
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3"
                            >
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </button>
                        </>
                      )}
                    </div>
                    <div className="top-bar-location">
                      <span>
                        {lakeLabelData.city && lakeLabelData.state
                          ? `${lakeLabelData.city}, ${lakeLabelData.state}`
                          : `${lakeLabelData.lat.toFixed(4)}°, ${lakeLabelData.lng.toFixed(4)}°`}
                      </span>
                      {lakeLabelData.canEditBoundary && (
                        <button
                          className="top-bar-edit-boundary"
                          onClick={handleEditBoundary}
                          title="Edit Boundary"
                        >
                          <PolygonIcon size={12} />
                          <span>Outline</span>
                          {!isActive && <LockIcon size={10} className="ml-1" />}
                        </button>
                      )}
                    </div>
                  </div>
                  {suggestedMatch && (
                    <button
                      className="top-bar-suggestion"
                      onClick={handleAcceptSuggestion}
                    >
                      <span className="suggestion-label">Did you mean?</span>
                      <span className="suggestion-name">
                        {suggestedMatch.name}
                      </span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="top-bar-card top-bar-card-empty">
                  <span className="top-bar-label">Bass Clarity Pro</span>
                  <h2 className="top-bar-title">Find Your Water</h2>
                  <p className="top-bar-subtitle">
                    Search or tap any body of water
                  </p>
                </div>
              )}
            </div>
          );
        })()}

      {!catchLog.isOpen && (
        <div
          className={`members-navigation-container ${showFavorites ? "expanded" : ""} ${isNativePlatform() ? "native-ios" : ""}`}
        >
          <div className="glass-deck">
            {showFavorites && (
              <div className="nav-favorites-section">
                <div className="nav-favorites-header">
                  <div className="nav-favorites-title">
                    <span>My Waters</span>
                    <span className="nav-favorites-count">
                      {favorites.length} Saved
                    </span>
                  </div>
                </div>
                <div className="nav-favorites-scroll">
                  <div
                    className="nav-fav-card nav-fav-card-add"
                    onClick={() => {
                      setShowFavorites(false);
                      setShowModal(true);
                    }}
                  >
                    <div className="nav-fav-add-icon">
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    </div>
                    <span>Scout New</span>
                  </div>
                  {sortedFavorites.map((lake, index) => {
                    const isActiveFav = lake.id === viewingFavoriteId;
                    // Non-pro users can only access their first (Home) lake
                    const isLocked = !isActive && index > 0;
                    return (
                      <div
                        key={`${lake.lake_type}:${lake.id}`}
                        className={`nav-fav-card ${isActiveFav ? "active" : ""} ${isLocked ? "locked" : ""}`}
                        onClick={() => {
                          // Don't navigate if long-press triggered or context menu is open
                          if (longPressTriggeredRef.current || lakeContextMenu) return;
                          if (isLocked) {
                            triggerUpgrade(
                              "Free users can access 1 Home Lake. Upgrade to unlock all your saved waters."
                            );
                            return;
                          }
                          setWaterName(lake.name);
                          setViewingFavoriteId(lake.id);
                          setLocationDetails({
                            city: lake.city,
                            state: lake.state,
                          });
                          setSelectedCoords({ lat: lake.lat, lng: lake.lng });
                          if (mapRef.current)
                            mapRef.current.flyTo({
                              center: [lake.lng, lake.lat],
                              zoom: getZoomForLake(lake.acres),
                              duration: 2000,
                            });
                          setShowFavorites(false);
                        }}
                        onTouchStart={(e) => {
                          e.preventDefault(); // Prevent iOS native context menu
                          handleLongPressStart(lake);
                        }}
                        onTouchEnd={handleLongPressEnd}
                        onTouchMove={handleLongPressEnd}
                        onTouchCancel={handleLongPressEnd}
                        style={{
                          backgroundImage: lake.image
                            ? `url(${lake.image})`
                            : undefined,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                          WebkitTouchCallout: "none",
                          WebkitUserSelect: "none",
                          userSelect: "none",
                        }}
                      >
                        <div className="nav-fav-card-gradient" />
                        {isLocked && (
                          <div className="nav-fav-card-lock">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                          </div>
                        )}
                        <div className="nav-fav-card-content">
                          <div className="nav-fav-card-name">{lake.name}</div>
                          {lake.city && lake.state && (
                            <div className="nav-fav-card-location">
                              {lake.city}, {lake.state}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

{/* Lake Context Menu - Rendered at root level for proper z-index */}

            <div className="nav-icons-row">
              <div className="nav-cluster nav-cluster-left">
                <div style={{ position: "relative" }}>
                  <button
                    onClick={handleWeatherClick}
                    className={`nav-btn nav-btn-icon ${activeLake ? "nav-btn-primary" : ""}`}
                    disabled={!activeLake}
                    aria-label="Check Weather"
                  >
                    <CloudIcon size={22} />
                  </button>
                  {tipReady && !tipSeen && !showWeather && (
                    <div
                      style={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: "#F59E0B",
                        border: "1.5px solid rgba(30,30,40,1)",
                        boxShadow: "0 0 6px rgba(245, 158, 11, 0.6)",
                        animation: "pulse-dot 2s infinite",
                        pointerEvents: "none",
                      }}
                    />
                  )}
                </div>
                <button
                  onClick={handleLiveCameraClick}
                  className={`nav-btn nav-btn-icon ${!!activeLake ? "nav-btn-primary" : ""}`}
                  aria-label="Live Capture"
                >
                  <CameraIcon size={22} />
                </button>
              </div>
              <div className="orb-nav-cluster">
                <div
                  className="nav-center-orb"
                  onClick={() => setShowFavorites((prev) => !prev)}
                  aria-label="Toggle Favorites"
                >
                  <div className="nav-center-orb-core" />
                  <div className="nav-center-orb-glow" />
                </div>
              </div>
              <div className="nav-cluster nav-cluster-right">
                <div style={{ position: "relative" }}>
                  <button
                    onClick={handleStrategyClick}
                    className={`nav-btn nav-btn-icon ${!!activeLake ? "nav-btn-primary" : ""}`}
                    disabled={!activeLake && !manualWaterName}
                    aria-label="Generate Plan"
                  >
                    <LightningIcon size={22} />
                  </button>
                  {lastPlanUrl &&
                    (currentFavorite
                      ? lastPlanLake === currentFavorite.name
                      : lastPlanLake === waterName) && (
                      <div
                        style={{
                          position: "absolute",
                          top: 10,
                          right: 10,
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: "#F59E0B",
                          boxShadow: "0 0 4px #F59E0B",
                        }}
                      />
                    )}
                </div>
                <button
                  onClick={handleCatchLogClick}
                  className={`nav-btn nav-btn-icon ${!!activeLake ? "nav-btn-primary" : ""}`}
                  disabled={!activeLake}
                  aria-label="Catch Log"
                >
                  <LogIcon size={22} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showGenerateConfirm && (
        <div
          className="modal-overlay"
          onClick={() => setShowGenerateConfirm(false)}
        >
          <div
            className="glass-panel modal-content"
            style={{
              maxWidth: 360,
              alignItems: "center",
              textAlign: "center",
              padding: 30,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <LightningIcon size={40} />
            <h3 style={{ marginTop: 15, marginBottom: 5 }}>Generate Plan</h3>
            <p style={{ opacity: 0.6, fontSize: "0.9rem", marginBottom: !isActive ? 8 : 20 }}>
              Create a bass fishing plan for <br />
              <strong style={{ color: "#4A90E2" }}>
                {currentFavorite?.name || waterName}
              </strong>
            </p>
            {!isActive && (
              <p style={{ opacity: 0.4, fontSize: "0.75rem", marginBottom: 16 }}>
                {plansRemaining} of 5 free plans remaining
              </p>
            )}

            {/* Lure Selection Mode */}
            <div style={{ width: "100%", marginBottom: 20, textAlign: "left" }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "12px 14px",
                  borderRadius: 10,
                  border: lureSelectionMode === "ai"
                    ? "1px solid rgba(74,144,226,0.5)"
                    : "1px solid rgba(255,255,255,0.1)",
                  background: lureSelectionMode === "ai"
                    ? "rgba(74,144,226,0.1)"
                    : "transparent",
                  cursor: "pointer",
                  marginBottom: 8,
                }}
              >
                <input
                  type="radio"
                  name="lureMode"
                  checked={lureSelectionMode === "ai"}
                  onChange={() => setLureSelectionMode("ai")}
                  style={{ accentColor: "#4A90E2" }}
                />
                <span style={{ fontSize: "0.95rem" }}>AI Recommends</span>
              </label>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "12px 14px",
                  borderRadius: 10,
                  border: lureSelectionMode === "user"
                    ? "1px solid rgba(74,144,226,0.5)"
                    : "1px solid rgba(255,255,255,0.1)",
                  background: lureSelectionMode === "user"
                    ? "rgba(74,144,226,0.1)"
                    : "transparent",
                  cursor: "pointer",
                  marginBottom: lastPlanUrl && lastPlanLake === (currentFavorite?.name || waterName) ? 8 : 0,
                }}
              >
                <input
                  type="radio"
                  name="lureMode"
                  checked={lureSelectionMode === "user"}
                  onChange={() => setLureSelectionMode("user")}
                  style={{ accentColor: "#4A90E2" }}
                />
                <span style={{ fontSize: "0.95rem" }}>I'll Choose My Lures</span>
              </label>

              {/* View Existing Plan option - only shown if there's a plan for this lake */}
              {lastPlanUrl && lastPlanLake === (currentFavorite?.name || waterName) && (
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "12px 14px",
                    borderRadius: 10,
                    border: lureSelectionMode === "view"
                      ? "1px solid rgba(34,197,94,0.5)"
                      : "1px solid rgba(255,255,255,0.1)",
                    background: lureSelectionMode === "view"
                      ? "rgba(34,197,94,0.1)"
                      : "transparent",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="radio"
                    name="lureMode"
                    checked={lureSelectionMode === "view"}
                    onChange={() => setLureSelectionMode("view")}
                    style={{ accentColor: "#22C55E" }}
                  />
                  <span style={{ fontSize: "0.95rem" }}>View Existing Plan</span>
                </label>
              )}
            </div>

            {/* Conditional Lure Pickers */}
            {lureSelectionMode === "user" && (
              <div
                style={{
                  width: "100%",
                  marginBottom: 20,
                  padding: 16,
                  background: "rgba(255,255,255,0.03)",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <div style={{ marginBottom: 14 }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.8rem",
                      opacity: 0.7,
                      marginBottom: 6,
                      textAlign: "left",
                    }}
                  >
                    Primary Lure
                  </label>
                  <select
                    value={userPrimaryLure}
                    onChange={(e) => setUserPrimaryLure(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 8,
                      border: "1px solid rgba(255,255,255,0.15)",
                      background: "rgba(0,0,0,0.3)",
                      color: "#fff",
                      fontSize: "0.9rem",
                    }}
                  >
                    <option value="">Select lure...</option>
                    {LURE_CATEGORIES.map((cat) => (
                      <optgroup key={cat.name} label={cat.name}>
                        {cat.lures.map((lure) => (
                          <option key={lure} value={lure}>
                            {capitalize(lure)}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.8rem",
                      opacity: 0.7,
                      marginBottom: 6,
                      textAlign: "left",
                    }}
                  >
                    Secondary Lure
                  </label>
                  <select
                    value={userSecondaryLure}
                    onChange={(e) => setUserSecondaryLure(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 8,
                      border: "1px solid rgba(255,255,255,0.15)",
                      background: "rgba(0,0,0,0.3)",
                      color: "#fff",
                      fontSize: "0.9rem",
                    }}
                  >
                    <option value="">Select lure...</option>
                    {LURE_CATEGORIES.map((cat) => (
                      <optgroup key={cat.name} label={cat.name}>
                        {cat.lures.map((lure) => (
                          <option key={lure} value={lure}>
                            {capitalize(lure)}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: 10, width: "100%" }}>
              <button
                onClick={() => setShowGenerateConfirm(false)}
                className="modal-btn"
                style={{
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (lureSelectionMode === "view" && lastPlanUrl) {
                    setShowGenerateConfirm(false);
                    navigate(lastPlanUrl);
                  } else {
                    performGeneration();
                  }
                }}
                className="generate-btn"
                disabled={
                  lureSelectionMode === "user" &&
                  (!userPrimaryLure || !userSecondaryLure)
                }
                style={{
                  background:
                    lureSelectionMode === "view"
                      ? "linear-gradient(135deg, #22C55E 0%, #16A34A 100%)"
                      : lureSelectionMode === "user" &&
                        (!userPrimaryLure || !userSecondaryLure)
                        ? "rgba(74,144,226,0.3)"
                        : "linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)",
                  padding: "12px",
                  cursor:
                    lureSelectionMode === "user" &&
                    (!userPrimaryLure || !userSecondaryLure)
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                {lureSelectionMode === "view" ? "View Plan" : "Generate"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showReplaceConfirm && (
        <div
          className="modal-overlay"
          onClick={() => setShowReplaceConfirm(false)}
        >
          <div
            className="glass-panel modal-content"
            style={{
              maxWidth: 320,
              alignItems: "center",
              textAlign: "center",
              padding: 30,
              border: "1px solid rgba(245, 158, 11, 0.3)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ color: "#F59E0B" }}>
              <LightningIcon size={40} />
            </div>
            <h3 style={{ marginTop: 15, marginBottom: 5 }}>Switch Plan?</h3>
            <p style={{ opacity: 0.6, fontSize: "0.9rem", marginBottom: 20 }}>
              You have an active plan for <strong>{lastPlanLake}</strong>.<br />
              Generating for{" "}
              <strong style={{ color: "#4A90E2" }}>
                {viewingFavoriteId
                  ? favorites.find((f) => f.id === viewingFavoriteId)?.name
                  : waterName}
              </strong>{" "}
              will replace it.
            </p>
            <div style={{ display: "flex", gap: 10, width: "100%" }}>
              <button
                onClick={() => setShowReplaceConfirm(false)}
                className="modal-btn"
                style={{
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowReplaceConfirm(false);
                  setShowGenerateConfirm(true);
                }}
                className="generate-btn"
                style={{
                  background:
                    "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
                  padding: "12px",
                  color: "#000",
                }}
              >
                Overwrite
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={handleCloseScoutModal}>
          <div
            className="glass-panel modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <RadarIcon size={20} />
                <span style={{ fontWeight: 700, fontSize: "1.05rem" }}>
                  Scout Water
                </span>
              </div>
              <button
                type="button"
                onClick={handleCloseScoutModal}
                className="close-btn"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              {err && <div className="error-banner">{err}</div>}
              <div>
                <label className="modal-label">Find Water</label>
                <div style={{ position: "relative" }}>
                  <style>{`.location-search-dropdown { position: absolute !important; top: 100% !important; z-index: 9999 !important; background: rgba(20, 20, 30, 0.98) !important; border: 1px solid rgba(255,255,255,0.1) !important; border-radius: 10px !important; }`}</style>
                  <LocationSearch
                    onSelect={handleSearchSelect}
                    placeholder="Search Lake Database..."
                  />
                </div>
              </div>
              <p
                style={{
                  fontSize: "0.85rem",
                  color: "rgba(255,255,255,0.5)",
                  marginTop: 16,
                  textAlign: "center",
                }}
              >
                Or tap any water on the map to select it
              </p>
            </div>
          </div>
        </div>
      )}

      {showTutorial && (
        <div
          onClick={dismissTutorial}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(0,0,0,0.85)",
            backdropFilter: "blur(4px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            textAlign: "center",
            color: "#fff",
            padding: 20,
          }}
        >
          <div style={{ marginBottom: 60 }}>
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: "50%",
                border: "2px solid rgba(255,255,255,0.3)",
                background: "rgba(74, 144, 226, 0.2)",
                margin: "0 auto 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
              >
                <path d="M12 2a10 10 0 1 0 10 10" />
                <path d="M12 12v-4" />
                <path d="M12 12h-4" />
              </svg>
            </div>
            <h2 style={{ fontSize: "1.8rem", fontWeight: 800, margin: 0 }}>
              Scout Your Water
            </h2>
            <p
              style={{
                fontSize: "1rem",
                opacity: 0.8,
                maxWidth: 300,
                marginTop: 10,
                lineHeight: 1.5,
              }}
            >
              Tap anywhere on the water to drop a pin.
              <br />
              <span style={{ color: "#4A90E2", fontWeight: 700 }}>
                This unlocks weather & tools.
              </span>
            </p>
          </div>
          <div
            style={{
              position: "absolute",
              bottom: 120,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <p
              style={{
                fontSize: "0.9rem",
                fontWeight: 600,
                marginBottom: 8,
                color: "rgba(255,255,255,0.9)",
              }}
            >
              Save Locations Here
            </p>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              style={{ opacity: 0.5 }}
            >
              <path d="M12 5v14" />
              <path d="M19 12l-7 7-7-7" />
            </svg>
          </div>
          <button
            style={{
              marginTop: 40,
              background: "#fff",
              color: "#000",
              border: "none",
              padding: "14px 40px",
              borderRadius: 30,
              fontWeight: 700,
              fontSize: "1rem",
              boxShadow: "0 4px 20px rgba(255,255,255,0.2)",
            }}
          >
            Got it
          </button>
        </div>
      )}

      {/* Lake Context Menu - At root level for proper z-index */}
      {lakeContextMenu && (
        <div
          className="lake-context-overlay"
          onClick={() => setLakeContextMenu(null)}
        >
          <div
            className="lake-context-menu"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="lake-context-header">
              {lakeContextMenu.lake.name}
            </div>
            <button
              className="lake-context-item"
              onClick={() => {
                setAsHomeLake(lakeContextMenu.lake.id);
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span>Set as Home Lake</span>
              {lakeContextMenu.lake.id === homeLakeId && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="3" style={{ marginLeft: "auto" }}>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
            <button
              className="lake-context-item lake-context-delete"
              onClick={() => {
                if (confirm(`Remove ${lakeContextMenu.lake.name} from favorites?`)) {
                  handleRemoveSpecificLake(lakeContextMenu.lake);
                  setLakeContextMenu(null);
                }
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              <span>Remove from Saved</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
