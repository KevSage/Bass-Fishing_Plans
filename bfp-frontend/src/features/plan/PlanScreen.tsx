// src/features/plan/PlanScreen.tsx
// Complete plan display: consolidated weather, per-pattern gear/strategy, downloads at bottom

import React, { useEffect, useState, useRef } from "react";
import type {
  Plan,
  PlanGenerateResponse,
  Pattern,
  MemberPlan,
  PreviewPlan,
} from "./types";
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

// Famous/large bass fishing lakes - zoom out more to show context
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

// Determine zoom level based on lake name
function getLakeZoom(lakeName: string): number {
  const normalized = lakeName
    .toLowerCase()
    .replace(/^lake\s+/i, "") // Remove "Lake" prefix
    .replace(/\s+reservoir$/i, ""); // Remove "Reservoir" suffix

  // Check if it's a known large lake
  for (const largeLake of LARGE_LAKES) {
    if (normalized.includes(largeLake)) {
      return 11; // Zoom in for large/famous lakes (show lake clearly)
    }
  }

  // Default: zoom in closer for smaller/unknown lakes
  return 13; // Close zoom for small lakes (show detail)
}

export function PlanScreen({ response }: { response: PlanGenerateResponse }) {
  const { plan, is_member } = response;
  const conditions = plan.conditions;
  const [locationCity, setLocationCity] = useState<string>("");
  const [locationState, setLocationState] = useState<string>("");
  const hasGeocodedRef = useRef(false);

  // Calculate zoom level for this lake
  const lakeZoom = getLakeZoom(conditions.location_name);

  // Reverse geocode to get city + state - only once
  useEffect(() => {
    if (hasGeocodedRef.current) return; // Already geocoded

    async function getCityState() {
      if (!MAPBOX_TOKEN) return;

      try {
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${conditions.longitude},${conditions.latitude}.json?` +
            `types=place,region&access_token=${MAPBOX_TOKEN}`
        );
        const data = await res.json();

        if (data.features && data.features.length > 0) {
          // Get city (place)
          const place = data.features.find((f: any) =>
            f.id.startsWith("place")
          );
          if (place) {
            setLocationCity(place.text || "");
          }

          // Get state (region)
          const region = data.features.find((f: any) =>
            f.id.startsWith("region")
          );
          if (region) {
            const state =
              region.text || region.short_code?.replace("US-", "") || "";
            setLocationState(state);
          }

          hasGeocodedRef.current = true; // Mark as geocoded
        }
      } catch (error) {
        console.error("Failed to get location:", error);
      }
    }

    getCityState();
  }, [conditions.latitude, conditions.longitude]);

  return (
    <div style={{ marginTop: 18 }}>
      {/* Weather Forecast Panel - Premium with blue accents */}
      <div
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
          {/* Mapbox Static Satellite Image */}
          {MAPBOX_TOKEN && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage: `url(https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/${conditions.longitude},${conditions.latitude},${lakeZoom},0/800x400@2x?access_token=${MAPBOX_TOKEN}&attribution=false&logo=false)`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                filter: "brightness(0.95) saturate(1.4) contrast(1.15)",
              }}
            />
          )}

          {/* Lighter gradient overlay for vibrant colors */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.5) 100%)",
            }}
          />

          {/* Date - Prominent with blue accent */}
          <div
            style={{
              position: "relative",
              padding: "20px 20px 0",
              marginBottom: 12,
              fontSize: "0.85rem",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "#4A90E2",
              fontWeight: 600,
            }}
          >
            {conditions.trip_date}
          </div>

          {/* Location - Large with blue pin icon */}
          <div
            style={{
              position: "relative",
              padding: "0 20px 20px",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div style={{ color: "#4A90E2" }}>
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

        {/* Weather Forecast Header */}
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

        {/* Weather Grid - Premium cards with blue accents */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: 16,
            marginBottom: 24,
          }}
        >
          {/* Temperature Range */}
          <div
            style={{
              padding: 16,
              background:
                "linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: 12,
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
              <div style={{ color: "#4A90E2" }}>
                <ThermometerIcon size={20} />
              </div>
              <div
                style={{
                  fontSize: "0.7rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "rgba(255, 255, 255, 0.5)",
                  fontWeight: 600,
                }}
              >
                Temperature
              </div>
            </div>
            <div
              style={{
                fontWeight: 600,
                fontSize: "1.15rem",
                color: "rgba(255, 255, 255, 0.95)",
              }}
            >
              {Math.round(conditions.temp_low)}° -{" "}
              {Math.round(conditions.temp_high)}
              °F
            </div>
          </div>

          {/* Wind */}
          <div
            style={{
              padding: 16,
              background:
                "linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: 12,
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
              <div style={{ color: "#4A90E2" }}>
                <WindIcon size={20} />
              </div>
              <div
                style={{
                  fontSize: "0.7rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "rgba(255, 255, 255, 0.5)",
                  fontWeight: 600,
                }}
              >
                Wind
              </div>
            </div>
            <div
              style={{
                fontWeight: 600,
                fontSize: "1.15rem",
                color: "rgba(255, 255, 255, 0.95)",
              }}
            >
              {Math.round(conditions.wind_speed)} mph
            </div>
          </div>

          {/* Sky */}
          <div
            style={{
              padding: 16,
              background:
                "linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: 12,
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
              <div style={{ color: "#4A90E2" }}>
                <CloudIcon size={20} />
              </div>
              <div
                style={{
                  fontSize: "0.7rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "rgba(255, 255, 255, 0.5)",
                  fontWeight: 600,
                }}
              >
                Sky
              </div>
            </div>
            <div
              style={{
                fontWeight: 600,
                fontSize: "1.15rem",
                textTransform: "capitalize",
                color: "rgba(255, 255, 255, 0.95)",
              }}
            >
              {conditions.sky_condition.replace(/_/g, " ")}
            </div>
          </div>

          {/* Phase */}
          <div
            style={{
              padding: 16,
              background:
                "linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: 12,
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
              <div style={{ color: "#4A90E2" }}>
                <ActivityIcon size={20} />
              </div>
              <div
                style={{
                  fontSize: "0.7rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "rgba(255, 255, 255, 0.5)",
                  fontWeight: 600,
                }}
              >
                Phase
              </div>
            </div>
            <div
              style={{
                fontWeight: 600,
                fontSize: "1.15rem",
                textTransform: "capitalize",
                color: "rgba(255, 255, 255, 0.95)",
              }}
            >
              {conditions.phase}
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
      {is_member ? (
        <MemberPatternView plan={plan as MemberPlan} />
      ) : (
        <PreviewPatternView plan={plan as PreviewPlan} />
      )}
    </div>
  );
}

const PreviewPatternView = React.memo(function PreviewPatternView({
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
          background:
            "radial-gradient(ellipse at center, rgba(74, 144, 226, 0.1) 0%, transparent 70%)",
          borderRadius: 16,
          marginBottom: 24,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: 200,
            padding: 40,
          }}
        >
          {plan.colors.asset_key ? (
            <img
              src={`/images/lures/${plan.colors.asset_key}`}
              alt={plan.base_lure}
              style={{
                width: "100%",
                maxWidth: 400,
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

      {/* Soft Plastic (if applicable) */}
      {plan.soft_plastic && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: "0.85em", opacity: 0.6, marginBottom: 8 }}>
            Soft Plastic
          </div>
          <div
            style={{
              fontSize: "1em",
              fontWeight: 500,
              textTransform: "capitalize",
              marginBottom: 8,
            }}
          >
            {plan.soft_plastic}
          </div>
          {plan.soft_plastic_why && (
            <div
              style={{
                fontSize: "0.9em",
                opacity: 0.8,
                lineHeight: 1.6,
                fontStyle: "italic",
              }}
            >
              {plan.soft_plastic_why}
            </div>
          )}
        </div>
      )}

      {/* Trailer (if applicable) */}
      {plan.trailer && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: "0.85em", opacity: 0.6, marginBottom: 8 }}>
            Trailer
          </div>
          <div
            style={{
              fontSize: "1em",
              fontWeight: 500,
              textTransform: "capitalize",
              marginBottom: 8,
            }}
          >
            {plan.trailer}
          </div>
          {plan.trailer_why && (
            <div
              style={{
                fontSize: "0.9em",
                opacity: 0.8,
                lineHeight: 1.6,
                fontStyle: "italic",
              }}
            >
              {plan.trailer_why}
            </div>
          )}
        </div>
      )}

      {/* Color Swatches */}
      {plan.color_recommendations && plan.color_recommendations.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: "0.85em", opacity: 0.6, marginBottom: 8 }}>
            Colors
          </div>
          <div
            style={{
              display: "flex",
              gap: 16,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            {plan.color_recommendations.map((color, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    background: getColorHex(color),
                    border: "2px solid rgba(255,255,255,0.2)",
                  }}
                />
                <span
                  style={{
                    fontWeight: 500,
                    textTransform: "capitalize",
                    fontSize: "0.95em",
                  }}
                >
                  {color}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

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
});

const MemberPatternView = React.memo(function MemberPatternView({
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
});

// Reusable pattern card component - PREMIUM REDESIGN
const PatternCard = React.memo(function PatternCard({
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
        marginTop: 32,
        position: "relative",
        // Premium frosted glass effect with depth
        background: isPrimary
          ? "linear-gradient(145deg, rgba(74, 144, 226, 0.06) 0%, rgba(10, 10, 10, 0.4) 50%, rgba(74, 144, 226, 0.03) 100%)"
          : "linear-gradient(145deg, rgba(255, 255, 255, 0.02) 0%, rgba(10, 10, 10, 0.4) 50%, rgba(255, 255, 255, 0.01) 100%)",
        border: isPrimary
          ? "1px solid rgba(74, 144, 226, 0.15)"
          : "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: 24,
        padding: "48px",
        // Premium shadows (work in PDF)
        boxShadow: isPrimary
          ? "0 8px 32px rgba(74, 144, 226, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.04)"
          : "0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.03)",
      }}
    >
      {/* Floating Pattern Badge */}
      <div
        style={{
          position: "absolute",
          top: -12,
          left: 32,
          padding: "6px 18px",
          background: isPrimary
            ? "linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)"
            : "linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.08) 100%)",
          boxShadow: isPrimary
            ? "0 4px 16px rgba(74, 144, 226, 0.4)"
            : "0 4px 16px rgba(0, 0, 0, 0.3)",
          borderRadius: 8,
          fontSize: "0.7rem",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          fontWeight: 700,
          color: isPrimary ? "#fff" : "rgba(255, 255, 255, 0.9)",
        }}
      >
        Pattern {patternNumber}
      </div>

      {/* Presentation Title - Premium typography */}
      <h3
        style={{
          fontSize: "2.25rem",
          fontWeight: 800,
          letterSpacing: "-0.02em",
          marginTop: 12,
          marginBottom: 32,
          lineHeight: 1.1,
          color: "rgba(255, 255, 255, 0.95)",
        }}
      >
        {pattern.presentation}
      </h3>

      {/* Pattern Summary - Refined callout */}
      {pattern.pattern_summary && (
        <div
          style={{
            marginBottom: 32,
            padding: "24px 28px",
            background:
              "linear-gradient(135deg, rgba(74, 144, 226, 0.06) 0%, rgba(74, 144, 226, 0.02) 100%)",
            borderLeft: "4px solid #4A90E2",
            borderRadius: 12,
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
          }}
        >
          <p
            style={{
              lineHeight: 1.75,
              margin: 0,
              fontSize: "1.05rem",
              fontWeight: 400,
              letterSpacing: "0.01em",
              color: "rgba(255, 255, 255, 0.92)",
            }}
          >
            {pattern.pattern_summary}
          </p>
        </div>
      )}

      {/* Section Divider */}
      <div
        style={{
          height: 1,
          background:
            "linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.08) 50%, transparent 100%)",
          margin: "32px 0",
        }}
      />

      {/* Lure Image Container - Premium hero treatment */}
      <div
        style={{
          position: "relative",
          marginBottom: 32,
          overflow: "hidden",
          background:
            "radial-gradient(ellipse at center, rgba(74, 144, 226, 0.12) 0%, rgba(74, 144, 226, 0.04) 40%, transparent 70%)",
          borderRadius: 20,
        }}
      >
        {/* Glow effect behind */}
        <div
          style={{
            position: "absolute",
            inset: "-40px",
            background:
              "radial-gradient(ellipse at center, rgba(74, 144, 226, 0.2) 0%, transparent 60%)",
            filter: "blur(60px)",
            zIndex: 0,
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            position: "relative",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: 280,
            padding: "80px 40px",
            zIndex: 1,
          }}
        >
          {pattern.colors.asset_key ? (
            <img
              src={`/images/lures/${pattern.colors.asset_key}`}
              alt={pattern.base_lure}
              style={{
                width: "100%",
                maxWidth: 480,
                height: "auto",
                objectFit: "contain",
                // Premium multi-layer shadow
                filter:
                  "drop-shadow(0 24px 80px rgba(0, 0, 0, 0.6)) drop-shadow(0 12px 40px rgba(74, 144, 226, 0.5)) drop-shadow(0 4px 16px rgba(0, 0, 0, 0.4))",
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
                borderRadius: 12,
                opacity: 0.5,
                fontSize: "0.9rem",
                color: "rgba(255, 255, 255, 0.4)",
              }}
            >
              No image available
            </div>
          )}
        </div>
      </div>

      {/* Lure Name */}
      <div style={{ marginBottom: 32 }}>
        <div
          style={{
            fontSize: "0.7rem",
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            fontWeight: 700,
            color: "rgba(255, 255, 255, 0.5)",
            marginBottom: 12,
          }}
        >
          Lure
        </div>
        <div
          style={{
            fontSize: "1.25rem",
            fontWeight: 600,
            textTransform: "capitalize",
            color: "rgba(255, 255, 255, 0.95)",
          }}
        >
          {pattern.base_lure}
        </div>
      </div>

      {/* Soft Plastic */}
      {pattern.soft_plastic && (
        <div style={{ marginBottom: 32 }}>
          <div
            style={{
              fontSize: "0.7rem",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              fontWeight: 700,
              color: "rgba(255, 255, 255, 0.5)",
              marginBottom: 12,
            }}
          >
            Soft Plastic
          </div>
          <div
            style={{
              fontSize: "1.1rem",
              fontWeight: 500,
              textTransform: "capitalize",
              marginBottom: 10,
              color: "rgba(255, 255, 255, 0.95)",
            }}
          >
            {pattern.soft_plastic}
          </div>
          {pattern.soft_plastic_why && (
            <div
              style={{
                fontSize: "0.95rem",
                opacity: 0.75,
                lineHeight: 1.6,
                fontStyle: "italic",
              }}
            >
              {pattern.soft_plastic_why}
            </div>
          )}
        </div>
      )}

      {/* Trailer */}
      {pattern.trailer && (
        <div style={{ marginBottom: 32 }}>
          <div
            style={{
              fontSize: "0.7rem",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              fontWeight: 700,
              color: "rgba(255, 255, 255, 0.5)",
              marginBottom: 12,
            }}
          >
            Trailer
          </div>
          <div
            style={{
              fontSize: "1.1rem",
              fontWeight: 500,
              textTransform: "capitalize",
              marginBottom: 10,
              color: "rgba(255, 255, 255, 0.95)",
            }}
          >
            {pattern.trailer}
          </div>
          {pattern.trailer_why && (
            <div
              style={{
                fontSize: "0.95rem",
                opacity: 0.75,
                lineHeight: 1.6,
                fontStyle: "italic",
              }}
            >
              {pattern.trailer_why}
            </div>
          )}
        </div>
      )}

      {/* Color Swatches - Premium cards */}
      {pattern.color_recommendations &&
        pattern.color_recommendations.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <div
              style={{
                fontSize: "0.7rem",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                fontWeight: 700,
                color: "rgba(255, 255, 255, 0.5)",
                marginBottom: 16,
              }}
            >
              Colors
            </div>
            <div
              style={{
                display: "flex",
                gap: 20,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              {pattern.color_recommendations.map((color, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: getColorHex(color),
                      border: "2px solid rgba(255,255,255,0.25)",
                      boxShadow:
                        "0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.15)",
                    }}
                  />
                  <span
                    style={{
                      fontWeight: 500,
                      textTransform: "capitalize",
                      fontSize: "0.95rem",
                      color: "rgba(255, 255, 255, 0.9)",
                    }}
                  >
                    {color}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* Section Divider */}
      <div
        style={{
          height: 1,
          background:
            "linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.08) 50%, transparent 100%)",
          margin: "32px 0",
        }}
      />

      {/* Gear Setup - Premium card */}
      {pattern.gear && (
        <div
          style={{
            marginBottom: 32,
            padding: "24px 28px",
            background:
              "linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: 16,
            boxShadow: "inset 0 1px 2px rgba(255, 255, 255, 0.03)",
          }}
        >
          <h4
            style={{
              fontSize: "1.25rem",
              fontWeight: 600,
              marginBottom: 20,
              color: "rgba(255, 255, 255, 0.95)",
            }}
          >
            Gear Setup
          </h4>
          <div style={{ display: "grid", gap: 16 }}>
            {/* Rod */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                paddingBottom: 12,
                borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
              }}
            >
              <span
                style={{
                  fontSize: "0.85rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "rgba(255, 255, 255, 0.5)",
                  fontWeight: 600,
                }}
              >
                Rod
              </span>
              <span
                style={{
                  fontSize: "1.05rem",
                  fontWeight: 600,
                  color: "rgba(255, 255, 255, 0.95)",
                }}
              >
                {pattern.gear.rod}
              </span>
            </div>
            {/* Reel */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                paddingBottom: 12,
                borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
              }}
            >
              <span
                style={{
                  fontSize: "0.85rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "rgba(255, 255, 255, 0.5)",
                  fontWeight: 600,
                }}
              >
                Reel
              </span>
              <span
                style={{
                  fontSize: "1.05rem",
                  fontWeight: 600,
                  color: "rgba(255, 255, 255, 0.95)",
                }}
              >
                {pattern.gear.reel}
              </span>
            </div>
            {/* Line */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontSize: "0.85rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "rgba(255, 255, 255, 0.5)",
                  fontWeight: 600,
                }}
              >
                Line
              </span>
              <span
                style={{
                  fontSize: "1.05rem",
                  fontWeight: 600,
                  color: "rgba(255, 255, 255, 0.95)",
                }}
              >
                {pattern.gear.line}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Why This Works */}
      {pattern.why_this_works && (
        <div style={{ marginBottom: 32 }}>
          <h4
            style={{
              fontSize: "1.25rem",
              fontWeight: 600,
              marginBottom: 14,
              color: "rgba(255, 255, 255, 0.95)",
            }}
          >
            Why This Works
          </h4>
          <p
            style={{
              lineHeight: 1.7,
              opacity: 0.88,
              margin: 0,
              fontSize: "1.05rem",
            }}
          >
            {pattern.why_this_works}
          </p>
        </div>
      )}

      {/* Strategy */}
      {pattern.strategy && (
        <div style={{ marginBottom: 32 }}>
          <h4
            style={{
              fontSize: "1.25rem",
              fontWeight: 600,
              marginBottom: 14,
              color: "rgba(255, 255, 255, 0.95)",
            }}
          >
            Strategy
          </h4>
          <p
            style={{
              lineHeight: 1.7,
              opacity: 0.88,
              margin: 0,
              fontSize: "1.05rem",
            }}
          >
            {typeof pattern.strategy === "string"
              ? pattern.strategy.replace(/\.([A-Z])/g, ". $1")
              : pattern.strategy}
          </p>
        </div>
      )}

      {/* Section Divider */}
      <div
        style={{
          height: 1,
          background:
            "linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.08) 50%, transparent 100%)",
          margin: "32px 0",
        }}
      />

      {/* Targets - Premium interactive cards */}
      {pattern.targets && pattern.targets.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h4
            style={{
              fontSize: "1.25rem",
              fontWeight: 600,
              marginBottom: 16,
              color: "rgba(255, 255, 255, 0.95)",
            }}
          >
            Where to Fish
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
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
                    padding: "18px 22px",
                    background:
                      "linear-gradient(135deg, rgba(74, 144, 226, 0.08) 0%, rgba(74, 144, 226, 0.04) 100%)",
                    border: "1px solid rgba(74, 144, 226, 0.15)",
                    borderRadius: 12,
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                  }}
                >
                  <div
                    style={{
                      textTransform: "uppercase",
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      marginBottom: targetDef ? 8 : 0,
                      color: "#4A90E2",
                    }}
                  >
                    {targetName}
                  </div>
                  {targetDef && (
                    <div
                      style={{
                        fontSize: "0.95rem",
                        opacity: 0.75,
                        lineHeight: 1.6,
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

      {/* How to Work It - Premium step indicators */}
      {pattern.work_it && pattern.work_it.length > 0 && (
        <div style={{ marginBottom: 0 }}>
          <h4
            style={{
              fontSize: "1.25rem",
              fontWeight: 600,
              marginBottom: 16,
              color: "rgba(255, 255, 255, 0.95)",
            }}
          >
            How to Work It
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {pattern.work_it.map((step, i) => (
              <div
                key={i}
                style={{ display: "flex", gap: 16, alignItems: "flex-start" }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background:
                      "linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)",
                    boxShadow:
                      "0 2px 8px rgba(74, 144, 226, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    flexShrink: 0,
                    color: "#fff",
                  }}
                >
                  {i + 1}
                </div>
                <p
                  style={{
                    margin: 0,
                    lineHeight: 1.7,
                    opacity: 0.88,
                    fontSize: "1.05rem",
                  }}
                >
                  {step}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

// Helper function to map color names to hex values
function getColorHex(colorName: string): string {
  const colorMap: Record<string, string> = {
    // Natural / Clear Water
    "green pumpkin": "#4a5a3a",
    watermelon: "#6b8a5a", // Fixed: darker green with red undertone (actual bass fishing watermelon)
    "watermelon red": "#c97777",
    smoke: "#9e9e9e",
    "natural shad": "#d4d4d4",
    "ghost shad": "#e8e8e8",
    baitfish: "#c9c9c9",

    // Shad / Pelagic
    shad: "#c0c0c0",
    white: "#f5f5f5",
    pearl: "#f0f0e8",
    bone: "#e3dac9",

    // Craw / Bluegill
    "black/blue": "#1a1a2e",
    "green pumpkin blue": "#3d5a4a",
    bluegill: "#6b8e7f",
    brown: "#8b4513",
    "orange belly": "#ff8c42",

    // High-Contrast / Dirty Water
    chartreuse: "#dfff00",
    "chartreuse/white": "#dfff00",
    firetiger: "#ff6b35",

    // Metallic / Blade Context
    gold: "#ffd700",
    bronze: "#cd7f32",
    silver: "#c0c0c0",

    // Legacy/Fallback
    junebug: "#2d1b2e",
    "peanut butter": "#c4a15c",
    craw: "#8b4726",
    clear: "rgba(255,255,255,0.3)",
    black: "#1a1a1a",
    blue: "#2c5aa0",
    purple: "#663399",
    copper: "#b87333",

    // Default
    default: "#4A90E2",
  };

  const normalized = colorName.toLowerCase().replace(/\s+/g, " ");
  return colorMap[normalized] || colorMap["default"];
}
