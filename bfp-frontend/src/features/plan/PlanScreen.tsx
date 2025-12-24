// src/features/plan/PlanScreen.tsx
// Complete plan display: consolidated weather, per-pattern gear/strategy, downloads at bottom

import React, { useEffect, useState } from "react";
import type { Plan, PlanGenerateResponse, Pattern } from "./types";
import { isMemberPlan } from "./types";
import {
  ThermometerIcon,
  WindIcon,
  CloudIcon,
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
      {/* Weather Forecast Panel - Consolidated location, date, and weather */}
      <div className="card" style={{ marginTop: 0 }}>
        {/* Location & Date Header */}
        <div
          style={{
            marginBottom: 20,
            paddingBottom: 20,
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div className="kicker">Fishing Plan</div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginTop: 8,
            }}
          >
            <MapPinIcon size={20} />
            <div>
              <h2 className="h2" style={{ margin: 0, fontSize: "1.5em" }}>
                {conditions.location_name}
                {locationState && (
                  <span style={{ opacity: 0.6, fontWeight: 400 }}>
                    , {locationState}
                  </span>
                )}
              </h2>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 8,
              opacity: 0.7,
            }}
          >
            <CalendarIcon size={16} />
            <span style={{ fontSize: "0.9em" }}>{conditions.trip_date}</span>
          </div>
        </div>

        {/* Weather Forecast */}
        <h3 style={{ fontSize: "1.3em", fontWeight: 600, marginBottom: 16 }}>
          Weather Forecast
        </h3>

        {/* Weather Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: 16,
            marginBottom: 20,
            padding: 20,
            background: "rgba(255,255,255,0.02)",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          {/* Temperature Range */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ opacity: 0.7 }}>
              <ThermometerIcon size={20} />
            </div>
            <div>
              <div
                style={{ fontSize: "0.85em", opacity: 0.6, marginBottom: 2 }}
              >
                Temperature
              </div>
              <div style={{ fontWeight: 600 }}>
                {Math.round(conditions.temp_low)}° -{" "}
                {Math.round(conditions.temp_high)}°F
              </div>
            </div>
          </div>

          {/* Wind */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ opacity: 0.7 }}>
              <WindIcon size={20} />
            </div>
            <div>
              <div
                style={{ fontSize: "0.85em", opacity: 0.6, marginBottom: 2 }}
              >
                Wind
              </div>
              <div style={{ fontWeight: 600 }}>
                {Math.round(conditions.wind_speed)} mph
              </div>
            </div>
          </div>

          {/* Sky */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ opacity: 0.7 }}>
              <CloudIcon size={20} />
            </div>
            <div>
              <div
                style={{ fontSize: "0.85em", opacity: 0.6, marginBottom: 2 }}
              >
                Sky
              </div>
              <div style={{ fontWeight: 600, textTransform: "capitalize" }}>
                {conditions.sky_condition.replace(/_/g, " ")}
              </div>
            </div>
          </div>

          {/* Phase */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ opacity: 0.7 }}>
              <ActivityIcon size={20} />
            </div>
            <div>
              <div
                style={{ fontSize: "0.85em", opacity: 0.6, marginBottom: 2 }}
              >
                Phase
              </div>
              <div style={{ fontWeight: 600, textTransform: "capitalize" }}>
                {conditions.phase}
              </div>
            </div>
          </div>
        </div>

        {/* Forecast Description */}
        {plan.outlook_blurb && (
          <div>
            <h4
              style={{
                fontSize: "1em",
                fontWeight: 600,
                marginBottom: 10,
                opacity: 0.8,
              }}
            >
              Forecast
            </h4>
            <p style={{ lineHeight: 1.7, opacity: 0.9, margin: 0 }}>
              {plan.outlook_blurb}
            </p>
          </div>
        )}
      </div>

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
        Preview Pattern
      </div>
      <h3 style={{ fontSize: "1.75em", fontWeight: 700, marginBottom: 20 }}>
        {plan.presentation}
      </h3>

      {/* Lure Image */}
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
              src={`/images/lures/${plan.colors.asset_key}`}
              alt={plan.base_lure}
              style={{
                width: "100%",
                maxWidth: 300,
                height: "auto",
                objectFit: "contain",
                filter: "drop-shadow(0 8px 24px rgba(0, 0, 0, 0.5))",
              }}
              onError={(e) => {
                e.currentTarget.src = "/images/jig_lure.jpeg";
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
              No image
            </div>
          )}
        </div>
      </div>

      {/* Lure Name */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: "0.85em", opacity: 0.6, marginBottom: 8 }}>
          Lure
        </div>
        <div
          style={{
            fontSize: "1.1em",
            fontWeight: 600,
            textTransform: "capitalize",
          }}
        >
          {plan.base_lure}
        </div>
      </div>

      {/* Primary Color */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: "0.85em", opacity: 0.6, marginBottom: 8 }}>
          Primary Color
        </div>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 14px",
            background: "rgba(255,255,255,0.05)",
            borderRadius: 8,
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: getColorHex(plan.colors.primary_color),
              border: "2px solid rgba(255,255,255,0.2)",
            }}
          />
          <span style={{ fontWeight: 500, textTransform: "capitalize" }}>
            {plan.colors.primary_color}
          </span>
        </div>
      </div>

      {/* Why This Works */}
      {plan.why_this_works && (
        <div style={{ marginBottom: 24 }}>
          <h4 style={{ fontSize: "1.1em", fontWeight: 600, marginBottom: 10 }}>
            Why This Works
          </h4>
          <p style={{ lineHeight: 1.7, opacity: 0.9, margin: 0 }}>
            {plan.why_this_works}
          </p>
        </div>
      )}

      {/* Targets */}
      {plan.targets && plan.targets.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h4 style={{ fontSize: "1.1em", fontWeight: 600, marginBottom: 12 }}>
            Where to Fish
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {plan.targets.map((target, i) => {
              const targetName =
                typeof target === "string" ? target : target.name;
              const targetDef =
                typeof target === "object" && target.definition
                  ? target.definition
                  : "";

              return (
                <div
                  key={i}
                  style={{
                    padding: "12px 14px",
                    background: "rgba(74, 144, 226, 0.08)",
                    borderRadius: 6,
                  }}
                >
                  <div
                    style={{
                      textTransform: "uppercase",
                      fontSize: "0.85em",
                      fontWeight: 600,
                      letterSpacing: "0.05em",
                      marginBottom: targetDef ? 6 : 0,
                    }}
                  >
                    {targetName}
                  </div>
                  {targetDef && (
                    <div
                      style={{
                        fontSize: "0.85em",
                        opacity: 0.7,
                        lineHeight: 1.5,
                        textTransform: "none",
                        letterSpacing: "normal",
                        fontWeight: 400,
                      }}
                    >
                      {targetDef}
                    </div>
                  )}
                </div>
              );
            })}
            ))
          </div>
        </div>
      )}

      {/* How to Work It */}
      {plan.work_it && plan.work_it.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h4 style={{ fontSize: "1.1em", fontWeight: 600, marginBottom: 12 }}>
            How to Work It
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {plan.work_it.map((step, i) => (
              <div
                key={i}
                style={{ display: "flex", gap: 12, alignItems: "flex-start" }}
              >
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    background: "rgba(74, 144, 226, 0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.85em",
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  {i + 1}
                </div>
                <p style={{ margin: 0, lineHeight: 1.6, opacity: 0.9 }}>
                  {step}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Day Progression */}
      {plan.day_progression && plan.day_progression.length > 0 && (
        <div>
          <h4 style={{ fontSize: "1.1em", fontWeight: 600, marginBottom: 12 }}>
            Day Progression
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {plan.day_progression.map((item, i) => (
              <div
                key={i}
                style={{
                  padding: 12,
                  background: "rgba(255,255,255,0.02)",
                  borderRadius: 6,
                  borderLeft: "3px solid rgba(74, 144, 226, 0.5)",
                }}
              >
                <p style={{ margin: 0, lineHeight: 1.6, fontSize: "0.95em" }}>
                  {item}
                </p>
              </div>
            ))}
          </div>
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
  return (
    <>
      {/* Primary Pattern */}
      <PatternCard pattern={plan.primary} patternNumber={1} isPrimary={true} />

      {/* Secondary Pattern */}
      <PatternCard
        pattern={plan.secondary}
        patternNumber={2}
        isPrimary={false}
      />

      {/* Day Progression */}
      {plan.day_progression && plan.day_progression.length > 0 && (
        <div className="card" style={{ marginTop: 20 }}>
          <h3 style={{ fontSize: "1.5em", fontWeight: 700, marginBottom: 16 }}>
            Day Progression
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {plan.day_progression.map((item, i) => (
              <div
                key={i}
                style={{
                  padding: 16,
                  background: "rgba(255,255,255,0.02)",
                  borderRadius: 8,
                  borderLeft: "3px solid rgba(74, 144, 226, 0.5)",
                }}
              >
                <p style={{ margin: 0, lineHeight: 1.6 }}>{item}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

// Reusable pattern card component
function PatternCard({
  pattern,
  patternNumber,
  isPrimary,
}: {
  pattern: Pattern;
  patternNumber: number;
  isPrimary: boolean;
}) {
  return (
    <div
      className="card"
      style={{
        marginTop: 20,
        background: isPrimary
          ? "linear-gradient(135deg, rgba(74, 144, 226, 0.08) 0%, var(--bg-card) 100%)"
          : "var(--bg-card)",
        border: isPrimary
          ? "1px solid rgba(74, 144, 226, 0.2)"
          : "1px solid rgba(255,255,255,0.1)",
      }}
    >
      <div className="badge primary" style={{ marginBottom: 12 }}>
        Pattern {patternNumber}
      </div>
      <h3 style={{ fontSize: "1.75em", fontWeight: 700, marginBottom: 20 }}>
        {pattern.presentation}
      </h3>

      {/* Pattern Summary - Strategic Overview */}
      {pattern.pattern_summary && (
        <div
          style={{
            marginBottom: 24,
            padding: 16,
            background: "rgba(74, 144, 226, 0.05)",
            borderRadius: 8,
            borderLeft: "3px solid rgba(74, 144, 226, 0.4)",
          }}
        >
          <p style={{ lineHeight: 1.7, margin: 0, fontSize: "0.95em" }}>
            {pattern.pattern_summary}
          </p>
        </div>
      )}

      {/* Lure Image */}
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
          {pattern.colors.asset_key ? (
            <img
              src={`/images/lures/${pattern.colors.asset_key}`}
              alt={pattern.base_lure}
              style={{
                width: "100%",
                maxWidth: 300,
                height: "auto",
                objectFit: "contain",
                filter: "drop-shadow(0 8px 24px rgba(0, 0, 0, 0.5))",
              }}
              onError={(e) => {
                e.currentTarget.src = "/images/jig_lure.jpeg";
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
              No image
            </div>
          )}
        </div>
      </div>

      {/* Lure Name */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: "0.85em", opacity: 0.6, marginBottom: 8 }}>
          Lure
        </div>
        <div
          style={{
            fontSize: "1.1em",
            fontWeight: 600,
            textTransform: "capitalize",
          }}
        >
          {pattern.base_lure}
        </div>
      </div>

      {/* Primary Color */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: "0.85em", opacity: 0.6, marginBottom: 8 }}>
          Primary Color
        </div>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 14px",
            background: "rgba(255,255,255,0.05)",
            borderRadius: 8,
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: getColorHex(pattern.colors.primary_color),
              border: "2px solid rgba(255,255,255,0.2)",
            }}
          />
          <span style={{ fontWeight: 500, textTransform: "capitalize" }}>
            {pattern.colors.primary_color}
          </span>
        </div>
      </div>

      {/* Why This Works */}
      {pattern.why_this_works && (
        <div style={{ marginBottom: 24 }}>
          <h4 style={{ fontSize: "1.1em", fontWeight: 600, marginBottom: 10 }}>
            Why This Works
          </h4>
          <p style={{ lineHeight: 1.7, opacity: 0.9, margin: 0 }}>
            {pattern.why_this_works}
          </p>
        </div>
      )}

      {/* Targets */}
      {pattern.targets && pattern.targets.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h4 style={{ fontSize: "1.1em", fontWeight: 600, marginBottom: 12 }}>
            Where to Fish
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {pattern.targets.map((target, i) => {
              const targetName =
                typeof target === "string" ? target : target.name;
              const targetDef =
                typeof target === "object" && target.definition
                  ? target.definition
                  : "";

              return (
                <div
                  key={i}
                  style={{
                    padding: "12px 14px",
                    background: "rgba(74, 144, 226, 0.08)",
                    borderRadius: 6,
                  }}
                >
                  <div
                    style={{
                      textTransform: "uppercase",
                      fontSize: "0.85em",
                      fontWeight: 600,
                      letterSpacing: "0.05em",
                      marginBottom: targetDef ? 6 : 0,
                    }}
                  >
                    {targetName}
                  </div>
                  {targetDef && (
                    <div
                      style={{
                        fontSize: "0.85em",
                        opacity: 0.7,
                        lineHeight: 1.5,
                        textTransform: "none",
                        letterSpacing: "normal",
                        fontWeight: 400,
                      }}
                    >
                      {targetDef}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* How to Work It */}
      {pattern.work_it && pattern.work_it.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h4 style={{ fontSize: "1.1em", fontWeight: 600, marginBottom: 12 }}>
            How to Work It
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {pattern.work_it.map((step, i) => (
              <div
                key={i}
                style={{ display: "flex", gap: 12, alignItems: "flex-start" }}
              >
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    background: "rgba(74, 144, 226, 0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.85em",
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  {i + 1}
                </div>
                <p style={{ margin: 0, lineHeight: 1.6, opacity: 0.9 }}>
                  {step}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gear Setup */}
      {pattern.gear && (
        <div
          style={{
            marginTop: 24,
            padding: 16,
            background: "rgba(255,255,255,0.02)",
            borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <h4 style={{ fontSize: "1.1em", fontWeight: 600, marginBottom: 12 }}>
            Gear Setup
          </h4>
          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ opacity: 0.7 }}>Rod:</span>
              <span style={{ fontWeight: 500 }}>{pattern.gear.rod}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ opacity: 0.7 }}>Reel:</span>
              <span style={{ fontWeight: 500 }}>{pattern.gear.reel}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ opacity: 0.7 }}>Line:</span>
              <span style={{ fontWeight: 500 }}>{pattern.gear.line}</span>
            </div>
          </div>
        </div>
      )}

      {/* Strategy */}
      {pattern.strategy && pattern.strategy.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h4 style={{ fontSize: "1.1em", fontWeight: 600, marginBottom: 12 }}>
            Strategy
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {pattern.strategy.map((tip, i) => (
              <div
                key={i}
                style={{
                  padding: 12,
                  background: "rgba(255,255,255,0.02)",
                  borderRadius: 6,
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                }}
              >
                <div
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: "rgba(74, 144, 226, 0.8)",
                    marginTop: 6,
                    flexShrink: 0,
                  }}
                />
                <p style={{ margin: 0, lineHeight: 1.6, fontSize: "0.95em" }}>
                  {tip}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
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

    // Shad colors
    "natural shad": "#d4d4d4",
    "ghost shad": "#e8e8e8",
    shad: "#c0c0c0",

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
