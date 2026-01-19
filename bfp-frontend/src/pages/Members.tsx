// src/pages/Members.tsx

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useUser } from "@clerk/clerk-react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useNavigate, useSearchParams } from "react-router-dom";

import { generateMemberPlan, RateLimitError } from "@/lib/api";
import { useMemberStatus } from "@/hooks/useMemberStatus";
import { LocationSearch } from "@/components/LocationSearch";
import { PlanGenerationLoader } from "@/components/PlanGenerationLoader";
import {
  FishIcon,
  RadarIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  TrashIcon,
  SaveIcon,
  CheckIcon,
  CrosshairIcon,
} from "@/components/UnifiedIcons";

import { MapOrb } from "@/components/MapOrb";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

type FavoriteLake = {
  id: string;
  name: string;
  city?: string;
  state?: string;
  lat: number;
  lng: number;
  zoom: number;
  image: string;
};

type CatchLog = {
  id: string;
  date: string;
  lure: string;
  weight?: string;
  notes?: string;
  lat: number;
  lng: number;
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
  return el;
};

const createGoldMarker = () => {
  const el = document.createElement("div");
  el.className = "catch-marker-map";
  el.innerHTML = "🐟";
  return el;
};

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

const SearchIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

const PinIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
    <circle cx="12" cy="10" r="3"></circle>
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
  const [catches, setCatches] = useLocalStorage<CatchLog[]>(
    "aiq_user_catches",
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
  const [showCatchModal, setShowCatchModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Favorite Navigation State
  const [viewingFavoriteId, setViewingFavoriteId] = useState<string | null>(
    null,
  );

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

  // Catch Inputs
  const [catchLure, setCatchLure] = useState("");
  const [catchWeight, setCatchWeight] = useState("");
  const [catchNotes, setCatchNotes] = useState("");

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

  const showModalRef = useRef(false);
  const showCatchModalRef = useRef(false);
  const viewingFavoriteIdRef = useRef<string | null>(null);

  // --- DERIVED STATE ---
  const isCurrentLocationSaved = React.useMemo(() => {
    if (!selectedCoords) return false;
    return favorites.some(
      (lake) =>
        lake.name === waterName ||
        (Math.abs(lake.lat - selectedCoords.lat) < 0.001 &&
          Math.abs(lake.lng - selectedCoords.lng) < 0.001),
    );
  }, [favorites, selectedCoords, waterName]);

  const currentFavorite = React.useMemo(() => {
    return favorites.find((f) => f.id === viewingFavoriteId) || null;
  }, [favorites, viewingFavoriteId]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Sync refs for event handlers
  useEffect(() => {
    showModalRef.current = showModal;
  }, [showModal]);
  useEffect(() => {
    showCatchModalRef.current = showCatchModal;
  }, [showCatchModal]);
  useEffect(() => {
    viewingFavoriteIdRef.current = viewingFavoriteId;
  }, [viewingFavoriteId]);

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

    // Default center (Alabama)
    const defaultCenter: [number, number] = [-86.7816, 33.5186];
    let initialZoom = 6;

    // 1. Check for URL Params (Coming back from Plan Page)
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

    // Standard Controls
    const navControl = new mapboxgl.NavigationControl({ showCompass: false });
    const geoControl = new mapboxgl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: false,
      showUserLocation: true,
    });
    m.addControl(navControl, "top-right");
    m.addControl(geoControl, "top-right");
    controlsRef.current = [navControl, geoControl];

    // --- SETUP INITIAL PIN FROM URL IF PRESENT ---
    if (urlLat && urlLng) {
      const lat = parseFloat(urlLat);
      const lng = parseFloat(urlLng);

      // Set State
      setSelectedCoords({ lat, lng });
      setWaterName(urlLake ? decodeURIComponent(urlLake) : "Pinned Location");

      // We assume it's Manual mode if coming from URL, but trigger search for metadata
      setInputMode("manual");

      // Add Marker
      if (markerRef.current) markerRef.current.remove();
      const markerEl = createOrbMarker();
      markerElementRef.current = markerEl;
      markerRef.current = new mapboxgl.Marker({ element: markerEl })
        .setLngLat([lng, lat])
        .addTo(m);

      // Attempt to fetch city/state metadata for this pin
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

    const renderCatchPins = () => {
      catchMarkersRef.current.forEach((mk) => mk.remove());
      catchMarkersRef.current = [];
      catches.forEach((c) => {
        const el = createGoldMarker();
        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([c.lng, c.lat])
          .addTo(m);
        catchMarkersRef.current.push(marker);
      });
    };

    const onClick = async (e: mapboxgl.MapMouseEvent) => {
      if (!mapRef.current || !isMountedRef.current) return;
      if (
        showCatchModalRef.current ||
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
          setWaterName("");
          setLocationDetails({});
          setShowModal(true);

          if (markerRef.current) markerRef.current.remove();
          if (markerElementRef.current) markerElementRef.current.remove();
          const markerEl = createOrbMarker();
          markerElementRef.current = markerEl;
          markerRef.current = new mapboxgl.Marker({ element: markerEl })
            .setLngLat([lng, lat])
            .addTo(mapRef.current);

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
              setWaterName(
                `Water near ${[city, state].filter(Boolean).join(", ")}`,
              );
              setLocationDetails({ city, state });
            } else {
              setWaterName("Dropped Pin Location");
            }
          } catch (e2: any) {
            if (e2.name !== "AbortError") console.error("Geocode failed:", e2);
          }
        }
      } catch (err) {
        console.debug(err);
      }
    };

    const onLoad = () => {
      if (isMountedRef.current) renderCatchPins();
    };
    m.on("click", onClick);
    m.on("load", onLoad);
    if (m.loaded()) renderCatchPins();

    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) abortControllerRef.current.abort();
      m.off("click", onClick);
      m.off("load", onLoad);
      if (markerRef.current) markerRef.current.remove();
      catchMarkersRef.current.forEach((mk) => mk.remove());
      controlsRef.current.forEach((control) => m.removeControl(control));
      m.remove();
      mapRef.current = null;
      initialized.current = false;
    };
  }, [isActive, catches]); // Run only once basically (plus auth check)

  // --- HANDLERS ---
  const handleSearchSelect = useCallback(
    (location: {
      name: string;
      latitude: number;
      longitude: number;
      city?: string;
      state?: string;
    }) => {
      setWaterName(location.name);
      // Metadata from search result
      setLocationDetails({ city: location.city, state: location.state });
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
      if (!user?.primaryEmailAddress?.emailAddress || !selectedCoords) return;
      setErr(null);
      setRateLimitInfo(null);
      setLoading(true);

      try {
        const response = await generateMemberPlan({
          email: user.primaryEmailAddress.emailAddress,
          water: {
            name: waterName,
            lat: selectedCoords.lat,
            lon: selectedCoords.lng,
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
    [user, selectedCoords, waterName, accessType, navigate],
  );

  const toggleFavoriteLake = useCallback(
    (e?: React.MouseEvent) => {
      e?.preventDefault();
      e?.stopPropagation();
      if (!waterName || !selectedCoords) return;

      if (isCurrentLocationSaved) {
        setFavorites((prev) => prev.filter((l) => l.name !== waterName));
        setSuccessMessage("Lake Removed");
      } else {
        const zoom = mapRef.current?.getZoom() || 10;
        const imageUrl = `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/${selectedCoords.lng},${selectedCoords.lat},${Math.min(zoom, 13)},0/300x200?access_token=${MAPBOX_TOKEN}`;
        const newLake: FavoriteLake = {
          id: crypto.randomUUID(),
          name: waterName,
          city: locationDetails.city,
          state: locationDetails.state,
          lat: selectedCoords.lat,
          lng: selectedCoords.lng,
          zoom: zoom,
          image: imageUrl,
        };
        setFavorites((prev) => [...prev, newLake]);
        setSuccessMessage("Lake Saved");
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

  // --- NAVIGATION HANDLERS ---
  const navigateFavorites = useCallback(
    (direction: "prev" | "next") => {
      if (favorites.length === 0) return;

      let newIndex = 0;
      const currentIndex = favorites.findIndex(
        (f) => f.id === viewingFavoriteId,
      );

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
      setViewingFavoriteId(nextLake.id);

      if (mapRef.current) {
        mapRef.current.flyTo({
          center: [nextLake.lng, nextLake.lat],
          zoom: nextLake.zoom,
          duration: 2000,
          essential: true,
        });
      }

      setWaterName(nextLake.name);
      setLocationDetails({ city: nextLake.city, state: nextLake.state });
      setSelectedCoords({ lat: nextLake.lat, lng: nextLake.lng });
    },
    [favorites, viewingFavoriteId],
  );

  // SMART RE-CENTER: Zooms to Selected Coords (Active Plan/Pin) OR User Location
  const handleRecenter = useCallback(() => {
    if (!mapRef.current) return;

    if (selectedCoords) {
      // Priority 1: Go back to the Active Pin (Scout location or Plan location)
      mapRef.current.flyTo({
        center: [selectedCoords.lng, selectedCoords.lat],
        zoom: 13,
        duration: 1500,
        essential: true,
      });
    } else if (navigator.geolocation) {
      // Priority 2: User Geolocation
      navigator.geolocation.getCurrentPosition((pos) => {
        mapRef.current?.flyTo({
          center: [pos.coords.longitude, pos.coords.latitude],
          zoom: 12,
          duration: 1500,
        });
      });
    }
  }, [selectedCoords]);

  const handleLogCatch = useCallback((e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    // Catch logging logic commented out for now
  }, []);

  const handleOpenScoutModal = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowModal(true);
  };
  const handleOpenCatchModal = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowCatchModal(true);
  };
  const handleCloseScoutModal = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setShowModal(false);
  };
  const handleCloseCatchModal = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setShowCatchModal(false);
  };

  const handleReturnToPlan = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (lastPlanUrl) navigate(lastPlanUrl);
  };

  const handleRemoveCurrentFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (currentFavorite) {
      setFavorites((prev) => prev.filter((f) => f.id !== currentFavorite.id));
      setViewingFavoriteId(null);
      setSuccessMessage("Favorite Removed");
    }
  };

  const handleCloseFavoriteModal = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setViewingFavoriteId(null);
  };

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

      {successMessage && (
        <div className="success-modal animate-in fade-in zoom-in">
          <div className="success-icon">
            <CheckIcon />
          </div>
          <span>{successMessage}</span>
        </div>
      )}

      {/* --- FAVORITE LAKE CARD --- */}
      {currentFavorite && !showModal && !showCatchModal && (
        <div className="favorite-card-modal animate-in fade-in zoom-in">
          <div
            className="fav-modal-image"
            style={{ backgroundImage: `url(${currentFavorite.image})` }}
          >
            <button
              onClick={handleCloseFavoriteModal}
              className="fav-close-btn"
            >
              ×
            </button>
            <div className="fav-modal-overlay" />
          </div>

          <div className="fav-modal-body">
            <div style={{ marginBottom: 20, textAlign: "center" }}>
              <h3 className="fav-lake-name">{currentFavorite.name}</h3>
              <div className="fav-lake-location">
                {currentFavorite.city && currentFavorite.state
                  ? `${currentFavorite.city}, ${currentFavorite.state}`
                  : `${currentFavorite.lat.toFixed(3)}°N, ${currentFavorite.lng.toFixed(3)}°W`}
              </div>
            </div>

            <div className="fav-modal-actions">
              <button
                onClick={handleRemoveCurrentFavorite}
                className="fav-action-btn remove"
              >
                <TrashIcon size={18} />
              </button>
              <button
                onClick={handleGenerate}
                className="fav-action-btn generate"
              >
                Generate Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- BOTTOM NAVIGATION (Balanced) --- */}
      {!showModal && !showCatchModal && (
        <div className="members-navigation-container">
          <div className="glass-deck">
            {/* Left Cluster: Search */}
            <div className="nav-cluster">
              <button
                onClick={handleOpenScoutModal}
                className="nav-btn"
                aria-label="Scout"
              >
                <div className="icon-wrapper">
                  <RadarIcon size={24} />
                </div>
              </button>
            </div>

            {/* Center Orb Cluster: Navigation & Plan Redirect */}
            <div className="orb-nav-cluster">
              <button
                onClick={() => navigateFavorites("prev")}
                className="nav-arrow-btn"
                disabled={favorites.length === 0}
              >
                {/* Point Left */}
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
                {/* Point Right */}
                <ChevronDownIcon
                  style={{ transform: "rotate(-90deg)" }}
                  size={24}
                />
              </button>
            </div>

            {/* Right Cluster: Recenter (Balanced) */}
            <div className="nav-cluster">
              <button
                onClick={handleRecenter}
                className="nav-btn"
                aria-label="Recenter"
              >
                <div className="icon-wrapper">
                  <CrosshairIcon size={24} />
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 1: SCOUT / GENERATE --- */}
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

      {/* --- MODAL 2: CATCH LOG --- */}
      {showCatchModal && (
        <div className="modal-overlay" onClick={handleCloseCatchModal}>
          <div
            className="glass-panel modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <FishIcon size={20} />
                <span style={{ fontWeight: 700, fontSize: "1.05rem" }}>
                  Log Catch
                </span>
              </div>
              <button
                type="button"
                onClick={handleCloseCatchModal}
                className="close-btn"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              {/* For now, just the input form. Later this will be the list + add button */}
              <div>
                <label className="modal-label">Lure Used</label>
                <input
                  className="glass-input"
                  placeholder="e.g. Jig"
                  value={catchLure}
                  onChange={(e) => setCatchLure(e.target.value)}
                  autoFocus
                />
              </div>
              <div>
                <label className="modal-label">Weight (lbs)</label>
                <input
                  className="glass-input"
                  type="number"
                  placeholder="0.00"
                  value={catchWeight}
                  onChange={(e) => setCatchWeight(e.target.value)}
                />
              </div>
              <div>
                <label className="modal-label">Field Notes</label>
                <textarea
                  className="glass-input glass-textarea"
                  rows={3}
                  placeholder="Details..."
                  value={catchNotes}
                  onChange={(e) => setCatchNotes(e.target.value)}
                />
              </div>
              <button
                type="button"
                onClick={handleLogCatch}
                className="generate-btn"
                style={{
                  marginTop: 10,
                  background:
                    "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                }}
              >
                Save Catch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STYLES */}
      <style>{`
        .orb-marker-map { width: 24px; height: 24px; background: radial-gradient(circle at 30% 30%, #4A90E2, #357ABD); border-radius: 50%; box-shadow: 0 0 16px rgba(74,144,226,0.6), inset 0 -2px 4px rgba(0,0,0,0.3); border: 2px solid rgba(255,255,255,0.8); position: relative; }
        .orb-marker-map::after { content: ''; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 100%; height: 100%; border-radius: 50%; border: 2px solid rgba(74,144,226,0.5); animation: map-orb-pulse 2s infinite ease-out; }
        .catch-marker-map { font-size: 24px; text-shadow: 0 2px 4px rgba(0,0,0,0.5); cursor: pointer; }
        @keyframes map-orb-pulse { 0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0.8; } 100% { transform: translate(-50%, -50%) scale(2.5); opacity: 0; } }

        .success-modal { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(16, 185, 129, 0.15); backdrop-filter: blur(20px); border: 1px solid rgba(16, 185, 129, 0.3); padding: 24px 40px; border-radius: 24px; display: flex; flex-direction: column; align-items: center; gap: 12px; z-index: 3000; color: white; font-weight: 700; box-shadow: 0 20px 50px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1); pointer-events: none; }
        .success-icon { width: 60px; height: 60px; border-radius: 50%; background: rgba(16, 185, 129, 0.2); display: flex; align-items: center; justify-content: center; }

        /* FAVORITE MODAL (High Center - Premium) */
        .favorite-card-modal {
          position: absolute; top: 35%; left: 50%; transform: translate(-50%, -50%);
          width: 85%; max-width: 320px;
          background: rgba(20, 20, 20, 0.9);
          backdrop-filter: blur(30px);
          -webkit-backdrop-filter: blur(30px);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 32px;
          overflow: hidden;
          z-index: 2000;
          box-shadow: 0 30px 80px rgba(0,0,0,0.7);
          display: flex; flex-direction: column;
        }
        .fav-modal-image {
          height: 180px; width: 100%; background-size: cover; background-position: center; position: relative;
        }
        .fav-modal-overlay {
          position: absolute; bottom: 0; left: 0; right: 0;
          height: 100%;
          background: linear-gradient(to top, rgba(20,20,20,1) 0%, rgba(20,20,20,0) 60%);
        }
        .fav-close-btn {
          position: absolute; top: 12px; right: 12px; z-index: 10;
          width: 32px; height: 32px; border-radius: 50%;
          background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1);
          color: #fff; font-size: 1.2rem; display: flex; align-items: center; justify-content: center;
          cursor: pointer; backdrop-filter: blur(4px); transition: all 0.2s;
        }
        .fav-close-btn:active { transform: scale(0.9); background: rgba(0,0,0,0.6); }

        .fav-modal-body {
          padding: 0 24px 28px;
          background: rgba(20, 20, 20, 0.9);
          display: flex; flex-direction: column;
        }
        .fav-lake-name { margin: 0; font-size: 1.6rem; color: #fff; font-weight: 800; letter-spacing: -0.02em; line-height: 1.1; margin-top: -10px; z-index: 2; position: relative; }
        .fav-lake-location { font-size: 0.9rem; color: rgba(255,255,255,0.5); font-weight: 500; margin-top: 6px; }
        
        .fav-modal-actions {
          display: flex; gap: 12px; margin-top: 24px; justify-content: center;
        }
        .fav-action-btn {
          border: none; border-radius: 50px; font-weight: 700; cursor: pointer; transition: all 0.2s; font-size: 0.9rem;
        }
        .fav-action-btn:active { transform: scale(0.96); }
        
        .fav-action-btn.remove {
          background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.4); 
          width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;
          border: 1px solid rgba(255,255,255,0.05); border-radius: 16px;
        }
        .fav-action-btn.remove:hover { color: #ff6b6b; background: rgba(255, 107, 107, 0.1); border-color: rgba(255, 107, 107, 0.2); }
        
        /* Updated Generate Button Style */
        .fav-action-btn.generate {
          flex: 1; 
          background: transparent;
          border: 1px solid rgba(74, 144, 226, 0.6);
          color: #4A90E2;
          height: 44px;
          border-radius: 30px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-size: 0.8rem;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }
        .fav-action-btn.generate:hover {
          background: rgba(74, 144, 226, 0.1);
          color: #fff;
          border-color: #4A90E2;
          box-shadow: 0 0 16px rgba(74, 144, 226, 0.3);
        }

        /* NAV STYLES */
        .members-navigation-container { position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%); z-index: 1000; width: 95%; max-width: 400px; }
        .glass-deck {
          display: flex; align-items: center; justify-content: space-between;
          padding: 8px 16px; background: rgba(18, 18, 18, 0.9);
          backdrop-filter: blur(24px); border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 28px; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1);
          height: 70px; position: relative;
        }
        .nav-cluster { display: flex; gap: 12px; }
        .nav-btn {
          display: flex; align-items: center; justify-content: center; width: 48px; height: 48px;
          border: none; background: transparent; cursor: pointer; border-radius: 16px;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); color: rgba(255, 255, 255, 0.35);
        }
        .nav-btn:hover { color: #fff; background: rgba(255,255,255,0.05); }
        .nav-btn.active { background: rgba(255, 255, 255, 0.03); transform: translateY(-2px); color: #4A90E2; }
        .nav-btn.active svg { filter: drop-shadow(0 0 6px rgba(74, 144, 226, 0.6)); }
        
        .orb-nav-cluster {
          display: flex; align-items: center; gap: 4px;
          position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);
          margin-top: -24px;
        }
        .orb-wrapper {
          width: 76px; height: 76px;
          display: flex; align-items: center; justify-content: center;
          background: rgba(18, 18, 18, 0.95); border-radius: 50%;
          box-shadow: 0 -10px 20px rgba(0,0,0,0.5); cursor: pointer;
          position: relative;
        }
        .orb-glow-ring {
           position: absolute; inset: -4px; border-radius: 50%;
           background: linear-gradient(180deg, rgba(74, 144, 226, 0.6), transparent);
           opacity: 0.3; z-index: -1; animation: orb-pulse 3s infinite;
        }
        
        .nav-arrow-btn {
           width: 32px; height: 32px; border-radius: 50%; border: none; background: rgba(0,0,0,0.5);
           color: rgba(255,255,255,0.7); display: flex; align-items: center; justify-content: center;
           cursor: pointer; backdrop-filter: blur(4px); transition: all 0.2s;
           margin-top: 24px; 
        }
        .nav-arrow-btn:active { transform: scale(0.9); }
        .nav-arrow-btn:disabled { opacity: 0; pointer-events: none; }

        .modal-overlay { position: absolute; inset: 0; z-index: 2000; background: rgba(0,0,0,0.6); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; padding: 16px; }
        .modal-content { width: 100%; max-width: 420px; border-radius: 24px; background: rgba(15, 15, 20, 0.95); backdrop-filter: blur(24px); border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 25px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05); display: flex; flex-direction: column; overflow: hidden; }
        .modal-header { padding: 20px 24px; border-bottom: 1px solid rgba(255,255,255,0.06); display: flex; justify-content: space-between; align-items: center; color: white; }
        .close-btn { background: rgba(255,255,255,0.05); border: none; border-radius: 10px; width: 36px; height: 36px; color: rgba(255,255,255,0.6); font-size: 1.3rem; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease; }
        .modal-body { padding: 24px; display: flex; flex-direction: column; gap: 20px; color: white; }
        .modal-label { display: block; font-size: 0.7rem; font-weight: 700; opacity: 0.5; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.1em; }
        .glass-input { width: 100%; padding: 14px 16px; border-radius: 12px; font-size: 1rem; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.08); color: #fff; outline: none; transition: all 0.2s ease; }
        .glass-input:focus { border-color: rgba(74,144,226,0.5); background: rgba(0,0,0,0.5); box-shadow: 0 0 0 3px rgba(74,144,226,0.1); }
        .glass-textarea { border-radius: 16px; resize: none; }
        .glass-segment { display: flex; background: rgba(0,0,0,0.3); border-radius: 12px; padding: 4px; gap: 4px; border: 1px solid rgba(255,255,255,0.05); }
        .segment-btn { flex: 1; padding: 12px; border-radius: 10px; border: none; background: transparent; color: rgba(255,255,255,0.5); font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 0.85rem; transition: all 0.2s ease; }
        .segment-btn.active { background: rgba(74, 144, 226, 0.2); color: #fff; box-shadow: inset 0 1px 0 rgba(255,255,255,0.1); }
        .coords-display { padding: 14px 16px; background: rgba(0,0,0,0.3); border-radius: 14px; border: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center; }
        .coords-label { font-size: 0.7rem; text-transform: uppercase; opacity: 0.5; font-weight: 700; letter-spacing: 0.05em; }
        .coords-value { font-family: 'SF Mono', Monaco, monospace; color: #4A90E2; font-size: 0.9rem; margin-top: 4px; }
        .modal-btn { flex: 1; padding: 14px; border-radius: 14px; display: flex; align-items: center; justify-content: center; gap: 10px; cursor: pointer; font-size: 0.95rem; font-weight: 600; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); color: rgba(255,255,255,0.6); transition: all 0.2s ease; }
        .modal-btn.active { background: rgba(74, 144, 226, 0.15); border-color: rgba(74, 144, 226, 0.4); color: #fff; }
        .generate-btn { flex: 1; padding: 18px; color: #fff; border: none; border-radius: 16px; font-weight: 700; font-size: 1.05rem; cursor: pointer; box-shadow: 0 8px 24px rgba(74, 144, 226, 0.25); transition: all 0.2s ease; }
        .generate-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .save-fav-btn { width: 60px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; color: #fff; cursor: pointer; transition: all 0.2s ease; }
        .save-fav-btn.remove { border-color: rgba(255, 107, 107, 0.4); background: rgba(255, 107, 107, 0.1); }
        .save-fav-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .error-banner { padding: 14px 16px; background: rgba(255,107,107,0.1); border: 1px solid rgba(255,107,107,0.2); border-radius: 12px; font-size: 0.9rem; color: #ff6b6b; }
        
        .animate-in { animation: animateIn 0.2s ease-out; }
        .fade-in { animation: fadeIn 0.2s ease-out; }
        .zoom-in { animation: zoomIn 0.2s ease-out; }
        @keyframes animateIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes zoomIn { from { transform: translate(-50%, -50%) scale(0.95); opacity: 0; } to { transform: translate(-50%, -50%) scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
}
