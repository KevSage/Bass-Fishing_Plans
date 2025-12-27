import React, { useState, useRef, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { generateMemberPlan } from "@/lib/api";
import { useMemberStatus } from "@/hooks/useMemberStatus";
import { LocationSearch } from "@/components/LocationSearch";
import type { PlanGenerateResponse } from "@/features/plan/types";
import { PlanDownloads } from "@/features/plan/PlanDownloads";
import { PlanScreen } from "@/features/plan/PlanScreen";
import { useNavigate } from "react-router-dom";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

function isWaterFeature(f: mapboxgl.MapboxGeoJSONFeature): boolean {
  return f.source === "composite" && f.sourceLayer === "water";
}

export function Members() {
  const { user } = useUser();
  const { isActive, isLoading: statusLoading } = useMemberStatus();
  const navigate = useNavigate();

  const [selectedCoords, setSelectedCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [waterName, setWaterName] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [hoveredWater, setHoveredWater] = useState(false);

  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const initialized = useRef(false);

  // Initialize map - runs when subscription status changes
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

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    // Add geolocate control (Find My Location)
    const geolocate = new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true,
      },
      trackUserLocation: false,
      showUserHeading: false,
      showUserLocation: true,
    });
    map.current.addControl(geolocate, "top-right");

    // Hover detection
    map.current.on("mousemove", (e) => {
      if (!map.current) return;
      const features = map.current.queryRenderedFeatures(e.point);
      const water = features.find(isWaterFeature);
      setHoveredWater(!!water);
      map.current.getCanvas().style.cursor = water ? "pointer" : "";
    });

    // Click water to select
    map.current.on("click", (e) => {
      if (!map.current) return;
      const features = map.current.queryRenderedFeatures(e.point);
      const water = features.find(isWaterFeature);

      if (water) {
        const { lng, lat } = e.lngLat;
        setSelectedCoords({ lat, lng });
        if (!waterName) {
          setWaterName("Selected Water Body");
        }

        // Update marker
        if (marker.current) {
          marker.current.remove();
        }
        marker.current = new mapboxgl.Marker({ color: "#4A90E2" })
          .setLngLat([lng, lat])
          .addTo(map.current);
      }
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [isActive]); // Re-run when subscription status changes

  // Handle search selection
  function handleSearchSelect(location: {
    name: string;
    latitude: number;
    longitude: number;
  }) {
    setWaterName(location.name);
    setSelectedCoords({ lat: location.latitude, lng: location.longitude });
    setShowSearch(false);

    // Update map
    if (map.current) {
      map.current.flyTo({
        center: [location.longitude, location.latitude],
        zoom: 11,
        duration: 1500,
      });

      // Update marker
      if (marker.current) {
        marker.current.remove();
      }
      marker.current = new mapboxgl.Marker({ color: "#4A90E2" })
        .setLngLat([location.longitude, location.latitude])
        .addTo(map.current);
    }
  }

  // Generate plan
  async function handleGenerate() {
    if (!user?.primaryEmailAddress?.emailAddress) {
      alert("Email not found");
      return;
    }
    if (!waterName || !selectedCoords) {
      alert("Please select a lake");
      return;
    }

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

      // Navigate to plan page with response
      navigate("/plan", { state: { planResponse: response } });
    } catch (e: any) {
      alert(e?.message ?? "Failed to generate plan.");
    }
  }

  // Loading state
  if (statusLoading) {
    return (
      <div style={{ padding: 100, textAlign: "center" }}>
        <div>Checking subscription status...</div>
      </div>
    );
  }

  // Not subscribed
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

  const canGenerate = Boolean(waterName && selectedCoords);

  return (
    <div style={{ position: "relative", height: "100vh" }}>
      {/* Custom CSS for repositioning map controls */}
      <style>{`
        /* Reposition navigation controls higher */
        .mapboxgl-ctrl-top-right {
          top: 140px !important;
          right: 10px !important;
        }
        
        /* Style the controls */
        .mapboxgl-ctrl-group {
          background: rgba(10, 10, 10, 0.95) !important;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
        }
        
        .mapboxgl-ctrl-group button {
          background: transparent !important;
          border-color: rgba(255, 255, 255, 0.1) !important;
        }
        
        .mapboxgl-ctrl-group button:hover {
          background: rgba(74, 144, 226, 0.1) !important;
        }
        
        .mapboxgl-ctrl-icon {
          filter: invert(1);
        }
      `}</style>

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
          <div
            style={{
              fontSize: "0.8rem",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              color: "#4A90E2",
              marginBottom: 8,
            }}
          >
            Members
          </div>
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

      {/* Search Button */}
      {!showSearch && (
        <button
          onClick={() => setShowSearch(true)}
          style={{
            position: "absolute",
            top: 140,
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
            top: 140,
            left: 20,
            zIndex: 1000,
            maxWidth: 380,
            width: "calc(100% - 40px)",
          }}
        >
          <div
            style={{
              background: "rgba(10, 10, 10, 0.98)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: 16,
              padding: 20,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <h3 style={{ margin: 0, fontSize: "1.1rem" }}>
                Search for a Lake
              </h3>
              <button
                onClick={() => setShowSearch(false)}
                style={{
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: 6,
                  padding: "6px 12px",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
            <LocationSearch
              onSelect={handleSearchSelect}
              placeholder="Lake Lanier, Lake Fork..."
            />
          </div>
        </div>
      )}

      {/* Map */}
      <div
        ref={mapContainer}
        style={{
          position: "absolute",
          inset: 0,
          cursor: hoveredWater ? "pointer" : "default",
        }}
      />

      {/* Bottom Panel - Only show when lake is selected */}
      {(selectedCoords || waterName) && (
        <div
          style={{
            position: "absolute",
            bottom: 60, // Higher on screen for better visibility
            left: 0,
            right: 0,
            zIndex: 1000,
            pointerEvents: "none", // Allow clicks to pass through to map
          }}
        >
          <div
            style={{
              maxWidth: 600,
              margin: "0 auto",
              padding: "0 20px",
            }}
          >
            <div
              style={{
                background: "rgba(10, 10, 10, 0.92)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                borderRadius: 16,
                padding: 24,
                pointerEvents: "auto", // Re-enable clicks on the form itself
                boxShadow: "0 -4px 24px rgba(0, 0, 0, 0.4)",
              }}
            >
              {/* Selected Lake */}
              <div style={{ marginBottom: 16 }}>
                <div
                  style={{
                    fontSize: "0.75rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    opacity: 0.6,
                    marginBottom: 8,
                  }}
                >
                  Selected Lake
                </div>
                <div style={{ fontSize: "1.25rem", fontWeight: 600 }}>
                  {waterName || (
                    <span style={{ opacity: 0.4 }}>No lake selected</span>
                  )}
                </div>
                {selectedCoords && (
                  <div
                    style={{ fontSize: "0.85rem", opacity: 0.5, marginTop: 4 }}
                  >
                    {selectedCoords.lat.toFixed(4)},{" "}
                    {selectedCoords.lng.toFixed(4)}
                  </div>
                )}
              </div>

              {/* Lake Name Input */}
              <div style={{ marginBottom: 16 }}>
                <div
                  style={{
                    fontSize: "0.75rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    opacity: 0.6,
                    marginBottom: 8,
                  }}
                >
                  Lake Name
                </div>
                <input
                  type="text"
                  className="input"
                  value={waterName}
                  onChange={(e) => setWaterName(e.target.value)}
                  placeholder="Enter lake name"
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8,
                    color: "#fff",
                    fontSize: "1rem",
                  }}
                />
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={!canGenerate}
                className="btn primary"
                style={{
                  width: "100%",
                  padding: "16px",
                  fontSize: "1.1rem",
                  fontWeight: 600,
                  opacity: canGenerate ? 1 : 0.4,
                  cursor: canGenerate ? "pointer" : "not-allowed",
                }}
              >
                Generate Full Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
