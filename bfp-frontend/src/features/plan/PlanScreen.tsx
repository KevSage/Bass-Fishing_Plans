// src/features/plan/PlanScreen.tsx
import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { PlanGenerateResponse, Pattern } from "./types";
import { PlanNavigation, PlanTab } from "./PlanNavigation";
import { WeatherSection } from "./WeatherSection";
import { SolarArc } from "./components/SolarArc";
import { LURE_CATALOG, type LureData } from "@/data/lures";

// --- HELPER: Look up lure data by name ---
function findLureByName(lureName: string): LureData | null {
  const normalized = lureName.toLowerCase().replace(/[\s-]+/g, "_");
  // Try exact match first
  if (LURE_CATALOG[normalized]) return LURE_CATALOG[normalized];
  // Try partial match
  for (const key of Object.keys(LURE_CATALOG)) {
    if (key.includes(normalized) || normalized.includes(key)) {
      return LURE_CATALOG[key];
    }
  }
  // Try display name match
  for (const lure of Object.values(LURE_CATALOG)) {
    const lureNormalized = lure.display_name.toLowerCase().replace(/[\s-]+/g, "_");
    if (lureNormalized.includes(normalized) || normalized.includes(lureNormalized)) {
      return lure;
    }
  }
  return null;
}

// --- LURE DETAIL MODAL ---
function LureDetailModal({
  lure,
  onClose,
}: {
  lure: LureData;
  onClose: () => void;
}) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.85)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 20px 20px",
        animation: "fadeIn 0.2s ease-out",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "85%",
          maxWidth: 340,
          maxHeight: "70vh",
          background: "#121218",
          borderRadius: 20,
          border: "1px solid rgba(255, 255, 255, 0.1)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header with close button */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: 700,
              color: "#4A90E2",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            Lure Details
          </span>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "rgba(255, 255, 255, 0.5)",
              fontSize: "1.5rem",
              cursor: "pointer",
              padding: 0,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* Scrollable content */}
        <div style={{ overflowY: "auto", flex: 1 }}>
          {/* Lure Image */}
          <div
            style={{
              padding: 24,
              background: "rgba(255, 255, 255, 0.03)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <img
              src={lure.image}
              alt={lure.display_name}
              style={{
                maxWidth: "80%",
                maxHeight: 180,
                objectFit: "contain",
              }}
            />
          </div>

          {/* Name and Category */}
          <div style={{ padding: "20px 20px 0" }}>
            <h2
              style={{
                margin: "0 0 8px",
                fontSize: "1.25rem",
                fontWeight: 700,
                color: "#fff",
              }}
            >
              {lure.display_name}
            </h2>
            <span
              style={{
                display: "inline-block",
                padding: "4px 10px",
                background: "rgba(74, 144, 226, 0.15)",
                borderRadius: 100,
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "#4A90E2",
              }}
            >
              {lure.primary_category}
            </span>
          </div>

          {/* Description */}
          <p
            style={{
              padding: "16px 20px",
              fontSize: "0.9rem",
              lineHeight: 1.6,
              color: "rgba(255, 255, 255, 0.75)",
              margin: 0,
            }}
          >
            {lure.description}
          </p>

          {/* Tags */}
          <div style={{ padding: "0 20px 24px" }}>
            {/* Season */}
            <div style={{ marginBottom: 12 }}>
              <span
                style={{
                  display: "block",
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  color: "rgba(255, 255, 255, 0.4)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: 6,
                }}
              >
                Season
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {lure.season_affinity.map((s) => (
                  <span
                    key={s}
                    style={{
                      padding: "4px 10px",
                      borderRadius: 100,
                      fontSize: "0.75rem",
                      fontWeight: 500,
                      background: "rgba(76, 175, 80, 0.15)",
                      color: "#4CAF50",
                    }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Water Clarity */}
            <div style={{ marginBottom: 12 }}>
              <span
                style={{
                  display: "block",
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  color: "rgba(255, 255, 255, 0.4)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: 6,
                }}
              >
                Water Clarity
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {lure.water_clarity.map((c) => (
                  <span
                    key={c}
                    style={{
                      padding: "4px 10px",
                      borderRadius: 100,
                      fontSize: "0.75rem",
                      fontWeight: 500,
                      background: "rgba(33, 150, 243, 0.15)",
                      color: "#2196F3",
                    }}
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>

            {/* Conditions */}
            <div style={{ marginBottom: 12 }}>
              <span
                style={{
                  display: "block",
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  color: "rgba(255, 255, 255, 0.4)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: 6,
                }}
              >
                Conditions
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {lure.conditions.map((c) => (
                  <span
                    key={c}
                    style={{
                      padding: "4px 10px",
                      borderRadius: 100,
                      fontSize: "0.75rem",
                      fontWeight: 500,
                      background: "rgba(255, 193, 7, 0.15)",
                      color: "#FFC107",
                    }}
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>

            {/* Cover */}
            <div>
              <span
                style={{
                  display: "block",
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  color: "rgba(255, 255, 255, 0.4)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: 6,
                }}
              >
                Cover
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {lure.cover_type.map((c) => (
                  <span
                    key={c}
                    style={{
                      padding: "4px 10px",
                      borderRadius: 100,
                      fontSize: "0.75rem",
                      fontWeight: 500,
                      background: "rgba(156, 39, 176, 0.15)",
                      color: "#CE93D8",
                    }}
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- UI CONFIG ---
const UI = {
  pageContainer: {
    paddingTop: 10,
    paddingBottom: 110, // Increased for larger nav
    minHeight: "100vh",
    animation: "fadeIn 0.4s ease-out",
  } as React.CSSProperties,
  eyebrow: {
    fontSize: "0.75rem",
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    fontWeight: 700,
    color: "rgba(255, 255, 255, 0.55)",
    marginBottom: 4,
  } as React.CSSProperties,
};

export function PlanScreen({
  response,
  enableLiveUpdates = false,
}: {
  response: PlanGenerateResponse;
  enableLiveUpdates?: boolean;
}) {
  const { plan } = response;
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<PlanTab>("weather");
  const [selectedLure, setSelectedLure] = useState<LureData | null>(null);

  // Handler for lure image clicks
  const handleLureClick = (lureName: string) => {
    const lureData = findLureByName(lureName);
    if (lureData) {
      setSelectedLure(lureData);
    }
  };

  // SCROLL TO TOP ON TAB CHANGE
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeTab]);

  const handleMapClick = () => {
    const { latitude, longitude, location_name } = plan.conditions;
    navigate(
      `/members?lat=${latitude}&lng=${longitude}&lake=${encodeURIComponent(
        location_name,
      )}`,
    );
  };

  const activeConditions = useMemo(
    () => ({
      ...(plan.conditions as any),
      weather_card_insights: plan.weather_card_insights || {},
      forecast_rating: plan.forecast_rating || null,
    }),
    [plan],
  );

  const solarData = {
    sunrise: activeConditions.sunriseTime || "6:00 AM",
    sunset: activeConditions.sunsetTime || "8:00 PM",
    solarNoon: activeConditions.solarNoonTime || "1:00 PM",
  };

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div style={UI.pageContainer}>
        {/* VIEW 1: WEATHER */}
        {activeTab === "weather" && (
          <div style={{ animation: "fadeIn 0.3s ease-out" }}>
            <WeatherSection
              conditions={activeConditions}
              outlookBlurb={plan.outlook_blurb}
              enableLiveUpdates={enableLiveUpdates}
            />
          </div>
        )}

        {/* VIEW 2: PRIMARY PATTERN */}
        {activeTab === "pattern1" && (
          <PatternView pattern={plan.primary} number={1} isPrimary={true} onLureClick={handleLureClick} />
        )}

        {/* VIEW 3: PIVOT PATTERN */}
        {activeTab === "pattern2" && (
          <PatternView pattern={plan.secondary} number={2} isPrimary={false} onLureClick={handleLureClick} />
        )}

        {/* VIEW 4: TIMELINE */}
        {activeTab === "timeline" && (
          <TimelineView
            progression={plan.day_progression || []}
            solarData={solarData}
          />
        )}
      </div>

      <PlanNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onMapClick={handleMapClick}
      />

      {/* Lure Detail Modal */}
      {selectedLure && (
        <LureDetailModal
          lure={selectedLure}
          onClose={() => setSelectedLure(null)}
        />
      )}
    </>
  );
}

// --- SUB-COMPONENT: PATTERN DETAIL VIEW ---
function PatternView({
  pattern,
  number,
  isPrimary,
  onLureClick,
}: {
  pattern: Pattern;
  number: number;
  isPrimary: boolean;
  onLureClick?: (lureName: string) => void;
}) {
  if (!pattern)
    return <div className="p-8 text-center opacity-50">Pattern loading...</div>;

  return (
    <div style={{ padding: "0 8px", animation: "fadeIn 0.3s ease-out" }}>
      {/* HEADER: Pattern Type & Name */}
      <div style={{ marginBottom: 20, padding: "10px 12px 0" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 14px",
            background: isPrimary
              ? "rgba(74, 144, 226, 0.1)"
              : "rgba(255,255,255,0.06)",
            border: `1px solid ${
              isPrimary ? "rgba(74,144,226,0.25)" : "rgba(255,255,255,0.1)"
            }`,
            borderRadius: 20,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: isPrimary ? "#4A90E2" : "rgba(255,255,255,0.6)",
              boxShadow: isPrimary ? "0 0 8px rgba(74,144,226,0.6)" : "none",
            }}
          />
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: 800,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: isPrimary ? "#4A90E2" : "rgba(255,255,255,0.8)",
            }}
          >
            {isPrimary ? "Primary Pattern" : "Pivot Strategy"}
          </span>
        </div>
        <h2
          style={{
            fontSize: "2.2rem",
            fontWeight: 700,
            lineHeight: 1,
            color: "#fff",
            margin: 0,
          }}
        >
          {pattern.presentation}
        </h2>
      </div>

      {/* 1. HERO LURE IMAGE */}
      <div
        onClick={() => onLureClick?.(pattern.base_lure)}
        style={{
          position: "relative",
          background:
            "radial-gradient(circle at center, rgba(74, 144, 226, 0.08) 0%, transparent 70%)",
          borderRadius: 24,
          padding: "20px 0",
          marginBottom: 32,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 200,
          cursor: onLureClick ? "pointer" : "default",
        }}
      >
        {pattern.colors?.asset_key ? (
          <img
            src={`/images/lures/${pattern.colors.asset_key}`}
            alt={pattern.base_lure}
            style={{
              width: "90%",
              maxWidth: 320,
              height: "auto",
              objectFit: "contain",
              filter: "drop-shadow(0 20px 30px rgba(0,0,0,0.5))",
            }}
          />
        ) : (
          <div
            style={{
              alignSelf: "center",
              color: "rgba(255,255,255,0.2)",
              fontStyle: "italic",
            }}
          >
            Lure Visual Pending
          </div>
        )}
        {/* Tap hint */}
        {onLureClick && (
          <div
            style={{
              marginTop: 12,
              fontSize: "0.75rem",
              color: "rgba(255, 255, 255, 0.4)",
              fontWeight: 500,
            }}
          >
            Tap for lure details
          </div>
        )}
      </div>

      {/* 2. THE BRIEF */}
      <div style={{ padding: "0 12px", marginBottom: 40 }}>
        <p
          style={{
            fontSize: "1.15rem",
            lineHeight: 1.6,
            color: "rgba(255,255,255,0.9)",
            margin: 0,
            fontWeight: 500,
          }}
        >
          {pattern.pattern_summary}
        </p>
      </div>

      {/* 3. TECHNICAL SPECS + COLORS */}
      <div
        style={{
          position: "relative",
          marginBottom: 40,
          padding: "24px",
          background: "rgba(10, 10, 10, 0.4)",
          borderRadius: 24,
          border: "1px solid rgba(74, 144, 226, 0.2)",
          overflow: "hidden",
        }}
      >
        {/* Blue Top Seal */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            background: "#4A90E2",
            boxShadow: "0 0 15px rgba(74, 144, 226, 0.4)",
          }}
        />

        <h4
          style={{
            fontSize: "0.8rem",
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.15em",
            color: "#4A90E2",
            marginBottom: 24,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
          </svg>
          Technical Specs
        </h4>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "28px 16px",
          }}
        >
          <div style={{ gridColumn: "span 2" }}>
            <div style={UI.eyebrow}>Primary Lure</div>
            <div
              style={{
                fontSize: "1.35rem",
                fontWeight: 700,
                color: "#fff",
                textTransform: "capitalize",
              }}
            >
              {pattern.base_lure}
            </div>
          </div>

          {/* SUGGESTED COLORS (Restored) */}
          {pattern.color_recommendations &&
            pattern.color_recommendations.length > 0 && (
              <div
                style={{
                  gridColumn: "span 2",
                  padding: "16px 20px",
                  background: "rgba(74, 144, 226, 0.05)",
                  borderRadius: 14,
                  border: "1px solid rgba(74, 144, 226, 0.15)",
                }}
              >
                <div
                  style={{
                    ...UI.eyebrow,
                    marginBottom: 14,
                    color: "rgba(74, 144, 226, 0.8)",
                  }}
                >
                  Suggested Colors
                </div>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                  {pattern.color_recommendations.map((color, i) => (
                    <div
                      key={i}
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <div
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: "50%",
                          background: getSwatchBackground(color),
                          border: "2px solid rgba(255,255,255,0.3)",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
                        }}
                      />
                      <span
                        style={{
                          fontSize: "0.95rem",
                          fontWeight: 600,
                          color: "#fff",
                          textTransform: "capitalize",
                        }}
                      >
                        {color}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          <div style={{ gridColumn: "span 2" }}>
            <div style={UI.eyebrow}>Trailer / Plastic</div>
            <div
              style={{
                fontSize: "1.1rem",
                fontWeight: 600,
                color: "#fff",
                textTransform: "capitalize",
              }}
            >
              {pattern.soft_plastic || pattern.trailer || "None"}
            </div>
          </div>

          <div>
            <div style={UI.eyebrow}>Rod</div>
            <div
              style={{
                fontSize: "0.95rem",
                fontWeight: 600,
                color: "#fff",
                textTransform: "capitalize",
              }}
            >
              {pattern.gear?.rod || "N/A"}
            </div>
          </div>
          <div>
            <div style={UI.eyebrow}>Reel</div>
            <div
              style={{
                fontSize: "0.95rem",
                fontWeight: 600,
                color: "#fff",
                textTransform: "capitalize",
              }}
            >
              {pattern.gear?.reel || "N/A"}
            </div>
          </div>
          <div
            style={{
              gridColumn: "span 2",
              borderTop: "1px solid rgba(255,255,255,0.06)",
              paddingTop: 16,
            }}
          >
            <div style={UI.eyebrow}>Line Selection</div>
            <div
              style={{ fontSize: "1rem", fontWeight: 700, color: "#4A90E2" }}
            >
              {pattern.gear?.line || "N/A"}
            </div>
          </div>
          {pattern.gear?.note && (
            <div
              style={{
                gridColumn: "span 2",
                marginTop: 16,
                padding: "12px 14px",
                background: "rgba(74, 144, 226, 0.08)",
                borderRadius: 10,
                borderLeft: "3px solid rgba(74, 144, 226, 0.4)",
              }}
            >
              <div
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.5)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: 4,
                }}
              >
                Pro Tip
              </div>
              <div
                style={{
                  fontSize: "0.9rem",
                  color: "rgba(255,255,255,0.85)",
                  lineHeight: 1.4,
                }}
              >
                {pattern.gear.note}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. STRATEGY (Logic & Game Plan) */}
      <div style={{ padding: "0 8px", marginBottom: 40 }}>
        <h3
          style={{
            fontSize: "1.2rem",
            fontWeight: 700,
            color: "#fff",
            marginBottom: 20,
            paddingLeft: 4,
          }}
        >
          Strategy & Execution
        </h3>

        {/* LOGIC (Restored to Box Layout) */}
        {pattern.why_this_works && (
          <div
            style={{
              position: "relative",
              padding: "24px",
              background: "rgba(255, 255, 255, 0.03)",
              borderRadius: 20,
              border: "1px solid rgba(255, 255, 255, 0.08)",
              marginBottom: 20,
            }}
          >
            {/* Brain Watermark */}
            <div
              style={{
                position: "absolute",
                right: -10,
                top: -10,
                opacity: 0.04,
                color: "#4A90E2",
                pointerEvents: "none",
              }}
            >
              <svg
                width="100"
                height="100"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              >
                <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.97-2.02 2.5 2.5 0 0 1-2.02-2.97 2.5 2.5 0 0 1 .45-4.95 2.5 2.5 0 0 1 2-4.5 2.5 2.5 0 0 1 4.96-.44Z" />
                <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.97-2.02 2.5 2.5 0 0 0 2.02-2.97 2.5 2.5 0 0 0-.45-4.95 2.5 2.5 0 0 0-2-4.5 2.5 2.5 0 0 0-4.96-.44Z" />
              </svg>
            </div>

            <h4
              style={{
                fontSize: "0.9rem",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                color: "#fff",
                marginBottom: 12,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span style={{ color: "#4A90E2" }}>///</span> The Logic
            </h4>
            <p
              style={{
                color: "rgba(255,255,255,0.85)",
                lineHeight: 1.6,
                fontSize: "1.05rem",
              }}
            >
              {pattern.why_this_works}
            </p>
          </div>
        )}

        {/* GAME PLAN */}
        {pattern.strategy && (
          <div
            style={{
              position: "relative",
              padding: "24px",
              background: "rgba(255, 255, 255, 0.03)",
              borderRadius: 20,
              border: "1px solid rgba(255, 255, 255, 0.08)",
              marginBottom: 32,
            }}
          >
            {/* Crosshair Watermark */}
            <div
              style={{
                position: "absolute",
                right: -10,
                top: -10,
                opacity: 0.04,
                color: "#fff",
                pointerEvents: "none",
              }}
            >
              <svg
                width="100"
                height="100"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2v20M2 12h20" />
              </svg>
            </div>

            <h4
              style={{
                fontSize: "0.9rem",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                color: "#fff",
                marginBottom: 12,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span style={{ color: "#4A90E2" }}>///</span> Game Plan
            </h4>
            <p
              style={{
                lineHeight: 1.75,
                margin: 0,
                fontSize: "1.1rem",
                fontWeight: 500,
                color: "rgba(255, 255, 255, 0.95)",
              }}
            >
              {typeof pattern.strategy === "string"
                ? pattern.strategy.replace(/\.([A-Z])/g, ". $1")
                : pattern.strategy}
            </p>
          </div>
        )}
      </div>

      {/* 5. TARGETS (Restored Definitions) */}
      {(pattern.work_it_cards || []).length > 0 && (
        <div style={{ marginTop: 8 }}>
          <h4
            style={{
              fontSize: "1.3rem",
              fontWeight: 700,
              marginBottom: 20,
              color: "#fff",
              borderBottom: "3px solid #4A90E2",
              display: "inline-block",
              paddingBottom: "4px",
              marginLeft: 8,
            }}
          >
            Targets
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {(pattern.work_it_cards || []).map((item: any, i: number) => {
              const isObject =
                typeof item === "object" && item !== null && "name" in item;
              return (
                <div
                  key={i}
                  style={{
                    position: "relative",
                    padding: "24px",
                    background: "rgba(255, 255, 255, 0.03)",
                    borderRadius: 20,
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    overflow: "hidden",
                  }}
                >
                  {/* Scope Watermark */}
                  <div
                    style={{
                      position: "absolute",
                      right: -10,
                      bottom: -10,
                      opacity: 0.04,
                      color: "#4A90E2",
                      pointerEvents: "none",
                    }}
                  >
                    <svg
                      width="120"
                      height="120"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 8v8M8 12h8" />
                    </svg>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 8,
                    }}
                  >
                    {/* Target Icon */}
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#4A90E2"
                      strokeWidth="2.5"
                    >
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    <h5
                      style={{
                        fontSize: "1.25rem",
                        fontWeight: 700,
                        margin: 0,
                        color: "#fff",
                        textTransform: "uppercase",
                        letterSpacing: "0.02em",
                      }}
                    >
                      {isObject ? item.name : "Location"}
                    </h5>
                  </div>

                  {/* DEFINITION (Restored) */}
                  {isObject && item.definition && (
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: "0.9rem",
                        color: "rgba(74, 144, 226, 0.85)",
                        marginBottom: 14,
                        paddingLeft: 28, // Indent to align with text
                      }}
                    >
                      {item.definition}
                    </div>
                  )}

                  <p
                    style={{
                      margin: 0,
                      lineHeight: 1.7,
                      fontSize: "1.1rem",
                      color: "rgba(255, 255, 255, 0.92)",
                      borderLeft: "3px solid rgba(74, 144, 226, 0.3)",
                      paddingLeft: 16,
                    }}
                  >
                    {isObject ? item.how_to_fish : item}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// --- SUB-COMPONENT: TIMELINE VIEW ---
function TimelineView({
  progression,
  solarData,
}: {
  progression: string[];
  solarData: any;
}) {
  if (!progression) return null;

  return (
    <div style={{ padding: "0 12px", animation: "fadeIn 0.3s ease-out" }}>
      <div style={{ marginBottom: 24, paddingLeft: 8 }}>
        <h2
          style={{
            fontSize: "1.8rem",
            fontWeight: 700,
            color: "#fff",
            margin: 0,
          }}
        >
          Day Schedule
        </h2>
      </div>

      <SolarArc {...solarData} />

      <div style={{ marginTop: 24, position: "relative", paddingLeft: 8 }}>
        <div
          style={{
            position: "absolute",
            left: 16,
            top: 12,
            bottom: 20,
            width: 2,
            background: "rgba(255, 255, 255, 0.1)",
          }}
        />

        {progression.map((item, i) => {
          const parts = item.split(": ");
          const time = parts[0];
          const desc = parts.slice(1).join(": ");

          return (
            <div
              key={i}
              style={{
                position: "relative",
                paddingLeft: 40,
                marginBottom: 36,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 9,
                  top: 4,
                  width: 16,
                  height: 16,
                  background: "#121212",
                  border: "2px solid #4A90E2",
                  borderRadius: "50%",
                  boxShadow: "0 0 10px rgba(74,144,226,0.3)",
                  zIndex: 2,
                }}
              />

              <div
                style={{
                  color: "#4A90E2",
                  fontWeight: 800,
                  fontSize: "0.9rem",
                  marginBottom: 6,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {time}
              </div>
              <p
                style={{
                  color: "rgba(255,255,255,0.85)",
                  fontSize: "1.05rem",
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                {desc}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- COLOR UTILS (Re-added) ---
function getColorHex(colorName: string): string {
  const colorMap: Record<string, string> = {
    "green pumpkin": "#4a5a3a",
    watermelon: "#6b8a5a",
    "watermelon red": "#c97777",
    smoke: "#9e9e9e",
    "natural shad": "#d4d4d4",
    "ghost shad": "#e8e8e8",
    baitfish: "#c9c9c9",
    shad: "#c0c0c0",
    white: "#f5f5f5",
    pearl: "#f0f0e8",
    bone: "#e3dac9",
    "black/blue": "#1a1a2e",
    "green pumpkin blue": "#3d5a4a",
    bluegill: "#6b8e7f",
    brown: "#8b4513",
    "orange belly": "#ff8c42",
    chartreuse: "#dfff00",
    "chartreuse/white": "#dfff00",
    firetiger: "#ff6b35",
    gold: "#ffd700",
    bronze: "#cd7f32",
    silver: "#c0c0c0",
    junebug: "#2d1b2e",
    "peanut butter": "#c4a15c",
    craw: "#8b4726",
    clear: "rgba(255,255,255,0.3)",
    black: "#1a1a1a",
    blue: "#2c5aa0",
    purple: "#663399",
    copper: "#b87333",
    "red craw": "#8b2e1a",
    "baby bass": "#7a8f6a",
    "green pumpkin orange": "#6b5a33",
    "peanut butter & jelly": "#5b2a5e",
    "sexy shad": "#bfc6cf",
    "chartreuse/black back": "#b5d800",
    "citrus shad": "#bcd94a",
    chrome: "#c0c0c0",
    "pro blue": "#3b5aa6",
    "table rock": "#7a6bd1",
    "ghost minnow": "#dfe6ee",
    transparent: "rgba(255,255,255,0.18)",
    translucent: "rgba(255,255,255,0.18)",
    green: "#3f7a3a",
    yellow: "#d9c300",
    default: "#4A90E2",
  };
  const normalized = colorName.toLowerCase().replace(/\s+/g, " ");
  return colorMap[normalized] || colorMap["default"];
}

function normalizeColorToken(token: string): string {
  return token.toLowerCase().trim().replace(/\s+/g, " ");
}

function normalizeComboPart(part: string): string {
  const p = normalizeColorToken(part);
  if (p === "black back") return "black";
  if (p === "blue back") return "blue";
  return p;
}

function getSwatchBackground(colorToken: string): string {
  const normalized = normalizeColorToken(colorToken);
  if (normalized.includes("/")) {
    const [rawA, rawB] = normalized.split("/", 2);
    const a = getColorHex(normalizeComboPart(rawA));
    const b = getColorHex(normalizeComboPart(rawB));
    return `linear-gradient(135deg, ${a} 0%, ${a} 50%, ${b} 50%, ${b} 100%)`;
  }
  return getColorHex(normalized);
}
