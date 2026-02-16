// src/pages/LakeBuilder.tsx

import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useLocation, useNavigate } from "react-router-dom";
import { usePlatformAuth, usePlatformUser } from "@/hooks/usePlatformAuth";
import { isNativePlatform } from "@/lib/platform";
import { MapOrb } from "../components/MapOrb";

// --- API ---
// We will call the backend to update geometry if it's a regular user save
import { updateCustomLakeGeometry, updateCustomLakeGeometryMobile, createCustomLake, createCustomLakeMobile } from "@/lib/catches-api";
import { useNativeAuth } from "@/context/NativeAuthContext";

// Icon for catch pin
const MapPinIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

const PolygonIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 19 21 12 17 5 21 12 2"/>
  </svg>
);

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

// --- CONSTANTS ---
const MAX_PINS = 100; // Increased to allow detailed shorelines
const MIN_PINS = 3; // Minimum to form a polygon
const LEASH_DISTANCE_KM = 80.0; // Increased to 80km to support large reservoirs
const ADMIN_EMAIL = "your-email@example.com"; // REPLACE THIS or use env var

// --- LOCAL ICONS ---
const ChevronLeftIcon = ({ size = 24 }) => (
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
    <path d="M15 18l-6-6 6-6" />
  </svg>
);
const UndoIcon = ({ size = 20 }) => (
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
    <path d="M3 7v6h6" />
    <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
  </svg>
);
const TrashIcon = ({ size = 20 }) => (
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
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

// --- GEOMETRY HELPERS ---
function getDistance(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371; // km
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

// Calculate polygon area in acres using Shoelace formula on sphere
function calculateAcres(coords: { lat: number; lng: number }[]): number {
  if (coords.length < 3) return 0;
  const R = 6378137; // Earth's radius in meters
  let area = 0;
  for (let i = 0; i < coords.length; i++) {
    const j = (i + 1) % coords.length;
    const p1 = coords[i];
    const p2 = coords[j];
    area +=
      ((p2.lng * Math.PI) / 180 - (p1.lng * Math.PI) / 180) *
      (2 +
        Math.sin((p1.lat * Math.PI) / 180) +
        Math.sin((p2.lat * Math.PI) / 180));
  }
  area = (Math.abs(area) * R * R) / 2.0;
  return Math.round(area * 0.000247105); // Convert sq meters to acres
}

export function LakeBuilder() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user } = usePlatformUser();
  const { getToken } = usePlatformAuth();
  const nativeAuth = useNativeAuth();

  // Support for catch_upload mode (from CatchLog)
  const mode = state?.mode || "standard"; // "standard" | "catch_upload"
  const isCatchUploadMode = mode === "catch_upload";
  const isKnownLake = state?.knownLake === true; // Skip boundary for known lakes
  const returnTo = state?.returnTo || "/members";

  // Redirect if no state (direct URL access)
  // For catch_upload mode, we allow lat/lng to be 0 (user will drop pin to set anchor)
  useEffect(() => {
    if (!state) {
      navigate("/members");
    } else if (!isCatchUploadMode && (!state.lat || !state.lng)) {
      navigate("/members");
    }
  }, [state, navigate, isCatchUploadMode]);

  const anchorLat = state?.lat || 0;
  const anchorLng = state?.lng || 0;
  const lakeName = state?.suggestedName || "Custom Water";
  const lakeId = state?.lakeId; // Passed from Members.tsx creation

  // State
  const [pins, setPins] = useState<{ lat: number; lng: number }[]>([]);
  const [isLeashWarning, setIsLeashWarning] = useState(false);
  const [saving, setSaving] = useState(false);

  // Catch upload mode state
  const [catchUploadStep, setCatchUploadStep] = useState<"pin" | "boundary">("pin");
  const [catchPinLocation, setCatchPinLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [newLakeName, setNewLakeName] = useState(lakeName);

  // Refs
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const anchorMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const catchPinMarkerRef = useRef<mapboxgl.Marker | null>(null);

  // Admin Check
  const isAdmin = user?.primaryEmailAddress?.emailAddress === ADMIN_EMAIL;

  // --- MAP INIT ---
  useEffect(() => {
    if (!mapContainer.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;
    const m = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      center: [anchorLng, anchorLat],
      zoom: 13, // Zoomed out slightly to accommodate larger leash
      pitch: 0,
      attributionControl: false,
    });

    mapRef.current = m;

    // Add Anchor Marker (Blue Orb)
    const el = document.createElement("div");
    el.className = "orb-anchor";
    new mapboxgl.Marker({ element: el })
      .setLngLat([anchorLng, anchorLat])
      .addTo(m);

    // Click to Add Pin
    m.on("click", (e) => {
      // In catch_upload mode, first click sets catch pin
      if (isCatchUploadMode && catchUploadStep === "pin") {
        setCatchPinLocation({ lat: e.lngLat.lat, lng: e.lngLat.lng });
        return;
      }

      // Leash check (only in standard mode or boundary step)
      if (!isCatchUploadMode || catchUploadStep === "boundary") {
        const checkLat = isCatchUploadMode && catchPinLocation ? catchPinLocation.lat : anchorLat;
        const checkLng = isCatchUploadMode && catchPinLocation ? catchPinLocation.lng : anchorLng;

        const dist = getDistance(
          checkLat,
          checkLng,
          e.lngLat.lat,
          e.lngLat.lng,
        );
        if (dist > LEASH_DISTANCE_KM) {
          setIsLeashWarning(true);
          setTimeout(() => setIsLeashWarning(false), 3000);
          return;
        }

        setPins((prev) => {
          if (prev.length >= MAX_PINS) return prev;
          return [...prev, { lat: e.lngLat.lat, lng: e.lngLat.lng }];
        });
      }
    });

    return () => m.remove();
  }, [anchorLat, anchorLng, isCatchUploadMode]);

  // --- RENDER CATCH PIN (catch_upload mode) ---
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isCatchUploadMode) return;

    // Remove existing catch pin marker
    if (catchPinMarkerRef.current) {
      catchPinMarkerRef.current.remove();
      catchPinMarkerRef.current = null;
    }

    if (!catchPinLocation) return;

    // Create catch pin marker
    const el = document.createElement("div");
    el.className = "catch-pin-marker";
    el.innerHTML = `<svg width="32" height="32" viewBox="0 0 24 24" fill="#4A90E2" stroke="#fff" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3" fill="#fff"/></svg>`;

    catchPinMarkerRef.current = new mapboxgl.Marker({ element: el })
      .setLngLat([catchPinLocation.lng, catchPinLocation.lat])
      .addTo(map);

    // Center map on the pin
    map.flyTo({ center: [catchPinLocation.lng, catchPinLocation.lat], zoom: 14 });
  }, [catchPinLocation, isCatchUploadMode]);

  // --- RENDER PINS & LINES ---
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach((mk) => mk.remove());
    markersRef.current = [];

    // Clear existing line layer
    if (map.getSource("boundary-source")) {
      if (map.getLayer("boundary-line")) map.removeLayer("boundary-line");
      if (map.getLayer("boundary-fill")) map.removeLayer("boundary-fill");
      map.removeSource("boundary-source");
    }

    if (pins.length === 0) return;

    // Draw Line/Polygon
    const coords = pins.map((p) => [p.lng, p.lat]);
    // Close the loop if 3+ points
    if (pins.length >= 3) coords.push(coords[0]);

    map.addSource("boundary-source", {
      type: "geojson",
      data: {
        type: "Feature",
        properties: {},
        geometry: {
          type: "Polygon",
          coordinates: [coords],
        },
      },
    });

    map.addLayer({
      id: "boundary-fill",
      type: "fill",
      source: "boundary-source",
      layout: {},
      paint: {
        "fill-color": "#4A90E2",
        "fill-opacity": 0.2,
      },
    });

    map.addLayer({
      id: "boundary-line",
      type: "line",
      source: "boundary-source",
      layout: {
        "line-join": "round",
        "line-cap": "round",
      },
      paint: {
        "line-color": "#4A90E2",
        "line-width": 3,
        "line-dasharray": [2, 1],
      },
    });

    // Add Pins
    pins.forEach((p, idx) => {
      const el = document.createElement("div");
      el.className = "builder-pin";
      el.innerText = (idx + 1).toString();
      el.onclick = (e) => {
        e.stopPropagation(); // Prevent map click
        // Remove this pin
        setPins((prev) => prev.filter((_, i) => i !== idx));
      };

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([p.lng, p.lat])
        .addTo(map);
      markersRef.current.push(marker);
    });
  }, [pins]);

  // --- ACTIONS ---
  const handleUndo = () => setPins((prev) => prev.slice(0, -1));
  const handleClear = () => setPins([]);

  const handleSave = async () => {
    if (pins.length < MIN_PINS) return;
    setSaving(true);

    // CATCH UPLOAD MODE: Create lake, save geometry, return with coords
    if (isCatchUploadMode) {
      try {
        const acres = calculateAcres(pins);
        const catchLat = catchPinLocation?.lat || pins[0].lat;
        const catchLng = catchPinLocation?.lng || pins[0].lng;

        let newLakeId: string;

        if (isNativePlatform() && nativeAuth.userEmail && nativeAuth.userId) {
          // Create lake via mobile endpoint
          const result = await createCustomLakeMobile(
            nativeAuth.userEmail,
            nativeAuth.userId,
            {
              name: newLakeName,
              lat: catchLat,
              lng: catchLng,
              anchors: pins,
            }
          );
          if (!result.success) throw new Error("Failed to create lake");
          newLakeId = result.lake_id;
          // Save geometry
          await updateCustomLakeGeometryMobile(
            nativeAuth.userEmail,
            nativeAuth.userId,
            newLakeId,
            pins,
            acres
          );
        } else {
          // Web: use Clerk JWT
          const token = await getToken();
          if (!token) throw new Error("No auth token");
          const result = await createCustomLake({
            name: newLakeName,
            lat: catchLat,
            lng: catchLng,
            anchors: pins,
          }, token);
          if (!('lake_id' in result)) throw new Error("Failed to create lake");
          newLakeId = result.lake_id;
          await updateCustomLakeGeometry(newLakeId, pins, token, acres);
        }

        // Return to catch form with all data
        navigate(returnTo, {
          state: {
            fromLakeBuilder: true,
            lakeId: newLakeId,
            lakeName: newLakeName,
            catchLat,
            catchLng,
          },
        });
      } catch (err) {
        console.error("Catch upload save failed:", err);
        alert("Failed to save lake. Please try again.");
      } finally {
        setSaving(false);
      }
      return;
    }

    // ADMIN MODE: Export JSON
    if (isAdmin) {
      const exportData = {
        name: lakeName,
        city: state?.city || "",
        state: state?.state || "",
        latitude: anchorLat,
        longitude: anchorLng,
        acres: 0, // Placeholder
        tier: 3,
        anchors: pins, // The raw array
      };

      console.log("--- ADMIN JSON EXPORT ---");
      console.log(JSON.stringify(exportData, null, 2));

      try {
        await navigator.clipboard.writeText(
          JSON.stringify(exportData, null, 2),
        );
        alert("JSON copied to clipboard! Check console as well.");
      } catch (e) {
        alert("Check console for JSON.");
      }
      setSaving(false);
      return;
    }

    // USER MODE: Save to DB
    if (!lakeId) {
      alert("Error: Missing Lake ID. Cannot save.");
      setSaving(false);
      return;
    }

    try {
      // Calculate acres from polygon
      const acres = calculateAcres(pins);
      console.log("Calculated acres:", acres);

      // Use mobile auth on native platforms, Clerk JWT on web
      if (isNativePlatform() && nativeAuth.userEmail && nativeAuth.userId) {
        console.log("[LakeBuilder] Using mobile auth for geometry save");
        await updateCustomLakeGeometryMobile(
          nativeAuth.userEmail,
          nativeAuth.userId,
          lakeId,
          pins,
          acres
        );
      } else {
        const token = await getToken();
        if (!token) throw new Error("No Auth");
        await updateCustomLakeGeometry(lakeId, pins, token, acres);
      }

      // --- UPDATED NAVIGATION ---
      // Send refresh signal to Members.tsx
      navigate("/members", {
        state: {
          refresh: true,
          lakeId: lakeId,
          timestamp: Date.now(),
        },
      });
    } catch (err) {
      console.error(err);
      alert("Failed to save boundary.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "#000", zIndex: 9999 }}
    >
      {/* HEADER */}
      <div className="builder-header">
        <button onClick={() => navigate(isCatchUploadMode ? "/insights" : "/members")} className="header-btn">
          <ChevronLeftIcon /> Cancel
        </button>
        <div className="header-title">
          <div className="title-label">
            {isCatchUploadMode
              ? isKnownLake
                ? "Mark Catch Location"
                : catchUploadStep === "pin" ? "Step 1 of 2" : "Step 2 of 2"
              : "Outlining"}
          </div>
          <div className="title-name">
            {isCatchUploadMode ? newLakeName : lakeName}
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={pins.length < MIN_PINS || saving}
          className="header-btn save"
          style={{ opacity: pins.length < MIN_PINS ? 0.5 : 1 }}
        >
          {saving ? "Saving..." : isAdmin ? "Export" : "Save"}
        </button>
      </div>

      {/* CATCH UPLOAD PROMPTS */}
      {isCatchUploadMode && (
        <div className="catch-upload-prompt">
          {catchUploadStep === "pin" ? (
            <>
              <div className="prompt-icon"><MapPinIcon size={28} /></div>
              <h3>Drop a Pin</h3>
              <p>Tap the map to mark where you caught this fish</p>
            </>
          ) : (
            <>
              <div className="prompt-icon"><PolygonIcon size={28} /></div>
              <h3>Outline the Lake</h3>
              <p>Tap around the shoreline to draw the boundary</p>
            </>
          )}
        </div>
      )}

      {/* CATCH PIN CONFIRM BUTTON */}
      {isCatchUploadMode && catchUploadStep === "pin" && catchPinLocation && (
        <div className="catch-pin-confirm">
          <button
            className="confirm-pin-btn"
            onClick={() => {
              if (isKnownLake) {
                // Known lake - just return with coordinates, no boundary needed
                navigate(returnTo, {
                  state: {
                    fromLakeBuilder: true,
                    lakeName: newLakeName,
                    catchLat: catchPinLocation.lat,
                    catchLng: catchPinLocation.lng,
                  },
                });
              } else {
                // Unknown lake - proceed to boundary step
                setCatchUploadStep("boundary");
              }
            }}
          >
            Confirm Location
          </button>
        </div>
      )}

      {/* MAP */}
      <div ref={mapContainer} style={{ position: "absolute", inset: 0 }} />

      {/* WARNING TOAST */}
      {isLeashWarning && (
        <div className="leash-warning">Keep outline near the center marker</div>
      )}

      {/* FOOTER CONTROLS - Only show during boundary drawing, not during pin drop */}
      {!(isCatchUploadMode && catchUploadStep === "pin") && (
        <div className={`builder-footer ${isNativePlatform() ? "native-ios" : ""}`}>
          <div className="pin-counter">
            <span style={{ color: pins.length >= MAX_PINS ? "#EF4444" : "#fff" }}>
              {pins.length}
            </span>
            <span style={{ opacity: 0.5 }}>/{MAX_PINS} pts</span>
          </div>

          <div className="footer-actions">
            <button
              onClick={handleUndo}
              disabled={pins.length === 0}
              className="action-btn"
            >
              <UndoIcon /> Undo
            </button>
            <button
              onClick={handleClear}
              disabled={pins.length === 0}
              className="action-btn"
            >
              <TrashIcon /> Clear
            </button>
          </div>
        </div>
      )}

      <style>{`
        .builder-header {
          position: absolute; top: 0; left: 0; right: 0;
          height: calc(60px + env(safe-area-inset-top, 0px));
          padding-top: env(safe-area-inset-top, 0px);
          background: rgba(10, 10, 10, 0.85);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(255,255,255,0.1);
          display: flex; align-items: center; justify-content: space-between;
          padding-left: 16px;
          padding-right: 16px;
          z-index: 10;
        }
        .header-btn {
          background: transparent; border: none; color: #fff;
          font-weight: 600; font-size: 0.95rem;
          display: flex; align-items: center; gap: 6px;
          cursor: pointer;
        }
        .header-btn.save { color: #4A90E2; }
        .header-title { text-align: center; }
        .title-label { font-size: 0.7rem; opacity: 0.6; text-transform: uppercase; letter-spacing: 1px; }
        .title-name { font-weight: 700; font-size: 1rem; }

        .builder-footer {
          position: absolute; bottom: calc(env(safe-area-inset-bottom, 0px) + 30px); left: 50%; transform: translateX(-50%);
          width: 90%; max-width: 400px;
          background: rgba(20, 20, 20, 0.9);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 20px;
          padding: 12px 20px;
          display: flex; align-items: center; justify-content: space-between;
          z-index: 10;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }
        .builder-footer.native-ios {
          bottom: calc(env(safe-area-inset-bottom, 0px) + 10px);
        }
        .pin-counter { font-family: monospace; font-size: 1.1rem; font-weight: 700; }
        .footer-actions { display: flex; gap: 16px; }
        .action-btn {
          background: rgba(255,255,255,0.1); border: none; border-radius: 8px;
          padding: 8px 12px; color: #fff; font-size: 0.85rem;
          display: flex; align-items: center; gap: 6px; cursor: pointer;
        }
        .action-btn:disabled { opacity: 0.3; }

        /* Map Markers */
        .orb-anchor {
          width: 20px; height: 20px;
          background: #4A90E2; border-radius: 50%;
          box-shadow: 0 0 0 4px rgba(74, 144, 226, 0.3);
          animation: anchor-pulse 2s infinite;
        }
        @keyframes anchor-pulse {
          0% { box-shadow: 0 0 0 0 rgba(74, 144, 226, 0.6); }
          70% { box-shadow: 0 0 0 10px rgba(74, 144, 226, 0); }
          100% { box-shadow: 0 0 0 0 rgba(74, 144, 226, 0); }
        }

        .builder-pin {
          width: 24px; height: 24px;
          background: #fff; border: 2px solid #4A90E2;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          color: #4A90E2; font-weight: 800; font-size: 0.75rem;
          cursor: pointer;
          box-shadow: 0 2px 5px rgba(0,0,0,0.3);
          transition: transform 0.1s;
        }
        .builder-pin:active { transform: scale(0.9); }

        .leash-warning {
          position: absolute; top: 80px; left: 50%; transform: translateX(-50%);
          background: rgba(239, 68, 68, 0.9); color: white;
          padding: 8px 16px; border-radius: 20px; font-weight: 600; font-size: 0.9rem;
          z-index: 10; animation: fade-in 0.3s;
        }
        @keyframes fade-in { from { opacity: 0; transform: translate(-50%, -10px); } to { opacity: 1; transform: translate(-50%, 0); } }

        /* Catch Upload Mode Styles */
        .catch-upload-prompt {
          position: absolute;
          top: calc(env(safe-area-inset-top, 0px) + 80px);
          left: 20px;
          right: 20px;
          background: rgba(10, 10, 10, 0.9);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 16px;
          padding: 20px;
          text-align: center;
          z-index: 10;
          color: #fff;
        }
        .catch-upload-prompt .prompt-icon {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: rgba(74, 144, 226, 0.15);
          color: #4A90E2;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 12px;
        }
        .catch-upload-prompt h3 {
          margin: 0 0 6px;
          font-size: 1.1rem;
          font-weight: 700;
        }
        .catch-upload-prompt p {
          margin: 0;
          font-size: 0.9rem;
          opacity: 0.7;
        }

        .catch-pin-confirm {
          position: absolute;
          bottom: calc(env(safe-area-inset-bottom, 0px) + 120px);
          left: 20px;
          right: 20px;
          z-index: 10;
        }
        .confirm-pin-btn {
          width: 100%;
          padding: 16px;
          background: linear-gradient(135deg, #4A90E2 0%, #357ABD 100%);
          border: none;
          border-radius: 14px;
          color: #fff;
          font-weight: 700;
          font-size: 1rem;
          cursor: pointer;
          box-shadow: 0 8px 24px rgba(74, 144, 226, 0.3);
        }

        .catch-pin-marker {
          cursor: pointer;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
        }
      `}</style>
    </div>
  );
}
