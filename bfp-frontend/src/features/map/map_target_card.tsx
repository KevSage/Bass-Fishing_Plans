// src/features/map/MapTargetCard.tsx
import React, { useMemo } from "react";
import { getMapTargetRecommendation } from "@/lib/map-target-logic";
import {
  WindIcon as Wind,
  SunIcon as Sun,
  CloudIcon as Cloud,
  CloudLightningIcon as CloudLightning,
  MapPinIcon as MapPin,
  AnchorIcon as Anchor,
  SnowflakeIcon as Snowflake,
} from "@/components/UnifiedIcons";

// Helper to render the correct icon based on logic output
const TargetIcon = ({ type, size = 20, color = "#fff" }: any) => {
  switch (type) {
    case "wind":
      return <Wind size={size} color={color} />;
    case "sun":
      return <Sun size={size} color={color} />;
    case "cloud":
      return <Cloud size={size} color={color} />;
    case "storm":
      return <CloudLightning size={size} color={color} />;
    case "cold":
      return <Snowflake size={size} color={color} />;
    default:
      return <Anchor size={size} color={color} />;
  }
};

export function MapTargetCard({ weather }: { weather: any }) {
  // Recalculate only when weather changes
  const strategy = useMemo(
    () => getMapTargetRecommendation(weather),
    [weather],
  );

  if (!strategy || !weather) return null;

  return (
    <div
      className="glass-panel map-target-card"
      style={{
        // Matches the dark aesthetics of your screenshots
        background: "rgba(16, 20, 24, 0.9)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(74, 144, 226, 0.15)",
        borderRadius: "16px",
        padding: "16px",
        maxWidth: "320px",
        marginTop: "12px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
      }}
    >
      {/* HEADER: Icon + Headline + Conditions */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "12px",
        }}
      >
        <div
          style={{
            background:
              "linear-gradient(135deg, rgba(74, 144, 226, 0.2), rgba(74, 144, 226, 0.05))",
            padding: "10px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid rgba(74, 144, 226, 0.2)",
          }}
        >
          <TargetIcon type={strategy.icon} size={20} color="#4A90E2" />
        </div>
        <div>
          <h4
            style={{
              margin: 0,
              fontSize: "0.95rem",
              color: "#fff",
              fontWeight: 700,
              letterSpacing: "0.02em",
            }}
          >
            {strategy.headline}
          </h4>
          <span
            style={{
              fontSize: "0.75rem",
              color: "rgba(255,255,255,0.6)",
              fontWeight: 500,
            }}
          >
            {/* Show relevant weather stat based on the strategy type */}
            {strategy.icon === "wind"
              ? `${Math.round(weather.wind_mph || 0)}mph Wind`
              : strategy.icon === "storm"
                ? `${weather.pressure_trend || "Falling"} Pressure`
                : strategy.icon === "cold"
                  ? `${Math.round(weather.temp_f || 0)}°F Water Temp`
                  : weather.sky_condition || "Stable"}
          </span>
        </div>
      </div>

      {/* BODY: The "Why" */}
      <div style={{ marginBottom: "16px" }}>
        <p
          style={{
            margin: 0,
            fontSize: "0.85rem",
            color: "#B0B3B8",
            lineHeight: "1.5",
          }}
        >
          {strategy.subtext}
        </p>
      </div>

      {/* FOOTER: The Targets (Chips) */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        {strategy.targets.map((target, i) => (
          <span
            key={i}
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "#E2E8F0",
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              padding: "6px 10px",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              gap: "5px",
              textTransform: "capitalize",
            }}
          >
            <MapPin size={12} color="#4A90E2" />
            {target}
          </span>
        ))}
      </div>
    </div>
  );
}
