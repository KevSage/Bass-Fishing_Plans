// src/components/WaterBodyMap.tsx
// Simple: Fly to location, click water to select

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

type WaterBodyMapProps = {
  onSelect: (waterBody: WaterBody) => void;
  flyToLocation?: { latitude: number; longitude: number; name: string } | null;
  selectedWaterBody?: WaterBody | null;
  initialCenter?: [number, number];
  initialZoom?: number;
};

function isWaterFeature(f: mapboxgl.MapboxGeoJSONFeature): boolean {
  return f.source === "composite" && f.sourceLayer === "water";
}

export function WaterBodyMapEnhanced({
  onSelect,
  flyToLocation = null,
  selectedWaterBody = null,
  initialCenter = [-86.7816, 33.5186],
  initialZoom = 6,
}: WaterBodyMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const initialized = useRef(false);
  const [hoveredWater, setHoveredWater] = useState(false);
  const markerRef = useRef<mapboxgl.Marker | null>(null);

  // Initialize map once
  useEffect(() => {
    if (initialized.current || !mapContainer.current || !MAPBOX_TOKEN) return;
    initialized.current = true;
    mapboxgl.accessToken = MAPBOX_TOKEN;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/outdoors-v12",
      center: initialCenter,
      zoom: initialZoom,
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

    // Hover to detect water
    map.current.on("mousemove", (e) => {
      if (!map.current) return;

      const features = map.current.queryRenderedFeatures(e.point);
      const hasWater = features.some(isWaterFeature);

      setHoveredWater(hasWater);
      map.current.getCanvas().style.cursor = hasWater ? "pointer" : "";
    });

    // Click to select
    map.current.on("click", async (e) => {
      if (!map.current) return;

      const features = map.current.queryRenderedFeatures(e.point);
      const waterFeature = features.find(isWaterFeature);

      if (waterFeature) {
        const { lng, lat } = e.lngLat;

        // Reverse geocode
        try {
          const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?` +
              `access_token=${MAPBOX_TOKEN}`
          );
          const data = await response.json();

          let city = "",
            state = "";
          if (data.features?.[0]?.context) {
            const context = data.features[0].context;
            city =
              context.find((c: any) => c.id.startsWith("place"))?.text || "";
            state =
              context
                .find((c: any) => c.id.startsWith("region"))
                ?.short_code?.replace("US-", "") || "";
          }

          onSelect({
            name: `Water body near ${[city, state].filter(Boolean).join(", ")}`,
            city,
            state,
            latitude: lat,
            longitude: lng,
          });

          // Add marker
          if (markerRef.current) markerRef.current.remove();

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
        } catch (err) {
          console.error("Geocode failed:", err);
        }
      }
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Fly to location when search selects something
  useEffect(() => {
    if (!flyToLocation || !map.current?.loaded()) return;

    map.current.flyTo({
      center: [flyToLocation.longitude, flyToLocation.latitude],
      zoom: 13,
      duration: 1500,
    });
  }, [flyToLocation]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <style>{`
        .mapboxgl-ctrl-top-right {
          top: 90px !important;
        }
      `}</style>
      <div ref={mapContainer} style={{ width: "100%", height: "100%" }} />

      {hoveredWater && !selectedWaterBody && (
        <div
          style={{
            position: "absolute",
            bottom: 32,
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
  );
}
