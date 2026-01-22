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
import { useNavigate, useSearchParams } from "react-router-dom";

// API Imports
import { generateMemberPlan, RateLimitError } from "@/lib/api";
import {
  listFavorites,
  addFavorite,
  removeFavorite,
  createCustomLake,
  type FavoriteLake as ApiFavoriteLake,
} from "@/lib/catches-api";

import { useMemberStatus } from "@/hooks/useMemberStatus";
import { LocationSearch } from "@/components/LocationSearch";
import { PlanGenerationLoader } from "@/components/PlanGenerationLoader";
import {
  RadarIcon,
  ChevronDownIcon,
  SearchIcon,
  PinIcon,
} from "@/components/UnifiedIcons";

import { MapOrb } from "@/components/MapOrb";

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

// --- LOCAL ICONS (NAV BAR) ---
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

// Camera Icon for Live Logging
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

// Type matching your lakes.json structure
type LakeData = {
  name: string;
  state: string;
  city?: string;
  latitude: number;
  longitude: number;
  acres?: number;
  tier: number;
  id?: string; // Some JSONs have IDs
  bbox?: [number, number, number, number]; // <--- ADD THIS
};

// Augmented Favorite Type for UI (includes hydration data)
type FavoriteLake = {
  id: string; // The database ID (lake_id)
  lake_type: "known" | "custom";
  name: string;
  city?: string;
  state?: string;
  lat: number;
  lng: number;
  zoom: number;
  image: string;
  acres?: number;
  tier?: number;
};

// --- HELPER HOOKS ---
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

// --- GEOMETRY HELPERS ---
function getDistanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371000; // Earth radius in meters
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

// Get match radius based on lake size
function getMatchRadius(acres?: number): number {
  if (!acres) return 1000; // 1km default
  if (acres > 30000) return 10000; // 10km - Lake Guntersville, Lanier
  if (acres > 10000) return 7500; // 7.5km - Large reservoirs
  if (acres > 5000) return 5000; // 5km - Medium lakes
  return 1000; // 1km - Small lakes/ponds
}

// Find nearest lake with dynamic radius based on lake size (DATABASE)
// src/pages/Members.tsx

function findNearestLake(lat: number, lng: number): LakeData | null {
  // 1. BOUNDING BOX CHECK (Highest Priority)
  // Precise hit detection for large lakes (Tier 1)
  const bboxMatch = (LAKES_DATA as LakeData[]).find((l) => {
    if (!l.bbox) return false;
    const [minLng, minLat, maxLng, maxLat] = l.bbox;
    return lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
  });

  if (bboxMatch) return bboxMatch;

  // 2. DISTANCE CHECK (Fallback)
  // Existing logic for smaller lakes without bounding boxes
  let nearest: LakeData | null = null;
  let minDist = Infinity;

  // Optimization: Filter by rough bounding box first (approx +/- 20 miles)
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

// Find nearest FAVORITE lake with dynamic radius (USER SAVED)
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

export function Members() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const { isActive, isLoading: statusLoading } = useMemberStatus();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // --- PERSISTENT STATE (API BACKED) ---
  const [favorites, setFavorites] = useState<FavoriteLake[]>([]);

  const [lastPlanUrl, setLastPlanUrl] = useState<string | null>(() =>
    sessionStorage.getItem("aiq_last_plan_url"),
  );

  // --- LOCAL STATE ---
  const [rateLimitInfo, setRateLimitInfo] = useState<{
    message: string;
    secondsRemaining: number;
  } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showGenerateConfirm, setShowGenerateConfirm] = useState(false);

  // New: Live Camera Draft State
  const [draftEntry, setDraftEntry] = useState<Partial<any> | null>(null);
  const clearDraftEntry = useCallback(() => setDraftEntry(null), []);

  // Favorite Navigation State
  const [viewingFavoriteId, setViewingFavoriteId] = useState<string | null>(
    null,
  );

  // For unknown waters - user can name them inline
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

  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Map Refs
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const markerElementRef = useRef<HTMLDivElement | null>(null);
  const catchMarkersRef = useRef<mapboxgl.Marker[]>([]);

  // NEW: Hidden input for LIVE camera capture
  const liveCameraInputRef = useRef<HTMLInputElement>(null);

  const initialized = useRef(false);
  const isMountedRef = useRef(true);
  const controlsRef = useRef<mapboxgl.IControl[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync refs for event handlers
  const showModalRef = useRef(false);
  const viewingFavoriteIdRef = useRef<string | null>(null);
  const selectedCoordsRef = useRef<{ lat: number; lng: number } | null>(null);
  const favoritesRef = useRef(favorites);

  // Keep selectedCoordsRef in sync
  useEffect(() => {
    selectedCoordsRef.current = selectedCoords;
  }, [selectedCoords]);

  // Keep favorites ref in sync
  useEffect(() => {
    favoritesRef.current = favorites;
  }, [favorites]);

  // --- API: FETCH FAVORITES ---
  useEffect(() => {
    let mounted = true;
    async function fetchFavs() {
      const token = await getToken();
      if (!token) return;
      try {
        const res = await listFavorites(token);
        if (mounted && res.favorites) {
          // Hydrate API response to UI model
          const mapped: FavoriteLake[] = res.favorites.map((f: any) => ({
            id: f.lake_id,
            lake_type: f.lake_type,
            name: f.name,
            lat: f.lat,
            lng: f.lng,
            city: f.city || undefined,
            state: f.state || undefined,
            acres: undefined, // Backend doesn't store acres for custom
            tier: undefined,
            zoom: 12, // Default zoom for view
            image: `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/${f.lng},${f.lat},12,0/600x400?access_token=${MAPBOX_TOKEN}`,
          }));
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
  }, [getToken]);

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

  // --- CATCH LOG INTEGRATION ---
  const activeLake: ActiveLake = useMemo(() => {
    if (currentFavorite) {
      return {
        name: currentFavorite.name,
        lat: currentFavorite.lat,
        lng: currentFavorite.lng,
        id: currentFavorite.id,
      };
    }
    if (waterName && selectedCoords) {
      return {
        name: waterName,
        lat: selectedCoords.lat,
        lng: selectedCoords.lng,
      };
    }
    return null;
  }, [currentFavorite, waterName, selectedCoords]);

  const catchLog = useCatchLog(activeLake);

  // Sync refs
  useEffect(() => {
    showModalRef.current = showModal;
  }, [showModal]);

  const isCatchLogOpenRef = useRef(false);
  const lastDraftOpenedRef = useRef<string | null>(null);

  useEffect(() => {
    isCatchLogOpenRef.current = catchLog.isOpen;
  }, [catchLog.isOpen]);

  // If we have a draft entry (from live camera), open the log automatically
  // If we have a draft entry (from live camera), open directly into the form
  useEffect(() => {
    if (!draftEntry) {
      lastDraftOpenedRef.current = null;
      return;
    }

    // Create a stable fingerprint for this draft
    const key = `${draftEntry.caughtAt ?? ""}|${draftEntry.lakeName ?? ""}|${draftEntry.catchLat ?? draftEntry.lakeLat ?? ""}|${draftEntry.catchLng ?? draftEntry.lakeLng ?? ""}`;

    if (lastDraftOpenedRef.current === key) return;
    lastDraftOpenedRef.current = key;

    catchLog.showForm(draftEntry as any);
  }, [draftEntry, catchLog]);

  useEffect(() => {
    viewingFavoriteIdRef.current = viewingFavoriteId;
  }, [viewingFavoriteId]);

  // --- LAKE LABEL VISIBILITY ---
  const lakeLabelVisible = useLakeLabelVisibility(
    mapRef.current,
    selectedCoords?.lat ?? null,
    selectedCoords?.lng ?? null,
  );

  // Derive lake label data
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

  // --- MAP PIN SYNCHRONIZATION ---
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

  // --- MAP INITIALIZATION ---
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

    // Recenter control
    class RecenterControl implements mapboxgl.IControl {
      _container: HTMLDivElement | undefined;
      onAdd(): HTMLElement {
        this._container = document.createElement("div");
        this._container.className = "mapboxgl-ctrl mapboxgl-ctrl-group";
        this._container.innerHTML = `<button class="mapboxgl-ctrl-recenter" type="button"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/></svg></button>`;
        this._container
          .querySelector("button")
          ?.addEventListener("click", () => {
            const coords = selectedCoordsRef.current;
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

    // Initial pin
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
      // Fetch geocode context... (omitted for brevity, consistent with your file)
    }

    const onClick = async (e: mapboxgl.MapMouseEvent) => {
      if (!mapRef.current || !isMountedRef.current) return;

      // Ignore clicks if modals/menus are open
      if (
        isCatchLogOpenRef.current ||
        showModalRef.current ||
        viewingFavoriteIdRef.current
      ) {
        setViewingFavoriteId(null);
        return;
      }

      if (abortControllerRef.current) abortControllerRef.current.abort();
      abortControllerRef.current = new AbortController();

      try {
        const features = mapRef.current.queryRenderedFeatures(e.point);
        const water = features.find(isWaterFeature);

        if (water) {
          const { lng, lat } = e.lngLat;
          setSelectedCoords({ lat, lng });
          setInputMode("manual");
          setLocationDetails({});

          // ---------------------------------------------------------
          // 1. SMART FIX: TRY VECTOR NAME MATCHING FIRST
          // ---------------------------------------------------------
          // This catches large lakes (Toledo Bend) even if you click 50 miles from the center
          const vectorName = water.properties?.name;
          let dbMatch: LakeData | undefined;

          if (vectorName) {
            const searchName = vectorName.toLowerCase();
            dbMatch = (LAKES_DATA as LakeData[]).find(
              (l) =>
                l.name.toLowerCase() === searchName ||
                l.name.toLowerCase().includes(searchName) || // Handles "Toledo Bend" vs "Toledo Bend Reservoir"
                searchName.includes(l.name.toLowerCase()),
            );
          }

          // ---------------------------------------------------------
          // 2. CHECK FAVORITES & SPATIAL FALLBACK
          // ---------------------------------------------------------
          // Check spatial proximity for favorites first
          const nearbyFavorite = findNearestFavorite(
            lat,
            lng,
            favoritesRef.current,
          );

          // If no name match and no favorite, try standard radius check
          const nearbyLake =
            dbMatch || (!nearbyFavorite ? findNearestLake(lat, lng) : null);

          // ---------------------------------------------------------
          // 3. SET STATE
          // ---------------------------------------------------------
          if (nearbyFavorite) {
            setWaterName(nearbyFavorite.name);
            setLocationDetails({
              city: nearbyFavorite.city,
              state: nearbyFavorite.state,
            });
          } else if (nearbyLake) {
            setWaterName(nearbyLake.name);
            setLocationDetails({
              city: nearbyLake.city,
              state: nearbyLake.state,
            });
          } else {
            // If we have a vector name but it wasn't in our DB, prefer that over "Dropped Pin"
            // This is great for small ponds that Mapbox knows but your JSON doesn't
            setWaterName(vectorName || "");
          }

          // ---------------------------------------------------------
          // 4. PLACE MARKER
          // ---------------------------------------------------------
          if (markerRef.current) markerRef.current.remove();
          if (markerElementRef.current) markerElementRef.current.remove();
          const markerEl = createOrbMarker();
          markerElementRef.current = markerEl;
          markerRef.current = new mapboxgl.Marker({ element: markerEl })
            .setLngLat([lng, lat])
            .addTo(mapRef.current);

          // ---------------------------------------------------------
          // 5. REVERSE GEOCODE (Context Fill)
          // ---------------------------------------------------------
          // Only fetch context if we didn't match a DB entry (which already has city/state)
          // OR if we want to fill in missing city/state for a vector name match
          if (!nearbyFavorite && (!nearbyLake || !nearbyLake.city)) {
            try {
              const response = await fetch(
                `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}`,
                { signal: abortControllerRef.current.signal },
              );
              if (!isMountedRef.current) return;
              const data = await response.json();
              const context = data?.features?.[0]?.context;
              let city, state;
              if (context) {
                city =
                  context.find((c: any) => String(c.id).startsWith("place"))
                    ?.text || "";
                state =
                  context
                    .find((c: any) => String(c.id).startsWith("region"))
                    ?.short_code?.replace("US-", "") || "";

                // Update state with fetched context
                setLocationDetails({ city, state });

                // If we still don't have a name (no vector name, no DB match), construct one
                if (!vectorName && !nearbyLake) {
                  if (city || state)
                    setWaterName(
                      `Water near ${[city, state].filter(Boolean).join(", ")}`,
                    );
                  else setWaterName("Dropped Pin Location");
                }
              }
            } catch (e2: any) {
              if (e2.name !== "AbortError")
                console.error("Geocode failed:", e2);
            }
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

  // --- LIVE CAMERA LOGIC ---
  const handleLiveCameraClick = () => {
    // 1. Trigger hidden input that forces camera environment
    if (liveCameraInputRef.current) {
      liveCameraInputRef.current.value = "";
      liveCameraInputRef.current.click();
    }
  };

  const handleLiveCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 2. We ignore EXIF. We trust the Device GPS right now.
    if (!navigator.geolocation) {
      alert("GPS required for live logging.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const now = new Date().toISOString();

        // 3. Find Context (Lake Name)
        let lakeName = "Unknown Water";
        // We pass the current favorites state to the helper
        const fav = findNearestFavorite(latitude, longitude, favorites);
        const db = findNearestLake(latitude, longitude);

        if (fav) lakeName = fav.name;
        else if (db) lakeName = db.name;

        // 4. Create Draft Entry
        const reader = new FileReader();
        reader.onload = (ev) => {
          const imageData = ev.target?.result as string;

          // This object matches your CatchEntry structure but is partial
          const newDraft = {
            caughtAt: now,
            lakeName: lakeName,
            lakeLat: latitude,
            lakeLng: longitude,
            imageData: imageData,
            catchLat: latitude,
            catchLng: longitude,
            // Defaults
            lure: "",
            weight: 0,
            species: "Largemouth Bass",
          };

          // 5. Set Draft & Open Log
          // Note: You must update CatchLogModal to accept `initialData={draftEntry}`
          setDraftEntry(newDraft);
        };
        reader.readAsDataURL(file);
      },
      (err) => {
        console.error(err);
        alert("Could not fetch location. Ensure GPS is enabled.");
      },
      { enableHighAccuracy: true },
    );
  };

  // --- HANDLERS ---
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

  const handleSearchSelect = useCallback(
    async (location: {
      name: string;
      latitude: number;
      longitude: number;
      city?: string;
      state?: string;
    }) => {
      setShowModal(false); // <--- ADD THIS LINE
      setWaterName(location.name);
      let city = location.city;
      let state = location.state;
      if (!city || !state) {
        try {
          const res = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${location.longitude},${location.latitude}.json?access_token=${MAPBOX_TOKEN}`,
          );
          const data = await res.json();
          const ctx = data?.features?.[0]?.context;
          if (ctx) {
            city = ctx.find((c: any) => String(c.id).startsWith("place"))?.text;
            state = ctx
              .find((c: any) => String(c.id).startsWith("region"))
              ?.short_code?.replace("US-", "");
          }
        } catch (err) {
          console.error("Geocoding fallback failed", err);
        }
      }
      setLocationDetails({ city, state });
      setSelectedCoords({ lat: location.latitude, lng: location.longitude });
      setInputMode("manual");

      requestAnimationFrame(() => {
        if (mapRef.current) {
          mapRef.current.flyTo({
            center: [location.longitude, location.latitude],
            zoom: 12,
            duration: 3000,
            essential: true, // <--- ADDED: Ensures animation plays even if user interacts slightly
          });
          if (markerRef.current) markerRef.current.remove();
          const markerEl = createOrbMarker();
          markerElementRef.current = markerEl;
          markerRef.current = new mapboxgl.Marker({ element: markerEl })
            .setLngLat([location.longitude, location.latitude])
            .addTo(mapRef.current);
        }
      });
    },
    [],
  );

  const handleGenerateClick = useCallback(
    (e?: React.MouseEvent) => {
      e?.preventDefault();
      e?.stopPropagation();
      if (activeLake || manualWaterName || waterName) {
        setShowGenerateConfirm(true);
      }
    },
    [activeLake, manualWaterName, waterName],
  );

  const performGeneration = useCallback(async () => {
    setShowGenerateConfirm(false);
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
      setLastPlanUrl(tokenUrl);
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

  // --- API BACKED TOGGLE FAVORITES ---
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
          setFavorites((prev) => prev.filter((l) => l.id !== fav.id));
          try {
            await removeFavorite(fav.id, fav.lake_type, token);
          } catch (err) {
            console.error("Failed to remove favorite", err);
          }
        }
      } else {
        const dbMatch = hydrateLakeData(
          waterName,
          selectedCoords.lat,
          selectedCoords.lng,
        );
        let lakeId = "";
        let lakeType: "known" | "custom" = "known";
        if (dbMatch) {
          lakeId = dbMatch.id || dbMatch.name;
          lakeType = "known";
        } else {
          lakeType = "custom";
          try {
            const createRes = await createCustomLake(
              {
                name: waterName,
                lat: selectedCoords.lat,
                lng: selectedCoords.lng,
                city: locationDetails.city,
                state: locationDetails.state,
              },
              token,
            );
            if (createRes.success) lakeId = (createRes as any).lake_id;
            else lakeId = (createRes as any).existing_lake.id;
          } catch (err) {
            console.error("Failed to create custom lake for favorite", err);
            return;
          }
        }
        const zoom = mapRef.current?.getZoom() || 10;
        const imageUrl = `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/${selectedCoords.lng},${selectedCoords.lat},${Math.min(zoom, 13)},0/600x400?access_token=${MAPBOX_TOKEN}`;
        const newLake: FavoriteLake = {
          id: lakeId,
          lake_type: lakeType,
          name: dbMatch?.name || waterName,
          city: dbMatch?.city || locationDetails.city,
          state: dbMatch?.state || locationDetails.state,
          lat: selectedCoords.lat,
          lng: selectedCoords.lng,
          zoom: zoom,
          image: imageUrl,
          acres: dbMatch?.acres,
          tier: dbMatch?.tier,
        };
        setFavorites((prev) => [...prev, newLake]);
        try {
          await addFavorite(lakeId, lakeType, token);
        } catch (err) {
          console.error("Failed to add favorite", err);
          setFavorites((prev) => prev.filter((f) => f.id !== lakeId));
        }
      }
    },
    [
      waterName,
      selectedCoords,
      locationDetails,
      isCurrentLocationSaved,
      favorites,
      getToken,
    ],
  );

  const navigateFavorites = useCallback(
    (direction: "prev" | "next") => {
      if (favorites.length === 0) return;
      setViewingFavoriteId(null);
      let newIndex = 0;
      const currentId = viewingFavoriteIdRef.current;
      const currentIndex = favorites.findIndex((f) => f.id === currentId);
      if (currentIndex === -1) {
        newIndex = 0;
      } else {
        if (direction === "next")
          newIndex = (currentIndex + 1) % favorites.length;
        else
          newIndex = (currentIndex - 1 + favorites.length) % favorites.length;
      }
      const nextLake = favorites[newIndex];
      if (mapRef.current)
        mapRef.current.flyTo({
          center: [nextLake.lng, nextLake.lat],
          zoom: nextLake.zoom,
          duration: 3000,
          essential: true,
        });
      setTimeout(() => {
        setViewingFavoriteId(nextLake.id);
        setWaterName(nextLake.name);
        setLocationDetails({ city: nextLake.city, state: nextLake.state });
        setSelectedCoords({ lat: nextLake.lat, lng: nextLake.lng });
      }, 2000);
    },
    [favorites],
  );

  const handleOpenScoutModal = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (selectedCoords) setInputMode("manual");
    else setInputMode("search");
    setShowModal(true);
  };
  const handleCloseScoutModal = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setShowModal(false);
  };
  const handleReturnToPlan = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (lastPlanUrl) navigate(lastPlanUrl);
  };

  const handleLakeLabelSave = useCallback(
    async (name: string) => {
      if (!selectedCoords) return;
      const token = await getToken();
      if (!token) return;
      const finalName = name || waterName;
      setWaterName(finalName);
      let lakeId = "";
      let lakeType: "known" | "custom" = "custom";
      const dbMatch = hydrateLakeData(
        finalName,
        selectedCoords.lat,
        selectedCoords.lng,
      );
      if (dbMatch) {
        lakeId = dbMatch.id || dbMatch.name;
        lakeType = "known";
      } else {
        try {
          const createRes = await createCustomLake(
            {
              name: finalName,
              lat: selectedCoords.lat,
              lng: selectedCoords.lng,
              city: locationDetails.city,
              state: locationDetails.state,
            },
            token,
          );
          if (createRes.success) lakeId = (createRes as any).lake_id;
          else lakeId = (createRes as any).existing_lake.id;
        } catch (err) {
          console.error("Failed custom lake creation for label save", err);
          return;
        }
      }
      const zoom = mapRef.current?.getZoom() || 10;
      const imageUrl = `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/${selectedCoords.lng},${selectedCoords.lat},${Math.min(zoom, 13)},0/600x400?access_token=${MAPBOX_TOKEN}`;
      const newLake: FavoriteLake = {
        id: lakeId,
        lake_type: lakeType,
        name: dbMatch?.name || finalName,
        city: dbMatch?.city || locationDetails.city,
        state: dbMatch?.state || locationDetails.state,
        lat: selectedCoords.lat,
        lng: selectedCoords.lng,
        zoom: zoom,
        image: imageUrl,
        acres: dbMatch?.acres,
        tier: dbMatch?.tier,
      };
      setFavorites((prev) => [...prev, newLake]);
      await addFavorite(lakeId, lakeType, token);
    },
    [
      selectedCoords,
      locationDetails,
      lakeLabelData,
      setFavorites,
      waterName,
      getToken,
    ],
  );

  const handleLakeLabelRemove = useCallback(async () => {
    if (!selectedCoords || !waterName) return;
    const token = await getToken();
    if (!token) return;
    const fav = favorites.find(
      (f) =>
        f.name === waterName &&
        Math.abs(f.lat - selectedCoords.lat) < 0.001 &&
        Math.abs(f.lng - selectedCoords.lng) < 0.001,
    );
    if (fav) {
      setFavorites((prev) => prev.filter((f) => f.id !== fav.id));
      await removeFavorite(fav.id, fav.lake_type, token);
    }
  }, [selectedCoords, waterName, setFavorites, favorites, getToken]);

  const onSaveCustomName = useCallback(
    (name: string) => {
      setWaterName(name);
      handleLakeLabelSave(name);
    },
    [handleLakeLabelSave],
  );

  if (loading)
    return <PlanGenerationLoader lakeName={waterName || "Selected Water"} />;
  if (statusLoading)
    return (
      <div style={{ padding: 100, textAlign: "center", color: "#fff" }}>
        Checking status...
      </div>
    );
  if (!isActive) return <div />;

  return (
    <div
      style={{ position: "relative", height: "100vh", background: "#0a0a0a" }}
    >
      {/* HIDDEN INPUT FOR LIVE CAMERA */}
      <input
        type="file"
        ref={liveCameraInputRef}
        accept="image/*"
        capture="environment" // Forces Camera on Mobile
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

      {!showModal && !catchLog.isOpen && (
        <LakeLabel
          lake={lakeLabelData}
          isVisible={lakeLabelVisible && !!selectedCoords}
          onNameChange={setManualWaterName}
          onSave={onSaveCustomName}
          lakesData={
            LAKES_DATA as Array<{ name: string; city?: string; state?: string }>
          }
          onAcceptSuggestion={(name, city, state) => {
            setWaterName(name);
            setManualWaterName(name);
            if (city || state) setLocationDetails({ city, state });
          }}
        />
      )}

      {!showModal && !catchLog.isOpen && (
        <div className="members-navigation-container">
          {/* FLOATING CAMERA ACTION BUTTON */}
          <button
            onClick={handleLiveCameraClick}
            className="fab-camera"
            aria-label="Log Catch Live"
          >
            <CameraIcon size={26} />
          </button>

          <div className="glass-deck">
            <div className="nav-cluster nav-cluster-left">
              <button
                onClick={handleOpenScoutModal}
                className="nav-btn nav-btn-icon"
                aria-label="Scout Water"
                title="Scout Water"
              >
                <RadarIcon size={22} />
              </button>
              <button
                onClick={
                  isCurrentLocationSaved
                    ? handleLakeLabelRemove
                    : () => handleLakeLabelSave(waterName || manualWaterName)
                }
                className={`nav-btn nav-btn-icon ${isCurrentLocationSaved ? "nav-btn-danger" : ""}`}
                disabled={!activeLake && !manualWaterName}
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
              <button
                onClick={() => navigateFavorites("prev")}
                className="nav-arrow-btn"
                disabled={favorites.length === 0}
              >
                <ChevronDownIcon
                  style={{ transform: "rotate(90deg)" }}
                  size={24}
                />
              </button>
              <div
                className="orb-wrapper"
                onClick={handleReturnToPlan}
                style={{
                  opacity: lastPlanUrl ? 1 : 0.5,
                  cursor: lastPlanUrl ? "pointer" : "default",
                }}
              >
                <div className="orb-glow-ring" />
                <MapOrb size={26} />
              </div>
              <button
                onClick={() => navigateFavorites("next")}
                className="nav-arrow-btn"
                disabled={favorites.length === 0}
              >
                <ChevronDownIcon
                  style={{ transform: "rotate(-90deg)" }}
                  size={24}
                />
              </button>
            </div>

            <div className="nav-cluster nav-cluster-right">
              {/* REMOVED CAMERA FROM HERE */}
              <button
                onClick={handleGenerateClick}
                className="nav-btn nav-btn-icon nav-btn-primary"
                disabled={!activeLake && !manualWaterName}
                aria-label="Generate Plan"
              >
                <LightningIcon size={22} />
              </button>
              <button
                onClick={catchLog.open}
                className="nav-btn nav-btn-icon"
                disabled={!activeLake}
                aria-label="Catch Log"
                title="Catch Log"
              >
                <LogIcon size={22} />
              </button>
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
                      autoFocus
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
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
                <button
                  type="button"
                  onClick={toggleFavoriteLake}
                  disabled={!selectedCoords}
                  className={`save-fav-btn ${isCurrentLocationSaved ? "remove" : ""}`}
                >
                  {isCurrentLocationSaved ? (
                    <MinusCircleIcon />
                  ) : (
                    <BookmarkIcon />
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleGenerateClick}
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

      {/* STYLES: GLOBAL/UTILITY */}
      <style>{`
        /* ADDED TRANSFORM TO CENTER THE PIN ACCURATELY */
        .orb-marker-map { 
          width: 24px; height: 24px; 
          background: radial-gradient(circle at 30% 30%, #4A90E2, #357ABD); 
          border-radius: 50%; 
          box-shadow: 0 0 16px rgba(74,144,226,0.6), inset 0 -2px 4px rgba(0,0,0,0.3); 
          border: 2px solid rgba(255,255,255,0.8); 
          position: relative; 
        }
        .orb-marker-map::after { content: ''; position: absolute; top: 50%; left: 50%; width: 100%; height: 100%; border-radius: 50%; border: 2px solid rgba(74,144,226,0.5); animation: map-orb-pulse 2s infinite ease-out; }
        @keyframes map-orb-pulse { 0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0.8; } 100% { transform: translate(-50%, -50%) scale(2.5); opacity: 0; } }

        /* Custom Recenter Control */
        .mapboxgl-ctrl-recenter {
          width: 29px; height: 29px;
          display: flex; align-items: center; justify-content: center;
          background: #fff; border: none; cursor: pointer;
          border-radius: 4px;
        }
        .mapboxgl-ctrl-recenter:hover { background: #f0f0f0; }
        .mapboxgl-ctrl-recenter svg { color: #333; }

        /* NAVIGATION PANEL */
        .members-navigation-container { 
          position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%); 
          z-index: 1000; width: 92%; max-width: 480px; 
        }
        .glass-deck { 
          display: flex; align-items: center; justify-content: space-between; 
          padding: 8px 12px; 
          background: rgba(18, 18, 18, 0.92); 
          backdrop-filter: blur(24px); 
          border: 1px solid rgba(255, 255, 255, 0.12); 
          border-radius: 28px; 
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1); 
          height: 64px; 
          position: relative; 
        }
        
        .nav-cluster { display: flex; gap: 8px; align-items: center; }
        .nav-cluster-left { padding-left: 8px; }
        .nav-cluster-right { padding-right: 8px; }
        
        .nav-btn { 
          display: flex; align-items: center; justify-content: center; 
          width: 44px; height: 44px;
          border: none; background: transparent; 
          cursor: pointer; border-radius: 12px; 
          transition: all 0.2s; 
          color: rgba(255, 255, 255, 0.5); 
        }
        .nav-btn:hover:not(:disabled) { color: #fff; background: rgba(255,255,255,0.08); }
        .nav-btn:disabled { opacity: 0.35; cursor: not-allowed; }
        
        /* Icon-only buttons */
        .nav-btn-icon {
          padding: 8px;
        }
        
        /* Primary action button (Generate) */
        .nav-btn-primary { 
          color: #4A90E2;
          background: rgba(74, 144, 226, 0.1);
        }
        .nav-btn-primary:hover:not(:disabled) { 
          background: rgba(74, 144, 226, 0.25);
          color: #fff;
          box-shadow: 0 0 15px rgba(74, 144, 226, 0.3);
        }
        
        /* Danger button (Remove) */
        .nav-btn-danger { 
          color: #f87171;
        }
        .nav-btn-danger:hover:not(:disabled) { 
          background: rgba(248, 113, 113, 0.15);
          color: #fca5a5;
        }

        .orb-nav-cluster { 
          display: flex; align-items: center; gap: 2px; 
          position: absolute; left: 50%; top: 50%; 
          transform: translate(-50%, -50%); margin-top: -24px; 
        }
        .orb-wrapper { 
          width: 60px; height: 60px; 
          display: flex; align-items: center; justify-content: center; 
          background: rgba(18, 18, 18, 0.95); border-radius: 50%; 
          box-shadow: 0 -10px 20px rgba(0,0,0,0.5); 
          cursor: pointer; position: relative; 
        }
        .orb-glow-ring { 
          position: absolute; inset: -4px; border-radius: 50%; 
          background: linear-gradient(180deg, rgba(74, 144, 226, 0.6), transparent); 
          opacity: 0.3; z-index: -1; animation: orb-pulse 3s infinite; 
        }
        .nav-arrow-btn { 
          width: 28px; height: 28px; border-radius: 50%; border: none; 
          background: rgba(0,0,0,0.5); color: rgba(255,255,255,0.7); 
          display: flex; align-items: center; justify-content: center; 
          cursor: pointer; backdrop-filter: blur(4px); 
          transition: all 0.2s; margin-top: 24px; 
        }
        .nav-arrow-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .nav-arrow-btn:hover:not(:disabled) { background: rgba(255,255,255,0.15); color: #fff; }

        /* Floating Camera Button */
        .fab-camera {
          position: absolute;
          top: -72px; /* Floats above the nav deck */
          right: 8px; /* Aligns roughly with right cluster */
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: linear-gradient(135deg, #4A90E2 0%, #357ABD 100%);          
          border: none;
          color: white;
          box-shadow: 0 8px 20px rgba(16, 185, 129, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          z-index: 1002;
        }
        .fab-camera:active {
          transform: scale(0.95);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }

        /* MODAL STYLES */
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
      `}</style>
    </div>
  );
}
