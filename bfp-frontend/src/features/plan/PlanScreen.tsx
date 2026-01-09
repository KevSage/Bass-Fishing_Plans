// src/features/plan/PlanScreen.tsx
// Complete plan display: consolidated plan UI with weather extracted to WeatherSection.
// UPDATE: Added id="weather" wrapper so PlanNavigation can scroll to it.

import React from "react";
import type { PlanGenerateResponse, Pattern } from "./types";
import { PlanNavigation } from "./PlanNavigation";
import { WeatherSection } from "./WeatherSection";

const UI: Record<string, React.CSSProperties> = {
  card: {
    background:
      "linear-gradient(135deg, rgba(74, 144, 226, 0.07) 0%, rgba(10, 10, 10, 0.45) 100%)",
    border: "1px solid rgba(74, 144, 226, 0.22)",
    borderRadius: 20,
    padding: 24,
    boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
  },

  subcard: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 18,
  },

  eyebrow: {
    fontSize: "0.75rem",
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    fontWeight: 700,
    color: "rgba(255, 255, 255, 0.55)",
    marginBottom: 10,
  },

  divider: {
    height: 1,
    background: "rgba(255,255,255,0.08)",
    margin: "18px 0",
  },
};
function getTimeIcon(label: string) {
  const normalized = label.toLowerCase();

  // Morning: Rising Sun
  if (normalized.includes("morning")) {
    return (
      <svg
        width="140"
        height="140"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32l1.41-1.41" />
        <circle cx="12" cy="12" r="4" />
      </svg>
    );
  }
  // Midday: High Sun
  if (normalized.includes("midday")) {
    return (
      <svg
        width="140"
        height="140"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <circle cx="12" cy="12" r="5" />
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
      </svg>
    );
  }
  // Evening: Crescent Moon
  return (
    <svg
      width="140"
      height="140"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
    </svg>
  );
}

export function PlanScreen({ response }: { response: PlanGenerateResponse }) {
  const { plan } = response;

  // Merge the insights directly into conditions
  const activeConditions = {
    ...(plan.conditions as any),
    weather_insights: plan.weather_insights || [],
  };

  return (
    <>
      <div style={{ marginTop: 18, paddingBottom: 100 }}>
        {/* Extra padding for mobile nav */}

        {/* ✅ FIX: Added ID wrapper for Navigation */}
        <div id="weather">
          <WeatherSection
            conditions={activeConditions}
            outlookBlurb={plan.outlook_blurb}
          />
        </div>

        {/* Pattern 1 */}
        <div id="pattern-1">
          <PatternCard pattern={plan.primary} patternNumber={1} isPrimary />
        </div>

        {/* Pattern 2 */}
        <div id="pattern-2">
          <PatternCard
            pattern={plan.secondary}
            patternNumber={2}
            isPrimary={false}
          />
        </div>

        {/* Day Progression */}
        {/* Replace the Day Progression map in PlanScreen.tsx */}
        {/* Day Progression Implementation */}
        {/* Day Progression Section with Safety Check */}
        {plan.day_progression && plan.day_progression.length > 0 && (
          <div
            id="day-progression"
            style={{
              ...UI.card,
              marginTop: 32,
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Restoration of the Header Label */}
            <div
              style={{
                ...UI.eyebrow,
                fontSize: "1.1rem",
                color: "rgba(74,144,226,0.9)",
                marginBottom: 28,
              }}
            >
              Day Progression
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 0,
                position: "relative",
              }}
            >
              {plan.day_progression.map((item, i) => {
                // Defensive check for the string content
                if (typeof item !== "string") return null;

                const parts = item.split(": ");
                const timeLabel = parts[0].toUpperCase();
                const description = parts.slice(1).join(": ");
                const isLast = i === plan.day_progression!.length - 1;

                return (
                  <div
                    key={i}
                    style={{
                      position: "relative",
                      paddingLeft: 36,
                      paddingBottom: isLast ? 0 : 36,
                      zIndex: 1,
                    }}
                  >
                    {/* Vertical Connector Line */}
                    {!isLast && (
                      <div
                        style={{
                          position: "absolute",
                          left: 6,
                          top: 28,
                          bottom: 0,
                          width: 2,
                          background:
                            "linear-gradient(to bottom, #4A90E2 0%, rgba(74, 144, 226, 0.05) 100%)",
                        }}
                      />
                    )}

                    {/* Timeline Dot */}
                    <div
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 8,
                        width: 14,
                        height: 14,
                        borderRadius: "50%",
                        backgroundColor: "#0a0a0a",
                        border: "2px solid #4A90E2",
                        boxShadow: "0 0 12px rgba(74, 144, 226, 0.4)",
                        zIndex: 2,
                      }}
                    />

                    {/* Subtle Time Backdrop (Icon stays out of the way) */}
                    <div
                      style={{
                        position: "absolute",
                        right: -10,
                        top: -10,
                        opacity: 0.04,
                        pointerEvents: "none",
                        zIndex: 0,
                        color: "#4A90E2",
                      }}
                    >
                      {getTimeIcon(timeLabel)}
                    </div>

                    {/* Text Content */}
                    <div style={{ position: "relative", zIndex: 1 }}>
                      <div
                        style={{
                          fontWeight: 800,
                          color: "#4A90E2",
                          fontSize: "0.85rem",
                          letterSpacing: "0.12em",
                          marginBottom: 6,
                        }}
                      >
                        {timeLabel}
                      </div>
                      <p
                        style={{
                          margin: 0,
                          lineHeight: 1.75,
                          fontSize: "1.1rem",
                          color: "rgba(255, 255, 255, 0.92)",
                          maxWidth: "92%",
                          fontWeight: 400,
                        }}
                      >
                        {description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <PlanNavigation plan={plan} />
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
        marginTop: 32,
        position: "relative",
        background: isPrimary
          ? "linear-gradient(145deg, rgba(74, 144, 226, 0.06) 0%, rgba(10, 10, 10, 0.4) 50%, rgba(74, 144, 226, 0.03) 100%)"
          : "linear-gradient(145deg, rgba(255, 255, 255, 0.02) 0%, rgba(10, 10, 10, 0.4) 50%, rgba(255, 255, 255, 0.01) 100%)",
        border: isPrimary
          ? "1px solid rgba(74, 144, 226, 0.15)"
          : "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: 24,
        padding: "24px",
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
          fontSize: "0.8rem",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          fontWeight: 700,
          color: isPrimary ? "#fff" : "rgba(255, 255, 255, 0.9)",
        }}
      >
        Pattern {patternNumber}
      </div>

      {/* Presentation Title */}
      <h3
        style={{
          fontSize: "1.5rem",
          fontWeight: 600,
          letterSpacing: "-0.02em",
          marginTop: 12,
          marginBottom: 32,
          lineHeight: 1,
          color: "rgba(255, 255, 255, 0.95)",
        }}
      >
        {pattern.presentation}
      </h3>

      {/* Pattern Summary */}
      {/* The Brief - High-Level Pattern Overview */}
      {pattern.pattern_summary && (
        <div
          style={{
            position: "relative",
            marginBottom: 24,
            padding: "20px 24px",
            background:
              "linear-gradient(135deg, rgba(74, 144, 226, 0.08) 0%, rgba(10, 10, 10, 0.4) 100%)",
            border: "1px solid rgba(74, 144, 226, 0.25)",
            borderRadius: 20,
            boxShadow: "0 6px 20px rgba(0, 0, 0, 0.25)",
            overflow: "hidden",
          }}
        >
          {/* Sonar/Pulse Watermark */}
          <div
            style={{
              position: "absolute",
              right: -15,
              top: -15,
              opacity: 0.06,
              color: "#4A90E2",
              pointerEvents: "none",
            }}
          >
            <svg
              width="150"
              height="150"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
            >
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="7" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="12" cy="12" r="1" />
            </svg>
          </div>

          <h4
            style={{
              fontSize: "0.8rem",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              color: "#4A90E2",
              marginBottom: 12,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            {/* Briefing Icon */}
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            The Brief
          </h4>

          <p
            style={{
              lineHeight: 1.7,
              margin: 0,
              fontSize: "1.15rem",
              fontWeight: 500, // Medium weight for better readability
              letterSpacing: "0.01em",
              color: "#fff",
              position: "relative",
              zIndex: 1,
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
            "linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.04) 50%, transparent 100%)",
          margin: "0px 0",
        }}
      />

      {/* Lure Image Container */}
      <div
        style={{
          position: "relative",
          marginBottom: 16,
          overflow: "hidden",
          background:
            "radial-gradient(ellipse at center, rgba(74, 144, 226, 0.12) 0%, rgba(74, 144, 226, 0.04) 40%, transparent 70%)",
          borderRadius: 20,
        }}
      >
        {/* Glow effect */}
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
            padding: "20px 10px",
            zIndex: 1,
          }}
        >
          {pattern.colors.asset_key ? (
            <img
              className="image-fade"
              src={`/images/lures/${pattern.colors.asset_key}`}
              alt={pattern.base_lure}
              style={{
                width: "100%",
                maxWidth: 480,
                height: "auto",
                objectFit: "contain",
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
      <div style={{ marginBottom: 16 }}>
        <div
          style={{
            fontSize: ".75rem",
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
            fontSize: "1.3rem",
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
                fontSize: "0.9rem",
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

      {/* Color Swatches */}
      {pattern.color_recommendations &&
        pattern.color_recommendations.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <div
              style={{
                fontSize: "0.8rem",
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
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      background: getSwatchBackground(color),
                      border: "2px solid rgba(255,255,255,0.25)",
                      boxShadow:
                        "0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.15)",
                    }}
                  />
                  <span
                    style={{
                      fontWeight: 500,
                      textTransform: "capitalize",
                      fontSize: ".9rem",
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
          margin: "10px 0",
        }}
      />

      {/* Gear Setup */}
      {pattern.gear && (
        <div
          style={{
            marginBottom: 32,
            padding: "12px 14px",
            background:
              "linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: 16,
            boxShadow: "inset 0 1px 2px rgba(255, 255, 255, 0.03)",
          }}
        >
          <h4
            style={{
              fontSize: "1.2rem",
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
                  fontSize: "0.9rem",
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
                  fontSize: "0.9rem",
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
                  fontSize: "0.9rem",
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
                  fontSize: ".9rem",
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
                  fontSize: "0.9rem",
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
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  color: "rgba(255, 255, 255, 0.95)",
                  maxWidth: "70%",
                  textAlign: "right",
                }}
              >
                {pattern.gear.line}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* The Logic - Theoretical Foundation */}
      {pattern.why_this_works && (
        <div
          style={{
            position: "relative",
            marginTop: 32,
            padding: "24px",
            background: "rgba(74, 144, 226, 0.05)", // Slightly more blue depth
            borderRadius: 20,
            border: "1px solid rgba(74, 144, 226, 0.2)",
            overflow: "hidden",
          }}
        >
          {/* Logic Watermark */}
          <div
            style={{
              position: "absolute",
              right: -10,
              top: -10,
              opacity: 0.05,
              color: "#4A90E2",
              pointerEvents: "none",
            }}
          >
            <svg
              width="140"
              height="140"
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
              fontSize: "0.85rem",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              color: "#4A90E2",
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            {/* Icon instead of hyphen */}
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
            >
              <circle cx="12" cy="12" r="10" />
            </svg>
            The Logic
          </h4>

          <p
            style={{
              lineHeight: 1.75,
              margin: 0,
              fontSize: "1.15rem",
              color: "rgba(255, 255, 255, 0.95)",
              fontWeight: 400,
            }}
          >
            {pattern.why_this_works}
          </p>
        </div>
      )}

      {/* Game Plan - High-Visibility Strategy */}
      {pattern.strategy && (
        <div
          style={{
            position: "relative",
            marginTop: 20,
            padding: "24px",
            background: "rgba(255, 255, 255, 0.04)", // Increased brightness
            borderRadius: 20,
            border: "1px solid rgba(255, 255, 255, 0.15)",
            overflow: "hidden",
            boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
          }}
        >
          {/* Subtle Tactical Grid Overlay */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px)`,
              backgroundSize: "20px 20px",
              opacity: 0.4,
              pointerEvents: "none",
            }}
          />

          {/* Map Watermark - Increased visibility */}
          <div
            style={{
              position: "absolute",
              right: -15,
              bottom: -15,
              opacity: 0.07,
              color: "#fff",
              pointerEvents: "none",
              transform: "rotate(-5deg)",
            }}
          >
            <svg
              width="160"
              height="160"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
            >
              <path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6zm6-3v15m6-12v15" />
            </svg>
          </div>

          <h4
            style={{
              fontSize: "0.85rem",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              color: "#fff",
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            {/* Target/Action Icon */}
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
            >
              <path d="M12 2v20M2 12h20" />
              <circle cx="12" cy="12" r="6" />
            </svg>
            Game Plan
          </h4>

          <p
            style={{
              lineHeight: 1.75,
              margin: 0,
              fontSize: "1.2rem", // Slightly larger for "Action"
              color: "#fff",
              fontWeight: 500, // Thicker font to stand out
              position: "relative",
              zIndex: 1,
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

      {/* How to Work It */}
      {((pattern.work_it_cards && pattern.work_it_cards.length > 0) ||
        (pattern.work_it && pattern.work_it.length > 0)) && (
        <div style={{ marginBottom: 0 }}>
          <h4
            style={{
              fontSize: "1.25rem",
              fontWeight: 600,
              marginBottom: 16,
              color: "rgba(255, 255, 255, 0.95)",
              display: "inline-block",
              paddingBottom: "6px",
              borderBottom: "3px solid rgb(74, 144, 226)",
            }}
          >
            Targets
          </h4>

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {(pattern.work_it_cards || pattern.work_it || []).map((item, i) => {
              // Handle new object format
              if (typeof item === "object" && item !== null && "name" in item) {
                return (
                  <div
                    key={i}
                    style={{
                      padding: "20px 24px",
                      background: "rgba(255, 255, 255, 0.02)",
                      borderRadius: 12,
                      border: "1px solid rgba(255, 255, 255, 0.06)",
                      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                    }}
                  >
                    <h5
                      style={{
                        fontSize: ".95rem",
                        fontWeight: 700,
                        marginBottom: 8,
                        color: "#4A90E2",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {item.name}
                    </h5>

                    <p
                      style={{
                        margin: "0 0 12px 0",
                        lineHeight: 1.6,
                        opacity: 0.7,
                        fontSize: "0.9rem",
                        fontStyle: "italic",
                        color: "rgba(255, 255, 255, 0.8)",
                      }}
                    >
                      {item.definition}
                    </p>

                    <p
                      style={{
                        margin: 0,
                        paddingLeft: 10,
                        borderLeft: "3px solid rgba(74, 144, 226, 0.3)",
                        lineHeight: 1.5,
                        opacity: 0.92,
                        fontSize: "1.1rem",
                        color: "rgba(255, 255, 255, 0.95)",
                      }}
                    >
                      {item.how_to_fish}
                    </p>
                  </div>
                );
              }

              // Handle legacy string format
              return (
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
                    {item}
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

    // Rig / Bottom contact
    "red craw": "#8b2e1a",
    "baby bass": "#7a8f6a",
    "green pumpkin orange": "#6b5a33",
    "peanut butter & jelly": "#5b2a5e",

    // Crankbait / Hardbait
    "sexy shad": "#bfc6cf",
    "chartreuse/black back": "#b5d800",
    "citrus shad": "#bcd94a",
    chrome: "#c0c0c0",

    // Jerkbait
    "pro blue": "#3b5aa6", // optional tweak; yours is fine if you prefer darker
    "table rock": "#7a6bd1",
    "ghost minnow": "#dfe6ee",
    transparent: "rgba(255,255,255,0.18)",

    // Topwater
    translucent: "rgba(255,255,255,0.18)",

    // Frog colors
    green: "#3f7a3a",
    yellow: "#d9c300",

    // Default
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
  // fishing-native combos like "chartreuse/black back"
  if (p === "black back") return "black";
  if (p === "blue back") return "blue";
  return p;
}

function getSwatchBackground(colorToken: string): string {
  const normalized = normalizeColorToken(colorToken);

  // Combo colorway: render as ONE chip with two-tone split
  if (normalized.includes("/")) {
    const [rawA, rawB] = normalized.split("/", 2);
    const a = getColorHex(normalizeComboPart(rawA));
    const b = getColorHex(normalizeComboPart(rawB));

    // Diagonal split (top-left to bottom-right)
    return `linear-gradient(135deg, ${a} 0%, ${a} 50%, ${b} 50%, ${b} 100%)`;
  }

  // Single colorway
  return getColorHex(normalized);
}
