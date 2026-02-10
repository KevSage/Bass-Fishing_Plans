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
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import polylabel from "polylabel";
import { MapLoadingScreen } from "@/components/MapLoadingScreen";
// API Imports
import { generateMemberPlan, RateLimitError } from "@/lib/api";
import {
  listFavorites,
  listFavoritesMobile,
  addFavorite,
  removeFavorite,
  removeFavoriteMobile,
  listCustomLakes,
  listCustomLakesMobile,
  createCustomLake,
  updateCustomLake,
  type CustomLake,
  type FavoriteLake as ApiFavoriteLake,
} from "@/lib/catches-api";

import { useMemberStatus } from "@/hooks/useMemberStatus";
import { LocationSearch } from "@/components/LocationSearch";
import { PlanGenerationLoader } from "@/components/PlanGenerationLoader";
import { WeatherOverlay } from "@/components/WeatherOverlay";
import { MapTargetCard } from "@/features/map/map_target_card";

// --- CATCH LOG IMPORTS ---
import {
  CatchLogModal,
  useCatchLog,
  createCatchMarkers,
  removeCatchMarkers,
  type ActiveLake,
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
          onClick={() => navigate("/account")}
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
  return f.source === "composite" && f.sourceLayer === "water";
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
  const { isActive, isLoading: statusLoading } = useMemberStatus();
  const navigate = useNavigate();
  const location = useLocation();
  const [dataVersion, setDataVersion] = useState(0);
  const [searchParams] = useSearchParams();

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
        tipReady: boolean;
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

  // Plan State
  const [lastPlanUrl, setLastPlanUrl] = useState<string | null>(() =>
    sessionStorage.getItem("aiq_last_plan_url"),
  );
  const [lastPlanLake, setLastPlanLake] = useState<string | null>(() =>
    sessionStorage.getItem("aiq_last_plan_lake"),
  );

  // Strategy/Generate Modals
  const [showReplaceConfirm, setShowReplaceConfirm] = useState(false);
  const [showGenerateConfirm, setShowGenerateConfirm] = useState(false);

  // Lure Selection Mode
  const [lureSelectionMode, setLureSelectionMode] = useState<"ai" | "user">("ai");
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

  // Favorite Navigation State
  const [viewingFavoriteId, setViewingFavoriteId] = useState<string | null>(
    null,
  );

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
                  image: `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/${lakeData.longitude},${lakeData.latitude},${imageZoom},0/600x400?access_token=${MAPBOX_TOKEN}`,
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
              image: `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/${f.lng},${f.lat},${imageZoom},0/600x400?access_token=${MAPBOX_TOKEN}`,
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
    const lake = favorites.find((f) => f.id === targetId);
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
    if (!draftEntry) {
      lastDraftOpenedRef.current = null;
      return;
    }
    const key = `${draftEntry.caughtAt ?? ""}|${draftEntry.lakeName ?? ""}`;
    if (lastDraftOpenedRef.current === key) return;
    lastDraftOpenedRef.current = key;
    catchLog.showForm(draftEntry as any);
  }, [draftEntry, catchLog]);

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

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    removeCatchMarkers(catchMarkersRef.current);
    catchMarkersRef.current = [];
    catchMarkersRef.current = createCatchMarkers(
      map,
      catchLog.lakeCatches,
      (entry) => catchLog.showDetail(entry),
    );
    return () => {
      removeCatchMarkers(catchMarkersRef.current);
    };
  }, [catchLog.lakeCatches, mapRef.current]);

  // --- WEATHER EFFECTS & CACHING ---

  // 1. COORDINATE CHANGE HANDLER (Immediate Cache Check)
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
      setTipReady(cached.tipReady);
      setTipSeen(cached.tipSeen);
    } else {
      console.log("🌦️ Cache MISS - Resetting state for:", key);
      setWeatherData(null);
      setTipReady(false);
      setTipSeen(false);
    }
  }, [selectedCoords?.lat, selectedCoords?.lng]);

  // 2. FETCH LOGIC (Using getApiBaseUrl for native platform support)
  useEffect(() => {
    if (showWeather && selectedCoords && !weatherData) {
      const key = getGeoKey(selectedCoords.lat, selectedCoords.lng);

      // Use getApiBaseUrl() which handles native vs web platforms correctly
      const baseUrl = getApiBaseUrl();

      fetch(
        `${baseUrl}/weather/current?lat=${selectedCoords.lat}&lon=${selectedCoords.lng}`,
      )
        .then((res) => {
          if (!res.ok) throw new Error("Weather fetch failed");
          return res.json();
        })
        .then((data) => {
          setWeatherData(data);
          weatherCache.current[key] = {
            data,
            timestamp: Date.now(),
            tipReady: false,
            tipSeen: false,
          };
        })
        .catch((err) => console.error("Weather fetch failed:", err));
    }
  }, [showWeather, selectedCoords, weatherData]);
  // 3. BACKGROUND TIMER LOGIC
  useEffect(() => {
    if (!showWeather && weatherData && !tipReady && selectedCoords) {
      const key = getGeoKey(selectedCoords.lat, selectedCoords.lng);
      console.log("⏳ Weather closed. Starting 10s analysis timer for:", key);
      const timer = setTimeout(() => {
        console.log("✅ Analysis complete. Tip Ready.");
        const currentKey = getGeoKey(selectedCoords.lat, selectedCoords.lng);
        if (currentKey === key) {
          setTipReady(true);
        }
        if (weatherCache.current[key]) {
          weatherCache.current[key].tipReady = true;
        }
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [showWeather, weatherData, tipReady, selectedCoords]);

  // 4. MARK SEEN LOGIC
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

    const m = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/outdoors-v12",
      center: startCenter,
      zoom: initialZoom,
      pitch: 0,
      preserveDrawingBuffer: true,
      attributionControl: false,
    });

    mapRef.current = m;
    m.dragRotate.disable();
    m.touchZoomRotate.disableRotation();

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
          setWaterName(polygonMatch.name);
          setLocationDetails({
            city: polygonMatch.city,
            state: polygonMatch.state,
          });
          if (polygonMatch.source === "favorite") {
            setViewingFavoriteId(polygonMatch.id);
          }
        } else if (nearbyFavorite) {
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
      m.remove();
    };
  }, [isActive]);

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
    const file = e.target.files?.[0];
    if (!file) return;
    let compressedFile = file;
    try {
      compressedFile = await compressImage(file);
    } catch (err) {
      console.warn("Compression failed, using original", err);
    }
    const getPosition = () => {
      return new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) return reject("No Geo");
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 10000,
        });
      });
    };
    let latitude = 0;
    let longitude = 0;
    let lakeName = "Unknown Water";
    try {
      const pos = await getPosition();
      latitude = pos.coords.latitude;
      longitude = pos.coords.longitude;
      const fav = findNearestFavorite(latitude, longitude, favorites);
      const db = findNearestLake(latitude, longitude);
      if (fav) lakeName = fav.name;
      else if (db) lakeName = db.name;
    } catch (gpsErr) {
      console.warn("GPS failed or timed out", gpsErr);
      if (selectedCoords) {
        latitude = selectedCoords.lat;
        longitude = selectedCoords.lng;
      }
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const imageData = ev.target?.result as string;
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
      setDraftEntry(newDraft);
    };
    reader.readAsDataURL(compressedFile);
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
      sessionStorage.setItem("aiq_last_plan_url", tokenUrl);
      sessionStorage.setItem("aiq_last_plan_lake", targetName || "");
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
      if (!isActive) {
        triggerUpgrade(
          "Generate AI fishing plans based on real-time conditions with Pro.",
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
      favorites,
      activeLake,
      waterName,
      currentFavorite,
      lastPlanUrl,
      lastPlanLake,
    ],
  );

  const handleWeatherClick = useCallback(() => {
    const isHomeLake =
      isActive || (favorites.length > 0 && activeLake?.id === favorites[0].id);
    if (!isActive && !isHomeLake) {
      triggerUpgrade(
        "Unlock real-time weather and intelligent planning for unlimited lakes. Free users get access to 1 Home Lake.",
      );
      return;
    }
    setShowWeather((prev) => !prev);
  }, [isActive, favorites, activeLake]);

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
        const createRes = await createCustomLake(
          {
            name: nameToSave,
            lat: selectedCoords.lat,
            lng: selectedCoords.lng,
            city: locationDetails.city || "",
            state: locationDetails.state || "",
            anchors: dbMatch?.anchors || [],
          },
          token!,
        );
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
      try {
        if (shouldCreateCustom) {
          lakeId = await performCustomCreation();
          if (!lakeId) throw new Error("Failed to get lake ID");
        } else {
          try {
            await addFavorite(lakeId, "known", token!);
          } catch (knownErr: any) {
            lakeType = "custom";
            lakeId = await performCustomCreation();
            if (!lakeId) throw new Error("Failed fallback creation");
            await addFavorite(lakeId, "custom", token!);
            return;
          }
        }
        if (lakeType === "custom") await addFavorite(lakeId, "custom", token!);
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
      style={{ position: "relative", height: "100vh", background: "#0a0a0a" }}
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
                        <h2 className="top-bar-lake-name">
                          {lakeLabelData.name}
                        </h2>
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
                  {favorites.map((lake) => {
                    const isActiveFav = lake.id === viewingFavoriteId;
                    return (
                      <div
                        key={`${lake.lake_type}:${lake.id}`}
                        className={`nav-fav-card ${isActiveFav ? "active" : ""}`}
                        onClick={() => {
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
                        style={{
                          backgroundImage: lake.image
                            ? `url(${lake.image})`
                            : undefined,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }}
                      >
                        <div className="nav-fav-card-gradient" />
                        <div className="nav-fav-card-content">
                          <div className="nav-fav-card-name">{lake.name}</div>
                          {lake.city && lake.state && (
                            <div className="nav-fav-card-location">
                              {lake.city}, {lake.state}
                            </div>
                          )}
                        </div>
                        <button
                          className="nav-fav-card-delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Remove ${lake.name} from favorites?`)) {
                              handleRemoveSpecificLake(lake);
                            }
                          }}
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

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
            <p style={{ opacity: 0.6, fontSize: "0.9rem", marginBottom: 20 }}>
              Create a bass fishing plan for <br />
              <strong style={{ color: "#4A90E2" }}>
                {currentFavorite?.name || waterName}
              </strong>
            </p>

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
                onClick={performGeneration}
                className="generate-btn"
                disabled={
                  lureSelectionMode === "user" &&
                  (!userPrimaryLure || !userSecondaryLure)
                }
                style={{
                  background:
                    lureSelectionMode === "user" &&
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
                Generate
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

      <style>{`
        .orb-marker-map { background-color: #4A90E2; border-radius: 50%; box-shadow: 0 0 10px rgba(74, 144, 226, 0.8), 0 0 0 2px rgba(255, 255, 255, 0.8); cursor: pointer; width: 24px; height: 24px; }
        .top-gradient-bar { position: fixed; top: calc(env(safe-area-inset-top, 0px) + 64px); left: 0; right: 0; z-index: 800; background: linear-gradient(to bottom, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.8) 50%, rgba(0,0,0,0.4) 80%, transparent 100%); padding: 16px 20px 45px; padding-left: max(20px, env(safe-area-inset-left, 20px)); padding-right: max(20px, env(safe-area-inset-right, 20px)); display: flex; justify-content: center; pointer-events: none; }
        .top-bar-card { display: flex; flex-direction: column; align-items: center; position: relative; min-width: 280px; max-width: 400px; text-align: center; pointer-events: auto; }
        .top-bar-card-empty { text-align: center; }
        .top-bar-label { font-size: 0.65rem; font-weight: 700; letter-spacing: 0.15em; color: #4A90E2; margin-bottom: 4px; }
        .top-bar-title { margin: 0; font-size: 1.5rem; font-weight: 700; color: #fff; letter-spacing: -0.02em; }
        .top-bar-subtitle { margin: 4px 0 0 0; font-size: 0.8rem; color: rgba(255,255,255,0.5); }
        .top-bar-close { position: absolute; top: 0; right: 0; background: transparent; border: none; color: rgba(255,255,255,0.4); cursor: pointer; padding: 4px; display: flex; align-items: center; justify-content: center; transition: color 0.2s; pointer-events: auto; }
        .top-bar-close:hover { color: rgba(255,255,255,0.8); }
        .top-bar-content-centered { display: flex; flex-direction: column; align-items: center; margin-top: 10px; padding-right: 40px; padding-left: 40px; }
        .top-bar-name-row { display: flex; align-items: center; gap: 12px; justify-content: center; }
        .top-bar-star-btn { background: transparent; border: none; color: rgba(255,255,255,0.3); cursor: pointer; padding: 4px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
        .top-bar-star-btn:hover { color: rgba(255,255,255,0.6); transform: scale(1.1); }
        .top-bar-star-btn.saved { color: #F59E0B; filter: drop-shadow(0 0 8px rgba(245, 158, 11, 0.4)); }
        .top-bar-lake-name { margin: 0; font-size: 1.5rem; font-weight: 800; color: #fff; letter-spacing: -0.02em; line-height: 1.2; text-shadow: 0 2px 4px rgba(0,0,0,0.5); }
        .top-bar-name-input { flex: 1; background: transparent; border: none; border-bottom: 1px dashed rgba(255,255,255,0.3); color: #fff; font-size: 1.25rem; font-weight: 700; padding: 4px 0; outline: none; letter-spacing: -0.02em; min-width: 0; text-align: center; }
        .top-bar-name-input:focus { border-bottom-color: #4A90E2; }
        .top-bar-name-input::placeholder { color: rgba(255,255,255,0.35); font-style: italic; font-weight: 500; }
        .top-bar-save-btn { width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, #4A90E2 0%, #357ABD 100%); border: none; color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all 0.2s; box-shadow: 0 4px 12px rgba(74, 144, 226, 0.4); }
        .top-bar-save-btn:hover:not(:disabled) { transform: scale(1.05); box-shadow: 0 6px 16px rgba(74, 144, 226, 0.5); }
        .top-bar-save-btn:disabled { opacity: 0.4; cursor: not-allowed; box-shadow: none; }
        .top-bar-location { display: flex; align-items: center; gap: 5px; color: rgba(255,255,255,0.6); font-size: 0.85rem; margin-top: 4px; font-weight: 500; }
        .top-bar-edit-boundary { display: flex; align-items: center; gap: 4px; padding: 2px 8px; background: rgba(74, 144, 226, 0.15); border: 1px solid rgba(74, 144, 226, 0.3); border-radius: 12px; color: #4A90E2; font-size: 0.7rem; font-weight: 600; cursor: pointer; transition: all 0.2s; }
        .top-bar-edit-boundary:hover { background: rgba(74, 144, 226, 0.25); }
        .top-bar-suggestion { display: flex; align-items: center; gap: 8px; margin-top: 10px; padding: 8px 12px; background: rgba(74, 144, 226, 0.15); border: 1px solid rgba(74, 144, 226, 0.3); border-radius: 10px; cursor: pointer; transition: all 0.2s; }
        .top-bar-suggestion:hover { background: rgba(74, 144, 226, 0.25); border-color: rgba(74, 144, 226, 0.5); }
        .top-bar-suggestion .suggestion-label { font-size: 0.7rem; color: rgba(255,255,255,0.5); font-weight: 500; }
        .top-bar-suggestion .suggestion-name { font-size: 0.85rem; color: #4A90E2; font-weight: 600; }
        .mapboxgl-ctrl-recenter { width: 29px; height: 29px; display: flex; align-items: center; justify-content: center; background: #fff; border: none; cursor: pointer; border-radius: 4px; }
        .mapboxgl-ctrl-recenter:hover { background: #f0f0f0; }
        .mapboxgl-ctrl-recenter svg { color: #333; }
        .members-navigation-container { position: fixed; bottom: calc(env(safe-area-inset-bottom, 0px) + 30px); left: 50%; transform: translateX(-50%); z-index: 1000; width: 92%; max-width: 480px; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        .members-navigation-container.expanded { bottom: calc(env(safe-area-inset-bottom, 0px) + 30px); }
        .members-navigation-container.native-ios { bottom: calc(env(safe-area-inset-bottom, 0px) + 10px); }
        .members-navigation-container.native-ios.expanded { bottom: calc(env(safe-area-inset-bottom, 0px) + 10px); }
        .glass-deck { display: flex; flex-direction: column; justify-content: flex-end; padding: 8px 12px; background: rgba(18, 18, 18, 0.92); backdrop-filter: blur(24px); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 28px; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1); transition: all 0.3s ease; position: relative; overflow: visible; }
        .nav-icons-row { display: flex; align-items: center; justify-content: space-between; width: 100%; height: 64px; }
        .nav-favorites-section { padding: 12px 8px 8px; border-bottom: 1px solid rgba(255,255,255,0.08); animation: nav-fav-slide-down 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes nav-fav-slide-down { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        .nav-favorites-header { display: flex; align-items: center; justify-content: space-between; padding: 0 4px 10px; }
        .nav-favorites-title { display: flex; align-items: baseline; gap: 8px; }
        .nav-favorites-title > span:first-child { font-size: 0.95rem; font-weight: 700; color: #fff; }
        .nav-favorites-count { font-size: 0.75rem; color: rgba(255,255,255,0.4); }
        .nav-favorites-scroll { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 4px; scrollbar-width: none; }
        .nav-favorites-scroll::-webkit-scrollbar { display: none; }
        .nav-fav-card { flex: 0 0 110px; height: 90px; border-radius: 14px; background: rgba(30, 30, 40, 0.6); position: relative; overflow: hidden; cursor: pointer; display: flex; flex-direction: column; justify-content: flex-end; padding: 10px; transition: all 0.2s; }
        .nav-fav-card:hover { border-color: rgba(255,255,255,0.2); }
        .nav-fav-card.active { border-color: #4A90E2; box-shadow: 0 0 12px rgba(74,144,226,0.3); }
        .nav-fav-card-gradient { position: absolute; inset: 0; background: linear-gradient(to bottom, transparent 20%, rgba(0,0,0,0.85) 100%); }
        .nav-fav-card-content { position: relative; z-index: 2; }
        .nav-fav-card-name { font-size: 0.8rem; font-weight: 600; color: #fff; line-height: 1.15; max-height: 2.3em; overflow: hidden; }
        .nav-fav-card-location { font-size: 0.65rem; color: rgba(255,255,255,0.6); margin-top: 2px; }
        .nav-fav-card-add { background: rgba(255,255,255,0.03); align-items: center; justify-content: center; flex-direction: column; gap: 4px; }
        .nav-fav-card-add span { font-size: 0.75rem; color: rgba(255,255,255,0.5); font-weight: 600; }
        .nav-fav-add-icon { color: rgba(255,255,255,0.4); }
        .nav-fav-card-delete { position: absolute; top: 6px; right: 6px; width: 24px; height: 24px; padding: 0; background: rgba(0,0,0,0.5); border-radius: 6px; border: none; color: rgba(255,255,255,0.7); opacity: 0; z-index: 10; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: opacity 0.2s; }
        .nav-fav-card:hover .nav-fav-card-delete { opacity: 1; }
        .nav-fav-card-delete:hover { background: rgba(239, 68, 68, 0.8); color: #fff; }
        .nav-cluster { flex: 1; display: flex; gap: 20px; align-items: center; }
        .nav-cluster-left { justify-content: center; }
        .nav-cluster-right { justify-content: center; }
        .nav-btn { display: flex; align-items: center; justify-content: center; width: 44px; height: 44px; border: none; background: transparent; cursor: pointer; border-radius: 12px; transition: all 0.2s; color: rgba(255, 255, 255, 0.5); }
        .nav-btn:hover:not(:disabled) { color: #fff; background: rgba(255,255,255,0.08); }
        .nav-btn:disabled { opacity: 0.35; cursor: not-allowed; }
        .nav-btn-icon { padding: 8px; }
        .nav-btn-primary { color: #4A90E2; background: rgba(74, 144, 226, 0.1); }
        .nav-btn-primary:hover:not(:disabled) { background: rgba(74, 144, 226, 0.25); color: #fff; box-shadow: 0 0 15px rgba(74, 144, 226, 0.3); }
        .nav-btn-danger { color: #F87171; }
        .nav-btn-danger:hover { background: rgba(248,113,113,0.15); color: #FCA5A5; }
        .orb-nav-cluster { display: flex; align-items: center; justify-content: center; margin-top: -10px; }
        .orb-wrapper { width: 64px; height: 64px; display: flex; align-items: center; justify-content: center; background: transparent; cursor: pointer; position: relative; }
        .orb-glow-ring { position: absolute; inset: 4px; border-radius: 50%; background: linear-gradient(180deg, rgba(74, 144, 226, 0.6), transparent); opacity: 0.2; z-index: -1; animation: orb-pulse 3s infinite; }
        .nav-center-orb { position: relative; width: 56px; height: 56px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
        .nav-center-orb-core { width: 24px; height: 24px; border-radius: 50%; background: #4A90E2; box-shadow: 0 0 12px rgba(74, 144, 226, 0.8); z-index: 2; transition: all 0.3s ease; }
        .nav-center-orb:hover .nav-center-orb-core { transform: scale(1.1); background: #60a5fa; box-shadow: 0 0 20px rgba(74, 144, 226, 1); }
        .nav-center-orb-glow { position: absolute; inset: 0; margin: auto; width: 100%; height: 100%; border-radius: 50%; animation: nav-orb-pulse 3s infinite ease-in-out; pointer-events: none; }
        @keyframes nav-orb-pulse { 0% { box-shadow: 0 0 0 0 rgba(74, 144, 226, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(74, 144, 226, 0); } 100% { box-shadow: 0 0 0 0 rgba(74, 144, 226, 0); } }
        .modal-overlay { position: fixed; inset: 0; z-index: 2000; background: rgba(0,0,0,0.6); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; padding: 16px; }
        .modal-content { width: 100%; max-width: 420px; border-radius: 24px; background: rgba(15, 15, 20, 0.95); backdrop-filter: blur(24px); border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 25px 60px rgba(0,0,0,0.6); display: flex; flex-direction: column; }
        .modal-header { padding: 20px 24px; border-bottom: 1px solid rgba(255,255,255,0.06); display: flex; justify-content: space-between; align-items: center; color: white; }
        .close-btn { background: rgba(255,255,255,0.05); border: none; border-radius: 100%; width: 36px; height: 36px; color: rgba(255,255,255,0.6); font-size: 1.3rem; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .modal-body { padding: 24px; display: flex; flex-direction: column; gap: 20px; color: white; }
        .glass-input { width: 100%; padding: 14px 16px; border-radius: 12px; font-size: 1rem; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.08); color: #fff; outline: none; }
        .glass-segment { display: flex; background: rgba(0,0,0,0.3); border-radius: 12px; padding: 4px; gap: 4px; border: 1px solid rgba(255,255,255,0.05); }
        .segment-btn { flex: 1; padding: 12px; border-radius: 10px; border: none; background: transparent; color: rgba(255,255,255,0.5); font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .segment-btn.active { background: rgba(74, 144, 226, 0.2); color: #fff; }
        .coords-display { padding: 14px 16px; background: rgba(0,0,0,0.3); border-radius: 14px; border: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center; }
        .modal-label { display: block; font-size: 0.7rem; font-weight: 700; opacity: 0.5; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.1em; }
        .modal-btn { flex: 1; padding: 14px; border-radius: 14px; display: flex; align-items: center; justify-content: center; gap: 10px; cursor: pointer; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); color: rgba(255,255,255,0.6); }
        .modal-btn.active { background: rgba(74, 144, 226, 0.15); border-color: rgba(74, 144, 226, 0.4); color: #fff; }
        .generate-btn { flex: 1; padding: 18px; color: #fff; border: none; border-radius: 16px; font-weight: 700; font-size: 1.05rem; cursor: pointer; box-shadow: 0 8px 24px rgba(74, 144, 226, 0.25); }
        .save-fav-btn { width: 60px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; color: #fff; cursor: pointer; }
        .save-fav-btn.remove { border-color: rgba(255, 107, 107, 0.4); background: rgba(255, 107, 107, 0.1); }
        .menu-item-btn { width: 100%; padding: 10px; text-align: left; background: transparent; border: none; font-weight: 600; cursor: pointer; }
        .menu-divider { height: 1px; background: rgba(255,255,255,0.1); margin: 2px 0; }
        @keyframes slide-up { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse-dot { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.3); opacity: 0.7; } 100% { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
}
