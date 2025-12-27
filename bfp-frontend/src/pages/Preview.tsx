// src/pages/Preview.tsx
// Streamlined UX - modal on water click

import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, useUser } from "@clerk/clerk-react";
import { generatePlan, RateLimitError } from "@/lib/api";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { LocationSearch } from "@/components/LocationSearch";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

function isWaterFeature(f: mapboxgl.MapboxGeoJSONFeature): boolean {
  return f.source === "composite" && f.sourceLayer === "water";
}

export function PreviewEnhanced() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const initialized = useRef(false);
  const navigate = useNavigate();

  // Clerk auth
  const { isSignedIn } = useAuth();
  const { user } = useUser();

  const [showSearch, setShowSearch] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [hoveredWater, setHoveredWater] = useState(false);

  // Modal form state
  const [waterName, setWaterName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedCoords, setSelectedCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Auto-fill email for signed-in users
  useEffect(() => {
    if (isSignedIn && user?.primaryEmailAddress?.emailAddress) {
      setEmail(user.primaryEmailAddress.emailAddress);
    }
  }, [isSignedIn, user?.primaryEmailAddress?.emailAddress]); // ✅ Only depends on specific property

  // Initialize map
  useEffect(() => {
    if (initialized.current || !mapContainer.current || !MAPBOX_TOKEN) return;
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

    // Hover detection
    map.current.on("mousemove", (e) => {
      if (!map.current) return;
      const features = map.current.queryRenderedFeatures(e.point);
      const hasWater = features.some(isWaterFeature);
      setHoveredWater(hasWater);
      map.current.getCanvas().style.cursor = hasWater ? "pointer" : "";
    });

    // Click water → show modal
    map.current.on("click", async (e) => {
      if (!map.current) return;

      const features = map.current.queryRenderedFeatures(e.point);
      const waterFeature = features.find(isWaterFeature);

      if (waterFeature) {
        const { lng, lat } = e.lngLat;
        setSelectedCoords({ lat, lng });

        // Get suggested name from reverse geocoding
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
            setWaterName(
              `Water body near ${[city, state].filter(Boolean).join(", ")}`
            );
          }
        } catch (err) {
          console.error("Geocode failed:", err);
          setWaterName("My fishing spot");
        }

        setShowModal(true);
      }
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Handle search selection
  function handleSearchSelect(location: {
    latitude: number;
    longitude: number;
    name: string;
  }) {
    if (map.current) {
      map.current.flyTo({
        center: [location.longitude, location.latitude],
        zoom: 13,
        duration: 1500,
      });
    }
    setShowSearch(false);
  }

  // Generate plan
  async function handleGeneratePlan() {
    if (!selectedCoords || !waterName || !email) {
      setErr("Please fill in all fields");
      return;
    }

    setErr(null);
    setLoading(true);

    try {
      const res = await generatePlan({
        email,
        latitude: selectedCoords.lat,
        longitude: selectedCoords.lng,
        location_name: waterName,
      });

      navigate("/plan", { state: { planResponse: res } });
    } catch (e: any) {
      setErr(e?.message ?? "Failed to generate plan.");
      setLoading(false);
    }
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
            "linear-gradient(to bottom, rgba(10,10,10,0.95) 0%, transparent 100%)",
          padding: "20px",
          pointerEvents: "none",
        }}
      >
        <div style={{ maxWidth: 600, margin: "0 auto", textAlign: "center" }}>
          <h1
            style={{
              fontSize: "clamp(1.5rem, 4vw, 2rem)",
              fontWeight: 700,
              marginBottom: 8,
            }}
          >
            Find Your Water
          </h1>
          <p style={{ fontSize: "clamp(0.9rem, 2vw, 1rem)", opacity: 0.8 }}>
            Click any body of water to generate your fishing plan
          </p>
        </div>
      </div>

      {/* Search Toggle */}
      {!showSearch && !showModal && (
        <button
          onClick={() => setShowSearch(true)}
          style={{
            position: "absolute",
            top: 120,
            left: 20,
            zIndex: 1000,
            background: "rgba(10, 10, 10, 0.95)",
            backdropFilter: "blur(20px)",
            border: "2px solid rgba(74, 144, 226, 0.4)",
            borderRadius: 12,
            padding: "12px 20px",
            color: "#4A90E2",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span>🔍</span>
          <span>Search Lakes</span>
        </button>
      )}

      {/* Search Panel */}
      {showSearch && (
        <div
          style={{
            position: "absolute",
            top: 120,
            left: 20,
            zIndex: 1000,
            maxWidth: 380,
            width: "calc(100% - 40px)",
          }}
        >
          <div
            className="card"
            style={{
              background: "rgba(10, 10, 10, 0.95)",
              backdropFilter: "blur(20px)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <div className="label">Search for a lake</div>
              <button
                onClick={() => setShowSearch(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "rgba(255,255,255,0.6)",
                  fontSize: "1.5em",
                  cursor: "pointer",
                  padding: 0,
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>
            <LocationSearch
              onSelect={handleSearchSelect}
              placeholder="Lake Lanier, Lake Fork..."
            />
          </div>
        </div>
      )}

      {/* Water Selection Modal */}
      {showModal && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.8)",
            zIndex: 2000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            className="card"
            style={{
              background: "rgba(10, 10, 10, 0.98)",
              backdropFilter: "blur(20px)",
              maxWidth: 450,
              width: "100%",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              style={{ fontSize: "1.5em", fontWeight: 700, marginBottom: 20 }}
            >
              Name This Water
            </h2>

            <div style={{ marginBottom: 16 }}>
              <div className="label">What do you call this fishing spot?</div>
              <input
                className="input"
                value={waterName}
                onChange={(e) => setWaterName(e.target.value)}
                placeholder="Lake Lanier, My secret pond..."
                autoFocus
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <div className="label">Email</div>
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                readOnly={isSignedIn}
                style={
                  isSignedIn
                    ? {
                        opacity: 0.7,
                        cursor: "not-allowed",
                        background: "rgba(255,255,255,0.05)",
                      }
                    : {}
                }
              />
              {isSignedIn && (
                <div style={{ fontSize: "0.85em", opacity: 0.6, marginTop: 6 }}>
                  ✓ Using your account email
                </div>
              )}
            </div>

            {err && (
              <div
                style={{
                  marginBottom: 16,
                  color: "rgba(255,160,160,0.95)",
                  fontSize: "0.9em",
                }}
              >
                ⚠️ {err}
              </div>
            )}

            <button
              className="btn primary"
              style={{ width: "100%", marginBottom: 12 }}
              disabled={!waterName || !email || loading}
              onClick={handleGeneratePlan}
            >
              {loading ? "Generating…" : "Generate Fishing Plan"}
            </button>

            <button
              onClick={() => setShowModal(false)}
              style={{
                width: "100%",
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: 8,
                padding: "12px",
                color: "rgba(255,255,255,0.7)",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Map */}
      <div style={{ width: "100%", height: "100%" }}>
        <style>{`
          .mapboxgl-ctrl-top-right {
            top: 90px !important;
          }
        `}</style>
        <div ref={mapContainer} style={{ width: "100%", height: "100%" }} />

        {hoveredWater && !showModal && (
          <div
            style={{
              position: "absolute",
              bottom: "120px",
              left: "50%",
              transform: "translateX(-50%)",
              background: "rgba(10, 10, 10, 0.95)",
              padding: "12px 20px",
              borderRadius: 8,
              border: "2px solid rgba(74, 144, 226, 0.5)",
              textAlign: "center",
              pointerEvents: "none",
              zIndex: 998,
              fontSize: "0.9em",
              color: "#4A90E2",
            }}
          >
            Click to select this water body
          </div>
        )}
      </div>
    </div>
  );
}
