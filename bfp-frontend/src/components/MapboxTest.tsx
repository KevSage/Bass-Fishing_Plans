// src/components/MapTest.tsx
import React, { useRef, useEffect } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

export function MapTest() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) {
      console.log("Already initialized, skipping...");
      return;
    }

    console.log("=== FIRST TIME INIT ===");

    if (!MAPBOX_TOKEN || !mapContainer.current) return;

    initialized.current = true;
    mapboxgl.accessToken = MAPBOX_TOKEN;

    console.log("Creating map NOW...");

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [-74.5, 40],
      zoom: 9,
    });

    map.current.on("load", () => {
      console.log("🎉🎉🎉 MAP IS LOADED! 🎉🎉🎉");
    });

    return () => {
      console.log("Component unmounting, cleaning up...");
      map.current?.remove();
    };
  }, []);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        position: "fixed",
        top: 0,
        left: 0,
      }}
    >
      <div ref={mapContainer} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
