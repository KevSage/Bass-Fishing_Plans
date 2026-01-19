import React, { useMemo } from "react";
import { CloudIcon } from "@/components/UnifiedIcons";

interface SolarArcProps {
  sunrise: string;
  sunset: string;
  solarNoon: string;
  currentTime?: string; // Optional, defaults to now
}

export function SolarArc({ sunrise, sunset, solarNoon }: SolarArcProps) {
  // Helper: Parse "6:30 AM" to minutes from midnight
  const parseTime = (timeStr: string) => {
    if (!timeStr) return 0;
    const [time, modifier] = timeStr.split(" ");
    let [hours, minutes] = time.split(":").map(Number);
    if (modifier === "PM" && hours < 12) hours += 12;
    if (modifier === "AM" && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };

  const sr = parseTime(sunrise);
  const ss = parseTime(sunset);
  // Default "now" to a fixed time for visualization if real time isn't needed,
  // or use new Date() to get actual current position.
  const now = new Date();
  const current = now.getHours() * 60 + now.getMinutes();

  // Dimensions
  const width = 300;
  const height = 120;
  const horizonY = 100; // Y position of the horizon line

  // Normalize X positions (mapped to 0 -> width)
  // We add buffer before sunrise and after sunset
  const dayStart = sr - 60; // 1 hour before sunrise
  const dayEnd = ss + 60; // 1 hour after sunset
  const totalMinutes = dayEnd - dayStart;

  const getX = (minutes: number) => {
    return ((minutes - dayStart) / totalMinutes) * width;
  };

  const xSunrise = getX(sr);
  const xSunset = getX(ss);
  const xNoon = getX(parseTime(solarNoon));
  const xNow = getX(current);

  // SVG Path for the Solar Curve (Quadratic Bezier)
  // Start at sunrise, peak at noon (y=20), end at sunset
  const pathData = `
    M ${xSunrise},${horizonY} 
    Q ${xNoon},10 
      ${xSunset},${horizonY}
  `;

  return (
    <div
      style={{
        position: "relative",
        background:
          "linear-gradient(180deg, rgba(10,15,30,0) 0%, rgba(74, 144, 226, 0.05) 100%)",
        borderRadius: 24,
        padding: "20px 0",
        border: "1px solid rgba(255,255,255,0.08)",
        marginBottom: 30,
        overflow: "hidden",
      }}
    >
      {/* Labels */}
      <div style={{ position: "absolute", top: 12, left: 16, zIndex: 10 }}>
        <div style={labelStyle}>Sunrise</div>
        <div style={timeStyle}>{sunrise}</div>
      </div>
      <div
        style={{
          position: "absolute",
          top: 12,
          right: 16,
          textAlign: "right",
          zIndex: 10,
        }}
      >
        <div style={labelStyle}>Sunset</div>
        <div style={timeStyle}>{sunset}</div>
      </div>

      {/* The Chart */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <svg
          width="100%"
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          style={{ maxWidth: 400 }}
        >
          <defs>
            <linearGradient id="sunGradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#FFD700" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#FFD700" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="strokeGradient" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#FF8C00" />
              <stop offset="50%" stopColor="#FFD700" />
              <stop offset="100%" stopColor="#FF8C00" />
            </linearGradient>
          </defs>

          {/* Horizon Line */}
          <line
            x1="0"
            y1={horizonY}
            x2={width}
            y2={horizonY}
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="1"
            strokeDasharray="4 4"
          />

          {/* Sun Path Fill */}
          <path
            d={`${pathData} L ${xSunset},${horizonY} L ${xSunrise},${horizonY} Z`}
            fill="url(#sunGradient)"
          />

          {/* Sun Path Stroke */}
          <path
            d={pathData}
            fill="none"
            stroke="url(#strokeGradient)"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Sun Icon at Peak */}
          <circle
            cx={xNoon}
            cy={10}
            r={4}
            fill="#FFD700"
            filter="drop-shadow(0 0 8px #FFD700)"
          />

          {/* Current Time Indicator (Only if within range) */}
          {current >= dayStart && current <= dayEnd && (
            <g>
              <line
                x1={xNow}
                y1={10}
                x2={xNow}
                y2={horizonY}
                stroke="#4A90E2"
                strokeWidth="2"
                strokeDasharray="3 3"
              />
              <circle cx={xNow} cy={horizonY} r={3} fill="#4A90E2" />
              <text
                x={xNow}
                y={horizonY + 15}
                fill="#4A90E2"
                fontSize="8"
                textAnchor="middle"
                fontWeight="bold"
              >
                NOW
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Solar Noon Label (Centered) */}
      <div
        style={{
          textAlign: "center",
          marginTop: -10,
          position: "relative",
          zIndex: 5,
        }}
      >
        <div style={{ ...labelStyle, color: "#FFD700" }}>Solar Peak</div>
        <div style={timeStyle}>{solarNoon}</div>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: "0.65rem",
  textTransform: "uppercase",
  color: "rgba(255,255,255,0.5)",
  fontWeight: 700,
  letterSpacing: "0.05em",
  marginBottom: 2,
};

const timeStyle: React.CSSProperties = {
  fontSize: "0.9rem",
  fontWeight: 700,
  color: "#fff",
};
