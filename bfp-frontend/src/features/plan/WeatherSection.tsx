// src/features/plan/WeatherSection.tsx
// REFINED: Balanced Hierarchy, Data-Rich Cards, Watermark Visuals
// NOW CONNECTED TO BACKEND INTELLIGENCE (weather_insights)

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

const ACCENT = "#4A90E2";
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

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
  pressure?: number | null;
  pressure_mbar?: number | null;
  pressure_trend?: "rising" | "falling" | "stable" | string | null;
  pressureTrend?: "rising" | "falling" | "stable" | string | null;
  phase?: string | null;
  precipitation_1h?: number | null;
  has_recent_rain?: boolean | null;
  humidity?: number | null;
  moon_phase?: string | null;
  moon_illumination?: number | null;
  is_major_period?: boolean | null;
  // ✅ NEW: Receive the smart insights from the backend
  weather_insights?: string[] | null;
};

export function WeatherSection({
  conditions,
  outlookBlurb,
}: {
  conditions: PlanConditions;
  outlookBlurb?: string | null;
}) {
  type CardId = "temp" | "wind" | "pressure" | "light";
  const [locationCity, setLocationCity] = useState<string>("");
  const [locationState, setLocationState] = useState<string>("");
  const hasGeocodedRef = useRef(false);
  const [activeCard, setActiveCard] = useState<CardId | null>(null);

  // 1. DATA PROCESSING
  const derived = useMemo(() => {
    const raw: any = conditions as any;

    // Temp
    const tempF = numOrNull(raw.temp_f);
    const low = numOrNull(raw.temp_low);
    const high = numOrNull(raw.temp_high);
    const tempPrimary =
      tempF != null
        ? `${Math.round(tempF)}°`
        : low != null && high != null
        ? `${Math.round(high)}°`
        : "--";
    const tempSecondary =
      low != null && high != null
        ? `L:${Math.round(low)}° H:${Math.round(high)}°`
        : "Forecast";

    // Wind
    const wind =
      numOrNull(raw.wind_mph) ??
      numOrNull(raw.wind_speed) ??
      numOrNull(raw.wind) ??
      numOrNull(raw.weather_snapshot?.wind_mph) ??
      numOrNull(raw.weather?.wind_mph);
    const windDir = raw.wind_direction ?? raw.weather?.wind_direction ?? "";
    const windPrimary = wind != null ? `${Math.round(wind)}` : "--";
    const windSecondary = windDir ? `MPH • ${windDir}` : "MPH";

    // Pressure
    const pressureMb =
      numOrNull(raw.pressure_mb) ??
      numOrNull(raw.pressure_mbar) ??
      numOrNull(raw.pressure) ??
      numOrNull(raw.weather_snapshot?.pressure_mb) ??
      numOrNull(raw.weather?.pressure_mb);
    let pTrend = (
      raw.pressure_trend ??
      raw.pressureTrend ??
      raw.weather_snapshot?.pressure_trend ??
      ""
    )
      .toString()
      .toLowerCase();

    if (!pTrend && pressureMb != null) {
      pTrend =
        pressureMb > 1016 ? "High" : pressureMb < 1008 ? "Low" : "Steady";
    }
    const pressurePrimary =
      pressureMb != null ? `${Math.round(pressureMb)}` : "--";
    const pressureSecondary = pTrend ? `MB • ${titleCase(pTrend)}` : "MB";

    // Light
    const cloudRaw = (
      raw.cloud_cover ??
      raw.sky_condition ??
      raw.weather_snapshot?.cloud_cover ??
      raw.weather?.cloud_cover ??
      ""
    )
      .toString()
      .replace(/_/g, " ")
      .toLowerCase();
    const uv =
      numOrNull(raw.uv_index) ?? numOrNull(raw.weather_snapshot?.uv_index);
    const lightPrimary = cloudRaw ? titleCase(cloudRaw) : "Clear";
    const lightSecondary = uv != null ? `UV: ${Math.round(uv)}` : "Visibility";

    return {
      tempPrimary,
      tempSecondary,
      windPrimary,
      windSecondary,
      pressurePrimary,
      pressureSecondary,
      lightPrimary,
      lightSecondary,
      phase: conditions.phase ? titleCase(String(conditions.phase)) : "",
    };
  }, [conditions]);

  const expansion = useMemo(() => {
    if (!activeCard) return null;
    return buildExpansion(activeCard, conditions);
  }, [activeCard, conditions]);

  const lakeZoom = getLakeZoom(conditions.location_name);

  // 2. GEOCODING
  useEffect(() => {
    if (hasGeocodedRef.current) return;
    async function getCityState() {
      if (!MAPBOX_TOKEN) return;
      try {
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${conditions.longitude},${conditions.latitude}.json?types=place,region&access_token=${MAPBOX_TOKEN}`
        );
        const data = await res.json();
        if (data.features && data.features.length > 0) {
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
      } catch (error) {
        console.error("Failed to get location:", error);
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
          background:
            "linear-gradient(145deg, rgba(74, 144, 226, 0.04) 0%, rgba(10, 10, 10, 0.4) 100%)",
          border: "1px solid rgba(74, 144, 226, 0.12)",
          boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
          marginTop: -10,
        }}
      >
        {/* HEADER: Satellite Background */}
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
                filter: "brightness(0.75) saturate(1.1) contrast(1.1)",
              }}
            />
          )}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.8) 100%)",
            }}
          />

          <div
            style={{
              position: "relative",
              padding: "24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontSize: "0.85rem",
                fontWeight: 700,
                letterSpacing: "0.05em",
                color: "rgba(255,255,255,0.9)",
                textTransform: "uppercase",
              }}
            >
              {conditions.trip_date}
            </span>
            {derived.phase && (
              <span
                style={{
                  fontSize: "0.75rem",
                  background: "rgba(74, 144, 226, 0.2)",
                  border: "1px solid rgba(74, 144, 226, 0.4)",
                  color: "#fff",
                  padding: "4px 10px",
                  borderRadius: 20,
                  fontWeight: 600,
                  textTransform: "capitalize",
                }}
              >
                {derived.phase}
              </span>
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
                  textShadow: "0 2px 10px rgba(0,0,0,0.5)",
                }}
              >
                {conditions.location_name}
              </h2>
            </div>
            {(locationCity || locationState) && (
              <div
                style={{
                  fontSize: "1.05rem",
                  color: "rgba(255,255,255,0.8)",
                  paddingLeft: 34,
                }}
              >
                {locationCity && locationState
                  ? `${locationCity}, ${locationState}`
                  : locationCity || locationState}
              </div>
            )}
          </div>
        </div>

        <div style={{ padding: "24px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <h3
              style={{
                fontSize: "0.8rem",
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                color: "rgba(255,255,255,0.5)",
                fontWeight: 700,
                margin: 0,
              }}
            >
              Current Conditions
            </h3>
            {/* Visual Indicator that backend intelligence is active */}
            {conditions.weather_insights &&
              conditions.weather_insights.length > 0 && (
                <span
                  style={{
                    fontSize: "0.7rem",
                    color: "#4A90E2",
                    background: "rgba(74, 144, 226, 0.1)",
                    padding: "2px 8px",
                    borderRadius: 4,
                  }}
                >
                  AI ANALYSIS ACTIVE
                </span>
              )}
          </div>

          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <MinimalCard
              icon={<ThermometerIcon size={32} />}
              label="Temperature"
              value={derived.tempPrimary}
              subValue={derived.tempSecondary}
              onClick={() => setActiveCard("temp")}
            />
            <MinimalCard
              icon={<WindIcon size={32} />}
              label="Wind"
              value={derived.windPrimary}
              subValue={derived.windSecondary}
              onClick={() => setActiveCard("wind")}
            />
            <MinimalCard
              icon={<ActivityIcon size={32} />}
              label="Pressure"
              value={derived.pressurePrimary}
              subValue={derived.pressureSecondary}
              onClick={() => setActiveCard("pressure")}
            />
            <MinimalCard
              icon={<CloudIcon size={32} />}
              label="Light"
              value={derived.lightPrimary}
              subValue={derived.lightSecondary}
              onClick={() => setActiveCard("light")}
            />
          </div>

          {outlookBlurb && (
            <div
              style={{
                marginTop: 24,
                paddingTop: 20,
                borderTop: "1px solid rgba(255,255,255,0.08)",
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

      {activeCard && expansion && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(6px)",
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
              borderRadius: 24,
              padding: "32px 24px",
              background: "rgba(12, 14, 18, 0.95)",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "0 20px 80px rgba(0,0,0,0.7)",
              position: "relative",
              overflow: "hidden",
              transform: "translateY(0)",
              animation: "slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                position: "absolute",
                top: -20,
                right: -20,
                opacity: 0.05,
                transform: "rotate(-15deg)",
                pointerEvents: "none",
              }}
            >
              {activeCard === "temp" && <ThermometerIcon size={200} />}
              {activeCard === "wind" && <WindIcon size={200} />}
              {activeCard === "pressure" && <ActivityIcon size={200} />}
              {activeCard === "light" && <CloudIcon size={200} />}
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 24,
                position: "relative",
              }}
            >
              <div
                style={{
                  color: "#4A90E2",
                  background: "rgba(74, 144, 226, 0.1)",
                  padding: 10,
                  borderRadius: "50%",
                  boxShadow: "0 0 15px rgba(74, 144, 226, 0.2)",
                }}
              >
                {activeCard === "temp" && <ThermometerIcon size={28} />}
                {activeCard === "wind" && <WindIcon size={28} />}
                {activeCard === "pressure" && <ActivityIcon size={28} />}
                {activeCard === "light" && <CloudIcon size={28} />}
              </div>
              <h3
                style={{
                  fontSize: "1.4rem",
                  fontWeight: 700,
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
                  width: 32,
                  height: 32,
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
                  marginBottom: 24,
                  padding: 20,
                  background:
                    "linear-gradient(135deg, rgba(74, 144, 226, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)",
                  borderRadius: 16,
                  border: "1px solid rgba(74, 144, 226, 0.2)",
                  position: "relative",
                }}
              >
                {expansion.numbers.map((num, i) => (
                  <div
                    key={i}
                    style={{
                      fontSize: i === 0 ? "1.8rem" : "1.1rem",
                      fontWeight: i === 0 ? 800 : 500,
                      color: i === 0 ? "#fff" : "rgba(255,255,255,0.7)",
                      marginBottom: i === 0 ? 6 : 4,
                      lineHeight: 1.2,
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
                  letterSpacing: "0.1em",
                  color: "rgba(255,255,255,0.4)",
                  marginBottom: 12,
                }}
              >
                Tactical Insight
              </h4>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 14 }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: "1rem",
                    lineHeight: 1.5,
                    color: "#fff",
                    fontWeight: 500,
                  }}
                >
                  {expansion.summary}
                </p>
                {expansion.details.map((detail, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      gap: 12,
                      alignItems: "flex-start",
                    }}
                  >
                    <div
                      style={{
                        minWidth: 6,
                        height: 6,
                        marginTop: 8,
                        borderRadius: "50%",
                        background: "#4A90E2",
                      }}
                    />
                    <p
                      style={{
                        margin: 0,
                        fontSize: "0.95rem",
                        lineHeight: 1.5,
                        color: "rgba(255,255,255,0.7)",
                      }}
                    >
                      {detail}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </>
  );
}

// --- SUB-COMPONENT: Minimal Card ---
function MinimalCard({
  icon,
  label,
  value,
  subValue,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue?: string | null;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 12px",
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 16,
        cursor: "pointer",
        position: "relative",
        overflow: "hidden",
        transition: "all 0.2s ease",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.background = "rgba(255,255,255,0.06)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.background = "rgba(255,255,255,0.03)")
      }
    >
      <div
        style={{
          position: "absolute",
          bottom: -10,
          right: -10,
          opacity: 0.05,
          transform: "rotate(-15deg)",
          pointerEvents: "none",
          color: "#fff",
        }}
      >
        {React.cloneElement(icon as React.ReactElement, { size: 80 })}
      </div>

      <div
        style={{
          color: "#4A90E2",
          marginBottom: 10,
          filter: "drop-shadow(0 0 10px rgba(74,144,226,0.3))",
          position: "relative",
        }}
      >
        {icon}
      </div>
      <div
        style={{
          fontSize: "1.5rem",
          fontWeight: 800,
          color: "#fff",
          lineHeight: 1,
          marginBottom: 6,
          position: "relative",
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: "0.75rem",
          fontWeight: 700,
          color: "rgba(255,255,255,0.5)",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          marginBottom: 4,
          position: "relative",
        }}
      >
        {label}
      </div>
      {subValue && (
        <div
          style={{
            fontSize: "0.75rem",
            color: "rgba(255,255,255,0.6)",
            fontWeight: 500,
            maxWidth: "100%",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            position: "relative",
          }}
        >
          {subValue}
        </div>
      )}
    </button>
  );
}

// --- LOGIC: EXPANSION & HELPERS ---
type Expansion = {
  title: string;
  summary: string;
  numbers?: string[];
  details: string[];
};

// ✅ UPDATED: Now looks for 'weather_insights' from Backend
function buildExpansion(
  card: "temp" | "wind" | "pressure" | "light",
  conditions: PlanConditions
): Expansion {
  const raw: any = conditions as any;
  // Get the smart insights if available
  const insights = conditions.weather_insights || [];

  // Helper to find specific insights relevant to the card
  const getInsightsFor = (keyword: string) => {
    return insights.filter((i) =>
      i.toLowerCase().includes(keyword.toLowerCase())
    );
  };

  // Extract Raw Data
  const tempF = numOrNull(raw.temp_f);
  const low = numOrNull(raw.temp_low);
  const high = numOrNull(raw.temp_high);
  const wind =
    numOrNull(raw.wind_mph) ??
    numOrNull(raw.wind_speed) ??
    numOrNull(raw.wind) ??
    numOrNull(raw.weather_snapshot?.wind_mph) ??
    numOrNull(raw.weather?.wind_mph);
  const pressureMb =
    numOrNull(raw.pressure_mb) ??
    numOrNull(raw.pressure_mbar) ??
    numOrNull(raw.pressure) ??
    numOrNull(raw.weather_snapshot?.pressure_mb) ??
    numOrNull(raw.weather?.pressure_mb);

  let pressureTrend = (
    raw.pressure_trend ??
    raw.pressureTrend ??
    raw.weather_snapshot?.pressure_trend ??
    ""
  )
    .toString()
    .toLowerCase();

  const uv =
    numOrNull(raw.uv_index) ??
    numOrNull(raw.weather_snapshot?.uv_index) ??
    numOrNull(raw.weather?.uv_index);
  const cloudRaw = (
    raw.cloud_cover ??
    raw.sky_condition ??
    raw.weather_snapshot?.cloud_cover ??
    raw.weather?.cloud_cover ??
    ""
  )
    .toString()
    .replace(/_/g, " ")
    .toLowerCase();

  const numbers: string[] = [];
  const details: string[] = [];
  const swing = low != null && high != null ? high - low : null;

  if (card === "temp") {
    if (tempF != null) numbers.push(`${Math.round(tempF)}°F Current`);
    if (low != null && high != null)
      numbers.push(`${Math.round(low)}° – ${Math.round(high)}°F Range`);
    if (swing != null) numbers.push(`${Math.round(swing)}° Swing`);

    const summary =
      tempF != null
        ? `Current conditions are ${Math.round(tempF)}°F.`
        : "Temperature data is limited for this location.";

    // Logic: Fallback to generic if no specific AI insight, OR append generic helpful info
    if (low != null && high != null) {
      if (swing != null && swing >= 10) {
        details.push(
          "Large temperature swing: Expect activity to increase as water warms."
        );
      } else {
        details.push(
          "Stable temperature: Expect consistent behavior throughout the day."
        );
      }
    }
    return { title: "Temperature", summary, numbers, details };
  }

  if (card === "wind") {
    if (wind == null)
      return { title: "Wind", summary: "Wind data unavailable", details: [] };

    numbers.push(`${Math.round(wind)} mph`);
    const risk = wind <= 8 ? "Low Risk" : wind <= 15 ? "Caution" : "High Risk";
    numbers.push(risk);

    const summary = `Wind is ${Math.round(wind)} mph.`;

    // ✅ SMART INTEGRATION: Use backend insights if available
    const windInsights = getInsightsFor("wind");
    if (windInsights.length > 0) {
      details.push(...windInsights);
    } else {
      // Fallback Logic
      if (wind <= 8) {
        details.push(
          "Calm conditions: Finesse presentations and slow moving baits are key."
        );
      } else if (wind <= 15) {
        details.push(
          "Active chop: Spinnerbaits and crankbaits on wind-blown banks."
        );
      } else {
        details.push(
          "High wind: Bass will be positioned on distinct wind-blown structural elements."
        );
      }
    }
    return { title: "Wind", summary, numbers, details };
  }

  if (card === "pressure") {
    if (pressureMb == null)
      return {
        title: "Pressure",
        summary: "Pressure data unavailable",
        details: [],
      };

    numbers.push(`${Math.round(pressureMb)} mb`);
    if (!pressureTrend)
      pressureTrend =
        pressureMb > 1015 ? "rising" : pressureMb < 1010 ? "falling" : "stable";
    numbers.push(titleCase(pressureTrend));

    const summary = `Barometric pressure is ${pressureTrend}.`;

    // ✅ SMART INTEGRATION: Use backend insights if available
    const pressInsights = getInsightsFor("pressure");
    if (pressInsights.length > 0) {
      details.push(...pressInsights);
    } else {
      // Fallback Logic
      if (pressureTrend === "falling") {
        details.push(
          "Falling pressure often triggers an aggressive feeding window."
        );
      } else if (pressureTrend === "rising") {
        details.push(
          "Rising pressure (post-frontal) usually pushes fish tight to cover."
        );
      } else {
        details.push("Stable pressure means predictable behavior.");
      }
    }
    return { title: "Pressure", summary, numbers, details };
  }

  if (card === "light") {
    const sky = cloudRaw ? titleCase(cloudRaw) : "Clear";
    numbers.push(sky);
    if (uv != null) numbers.push(`UV Index: ${Math.round(uv)}`);

    const summary = cloudRaw.includes("overcast")
      ? "Low light conditions."
      : "High visibility conditions.";

    // ✅ SMART INTEGRATION: Use backend insights if available
    // Look for keywords: UV, Visibility, Light, Fog
    const lightInsights = [
      ...getInsightsFor("UV"),
      ...getInsightsFor("Visibility"),
      ...getInsightsFor("Fog"),
      ...getInsightsFor("Light"),
    ];
    // Deduplicate
    const uniqueLightInsights = Array.from(new Set(lightInsights));

    if (uniqueLightInsights.length > 0) {
      details.push(...uniqueLightInsights);
    } else {
      // Fallback Logic
      if (cloudRaw.includes("overcast") || cloudRaw.includes("rain")) {
        details.push(
          "Low Light: Bass roam more freely. Topwater and moving baits are excellent."
        );
        details.push(
          "Colors: Use darker profiles (Black/Blue, Junebug) for contrast."
        );
      } else {
        details.push(
          "Bright Sun: Bass will hold tight to shade (docks, mats, laydowns)."
        );
        details.push(
          "Colors: Natural and translucent shades (Green Pumpkin, Ghost Shad) are best."
        );
      }
    }
    return { title: "Light & Sky", summary, numbers, details };
  }

  return { title: "Conditions", summary: "", details: [] };
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
