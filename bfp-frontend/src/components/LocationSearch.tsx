// src/components/LocationSearch.tsx
import React, { useState, useRef, useEffect } from "react";
import { useMapboxSearch, type MapboxFeature } from "../hooks/useMapboxSearch";

type LocationSearchProps = {
  onSelect: (location: {
    name: string;
    latitude: number;
    longitude: number;
    mapbox_place_id?: string;
    city?: string;
    state?: string;
  }) => void;
  placeholder?: string;
  initialValue?: string;
};

export function LocationSearch({
  onSelect,
  placeholder = "Search for a lake or reservoir...",
  initialValue = "",
}: LocationSearchProps) {
  const [inputValue, setInputValue] = useState(initialValue);
  const [showResults, setShowResults] = useState(false);
  const { results, loading, error, search, clear } = useMapboxSearch();
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputValue.length >= 3) {
        search(inputValue);
        setShowResults(true);
      } else {
        clear();
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [inputValue, search, clear]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (feature: MapboxFeature & { context?: any[] }) => {
    const [longitude, latitude] = feature.center;

    // Attempt to extract City and State from Mapbox Context
    let city = "";
    let state = "";

    if (feature.context) {
      const placeCtx = feature.context.find((c: any) =>
        c.id.startsWith("place"),
      );
      const regionCtx = feature.context.find((c: any) =>
        c.id.startsWith("region"),
      );

      if (placeCtx) city = placeCtx.text;
      if (regionCtx) state = regionCtx.text; // or regionCtx.short_code for "AL"
    }

    onSelect({
      name: feature.text,
      latitude,
      longitude,
      mapbox_place_id: feature.properties.mapbox_id,
      city,
      state,
    });

    setInputValue(feature.place_name);
    setShowResults(false);
  };

  return (
    <div ref={wrapperRef} style={{ position: "relative" }}>
      <input
        type="text"
        className="input"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onFocus={() => {
          if (results.length > 0) {
            setShowResults(true);
          }
        }}
        placeholder={placeholder}
        autoComplete="off"
        style={{
          // Inline style to match the glass aesthetic passed from parent styles usually
          width: "100%",
          padding: "14px 16px",
          borderRadius: "12px",
          fontSize: "1rem",
          background: "rgba(0,0,0,0.4)",
          border: "1px solid rgba(255,255,255,0.08)",
          color: "#fff",
          outline: "none",
        }}
      />

      {loading && (
        <div
          style={{
            position: "absolute",
            right: 12,
            top: "50%",
            transform: "translateY(-50%)",
            fontSize: "0.9em",
            opacity: 0.5,
            color: "#fff",
          }}
        >
          Searching...
        </div>
      )}

      {error && (
        <div
          style={{
            marginTop: 6,
            fontSize: "0.85em",
            color: "rgba(255,100,100,0.9)",
          }}
        >
          {error}
        </div>
      )}

      {showResults && results.length > 0 && (
        <div
          className="location-results"
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            background: "rgba(20, 20, 25, 0.95)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 12,
            maxHeight: 300,
            overflowY: "auto",
            zIndex: 1000,
            boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
          }}
        >
          {results.map((feature) => (
            <button
              key={feature.id}
              onClick={() => handleSelect(feature)}
              className="location-result-item"
              style={{
                width: "100%",
                padding: "14px 16px",
                border: "none",
                background: "transparent",
                color: "#fff",
                textAlign: "left",
                cursor: "pointer",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>
                {feature.text}
              </div>
              <div style={{ fontSize: "0.85em", opacity: 0.5, marginTop: 4 }}>
                {feature.place_name}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
