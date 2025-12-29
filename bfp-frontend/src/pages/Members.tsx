// src/pages/Members.tsx
// Split modal design - form left, search right - authenticated members

import React, { useState, useRef, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { generateMemberPlan } from "@/lib/api";
import { useMemberStatus } from "@/hooks/useMemberStatus";
import { LocationSearch } from "@/components/LocationSearch";
import { PlanGenerationLoader } from "@/components/PlanGenerationLoader";
import { FishIcon } from "@/components/UnifiedIcons";
import { useNavigate } from "react-router-dom";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

function isWaterFeature(f: mapboxgl.MapboxGeoJSONFeature): boolean {
  return f.source === "composite" && f.sourceLayer === "water";
}

export function Members() {
  const { user } = useUser();
  const { isActive, isLoading: statusLoading } = useMemberStatus();
  const navigate = useNavigate();

  const [showModal, setShowModal] = useState(false);
  const [hoveredWater, setHoveredWater] = useState(false);
  const [waterName, setWaterName] = useState("");
  const [placeholder, setPlaceholder] = useState(
    "Lake Lanier, My secret pond..."
  );
  const [selectedCoords, setSelectedCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const initialized = useRef(false);

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

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/outdoors-v12",
      center: [-86.7816, 33.5186],
      zoom: 6,
    });

    map.current.dragRotate.disable();
    map.current.touchZoomRotate.disableRotation();
    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");
    map.current.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: false,
        showUserLocation: true,
      }),
      "top-right"
    );

    map.current.on("mousemove", (e) => {
      if (!map.current) return;
      const features = map.current.queryRenderedFeatures(e.point);
      const water = features.find(isWaterFeature);
      setHoveredWater(!!water);
      map.current.getCanvas().style.cursor = water ? "pointer" : "";
    });

    map.current.on("click", async (e) => {
      if (!map.current) return;
      const features = map.current.queryRenderedFeatures(e.point);
      const water = features.find(isWaterFeature);

      if (water) {
        const { lng, lat } = e.lngLat;
        setSelectedCoords({ lat, lng });
        setWaterName("");
        setShowModal(true);

        if (marker.current) marker.current.remove();
        marker.current = new mapboxgl.Marker({ color: "#4A90E2" })
          .setLngLat([lng, lat])
          .addTo(map.current);

        try {
          const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}`
          );
          const data = await response.json();

          if (data.features?.[0]?.context) {
            const context = data.features[0].context;
            const city =
              context.find((c: any) => c.id.startsWith("place"))?.text || "";
            const state =
              context
                .find((c: any) => c.id.startsWith("region"))
                ?.short_code?.replace("US-", "") || "";
            setPlaceholder(
              `Water body near ${[city, state].filter(Boolean).join(", ")}`
            );
          }
        } catch (err) {
          console.error("Geocode failed:", err);
        }
      }
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [isActive]);

  function handleSearchSelect(location: {
    name: string;
    latitude: number;
    longitude: number;
  }) {
    setWaterName(location.name);
    setSelectedCoords({ lat: location.latitude, lng: location.longitude });

    if (map.current) {
      map.current.flyTo({
        center: [location.longitude, location.latitude],
        zoom: 13,
        duration: 1500,
      });

      if (marker.current) marker.current.remove();
      marker.current = new mapboxgl.Marker({ color: "#4A90E2" })
        .setLngLat([location.longitude, location.latitude])
        .addTo(map.current);
    }
  }

  async function handleGenerate() {
    if (!user?.primaryEmailAddress?.emailAddress) {
      setErr("Email not found");
      return;
    }
    if (!waterName || !selectedCoords) {
      setErr("Please enter a lake name");
      return;
    }

    setErr(null);
    setLoading(true);

    try {
      const payload = {
        email: user.primaryEmailAddress.emailAddress,
        water: {
          name: waterName,
          lat: selectedCoords.lat,
          lon: selectedCoords.lng,
        },
      };
      const response = await generateMemberPlan(payload);
      navigate("/plan", { state: { planResponse: response } });
    } catch (e: any) {
      setErr(e?.message ?? "Failed to generate plan.");
      setLoading(false);
    }
  }

  if (loading) {
    return <PlanGenerationLoader lakeName={waterName} />;
  }

  if (statusLoading) {
    return (
      <div style={{ padding: 100, textAlign: "center" }}>
        <div>Checking subscription status...</div>
      </div>
    );
  }

  if (!isActive) {
    return (
      <div style={{ padding: 100, textAlign: "center" }}>
        <div
          style={{
            fontSize: "0.85rem",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "#4A90E2",
            marginBottom: 16,
          }}
        >
          Members Only
        </div>
        <h1 style={{ fontSize: "2rem", marginBottom: 16 }}>
          Active subscription required
        </h1>
        <p style={{ marginBottom: 32, opacity: 0.7 }}>
          You need an active subscription to generate full fishing plans.
        </p>
        <a
          href="/subscribe"
          className="btn primary"
          style={{ display: "inline-block", padding: "14px 32px" }}
        >
          Subscribe Now
        </a>
      </div>
    );
  }

  return (
    <div style={{ position: "relative", height: "100vh" }}>
      {/* Header */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 999,
          background:
            "linear-gradient(to bottom, rgba(10,10,10,0.98) 0%, rgba(10,10,10,0.85) 50%, rgba(10,10,10,0.4) 80%, transparent 100%)",
          paddingTop: "100px",
          paddingBottom: "48px",
          paddingLeft: "20px",
          paddingRight: "20px",
          pointerEvents: "none",
        }}
      >
        <div style={{ maxWidth: 600, margin: "0 auto", textAlign: "center" }}>
          <div
            style={{
              fontSize: "0.75rem",
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              color: "#4A90E2",
              marginBottom: 12,
              fontWeight: 600,
            }}
          >
            Members
          </div>
          <h1
            style={{
              fontSize: "clamp(2rem, 5vw, 2.75rem)",
              fontWeight: 800,
              marginBottom: 12,
              letterSpacing: "-0.02em",
              textShadow: "0 2px 12px rgba(0,0,0,0.5)",
            }}
          >
            Find Your Water
          </h1>
          <p
            style={{
              fontSize: "clamp(1rem, 2.5vw, 1.15rem)",
              opacity: 0.9,
              fontWeight: 500,
              textShadow: "0 1px 8px rgba(0,0,0,0.5)",
            }}
          >
            Search or tap any body of water
          </p>
        </div>
      </div>

      {/* Map */}
      <div style={{ width: "100%", height: "100%" }}>
        <style>{`.mapboxgl-ctrl-top-right { top: 200px !important; }`}</style>
        <div ref={mapContainer} style={{ width: "100%", height: "100%" }} />
      </div>

      {/* Thumb Drawer Button */}
      {!showModal && (
        <button
          onClick={() => setShowModal(true)}
          style={{
            position: "fixed",
            bottom: 20,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1000,
            background: "rgba(10, 10, 10, 0.95)",
            backdropFilter: "blur(20px)",
            border: "2px solid rgba(74, 144, 226, 0.4)",
            borderRadius: 12,
            padding: "16px 32px",
            color: "#4A90E2",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontSize: "1.05rem",
            boxShadow: "0 4px 24px rgba(0, 0, 0, 0.3)",
          }}
        >
          <FishIcon size={24} style={{ color: "#4A90E2" }} />
          <span>Find Your Water</span>
        </button>
      )}

      {/* Split Modal */}
      {showModal && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 2000,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              background: "rgba(255, 255, 255, 0.98)",
              borderRadius: 16,
              maxWidth: 1000,
              width: "100%",
              maxHeight: "85vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "24px 24px 16px",
                borderBottom: "1px solid rgba(0,0,0,0.1)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <h2
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: 700,
                    color: "#000",
                    margin: 0,
                  }}
                >
                  Find Your Water
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  style={{
                    background: "transparent",
                    border: "1px solid rgba(0,0,0,0.2)",
                    borderRadius: 6,
                    padding: "6px 16px",
                    color: "#000",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                    fontWeight: 500,
                  }}
                >
                  Close
                </button>
              </div>
            </div>

            {/* Modal Content - Split Layout */}
            <div
              style={{
                display: "grid",
                gridTemplateRows: "1fr 1fr",
                gap: 24,
                padding: 24,
                overflowY: "auto",
                flex: 1,
              }}
            >
              {/* LEFT SIDE - FORM */}
              <div
                style={{ display: "flex", flexDirection: "column", gap: 20 }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      color: "#000",
                      marginBottom: 8,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Lake Name
                  </label>
                  <input
                    value={waterName}
                    onChange={(e) => setWaterName(e.target.value)}
                    placeholder={placeholder}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      background: "#fff",
                      border: "1px solid rgba(0,0,0,0.2)",
                      borderRadius: 8,
                      color: "#000",
                      fontSize: "1rem",
                    }}
                    autoFocus
                  />
                </div>

                {selectedCoords && (
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        color: "#000",
                        marginBottom: 8,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      Coordinates
                    </label>
                    <div
                      style={{
                        fontSize: "0.9rem",
                        color: "#666",
                        fontFamily: "monospace",
                      }}
                    >
                      📍 {selectedCoords.lat.toFixed(4)},{" "}
                      {selectedCoords.lng.toFixed(4)}
                    </div>
                  </div>
                )}

                {user?.primaryEmailAddress?.emailAddress && (
                  <div
                    style={{
                      fontSize: "0.85rem",
                      color: "#666",
                      padding: "12px",
                      background: "rgba(74, 144, 226, 0.1)",
                      borderRadius: 8,
                    }}
                  >
                    ✓ Using your account email:{" "}
                    {user.primaryEmailAddress.emailAddress}
                  </div>
                )}

                {err && (
                  <div
                    style={{
                      padding: "12px",
                      background: "rgba(255,0,0,0.1)",
                      border: "1px solid rgba(255,0,0,0.3)",
                      borderRadius: 8,
                      color: "#c00",
                      fontSize: "0.9rem",
                    }}
                  >
                    ⚠️ {err}
                  </div>
                )}

                <button
                  onClick={handleGenerate}
                  disabled={!waterName || !selectedCoords}
                  className="btn primary"
                  style={{
                    width: "100%",
                    padding: "16px",
                    fontSize: "1.1rem",
                    fontWeight: 600,
                    marginTop: "auto",
                  }}
                >
                  Generate Full Plan
                </button>

                {selectedCoords && (
                  <button
                    onClick={() => {
                      setWaterName("");
                      setSelectedCoords(null);
                      setErr(null);
                      if (marker.current) marker.current.remove();
                    }}
                    style={{
                      width: "100%",
                      padding: "12px",
                      background: "transparent",
                      border: "1px solid rgba(0,0,0,0.2)",
                      borderRadius: 8,
                      color: "#666",
                      cursor: "pointer",
                      fontSize: "0.9rem",
                      marginTop: 8,
                    }}
                  >
                    Clear Selection
                  </button>
                )}
              </div>

              {/* RIGHT SIDE - SEARCH */}
              <div
                style={{
                  borderLeft: "1px solid rgba(0,0,0,0.1)",
                  paddingLeft: 24,
                }}
              >
                <label
                  style={{
                    display: "block",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    color: "#000",
                    marginBottom: 12,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Search for a Lake
                </label>
                <div className="light-search-wrapper">
                  <style>{`
                    .light-search-wrapper input.input {
                      background: #fff !important;
                      border: 1px solid rgba(0,0,0,0.2) !important;
                      color: #000 !important;
                    }
                    .light-search-wrapper .location-results {
                      background: #fff !important;
                      border: 1px solid rgba(0,0,0,0.2) !important;
                      box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important;
                    }
                    .light-search-wrapper .location-result-item {
                      color: #000 !important;
                      border-bottom: 1px solid rgba(0,0,0,0.05) !important;
                    }
                    .light-search-wrapper .location-result-item:hover {
                      background: rgba(74, 144, 226, 0.1) !important;
                    }
                    .light-search-wrapper .location-result-item div {
                      color: #000 !important;
                    }
                    .light-search-wrapper .location-result-item div:last-child {
                      opacity: 0.6 !important;
                    }
                  `}</style>
                  <LocationSearch
                    onSelect={handleSearchSelect}
                    placeholder="Lake Lanier, Lake Fork..."
                  />
                </div>
                <p
                  style={{
                    fontSize: "0.85rem",
                    color: "#666",
                    marginTop: 16,
                    lineHeight: 1.5,
                  }}
                >
                  Search for a lake or close this panel and tap any water body
                  on the map
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
