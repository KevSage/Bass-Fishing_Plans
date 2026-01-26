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

// --- LAKE LABEL IMPORTS ---
import { type LakeLabelData } from "@/components/LakeLabel";

// --- DATA IMPORT ---
import LAKES_DATA from "../data/lakes.json";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

// =============================================================================
// LOCAL ICONS
// =============================================================================

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
  const location = useLocation();
  const [dataVersion, setDataVersion] = useState(0);
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
  const [showStrategyMenu, setShowStrategyMenu] = useState(false);
  const [showReplaceConfirm, setShowReplaceConfirm] = useState(false);
  const [showGenerateConfirm, setShowGenerateConfirm] = useState(false);

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
      console.log("Refreshing data...", location.state.lakeId);
      processedRefreshRef.current = refreshTimestamp;
      setDataVersion((v) => v + 1);

      // Store lakeId to select after data loads
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
      const token = await getToken();
      if (!token) return;
      try {
        const res = await listFavorites(token);
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

  const handleLiveCameraClick = () => {
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

  const handleStrategyClick = useCallback(
    (e?: React.MouseEvent) => {
      e?.preventDefault();
      e?.stopPropagation();
      const targetName = currentFavorite ? currentFavorite.name : waterName;
      if (!targetName && !activeLake) return;

      const hasPlan = !!lastPlanUrl;
      const isSameLake = lastPlanLake === targetName;

      if (hasPlan && isSameLake) {
        setShowStrategyMenu(true);
      } else if (hasPlan && !isSameLake) {
        setShowReplaceConfirm(true);
      } else {
        setShowGenerateConfirm(true);
      }
    },
    [activeLake, waterName, currentFavorite, lastPlanUrl, lastPlanLake],
  );

  const handleResumePlan = useCallback(() => {
    setShowStrategyMenu(false);
    if (lastPlanUrl) navigate(lastPlanUrl);
  }, [lastPlanUrl, navigate]);

  const handleRemoveSpecificLake = useCallback(
    async (lake: FavoriteLake) => {
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

        if (dbMatch && dbMatch.id && dbMatch.name === waterName) {
          lakeId = dbMatch.id;
          lakeType = "known";
        } else {
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
              anchors: [],
            },
            token,
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
        Checking status...
      </div>
    );
  if (!isActive) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
          color: "#fff",
          padding: 24,
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", marginBottom: 16 }}>
          Subscription Required
        </h1>
        <p style={{ opacity: 0.7, marginBottom: 24 }}>
          Subscribe to access the full Bass Clarity experience.
        </p>
        <button
          onClick={() => navigate("/account")}
          style={{
            background: "linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)",
            color: "#fff",
            border: "none",
            borderRadius: 12,
            fontWeight: 700,
            padding: "14px 32px",
            cursor: "pointer",
            fontSize: "1rem",
          }}
        >
          Go to Account
        </button>
      </div>
    );
  }

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

      {/* TOP GRADIENT BAR - Always visible */}
      {!showModal &&
        !catchLog.isOpen &&
        (() => {
          // Suggestion logic
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
                  {/* ABSOLUTE CLOSE BUTTON (Top Right) */}
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

                  {/* CENTERED CONTENT */}
                  <div className="top-bar-content-centered">
                    {/* Name Row with STAR */}
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

                    {/* Location */}
                    <div className="top-bar-location">
                      <span>
                        {lakeLabelData.city && lakeLabelData.state
                          ? `${lakeLabelData.city}, ${lakeLabelData.state}`
                          : `${lakeLabelData.lat.toFixed(4)}°, ${lakeLabelData.lng.toFixed(4)}°`}
                      </span>
                    </div>
                  </div>

                  {/* Lake Name Suggestion */}
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
                  <span className="top-bar-label">MEMBERS</span>
                  <h2 className="top-bar-title">Find Your Water</h2>
                  <p className="top-bar-subtitle">
                    Search or tap any body of water
                  </p>
                </div>
              )}
            </div>
          );
        })()}

      {/* NAV PANEL */}
      {!catchLog.isOpen && (
        <div
          className={`members-navigation-container ${showFavorites ? "expanded" : ""}`}
        >
          <div className="glass-deck">
            {/* INLINE FAVORITES SECTION */}
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
                  {/* Add New Card */}
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
                  {/* Favorite Cards */}
                  {favorites.map((lake) => {
                    const isActive = lake.id === viewingFavoriteId;
                    return (
                      <div
                        key={`${lake.lake_type}:${lake.id}`}
                        className={`nav-fav-card ${isActive ? "active" : ""}`}
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
                            handleRemoveSpecificLake(lake);
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

            {/* MAIN NAVIGATION ROW - UPDATED LAYOUT */}
            <div className="nav-icons-row">
              <div className="nav-cluster nav-cluster-left">
                <button
                  onClick={handleOpenScoutModal}
                  className="nav-btn nav-btn-icon"
                  aria-label="Scout Water"
                >
                  <RadarIcon size={22} />
                </button>
                {/* MOVED: Camera Button Here */}
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
              <div>
                <label className="modal-label">Find Water</label>
                <div style={{ position: "relative" }}>
                  <style>{`.location-search-dropdown { position: absolute !important; top: 100% !important; z-index: 9999 !important; background: rgba(20, 20, 30, 0.98) !important; border: 1px solid rgba(255,255,255,0.1) !important; border-radius: 10px !important; }`}</style>
                  <LocationSearch
                    onSelect={handleSearchSelect}
                    placeholder="Search 1,000+ Lakes..."
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

      {/* STYLES */}
      <style>
        {`
        /* TOP GRADIENT BAR */
        .top-gradient-bar {
          position: fixed;
          top: 64px;
          left: 0;
          right: 0;
          z-index: 800;
          background: linear-gradient(to bottom, 
            rgba(0,0,0,0.92) 0%, 
            rgba(0,0,0,0.8) 50%, 
            rgba(0,0,0,0.4) 80%,
            transparent 100%);
          padding: 16px 20px 45px;
          display: flex;
          justify-content: center;
          /* UPDATED: Allows clicks to pass through to map */
          pointer-events: none;
        }
        .top-bar-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          min-width: 280px;
          max-width: 400px;
          text-align: center;
          /* UPDATED: Re-enables clicks for buttons inside */
          pointer-events: auto;
        }
        .top-bar-card-empty {
          text-align: center;
        }
        .top-bar-label {
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.15em;
          color: #4A90E2;
          margin-bottom: 4px;
        }
        .top-bar-title {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 700;
          color: #fff;
          letter-spacing: -0.02em;
        }
        .top-bar-subtitle {
          margin: 4px 0 0 0;
          font-size: 0.8rem;
          color: rgba(255,255,255,0.5);
        }
        
        /* CLOSE BUTTON (Top Right Absolute) */
        .top-bar-close {
          position: absolute;
          top: 0;
          right: 0;
          background: transparent;
          border: none;
          color: rgba(255,255,255,0.4);
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.2s;
          /* Ensure clickable */
          pointer-events: auto;
        }
        .top-bar-close:hover {
          color: rgba(255,255,255,0.8);
        }
        
        /* Centered Content Area */
        .top-bar-content-centered {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-top: 10px; 
          padding-right: 40px; /* Safe padding for close button */
          padding-left: 40px;  /* Symmetrical balance */
        }

        .top-bar-name-row {
          display: flex;
          align-items: center;
          gap: 12px;
          justify-content: center;
        }
        
        /* STAR BUTTON */
        .top-bar-star-btn {
          background: transparent;
          border: none;
          color: rgba(255,255,255,0.3);
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .top-bar-star-btn:hover {
          color: rgba(255,255,255,0.6);
          transform: scale(1.1);
        }
        .top-bar-star-btn.saved {
          color: #F59E0B; /* Gold */
          filter: drop-shadow(0 0 8px rgba(245, 158, 11, 0.4));
        }

        .top-bar-lake-name {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 800;
          color: #fff;
          letter-spacing: -0.02em;
          line-height: 1.2;
          text-shadow: 0 2px 4px rgba(0,0,0,0.5);
        }
        .top-bar-name-input {
          flex: 1;
          background: transparent;
          border: none;
          border-bottom: 1px dashed rgba(255,255,255,0.3);
          color: #fff;
          font-size: 1.25rem;
          font-weight: 700;
          padding: 4px 0;
          outline: none;
          letter-spacing: -0.02em;
          min-width: 0;
          text-align: center;
        }
        .top-bar-name-input:focus {
          border-bottom-color: #4A90E2;
        }
        .top-bar-name-input::placeholder {
          color: rgba(255,255,255,0.35);
          font-style: italic;
          font-weight: 500;
        }
        .top-bar-save-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, #4A90E2 0%, #357ABD 100%);
          border: none;
          color: #fff;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.2s;
          box-shadow: 0 4px 12px rgba(74, 144, 226, 0.4);
        }
        .top-bar-save-btn:hover:not(:disabled) {
          transform: scale(1.05);
          box-shadow: 0 6px 16px rgba(74, 144, 226, 0.5);
        }
        .top-bar-save-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          box-shadow: none;
        }
        .top-bar-location {
          display: flex;
          align-items: center;
          gap: 5px;
          color: rgba(255,255,255,0.6);
          font-size: 0.85rem;
          margin-top: 4px;
          font-weight: 500;
        }
        
        /* Lake Name Suggestion */
        .top-bar-suggestion {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 10px;
          padding: 8px 12px;
          background: rgba(74, 144, 226, 0.15);
          border: 1px solid rgba(74, 144, 226, 0.3);
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .top-bar-suggestion:hover {
          background: rgba(74, 144, 226, 0.25);
          border-color: rgba(74, 144, 226, 0.5);
        }
        .top-bar-suggestion .suggestion-label {
          font-size: 0.7rem;
          color: rgba(255,255,255,0.5);
          font-weight: 500;
        }
        .top-bar-suggestion .suggestion-name {
          font-size: 0.85rem;
          color: #4A90E2;
          font-weight: 600;
        }

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
        
        /* INLINE FAVORITES SECTION */
        .nav-favorites-section {
          padding: 12px 8px 8px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          animation: nav-fav-slide-down 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes nav-fav-slide-down {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .nav-favorites-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 4px 10px;
        }
        .nav-favorites-title {
          display: flex;
          align-items: baseline;
          gap: 8px;
        }
        .nav-favorites-title > span:first-child {
          font-size: 0.95rem;
          font-weight: 700;
          color: #fff;
        }
        .nav-favorites-count {
          font-size: 0.75rem;
          color: rgba(255,255,255,0.4);
        }
        .nav-favorites-scroll {
          display: flex;
          gap: 10px;
          overflow-x: auto;
          padding-bottom: 4px;
          scrollbar-width: none;
        }
        .nav-favorites-scroll::-webkit-scrollbar { display: none; }
        
        .nav-fav-card {
          flex: 0 0 110px;
          height: 90px;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(30, 30, 40, 0.6);
          position: relative;
          overflow: hidden;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 10px;
          transition: all 0.2s;
        }
        .nav-fav-card:hover {
          border-color: rgba(255,255,255,0.2);
        }
        .nav-fav-card.active {
          border-color: #4A90E2;
          box-shadow: 0 0 12px rgba(74,144,226,0.3);
        }
        .nav-fav-card-gradient {
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, transparent 20%, rgba(0,0,0,0.85) 100%);
        }
        .nav-fav-card-content {
          position: relative;
          z-index: 2;
        }
        .nav-fav-card-name {
          font-size: 0.8rem;
          font-weight: 700;
          color: #fff;
          line-height: 1.15;
          max-height: 2.3em;
          overflow: hidden;
        }
        .nav-fav-card-location {
          font-size: 0.65rem;
          color: rgba(255,255,255,0.6);
          margin-top: 2px;
        }
        .nav-fav-card-add {
          background: rgba(255,255,255,0.03);
          border-style: dashed;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          gap: 4px;
        }
        .nav-fav-card-add span {
          font-size: 0.75rem;
          color: rgba(255,255,255,0.5);
          font-weight: 600;
        }
        .nav-fav-add-icon {
          color: rgba(255,255,255,0.4);
        }
        .nav-fav-card-delete {
          position: absolute;
          top: 6px;
          right: 6px;
          width: 24px;
          height: 24px;
          padding: 0;
          background: rgba(0,0,0,0.5);
          border-radius: 6px;
          border: none;
          color: rgba(255,255,255,0.7);
          opacity: 0;
          z-index: 10;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: opacity 0.2s;
        }
        .nav-fav-card:hover .nav-fav-card-delete {
          opacity: 1;
        }
        .nav-fav-card-delete:hover {
          background: rgba(239, 68, 68, 0.8);
          color: #fff;
        }

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
      `}
      </style>
    </div>
  );
}
