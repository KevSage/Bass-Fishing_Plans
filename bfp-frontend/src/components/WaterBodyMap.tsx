// src/components/WaterBodyMapEnhanced.tsx
// Enhanced map with soft-lock, outline highlighting, search, and lake info
// FIXED: Better guards against double mounting

import React, { useRef, useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

type WaterBody = {
  name: string;
  city?: string;
  state?: string;
  latitude: number;
  longitude: number;
};

type WaterBodyMapEnhancedProps = {
  onSelect: (waterBody: WaterBody) => void;
  searchQuery?: string;
  selectedWaterBody?: WaterBody | null;
  initialCenter?: [number, number];
  initialZoom?: number;
};

export function WaterBodyMapEnhanced({
  onSelect,
  searchQuery = "",
  selectedWaterBody = null,
  initialCenter = [-86.7816, 33.5186],
  initialZoom = 6,
}: WaterBodyMapEnhancedProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const initialized = useRef(false);
  const [softLockedWater, setSoftLockedWater] = useState<WaterBody | null>(
    null
  );
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const hoverLayerId = useRef<string | null>(null);

  // Initialize map - ONLY ONCE
  useEffect(() => {
    // Multiple guards to prevent double initialization
    if (initialized.current) {
      console.log("Map already initialized, skipping...");
      return;
    }

    if (!MAPBOX_TOKEN) {
      console.error("Missing Mapbox token");
      return;
    }

    if (!mapContainer.current) {
      console.error("Missing map container");
      return;
    }

    // Check if map already exists
    if (map.current) {
      console.log("Map instance already exists, skipping...");
      return;
    }

    console.log("✓ Initializing map (first time only)");
    initialized.current = true;
    mapboxgl.accessToken = MAPBOX_TOKEN;

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/outdoors-v12",
        center: initialCenter,
        zoom: initialZoom,
      });

      // Add controls
      map.current.addControl(new mapboxgl.NavigationControl(), "top-right");
      map.current.addControl(
        new mapboxgl.GeolocateControl({
          positionOptions: { enableHighAccuracy: true },
          trackUserLocation: true,
        }),
        "top-right"
      );

      map.current.on("load", () => {
        if (!map.current) return;
        console.log("✓ Map loaded successfully");

        // Hover behavior - soft-lock
        map.current.on("mousemove", async (e) => {
          const features = map.current!.queryRenderedFeatures(e.point, {
            layers: ["water", "waterway"],
          });

          if (features.length > 0 && features[0].geometry.type === "Polygon") {
            const { lng, lat } = e.lngLat;
            await handleWaterHover(lng, lat, features[0]);
            map.current!.getCanvas().style.cursor = "pointer";
          } else {
            // Clear soft-lock
            setSoftLockedWater(null);
            map.current!.getCanvas().style.cursor = "";

            // Remove outline
            if (
              hoverLayerId.current &&
              map.current!.getLayer(hoverLayerId.current)
            ) {
              map.current!.removeLayer(hoverLayerId.current);
              map.current!.removeSource(hoverLayerId.current);
              hoverLayerId.current = null;
            }
          }
        });

        // Click to select
        map.current.on("click", async (e) => {
          const features = map.current!.queryRenderedFeatures(e.point, {
            layers: ["water", "waterway"],
          });

          if (features.length > 0) {
            const { lng, lat } = e.lngLat;
            await handleWaterClick(lng, lat);
          }
        });
      });
    } catch (error) {
      console.error("Failed to initialize map:", error);
      initialized.current = false; // Allow retry on error
    }

    return () => {
      console.log("Cleaning up map...");
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []); // Empty deps - runs only once

  // Handle search query
  useEffect(() => {
    if (!map.current || !searchQuery || searchQuery.length < 3) return;

    const searchDebounce = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
            searchQuery
          )}.json?` + `types=poi,place&access_token=${MAPBOX_TOKEN}&country=US`
        );
        const data = await response.json();

        if (data.features && data.features.length > 0) {
          const feature = data.features[0];
          const [lng, lat] = feature.center;

          map.current?.flyTo({
            center: [lng, lat],
            zoom: 12,
            duration: 1500,
          });
        }
      } catch (error) {
        console.error("Search failed:", error);
      }
    }, 500);

    return () => clearTimeout(searchDebounce);
  }, [searchQuery]);

  async function handleWaterHover(lng: number, lat: number, feature: any) {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?` +
          `types=poi,place&access_token=${MAPBOX_TOKEN}`
      );
      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const f = data.features[0];
        const context = f.context || [];
        const city = context.find((c: any) => c.id.startsWith("place"))?.text;
        const state = context
          .find((c: any) => c.id.startsWith("region"))
          ?.short_code?.replace("US-", "");

        setSoftLockedWater({
          name: f.text || "Water Body",
          city,
          state,
          latitude: lat,
          longitude: lng,
        });

        // Add blue outline to hovered water body
        if (feature.geometry && map.current) {
          // Remove previous outline
          if (
            hoverLayerId.current &&
            map.current.getLayer(hoverLayerId.current)
          ) {
            map.current.removeLayer(hoverLayerId.current);
            map.current.removeSource(hoverLayerId.current);
          }

          const layerId = "hover-outline-" + Date.now();
          hoverLayerId.current = layerId;

          map.current.addSource(layerId, {
            type: "geojson",
            data: {
              type: "Feature",
              geometry: feature.geometry,
              properties: {},
            },
          });

          map.current.addLayer({
            id: layerId,
            type: "line",
            source: layerId,
            paint: {
              "line-color": "#4A90E2",
              "line-width": 3,
              "line-opacity": 0.8,
            },
          });
        }
      }
    } catch (error) {
      console.error("Hover geocode failed:", error);
    }
  }

  async function handleWaterClick(lng: number, lat: number) {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?` +
          `types=poi,place&access_token=${MAPBOX_TOKEN}`
      );
      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        const context = feature.context || [];
        const city = context.find((c: any) => c.id.startsWith("place"))?.text;
        const state = context
          .find((c: any) => c.id.startsWith("region"))
          ?.short_code?.replace("US-", "");

        const waterBody: WaterBody = {
          name: feature.text || "Selected Water Body",
          city,
          state,
          latitude: lat,
          longitude: lng,
        };

        onSelect(waterBody);

        // Add permanent marker
        if (markerRef.current) {
          markerRef.current.remove();
        }

        const el = document.createElement("div");
        el.style.width = "32px";
        el.style.height = "32px";
        el.style.borderRadius = "50%";
        el.style.border = "4px solid #4A90E2";
        el.style.background = "#4A90E2";
        el.style.boxShadow = "0 0 20px rgba(74, 144, 226, 0.6)";

        markerRef.current = new mapboxgl.Marker(el)
          .setLngLat([lng, lat])
          .addTo(map.current!);
      }
    } catch (error) {
      console.error("Click geocode failed:", error);
    }
  }

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div ref={mapContainer} style={{ width: "100%", height: "100%" }} />

      {/* Soft-lock Overlay - Bottom Center */}
      {softLockedWater && !selectedWaterBody && (
        <div
          style={{
            position: "absolute",
            bottom: 32,
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(10, 10, 10, 0.95)",
            backdropFilter: "blur(20px)",
            padding: "16px 24px",
            borderRadius: 12,
            border: "2px solid rgba(74, 144, 226, 0.5)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
            minWidth: 280,
            maxWidth: 400,
            textAlign: "center",
            pointerEvents: "none",
            zIndex: 998,
            animation: "fadeIn 0.2s ease",
          }}
        >
          <div
            style={{
              fontSize: "1.1em",
              fontWeight: 600,
              color: "#4A90E2",
              marginBottom: 4,
              textShadow: "0 1px 2px rgba(0,0,0,0.5)",
            }}
          >
            {softLockedWater.name}
          </div>
          {(softLockedWater.city || softLockedWater.state) && (
            <div
              style={{
                fontSize: "0.9em",
                opacity: 0.7,
                marginBottom: 8,
              }}
            >
              📍{" "}
              {[softLockedWater.city, softLockedWater.state]
                .filter(Boolean)
                .join(", ")}
            </div>
          )}
          <div
            style={{
              fontSize: "0.85em",
              opacity: 0.5,
              borderTop: "1px solid rgba(255,255,255,0.1)",
              paddingTop: 8,
              marginTop: 8,
            }}
          >
            Click to select
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(-50%) translateY(10px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  );
}
