// MapboxDebug.tsx
// Simplified test to debug Mapbox loading

import React, { useRef, useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

export function MapboxDebug() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [error, setError] = useState<string>("");
  const [status, setStatus] = useState<string>("Initializing...");

  useEffect(() => {
    // Debug logging
    console.log("=== MAPBOX DEBUG ===");
    console.log("Token exists:", !!MAPBOX_TOKEN);
    console.log("Token starts with pk.:", MAPBOX_TOKEN?.startsWith("pk."));
    console.log("Token length:", MAPBOX_TOKEN?.length);
    console.log("mapboxgl loaded:", !!mapboxgl);
    console.log("Container ref:", !!mapContainer.current);

    if (!MAPBOX_TOKEN) {
      setError("VITE_MAPBOX_TOKEN not found in environment");
      setStatus("Error: No token");
      return;
    }

    if (!MAPBOX_TOKEN.startsWith("pk.")) {
      setError('Token should start with "pk."');
      setStatus("Error: Invalid token format");
      return;
    }

    if (!mapContainer.current) {
      setError("Map container not found");
      setStatus("Error: No container");
      return;
    }

    if (map.current) return; // Already initialized

    try {
      setStatus("Setting access token...");
      mapboxgl.accessToken = MAPBOX_TOKEN;

      setStatus("Creating map...");
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/outdoors-v12",
        center: [-86.7816, 33.5186], // Alabama
        zoom: 6,
      });

      map.current.on("load", () => {
        console.log("Map loaded successfully!");
        setStatus("Map loaded! ✓");
      });

      map.current.on("error", (e) => {
        console.error("Map error:", e);
        setError(`Map error: ${e.error.message}`);
        setStatus("Error loading map");
      });
    } catch (err: any) {
      console.error("Failed to create map:", err);
      setError(err.message);
      setStatus("Error: " + err.message);
    }

    return () => {
      map.current?.remove();
    };
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>Mapbox Debug Test</h2>

      {/* Status */}
      <div
        style={{
          padding: 12,
          marginBottom: 16,
          background: error ? "#ff6b6b22" : "#4ecdc422",
          border: `1px solid ${error ? "#ff6b6b" : "#4ecdc4"}`,
          borderRadius: 8,
        }}
      >
        <strong>Status:</strong> {status}
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            padding: 12,
            marginBottom: 16,
            background: "#ff6b6b22",
            border: "1px solid #ff6b6b",
            borderRadius: 8,
            color: "#ff6b6b",
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Debug Info */}
      <div
        style={{
          padding: 12,
          marginBottom: 16,
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 8,
          fontFamily: "monospace",
          fontSize: "0.9em",
        }}
      >
        <div>Token loaded: {MAPBOX_TOKEN ? "✓" : "✗"}</div>
        <div>Token format: {MAPBOX_TOKEN?.startsWith("pk.") ? "✓" : "✗"}</div>
        <div>Token length: {MAPBOX_TOKEN?.length || 0} chars</div>
        <div>mapboxgl: {typeof mapboxgl !== "undefined" ? "✓" : "✗"}</div>
      </div>

      {/* Map Container */}
      <div
        ref={mapContainer}
        style={{
          width: "100%",
          height: "500px",
          border: "2px solid #4A90E2",
          borderRadius: 12,
          background: "#1a1a1a",
        }}
      />
    </div>
  );
}
