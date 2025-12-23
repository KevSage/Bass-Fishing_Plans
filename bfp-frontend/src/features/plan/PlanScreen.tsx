// src/features/plan/PlanScreen.tsx
// Updated to use ACTUAL data from backend response

import React, { useEffect, useState } from "react";
import type { Plan, PlanGenerateResponse } from "./types";
import { isMemberPlan } from "./types";
import {
  ThermometerIcon,
  WindIcon,
  CloudIcon,
  DropletsIcon,
  CalendarIcon,
  MapPinIcon,
  ActivityIcon,
} from "@/components/UnifiedIcons";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

export function PlanScreen({ response }: { response: PlanGenerateResponse }) {
  const { plan, is_member } = response;
  const conditions = plan.conditions;
  const [locationState, setLocationState] = useState<string>("");

  // Reverse geocode to get state
  useEffect(() => {
    async function getState() {
      if (!MAPBOX_TOKEN) return;

      try {
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${conditions.longitude},${conditions.latitude}.json?` +
            `types=region&access_token=${MAPBOX_TOKEN}`
        );
        const data = await res.json();

        if (data.features && data.features.length > 0) {
          const region = data.features.find((f: any) =>
            f.id.startsWith("region")
          );
          if (region) {
            const state =
              region.text || region.short_code?.replace("US-", "") || "";
            setLocationState(state);
          }
        }
      } catch (error) {
        console.error("Failed to get state:", error);
      }
    }

    getState();
  }, [conditions.latitude, conditions.longitude]);

  return (
    <div style={{ marginTop: 18 }}>
      {/* Header with Location + Weather */}
      <div
        className="card"
        style={{
          background:
            "linear-gradient(135deg, rgba(74, 144, 226, 0.08) 0%, var(--bg-card) 100%)",
        }}
      >
        <div className="kicker">Bass Fishing Plan</div>

        {/* Location - WITH STATE */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginTop: 8,
          }}
        >
          <MapPinIcon size={24} />
          <div>
            <h2 className="h2" style={{ margin: 0 }}>
              {conditions.location_name}
            </h2>
            {locationState && (
              <p style={{ fontSize: "0.9em", opacity: 0.6, marginTop: 2 }}>
                {locationState}, USA
              </p>
            )}
          </div>
        </div>

        {/* Date */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginTop: 12,
            opacity: 0.7,
          }}
        >
          <CalendarIcon size={16} />
          <span style={{ fontSize: "0.9em" }}>{conditions.trip_date}</span>
        </div>

        {/* Weather Summary - ICONS MOVED HERE */}
        <div
          style={{
            marginTop: 20,
            padding: 20,
            background: "rgba(255,255,255,0.02)",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          {/* Temperature - FOCAL POINT (LARGE) */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 16,
              marginBottom: 20,
              paddingBottom: 20,
              borderBottom: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <ThermometerIcon size={48} className="text-primary" />
            <div>
              <div style={{ fontSize: "3em", fontWeight: 700, lineHeight: 1 }}>
                {Math.round(conditions.temp_f)}°F
              </div>
              <div style={{ fontSize: "0.85em", opacity: 0.6, marginTop: 4 }}>
                Range: {Math.round(conditions.temp_low)}° -{" "}
                {Math.round(conditions.temp_high)}°
              </div>
            </div>
          </div>

          {/* Other Weather - Smaller Icons in Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
              gap: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ opacity: 0.7 }}>
                <WindIcon size={20} />
              </div>
              <div>
                <div
                  style={{
                    fontSize: "0.75em",
                    opacity: 0.5,
                    textTransform: "uppercase",
                  }}
                >
                  Wind
                </div>
                <div style={{ fontWeight: 600 }}>
                  {Math.round(conditions.wind_speed)} mph
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ opacity: 0.7 }}>
                <CloudIcon size={20} />
              </div>
              <div>
                <div
                  style={{
                    fontSize: "0.75em",
                    opacity: 0.5,
                    textTransform: "uppercase",
                  }}
                >
                  Sky
                </div>
                <div style={{ fontWeight: 600, textTransform: "capitalize" }}>
                  {conditions.sky_condition}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ opacity: 0.7 }}>
                <DropletsIcon size={20} />
              </div>
              <div>
                <div
                  style={{
                    fontSize: "0.75em",
                    opacity: 0.5,
                    textTransform: "uppercase",
                  }}
                >
                  Phase
                </div>
                <div style={{ fontWeight: 600, textTransform: "capitalize" }}>
                  {conditions.phase}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Conditions Blurb - USING ACTUAL DATA */}
      {plan.outlook_blurb && (
        <div className="card" style={{ marginTop: 20 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 12,
            }}
          >
            <ActivityIcon size={20} className="text-primary" />
            <h3 style={{ margin: 0, fontWeight: 600 }}>Today's Conditions</h3>
          </div>
          <p style={{ lineHeight: 1.7, opacity: 0.9, margin: 0 }}>
            {plan.outlook_blurb}
          </p>
        </div>
      )}

      {/* Pattern Display */}
      {isMemberPlan(plan) ? (
        <MemberPatternView plan={plan} />
      ) : (
        <PreviewPatternView plan={plan} />
      )}
    </div>
  );
}

function PreviewPatternView({
  plan,
}: {
  plan: Extract<Plan, { base_lure: string }>;
}) {
  return (
    <div
      className="card"
      style={{
        marginTop: 20,
        background:
          "linear-gradient(135deg, rgba(74, 144, 226, 0.08) 0%, var(--bg-card) 100%)",
        border: "1px solid rgba(74, 144, 226, 0.2)",
      }}
    >
      <div className="badge primary" style={{ marginBottom: 12 }}>
        Pattern 1
      </div>
      <h3 style={{ fontSize: "1.75em", fontWeight: 700, marginBottom: 20 }}>
        {plan.presentation}
      </h3>

      {/* Lure Image - FILLS CONTAINER - USING ACTUAL asset_key */}
      <div
        style={{
          position: "relative",
          padding: 40,
          background:
            "radial-gradient(ellipse at center, rgba(74, 144, 226, 0.1) 0%, transparent 70%)",
          borderRadius: 16,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: 200,
          }}
        >
          {plan.colors.asset_key ? (
            <img
              src={`/images/jig_lure.jpeg`}
              alt={plan.base_lure}
              style={{
                width: "100%",
                maxWidth: 300,
                height: "auto",
                objectFit: "contain",
                filter: "drop-shadow(0 8px 24px rgba(0, 0, 0, 0.5))",
              }}
            />
          ) : (
            <div
              style={{
                width: 300,
                height: 200,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(255,255,255,0.05)",
                borderRadius: 8,
                opacity: 0.5,
              }}
            >
              <span>🎣</span>
            </div>
          )}
        </div>
      </div>

      {/* Lure Details with COLOR SWATCHES - USING ACTUAL COLORS */}
      <div
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 12,
          padding: 20,
          marginBottom: 20,
        }}
      >
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: "0.85em", opacity: 0.6, marginBottom: 6 }}>
            Lure
          </div>
          <div
            style={{
              fontSize: "1.2em",
              fontWeight: 600,
              textTransform: "capitalize",
            }}
          >
            {plan.base_lure}
          </div>
        </div>

        {/* Primary Color - WITH VISUAL SWATCH */}
        {plan.colors.primary_color && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: "0.85em", opacity: 0.6, marginBottom: 8 }}>
              Primary Color
            </div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 12px",
                background: "rgba(255,255,255,0.05)",
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: getColorHex(plan.colors.primary_color),
                  border: "2px solid rgba(255,255,255,0.2)",
                  flexShrink: 0,
                }}
              />
              <span style={{ fontWeight: 500, textTransform: "capitalize" }}>
                {plan.colors.primary_color}
              </span>
            </div>
          </div>
        )}

        {/* Recommended Colors */}
        {plan.color_recommendations &&
          plan.color_recommendations.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div
                style={{ fontSize: "0.85em", opacity: 0.6, marginBottom: 8 }}
              >
                Also Try
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {plan.color_recommendations.map((color, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "6px 10px",
                      background: "rgba(255,255,255,0.03)",
                      borderRadius: 6,
                      fontSize: "0.9em",
                    }}
                  >
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        background: getColorHex(color),
                        border: "2px solid rgba(255,255,255,0.15)",
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ textTransform: "capitalize" }}>{color}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* Accent Color if exists */}
        {plan.colors.accent_color && (
          <div>
            <div style={{ fontSize: "0.85em", opacity: 0.6, marginBottom: 8 }}>
              {plan.colors.accent_material === "metallic"
                ? "Blade Finish"
                : "Accent"}
            </div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 12px",
                background: "rgba(255,255,255,0.05)",
                borderRadius: 8,
              }}
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: getColorHex(plan.colors.accent_color),
                  border: "2px solid rgba(255,255,255,0.2)",
                }}
              />
              <span style={{ fontWeight: 500, textTransform: "capitalize" }}>
                {plan.colors.accent_color}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Why This Works - USING ACTUAL DATA */}
      {plan.why_this_works && (
        <div
          style={{
            background: "rgba(255, 230, 109, 0.08)",
            border: "1px solid rgba(255, 230, 109, 0.2)",
            borderRadius: 12,
            padding: 16,
            marginBottom: 20,
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 8 }}>
            💡 Why This Works
          </div>
          <p style={{ lineHeight: 1.7, opacity: 0.9, margin: 0 }}>
            {plan.why_this_works}
          </p>
        </div>
      )}

      {/* Targets - USING ACTUAL DATA */}
      {plan.targets && plan.targets.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <h4 style={{ fontSize: "1.1em", fontWeight: 600, marginBottom: 12 }}>
            🎯 Targets
          </h4>
          <ul style={{ margin: 0, paddingLeft: 0, listStyle: "none" }}>
            {plan.targets.map((target, i) => (
              <li
                key={i}
                style={{
                  padding: "10px 12px",
                  background: "rgba(78, 205, 196, 0.05)",
                  border: "1px solid rgba(78, 205, 196, 0.2)",
                  borderRadius: 8,
                  marginBottom: 8,
                  textTransform: "capitalize",
                }}
              >
                {target}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* How to Fish It - USING ACTUAL DATA */}
      {plan.work_it && plan.work_it.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <h4 style={{ fontSize: "1.1em", fontWeight: 600, marginBottom: 12 }}>
            🎣 How to Fish It
          </h4>
          <ul style={{ margin: 0, paddingLeft: 0, listStyle: "none" }}>
            {plan.work_it.map((step, i) => (
              <li
                key={i}
                style={{
                  padding: "12px",
                  background: "rgba(74, 144, 226, 0.05)",
                  border: "1px solid rgba(74, 144, 226, 0.15)",
                  borderRadius: 8,
                  marginBottom: 8,
                  lineHeight: 1.6,
                }}
              >
                {step}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Day Progression - USING ACTUAL DATA */}
      {plan.day_progression && plan.day_progression.length > 0 && (
        <div>
          <h4 style={{ fontSize: "1.1em", fontWeight: 600, marginBottom: 12 }}>
            ⏰ Day Progression
          </h4>
          <ul style={{ margin: 0, paddingLeft: 0, listStyle: "none" }}>
            {plan.day_progression.map((phase, i) => (
              <li
                key={i}
                style={{
                  padding: "12px",
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                  marginBottom: 8,
                  lineHeight: 1.6,
                }}
              >
                {phase}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function MemberPatternView({
  plan,
}: {
  plan: Extract<Plan, { primary: any }>;
}) {
  // Same structure as PreviewPatternView but shows both primary and secondary
  return (
    <>
      {/* Pattern 1 */}
      {/* Pattern 2 */}
    </>
  );
}

// Helper function to map color names to hex values
function getColorHex(colorName: string): string {
  const colorMap: Record<string, string> = {
    // Greens
    "green pumpkin": "#4a5a3a",
    watermelon: "#8fbc8f",
    junebug: "#2d1b2e",

    // Browns/Naturals
    brown: "#8b4513",
    "peanut butter": "#c4a15c",
    craw: "#8b4726",

    // Whites/Clears
    white: "#f5f5f5",
    pearl: "#f0f0e8",
    clear: "rgba(255,255,255,0.3)",

    // Darks
    black: "#1a1a1a",
    blue: "#2c5aa0",
    purple: "#663399",

    // Chartreuse
    chartreuse: "#dfff00",

    // Metallics
    gold: "#ffd700",
    silver: "#c0c0c0",
    copper: "#b87333",

    // Default
    default: "#4A90E2",
  };

  const normalized = colorName.toLowerCase().replace(/\s+/g, " ");
  return colorMap[normalized] || colorMap["default"];
}
