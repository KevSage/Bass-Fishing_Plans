// src/pages/Members.tsx

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import { useUser, useAuth } from "@clerk/clerk-react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";

// API Imports
import { generateMemberPlan, RateLimitError } from "@/lib/api";
import {
  listFavorites,
  addFavorite,
  removeFavorite,
  listCustomLakes,
  createCustomLake,
  updateCustomLake,
  type CustomLake,
  type FavoriteLake as ApiFavoriteLake,
} from "@/lib/catches-api";

import { useMemberStatus } from "@/hooks/useMemberStatus";
import { LocationSearch } from "@/components/LocationSearch";
import { PlanGenerationLoader } from "@/components/PlanGenerationLoader";
import { MapOrb } from "@/components/MapOrb";
import { FavoritesCarousel } from "@/components/FavoritesCarousel";

// --- CATCH LOG IMPORTS ---
import {
  CatchLogModal,
  useCatchLog,
  createCatchMarkers,
  removeCatchMarkers,
  type ActiveLake,
} from "@/components/CatchLog";

// --- LAKE LABEL IMPORTS ---
import {
  LakeLabel,
  useLakeLabelVisibility,
  type LakeLabelData,
} from "@/components/LakeLabel";

// --- DATA IMPORT ---
import LAKES_DATA from "../data/lakes.json";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

// =============================================================================
// LOCAL ICONS
// =============================================================================

const BookmarkIcon = ({ size = 20 }: { size?: number }) => (
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
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
);
const MinusCircleIcon = ({ size = 20 }: { size?: number }) => (
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
    <circle cx="12" cy="12" r="10" />
    <line x1="8" y1="12" x2="16" y2="12" />
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
const BoatIcon = ({ active }: { active: boolean }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke={active ? "#4A90E2" : "currentColor"}
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M2 17l1.5-4h17L22 17H2z" />
    <path d="M6 13l2-3h8l2 3" />
    <path d="M12 3v10" />
    <path d="M18 6l-1-3H7L6 6" />
  </svg>
);
const BankIcon = ({ active }: { active: boolean }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke={active ? "#4A90E2" : "currentColor"}
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M19 21v-6" />
    <path d="M19 15l-3-3" />
    <path d="M22 15l-3-3" />
    <circle cx="12" cy="7" r="4" />
    <path d="M5.5 21a9 9 0 0 1 12.8 0" />
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
const CheckIcon = ({ size = 28 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const PlusIcon = ({ size = 24 }: { size?: number }) => (
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
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);
const TrashIcon = ({ size = 14 }: { size?: number }) => (
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
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
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
const SearchIcon = ({ size = 18 }: { size?: number }) => (
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
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const PinIcon = ({ size = 18 }: { size?: number }) => (
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
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

// =============================================================================
// TYPES
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

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function isWaterFeature(f: mapboxgl.MapboxGeoJSONFeature): boolean {
  return f.source === "composite" && f.sourceLayer === "water";
}

const createOrbMarker = () => {
  const el = document.createElement("div");
  el.className = "orb-marker-map";
  el.style.width = "24px";
  el.style.height = "24px";
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

// Calculate appropriate zoom level based on lake size
function getZoomForLake(acres?: number): number {
  if (!acres) return 14; // Unknown size - default medium zoom
  if (acres > 30000) return 10; // Huge (Lake Lanier, Guntersville) - wide view
  if (acres > 10000) return 11; // Large reservoir
  if (acres > 5000) return 12; // Medium-large lake
  if (acres > 1000) return 13; // Medium lake
  return 14; // Small lake/pond - tight zoom
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

function findNearestLake(lat: number, lng: number): LakeData | null {
  const bboxMatch = (LAKES_DATA as LakeData[]).find((l) => {
    if (!l.bbox) return false;
    const [minLng, minLat, maxLng, maxLat] = l.bbox;
    return lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
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
  const { user } = useUser();
  const { getToken } = useAuth();
  const { isActive, isLoading: statusLoading } = useMemberStatus();
  const navigate = useNavigate();
  const location = useLocation(); // 👈 Add this
  const [dataVersion, setDataVersion] = useState(0); // 👈 Add this (triggers refetch)
  const [searchParams] = useSearchParams();

  // --- PERSISTENT STATE ---
  const [favorites, setFavorites] = useState<FavoriteLake[]>([]);
  const [customLakes, setCustomLakes] = useState<
    Array<CustomLake & { anchors?: { lat: number; lng: number }[] }>
  >([]);

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
  const [showStrategyMenu, setShowStrategyMenu] = useState(false); // Case B
  const [showReplaceConfirm, setShowReplaceConfirm] = useState(false); // Case C
  const [showGenerateConfirm, setShowGenerateConfirm] = useState(false); // Case A

  // Outline Prompt Modal
  const [showOutlinePrompt, setShowOutlinePrompt] = useState(false);
  const [recentCustomLakeId, setRecentCustomLakeId] = useState<string | null>(
    null,
  );

  // Rate Limiting / Loading
  const [rateLimitInfo, setRateLimitInfo] = useState<{
    message: string;
    secondsRemaining: number;
  } | null>(null);
  const [showModal, setShowModal] = useState(false); // Scout Modal
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
      console.log("Refreshing data...", location.state.lakeId);
      processedRefreshRef.current = refreshTimestamp;
      setDataVersion((v) => v + 1); // Triggers the fetches above

      // Store lakeId to select after data loads
      if (location.state.lakeId) {
        pendingLakeSelectRef.current = location.state.lakeId;
      }

      // Clear navigation state so it doesn't loop
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // --- API FETCHERS ---
  useEffect(() => {
    let mounted = true;
    async function fetchFavs() {
      const token = await getToken();
      if (!token) return;
      try {
        const res = await listFavorites(token);
        console.log(
          "listFavorites API response:",
          res.favorites?.map((f: any) => ({ id: f.lake_id, name: f.name })),
        );
        if (mounted && res.favorites) {
          const mapped: FavoriteLake[] = res.favorites.map((f: any) => {
            const acres = f.acres || undefined;
            const imageZoom = getZoomForLake(acres);
            return {
              id: f.lake_id,
              lake_type: f.lake_type,
              name: f.name,
              lat: f.lat,
              lng: f.lng,
              city: f.city || undefined,
              state: f.state || undefined,
              acres: acres,
              tier: f.tier || undefined,
              zoom: imageZoom,
              image: `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/${f.lng},${f.lat},${imageZoom},0/600x400?access_token=${MAPBOX_TOKEN}`,
            };
          });
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
  }, [getToken, dataVersion]);

  useEffect(() => {
    let mounted = true;
    async function fetchCustomLakes() {
      const token = await getToken();
      if (!token) return;
      try {
        const res = await listCustomLakes(token);
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
  }, [getToken, dataVersion]);

  // Handle pending lake selection after returning from LakeBuilder
  useEffect(() => {
    if (!pendingLakeSelectRef.current) return;
    if (favorites.length === 0) return;

    const targetId = pendingLakeSelectRef.current;
    const lake = favorites.find((f) => f.id === targetId);

    if (lake) {
      // Select the lake (same pattern as FavoritesCarousel onSelect)
      setWaterName(lake.name);
      setViewingFavoriteId(lake.id);
      setLocationDetails({ city: lake.city, state: lake.state });
      setSelectedCoords({ lat: lake.lat, lng: lake.lng });

      // Fly to it after a short delay to ensure map is ready
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.flyTo({
            center: [lake.lng, lake.lat],
            zoom: getZoomForLake(lake.acres),
            duration: 2000,
          });
        }
      }, 300);

      // Clear pending
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

  const currentFavorite = useMemo(() => {
    return favorites.find((f) => f.id === viewingFavoriteId) || null;
  }, [favorites, viewingFavoriteId]);

  const hydrateLakeData = (
    name: string,
    lat: number,
    lng: number,
  ): LakeData | undefined => {
    const normalize = (s: string) => s.toLowerCase().replace("lake", "").trim();
    const query = normalize(name);
    let match = (LAKES_DATA as LakeData[]).find(
      (l) =>
        normalize(l.name).includes(query) || query.includes(normalize(l.name)),
    );
    if (!match)
      match = (LAKES_DATA as LakeData[]).find(
        (l) =>
          Math.abs(l.latitude - lat) < 0.05 &&
          Math.abs(l.longitude - lng) < 0.05,
      );
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

  const lakeLabelVisible = useLakeLabelVisibility(
    mapRef.current,
    selectedCoords?.lat ?? null,
    selectedCoords?.lng ?? null,
  );

  const lakeLabelData: LakeLabelData | null = useMemo(() => {
    if (!selectedCoords) return null;
    const isSaved = favorites.some(
      (f) =>
        f.name === waterName ||
        (Math.abs(f.lat - selectedCoords.lat) < 0.001 &&
          Math.abs(f.lng - selectedCoords.lng) < 0.001),
    );
    const isKnown =
      waterName !== "" &&
      !waterName.startsWith("Water near") &&
      !waterName.startsWith("Dropped Pin");
    return {
      name: waterName,
      city: locationDetails.city,
      state: locationDetails.state,
      lat: selectedCoords.lat,
      lng: selectedCoords.lng,
      isSaved,
      isKnown,
    };
  }, [selectedCoords, waterName, locationDetails, favorites]);

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

  // --- MAP INIT ---
  useEffect(() => {
    isMountedRef.current = true;
    if (
      initialized.current ||
      !mapContainer.current ||
      !MAPBOX_TOKEN ||
      !isActive
    )
      return;
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
        showFavoritesRef.current ||
        viewingFavoriteIdRef.current
      ) {
        if (showFavoritesRef.current) setShowFavorites(false);
        if (viewingFavoriteIdRef.current) setViewingFavoriteId(null);
        return;
      }
      if (abortControllerRef.current) abortControllerRef.current.abort();
      abortControllerRef.current = new AbortController();

      try {
        const { lng, lat } = e.lngLat;
        setSelectedCoords({ lat, lng });
        setInputMode("manual");
        setLocationDetails({});

        if (markerRef.current) markerRef.current.remove();
        if (markerElementRef.current) markerElementRef.current.remove();
        const markerEl = createOrbMarker();
        markerElementRef.current = markerEl;
        markerRef.current = new mapboxgl.Marker({ element: markerEl })
          .setLngLat([lng, lat])
          .addTo(mapRef.current);

        const features = mapRef.current.queryRenderedFeatures(e.point);
        const water = features.find(isWaterFeature);
        const vectorName: string | undefined = water?.properties?.name;
        let dbMatch: LakeData | undefined;

        if (vectorName) {
          const searchName = vectorName.toLowerCase();
          dbMatch = (LAKES_DATA as LakeData[]).find((l) =>
            l.name.toLowerCase().includes(searchName),
          );
        }

        const nearbyFavorite = findNearestFavorite(
          lat,
          lng,
          favoritesRef.current,
        );
        const nearbyUserLake = !nearbyFavorite
          ? findUserLakeByAnchors(lat, lng, customLakesRef.current as any)
          : null;
        const nearbyLake =
          dbMatch ||
          (!nearbyFavorite && !nearbyUserLake
            ? findNearestLake(lat, lng)
            : null);

        if (nearbyFavorite) {
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

        if (!nearbyFavorite && (!nearbyLake || !nearbyLake.city)) {
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

  const handleLiveCameraClick = () => {
    if (liveCameraInputRef.current) {
      liveCameraInputRef.current.value = "";
      liveCameraInputRef.current.click();
    }
  };
  const handleLiveCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!navigator.geolocation) {
      alert("GPS required.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        let lakeName = "Unknown Water";
        const fav = findNearestFavorite(latitude, longitude, favorites);
        const db = findNearestLake(latitude, longitude);
        if (fav) lakeName = fav.name;
        else if (db) lakeName = db.name;
        const reader = new FileReader();
        reader.onload = (ev) => {
          const imageData = ev.target?.result as string;
          const newDraft = {
            caughtAt: new Date().toISOString(),
            lakeName: lakeName,
            lakeLat: latitude,
            lakeLng: longitude,
            imageData: imageData,
            catchLat: latitude,
            catchLng: longitude,
            lure: "",
            weight: 0,
            species: "Largemouth Bass",
          };
          setDraftEntry(newDraft);
        };
        reader.readAsDataURL(file);
      },
      (err) => {
        console.error(err);
        alert("GPS Error.");
      },
      { enableHighAccuracy: true },
    );
  };

  const handleCloseScoutModal = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setShowModal(false);
  };

  const handleSearchSelect = useCallback(
    async (location: {
      name: string;
      latitude: number;
      longitude: number;
      city?: string;
      state?: string;
    }) => {
      setShowModal(false);
      setWaterName(location.name);
      setLocationDetails({ city: location.city, state: location.state });
      setSelectedCoords({ lat: location.latitude, lng: location.longitude });
      setInputMode("manual");
      if (mapRef.current) {
        mapRef.current.flyTo({
          center: [location.longitude, location.latitude],
          zoom: 12,
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
  }, [user, selectedCoords, waterName, accessType, currentFavorite, navigate]);

  // --- GENERATE BUTTON LOGIC (STRICT 3-CASE) ---
  const handleStrategyClick = useCallback(
    (e?: React.MouseEvent) => {
      e?.preventDefault();
      e?.stopPropagation();
      const targetName = currentFavorite ? currentFavorite.name : waterName;
      if (!targetName && !activeLake) return;

      const hasPlan = !!lastPlanUrl;
      const isSameLake = lastPlanLake === targetName;

      // Case B: Plan exists for this same lake
      if (hasPlan && isSameLake) {
        setShowStrategyMenu(true);
      }
      // Case C: Plan exists for different lake
      else if (hasPlan && !isSameLake) {
        setShowReplaceConfirm(true);
      }
      // Case A: No plan exists
      else {
        setShowGenerateConfirm(true);
      }
    },
    [activeLake, waterName, currentFavorite, lastPlanUrl, lastPlanLake],
  );

  const handleResumePlan = useCallback(() => {
    setShowStrategyMenu(false);
    if (lastPlanUrl) navigate(lastPlanUrl);
  }, [lastPlanUrl, navigate]);

  // --- SAVE / REMOVE LOGIC ---
  const handleRemoveSpecificLake = useCallback(
    async (lake: FavoriteLake) => {
      // Optimistic Update
      setFavorites((prev) => prev.filter((f) => f.id !== lake.id));
      try {
        const token = await getToken();
        if (!token) throw new Error("No token");
        await removeFavorite(lake.id, lake.lake_type, token);
      } catch (err) {
        console.error("Failed to remove favorite", err);
        setFavorites((prev) => [...prev, lake]);
        alert("Failed to remove lake.");
      }
    },
    [getToken],
  );

  const toggleFavoriteLake = useCallback(
    async (e?: React.MouseEvent) => {
      e?.preventDefault();
      e?.stopPropagation();
      if (!waterName || !selectedCoords) return;
      const token = await getToken();
      if (!token) return;

      if (isCurrentLocationSaved) {
        const fav = favorites.find(
          (f) =>
            f.name === waterName ||
            (Math.abs(f.lat - selectedCoords.lat) < 0.001 &&
              Math.abs(f.lng - selectedCoords.lng) < 0.001),
        );
        if (fav) {
          if (confirm(`Remove ${fav.name}?`)) handleRemoveSpecificLake(fav);
        }
      } else {
        const dbMatch = hydrateLakeData(
          waterName,
          selectedCoords.lat,
          selectedCoords.lng,
        );
        let lakeId = "";
        let lakeType: "known" | "custom" = "known";
        let shouldCreateCustom = false;

        // If strict match AND names match, use DB ID.
        // If user renamed it (waterName !== dbMatch.name), force custom.
        if (dbMatch && dbMatch.id && dbMatch.name === waterName) {
          lakeId = dbMatch.id;
          lakeType = "known";
        } else {
          // No DB match OR user renamed it -> Custom
          lakeType = "custom";
          shouldCreateCustom = true;
        }

        const performCustomCreation = async () => {
          const nameToSave = manualWaterName || waterName;
          console.log("Creating custom lake with name:", nameToSave);
          const createRes = await createCustomLake(
            {
              name: nameToSave,
              lat: selectedCoords.lat,
              lng: selectedCoords.lng,
              city: locationDetails.city || "",
              state: locationDetails.state || "",
              anchors: [],
            },
            token,
          );
          console.log("createCustomLake API response:", createRes);
          if (createRes.success) {
            return (createRes as any).lake_id;
          } else {
            // Existing lake found - update its name if user provided a different one
            const existingLake = (createRes as any).existing_lake;
            if (
              existingLake &&
              nameToSave &&
              existingLake.name !== nameToSave
            ) {
              console.log(
                "Updating existing lake name from",
                existingLake.name,
                "to",
                nameToSave,
              );
              try {
                await updateCustomLake(
                  existingLake.id,
                  { name: nameToSave },
                  token,
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
            setRecentCustomLakeId(lakeId);
            setShowOutlinePrompt(true);
          } else {
            try {
              await addFavorite(lakeId, "known", token);
            } catch (knownErr: any) {
              console.warn("Known lake 404, fallback custom...");
              lakeType = "custom";
              lakeId = await performCustomCreation();
              if (!lakeId) throw new Error("Failed fallback creation");
              await addFavorite(lakeId, "custom", token);
              setRecentCustomLakeId(lakeId);
              setShowOutlinePrompt(true);
              return;
            }
          }
          if (lakeType === "custom") await addFavorite(lakeId, "custom", token);

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
        } catch (err) {
          console.error("Failed to save favorite", err);
          alert("Error saving lake. Please try again.");
        }
      }
    },
    [
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

  const onSaveCustomName = useCallback(
    (name: string) => {
      setWaterName(name);
      setTimeout(() => toggleFavoriteLake(), 0);
    },
    [setWaterName, toggleFavoriteLake],
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

  if (loading)
    return <PlanGenerationLoader lakeName={waterName || "Selected Water"} />;
  if (statusLoading)
    return (
      <div style={{ padding: 100, textAlign: "center", color: "#fff" }}>
        Loading your Maps...
      </div>
    );
  if (!isActive) return <div />;

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
        <style>{`.mapboxgl-ctrl-top-right { top: 20px !important; }`}</style>
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

      {!showModal && !catchLog.isOpen && !showFavorites && (
        <LakeLabel
          lake={lakeLabelData}
          isVisible={lakeLabelVisible && !!selectedCoords}
          onNameChange={setManualWaterName}
          onSave={onSaveCustomName}
          lakesData={lakeSuggestionsData}
          onAcceptSuggestion={(name, city, state) => {
            setWaterName(name);
            setManualWaterName(name);
            if (city || state) setLocationDetails({ city, state });
          }}
        />
      )}

      {showFavorites && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 998,
            background: "rgba(0,0,0,0.3)",
            backdropFilter: "blur(2px)",
          }}
          onClick={() => setShowFavorites(false)}
        />
      )}

      {/* NAV PANEL */}
      {!catchLog.isOpen && (
        <div
          className={`members-navigation-container ${showFavorites ? "expanded" : ""}`}
        >
          {!showFavorites && (
            <button
              onClick={handleLiveCameraClick}
              className="fab-camera"
              aria-label="Log Catch Live"
            >
              <CameraIcon size={26} />
            </button>
          )}
          <div className="glass-deck">
            {showFavorites && (
              <FavoritesCarousel
                favorites={favorites}
                currentId={viewingFavoriteId}
                onClose={() => setShowFavorites(false)}
                onAddNew={() => {
                  setShowFavorites(false);
                  setShowModal(true);
                }}
                onRemove={handleRemoveSpecificLake}
                onSelect={(lake) => {
                  setWaterName(lake.name);
                  setViewingFavoriteId(lake.id);
                  setLocationDetails({ city: lake.city, state: lake.state });
                  setSelectedCoords({ lat: lake.lat, lng: lake.lng });
                  if (mapRef.current)
                    mapRef.current.flyTo({
                      center: [lake.lng, lake.lat],
                      zoom: getZoomForLake(lake.acres),
                      duration: 2000,
                    });
                  setShowFavorites(false);
                }}
              />
            )}
            <div className="nav-icons-row">
              <div className="nav-cluster nav-cluster-left">
                <button
                  onClick={handleOpenScoutModal}
                  className="nav-btn nav-btn-icon"
                  aria-label="Scout Water"
                >
                  <RadarIcon size={22} />
                </button>
                <button
                  onClick={toggleFavoriteLake}
                  disabled={!selectedCoords}
                  className={`nav-btn nav-btn-icon ${isCurrentLocationSaved ? "nav-btn-danger" : ""}`}
                  aria-label={isCurrentLocationSaved ? "Remove" : "Save"}
                >
                  {isCurrentLocationSaved ? (
                    <MinusCircleIcon size={22} />
                  ) : (
                    <BookmarkIcon size={22} />
                  )}
                </button>
              </div>
              <div className="orb-nav-cluster">
                <div
                  className="orb-wrapper"
                  onClick={() => setShowFavorites((prev) => !prev)}
                  style={{ cursor: "pointer" }}
                  aria-label="Toggle Favorites"
                >
                  <div className="orb-glow-ring" />
                  <MapOrb size={26} />
                </div>
              </div>
              <div className="nav-cluster nav-cluster-right">
                <div style={{ position: "relative" }}>
                  <button
                    onClick={handleStrategyClick}
                    className="nav-btn nav-btn-icon nav-btn-primary"
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
                  {showStrategyMenu && (
                    <>
                      <div
                        style={{ position: "fixed", inset: 0, zIndex: 3000 }}
                        onClick={() => setShowStrategyMenu(false)}
                      />
                      <div
                        style={{
                          position: "absolute",
                          bottom: "130%",
                          right: 0,
                          background: "rgba(20,20,20,0.95)",
                          backdropFilter: "blur(12px)",
                          borderRadius: 12,
                          border: "1px solid rgba(255,255,255,0.1)",
                          width: 160,
                          padding: 4,
                          zIndex: 3001,
                          boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
                        }}
                      >
                        <button
                          onClick={handleResumePlan}
                          className="menu-item-btn"
                          style={{ color: "#fff" }}
                        >
                          View Active Plan
                        </button>
                        <div className="menu-divider" />
                        <button
                          onClick={() => {
                            setShowStrategyMenu(false);
                            performGeneration();
                          }}
                          className="menu-item-btn"
                          style={{ color: "#4A90E2" }}
                        >
                          Regenerate
                        </button>
                      </div>
                    </>
                  )}
                </div>
                <button
                  onClick={catchLog.open}
                  className="nav-btn nav-btn-icon"
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

      {/* CONFIRM MODALS (Cases A & C) */}
      {showGenerateConfirm && (
        <div
          className="modal-overlay"
          onClick={() => setShowGenerateConfirm(false)}
        >
          <div
            className="glass-panel modal-content"
            style={{
              maxWidth: 320,
              alignItems: "center",
              textAlign: "center",
              padding: 30,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <LightningIcon size={40} />
            <h3 style={{ marginTop: 15, marginBottom: 5 }}>Generate Plan?</h3>
            <p style={{ opacity: 0.6, fontSize: "0.9rem", marginBottom: 20 }}>
              Create a bass fishing plan for <br />
              <strong style={{ color: "#4A90E2" }}>
                {currentFavorite?.name || waterName}
              </strong>
            </p>
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
                style={{
                  background:
                    "linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)",
                  padding: "12px",
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
                onClick={performGeneration}
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

      {/* OUTLINE PROMPT MODAL */}
      {showOutlinePrompt && (
        <div className="modal-overlay">
          <div
            className="glass-panel modal-content"
            style={{
              maxWidth: 320,
              padding: 24,
              textAlign: "center",
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: "rgba(74, 144, 226, 0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#4A90E2",
                marginBottom: 16,
              }}
            >
              <CheckIcon size={28} />
            </div>
            <h3 style={{ margin: "0 0 8px 0", fontSize: "1.2rem" }}>
              Location Saved
            </h3>
            <p
              style={{
                margin: "0 0 24px 0",
                opacity: 0.7,
                fontSize: "0.9rem",
                lineHeight: 1.5,
              }}
            >
              Would you like to outline the boundaries for better accuracy?
            </p>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                width: "100%",
              }}
            >
              <button
                onClick={() => {
                  setShowOutlinePrompt(false);
                  if (recentCustomLakeId && selectedCoords) {
                    navigate("/lake-builder", {
                      state: {
                        lat: selectedCoords.lat,
                        lng: selectedCoords.lng,
                        suggestedName: waterName,
                        city: locationDetails.city,
                        state: locationDetails.state,
                        lakeId: recentCustomLakeId,
                      },
                    });
                  }
                }}
                className="generate-btn"
                style={{
                  background:
                    "linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)",
                  padding: "14px",
                  fontSize: "1rem",
                }}
              >
                Outline Boundary
              </button>
              <button
                onClick={() => setShowOutlinePrompt(false)}
                className="modal-btn"
                style={{
                  background: "transparent",
                  border: "none",
                  color: "rgba(255,255,255,0.6)",
                }}
              >
                Keep as Pin Only
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SCOUT MODAL */}
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
              <div className="segment-control glass-segment">
                <button
                  type="button"
                  onClick={() => setInputMode("search")}
                  className={`segment-btn ${inputMode === "search" ? "active" : ""}`}
                >
                  <SearchIcon /> Search
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode("manual")}
                  className={`segment-btn ${inputMode === "manual" ? "active" : ""}`}
                >
                  <PinIcon /> Manual
                </button>
              </div>
              <div>
                {inputMode === "search" ? (
                  <>
                    <label className="modal-label">Find Water</label>
                    <div style={{ position: "relative" }}>
                      <style>{`.location-search-dropdown { position: absolute !important; top: 100% !important; z-index: 9999 !important; background: rgba(20, 20, 30, 0.98) !important; border: 1px solid rgba(255,255,255,0.1) !important; border-radius: 10px !important; }`}</style>
                      <LocationSearch
                        onSelect={handleSearchSelect}
                        placeholder="Search 1,000+ Lakes..."
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <label className="modal-label">Confirm Location Name</label>
                    <input
                      value={waterName}
                      onChange={(e) => setWaterName(e.target.value)}
                      className="glass-input"
                      placeholder="e.g. Lake Lanier"
                      autoComplete="off"
                      spellCheck={false}
                    />
                  </>
                )}
              </div>
              {selectedCoords && (
                <div className="coords-display">
                  <div>
                    <div className="coords-label">Confirmed Drop Point</div>
                    <div className="coords-value">
                      {selectedCoords.lat.toFixed(5)},{" "}
                      {selectedCoords.lng.toFixed(5)}
                    </div>
                  </div>
                  <div style={{ color: "#4ecdc4", fontSize: "1.4rem" }}>✓</div>
                </div>
              )}
              {/* RESTORED PLATFORM TOGGLES */}
              <div>
                <label className="modal-label">Platform</label>
                <div style={{ display: "flex", gap: 12 }}>
                  <button
                    type="button"
                    onClick={() => setAccessType("boat")}
                    className={`glass-toggle modal-btn ${accessType === "boat" ? "active" : ""}`}
                  >
                    <BoatIcon active={accessType === "boat"} />{" "}
                    <span>Boat</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccessType("bank")}
                    className={`glass-toggle modal-btn ${accessType === "bank" ? "active" : ""}`}
                  >
                    <BankIcon active={accessType === "bank"} />{" "}
                    <span>Bank</span>
                  </button>
                </div>
              </div>

              <div style={{ marginTop: "auto", display: "flex", gap: 10 }}>
                {isCurrentLocationSaved && (
                  <button
                    type="button"
                    onClick={toggleFavoriteLake}
                    className="save-fav-btn remove"
                  >
                    <MinusCircleIcon />
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleStrategyClick}
                  disabled={!!rateLimitInfo || !waterName || !selectedCoords}
                  className="generate-btn"
                  style={{
                    background: rateLimitInfo
                      ? "rgba(255,255,255,0.1)"
                      : "linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)",
                  }}
                >
                  {rateLimitInfo
                    ? `Wait (${rateLimitInfo.secondsRemaining}s)`
                    : "Generate Plan"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STYLES */}
      <style>
        {`
        .orb-marker-map { width: 24px; height: 24px; background: radial-gradient(circle at 30% 30%, #4A90E2, #357ABD); border-radius: 50%; box-shadow: 0 0 16px rgba(74,144,226,0.6), inset 0 -2px 4px rgba(0,0,0,0.3); border: 2px solid rgba(255,255,255,0.8); position: relative; }
        .orb-marker-map::after { content: ''; position: absolute; top: 50%; left: 50%; width: 100%; height: 100%; border-radius: 50%; border: 2px solid rgba(74,144,226,0.5); animation: map-orb-pulse 2s infinite ease-out; }
        @keyframes map-orb-pulse { 0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0.8; } 100% { transform: translate(-50%, -50%) scale(2.5); opacity: 0; } }

        .mapboxgl-ctrl-recenter {
          width: 29px; height: 29px;
          display: flex; align-items: center; justify-content: center;
          background: #fff; border: none; cursor: pointer;
          border-radius: 4px;
        }
        .mapboxgl-ctrl-recenter:hover { background: #f0f0f0; }
        .mapboxgl-ctrl-recenter svg { color: #333; }

        .members-navigation-container { position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%); z-index: 1000; width: 92%; max-width: 480px; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        .members-navigation-container.expanded { bottom: 30px; }
        
        .glass-deck { 
          display: flex; flex-direction: column; justify-content: flex-end; 
          padding: 8px 12px; background: rgba(18, 18, 18, 0.92); 
          backdrop-filter: blur(24px); border: 1px solid rgba(255, 255, 255, 0.12); 
          border-radius: 28px; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1); 
          transition: all 0.3s ease; position: relative; 
          /* CRITICAL: Overflow visible to allow menus to pop out */
          overflow: visible; 
        }

        .nav-icons-row { display: flex; align-items: center; justify-content: space-between; width: 100%; height: 64px; }
        
        .favorites-scroll-area { width: 100%; padding: 16px 4px 8px; animation: slide-up 0.3s ease-out; border-bottom: 1px solid rgba(255,255,255,0.06); margin-bottom: 8px; }
        .fav-title-row { display: flex; align-items: baseline; gap: 8px; margin-bottom: 12px; padding-left: 4px; }
        .fav-title-row span:first-child { font-weight: 700; color: #fff; }
        .fav-count { font-size: 0.8rem; color: rgba(255,255,255,0.4); }

        .fav-list-horiz { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 4px; scrollbar-width: none; }
        .fav-list-horiz::-webkit-scrollbar { display: none; }

        .fav-card { flex: 0 0 100px; height: 100px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1); position: relative; overflow: hidden; cursor: pointer; display: flex; flex-direction: column; justify-content: flex-end; padding: 10px; }
        .fav-card.active { border-color: #4A90E2; box-shadow: 0 0 12px rgba(74,144,226,0.3); }
        .fav-card-gradient { position: absolute; inset: 0; background: linear-gradient(to bottom, transparent, rgba(0,0,0,0.8)); }
        .fav-card-content { position: relative; z-index: 2; }
        .fav-card-name { font-size: 0.8rem; font-weight: 700; color: #fff; line-height: 1.1; max-height: 2.2em; overflow: hidden; }
        .fav-card-meta { font-size: 0.65rem; color: rgba(255,255,255,0.7); }
        .fav-card-add { background: rgba(255,255,255,0.03); align-items: center; justify-content: center; border-style: dashed; }
        .fav-add-icon { color: rgba(255,255,255,0.4); margin-bottom: 4px; }
        .fav-delete-btn { position: absolute; top: 4px; left: 4px; padding: 4px; background: rgba(0,0,0,0.4); border-radius: 6px; border: none; color: #fff; opacity: 0.7; z-index: 10; }

        .nav-cluster { display: flex; gap: 8px; align-items: center; }
        .nav-cluster-left { padding-left: 8px; }
        .nav-cluster-right { padding-right: 8px; }
        
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

        .fab-camera { position: absolute; top: -72px; right: 8px; width: 56px; height: 56px; border-radius: 50%; background: linear-gradient(135deg, #4A90E2 0%, #357ABD 100%); border: none; color: white; box-shadow: 0 8px 20px rgba(16, 185, 129, 0.4); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; z-index: 1002; }
        .fab-camera:active { transform: scale(0.95); }

        .modal-overlay { position: fixed; inset: 0; z-index: 2000; background: rgba(0,0,0,0.6); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; padding: 16px; }
        .modal-content { width: 100%; max-width: 420px; border-radius: 24px; background: rgba(15, 15, 20, 0.95); backdrop-filter: blur(24px); border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 25px 60px rgba(0,0,0,0.6); display: flex; flex-direction: column; }
        .modal-header { padding: 20px 24px; border-bottom: 1px solid rgba(255,255,255,0.06); display: flex; justify-content: space-between; align-items: center; color: white; }
        .close-btn { background: rgba(255,255,255,0.05); border: none; border-radius: 10px; width: 36px; height: 36px; color: rgba(255,255,255,0.6); font-size: 1.3rem; cursor: pointer; display: flex; align-items: center; justify-content: center; }
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
      `}
      </style>
    </div>
  );
}
