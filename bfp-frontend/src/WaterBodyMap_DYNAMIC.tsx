// src/components/WaterBodyMap.tsx
// Dynamic approach - queries Mapbox vector tiles for ANY water body

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

type SearchResult = {
  name: string;
  location: string;
  lat: number;
  lon: number;
};

type WaterBodyMapProps = {
  onSelect: (waterBody: WaterBody) => void;
  searchQuery?: string;
  selectedWaterBody?: WaterBody | null;
  initialCenter?: [number, number];
  initialZoom?: number;
};

const SOFT_LOCK_MIN_ZOOM = 10; // Need to be zoomed in to see individual water bodies
const QUERY_RADIUS_PX = 50; // Search 50px radius from center

export function WaterBodyMapEnhanced({
  onSelect,
  searchQuery = "",
  selectedWaterBody = null,
  initialCenter = [-86.7816, 33.5186],
  initialZoom = 6,
}: WaterBodyMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const initialized = useRef(false);
  const [softLockedWater, setSoftLockedWater] = useState<WaterBody | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const outlineLayerId = 'water-outline';
  const outlineSourceId = 'water-outline-source';

  function drawWaterOutline(feature: mapboxgl.MapboxGeoJSONFeature) {
    if (!map.current) return;
    
    // Remove existing outline
    clearWaterOutline();
    
    // Add source with the water body geometry
    map.current.addSource(outlineSourceId, {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: feature.geometry,
        properties: feature.properties || {}
      }
    });
    
    // Add outline layer
    map.current.addLayer({
      id: outlineLayerId,
      type: 'line',
      source: outlineSourceId,
      paint: {
        'line-color': '#4A90E2',
        'line-width': 3,
        'line-opacity': 0.9
      }
    });
  }

  function clearWaterOutline() {
    if (!map.current) return;
    
    if (map.current.getLayer(outlineLayerId)) {
      map.current.removeLayer(outlineLayerId);
    }
    if (map.current.getSource(outlineSourceId)) {
      map.current.removeSource(outlineSourceId);
    }
  }

  // Initialize map
  useEffect(() => {
    if (initialized.current || !mapContainer.current || !MAPBOX_TOKEN) return;

    initialized.current = true;
    mapboxgl.accessToken = MAPBOX_TOKEN;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/outdoors-v12", // Outdoors style shows water features well
      center: initialCenter,
      zoom: initialZoom,
    });

    map.current.dragRotate.disable();
    map.current.touchZoomRotate.disableRotation();

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");
    map.current.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
      }),
      "top-right"
    );

    map.current.on("load", () => {
      console.log("✓ Map loaded");
    });

    // Query water features on map movement
    const handleMoveEnd = () => {
      if (!map.current) return;

      const zoom = map.current.getZoom();
      
      if (zoom < SOFT_LOCK_MIN_ZOOM) {
        setSoftLockedWater(null);
        return;
      }

      // Query water features at center of map
      const center = map.current.getCenter();
      const point = map.current.project(center);
      
      // Query all water-related layers
      const features = map.current.queryRenderedFeatures(
        [
          [point.x - QUERY_RADIUS_PX, point.y - QUERY_RADIUS_PX],
          [point.x + QUERY_RADIUS_PX, point.y + QUERY_RADIUS_PX]
        ],
        {
          layers: ['water', 'waterway-label'] // These layers contain water body data
        }
      );

      console.log(`Found ${features.length} water features at center`);

      if (features.length > 0) {
        // Look for named water bodies
        const namedFeature = features.find(f => f.properties?.name);
        
        if (namedFeature && namedFeature.properties) {
          console.log("Found water body:", namedFeature.properties);
          
          // Draw outline of the actual lake geometry
          drawWaterOutline(namedFeature);
          
          // Reverse geocode to get location details
          reverseGeocode(center.lng, center.lat, namedFeature.properties.name);
        } else {
          // No named feature, clear outline
          clearWaterOutline();
          setSoftLockedWater(null);
        }
      } else {
        clearWaterOutline();
        setSoftLockedWater(null);
      }
    };

    map.current.on("moveend", handleMoveEnd);
    map.current.on("zoomend", handleMoveEnd);

    // Click to select
    map.current.on("click", () => {
      if (softLockedWater) {
        selectWaterBody(softLockedWater);
      }
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  async function reverseGeocode(lng: number, lat: number, waterName?: string) {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?` +
          `access_token=${MAPBOX_TOKEN}`
      );
      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const context = data.features[0].context || [];
        const city = context.find((c: any) => c.id.startsWith("place"))?.text;
        const state = context.find((c: any) => c.id.startsWith("region"))?.short_code?.replace("US-", "");

        // Use the water name from the map feature, or the geocoded place name
        const name = waterName || data.features[0].text || "Water Body";

        setSoftLockedWater({
          name,
          city,
          state,
          latitude: lat,
          longitude: lng,
        });
      }
    } catch (error) {
      console.error("Reverse geocode failed:", error);
    }
  }

  // Search functionality using Mapbox Geocoding API
  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    const searchDebounce = setTimeout(async () => {
      try {
        // Search specifically for water-related places
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?` +
            `access_token=${MAPBOX_TOKEN}&` +
            `country=US&` +
            `limit=10`
        );
        const data = await response.json();

        if (data.features && data.features.length > 0) {
          const waterResults = data.features
            .filter((f: any) => {
              const name = f.text.toLowerCase();
              const placeName = f.place_name?.toLowerCase() || "";
              const placeType = f.place_type?.[0] || "";

              // Exclude streets/addresses
              if (
                placeType === "address" ||
                placeName.includes("drive") ||
                placeName.includes("court") ||
                placeName.includes("street") ||
                placeName.includes("road")
              ) {
                return false;
              }

              // Include water-related names
              return (
                name.includes("lake") ||
                name.includes("reservoir") ||
                name.includes("river") ||
                name.includes("creek") ||
                name.includes("pond") ||
                name.includes("bay")
              );
            })
            .map((feature: any) => {
              const context = feature.context || [];
              const city = context.find((c: any) => c.id.startsWith("place"))?.text;
              const state = context.find((c: any) => c.id.startsWith("region"))?.short_code?.replace("US-", "");

              return {
                name: feature.text,
                location: [city, state].filter(Boolean).join(", "),
                lat: feature.center[1],
                lon: feature.center[0],
              };
            });

          setSearchResults(waterResults);
          setShowDropdown(waterResults.length > 0);
        }
      } catch (error) {
        console.error("Search failed:", error);
      }
    }, 300);

    return () => clearTimeout(searchDebounce);
  }, [searchQuery]);

  function selectWaterBody(lake: WaterBody) {
    onSelect(lake);

    // Clear outline
    clearWaterOutline();

    // Add marker
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
      .setLngLat([lake.longitude, lake.latitude])
      .addTo(map.current!);

    setSoftLockedWater(null);
  }

  function handleSearchResultClick(result: SearchResult) {
    map.current?.flyTo({
      center: [result.lon, result.lat],
      zoom: 12,
      duration: 1500,
    });

    selectWaterBody({
      name: result.name,
      city: result.location.split(",")[0]?.trim(),
      state: result.location.split(",")[1]?.trim(),
      latitude: result.lat,
      longitude: result.lon,
    });

    setShowDropdown(false);
  }

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div ref={mapContainer} style={{ width: "100%", height: "100%" }} />

      {/* Search Results Dropdown */}
      {showDropdown && searchResults.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: 220,
            left: 20,
            right: 20,
            maxWidth: 380,
            maxHeight: 300,
            overflowY: "auto",
            background: "rgba(10, 10, 10, 0.98)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(74, 144, 226, 0.3)",
            borderRadius: 8,
            zIndex: 1001,
            boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
          }}
        >
          {searchResults.map((result, i) => (
            <div
              key={i}
              onClick={() => handleSearchResultClick(result)}
              style={{
                padding: "12px 16px",
                cursor: "pointer",
                borderBottom: i < searchResults.length - 1 ? "1px solid rgba(255,255,255,0.1)" : "none",
                transition: "background 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(74, 144, 226, 0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              <div style={{ fontWeight: 600, color: "#4A90E2", marginBottom: 4 }}>
                {result.name}
              </div>
              {result.location && (
                <div style={{ fontSize: "0.85em", opacity: 0.7 }}>
                  📍 {result.location}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Soft-lock Overlay */}
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
          <div style={{ fontSize: "1.1em", fontWeight: 600, color: "#4A90E2", marginBottom: 4 }}>
            {softLockedWater.name}
          </div>
          {(softLockedWater.city || softLockedWater.state) && (
            <div style={{ fontSize: "0.9em", opacity: 0.7, marginBottom: 8 }}>
              📍 {[softLockedWater.city, softLockedWater.state].filter(Boolean).join(", ")}
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
