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

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL; // Ensure this is available in your .env

// Moving CardId to top-level scope to ensure accessibility in all functions
export type CardId = "temp" | "wind" | "pressure" | "light";

export type PlanConditions = {
  trip_date: string;
  location_name: string;
  latitude: number;
  longitude: number;
  temp_f?: number | null;
  temp_low?: number | null;
  temp_high?: number | null;
  wind_mph?: number | null;
  wind_speed?: number | null;
  wind_direction?: string | null;
  uv_index?: number | null;
  cloud_cover?: string | null;
  sky_condition?: string | null;
  pressure_mb?: number | null;
  pressure_trend?: string | null;
  phase?: string | null;
  weather_card_insights?: {
    temperature?: string | null;
    wind?: string | null;
    pressure?: string | null;
    sky_uv?: string | null;
  } | null;
  // Added Forecast Rating
  forecast_rating?: {
    score: number;
    rating: string;
    explanation: string;
  } | null;
  // Flat keys provided by Python backend
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
          `${API_BASE_URL}/weather/current?lat=${conditions.latitude}&lon=${conditions.longitude}`
        );

        if (res.ok) {
          const liveData = await res.json();

          // Merge live data with existing conditions
          setLiveConditions((prev) => ({
            ...prev,
            temp_f: liveData.temp_f ?? prev.temp_f,
            wind_speed: liveData.wind_speed ?? prev.wind_speed,
            wind_mph: liveData.wind_mph ?? prev.wind_mph,
            wind_direction: liveData.wind_direction ?? prev.wind_direction,
            pressure_mb: liveData.pressure_mb ?? prev.pressure_mb,
            pressure_trend: liveData.pressure_trend ?? prev.pressure_trend,
            sky_condition: liveData.sky_condition ?? prev.sky_condition,
            uv_index: liveData.uv_index ?? prev.uv_index,
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
    const low = numOrNull(raw.temp_low);
    const high = numOrNull(raw.temp_high);
    const tempPrimary =
      tempF != null
        ? `${Math.round(tempF)}°`
        : high != null
        ? `${Math.round(high)}°`
        : "--";
    const tempSecondary =
      low != null && high != null
        ? `L:${Math.round(low)}° H:${Math.round(high)}°`
        : "Forecast";

    // Wind Logic
    const wind = numOrNull(raw.wind_mph) ?? numOrNull(raw.wind_speed);
    const windPrimary = wind != null ? `${Math.round(wind)}` : "--";
    const windSecondary = raw.wind_direction
      ? `MPH • ${raw.wind_direction}`
      : "MPH";

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
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${conditions.longitude},${conditions.latitude}.json?types=place,region&access_token=${MAPBOX_TOKEN}`
        );
        const data = await res.json();
        if (data.features?.length > 0) {
          const place = data.features.find((f: any) =>
            f.id.startsWith("place")
          );
          if (place) setLocationCity(place.text || "");
          const region = data.features.find((f: any) =>
            f.id.startsWith("region")
          );
          if (region)
            setLocationState(
              region.text || region.short_code?.replace("US-", "") || ""
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
                  fontSize: "2rem",
                  fontWeight: 800,
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

          {/* 4-PANEL HUD GRID (Centered & Consolidated) */}
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <CompactHUD
              icon={<ThermometerIcon size={22} />}
              label="Temperature"
              value={derived.tempPrimary}
              subValue={derived.tempSecondary}
              onClick={() => setActiveCard("temp")}
            />
            <CompactHUD
              icon={<WindIcon size={22} />}
              label="Wind"
              value={derived.windPrimary}
              subValue={derived.windSecondary}
              onClick={() => setActiveCard("wind")}
            />
            <CompactHUD
              icon={<ActivityIcon size={22} />}
              label="Pressure"
              value={derived.pressurePrimary}
              subValue={derived.pressureSecondary}
              onClick={() => setActiveCard("pressure")}
            />
            <CompactHUD
              icon={<CloudIcon size={22} />}
              label="Sky & UV"
              value={derived.lightPrimary}
              subValue={`UV Index: ${derived.uvValue}`}
              onClick={() => setActiveCard("light")}
            />
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

      {/* TACTICAL MODAL: Details Restored */}
      {activeCard && expansion && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(0,0,0,0.85)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
          onClick={() => setActiveCard(null)}
        >
          <div
            className="glass-panel"
            style={{
              width: "100%",
              maxWidth: 440,
              borderRadius: 28,
              padding: "32px 24px",
              background: "rgba(10, 10, 10, 0.98)",
              border: "1px solid rgba(74, 144, 226, 0.3)",
              boxShadow: "0 25px 80px rgba(0,0,0,0.8)",
              position: "relative",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage: `radial-gradient(rgba(74, 144, 226, 0.05) 1px, transparent 1px)`,
                backgroundSize: "30px 30px",
                opacity: 0.5,
                pointerEvents: "none",
              }}
            />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                marginBottom: 28,
                position: "relative",
              }}
            >
              <div
                style={{
                  color: "#4A90E2",
                  background: "rgba(74, 144, 226, 0.15)",
                  padding: 12,
                  borderRadius: "50%",
                }}
              >
                {activeCard === "temp" && <ThermometerIcon size={28} />}
                {activeCard === "wind" && <WindIcon size={28} />}
                {activeCard === "pressure" && <ActivityIcon size={28} />}
                {activeCard === "light" && <CloudIcon size={28} />}
              </div>
              <h3
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 800,
                  margin: 0,
                  color: "#fff",
                }}
              >
                {expansion.title}
              </h3>
              <button
                onClick={() => setActiveCard(null)}
                style={{
                  marginLeft: "auto",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "50%",
                  width: 34,
                  height: 34,
                  color: "#fff",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ✕
              </button>
            </div>
            {expansion.numbers && expansion.numbers.length > 0 && (
              <div
                style={{
                  marginBottom: 28,
                  padding: 24,
                  background: "rgba(74, 144, 226, 0.08)",
                  borderRadius: 20,
                  border: "1px solid rgba(74, 144, 226, 0.2)",
                }}
              >
                {expansion.numbers.map((num, i) => (
                  <div
                    key={i}
                    style={{
                      fontSize: i === 0 ? "2.1rem" : "1.2rem",
                      fontWeight: i === 0 ? 800 : 600,
                      color: i === 0 ? "#fff" : "rgba(255,255,255,0.7)",
                      marginBottom: i === 0 ? 8 : 4,
                    }}
                  >
                    {num}
                  </div>
                ))}
              </div>
            )}
            <div style={{ position: "relative" }}>
              <h4
                style={{
                  fontSize: "0.85rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.15em",
                  color: "#4A90E2",
                  marginBottom: 16,
                  fontWeight: 800,
                }}
              >
                Tactical Insight
              </h4>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 16 }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: "1rem",
                    lineHeight: 1.6,
                    color: "rgba(255,255,255,0.8)",
                    fontWeight: 500,
                  }}
                >
                  {expansion.insight}
                </p>
              </div>
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

// --- LOGIC: TACTICAL INSIGHTS (LLM-DRIVEN) ---
// Modal insight is now supplied directly by the backend LLM as `weather_card_insights`.
// We do NOT keyword-match or generate fallback bullet lists here.
// Contract: show the main metric data + a single 1–2 sentence insight (no numbers, no tactics).
function buildExpansion(card: CardId, conditions: PlanConditions) {
  console.log("===== BUILD EXPANSION CALLED =====");
  console.log("Card:", card);
  console.log("Conditions:", conditions);

  const raw: any = conditions;

  // Map UI cards to backend insight keys
  const insights = raw.weather_card_insights || {};
  console.log("Insights object:", insights);
  console.log("insights.temperature:", insights.temperature);
  console.log("insights.wind:", insights.wind);
  console.log("insights.pressure:", insights.pressure);
  console.log("insights.sky_uv:", insights.sky_uv);

  const insightForCard = (c: CardId): string | null => {
    if (c === "temp") return insights.temperature ?? null;
    if (c === "wind") return insights.wind ?? null;
    if (c === "pressure") return insights.pressure ?? null;
    if (c === "light") return insights.sky_uv ?? null;
    return null;
  };

  const tempF = numOrNull(raw.temp_f);
  const low = numOrNull(raw.temp_low);
  const high = numOrNull(raw.temp_high);

  const wind = numOrNull(raw.wind_mph) ?? numOrNull(raw.wind_speed);

  const pressureMb = numOrNull(raw.pressure_mb);
  const pressureTrend = (raw.pressure_trend || "").toString();

  const cloudRaw = (raw.sky_condition ?? raw.cloud_cover ?? "").toString();
  const uv = numOrNull(raw.uv_index);

  const numbers: string[] = [];
  const insight =
    insightForCard(card) ??
    "Weather conditions may influence bass activity today.";

  if (card === "temp") {
    if (tempF != null) numbers.push(`${Math.round(tempF)}°F`);
    if (low != null && high != null)
      numbers.push(`${Math.round(low)}° / ${Math.round(high)}°`);
    return {
      title: "Temperature",
      numbers,
      insight,
    };
  }

  if (card === "wind") {
    if (wind != null) numbers.push(`${Math.round(wind)} mph`);
    return {
      title: "Wind",
      numbers,
      insight,
    };
  }

  if (card === "pressure") {
    if (pressureMb != null) numbers.push(`${Math.round(pressureMb)} mb`);
    if (pressureTrend) numbers.push(titleCase(pressureTrend));
    return {
      title: "Pressure",
      numbers,
      insight,
    };
  }

  // card === "light"
  if (cloudRaw) numbers.push(titleCase(cloudRaw));
  if (uv != null) numbers.push(`UV Index: ${Math.round(uv)}`);
  return {
    title: "Sky & UV",
    numbers,
    insight,
  };
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
