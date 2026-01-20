// src/pages/Members.tsx

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import { useUser } from "@clerk/clerk-react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useNavigate, useSearchParams } from "react-router-dom";

import { generateMemberPlan, RateLimitError } from "@/lib/api";
import { useMemberStatus } from "@/hooks/useMemberStatus";
import { LocationSearch } from "@/components/LocationSearch";
import { PlanGenerationLoader } from "@/components/PlanGenerationLoader";
import {
  RadarIcon,
  ChevronDownIcon,
  TrashIcon,
  SaveIcon,
  CrosshairIcon,
  PinIcon,
  SearchIcon,
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

// Type matching your lakes.json structure
type LakeData = {
  name: string;
  state: string;
  city?: string;
  latitude: number;
  longitude: number;
  acres?: number;
  tier: number;
};

type FavoriteLake = {
  id: string;
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
function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.log(error);
      return initialValue;
    }
  });
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.log(error);
    }
  };
  return [storedValue, setValue] as const;
}

function isWaterFeature(f: mapboxgl.MapboxGeoJSONFeature): boolean {
  return f.source === "composite" && f.sourceLayer === "water";
}

const createOrbMarker = () => {
  const el = document.createElement("div");
  el.className = "orb-marker-map";
  // FIXED: Explicit dimensions ensure Mapbox calculates center anchor correctly immediately
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
  if (!acres) return 5000; // 5km default
  if (acres > 30000) return 20000; // 20km - Lake Guntersville, Lanier
  if (acres > 10000) return 15000; // 15km - Large reservoirs
  if (acres > 5000) return 10000; // 10km - Medium lakes
  return 5000; // 5km - Small lakes/ponds
}

// Find nearest lake with dynamic radius based on lake size
function findNearestLake(lat: number, lng: number): LakeData | null {
  let nearest: LakeData | null = null;
  let minDist = Infinity;

  // Optimization: Filter by rough bounding box first (0.2 deg ~ 22km)
  // to avoid running Haversine on 2000+ lakes unnecessarily
  const candidates = (LAKES_DATA as LakeData[]).filter(
    (l) =>
      Math.abs(l.latitude - lat) < 0.2 && Math.abs(l.longitude - lng) < 0.2,
  );

  for (const lake of candidates) {
    const dist = getDistanceMeters(lat, lng, lake.latitude, lake.longitude);
    const threshold = getMatchRadius(lake.acres);

    // Only consider if within this lake's threshold
    if (dist <= threshold && dist < minDist) {
      minDist = dist;
      nearest = lake;
    }
  }

  return nearest;
}

// --- ICONS (Local) ---
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

// Notebook/Log icon for catch log
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

export function Members() {
  const { user } = useUser();
  const { isActive, isLoading: statusLoading } = useMemberStatus();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // --- PERSISTENT STATE ---
  const [favorites, setFavorites] = useLocalStorage<FavoriteLake[]>(
    "aiq_favorite_lakes",
    [],
  );

  const [lastPlanUrl, setLastPlanUrl] = useState<string | null>(() =>
    sessionStorage.getItem("aiq_last_plan_url"),
  );

  // --- LOCAL STATE ---
  const [rateLimitInfo, setRateLimitInfo] = useState<{
    message: string;
    secondsRemaining: number;
  } | null>(null);
  const [showModal, setShowModal] = useState(false);

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

  const initialized = useRef(false);
  const isMountedRef = useRef(true);
  const controlsRef = useRef<mapboxgl.IControl[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync refs for event handlers
  const showModalRef = useRef(false);
  const viewingFavoriteIdRef = useRef<string | null>(null);
  const selectedCoordsRef = useRef<{ lat: number; lng: number } | null>(null);

  // Keep selectedCoordsRef in sync
  useEffect(() => {
    selectedCoordsRef.current = selectedCoords;
  }, [selectedCoords]);

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
    // 1. If looking at a favorite, that is active
    if (currentFavorite) {
      return {
        name: currentFavorite.name,
        lat: currentFavorite.lat,
        lng: currentFavorite.lng,
      };
    }
    // 2. If scouting (dropped a pin/searched) and have a name + coords
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
  useEffect(() => {
    isCatchLogOpenRef.current = catchLog.isOpen;
  }, [catchLog.isOpen]);

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

    // Check if this location is in favorites
    const isSaved = favorites.some(
      (f) =>
        f.name === waterName ||
        (Math.abs(f.lat - selectedCoords.lat) < 0.001 &&
          Math.abs(f.lng - selectedCoords.lng) < 0.001),
    );

    // Check if it's a known lake (has a real name, not a placeholder)
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
      catchLog.lakeCatches, // 1. Use the filtered list here
      (entry) => catchLog.showDetail(entry),
    );

    return () => {
      removeCatchMarkers(catchMarkersRef.current);
    };
  }, [catchLog.lakeCatches, mapRef.current]); // 2. Update dependency to match
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

    // Custom Recenter control
    class RecenterControl implements mapboxgl.IControl {
      _container: HTMLDivElement | undefined;

      onAdd(): HTMLElement {
        this._container = document.createElement("div");
        this._container.className = "mapboxgl-ctrl mapboxgl-ctrl-group";
        this._container.innerHTML = `
          <button class="mapboxgl-ctrl-recenter" type="button" title="Recenter on pin" aria-label="Recenter on pin">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>
            </svg>
          </button>
        `;
        this._container
          .querySelector("button")
          ?.addEventListener("click", () => {
            const coords = selectedCoordsRef.current;
            if (coords && mapRef.current) {
              mapRef.current.flyTo({
                center: [coords.lng, coords.lat],
                zoom: 13,
                duration: 1500,
                essential: true,
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

      onRemove(): void {
        this._container?.parentNode?.removeChild(this._container);
      }
    }

    const recenterControl = new RecenterControl();
    m.addControl(recenterControl, "top-right");
    controlsRef.current = [navControl, geoControl, recenterControl];

    // Setup initial pin from URL
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

      fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}`,
      )
        .then((res) => res.json())
        .then((data) => {
          if (!isMountedRef.current) return;
          const context = data?.features?.[0]?.context;
          if (context) {
            const city = context.find((c: any) =>
              String(c.id).startsWith("place"),
            )?.text;
            const state = context
              .find((c: any) => String(c.id).startsWith("region"))
              ?.short_code?.replace("US-", "");
            setLocationDetails({ city, state });
          }
        })
        .catch(console.error);
    }

    const onClick = async (e: mapboxgl.MapMouseEvent) => {
      if (!mapRef.current || !isMountedRef.current) return;

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

          // 1. UPDATE STATE (Drop Pin)
          setSelectedCoords({ lat, lng });
          setInputMode("manual");
          setLocationDetails({});

          // 2. CHECK DATABASE FOR NEARBY LAKE (Reverse Lookup)
          const nearbyLake = findNearestLake(lat, lng);
          if (nearbyLake) {
            setWaterName(nearbyLake.name);
            setLocationDetails({
              city: nearbyLake.city,
              state: nearbyLake.state,
            });
          } else {
            setWaterName(""); // Placeholder until geocode returns
          }

          // 3. SHOW MARKER
          if (markerRef.current) markerRef.current.remove();
          if (markerElementRef.current) markerElementRef.current.remove();
          const markerEl = createOrbMarker();
          markerElementRef.current = markerEl;
          markerRef.current = new mapboxgl.Marker({ element: markerEl })
            .setLngLat([lng, lat])
            .addTo(mapRef.current);

          // 4. GEOCODE (If no database match, or to get city/state context)
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

              setLocationDetails({ city, state });
            }

            // Only overwrite name if we didn't find a database match
            if (!nearbyLake) {
              if (city || state) {
                setWaterName(
                  `Water near ${[city, state].filter(Boolean).join(", ")}`,
                );
              } else {
                setWaterName("Dropped Pin Location");
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
      if (abortControllerRef.current) abortControllerRef.current.abort();
      m.off("click", onClick);

      if (markerRef.current) markerRef.current.remove();
      controlsRef.current.forEach((control) => m.removeControl(control));
      m.remove();
      mapRef.current = null;
      initialized.current = false;
    };
  }, [isActive]);

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

    if (!match) {
      match = (LAKES_DATA as LakeData[]).find(
        (l) =>
          Math.abs(l.latitude - lat) < 0.05 &&
          Math.abs(l.longitude - lng) < 0.05,
      );
    }
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

      if (mapRef.current) {
        mapRef.current.flyTo({
          center: [location.longitude, location.latitude],
          zoom: 12,
          duration: 1500,
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

  const handleGenerate = useCallback(
    async (e?: React.MouseEvent) => {
      e?.preventDefault();
      e?.stopPropagation();
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
    },
    [user, selectedCoords, waterName, accessType, currentFavorite, navigate],
  );

  const toggleFavoriteLake = useCallback(
    (e?: React.MouseEvent) => {
      e?.preventDefault();
      e?.stopPropagation();
      if (!waterName || !selectedCoords) return;

      if (isCurrentLocationSaved) {
        setFavorites((prev) => prev.filter((l) => l.name !== waterName));
      } else {
        const zoom = mapRef.current?.getZoom() || 10;
        const dbMatch = hydrateLakeData(
          waterName,
          selectedCoords.lat,
          selectedCoords.lng,
        );
        const imageUrl = `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/${selectedCoords.lng},${selectedCoords.lat},${Math.min(zoom, 13)},0/600x400?access_token=${MAPBOX_TOKEN}`;

        const newLake: FavoriteLake = {
          id: crypto.randomUUID(),
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
      }
    },
    [
      waterName,
      selectedCoords,
      locationDetails,
      isCurrentLocationSaved,
      setFavorites,
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
        if (direction === "next") {
          newIndex = (currentIndex + 1) % favorites.length;
        } else {
          newIndex = (currentIndex - 1 + favorites.length) % favorites.length;
        }
      }

      const nextLake = favorites[newIndex];

      if (mapRef.current) {
        mapRef.current.flyTo({
          center: [nextLake.lng, nextLake.lat],
          zoom: nextLake.zoom,
          duration: 3000,
          essential: true,
        });
      }

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
    // If we have a pin, open straight to manual mode to confirm it
    if (selectedCoords) {
      setInputMode("manual");
    } else {
      setInputMode("search");
    }
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

  // --- LAKE LABEL HANDLERS ---
  const handleLakeLabelSave = useCallback(
    (name: string) => {
      if (!selectedCoords) return;

      // If it's an unknown water, update the waterName first
      if (!lakeLabelData?.isKnown) {
        setWaterName(name);
      }

      const zoom = mapRef.current?.getZoom() || 10;
      const dbMatch = hydrateLakeData(
        name,
        selectedCoords.lat,
        selectedCoords.lng,
      );
      const imageUrl = `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/${selectedCoords.lng},${selectedCoords.lat},${Math.min(zoom, 13)},0/600x400?access_token=${MAPBOX_TOKEN}`;

      const newLake: FavoriteLake = {
        id: crypto.randomUUID(),
        name: dbMatch?.name || name,
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
    },
    [selectedCoords, locationDetails, lakeLabelData, setFavorites],
  );

  const handleLakeLabelRemove = useCallback(() => {
    if (!selectedCoords || !waterName) return;
    setFavorites((prev) =>
      prev.filter(
        (f) =>
          f.name !== waterName &&
          !(
            Math.abs(f.lat - selectedCoords.lat) < 0.001 &&
            Math.abs(f.lng - selectedCoords.lng) < 0.001
          ),
      ),
    );
  }, [selectedCoords, waterName, setFavorites]);

  const handleLakeLabelGenerate = useCallback(() => {
    // For unknown waters, use the manual name if available
    if (!lakeLabelData?.isKnown && manualWaterName) {
      setWaterName(manualWaterName);
    }
    handleGenerate();
  }, [lakeLabelData, manualWaterName, handleGenerate]);

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
      <div style={{ width: "100%", height: "100%" }}>
        <style>{`.mapboxgl-ctrl-top-right { top: 20px !important; }`}</style>
        <div ref={mapContainer} style={{ width: "100%", height: "100%" }} />
      </div>

      <CatchLogModal
        {...catchLog}
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

      {/* Floating Lake Label */}
      {!showModal && !catchLog.isOpen && (
        <LakeLabel
          lake={lakeLabelData}
          isVisible={lakeLabelVisible && !!selectedCoords}
          onNameChange={setManualWaterName}
          lakesData={
            LAKES_DATA as Array<{ name: string; city?: string; state?: string }>
          }
          onAcceptSuggestion={(name, city, state) => {
            setWaterName(name);
            setManualWaterName(name);
            if (city || state) {
              setLocationDetails({ city, state });
            }
          }}
        />
      )}

      {!showModal && !catchLog.isOpen && (
        <div className="members-navigation-container">
          <div className="glass-deck">
            {/* Left cluster: Scout (icon) + Save/Remove (text) */}
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
                className={`nav-btn ${isCurrentLocationSaved ? "nav-btn-danger" : ""}`}
                disabled={!activeLake && !manualWaterName}
                aria-label={isCurrentLocationSaved ? "Remove" : "Save"}
              >
                <span>{isCurrentLocationSaved ? "Remove" : "Save"}</span>
              </button>
            </div>

            {/* Center: Favorite navigation */}
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
                <MapOrb size={30} />
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

            {/* Right cluster: Generate + Log */}
            <div className="nav-cluster nav-cluster-right">
              <button
                onClick={handleLakeLabelGenerate}
                className="nav-btn"
                disabled={!activeLake && !manualWaterName}
                aria-label="Generate Plan"
              >
                <span>Generate</span>
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
                  {isCurrentLocationSaved ? <TrashIcon /> : <SaveIcon />}
                </button>
                <button
                  type="button"
                  onClick={handleGenerate}
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
          z-index: 1000; width: 92%; max-width: 520px; 
        }
        .glass-deck { 
          display: flex; align-items: center; justify-content: space-between; 
          padding: 8px 12px; 
          background: rgba(18, 18, 18, 0.92); 
          backdrop-filter: blur(24px); 
          border: 1px solid rgba(255, 255, 255, 0.12); 
          border-radius: 28px; 
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1); 
          height: 70px; 
          position: relative; 
        }
        
        .nav-cluster { display: flex; gap: 4px; align-items: center; }
        .nav-cluster-left { padding-left: 4px; }
        .nav-cluster-right { padding-right: 4px; }
        
        .nav-btn { 
          display: flex; align-items: center; justify-content: center; 
          padding: 8px 12px; min-width: 44px; height: 40px;
          border: none; background: transparent; 
          cursor: pointer; border-radius: 12px; 
          transition: all 0.2s; 
          color: rgba(255, 255, 255, 0.5); 
          font-size: 0.8rem; font-weight: 600;
        }
        .nav-btn:hover:not(:disabled) { color: #fff; background: rgba(255,255,255,0.08); }
        .nav-btn:disabled { opacity: 0.35; cursor: not-allowed; }
        
        /* Icon-only buttons (Scout, Log) */
        .nav-btn-icon {
          min-width: 40px;
          width: 40px;
          padding: 8px;
        }
        
        /* Primary action button (Generate) */
        .nav-btn-primary { 
          background: linear-gradient(135deg, rgba(74, 144, 226, 0.25) 0%, rgba(53, 122, 189, 0.25) 100%);
          border: 1px solid rgba(74, 144, 226, 0.4);
          color: #4A90E2;
        }
        .nav-btn-primary:hover:not(:disabled) { 
          background: linear-gradient(135deg, rgba(74, 144, 226, 0.35) 0%, rgba(53, 122, 189, 0.35) 100%);
          color: #fff;
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
          display: flex; align-items: center; gap: 4px; 
          position: absolute; left: 50%; top: 50%; 
          transform: translate(-50%, -50%); margin-top: -24px; 
        }
        .orb-wrapper { 
          width: 72px; height: 72px; 
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

        /* MODAL STYLES */
        .modal-overlay { position: absolute; inset: 0; z-index: 2000; background: rgba(0,0,0,0.6); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; padding: 16px; }
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
