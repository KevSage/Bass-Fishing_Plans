// src/features/plan/WeatherSection.tsx
// FIXED: Modal doesn't obscure screen + Pressure data debugging

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ThermometerIcon,
  WindIcon,
  CloudIcon,
  MapPinIcon,
  ActivityIcon,
} from "@/components/UnifiedIcons";

// --- helpers ----------------------------------------------------
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

  // Temperature
  temp_f?: number | null;
  temp_low?: number | null;
  temp_high?: number | null;

  // Wind
  wind_mph?: number | null;
  wind_speed?: number | null; // legacy

  // Light / sky
  uv_index?: number | null;
  cloud_cover?: string | null;
  sky_condition?: string | null; // legacy

  // Pressure
  pressure_mb?: number | null;
  pressure?: number | null; // legacy/alt
  pressure_mbar?: number | null; // alt
  pressure_trend?: "rising" | "falling" | "stable" | string | null;
  pressureTrend?: "rising" | "falling" | "stable" | string | null; // alt

  // Supporting signals
  precipitation_1h?: number | null;
  has_recent_rain?: boolean | null;
  humidity?: number | null;
  moon_phase?: string | null;
  moon_illumination?: number | null;
  is_major_period?: boolean | null;

  // Phase
  phase?: string | null;
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

  const expansion = useMemo(() => {
    if (!activeCard) return null;
    return buildExpansion(activeCard, conditions);
  }, [activeCard, conditions]);

  const derived = useMemo(() => {
    const raw: any = conditions as any;

    // 🔍 TEMPORARY DEBUG - Remove after confirming pressure data
    console.log("=== PRESSURE DEBUG ===");
    console.log("Full conditions:", conditions);
    console.log("conditions.pressure_mb:", conditions.pressure_mb);
    console.log("raw.weather_snapshot:", raw.weather_snapshot);
    console.log("raw.weather:", raw.weather);
    console.log("=====================");

    // -------- Temperature --------
    const tempF = numOrNull(conditions.temp_f);
    const low = numOrNull(conditions.temp_low);
    const high = numOrNull(conditions.temp_high);
    const swing = low != null && high != null ? high - low : null;
    const tempLabel =
      swing == null
        ? ""
        : swing >= 10
        ? "Wide Swing"
        : swing >= 6
        ? "Moderate Swing"
        : "Stable";
    const tempPrimary =
      tempF != null
        ? `${Math.round(tempF)}°F`
        : low != null && high != null
        ? `${Math.round(low)}°–${Math.round(high)}°F`
        : "—";
    const tempSecondary =
      low != null && high != null
        ? `${Math.round(low)}°–${Math.round(high)}°F${
            tempLabel ? ` • ${tempLabel}` : ""
          }`
        : tempLabel;

    // -------- Wind --------
    const wind =
      numOrNull(raw.wind_mph) ??
      numOrNull(raw.wind_speed) ??
      numOrNull(raw.weather_snapshot?.wind_mph) ??
      numOrNull(raw.weather?.wind_mph);
    const windPrimary = wind != null ? `${Math.round(wind)} mph` : "—";
    const windRisk =
      wind == null
        ? ""
        : wind <= 8
        ? "Low Risk"
        : wind <= 15
        ? "Caution"
        : "High Risk";

    // -------- Pressure --------
    const pressureMb =
      numOrNull(raw.pressure_mb) ??
      numOrNull(raw.pressure_mbar) ??
      numOrNull(raw.pressure) ??
      numOrNull(raw.weather_snapshot?.pressure_mb) ??
      numOrNull(raw.weather?.pressure_mb) ??
      numOrNull(raw.snapshot?.pressure_mb) ??
      numOrNull(raw.main?.pressure) ??
      numOrNull(raw.current?.pressure) ??
      numOrNull(raw.openweather?.main?.pressure) ??
      numOrNull(raw.openweather?.current?.pressure);
    let pressureTrend = (
      raw.pressure_trend ??
      raw.pressureTrend ??
      raw.weather_snapshot?.pressure_trend ??
      ""
    )
      .toString()
      .toLowerCase();
    if (!pressureTrend && pressureMb != null) {
      pressureTrend =
        pressureMb > 1015 ? "rising" : pressureMb < 1010 ? "falling" : "stable";
    }
    const pressurePrimary =
      pressureMb != null ? `${Math.round(pressureMb)} mb` : "—";
    const pressureSecondary = pressureTrend ? titleCase(pressureTrend) : "";

    // -------- Light --------
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
    ).toString();
    const cloud = cloudRaw.replace(/_/g, " ").toLowerCase();
    const lightPrimary =
      uv != null
        ? `${Math.round(uv)}`
        : cloudRaw
        ? titleCase(cloudRaw.replace(/_/g, " "))
        : "—";
    const lightSecondary =
      uv != null ? uvLabel(uv, cloud) : lightLabelFromCloud(cloud);

    return {
      tempPrimary,
      tempSecondary,
      windPrimary,
      windSecondary: windRisk,
      pressurePrimary,
      pressureSecondary,
      lightPrimary,
      lightSecondary,
      phase: conditions.phase ? titleCase(String(conditions.phase)) : "",
    };
  }, [conditions]);

  const lakeZoom = getLakeZoom(conditions.location_name);

  useEffect(() => {
    if (hasGeocodedRef.current) return;

    async function getCityState() {
      if (!MAPBOX_TOKEN) return;

      try {
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${conditions.longitude},${conditions.latitude}.json?` +
            `types=place,region&access_token=${MAPBOX_TOKEN}`
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
          if (region) {
            const state =
              region.text || region.short_code?.replace("US-", "") || "";
            setLocationState(state);
          }

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
      {/* Weather Forecast Panel */}
      <div
        id="weather"
        className="card"
        style={{
          marginTop: 0,
          background:
            "linear-gradient(145deg, rgba(74, 144, 226, 0.04) 0%, rgba(10, 10, 10, 0.4) 100%)",
          border: "1px solid rgba(74, 144, 226, 0.12)",
          overflow: "hidden",
        }}
      >
        {/* Lake Background Header with Satellite Image */}
        <div
          style={{
            position: "relative",
            marginBottom: 24,
            borderRadius: "12px 12px 0 0",
            overflow: "hidden",
            background:
              "linear-gradient(135deg, rgba(74, 144, 226, 0.2) 0%, rgba(10, 10, 10, 0.8) 100%)",
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
                filter: "brightness(0.88) saturate(1.15) contrast(1.08)",
              }}
            />
          )}

          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.5) 100%)",
            }}
          />

          {/* Date + Phase Badge */}
          <div
            style={{
              position: "relative",
              padding: "20px 20px 0",
              marginBottom: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              fontSize: "0.9rem",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: ACCENT,
              fontWeight: 600,
            }}
          >
            <span>{conditions.trip_date}</span>
            {derived.phase && (
              <span
                style={{
                  fontSize: "0.82rem",
                  padding: "6px 10px",
                  borderRadius: 999,
                  border: "1px solid rgba(74, 144, 226, 0.25)",
                  background: "rgba(74, 144, 226, 0.08)",
                  color: "rgba(255,255,255,0.92)",
                  letterSpacing: "0.06em",
                  whiteSpace: "nowrap",
                }}
              >
                {derived.phase}
              </span>
            )}
          </div>

          {/* Location */}
          <div
            style={{
              position: "relative",
              padding: "0 20px 20px",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div style={{ color: ACCENT }}>
              <MapPinIcon size={28} />
            </div>
            <div>
              <h2
                className="h2"
                style={{
                  margin: 0,
                  fontSize: "1.85em",
                  fontWeight: 700,
                  color: "#fff",
                  textShadow: "0 2px 8px rgba(0,0,0,0.5)",
                }}
              >
                {conditions.location_name}
              </h2>
              {(locationCity || locationState) && (
                <div
                  style={{
                    fontSize: "1.05em",
                    opacity: 0.95,
                    marginTop: 4,
                    color: "#fff",
                    textShadow: "0 1px 4px rgba(0,0,0,0.5)",
                  }}
                >
                  {locationCity && locationState
                    ? `${locationCity}, ${locationState}`
                    : locationCity || locationState}
                </div>
              )}
            </div>
          </div>
        </div>

        <h3
          style={{
            fontSize: "1.25em",
            fontWeight: 600,
            marginBottom: 18,
            color: "rgba(255, 255, 255, 0.95)",
          }}
        >
          Weather Forecast
        </h3>

        {/* Weather Grid */}
        <div
          className="weather-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: 16,
            marginBottom: 24,
          }}
        >
          <WeatherMiniCard
            icon={<ThermometerIcon size={20} />}
            label="Temperature"
            primary={derived.tempPrimary}
            secondary={derived.tempSecondary}
            onClick={() => setActiveCard("temp")}
          />

          <WeatherMiniCard
            icon={<WindIcon size={20} />}
            label="Wind"
            primary={derived.windPrimary}
            secondary={derived.windSecondary}
            onClick={() => setActiveCard("wind")}
          />

          <WeatherMiniCard
            icon={<ActivityIcon size={20} />}
            label="Pressure"
            primary={derived.pressurePrimary}
            secondary={derived.pressureSecondary}
            onClick={() => setActiveCard("pressure")}
          />

          <WeatherMiniCard
            icon={<CloudIcon size={20} />}
            label="Light"
            primary={derived.lightPrimary}
            secondary={derived.lightSecondary}
            onClick={() => setActiveCard("light")}
          />
        </div>

        {/* Outlook */}
        {outlookBlurb && (
          <div>
            <h4
              style={{
                fontSize: "1.3em",
                fontWeight: 600,
                marginBottom: 10,
                opacity: 0.8,
                display: "inline-block",
                paddingBottom: "6px",
                borderBottom: `3px solid ${ACCENT}`,
              }}
            >
              Conditions & Outlook
            </h4>
            <p
              style={{
                lineHeight: 1.7,
                fontSize: "1.2em",
                opacity: 0.9,
                margin: 0,
              }}
            >
              {outlookBlurb}
            </p>
          </div>
        )}
      </div>

      {/* FIXED MODAL CSS - Centered on all devices, lighter backdrop */}
      <style>{`
        @media (min-width: 768px) {
          .weather-grid {
            grid-template-columns: repeat(4, 1fr) !important;
          }
        }
        @media (max-width: 767px) {
          .weather-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      
        /* Modal: Centered on ALL devices (mobile + desktop same style) */
        .bc-sheetOverlay {
          position: fixed;
          inset: 0;
          z-index: 9999; /* Above bottom nav */
          display: flex;
          align-items: center; /* Center vertically */
          justify-content: center; /* Center horizontally */
          padding: 20px;
        }
        
        .bc-sheetPanel {
          position: relative;
          width: min(580px, calc(100vw - 40px));
          max-height: min(85vh, 700px);
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(12,14,18,0.96);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border-radius: 18px;
          box-shadow: 0 20px 80px rgba(0,0,0,0.7);
        }

        .bc-sheetBackdrop {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.4); /* Lighter backdrop - was 0.6 */
          backdrop-filter: blur(3px);
          -webkit-backdrop-filter: blur(3px);
          border: 0;
          padding: 0;
          width: 100%;
          height: 100%;
          cursor: pointer;
        }
        
        /* Mobile adjustments */
        @media (max-width: 767px) {
          .bc-sheetPanel {
            width: calc(100vw - 32px);
            max-height: 80vh;
          }
        }
      `}</style>

      {/* Bottom sheet expansion */}
      {activeCard && expansion && (
        <BottomSheet
          title={expansion.title}
          onClose={() => setActiveCard(null)}
        >
          <div style={{ display: "grid", gap: 14 }}>
            <div
              style={{
                fontSize: "1.02rem",
                lineHeight: 1.45,
                color: "rgba(255,255,255,0.92)",
                fontWeight: 600,
              }}
            >
              {expansion.summary}
            </div>

            {expansion.numbers?.length ? (
              <div
                style={{
                  padding: 12,
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background:
                    "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
                }}
              >
                <div
                  style={{
                    fontSize: ".82rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "rgba(255,255,255,0.55)",
                    fontWeight: 700,
                    marginBottom: 8,
                  }}
                >
                  Details
                </div>
                <div style={{ display: "grid", gap: 6 }}>
                  {expansion.numbers.map((line) => (
                    <div
                      key={line}
                      style={{
                        color: "rgba(255,255,255,0.9)",
                        fontSize: "0.95rem",
                        lineHeight: 1.25,
                      }}
                    >
                      {line}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <Section title="What this means today" items={expansion.details} />
          </div>
        </BottomSheet>
      )}
    </>
  );
}

type Expansion = {
  title: string;
  summary: string;
  numbers?: string[];
  details: string[];
};

function buildExpansion(
  card: "temp" | "wind" | "pressure" | "light",
  conditions: PlanConditions
): Expansion {
  const raw: any = conditions as any;

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
    numOrNull(raw.weather?.pressure_mb) ??
    numOrNull(raw.snapshot?.pressure_mb) ??
    numOrNull(raw.main?.pressure) ??
    numOrNull(raw.current?.pressure) ??
    numOrNull(raw.openweather?.main?.pressure) ??
    numOrNull(raw.openweather?.current?.pressure);

  let pressureTrend = (
    raw.pressure_trend ??
    raw.pressureTrend ??
    raw.weather_snapshot?.pressure_trend ??
    raw.weather?.pressure_trend ??
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

  const unavailable = (title: string): Expansion => ({
    title,
    summary: "This data point isn't available in today's snapshot.",
    numbers: [],
    details: [
      "If this keeps happening, it usually means the value isn't being sent from the backend weather snapshot.",
    ],
  });

  const swing = low != null && high != null ? high - low : null;

  if (card === "temp") {
    if (tempF != null) numbers.push(`Now: ${Math.round(tempF)}°F`);
    if (low != null && high != null)
      numbers.push(`Range: ${Math.round(low)}°–${Math.round(high)}°F`);
    if (swing != null) numbers.push(`Swing: ${Math.round(swing)}°`);

    const summaryParts: string[] = [];
    if (tempF != null) summaryParts.push(`Now: ${Math.round(tempF)}°F.`);
    if (low != null && high != null) {
      summaryParts.push(
        `Today runs ${Math.round(low)}°–${Math.round(high)}°F${
          swing != null ? ` (${Math.round(swing)}° swing)` : ""
        }.`
      );
    }
    const summary =
      summaryParts.length > 0
        ? summaryParts.join(" ")
        : "Temperature data isn't available in today's snapshot.";

    if (low != null && high != null) {
      details.push(
        `That ${
          swing != null ? `${Math.round(swing)}°` : ""
        } range means the day will shift a bit as conditions warm up.`
      );

      if (swing != null && swing >= 10) {
        details.push(
          "On bigger warm-up days, bass activity often builds as the water responds."
        );
        details.push(
          "You may notice the day feels different early vs later, instead of staying flat."
        );
      } else if (swing != null && swing >= 6) {
        details.push(
          "A moderate warm-up usually nudges activity upward gradually."
        );
        details.push("Conditions change, but not dramatically hour to hour.");
      } else {
        details.push(
          "With a tight range, activity is more likely to stay steady."
        );
        details.push(
          "The day tends to feel consistent instead of changing a lot."
        );
      }
    } else {
      details.push(
        "We don't have a full low/high range for today, so we can't describe how much the day changes."
      );
      details.push(
        "If you include daily low/high temps in the snapshot, this becomes much more specific."
      );
    }

    return { title: "Temperature", summary, numbers, details };
  }

  if (card === "wind") {
    if (wind == null) return unavailable("Wind");

    const windRounded = Math.round(wind);
    numbers.push(`Wind: ${windRounded} mph`);

    const safety =
      wind <= 8 ? "Low risk" : wind <= 15 ? "Caution" : "High risk";
    numbers.push(`Safety: ${titleCase(safety)}`);

    const summary = `Wind is around ${windRounded} mph.`;

    if (wind <= 8) {
      details.push("Wind is light, so the lake feels stable and easy to read.");
      details.push("Bass positioning is less disrupted by wind-driven change.");
      details.push("Overall, the day is more predictable than reactive.");
    } else if (wind <= 15) {
      details.push(
        "Wind is noticeable, and it can change how different areas fish."
      );
      details.push("Bass positioning may be more influenced by wind exposure.");
      details.push("The lake can feel more dynamic than a calm day.");
    } else {
      details.push(
        "Wind is strong, and conditions can shift quickly across the lake."
      );
      details.push(
        "Bass may set up differently in protected vs exposed water."
      );
      details.push("Safety matters today—open water can get rough fast.");
    }

    return { title: "Wind", summary, numbers, details };
  }

  if (card === "pressure") {
    if (pressureMb == null) return unavailable("Pressure");

    const p = Math.round(pressureMb);
    numbers.push(`Pressure: ${p} mb`);

    if (!pressureTrend) {
      pressureTrend =
        pressureMb > 1015 ? "rising" : pressureMb < 1010 ? "falling" : "stable";
    }
    if (pressureTrend) numbers.push(`Trend: ${titleCase(pressureTrend)}`);

    const summary = `Pressure is near ${p} mb and looks ${pressureTrend} today.`;

    if (pressureTrend === "falling") {
      details.push(
        "Dropping pressure can make activity feel less steady through the day."
      );
      details.push(
        "Bass are more likely to turn on in short bursts instead of staying consistent."
      );
      details.push("The lake can feel more on/off than smooth.");
    } else if (pressureTrend === "rising") {
      details.push(
        "Rising pressure often supports steadier behavior rather than sudden swings."
      );
      details.push("Activity changes are more gradual instead of sharp.");
      details.push(
        "The day tends to feel more consistent from one period to the next."
      );
    } else {
      details.push(
        "Stable pressure removes a major source of day-to-day swings."
      );
      details.push("Bass are less likely to react abruptly to small changes.");
      details.push(
        "Activity patterns are more likely to hold instead of resetting."
      );
    }

    return { title: "Pressure", summary, numbers, details };
  }

  const sky = cloudRaw ? titleCase(cloudRaw) : "";
  if (uv != null) numbers.push(`UV: ${Math.round(uv)}`);
  if (sky) numbers.push(`Sky: ${sky}`);

  if (uv == null && !sky) return unavailable("Light");

  const summaryParts: string[] = [];
  if (sky) summaryParts.push(`${sky} skies.`);
  if (uv != null) {
    const uvWord = uv >= 8 ? "high" : uv >= 5 ? "moderate" : "low";
    summaryParts.push(`UV is ${Math.round(uv)} (${uvWord}).`);
  }
  const summary = summaryParts.join(" ");

  const isOvercast = cloudRaw.includes("overcast");
  const isClear = cloudRaw.includes("clear");
  const isPartly = cloudRaw.includes("part");

  if (isOvercast || (uv != null && uv < 3)) {
    details.push(
      "Light stays soft and consistent instead of swinging bright/dim."
    );
    details.push("Bass movement is less tied to specific light transitions.");
    details.push(
      "Activity often spreads out rather than clustering in brief moments."
    );
  } else if (isClear || (uv != null && uv >= 7)) {
    details.push("Light is stronger and more direct for longer stretches.");
    details.push(
      "Bass can get more selective about where they sit and when they move."
    );
    details.push("Shade and contrast can matter more on days like this.");
  } else if (isPartly || (uv != null && uv >= 4 && uv < 7)) {
    details.push(
      "Light is mixed—sun and clouds can change the lake feel back and forth."
    );
    details.push("Bass behavior can shift a bit as light levels come and go.");
    details.push(
      "The day can feel uneven compared to fully clear or fully overcast."
    );
  } else {
    details.push(
      "Light looks moderate overall, without extreme bright or dark periods."
    );
    details.push("Bass movement is usually less tight than on bright days.");
    details.push("Conditions stay fairly even as the day progresses.");
  }

  return { title: "Light", summary, numbers, details };
}

function WeatherMiniCard({
  icon,
  label,
  primary,
  secondary,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  primary: string;
  secondary?: string | null;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: 16,
        background:
          "linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: 12,
        textAlign: "left",
        width: "100%",
        cursor: onClick ? "pointer" : "default",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 8,
        }}
      >
        <div style={{ color: ACCENT }}>{icon}</div>
        <div
          style={{
            fontSize: ".9rem",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "rgba(255, 255, 255, 0.5)",
            fontWeight: 600,
          }}
        >
          {label}
        </div>
      </div>
      <div
        style={{
          fontWeight: 600,
          fontSize: "1.18rem",
          color: "rgba(255, 255, 255, 0.95)",
          lineHeight: 1.1,
        }}
      >
        {primary}
      </div>

      {secondary && (
        <div
          style={{
            marginTop: 8,
            fontSize: "0.92rem",
            color: "rgba(255, 255, 255, 0.65)",
            lineHeight: 1.25,
          }}
        >
          {secondary}
        </div>
      )}
    </button>
  );
}

function Section({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <div
        style={{
          fontSize: ".82rem",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "rgba(255,255,255,0.55)",
          fontWeight: 700,
          marginBottom: 8,
        }}
      >
        {title}
      </div>
      <ul
        style={{
          margin: 0,
          paddingLeft: 18,
          display: "grid",
          gap: 6,
          color: "rgba(255,255,255,0.82)",
          lineHeight: 1.35,
          fontSize: "0.95rem",
        }}
      >
        {items.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
    </div>
  );
}

function BottomSheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div className="bc-sheetOverlay" role="dialog" aria-modal="true">
      <button
        type="button"
        className="bc-sheetBackdrop"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="bc-sheetPanel">
        <div
          style={{
            padding: "12px 16px 10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div
            style={{
              fontSize: 13,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.82)",
              fontWeight: 700,
            }}
          >
            {title}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.06)",
              color: "rgba(255,255,255,0.92)",
              cursor: "pointer",
              fontSize: 18,
              lineHeight: "34px",
            }}
          >
            ×
          </button>
        </div>
        <div
          style={{
            padding: "14px 16px 18px",
            overflow: "auto",
            maxHeight: "78vh",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

function lightLabelFromCloud(cloud: string): string {
  const c = cloud.toLowerCase();
  if (!c) return "";
  if (c.includes("overcast")) return "Low Light";
  if (c.includes("clear")) return "High Light";
  if (c.includes("part")) return "Filtered Light";
  if (c.includes("cloud")) return "Mixed Light";
  return "";
}

function uvLabel(uv: number, cloud: string): string {
  const base = uv >= 8 ? "High UV" : uv >= 5 ? "Moderate UV" : "Low UV";
  const cloudHint = lightLabelFromCloud(cloud);
  return cloudHint ? `${base} • ${cloudHint}` : base;
}

const LARGE_LAKES = new Set([
  "okeechobee",
  "fork",
  "lanier",
  "guntersville",
  "champlain",
  "eufaula",
  "chickamauga",
  "pickwick",
  "kentucky",
  "barkley",
  "martin",
  "hartwell",
  "clarks hill",
  "thurmond",
  "sam rayburn",
  "toledo bend",
  "texoma",
  "amistad",
  "falcon",
  "conroe",
  "livingston",
  "buchanan",
  "travis",
  "havasu",
  "mead",
  "powell",
  "shasta",
  "oroville",
  "berryessa",
  "folsom",
  "detroit",
  "dworshak",
  "shelbyville",
  "cumberland",
  "percy priest",
  "wilson",
  "nickajack",
  "watts bar",
  "cherokee",
  "douglas",
  "fontana",
  "chatuge",
  "allatoona",
  "west point",
  "walter f george",
  "seminole",
  "tohopekaliga",
  "kissimmee",
  "istokpoga",
  "rodman",
  "santee cooper",
  "murray",
  "wylie",
  "norman",
  "texoma",
  "grand",
  "tenkiller",
  "stockton",
  "pomme de terre",
  "truman",
  "of the ozarks",
  "table rock",
  "bull shoals",
  "norfork",
  "greers ferry",
  "ouachita",
  "dardanelle",
  "degray",
  "millwood",
  "hamilton",
  "palestine",
  "fork",
  "tawakoni",
  "athens",
  "somerville",
  "waco",
  "belton",
  "stillhouse hollow",
  "canyon",
  "grapevine",
  "lewisville",
  "ray roberts",
  "lavon",
  "cedar creek",
  "limestone",
]);

function getLakeZoom(lakeName: string): number {
  const normalized = lakeName
    .toLowerCase()
    .replace(/^lake\s+/i, "")
    .replace(/\s+reservoir$/i, "");

  for (const largeLake of LARGE_LAKES) {
    if (normalized.includes(largeLake)) {
      return 11;
    }
  }

  return 13;
}
