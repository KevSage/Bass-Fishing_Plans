// src/pages/Members.tsx
// UPDATE: Restored "Find Your Water" Gradient Overlay & Text.

import React, { useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useNavigate } from "react-router-dom";

import { generateMemberPlan, RateLimitError } from "@/lib/api";
import { useMemberStatus } from "@/hooks/useMemberStatus";
import { LocationSearch } from "@/components/LocationSearch";
import { PlanGenerationLoader } from "@/components/PlanGenerationLoader";
import { FishIcon } from "@/components/UnifiedIcons";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const MAX_DAILY_PLANS = 10;
const WARNING_THRESHOLD = 8;

function isWaterFeature(f: mapboxgl.MapboxGeoJSONFeature): boolean {
  return f.source === "composite" && f.sourceLayer === "water";
}

const createOrbMarker = () => {
  const el = document.createElement("div");
  el.className = "orb-marker-map";
  return el;
};

// --- ICONS ---
const BoatIcon = ({ active }: { active: boolean }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke={active ? "#4A90E2" : "currentColor"}
    strokeWidth="2"
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
    strokeWidth="2"
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
    strokeWidth="3"
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
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
    <circle cx="12" cy="10" r="3"></circle>
  </svg>
);
const RadarIcon = ({ size = 20 }: { size?: number }) => (
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
    <path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z" />
    <path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
    <path d="M12 2v2" />
    <path d="M12 22v-2" />
    <path d="M2 12h2" />
    <path d="M22 12h-2" />
  </svg>
);

export function Members() {
  const { user } = useUser();
  const { isActive, isLoading: statusLoading } = useMemberStatus();
  const navigate = useNavigate();

  const [rateLimitInfo, setRateLimitInfo] = useState<{
    message: string;
    secondsRemaining: number;
  } | null>(null);
  const [dailyUsage, setDailyUsage] = useState(0);

  useEffect(() => {
    if (!rateLimitInfo || rateLimitInfo.secondsRemaining <= 0) return;
    const timer = setInterval(() => {
      setRateLimitInfo((prev) => {
        if (!prev || prev.secondsRemaining <= 1) {
          clearInterval(timer);
          return null;
        }
        return { ...prev, secondsRemaining: prev.secondsRemaining - 1 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [rateLimitInfo]);

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const [showModal, setShowModal] = useState(false);
  const [inputMode, setInputMode] = useState<"search" | "manual">("search");
  const [waterName, setWaterName] = useState("");
  const [selectedCoords, setSelectedCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [accessType, setAccessType] = useState<"boat" | "bank">("boat");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const initialized = useRef(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (
      initialized.current ||
      !mapContainer.current ||
      !MAPBOX_TOKEN ||
      !isActive
    )
      return;

    initialized.current = true;
    mapboxgl.accessToken = MAPBOX_TOKEN;

    const m = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/outdoors-v12",
      center: [-86.7816, 33.5186],
      zoom: 6,
      pitch: 0,
      preserveDrawingBuffer: true,
    });

    mapRef.current = m;
    m.dragRotate.disable();
    m.touchZoomRotate.disableRotation();
    m.addControl(new mapboxgl.NavigationControl(), "top-right");
    m.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: false,
        showUserLocation: true,
      }),
      "top-right"
    );

    const onMove = (e: mapboxgl.MapMouseEvent) => {
      if (rafRef.current) return;
      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = null;
        if (!mapRef.current) return;
        try {
          const features = mapRef.current.queryRenderedFeatures(e.point);
          const water = features.find(isWaterFeature);
          const isHovering = !!water;
          mapRef.current.getCanvas().style.cursor = isHovering ? "pointer" : "";
        } catch (err) {
          console.debug("Map interaction error", err);
        }
      });
    };

    const onClick = async (e: mapboxgl.MapMouseEvent) => {
      if (!mapRef.current) return;
      try {
        const features = mapRef.current.queryRenderedFeatures(e.point);
        const water = features.find(isWaterFeature);
        if (!water) return;

        const { lng, lat } = e.lngLat;
        setSelectedCoords({ lat, lng });

        setInputMode("manual");
        setWaterName("");
        setShowModal(true);

        if (markerRef.current) markerRef.current.remove();
        markerRef.current = new mapboxgl.Marker({ element: createOrbMarker() })
          .setLngLat([lng, lat])
          .addTo(mapRef.current);

        try {
          const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}`
          );
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
              `Water near ${[city, state].filter(Boolean).join(", ")}`
            );
          } else {
            setWaterName("Dropped Pin Location");
          }
        } catch (e2) {
          console.error("Geocode failed:", e2);
        }
      } catch (err) {
        console.debug("Click handler error", err);
      }
    };

    m.on("mousemove", onMove);
    m.on("click", onClick);

    m.on("load", () => {
      const params = new URLSearchParams(window.location.search);
      const lat = params.get("lat");
      const lng = params.get("lng");
      const lake = params.get("lake");
      if (lat && lng) {
        const l = parseFloat(lng);
        const lt = parseFloat(lat);
        m.flyTo({ center: [l, lt], zoom: 14, speed: 1.2 });
        if (lake) {
          setInputMode("manual");
          setWaterName(lake);
          setSelectedCoords({ lat: lt, lng: l });
          setShowModal(true);
        }
      }
    });

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      m.off("mousemove", onMove);
      m.off("click", onClick);
      markerRef.current?.remove();
      m.remove();
      mapRef.current = null;
      initialized.current = false;
    };
  }, [isActive]);

  function handleSearchSelect(location: {
    name: string;
    latitude: number;
    longitude: number;
  }) {
    setWaterName(location.name);
    setSelectedCoords({ lat: location.latitude, lng: location.longitude });
    setInputMode("manual");

    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [location.longitude, location.latitude],
        zoom: 10.5,
        duration: 1500,
      });

      if (markerRef.current) markerRef.current.remove();
      markerRef.current = new mapboxgl.Marker({ element: createOrbMarker() })
        .setLngLat([location.longitude, location.latitude])
        .addTo(mapRef.current);
    }
  }

  async function handleGenerate() {
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
      setDailyUsage((prev) => prev + 1);
      navigate("/plan", { state: { planResponse: response } });
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
  }

  const remaining = MAX_DAILY_PLANS - dailyUsage;
  const showUsageWarning = dailyUsage >= WARNING_THRESHOLD && remaining > 0;

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
      {/* --- MAP SURFACE --- */}
      <div style={{ width: "100%", height: "100%" }}>
        <style>{`.mapboxgl-ctrl-top-right { top: 120px !important; }`}</style>
        <div ref={mapContainer} style={{ width: "100%", height: "100%" }} />
      </div>

      {/* --- GUIDANCE OVERLAY (The Fix) --- */}
      {/* Positioned absolute top, fades out, transparent to clicks so map pans */}
      {!showModal && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "40vh",
            maxHeight: "350px",
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 100%)",
            pointerEvents: "none",
            zIndex: 10,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            paddingTop: "100px", // Push below navbar
            textAlign: "center",
            color: "#fff",
          }}
        >
          <div
            style={{
              fontSize: "0.8rem",
              fontWeight: 700,
              letterSpacing: "0.15em",
              color: "#4A90E2",
              textTransform: "uppercase",
              marginBottom: 10,
            }}
          >
            Members
          </div>
          <h1
            style={{
              fontSize: "clamp(2rem, 5vw, 3rem)",
              fontWeight: 800,
              margin: "0 0 8px 0",
              textShadow: "0 4px 20px rgba(0,0,0,0.5)",
            }}
          >
            Find Your Water
          </h1>
          <p
            style={{
              fontSize: "1.1rem",
              opacity: 0.9,
              margin: 0,
              textShadow: "0 2px 10px rgba(0,0,0,0.5)",
            }}
          >
            Search or tap any body of water
          </p>
        </div>
      )}

      {/* FLOATING ACTION BUTTON */}
      {!showModal && (
        <button
          onClick={() => setShowModal(true)}
          className="glass-panel"
          style={{
            position: "fixed",
            bottom: 30,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 40,
            padding: "14px 28px",
            borderRadius: 100,
            color: "#fff",
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontSize: "1rem",
            border: "1px solid rgba(74, 144, 226, 0.4)",
            boxShadow:
              "0 10px 30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)",
            background: "rgba(10, 10, 20, 0.8)",
            backdropFilter: "blur(12px)",
          }}
        >
          <RadarIcon size={20} />
          <span>Scout Water</span>
        </button>
      )}

      {/* COMPACT GLASS MODAL */}
      {showModal && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 2000,
            background: "rgba(0,0,0,0.3)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            className="glass-panel"
            style={{
              borderRadius: 24,
              width: "100%",
              maxWidth: 420,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(10, 10, 15, 0.95)",
              boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                padding: "18px 24px",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h2
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 700,
                  margin: 0,
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <span style={{ color: "#4A90E2" }}>✦</span> Tactical Scout
              </h2>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "rgba(255,255,255,0.5)",
                  cursor: "pointer",
                  fontSize: "1.5rem",
                  padding: "0",
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>

            {/* BODY */}
            <div
              style={{
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                gap: 24,
              }}
            >
              {/* Toggle Section */}
              <div
                style={{
                  background: "rgba(255,255,255,0.05)",
                  borderRadius: "12px",
                  padding: "4px",
                  display: "flex",
                  gap: "4px",
                }}
              >
                <button
                  onClick={() => setInputMode("search")}
                  style={{
                    flex: 1,
                    background:
                      inputMode === "search"
                        ? "rgba(74, 144, 226, 0.2)"
                        : "transparent",
                    color:
                      inputMode === "search" ? "#fff" : "rgba(255,255,255,0.5)",
                    border:
                      inputMode === "search"
                        ? "1px solid rgba(74, 144, 226, 0.5)"
                        : "1px solid transparent",
                    borderRadius: "10px",
                    padding: "10px",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    transition: "all 0.2s ease",
                  }}
                >
                  <SearchIcon /> Database
                </button>
                <button
                  onClick={() => setInputMode("manual")}
                  style={{
                    flex: 1,
                    background:
                      inputMode === "manual"
                        ? "rgba(74, 144, 226, 0.2)"
                        : "transparent",
                    color:
                      inputMode === "manual" ? "#fff" : "rgba(255,255,255,0.5)",
                    border:
                      inputMode === "manual"
                        ? "1px solid rgba(74, 144, 226, 0.5)"
                        : "1px solid transparent",
                    borderRadius: "10px",
                    padding: "10px",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    transition: "all 0.2s ease",
                  }}
                >
                  <PinIcon /> Manual / Map
                </button>
              </div>

              {/* Dynamic Input Section */}
              <div>
                {inputMode === "search" ? (
                  <>
                    <label className="modal-label">Search Verified Lakes</label>
                    <div className="glass-search-wrapper">
                      <style>{`
                        .glass-search-wrapper input {
                           background: rgba(0,0,0,0.3) !important;
                           border: 1px solid rgba(255,255,255,0.1) !important;
                           color: #fff !important;
                           border-radius: 10px !important;
                           padding: 14px !important;
                           font-size: 1rem !important;
                        }
                        .glass-search-wrapper .location-results {
                           background: #1a1a1a !important;
                           border: 1px solid rgba(255,255,255,0.1) !important;
                           z-index: 9999 !important;
                        }
                        .glass-search-wrapper .location-result-item {
                           color: rgba(255,255,255,0.8) !important;
                           border-bottom: 1px solid rgba(255,255,255,0.05) !important;
                           padding: 12px !important;
                        }
                        .glass-search-wrapper .location-result-item:hover {
                           background: rgba(74, 144, 226, 0.15) !important;
                           color: #fff !important;
                        }
                      `}</style>
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
                      className="glass-input modal-input"
                      placeholder="e.g. Lake Lanier, North Arm"
                      style={{
                        width: "100%",
                        padding: "14px",
                        borderRadius: "10px",
                        fontSize: "1rem",
                        background: "rgba(0,0,0,0.3)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: "#fff",
                      }}
                      autoFocus
                      spellCheck={false}
                      autoCorrect="off"
                      autoComplete="off"
                    />
                    <div
                      style={{
                        marginTop: "8px",
                        fontSize: "0.8rem",
                        color: "rgba(255,255,255,0.4)",
                        fontStyle: "italic",
                      }}
                    >
                      Tip: Rename this to match your specific section (e.g.
                      "North Creek Arm") for better precision.
                    </div>
                  </>
                )}
              </div>

              {/* Platform */}
              <div>
                <label className="modal-label">Platform</label>
                <div style={{ display: "flex", gap: 12 }}>
                  <button
                    type="button"
                    onClick={() => setAccessType("boat")}
                    className={`glass-toggle modal-btn ${
                      accessType === "boat" ? "active" : ""
                    }`}
                  >
                    <BoatIcon active={accessType === "boat"} />{" "}
                    <span>Boat</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccessType("bank")}
                    className={`glass-toggle modal-btn ${
                      accessType === "bank" ? "active" : ""
                    }`}
                  >
                    <BankIcon active={accessType === "bank"} />{" "}
                    <span>Bank</span>
                  </button>
                </div>
              </div>

              {/* Coordinates */}
              {selectedCoords && (
                <div
                  style={{
                    padding: "14px",
                    background: "rgba(255,255,255,0.03)",
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.05)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "0.7rem",
                        textTransform: "uppercase",
                        opacity: 0.5,
                        fontWeight: 700,
                        letterSpacing: "0.05em",
                      }}
                    >
                      Confirmed Drop Point
                    </div>
                    <div
                      style={{
                        fontFamily: "monospace",
                        color: "#4A90E2",
                        fontSize: "0.9rem",
                        marginTop: 4,
                      }}
                    >
                      {selectedCoords.lat.toFixed(5)},{" "}
                      {selectedCoords.lng.toFixed(5)}
                    </div>
                  </div>
                  <div style={{ color: "#4ecdc4", fontSize: "1.4rem" }}>✓</div>
                </div>
              )}

              <div style={{ marginTop: "auto" }}>
                {/* 1. COOLDOWN WARNING (API Limit Hit) */}
                {rateLimitInfo && (
                  <div
                    style={{
                      padding: "12px",
                      background: "rgba(255,255,255,0.05)",
                      borderRadius: 10,
                      marginBottom: 12,
                      fontSize: "0.85rem",
                      color: "#ffe66d",
                      textAlign: "center",
                    }}
                  >
                    Cooldown: {formatTime(rateLimitInfo.secondsRemaining)}
                  </div>
                )}

                {/* 2. LOW FUEL WARNING */}
                {!rateLimitInfo && showUsageWarning && (
                  <div
                    style={{
                      padding: "12px 16px",
                      background: "rgba(255, 166, 0, 0.1)",
                      border: "1px solid rgba(255, 166, 0, 0.3)",
                      borderRadius: 10,
                      marginBottom: 16,
                      fontSize: "0.9rem",
                      color: "#ffc107",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <span style={{ fontSize: "1.2rem" }}>⚠️</span>
                    <span>
                      <strong>{remaining} plans remaining</strong> today.
                    </span>
                  </div>
                )}

                <button
                  onClick={handleGenerate}
                  disabled={!!rateLimitInfo || !waterName || !selectedCoords}
                  className="generate-btn"
                  style={{
                    background: rateLimitInfo
                      ? "rgba(255,255,255,0.1)"
                      : "#4A90E2",
                    opacity: !waterName || !selectedCoords ? 0.6 : 1,
                  }}
                >
                  {rateLimitInfo ? "Wait" : "Generate Plan"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STYLES */}
      <style>{`
        .modal-label {
            display: block; 
            font-size: 0.75rem; 
            fontWeight: 700; 
            opacity: 0.6; 
            margin-bottom: 10px; 
            text-transform: uppercase;
            letter-spacing: 0.08em;
        }
        .modal-btn {
            flex: 1;
            padding: 14px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            cursor: pointer;
            font-size: 0.95rem;
            font-weight: 600;
            background: rgba(255,255,255,0.03);
            border: 1px solid rgba(255,255,255,0.08);
            color: rgba(255,255,255,0.6);
            transition: all 0.2s ease;
        }
        .modal-btn.active {
            background: rgba(74, 144, 226, 0.15);
            border-color: rgba(74, 144, 226, 0.5);
            color: #fff;
        }
        .generate-btn {
            width: 100%;
            padding: 18px;
            color: #fff;
            border: none;
            border-radius: 14px;
            font-weight: 700;
            font-size: 1.05rem;
            cursor: pointer;
            box-shadow: 0 4px 20px rgba(74, 144, 226, 0.3);
            transition: all 0.2s ease;
        }
        .generate-btn:active {
            transform: scale(0.98);
        }
        .orb-marker-map {
          width: 24px;
          height: 24px;
          background: #4A90E2;
          border-radius: 50%;
          box-shadow: 0 0 12px rgba(74,144,226,0.8);
          border: 2px solid rgba(255,255,255,0.8);
          position: relative;
        }
        .orb-marker-map::after {
          content: '';
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: 100%; height: 100%;
          border-radius: 50%;
          border: 2px solid rgba(74,144,226,0.5);
          animation: map-orb-pulse 2s infinite ease-out;
        }
        @keyframes map-orb-pulse {
          0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0.8; }
          100% { transform: translate(-50%, -50%) scale(2.5); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
