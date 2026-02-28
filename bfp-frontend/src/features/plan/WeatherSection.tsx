// src/features/plan/WeatherSection.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ThermometerIcon,
  WindIcon,
  CloudIcon,
  MapPinIcon,
  ActivityIcon,
} from "@/components/UnifiedIcons";

// --- HELPERS ----------------------------------------------------
const numOrNull = (v: unknown): number | null => {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const titleCase = (s: string): string =>
  s
    .toLowerCase()
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

// Convert mb to inHg: 1 mb = 0.02953 inHg
const mbToInHg = (mb: number): number => mb * 0.02953;

// --- PREMIUM WIND COMPASS GAUGE ---
const WindCompassGauge = ({
  direction,
  speed,
  gust = null,
}: {
  direction: string;
  speed: number | null;
  gust?: number | null;
}) => {
  const gustValue = gust ?? null;
  const rotation = useMemo(() => {
    const d = (direction || "N").toUpperCase();
    const map: Record<string, number> = {
      N: 180, NNE: 202.5, NE: 225, ENE: 247.5,
      E: 270, ESE: 292.5, SE: 315, SSE: 337.5,
      S: 0, SSW: 22.5, SW: 45, WSW: 67.5,
      W: 90, WNW: 112.5, NW: 135, NNW: 157.5,
    };
    return map[d] ?? 0;
  }, [direction]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div style={{ position: "relative", width: 140, height: 140 }}>
        <svg viewBox="0 0 100 100" style={{ width: "100%", height: "100%" }}>
          {/* Defs first */}
          <defs>
            <filter id="windArrowGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Outer glow ring */}
          <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(74, 144, 226, 0.2)" strokeWidth="1" />
          {/* Main ring */}
          <circle cx="50" cy="50" r="44" fill="rgba(0,0,0,0.3)" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />

          {/* Tick marks */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
            <line
              key={angle}
              x1="50"
              y1="8"
              x2="50"
              y2={angle % 90 === 0 ? "16" : "12"}
              stroke={angle % 90 === 0 ? "#4A90E2" : "rgba(255,255,255,0.3)"}
              strokeWidth={angle % 90 === 0 ? "2.5" : "1.5"}
              transform={`rotate(${angle} 50 50)`}
            />
          ))}

          {/* Cardinal labels */}
          <text x="50" y="26" textAnchor="middle" fill="#4A90E2" fontSize="12" fontWeight="800">N</text>
          <text x="80" y="53" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="10" fontWeight="700">E</text>
          <text x="50" y="82" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="10" fontWeight="700">S</text>
          <text x="20" y="53" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="10" fontWeight="700">W</text>

          {/* Direction arrow */}
          <g transform={`rotate(${rotation} 50 50)`} filter="url(#windArrowGlow)">
            <path d="M50 16 L56 38 L50 32 L44 38 Z" fill="#4A90E2" />
            <circle cx="50" cy="50" r="6" fill="#4A90E2" />
          </g>
        </svg>

        {/* Center speed display */}
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          textAlign: "center",
          marginTop: 4,
        }}>
          <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#fff", lineHeight: 1 }}>
            {speed !== null ? Math.round(speed) : "--"}
          </div>
          <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            mph
          </div>
        </div>
      </div>

      {/* Sustained & Gust row */}
      <div style={{
        display: "flex",
        gap: 12,
        marginTop: 2,
      }}>
        {/* Sustained */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}>
          <span style={{
            fontSize: "0.5rem",
            fontWeight: 700,
            color: "rgba(255,255,255,0.4)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}>Sustained</span>
          <span style={{
            fontSize: "0.9rem",
            fontWeight: 800,
            color: "#fff",
          }}>
            {speed !== null ? `${Math.round(speed)}` : "--"}
            <span style={{ fontSize: "0.55rem", fontWeight: 600, color: "rgba(255,255,255,0.5)", marginLeft: 2 }}>mph</span>
          </span>
        </div>

        {/* Divider */}
        <div style={{
          width: 1,
          background: "rgba(255,255,255,0.15)",
        }} />

        {/* Gusts */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}>
          <span style={{
            fontSize: "0.5rem",
            fontWeight: 700,
            color: "rgba(255,255,255,0.4)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}>Gusts</span>
          <span style={{
            fontSize: "0.9rem",
            fontWeight: 800,
            color: gustValue !== null && gustValue >= 20 ? "#f87171" :
                   gustValue !== null && gustValue >= 12 ? "#facc15" : "#fff",
          }}>
            {gustValue !== null ? `${Math.round(gustValue)}` : "--"}
            <span style={{ fontSize: "0.55rem", fontWeight: 600, color: "rgba(255,255,255,0.5)", marginLeft: 2 }}>mph</span>
          </span>
        </div>
      </div>
    </div>
  );
};

// --- PREMIUM PRESSURE ARC GAUGE ---
const PressureArcGauge = ({ pressureMb }: { pressureMb: number | null }) => {
  const pressureInHg = pressureMb ? mbToInHg(pressureMb) : null;

  // Gauge range: 29.0 to 31.0 inHg
  const minP = 29.0;
  const maxP = 31.0;
  const range = maxP - minP;

  const getNeedleAngle = (p: number) => {
    const clamped = Math.max(minP, Math.min(maxP, p));
    const normalized = (clamped - minP) / range;
    return -90 + (normalized * 180);
  };

  // Default to center (30.0 inHg) if no data
  const needleAngle = pressureInHg ? getNeedleAngle(pressureInHg) : 0;

  // Optimal range: 29.8 - 30.2 inHg (prime bass fishing)
  const isOptimal = pressureInHg && pressureInHg >= 29.8 && pressureInHg <= 30.2;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <style>{`
        @keyframes needleWobble {
          0%, 100% { transform: rotate(${needleAngle}deg); }
          25% { transform: rotate(${needleAngle + 0.8}deg); }
          75% { transform: rotate(${needleAngle - 0.8}deg); }
        }
        .pressure-needle {
          transform-origin: 50px 52px;
          animation: needleWobble 3s ease-in-out infinite;
        }
      `}</style>
      <div style={{ position: "relative", width: 140, height: 85 }}>
        <svg viewBox="0 0 100 60" style={{ width: "100%", height: "100%" }}>
          {/* Defs first */}
          <defs>
            <linearGradient id="pressureArcGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.6" />
              <stop offset="40%" stopColor="#4ade80" stopOpacity="0.4" />
              <stop offset="60%" stopColor="#4ade80" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#f87171" stopOpacity="0.6" />
            </linearGradient>
          </defs>

          {/* Background arc with gradient: blue (low) -> green (optimal) -> red (high) */}
          <path
            d="M 8 52 A 42 42 0 0 1 92 52"
            fill="none"
            stroke="url(#pressureArcGradient)"
            strokeWidth="8"
            strokeLinecap="round"
          />

          {/* Tick marks */}
          {[0, 0.25, 0.5, 0.75, 1].map((pos, i) => {
            const angle = -90 + (pos * 180);
            const rad = (angle * Math.PI) / 180;
            const x1 = 50 + 36 * Math.cos(rad);
            const y1 = 52 + 36 * Math.sin(rad);
            const x2 = 50 + 44 * Math.cos(rad);
            const y2 = 52 + 44 * Math.sin(rad);
            return (
              <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
            );
          })}

          {/* Labels - color coded */}
          <text x="6" y="58" fill="#60a5fa" fontSize="6" fontWeight="700">LOW</text>
          <text x="78" y="58" fill="#f87171" fontSize="6" fontWeight="700">HIGH</text>

          {/* Needle - with subtle wobble animation */}
          <g className="pressure-needle">
            <line x1="50" y1="52" x2="50" y2="18" stroke="#4A90E2" strokeWidth="3" strokeLinecap="round" />
            <circle cx="50" cy="52" r="6" fill="#4A90E2" />
            <circle cx="50" cy="52" r="3" fill="#fff" />
          </g>
        </svg>
      </div>

      {/* Value display */}
      <div style={{ textAlign: "center", marginTop: 4 }}>
        <span style={{
          fontSize: "1.4rem",
          fontWeight: 800,
          color: isOptimal ? "#4ade80" : "#fff",
        }}>
          {pressureInHg ? pressureInHg.toFixed(2) : "--"}
        </span>
        <span style={{ fontSize: "0.65rem", fontWeight: 600, color: "rgba(255,255,255,0.5)", marginLeft: 4 }}>
          inHg
        </span>
      </div>

      {/* Optimal indicator */}
      {isOptimal && (
        <div style={{
          marginTop: 6,
          fontSize: "0.6rem",
          fontWeight: 700,
          color: "#4ade80",
          background: "rgba(74, 222, 128, 0.15)",
          padding: "3px 10px",
          borderRadius: 8,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}>
          Optimal
        </div>
      )}
    </div>
  );
};

// --- PREMIUM TEMPERATURE DISPLAY ---
const TemperatureDisplay = ({
  temp,
  high,
  low,
  feelsLike,
  waterTemp,
}: {
  temp: number | null;
  high: number | null;
  low: number | null;
  feelsLike: number | null;
  waterTemp: number | null;
}) => {
  const [showWaterTooltip, setShowWaterTooltip] = React.useState(false);

  // Color based on temp ranges
  const getTempColor = (t: number) => {
    if (t <= 45) return "#60a5fa"; // Cold - blue
    if (t <= 55) return "#4ade80"; // Cool - green
    if (t <= 70) return "#facc15"; // Warm - yellow
    return "#f87171"; // Hot - red
  };

  const tempColor = temp ? getTempColor(temp) : "#fff";
  // Water temp always uses consistent blue for easy recognition
  const waterColor = "#4A90E2";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      {/* Hero air temp */}
      <div style={{ display: "flex", alignItems: "flex-start" }}>
        <span style={{
          fontSize: "2.8rem",
          fontWeight: 800,
          color: "#fff",
          lineHeight: 1,
          letterSpacing: "-0.02em",
        }}>
          {temp !== null ? Math.round(temp) : "--"}
        </span>
        <span style={{
          fontSize: "1.2rem",
          fontWeight: 600,
          color: tempColor,
          marginTop: 4,
        }}>°</span>
      </div>

      {/* Hi / Lo row */}
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        {high !== null && (
          <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
            <span style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>H:</span>
            <span style={{ fontSize: "0.8rem", color: "#fff", fontWeight: 700 }}>{Math.round(high)}°</span>
          </div>
        )}
        {low !== null && (
          <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
            <span style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>L:</span>
            <span style={{ fontSize: "0.8rem", color: "#fff", fontWeight: 700 }}>{Math.round(low)}°</span>
          </div>
        )}
      </div>

      {/* Feels like */}
      {feelsLike !== null && Math.abs((feelsLike || 0) - (temp || 0)) > 3 && (
        <div style={{
          fontSize: "0.65rem",
          fontWeight: 600,
          color: "rgba(255,255,255,0.5)",
          background: "rgba(255,255,255,0.05)",
          padding: "3px 8px",
          borderRadius: 6,
        }}>
          Feels {Math.round(feelsLike)}°
        </div>
      )}

      {/* Water Temperature with tooltip */}
      {waterTemp !== null && (
        <div
          style={{ position: "relative", marginTop: 4 }}
          onMouseEnter={() => setShowWaterTooltip(true)}
          onMouseLeave={() => setShowWaterTooltip(false)}
          onTouchStart={() => setShowWaterTooltip(true)}
          onTouchEnd={() => setTimeout(() => setShowWaterTooltip(false), 2000)}
        >
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            background: "rgba(74, 144, 226, 0.15)",
            border: "1px solid rgba(74, 144, 226, 0.3)",
            padding: "4px 10px",
            borderRadius: 8,
            cursor: "help",
          }}>
            {/* Water droplet icon */}
            <svg width="12" height="12" viewBox="0 0 24 24" fill={waterColor} style={{ opacity: 0.9 }}>
              <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
            </svg>
            <span style={{
              fontSize: "0.75rem",
              fontWeight: 700,
              color: waterColor,
            }}>
              ~{Math.round(waterTemp)}°
            </span>
            {/* Info icon */}
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" />
            </svg>
          </div>

          {/* Tooltip */}
          {showWaterTooltip && (
            <div style={{
              position: "absolute",
              bottom: "calc(100% + 8px)",
              left: "50%",
              transform: "translateX(-50%)",
              background: "rgba(0, 0, 0, 0.95)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 8,
              padding: "8px 12px",
              width: 180,
              zIndex: 100,
              boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
            }}>
              <div style={{
                fontSize: "0.65rem",
                color: "rgba(255,255,255,0.9)",
                lineHeight: 1.4,
                textAlign: "center",
              }}>
                Water temp is estimated based on the past 5 days of air temperature trends
              </div>
              {/* Tooltip arrow */}
              <div style={{
                position: "absolute",
                bottom: -6,
                left: "50%",
                transform: "translateX(-50%)",
                width: 0,
                height: 0,
                borderLeft: "6px solid transparent",
                borderRight: "6px solid transparent",
                borderTop: "6px solid rgba(0, 0, 0, 0.95)",
              }} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL; // Ensure this is available in your .env

// Moving CardId to top-level scope to ensure accessibility in all functions
export type CardId = "temp" | "wind" | "pressure" | "light";

export type PlanConditions = {
  trip_date: string;
  location_name: string;
  latitude: number;
  longitude: number;
  // Core
  temp_f?: number | null;
  temp_low?: number | null;
  temp_high?: number | null;
  feels_like_f?: number | null; // New
  // Wind
  wind_mph?: number | null;
  wind_speed?: number | null;
  wind_direction?: string | null;
  wind_gust_mph?: number | null; // New
  // Sky/Air
  uv_index?: number | null;
  cloud_cover?: string | null;
  sky_condition?: string | null;
  cloud_pct?: number | null;
  humidity?: number | null;
  visibility_miles?: number | null;
  dew_point?: number | null;
  // Precipitation
  precipitation_1h?: number | null;
  has_recent_rain?: boolean | null;
  // Pressure
  pressure_mb?: number | null;
  pressure_trend?: string | null;
  phase?: string | null;
  // Temperature Trend (from backend)
  temp_trend?: string | null;
  temp_season_context?: string | null;
  past_temp_f?: number | null;
  // Water Temperature (estimated from 5-day air temp history)
  estimated_water_temp_f?: number | null;
  // Wind Trend
  past_wind_mph?: number | null;
  // Insights & Ratings
  weather_card_insights?: {
    temperature?: string | null;
    wind?: string | null;
    pressure?: string | null;
    sky_uv?: string | null;
  } | null;
  forecast_rating?: {
    score: number;
    rating: string;
    explanation: string;
  } | null;
  sunriseTime?: string;
  sunsetTime?: string;
  solarNoonTime?: string;
};

// --- ACTIVITY BADGE COMPONENT (INTERNAL) ---
const ActivityBadge = ({ rating }: { rating: string; score?: number }) => {
  const r = rating.toUpperCase();

  // Config: Color and Pulse Speed per state
  let color = "#4A90E2"; // Default Blue
  let speed = "2s"; // Default Speed

  if (r.includes("AGGRESSIVE")) {
    color = "#4ade80"; // Green
    speed = "0.6s"; // Fast
  } else if (r.includes("ACTIVE")) {
    color = "#60a5fa"; // Blue
    speed = "1.2s"; // Steady
  } else if (r.includes("OPPORTUNISTIC")) {
    color = "#facc15"; // Yellow
    speed = "2.0s"; // Medium
  } else if (r.includes("SELECTIVE")) {
    color = "#fb923c"; // Orange
    speed = "3.5s"; // Slow
  } else if (r.includes("DEFENSIVE")) {
    color = "#f87171"; // Red
    speed = "5.0s"; // Very Slow
  }

  return (
    <div
      style={
        {
          background: "rgba(10, 10, 10, 0.6)",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "20px",
          padding: "6px 12px 6px 8px", // tight padding
          display: "flex",
          alignItems: "center",
          gap: "10px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
          "--badge-color": color,
          "--pulse-speed": speed,
        } as React.CSSProperties
      }
    >
      {/* The Activity Orb */}
      <div className="activity-orb" />

      {/* The Label */}
      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
        <span
          style={{
            fontSize: "0.55rem",
            color: "rgba(255,255,255,0.6)",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: 2,
          }}
        >
          Activity Level
        </span>
        <span
          style={{
            fontSize: "0.75rem",
            fontWeight: 800,
            color: "#fff",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          {rating}
        </span>
      </div>

      <style>{`
        .activity-orb {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background-color: var(--badge-color);
          position: relative;
          box-shadow: 0 0 8px var(--badge-color);
        }
        
        .activity-orb::after {
          content: "";
          position: absolute;
          inset: -4px; /* ring size */
          border-radius: 50%;
          border: 1.5px solid var(--badge-color);
          opacity: 0;
          animation: activity-ping var(--pulse-speed) infinite ease-out;
        }

        @keyframes activity-ping {
          0% {
            transform: scale(0.8);
            opacity: 0.8;
          }
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export function WeatherSection({
  conditions,
  outlookBlurb,
  enableLiveUpdates = false,
}: {
  conditions: PlanConditions;
  outlookBlurb?: string | null;
  enableLiveUpdates?: boolean;
}) {
  const [locationCity, setLocationCity] = useState<string>("");
  const [locationState, setLocationState] = useState<string>("");
  const [activeCard, setActiveCard] = useState<CardId | null>(null);

  // DYNAMIC WEATHER STATE
  // Initialize with plan conditions (Offline First Strategy)
  const [liveConditions, setLiveConditions] =
    useState<PlanConditions>(conditions);
  const [isLive, setIsLive] = useState(false);
  const hasFetchedLive = useRef(false);
  const hasGeocodedRef = useRef(false);

  // 1. Live Weather Fetcher (Updates face of card only)
  useEffect(() => {
    // GUARD: Only fetch if enabled (not shared view) AND online AND not fetched yet
    if (
      !enableLiveUpdates ||
      !navigator.onLine ||
      hasFetchedLive.current ||
      !API_BASE_URL
    )
      return;

    const fetchLiveWeather = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/weather/current?lat=${conditions.latitude}&lon=${conditions.longitude}`,
        );

        if (res.ok) {
          const liveData = await res.json();

          // Merge live data with existing conditions
          setLiveConditions((prev) => ({
            ...prev,
            temp_f: liveData.temp_f ?? prev.temp_f,
            feels_like_f: liveData.feels_like_f ?? prev.feels_like_f,
            wind_speed: liveData.wind_speed ?? prev.wind_speed,
            wind_mph: liveData.wind_mph ?? prev.wind_mph,
            wind_direction: liveData.wind_direction ?? prev.wind_direction,
            wind_gust_mph: liveData.wind_gust_mph ?? prev.wind_gust_mph,
            pressure_mb: liveData.pressure_mb ?? prev.pressure_mb,
            pressure_trend: liveData.pressure_trend ?? prev.pressure_trend,
            sky_condition: liveData.sky_condition ?? prev.sky_condition,
            uv_index: liveData.uv_index ?? prev.uv_index,
            humidity: liveData.humidity ?? prev.humidity,
            visibility_miles:
              liveData.visibility_miles ?? prev.visibility_miles,
            estimated_water_temp_f:
              liveData.estimated_water_temp_f ?? prev.estimated_water_temp_f,
          }));

          setIsLive(true);
          hasFetchedLive.current = true;
        }
      } catch (err) {
        // Silent fail - stick to plan conditions (Offline Mode)
        console.log("Live weather fetch failed, using plan snapshot");
      }
    };

    fetchLiveWeather();
  }, [conditions.latitude, conditions.longitude, enableLiveUpdates]);

  // 2. Derive metrics from liveConditions (which defaults to conditions)
  const derived = useMemo(() => {
    const raw: any = liveConditions;

    const sunrise = liveConditions.sunriseTime || "--:--";
    const sunset = liveConditions.sunsetTime || "--:--";
    const solarNoon = liveConditions.solarNoonTime || "--:--";

    // Temperature Logic
    const tempF = numOrNull(raw.temp_f);
    const feelsLike = numOrNull(raw.feels_like_f);
    const low = numOrNull(raw.temp_low);
    const high = numOrNull(raw.temp_high);

    const tempPrimary = tempF != null ? `${Math.round(tempF)}°` : "--";

    // Improved Secondary: Show "Feels Like" if available, else High/Low
    const tempSecondary =
      feelsLike != null
        ? `Feels ${Math.round(feelsLike)}°`
        : low != null && high != null
          ? `L:${Math.round(low)}° H:${Math.round(high)}°`
          : "Forecast";

    // Wind Logic
    const wind = numOrNull(raw.wind_mph) ?? numOrNull(raw.wind_speed);
    const gust = numOrNull(raw.wind_gust_mph);
    const windPrimary = wind != null ? `${Math.round(wind)}` : "--";

    // Improved Secondary: Show Direction + Gust
    let windSecondary = raw.wind_direction
      ? `MPH • ${raw.wind_direction}`
      : "MPH";
    if (gust && gust > (wind || 0)) {
      windSecondary += ` (G:${Math.round(gust)})`;
    }

    // Pressure Logic
    const pressureMb = numOrNull(raw.pressure_mb);
    const pTrend = (raw.pressure_trend || "Stable").toLowerCase();
    const pressurePrimary =
      pressureMb != null ? `${Math.round(pressureMb)}` : "--";
    const pressureSecondary = `MB • ${titleCase(pTrend)}`;

    // Sky & UV Logic
    const cloudRaw = (
      raw.sky_condition ||
      raw.cloud_cover ||
      "Clear"
    ).toLowerCase();
    const uv = numOrNull(raw.uv_index);
    const lightPrimary = titleCase(cloudRaw);
    const uvValue = uv != null ? `${Math.round(uv)}` : "0";

    return {
      sunrise,
      solarNoon,
      sunset,
      tempPrimary,
      tempSecondary,
      windPrimary,
      windSecondary,
      pressurePrimary,
      pressureSecondary,
      lightPrimary,
      uvValue,
      phase: liveConditions.phase
        ? titleCase(String(liveConditions.phase))
        : "",
    };
  }, [liveConditions]);

  const expansion = useMemo(() => {
    if (!activeCard) return null;
    return buildExpansion(activeCard, liveConditions);
  }, [activeCard, liveConditions]);

  const lakeZoom = getLakeZoom(conditions.location_name);

  // Geocoding logic
  useEffect(() => {
    if (hasGeocodedRef.current) return;
    async function getCityState() {
      if (!MAPBOX_TOKEN) return;
      try {
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${conditions.longitude},${conditions.latitude}.json?types=place,region&access_token=${MAPBOX_TOKEN}`,
        );
        const data = await res.json();
        if (data.features?.length > 0) {
          const place = data.features.find((f: any) =>
            f.id.startsWith("place"),
          );
          if (place) setLocationCity(place.text || "");
          const region = data.features.find((f: any) =>
            f.id.startsWith("region"),
          );
          if (region)
            setLocationState(
              region.text || region.short_code?.replace("US-", "") || "",
            );
          hasGeocodedRef.current = true;
        }
      } catch (e) {
        console.error("Geocoding error", e);
      }
    }
    getCityState();
  }, [conditions.latitude, conditions.longitude]);

  return (
    <>
      <div
        className="glass-panel"
        style={{
          borderRadius: 24,
          overflow: "hidden",
          position: "relative",
          marginTop: -10,
          background:
            "linear-gradient(145deg, rgba(10, 10, 10, 0.6) 0%, rgba(20, 20, 20, 0.8) 100%)",
          border: "1px solid rgba(74, 144, 226, 0.2)",
          boxShadow: "0 12px 40px rgba(0,0,0,0.4)",
        }}
      >
        {/* Top Tactical Seal */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: "#4A90E2",
            boxShadow: "0 0 15px rgba(74, 144, 226, 0.5)",
            zIndex: 10,
          }}
        />

        {/* MAP HEADER */}
        <div
          style={{
            position: "relative",
            minHeight: 260,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          {MAPBOX_TOKEN && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage: `url(https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/${conditions.longitude},${conditions.latitude},${lakeZoom},0/800x400@2x?access_token=${MAPBOX_TOKEN}&attribution=false&logo=false)`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                filter: "brightness(1) saturate(1.1)",
              }}
            />
          )}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(10,10,10,0.9) 100%)",
            }}
          />

          <div
            style={{
              position: "relative",
              padding: "28px 24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span
                style={{
                  fontSize: "0.85rem",
                  fontWeight: 800,
                  color: "#4A90E2",
                  textTransform: "uppercase",
                  background: "rgba(0,0,0,0.6)",
                  padding: "4px 8px",
                  borderRadius: "8px",
                  backdropFilter: "blur(4px)",
                }}
              >
                {conditions.trip_date}
              </span>
            </div>

            {/* --- ACTIVITY BADGE OR PHASE PILL --- */}
            {conditions.forecast_rating ? (
              <ActivityBadge
                rating={conditions.forecast_rating.rating}
                score={conditions.forecast_rating.score}
              />
            ) : (
              derived.phase && (
                <span
                  style={{
                    fontSize: "0.75rem",
                    background: "rgba(74, 144, 226, 0.2)",
                    border: "1px solid rgba(74, 144, 226, 0.4)",
                    color: "#fff",
                    padding: "4px 12px",
                    borderRadius: 20,
                    fontWeight: 700,
                    backdropFilter: "blur(4px)",
                  }}
                >
                  {derived.phase}
                </span>
              )
            )}
          </div>

          <div style={{ position: "relative", padding: "0 24px 32px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 4,
              }}
            >
              <MapPinIcon size={24} style={{ color: "#4A90E2" }} />
              <h2
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 600,
                  color: "#fff",
                  margin: 0,
                }}
              >
                {conditions.location_name}
              </h2>
            </div>
            <div
              style={{
                fontSize: "1.05rem",
                color: "rgba(255,255,255,0.7)",
                paddingLeft: 34,
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <span>
                {locationCity && locationState
                  ? `${locationCity}, ${locationState}`
                  : locationCity || locationState}
              </span>

              {/* ✅ LIVE INDICATOR - MOVED HERE */}
              {isLive && (
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    background: "rgba(74, 222, 128, 0.15)",
                    border: "1px solid rgba(74, 222, 128, 0.3)",
                    padding: "2px 8px",
                    borderRadius: "20px",
                    backdropFilter: "blur(4px)",
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      backgroundColor: "#4ade80",
                      boxShadow: "0 0 8px #4ade80",
                    }}
                  />
                  <span
                    style={{
                      color: "#4ade80",
                      fontSize: "0.65rem",
                      fontWeight: 800,
                      letterSpacing: "0.05em",
                    }}
                  >
                    LIVE
                  </span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* HUD DASHBOARD */}
        <div style={{ padding: "24px" }}>
          {/* FUNCTIONAL SOLAR STRIP */}
          <div
            style={{
              marginBottom: 20,
              padding: "16px",
              background: "rgba(74, 144, 226, 0.04)",
              borderRadius: 16,
              border: "1px solid rgba(74, 144, 226, 0.12)",
              position: "relative",
            }}
          >
            <div
              style={{
                position: "relative",
                height: 32,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  height: 1,
                  background: "rgba(74, 144, 226, 0.2)",
                }}
              />
              <div style={{ textAlign: "center", zIndex: 1 }}>
                <div
                  style={{
                    fontSize: "0.6rem",
                    color: "#4A90E2",
                    fontWeight: 800,
                    textTransform: "uppercase",
                  }}
                >
                  Sunrise
                </div>
                <div
                  style={{
                    fontSize: "0.85rem",
                    color: "#fff",
                    fontWeight: 700,
                  }}
                >
                  {derived.sunrise}
                </div>
              </div>
              <div style={{ textAlign: "center", zIndex: 1, marginTop: -12 }}>
                <CloudIcon
                  size={16}
                  style={{
                    color: "#FFD700",
                    marginBottom: 2,
                    filter: "drop-shadow(0 0 5px rgba(255, 215, 0, 0.4))",
                  }}
                />
                <div
                  style={{
                    fontSize: "0.65rem",
                    color: "#FFD700",
                    fontWeight: 800,
                  }}
                >
                  SOLAR PEAK
                </div>
                <div
                  style={{
                    fontSize: "0.85rem",
                    color: "#fff",
                    fontWeight: 700,
                  }}
                >
                  {derived.solarNoon}
                </div>
              </div>
              <div style={{ textAlign: "center", zIndex: 1 }}>
                <div
                  style={{
                    fontSize: "0.6rem",
                    color: "#4A90E2",
                    fontWeight: 800,
                    textTransform: "uppercase",
                  }}
                >
                  Sunset
                </div>
                <div
                  style={{
                    fontSize: "0.85rem",
                    color: "#fff",
                    fontWeight: 700,
                  }}
                >
                  {derived.sunset}
                </div>
              </div>
            </div>
          </div>

          {/* PREMIUM 2x2 GAUGE GRID */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {/* Temperature Card */}
            <div
              onClick={() => setActiveCard("temp")}
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 16,
                padding: "20px 12px",
                cursor: "pointer",
                transition: "all 0.2s ease",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div style={{
                fontSize: "0.55rem",
                fontWeight: 800,
                color: "#4A90E2",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: 8,
              }}>
                Temperature
              </div>
              <TemperatureDisplay
                temp={numOrNull(liveConditions.temp_f)}
                high={numOrNull(liveConditions.temp_high)}
                low={numOrNull(liveConditions.temp_low)}
                feelsLike={numOrNull(liveConditions.feels_like_f)}
                waterTemp={numOrNull(liveConditions.estimated_water_temp_f)}
              />
            </div>

            {/* Sky & Light Card - Premium Design */}
            <div
              onClick={() => setActiveCard("light")}
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 16,
                padding: "14px 12px",
                cursor: "pointer",
                transition: "all 0.2s ease",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div style={{
                fontSize: "0.55rem",
                fontWeight: 800,
                color: "#4A90E2",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: 8,
              }}>
                Sky & Light
              </div>

              {/* Sky condition hero */}
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 10,
              }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "rgba(74, 144, 226, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <CloudIcon size={20} style={{ color: "#4A90E2" }} />
                </div>
                <span style={{ fontSize: "1.05rem", fontWeight: 700, color: "#fff" }}>
                  {derived.lightPrimary}
                </span>
              </div>

              {/* UV & Visibility row */}
              <div style={{
                display: "flex",
                gap: 8,
                width: "100%",
              }}>
                {/* UV Index */}
                <div style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  background: "rgba(255,255,255,0.03)",
                  padding: "8px 6px",
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.05)",
                }}>
                  <span style={{
                    fontSize: "0.5rem",
                    color: "rgba(255,255,255,0.4)",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    marginBottom: 2,
                  }}>UV Index</span>
                  <span style={{
                    fontSize: "1.1rem",
                    fontWeight: 800,
                    color: Number(derived.uvValue) >= 8 ? "#f87171" :
                           Number(derived.uvValue) >= 6 ? "#facc15" :
                           Number(derived.uvValue) >= 3 ? "#4ade80" : "#60a5fa",
                  }}>
                    {derived.uvValue}
                  </span>
                </div>

                {/* Visibility */}
                <div style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  background: "rgba(255,255,255,0.03)",
                  padding: "8px 6px",
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.05)",
                }}>
                  <span style={{
                    fontSize: "0.5rem",
                    color: "rgba(255,255,255,0.4)",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    marginBottom: 2,
                  }}>Visibility</span>
                  <span style={{
                    fontSize: "1.1rem",
                    fontWeight: 800,
                    color: "#fff",
                  }}>
                    {liveConditions.visibility_miles != null ? `${Math.round(liveConditions.visibility_miles)}` : "--"}
                    <span style={{ fontSize: "0.6rem", fontWeight: 600, color: "rgba(255,255,255,0.5)", marginLeft: 2 }}>mi</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Wind Gauge Card */}
            <div
              onClick={() => setActiveCard("wind")}
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 16,
                padding: "14px 8px 12px",
                cursor: "pointer",
                transition: "all 0.2s ease",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div style={{
                fontSize: "0.55rem",
                fontWeight: 800,
                color: "#4A90E2",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: 6,
              }}>
                Wind
              </div>
              <WindCompassGauge
                direction={liveConditions.wind_direction || "N"}
                speed={numOrNull(liveConditions.wind_mph) ?? numOrNull(liveConditions.wind_speed)}
                gust={numOrNull(liveConditions.wind_gust_mph)}
              />
            </div>

            {/* Pressure Gauge Card */}
            <div
              onClick={() => setActiveCard("pressure")}
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 16,
                padding: "14px 8px 12px",
                cursor: "pointer",
                transition: "all 0.2s ease",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div style={{
                fontSize: "0.55rem",
                fontWeight: 800,
                color: "#4A90E2",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: 6,
              }}>
                Barometric
              </div>
              <PressureArcGauge
                pressureMb={numOrNull(liveConditions.pressure_mb)}
              />
            </div>
          </div>

          {/* CONDITIONS BAR */}
          <div style={{
            marginTop: 12,
            display: "flex",
            justifyContent: "space-around",
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 12,
            padding: "14px 8px",
          }}>
            {/* Humidity */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4A90E2" strokeWidth="2">
                <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
              </svg>
              <span style={{ fontSize: "0.55rem", fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>Humidity</span>
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#fff" }}>
                {liveConditions.humidity != null ? `${Math.round(liveConditions.humidity)}%` : "--"}
              </span>
            </div>

            {/* Precipitation */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={liveConditions.has_recent_rain ? "#60a5fa" : "#4A90E2"} strokeWidth="2">
                <path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25" />
                <line x1="8" y1="19" x2="8" y2="21" />
                <line x1="12" y1="17" x2="12" y2="23" />
                <line x1="16" y1="19" x2="16" y2="21" />
              </svg>
              <span style={{ fontSize: "0.55rem", fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>Rain</span>
              <span style={{
                fontSize: "0.85rem",
                fontWeight: 700,
                color: liveConditions.has_recent_rain ? "#60a5fa" : "#fff"
              }}>
                {liveConditions.precipitation_1h != null && liveConditions.precipitation_1h > 0
                  ? `${liveConditions.precipitation_1h.toFixed(1)}"`
                  : liveConditions.has_recent_rain ? "Recent" : "None"}
              </span>
            </div>

            {/* Moon Phase */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4A90E2" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
              <span style={{ fontSize: "0.55rem", fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>Phase</span>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#fff" }}>
                {derived.phase || "--"}
              </span>
            </div>
          </div>

          {outlookBlurb && (
            <div
              style={{
                marginTop: 24,
                paddingTop: 20,
                borderTop: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <p
                style={{
                  margin: 0,
                  lineHeight: 1.6,
                  fontSize: "1rem",
                  color: "rgba(255,255,255,0.85)",
                  fontStyle: "italic",
                }}
              >
                "{outlookBlurb}"
              </p>
            </div>
          )}
        </div>
      </div>

      {/* PREMIUM TACTICAL MODAL */}
      {activeCard && expansion && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(0,0,0,0.9)",
            backdropFilter: "blur(12px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
          onClick={() => setActiveCard(null)}
        >
          <div
            className="glass-panel"
            style={{
              width: "100%",
              maxWidth: 380,
              borderRadius: 24,
              background: "linear-gradient(180deg, rgba(15, 15, 20, 0.98) 0%, rgba(10, 10, 15, 0.99) 100%)",
              border: "1px solid rgba(74, 144, 226, 0.25)",
              boxShadow: "0 25px 80px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.05)",
              position: "relative",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top accent bar */}
            <div style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 3,
              background: activeCard === "temp" ? "linear-gradient(90deg, #60a5fa, #f87171)" :
                         activeCard === "wind" ? "linear-gradient(90deg, #4A90E2, #60a5fa)" :
                         activeCard === "pressure" ? "linear-gradient(90deg, #60a5fa, #4ade80, #f87171)" :
                         "linear-gradient(90deg, #facc15, #4A90E2)",
            }} />

            {/* Header */}
            <div style={{ padding: "24px 20px 16px", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                color: "#4A90E2",
                background: "rgba(74, 144, 226, 0.12)",
                padding: 10,
                borderRadius: 12,
              }}>
                {activeCard === "temp" && <ThermometerIcon size={24} />}
                {activeCard === "wind" && <WindIcon size={24} />}
                {activeCard === "pressure" && <ActivityIcon size={24} />}
                {activeCard === "light" && <CloudIcon size={24} />}
              </div>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0, color: "#fff", flex: 1 }}>
                {expansion.title}
              </h3>
              <button
                onClick={() => setActiveCard(null)}
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "none",
                  borderRadius: 8,
                  width: 32,
                  height: 32,
                  color: "rgba(255,255,255,0.5)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1rem",
                }}
              >
                ✕
              </button>
            </div>

            {/* Metrics Grid */}
            <div style={{
              padding: "0 20px 20px",
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 10,
            }}>
              {expansion.metrics.map((metric, i) => (
                <div
                  key={i}
                  style={{
                    background: metric.highlight ? "rgba(74, 144, 226, 0.1)" : "rgba(255,255,255,0.02)",
                    border: `1px solid ${metric.highlight ? "rgba(74, 144, 226, 0.25)" : "rgba(255,255,255,0.05)"}`,
                    borderRadius: 14,
                    padding: metric.highlight ? "16px 14px" : "12px 14px",
                    gridColumn: metric.highlight ? "span 2" : "span 1",
                  }}
                >
                  <div style={{
                    fontSize: "0.6rem",
                    fontWeight: 700,
                    color: "rgba(255,255,255,0.4)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    marginBottom: 4,
                  }}>
                    {metric.label}
                  </div>
                  <div style={{
                    fontSize: metric.highlight ? "1.8rem" : "1.1rem",
                    fontWeight: metric.highlight ? 800 : 700,
                    color: metric.highlight ? "#fff" : "rgba(255,255,255,0.85)",
                    lineHeight: 1,
                  }}>
                    {metric.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Trend Indicator */}
            {expansion.trend && (
              <div style={{
                margin: "0 20px 20px",
                padding: "12px 16px",
                background: expansion.trend.direction === "up" ? "rgba(74, 222, 128, 0.08)" :
                           expansion.trend.direction === "down" ? "rgba(96, 165, 250, 0.08)" :
                           "rgba(255,255,255,0.03)",
                border: `1px solid ${
                  expansion.trend.direction === "up" ? "rgba(74, 222, 128, 0.2)" :
                  expansion.trend.direction === "down" ? "rgba(96, 165, 250, 0.2)" :
                  "rgba(255,255,255,0.08)"
                }`,
                borderRadius: 12,
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}>
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: expansion.trend.direction === "up" ? "rgba(74, 222, 128, 0.15)" :
                             expansion.trend.direction === "down" ? "rgba(96, 165, 250, 0.15)" :
                             "rgba(255,255,255,0.05)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: expansion.trend.direction === "up" ? "#4ade80" :
                         expansion.trend.direction === "down" ? "#60a5fa" :
                         "rgba(255,255,255,0.5)",
                  fontSize: "1rem",
                }}>
                  {expansion.trend.direction === "up" ? "↑" : expansion.trend.direction === "down" ? "↓" : "→"}
                </div>
                <div>
                  <div style={{
                    fontSize: "0.55rem",
                    fontWeight: 700,
                    color: "rgba(255,255,255,0.4)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}>
                    Trend
                  </div>
                  <div style={{
                    fontSize: "0.9rem",
                    fontWeight: 700,
                    color: expansion.trend.direction === "up" ? "#4ade80" :
                           expansion.trend.direction === "down" ? "#60a5fa" : "#fff",
                  }}>
                    {expansion.trend.label}
                  </div>
                </div>
              </div>
            )}

            {/* Bass Behavior Insight */}
            <div style={{
              margin: "0 20px 24px",
              padding: "16px",
              background: "rgba(74, 144, 226, 0.05)",
              borderRadius: 14,
              borderLeft: "3px solid #4A90E2",
            }}>
              <div style={{
                fontSize: "0.6rem",
                fontWeight: 800,
                color: "#4A90E2",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: 10,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4M12 8h.01" />
                </svg>
                Bass Behavior
              </div>
              <p style={{
                margin: 0,
                fontSize: "0.95rem",
                lineHeight: 1.65,
                color: "rgba(255,255,255,0.85)",
                fontWeight: 450,
              }}>
                {expansion.insight}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// --- SUB-COMPONENT: Centered HUD Panel ---
function CompactHUD({ icon, label, value, subValue, onClick }: any) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "115px",
        padding: "16px 10px",
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 16,
        cursor: "pointer",
        transition: "all 0.2s ease",
      }}
    >
      <div style={{ color: "#4A90E2", marginBottom: 8, opacity: 0.9 }}>
        {icon}
      </div>
      <div
        style={{
          fontSize: "1.6rem",
          fontWeight: 800,
          color: "#fff",
          lineHeight: 1,
          marginBottom: 4,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: "0.65rem",
          fontWeight: 800,
          color: "rgba(255,255,255,0.4)",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {label}
      </div>
      {subValue && (
        <div
          style={{
            fontSize: "0.75rem",
            color: "#4A90E2",
            fontWeight: 600,
            marginTop: 4,
          }}
        >
          {subValue}
        </div>
      )}
    </button>
  );
}

// --- INSIGHT LOGIC ---
type ExpansionData = {
  title: string;
  metrics: { label: string; value: string; highlight?: boolean }[];
  trend?: { label: string; direction: "up" | "down" | "stable"; value?: string };
  insight: string;
};

function buildExpansion(card: CardId, conditions: PlanConditions): ExpansionData | null {
  const raw: any = conditions;
  const insights = raw.weather_card_insights || {};

  const insightForCard = (c: CardId): string | null => {
    if (c === "temp") return insights.temperature ?? null;
    if (c === "wind") return insights.wind ?? null;
    if (c === "pressure") return insights.pressure ?? null;
    if (c === "light") return insights.sky_uv ?? null;
    return null;
  };

  const tempF = numOrNull(raw.temp_f);
  const feelsLike = numOrNull(raw.feels_like_f);
  const low = numOrNull(raw.temp_low);
  const high = numOrNull(raw.temp_high);
  const wind = numOrNull(raw.wind_mph) ?? numOrNull(raw.wind_speed);
  const gust = numOrNull(raw.wind_gust_mph);
  const windDir = raw.wind_direction || "N";
  const pressureMb = numOrNull(raw.pressure_mb);
  const pressureTrend = (raw.pressure_trend || "Stable").toString();
  const cloudRaw = (raw.sky_condition ?? raw.cloud_cover ?? "Clear").toString();
  const uv = numOrNull(raw.uv_index);
  const humidity = numOrNull(raw.humidity);
  const visibility = numOrNull(raw.visibility_miles);

  const insight = insightForCard(card) ?? "Weather conditions may influence bass activity today.";

  if (card === "temp") {
    const tempTrend = raw.temp_trend || "Stable";
    const seasonContext = raw.temp_season_context || "";
    const waterTemp = numOrNull(raw.estimated_water_temp_f);
    let trendDir: "up" | "down" | "stable" = "stable";
    if (tempTrend.toLowerCase().includes("warming")) trendDir = "up";
    if (tempTrend.toLowerCase().includes("cooling")) trendDir = "down";

    const currentVal = tempF != null ? `${Math.round(tempF)}°F` : "--";
    const feelsVal = feelsLike != null ? `Feels ${Math.round(feelsLike)}°` : "--";
    const hiLoVal = (high != null && low != null) ? `${Math.round(low)}° / ${Math.round(high)}°` : "--";
    const waterVal = waterTemp != null ? `~${Math.round(waterTemp)}°F` : "--";
    const trendArrow = trendDir === "up" ? "↑" : trendDir === "down" ? "↓" : "→";

    return {
      title: "Temperature",
      metrics: [
        { label: "Current", value: currentVal, highlight: true },
        { label: "Feels Like", value: feelsVal },
        { label: "High / Low", value: `${hiLoVal} ${trendArrow}` },
        { label: "Est. Water", value: waterVal, highlight: true },
      ],
      trend: { label: seasonContext ? titleCase(seasonContext) : tempTrend, direction: trendDir, value: tempTrend },
      insight,
    };
  }

  if (card === "wind") {
    const pastWind = numOrNull(raw.past_wind_mph);
    let trendDir: "up" | "down" | "stable" = "stable";
    if (pastWind != null && wind != null) {
      if (wind > pastWind + 3) trendDir = "up";
      if (wind < pastWind - 3) trendDir = "down";
    }

    return {
      title: "Wind",
      metrics: [
        { label: "Sustained", value: wind != null ? `${Math.round(wind)} mph` : "--", highlight: true },
        { label: "Gusts", value: gust != null ? `${Math.round(gust)} mph` : "--" },
        { label: "Direction", value: windDir },
      ],
      trend: { label: trendDir === "up" ? "Building" : trendDir === "down" ? "Calming" : "Steady", direction: trendDir },
      insight,
    };
  }

  if (card === "pressure") {
    const mbToInHg = (mb: number): number => mb * 0.02953;
    const pressureInHg = pressureMb ? mbToInHg(pressureMb) : null;
    let trendDir: "up" | "down" | "stable" = "stable";
    if (pressureTrend.toLowerCase().includes("rising")) trendDir = "up";
    if (pressureTrend.toLowerCase().includes("falling")) trendDir = "down";

    return {
      title: "Barometric Pressure",
      metrics: [
        { label: "Current", value: pressureInHg != null ? `${pressureInHg.toFixed(2)} inHg` : "--", highlight: true },
      ],
      trend: { label: titleCase(pressureTrend), direction: trendDir },
      insight,
    };
  }

  if (card === "light") {
    // Use cloud_cover (description) for richer text, fallback to sky_condition
    const cloudDesc = (raw.cloud_cover ?? raw.sky_condition ?? "Clear").toString();
    const cloudPct = numOrNull(raw.cloud_pct);
    const dewPoint = numOrNull(raw.dew_point);

    // Light level assessment based on UV and clouds
    let lightLevel = "Bright";
    if (uv != null) {
      if (uv >= 8) lightLevel = "Intense";
      else if (uv >= 6) lightLevel = "Bright";
      else if (uv >= 3) lightLevel = "Moderate";
      else if (uv >= 1) lightLevel = "Low";
      else lightLevel = "Minimal";
    }

    // Cloud coverage label
    const cloudLabel = cloudPct != null ? `${cloudPct}%` : "--";

    return {
      title: "Sky & Light",
      metrics: [
        { label: "Conditions", value: titleCase(cloudDesc), highlight: true },
        { label: "Cloud Cover", value: cloudLabel },
        { label: "UV Index", value: uv != null ? `${Math.round(uv)} (${lightLevel})` : "--" },
        { label: "Visibility", value: visibility != null ? `${Math.round(visibility)} mi` : "--" },
        { label: "Dew Point", value: dewPoint != null ? `${Math.round(dewPoint)}°` : "--" },
      ],
      insight,
    };
  }

  return null;
}

const LARGE_LAKES = new Set([
  "okeechobee",
  "fork",
  "lanier",
  "guntersville",
  "champlain",
  "eufaula",
]);
function getLakeZoom(lakeName: string): number {
  const normalized = lakeName
    .toLowerCase()
    .replace(/^lake\s+/i, "")
    .replace(/\s+reservoir$/i, "");
  for (const largeLake of LARGE_LAKES) {
    if (normalized.includes(largeLake)) return 11;
  }
  return 13;
}
