// src/features/plan/PlanScreen.tsx
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

// ✅ FIX: Added enableLiveUpdates to props interface
export function PlanScreen({
  response,
  enableLiveUpdates = false,
}: {
  response: PlanGenerateResponse;
  enableLiveUpdates?: boolean;
}) {
  const { plan } = response;

  // Merge the insights directly into conditions
  const activeConditions = {
    ...(plan.conditions as any),
    weather_card_insights: plan.weather_card_insights || {},
    forecast_rating: plan.forecast_rating || null,
  };

  return (
    <>
      <div style={{ marginTop: 18, paddingBottom: 100 }}>
        {/* Extra padding for mobile nav */}

        {/* Added ID wrapper for Navigation */}
        <div id="weather">
          <WeatherSection
            conditions={activeConditions}
            outlookBlurb={plan.outlook_blurb}
            enableLiveUpdates={enableLiveUpdates}
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
                fontSize: "1.2rem",
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
        marginTop: 40,
        position: "relative",
        background: isPrimary
          ? "linear-gradient(145deg, rgba(74, 144, 226, 0.08) 0%, rgba(10, 10, 10, 0.5) 50%, rgba(74, 144, 226, 0.04) 100%)"
          : "linear-gradient(145deg, rgba(255, 255, 255, 0.02) 0%, rgba(10, 10, 10, 0.5) 50%, rgba(255, 255, 255, 0.01) 100%)",
        border: isPrimary
          ? "1px solid rgba(74, 144, 226, 0.25)"
          : "1px solid rgba(255, 255, 255, 0.1)",
        borderRadius: 28,
        padding: "24px",
        boxShadow: isPrimary
          ? "0 12px 40px rgba(74, 144, 226, 0.12)"
          : "0 12px 40px rgba(0, 0, 0, 0.3)",
      }}
    >
      {/* 1. Floating Pattern Badge */}
      <div
        style={{
          position: "absolute",
          top: -14,
          left: 32,
          padding: "6px 20px",
          background: isPrimary
            ? "linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)"
            : "linear-gradient(135deg, rgba(50, 50, 50, 0.9) 0%, rgba(30, 30, 30, 0.9) 100%)",
          borderRadius: 8,
          fontSize: "0.85rem",
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          fontWeight: 800,
          color: "#fff",
          zIndex: 10,
        }}
      >
        Pattern {patternNumber}
      </div>

      <h3
        style={{
          fontSize: "1.6rem",
          fontWeight: 700,
          letterSpacing: "-0.01em",
          marginTop: 14,
          marginBottom: 28,
          color: "#fff",
        }}
      >
        {pattern.presentation}
      </h3>

      {/* 2. The Brief (Pattern Summary) */}
      {pattern.pattern_summary && (
        <div
          style={{
            position: "relative",
            marginBottom: 32,
            padding: "22px 26px",
            background:
              "linear-gradient(135deg, rgba(74, 144, 226, 0.1) 0%, rgba(10, 10, 10, 0.4) 100%)",
            border: "1px solid rgba(74, 144, 226, 0.25)",
            borderRadius: 20,
            overflow: "hidden",
          }}
        >
          {/* Sonar Watermark */}
          <div
            style={{
              position: "absolute",
              right: -15,
              top: -15,
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
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="7" />
              <circle cx="12" cy="12" r="4" />
            </svg>
          </div>
          <h4
            style={{
              fontSize: "0.75rem",
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
            {/* Removed Hyphen: Use Icon */}
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            The Brief
          </h4>
          <p
            style={{
              lineHeight: 1.75,
              margin: 0,
              fontSize: "1.15rem",
              fontWeight: 500,
              color: "rgba(255,255,255,0.95)",
            }}
          >
            {pattern.pattern_summary}
          </p>
        </div>
      )}

      {/* 3. Lure Image */}
      <div
        style={{
          position: "relative",
          marginBottom: 32,
          display: "flex",
          justifyContent: "center",
          background:
            "radial-gradient(circle, rgba(74, 144, 226, 0.15) 0%, transparent 70%)",
          borderRadius: 24,
          padding: "30px",
        }}
      >
        {pattern.colors.asset_key ? (
          <img
            src={`/images/lures/${pattern.colors.asset_key}`}
            alt={pattern.base_lure}
            style={{
              width: "100%",
              maxWidth: 420,
              height: "auto",
              objectFit: "contain",
              filter: "drop-shadow(0 25px 50px rgba(0,0,0,0.6))",
            }}
          />
        ) : (
          <div style={{ opacity: 0.2, color: "#fff" }}>
            [Lure Visual Pending]
          </div>
        )}
      </div>

      {/* 4. Technical Specs (Hardware Tray) */}
      <div
        style={{
          position: "relative",
          marginBottom: 32,
          padding: "24px",
          background: "rgba(10, 10, 10, 0.4)",
          borderRadius: 24,
          border: "1px solid rgba(74, 144, 226, 0.2)",
          overflow: "hidden",
        }}
      >
        {/* Blue Seal Accent: Matches Day Progression Node Style */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 1.5,
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
                fontSize: "1.45rem",
                fontWeight: 700,
                color: "#fff",
                textTransform: "capitalize",
              }}
            >
              {pattern.base_lure}
            </div>
          </div>

          {/* Corrected Swatches Logic */}
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
                  Color Palette
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
            <div style={UI.eyebrow}>Trailer / Soft Plastic</div>
            <div
              style={{ fontSize: "1.15rem", fontWeight: 600, color: "#fff" }}
            >
              {pattern.soft_plastic || pattern.trailer || "None"}
            </div>
            {(pattern.soft_plastic_why || pattern.trailer_why) && (
              <p
                style={{
                  fontSize: "0.9rem",
                  color: "rgba(255,255,255,0.5)",
                  marginTop: 8,
                  fontStyle: "italic",
                  lineHeight: 1.5,
                  margin: "8px 0 0 0",
                }}
              >
                {pattern.soft_plastic_why || pattern.trailer_why}
              </p>
            )}
          </div>

          <div>
            <div style={UI.eyebrow}>Rod</div>
            <div
              style={{ fontSize: "0.95rem", fontWeight: 600, color: "#fff" }}
            >
              {pattern.gear?.rod || "N/A"}
            </div>
          </div>
          <div>
            <div style={UI.eyebrow}>Reel</div>
            <div
              style={{ fontSize: "0.95rem", fontWeight: 600, color: "#fff" }}
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
        </div>
      </div>

      {/* 5. Pattern Strategy (Logic & Game Plan) - Consistent Visual Flair */}
      {(pattern.why_this_works || pattern.strategy) && (
        <div
          style={{
            position: "relative",
            marginBottom: 36,
            padding: "26px",
            background: "rgba(255, 255, 255, 0.02)",
            borderRadius: 24,
            border: "1px solid rgba(255, 255, 255, 0.08)",
            overflow: "hidden",
          }}
        >
          {/* Tactical HUD Grid Overlay: High visibility for Game Plan */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: `radial-gradient(rgba(74, 144, 226, 0.04) 1px, transparent 1px)`,
              backgroundSize: "30px 30px",
              opacity: 0.5,
              pointerEvents: "none",
            }}
          />

          {pattern.why_this_works && (
            <div style={{ marginBottom: 28, position: "relative" }}>
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
                  width="120"
                  height="120"
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
                {/* Removed Hyphen: Use Circle Icon */}
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
                  fontSize: "1.1rem",
                  color: "rgba(255, 255, 255, 0.9)",
                }}
              >
                {pattern.why_this_works}
              </p>
            </div>
          )}

          {pattern.strategy && (
            <div style={{ position: "relative" }}>
              {/* Map Watermark */}
              <div
                style={{
                  position: "absolute",
                  right: -5,
                  bottom: -5,
                  opacity: 0.03,
                  color: "#fff",
                  pointerEvents: "none",
                }}
              >
                <svg
                  width="130"
                  height="130"
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
                  fontSize: "0.8rem",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.15em",
                  color: "rgba(255, 255, 255, 0.5)",
                  marginBottom: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                {/* Removed Hyphen: Use Crosshair Icon */}
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
                  fontSize: "1.2rem",
                  fontWeight: 500,
                  color: "#fff",
                }}
              >
                {/* Maintain existing AI text cleanup logic */}
                {typeof pattern.strategy === "string"
                  ? pattern.strategy.replace(/\.([A-Z])/g, ". $1")
                  : pattern.strategy}
              </p>
            </div>
          )}
        </div>
      )}

      {/* 6. Targets (Unified Locations) - Spotlight Style with Scopes */}
      {((pattern.work_it_cards && pattern.work_it_cards.length > 0) ||
        (pattern.work_it && pattern.work_it.length > 0)) && (
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
            }}
          >
            Targets
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {(pattern.work_it_cards || pattern.work_it || []).map((item, i) => {
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
                  {/* Scope Watermark: Consistent with Day Progression */}
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
                  {isObject && item.definition && (
                    <div
                      style={{
                        fontWeight: 700,

                        fontSize: "0.9rem",
                        color: "rgba(74, 144, 226, 0.85)",
                        // fontStyle: "italic",
                        marginBottom: 14,
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
