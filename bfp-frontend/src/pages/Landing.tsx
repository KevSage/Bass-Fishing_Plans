// src/pages/Landing.tsx
import React from "react";
import { Link } from "react-router-dom";
import {
  CompassIcon,
  TargetIcon,
  LayersIcon,
  BarChartIcon,
  CheckCircleIcon,
} from "../components/UnifiedIcons";
import {
  ThermometerIcon,
  WindIcon,
  CloudIcon,
  MapPinIcon,
  ActivityIcon,
} from "@/components/UnifiedIcons";

const container = (maxWidth: number) =>
  ({
    maxWidth,
    margin: "0 auto",
    width: "100%",
  }) as const;

const eyebrow = {
  fontSize: "0.82rem",
  textTransform: "uppercase" as const,
  letterSpacing: "0.14em",
  opacity: 0.75,
} as const;

const h1Style = {
  fontSize: "clamp(2.05rem, 5.6vw, 3.75rem)",
  fontWeight: 720,
  lineHeight: 1.12,
  letterSpacing: "-0.03em",
  margin: "14px 0 18px",
} as const;

const h2Style = {
  fontSize: "clamp(1.8rem, 4.6vw, 3rem)",
  fontWeight: 720,
  letterSpacing: "-0.02em",
  lineHeight: 1.18,
  margin: "0 0 18px",
  textAlign: "center" as const,
} as const;

const leadStyle = {
  fontSize: "clamp(1.08rem, 2.4vw, 1.28rem)",
  lineHeight: 1.75,
  opacity: 0.86,
  maxWidth: 920,
  margin: "0 auto",
  textAlign: "center" as const,
} as const;

const pStyle = {
  fontSize: "1.08rem",
  lineHeight: 1.85,
  opacity: 0.78,
  margin: 0,
} as const;

const card = {
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.03)",
  boxShadow: "0 18px 60px rgba(0,0,0,0.35)",
} as const;

const softCard = {
  borderRadius: 18,
  border: "1px solid rgba(74,144,226,0.16)",
  background:
    "linear-gradient(145deg, rgba(74, 144, 226, 0.06) 0%, rgba(10,10,10,0.44) 55%, rgba(74, 144, 226, 0.03) 100%)",
  boxShadow: "0 18px 60px rgba(0,0,0,0.35)",
} as const;

const grid2 = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))",
  gap: "clamp(22px, 5vw, 54px)",
  alignItems: "center",
} as const;

const pill = {
  display: "inline-flex",
  alignItems: "center",
  gap: 10,
  padding: "10px 14px",
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.03)",
  fontSize: "0.95rem",
  opacity: 0.9,
} as const;

const smallCta = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "12px 16px",
  borderRadius: 14,
  textDecoration: "none",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.03)",
  color: "rgba(255,255,255,0.92)",
  fontWeight: 600,
  fontSize: "0.98rem",
  transition: "all 0.2s ease",
  whiteSpace: "nowrap" as const,
} as const;

const primaryCta = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "16px 20px",
  borderRadius: 16,
  textDecoration: "none",
  background: "linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)",
  boxShadow: "0 10px 28px rgba(74, 144, 226, 0.28)",
  color: "#fff",
  fontWeight: 700,
  fontSize: "1.05rem",
  whiteSpace: "nowrap" as const,
} as const;

const sectionTopBorder = "1px solid rgba(255,255,255,0.06)";

const iconBadge = {
  width: 40,
  height: 40,
  borderRadius: 14,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background:
    "linear-gradient(135deg, rgba(74,144,226,0.22) 0%, rgba(74,144,226,0.06) 100%)",
  border: "1px solid rgba(74,144,226,0.20)",
} as const;

const pillIcon = (Icon: any) => (
  <span
    style={{
      width: 22,
      height: 22,
      borderRadius: 999,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      background: "rgba(74,144,226,0.16)",
      border: "1px solid rgba(74,144,226,0.18)",
      boxShadow: "0 10px 22px rgba(74,144,226,0.10)",
    }}
  >
    <Icon style={{ width: 14, height: 14, color: "rgba(74,144,226,0.95)" }} />
  </span>
);

export function Landing() {
  // -----------------------------
  // Shared typography + layout
  // -----------------------------
  const sectionPadY = "clamp(84px, 10vw, 140px)";
  const sectionPadX = "clamp(18px, 4vw, 24px)";
  const sectionPad = `${sectionPadY} ${sectionPadX}`;
  const container = (maxWidth: number) =>
    ({
      maxWidth,
      margin: "0 auto",
    }) as const;

  const h1Style = {
    fontSize: "clamp(2.25rem, 6vw, 4rem)",
    fontWeight: 700,
    lineHeight: 1.15,
    marginBottom: 28,
    letterSpacing: "-0.03em",
  } as const;

  const h2Style = {
    fontSize: "clamp(2rem, 5vw, 3rem)",
    fontWeight: 700,
    textAlign: "center" as const,
    letterSpacing: "-0.02em",
    lineHeight: 1.2,
    marginBottom: 28,
  } as const;

  const leadStyle = {
    fontSize: "clamp(1.15rem, 2.5vw, 1.35rem)",
    lineHeight: 1.7,
    opacity: 0.85,
    textAlign: "center" as const,
    maxWidth: 860,
    margin: "0 auto",
  } as const;

  const bodyCenter = {
    fontSize: "1.15rem",
    lineHeight: 1.8,
    opacity: 0.75,
    textAlign: "center" as const,
    maxWidth: 860,
    margin: "0 auto",
  } as const;

  const grid2Col = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "clamp(28px, 6vw, 64px)",
    alignItems: "center",
  } as const;

  const Bullet = ({ title, desc }: { title: string; desc: string }) => (
    <li style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
      <div
        style={{
          width: 10,
          height: 10,
          borderRadius: 999,
          marginTop: 8,
          background: "rgba(74,144,226,0.95)",
          boxShadow: "0 6px 18px rgba(74,144,226,0.22)",
          flexShrink: 0,
        }}
      />
      <div>
        <div style={{ fontWeight: 720, opacity: 0.92 }}>{title}</div>
        <div style={{ opacity: 0.78, lineHeight: 1.7 }}>{desc}</div>
      </div>
    </li>
  );

  return (
    <div
      className="landing-no-x"
      style={{
        background: "linear-gradient(to bottom, #0a0a0a, #1a1a2e)",
        color: "#fff",
        // ✅ Prevent landing-only horizontal “page widening” on iOS Safari
        width: "100%",
        overflowX: "clip", // best modern option
      }}
    >
      {/* ============================================
          HERO SECTION
          ============================================ */}
      <section
        style={{
          minHeight: "min(92vh, 860px)",
          padding: "clamp(72px, 10vh, 120px) 0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Gradient background */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 30% 20%, rgba(74, 144, 226, 0.08) 0%, transparent 70%)",
          }}
        />

        {/* Bass hero image */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "url(/images/hero_bass.png)",
            backgroundSize: "cover",
            backgroundPosition: "65% 45%",
            backgroundRepeat: "no-repeat",
            opacity: 1,
            filter: "brightness(0.85)",
          }}
        />

        {/* Dark overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.85) 100%)",
          }}
        />

        <div
          className="container"
          style={{
            position: "relative",
            zIndex: 1,
            textAlign: "center",
            maxWidth: 980,
            padding: `0 ${sectionPadX}`,
          }}
        >
          <h1 style={h1Style}>Clarity on the Water.</h1>
          <div style={{ height: 46 }} />

          <Link
            className="btn primary"
            to="/subscribe"
            style={{
              fontSize: "1.1rem",
              padding: "18px 52px",
              background: "linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)",
              borderRadius: 16,
              fontWeight: 600,
              display: "inline-block",
              boxShadow: "0 8px 24px rgba(74, 144, 226, 0.3)",
              transition: "all 0.3s ease",
            }}
          >
            Start Your Free Trial
          </Link>
        </div>
      </section>

      {/* ============================================
          THE DIFFERENCE - With Phone Mockup
          ============================================ */}
      <section
        style={{
          padding: sectionPad,
          background: "rgba(74, 144, 226, 0.02)",
        }}
      >
        <div className="container" style={container(1200)}>
          <h2
            className="water-text"
            style={{
              ...h2Style,
              fontSize: "clamp(2.25rem, 5.5vw, 3.5rem)",
              marginBottom: 28,
            }}
          >
            Your Water History.
          </h2>

          <p
            style={{
              ...bodyCenter,
              maxWidth: 920,
              marginBottom: "clamp(44px, 8vw, 72px)",
            }}
          >
            Bass Clarity helps anglers understand their water, capture their
            fishing history, and generate clear, bass-specific strategy when it
            matters.
            <br />
          </p>

          <div style={grid2Col}>
            {/* Phone Mockup */}
            <div
              style={{
                position: "relative",
                maxWidth: "min(380px, 100%)",
                margin: "0 auto",
              }}
            >
              <img
                src="/images/iphone15.png"
                alt="Bass Clarity mobile app"
                style={{
                  width: "100%",
                  display: "block",
                  position: "relative",
                  zIndex: 2,
                  pointerEvents: "none",
                }}
              />

              <div
                style={{
                  position: "absolute",
                  top: "3.8%",
                  left: "4.5%",
                  width: "92.6%",
                  height: "92.4%",
                  borderRadius: "42px",
                  overflow: "hidden",
                  zIndex: 1,
                }}
              >
                <img
                  src="/images/ProductionScreenshots/Insights.png"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                  }}
                />
              </div>
            </div>

            {/* Features List */}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS (Map Engine) */}
      <section style={{ padding: sectionPad, borderTop: sectionTopBorder }}>
        <div className="container" style={container(1100)}>
          <div
            className="water-text"
            style={{
              ...eyebrow,
              textAlign: "center",
              paddingBottom: "20px",
              color: "rgba(74,144,226,0.95)",
            }}
          >
            Location Clarity
          </div>

          <h2 style={h2Style}>Your Living Record</h2>
          <p style={leadStyle}>
            Every catch you log is stored with its location, building real
            history over time. As your experience grows, patterns emerge
            naturally through density and visual heat. <br />
          </p>
        </div>
        <div style={{ height: 46 }} />
        {/* Phone + Quick explainer */}
        <div
          style={{
            ...grid2,
            marginTop: "clamp(34px, 6vw, 54px)",
            paddingBottom: "clamp(48px, 7vw, 72px)",
          }}
        >
          {/* Phone mock */}
          <div
            style={{ position: "relative", maxWidth: 420, margin: "0 auto" }}
          >
            {/* Frame */}
            <img
              src="/images/iphone15.png"
              alt="Bass Clarity on mobile"
              style={{
                width: "100%",
                display: "block",
                position: "relative",
                zIndex: 2,
                pointerEvents: "none",
              }}
            />
            {/* Screen */}
            <div
              style={{
                position: "absolute",
                top: "3.8%",
                left: "1.1%",
                width: "97%",
                height: "92.4%",
                borderRadius: "80px",
                overflow: "hidden",
                zIndex: 1,
                background: "rgba(0,0,0,0.25)",
              }}
            >
              <video
                src="/video/HardLabor.mp4"
                autoPlay
                muted
                loop
                playsInline
                style={{
                  width: "102.6%",
                  height: "100%",
                  objectFit: "contain",
                }}
              />
              {/* Subtle overlay to keep it calm */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(to bottom, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.28) 100%)",
                }}
              />
            </div>
          </div>

          {/* Text block */}
          <div style={{ padding: "0 4px", maxWidth: 640, margin: "0 auto" }}>
            <div
              style={{
                ...softCard,
                padding: "clamp(18px, 3.5vw, 28px)",
              }}
            >
              <div
                style={{
                  ...eyebrow,
                  marginBottom: 12,
                  color: "rgba(255,255,255,0.68)",
                }}
              >
                Your Water, Your History
              </div>

              <div style={{ height: 14 }} />

              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                  display: "grid",
                  gap: 14,
                }}
              >
                {[
                  {
                    title: "Your Catches, Anchored to Place",
                    desc: "Each fish is recorded where it actually happened",
                  },
                  {
                    title: "Your Patterns, Revealed",
                    desc: "Repeated success becomes visible through density and heat.",
                  },

                  {
                    title: "Your Knowledge, Preserved",
                    desc: "What you learn on the water doesn’t disappear — it compounds.",
                  },

                  {
                    title: "Your Past Counts, Too",
                    desc: "Bring your existing catch history into the map and build from where you already are.",
                  },
                ].map((x, i) => (
                  <li
                    key={i}
                    style={{
                      display: "flex",
                      gap: 12,
                      alignItems: "flex-start",
                    }}
                  >
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 999,
                        marginTop: 8,
                        background: "rgba(74,144,226,0.95)",
                        boxShadow: "0 6px 18px rgba(74,144,226,0.22)",
                        flexShrink: 0,
                      }}
                    />
                    <div>
                      <div style={{ fontWeight: 720, opacity: 0.92 }}>
                        {x.title}
                      </div>
                      <div style={{ opacity: 0.78, lineHeight: 1.7 }}>
                        {x.desc}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <div style={{ height: 18 }} />
      </section>

      {/* HOW IT WORKS (Strategy Engine) */}
      <section style={{ padding: sectionPad, borderTop: sectionTopBorder }}>
        <div className="container" style={container(1100)}>
          <div
            className="water-text"
            style={{
              ...eyebrow,
              textAlign: "center",
              paddingBottom: "20px",
              color: "rgba(74,144,226,0.95)",
            }}
          >
            Data Clarity
          </div>
          <h2 style={h2Style}>A Disciplined Decision Engine</h2>
          <p style={leadStyle}>
            Bass Clarity quietly interprets today’s conditions and turns them
            into a focused fishing strategy — without noise, dashboards, or
            guesswork.
            <br />
          </p>
        </div>
        <div style={{ height: 46 }} />
        {/* Phone + Quick explainer */}
        <div
          style={{
            ...grid2,
            marginTop: "clamp(34px, 6vw, 54px)",
            paddingBottom: "clamp(48px, 7vw, 72px)",
          }}
        >
          {/* Phone mock */}
          <div
            style={{ position: "relative", maxWidth: 420, margin: "0 auto" }}
          >
            {/* Frame */}
            <img
              src="/images/iphone15.png"
              alt="Bass Clarity on mobile"
              style={{
                width: "100%",
                display: "block",
                position: "relative",
                zIndex: 2,
                pointerEvents: "none",
              }}
            />
            {/* Screen */}
            <div
              style={{
                position: "absolute",
                top: "3.8%",
                left: "1.1%",
                width: "97%",
                height: "92.4%",
                borderRadius: "80px",
                overflow: "hidden",
                zIndex: 1,
                background: "rgba(0,0,0,0.25)",
              }}
            >
              <video
                src="/video/bass-clarity-loading.mov"
                autoPlay
                muted
                loop
                playsInline
                style={{
                  width: "102.6%",
                  height: "100%",
                  objectFit: "contain",
                }}
              />
              {/* Subtle overlay to keep it calm */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(to bottom, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.28) 100%)",
                }}
              />
            </div>
          </div>

          {/* Text block */}
          <div style={{ padding: "0 4px", maxWidth: 640, margin: "0 auto" }}>
            <div
              style={{
                ...softCard,
                padding: "clamp(18px, 3.5vw, 28px)",
              }}
            >
              <div
                style={{
                  ...eyebrow,
                  marginBottom: 12,
                  color: "rgba(255,255,255,0.68)",
                }}
              >
                Real Time Data-Analysis
              </div>

              <div style={{ height: 14 }} />

              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                  display: "grid",
                  gap: 14,
                }}
              >
                {[
                  {
                    title: "Season & Region Context",
                    desc: "Fishing in January means different things in Georgia than it does in Florida — Bass Clarity accounts for that automatically.",
                  },
                  {
                    title: "Your Local Conditions",
                    desc: "Temperature trends, wind behavior, pressure movement, and sky conditions are interpreted as a single snapshot — not a stream of noise.",
                  },
                  {
                    title: "Stability & Change",
                    desc: "The system weighs what’s changing and what’s holding steady to avoid overreacting to short-term swings.",
                  },
                  {
                    title: "Outcome-Driven Logic",
                    desc: "Every signal feeds directly into presentation choice, targets, and execution — nothing is shown unless it influences the plan.",
                  },
                ].map((x, i) => (
                  <li
                    key={i}
                    style={{
                      display: "flex",
                      gap: 12,
                      alignItems: "flex-start",
                    }}
                  >
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 999,
                        marginTop: 8,
                        background: "rgba(74,144,226,0.95)",
                        boxShadow: "0 6px 18px rgba(74,144,226,0.22)",
                        flexShrink: 0,
                      }}
                    />
                    <div>
                      <div style={{ fontWeight: 720, opacity: 0.92 }}>
                        {x.title}
                      </div>
                      <div style={{ opacity: 0.78, lineHeight: 1.7 }}>
                        {x.desc}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              <div style={{ height: 18 }} />

              <div style={{ height: 18 }} />
            </div>
          </div>
        </div>
        <div style={{ height: 72 }} />

        <div className="container" style={container(1100)}>
          <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
            <div
              className="water-text"
              style={{ ...eyebrow, color: "rgba(74,144,226,0.95)" }}
            >
              Weather Clarity
            </div>

            <h2 style={h2Style}>
              {/* Not Just Weather
                     <br /> */}
              Your Weather, Simplified
              <br />
            </h2>

            <p style={{ ...leadStyle, maxWidth: 980 }}>
              No Dashboards. No Charts. No Overlays.
              <br />
              Only important data visible — so you can keep your mind on the
              water and not a screen. <br />
            </p>

            <div
              style={{
                marginTop: 26,
                display: "flex",
                justifyContent: "center",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <span style={pill}>
                <ThermometerIcon size={20} /> Temperature
              </span>
              <span style={pill}>
                <WindIcon size={20} /> Wind + Safety
              </span>
              <span style={pill}>
                <ActivityIcon size={20} /> Pressure
              </span>
              <span style={pill}>
                <CloudIcon size={20} />
                Sky + Precipitation
              </span>
            </div>
          </div>

          {/* Phone + Quick explainer */}
          <div
            style={{
              ...grid2,
              marginTop: "clamp(34px, 6vw, 54px)",
              paddingBottom: "clamp(48px, 7vw, 72px)",
            }}
          >
            {/* Phone mock */}
            <div
              style={{ position: "relative", maxWidth: 420, margin: "0 auto" }}
            >
              {/* Frame */}
              <img
                src="/images/iphone15.png"
                alt="Bass Clarity on mobile"
                style={{
                  width: "100%",
                  display: "block",
                  position: "relative",
                  zIndex: 2,
                  pointerEvents: "none",
                }}
              />
              {/* Screen */}
              <div
                style={{
                  position: "absolute",
                  top: "3.8%",
                  left: "3.5%",
                  width: "92.6%",
                  height: "92.4%",
                  borderRadius: "70px",
                  overflow: "hidden",
                  zIndex: 1,
                  background: "rgba(0,0,0,0.25)",
                }}
              >
                <img
                  src="/images/ProductionScreenshots/Weather.png"
                  alt="Weather cards and outlook"
                  style={{
                    width: "102%",
                    height: "100%",
                    objectFit: "contain",
                    filter: "brightness(0.92) contrast(1.08) saturate(0.95)",
                  }}
                />
                {/* Subtle overlay to keep it calm */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(to bottom, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.28) 100%)",
                  }}
                />
              </div>
            </div>

            {/* Text block */}
            <div style={{ padding: "0 4px", maxWidth: 640, margin: "0 auto" }}>
              <div
                style={{
                  ...softCard,
                  padding: "clamp(18px, 3.5vw, 28px)",
                }}
              >
                <div
                  style={{
                    ...eyebrow,
                    marginBottom: 12,
                    color: "rgba(255,255,255,0.68)",
                  }}
                >
                  What you'll notice
                </div>

                <div style={{ height: 14 }} />

                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    margin: 0,
                    display: "grid",
                    gap: 14,
                  }}
                >
                  {[
                    {
                      title: "Live Weather Updates",
                      desc: "Temperature, Wind, Pressure, and Sky/Precip — the core signals that shape the day.",
                    },
                    {
                      title: "Bass Mood Indicator",
                      desc: "Shows you how active the fish are expected to be due to present conditions.",
                    },
                    {
                      title: "Solunar Chart",
                      desc: "An overview of your day from daybreak to last cast",
                    },
                    {
                      title: "4 Interactive Metrics",
                      desc: "Temperature, Wind, Pressure, and Sky/Precip — the core signals that shape the day. Cick the card for provide additional context",
                    },
                    {
                      title: "Conditions & Outlook",
                      desc: "Your Weather outlook explains your day ahead and how it may effect bass behavior, explained in natural langauge.",
                    },
                  ].map((x, i) => (
                    <li
                      key={i}
                      style={{
                        display: "flex",
                        gap: 12,
                        alignItems: "flex-start",
                      }}
                    >
                      <div
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 999,
                          marginTop: 8,
                          background: "rgba(74,144,226,0.95)",
                          boxShadow: "0 6px 18px rgba(74,144,226,0.22)",
                          flexShrink: 0,
                        }}
                      />
                      <div>
                        <div style={{ fontWeight: 720, opacity: 0.92 }}>
                          {x.title}
                        </div>
                        <div style={{ opacity: 0.78, lineHeight: 1.7 }}>
                          {x.desc}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: sectionPad, borderTop: sectionTopBorder }}>
        {/* <div style={{ height: 36 }} /> */}
        <div className="container" style={container(1100)}>
          <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
            <div
              className="water-text"
              style={{ ...eyebrow, color: "rgba(74,144,226,0.95)" }}
            >
              Technique / Presentation Clarity
            </div>

            <h1 style={h1Style}>Complementary Approaches.</h1>
            <p style={{ ...leadStyle, maxWidth: 980 }}>
              Fish with Confidence. No Decision Paralysis.
              <br />
              Figuring out which presentation best suits your conditions is no
              longer a struggle. <br />
            </p>
          </div>

          {/* Phone + Quick explainer */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))",
              gap: "clamp(22px, 5vw, 54px)",
              alignItems: "center",
              marginTop: "clamp(34px, 6vw, 54px)",
              paddingBottom: "clamp(48px, 7vw, 72px)",
            }}
          >
            {/* Phone mock */}
            <div
              style={{
                position: "relative",
                maxWidth: 420,
                margin: "0 auto",
              }}
            >
              <img
                src="/images/iphone15.png"
                alt="Bass Clarity on mobile"
                style={{
                  width: "100%",
                  display: "block",
                  position: "relative",
                  zIndex: 2,
                  pointerEvents: "none",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: "3.8%",
                  left: "6.9%",
                  width: "87.6%",
                  height: "92.4%",
                  borderRadius: "42px",
                  overflow: "hidden",
                  zIndex: 1,
                  background: "rgba(0,0,0,0.25)",
                }}
              >
                <img
                  src="/images/ProductionScreenshots/Jerkbait.png"
                  alt="Pattern card (example)"
                  style={{
                    width: "100%",
                    height: "101%",
                    objectFit: "contain",
                    filter: "brightness(0.92) contrast(1.08) saturate(0.95)",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(to bottom, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.30) 100%)",
                  }}
                />
              </div>
            </div>

            {/* Text block */}
            <div style={{ padding: "0 4px", maxWidth: 640, margin: "0 auto" }}>
              <div style={{ ...softCard, padding: "clamp(18px, 3.5vw, 28px)" }}>
                <div
                  style={{
                    ...eyebrow,
                    marginBottom: 12,
                    color: "rgba(255,255,255,0.68)",
                  }}
                >
                  Primary + Pivot
                </div>

                <div style={{ height: 14 }} />

                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    margin: 0,
                    display: "grid",
                    gap: 14,
                  }}
                >
                  <Bullet
                    title="Primary - Anchors Your Day"
                    desc="Meant to serve as the best starting point, based on your current weather, season and conditions"
                  />
                  <Bullet
                    title="Pivot - A Powerful Alternate "
                    desc="A stretegic complement to the primary pattern."
                  />
                  <Bullet
                    title="Pattern Summary"
                    desc="We explain why we chose this presentation and why it makes sense."
                  />
                  <Bullet
                    title="Real Intelligence"
                    desc="The pivot references the primary pattern and explains in plain language its role and relation to the first."
                  />
                  <Bullet
                    title="All things Considered"
                    desc="Trailer guidance based on season. Color suggestions based on water clarity and light. Gear for execution"
                  />
                </ul>
              </div>
              <div style={{ height: 24 }} />
            </div>
          </div>
          {/* Phone + Quick explainer */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))",
              gap: "clamp(22px, 5vw, 54px)",
              alignItems: "center",
              marginTop: "clamp(34px, 6vw, 54px)",
              paddingBottom: "clamp(48px, 7vw, 72px)",
            }}
          ></div>
        </div>
        <div style={{ height: 36 }} />

        <div className="container" style={container(1100)}>
          <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
            <div
              className="water-text"
              style={{ ...eyebrow, color: "rgba(74,144,226,0.95)" }}
            >
              Strategic Clarity
            </div>

            <h2 style={h2Style}>Fish With Intention.</h2>

            <p style={{ ...leadStyle, maxWidth: 980 }}>
              Make Every Cast Deliberate. Know exactly what to do, and why
              you're doing it.
            </p>
          </div>

          {/* Phone + Quick explainer */}
          <div
            style={{
              ...grid2,
              marginTop: "clamp(34px, 6vw, 54px)",
              paddingBottom: "clamp(48px, 7vw, 72px)",
            }}
          >
            {/* Phone mock */}
            <div
              style={{
                position: "relative",
                maxWidth: 420,
                margin: "0 auto",
              }}
            >
              {/* Frame */}
              <img
                src="/images/iphone15.png"
                alt="Bass Clarity on mobile"
                style={{
                  width: "100%",
                  display: "block",
                  position: "relative",
                  zIndex: 2,
                  pointerEvents: "none",
                }}
              />
              {/* Screen */}
              <div
                style={{
                  position: "absolute",
                  top: "3.8%",
                  left: "3.9%",
                  width: "92.6%",
                  height: "92.4%",
                  borderRadius: "42px",
                  overflow: "hidden",
                  zIndex: 1,
                  background: "rgba(0,0,0,0.25)",
                }}
              >
                <img
                  src="/images/ProductionScreenshots/Strategy2.png"
                  alt="Strategy cards and progression"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    filter: "brightness(0.92) contrast(1.08) saturate(0.95)",
                  }}
                />
                {/* Subtle overlay to keep it calm */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(to bottom, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.28) 100%)",
                  }}
                />
              </div>
            </div>

            {/* Text block */}
            <div style={{ padding: "0 4px", maxWidth: 640, margin: "0 auto" }}>
              <div
                style={{
                  ...softCard,
                  padding: "clamp(18px, 3.5vw, 28px)",
                }}
              >
                <div
                  style={{
                    ...eyebrow,
                    marginBottom: 12,
                    color: "rgba(255,255,255,0.68)",
                  }}
                >
                  Sound Reasoning. None of the Noise.
                </div>

                <div style={{ height: 14 }} />
                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    margin: 0,
                    display: "grid",
                    gap: 14,
                  }}
                >
                  {[
                    {
                      title: "The Logic ",
                      desc: "Why this presentation fits your conditions on the water",
                    },
                    {
                      title: "The Gameplan",
                      desc: "Commit to the plan. A brief overview of your lure and plan for execution",
                    },
                    {
                      title: "Targets",
                      desc: "Targets are narrowed to the places most likely to hold fish based on today's conditions.",
                    },
                    {
                      title: "Retrieve Guidance",
                      desc: "More than 130+ lure specific retrieves that adjusts for targets and conditions",
                    },
                  ].map((x, i) => (
                    <li
                      key={i}
                      style={{
                        display: "flex",
                        gap: 12,
                        alignItems: "flex-start",
                      }}
                    >
                      <div
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 999,
                          marginTop: 8,
                          background: "rgba(74,144,226,0.95)",
                          boxShadow: "0 6px 18px rgba(74,144,226,0.22)",
                          flexShrink: 0,
                        }}
                      />
                      <div>
                        <div style={{ fontWeight: 720, opacity: 0.92 }}>
                          {x.title}
                        </div>
                        <div style={{ opacity: 0.78, lineHeight: 1.7 }}>
                          {x.desc}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container" style={container(1100)}>
        <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
          <div
            className="water-text"
            style={{ ...eyebrow, color: "rgba(74,144,226,0.95)" }}
          >
            Strategic Clarity
          </div>

          <h2 style={h2Style}>Full Day Progression.</h2>

          <p style={{ ...leadStyle, maxWidth: 980 }}>
            Know where to start, transition and adjust. Clear actionable
            guidance, from daybreak to last cast.
          </p>
        </div>

        {/* Phone + Quick explainer */}
        <div
          style={{
            ...grid2,
            marginTop: "clamp(34px, 6vw, 54px)",
            paddingBottom: "clamp(48px, 7vw, 72px)",
          }}
        >
          {/* Phone mock */}
          <div
            style={{ position: "relative", maxWidth: 420, margin: "0 auto" }}
          >
            {/* Frame */}
            <img
              src="/images/iphone15.png"
              alt="Bass Clarity on mobile"
              style={{
                width: "100%",
                display: "block",
                position: "relative",
                zIndex: 2,
                pointerEvents: "none",
              }}
            />
            {/* Screen */}
            <div
              style={{
                position: "absolute",
                top: "4.8%",
                left: "2.2%",
                width: "94.6%",
                height: "92.4%",
                borderRadius: "42px",
                overflow: "hidden",
                zIndex: 1,
                background: "rgba(0,0,0,0.25)",
              }}
            >
              <img
                src="/images/ProductionScreenshots/DayProgression.png"
                alt="Strategy' cards and progression"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  filter: "brightness(0.92) contrast(1.08) saturate(0.95)",
                }}
              />
              {/* Subtle overlay to keep it calm */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(to bottom, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.28) 100%)",
                }}
              />
            </div>
          </div>

          {/* Text block */}
          <div style={{ padding: "0 4px", maxWidth: 640, margin: "0 auto" }}>
            <div
              style={{
                ...softCard,
                padding: "clamp(18px, 3.5vw, 28px)",
              }}
            >
              <div
                style={{
                  ...eyebrow,
                  marginBottom: 12,
                  color: "rgba(255,255,255,0.68)",
                }}
              >
                All Day Guidance
              </div>

              <div style={{ height: 14 }} />
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                  display: "grid",
                  gap: 14,
                }}
              >
                {[
                  {
                    title: "Customized Day Progression",
                    desc: "Morning, Midday, and Evening guidance is generated directly from your personalized plan",
                  },
                  {
                    title: "Plan Consistent",
                    desc: "Each phase of the day reflects the exact lures, targets, and strategy selected for your conditions.",
                  },
                  {
                    title: "Guidance that Evolves",
                    desc: "As light, activity, and positioning change, your strategy adapts without losing direction.",
                  },
                ].map((x, i) => (
                  <li
                    key={i}
                    style={{
                      display: "flex",
                      gap: 12,
                      alignItems: "flex-start",
                    }}
                  >
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 999,
                        marginTop: 8,
                        background: "rgba(74,144,226,0.95)",
                        boxShadow: "0 6px 18px rgba(74,144,226,0.22)",
                        flexShrink: 0,
                      }}
                    />
                    <div>
                      <div style={{ fontWeight: 720, opacity: 0.92 }}>
                        {x.title}
                      </div>
                      <div style={{ opacity: 0.78, lineHeight: 1.7 }}>
                        {x.desc}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={container(1100)}>
        <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
          <div
            className="water-text"
            style={{ ...eyebrow, color: "rgba(74,144,226,0.95)" }}
          >
            Insight Clarity
          </div>

          <h2 style={h2Style}>Your Moments. Your Story.</h2>

          <p style={{ ...leadStyle, maxWidth: 980 }}>
            Insights brings your catches, locations, and photos together —
            creating a clear record of how you fish and how it’s changed over
            time.
          </p>
        </div>

        {/* Phone + Quick explainer */}
        <div
          style={{
            ...grid2,
            marginTop: "clamp(34px, 6vw, 54px)",
            paddingBottom: "clamp(48px, 7vw, 72px)",
          }}
        >
          {/* Phone mock */}
          <div
            style={{ position: "relative", maxWidth: 420, margin: "0 auto" }}
          >
            {/* Frame */}
            <img
              src="/images/iphone15.png"
              alt="Bass Clarity on mobile"
              style={{
                width: "100%",
                display: "block",
                position: "relative",
                zIndex: 2,
                pointerEvents: "none",
              }}
            />
            {/* Screen */}
            <div
              style={{
                position: "absolute",
                top: "4.8%",
                left: "2.2%",
                width: "94.6%",
                height: "92.4%",
                borderRadius: "42px",
                overflow: "hidden",
                zIndex: 1,
                background: "rgba(0,0,0,0.25)",
              }}
            >
              <img
                src="/images/ProductionScreenshots/InsightsFinal.png"
                alt="Strategy' cards and progression"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  filter: "brightness(0.92) contrast(1.08) saturate(0.95)",
                }}
              />
              {/* Subtle overlay to keep it calm */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(to bottom, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.28) 100%)",
                }}
              />
            </div>
          </div>

          {/* Text block */}
          <div style={{ padding: "0 4px", maxWidth: 640, margin: "0 auto" }}>
            <div
              style={{
                ...softCard,
                padding: "clamp(18px, 3.5vw, 28px)",
              }}
            >
              <div
                style={{
                  ...eyebrow,
                  marginBottom: 12,
                  color: "rgba(255,255,255,0.68)",
                }}
              >
                Experience, Made Clear.
              </div>

              <div style={{ height: 14 }} />
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                  display: "grid",
                  gap: 14,
                }}
              >
                {[
                  {
                    title: "Your Best Waters",
                    desc: "See which lakes and spots have produced over time — not just once.",
                  },
                  {
                    title: "What Actually Works",
                    desc: "Understand which techniques, baits, and conditions have led to success.",
                  },
                  {
                    title: "Moments That Matter",
                    desc: "Relive your best catches, best days, and personal milestones through photos and stats.",
                  },
                  {
                    title: "Your Story, From Day One",
                    desc: "Upload past catch photos and Bass Clarity places them by location and time — exactly where they happened.",
                  },
                ].map((x, i) => (
                  <li
                    key={i}
                    style={{
                      display: "flex",
                      gap: 12,
                      alignItems: "flex-start",
                    }}
                  >
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 999,
                        marginTop: 8,
                        background: "rgba(74,144,226,0.95)",
                        boxShadow: "0 6px 18px rgba(74,144,226,0.22)",
                        flexShrink: 0,
                      }}
                    />
                    <div>
                      <div style={{ fontWeight: 720, opacity: 0.92 }}>
                        {x.title}
                      </div>
                      <div style={{ opacity: 0.78, lineHeight: 1.7 }}>
                        {x.desc}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Responsive styling */}
      <style>{`
                /* Mobile: phone first (order: 1), then 2x2 cards below (order: 2) */
                .strategy-phone {
                  order: 1;
                }
                .strategy-cards {
                  order: 2;
                  grid-template-columns: repeat(2, 1fr);
                }
                
                /* Desktop: 2x2 cards left (order: 1), phone right (order: 2) */
                @media (min-width: 1024px) {
                  .strategy-layout {
                    grid-template-columns: 1.2fr 1fr !important;
                  }
                  .strategy-phone {
                    order: 2;
                  }
                  .strategy-cards {
                    order: 1;
                    grid-template-columns: repeat(2, 1fr) !important;
                  }
                }
              `}</style>

      {/* ============================================
          BUILT FOR HOW ANGLERS ACTUALLY FISH
          ============================================ */}
      <section
        style={{
          padding: sectionPad,
          background: "rgba(74, 144, 226, 0.02)",
        }}
      >
        <div className="container" style={container(900)}>
          <h2 className="water-text" style={h2Style}>
            Built for How Anglers Actually Fish
          </h2>

          <p
            style={{
              fontSize: "1.3rem",
              textAlign: "center",
              opacity: 0.85,
              lineHeight: 1.75,
              maxWidth: 720,
              margin: "0 auto 28px",
            }}
          >
            Bass Clarity is built to reflect how you actually fish — capturing
            your time on the water, preserving what you’ve learned, and
            translating today’s conditions into clear, intentional strategy when
            it counts.
          </p>
        </div>
      </section>

      {/* ============================================
          PRICING SECTION
          ============================================ */}
      <section style={{ padding: sectionPad }}>
        <div
          className="container"
          style={{ ...container(700), textAlign: "center" }}
        >
          <h2
            className="water-text"
            style={{
              fontSize: "clamp(3.25rem, 7vw, 5rem)",
              fontWeight: 700,
              marginBottom: 18,
              letterSpacing: "-0.03em",
              textAlign: "center",
            }}
          >
            $10/month
          </h2>

          <p
            style={{
              fontSize: "1.15rem",
              lineHeight: 1.7,
              opacity: 0.75,
              margin: "0 auto 14px",
            }}
          >
            5-Day Free Trial
          </p>

          <p
            style={{
              fontSize: "1.05rem",
              opacity: 0.65,
              margin: "0 auto 44px",
              lineHeight: 1.8,
            }}
          >
            Unlimited plan generation.
            <br />
            Cancel anytime.
          </p>

          <Link
            className="btn primary"
            to="/subscribe"
            style={{
              fontSize: "1.15rem",
              padding: "20px 58px",
              background: "linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)",
              borderRadius: 16,
              fontWeight: 600,
              display: "inline-block",
              boxShadow: "0 8px 24px rgba(74, 144, 226, 0.3)",
            }}
          >
            Start Your Free Trial
          </Link>
        </div>
      </section>

      {/* ============================================
          WHO THIS IS FOR
          ============================================ */}

      {/* ============================================
          FOOTER
          ============================================ */}
      <footer
        style={{
          padding: `clamp(44px, 7vw, 64px) ${sectionPadX}`,
          background: "#0a0a0a",
          borderTop: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div className="container" style={container(1200)}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 40,
              alignItems: "start",
            }}
          >
            {/* Brand */}
            <div>
              <div
                style={{
                  fontSize: "1.15rem",
                  fontWeight: 700,
                  marginBottom: 14,
                  color: "#4A90E2",
                  letterSpacing: "-0.01em",
                }}
              >
                Bass Clarity
              </div>
              <p
                style={{
                  opacity: 0.62,
                  fontSize: "0.95rem",
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                Clear fishing decisions. Without the guesswork.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4
                style={{
                  fontSize: "0.85rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  marginBottom: 16,
                  opacity: 0.5,
                }}
              >
                Product
              </h4>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                <Link
                  to="/subscribe"
                  className="muted"
                  style={{ textDecoration: "none" }}
                >
                  Pricing
                </Link>
              </div>
            </div>

            {/* Support + Legal */}
            <div>
              <h4
                style={{
                  fontSize: "0.85rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  marginBottom: 16,
                  opacity: 0.5,
                }}
              >
                Support
              </h4>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                <a
                  href="mailto:bassclarity@gmail.com"
                  className="muted"
                  style={{ textDecoration: "none" }}
                >
                  bassclarity@gmail.com
                </a>

                <div style={{ height: 10 }} />

                <Link
                  to="/privacy"
                  className="muted"
                  style={{ textDecoration: "none" }}
                >
                  Privacy Policy
                </Link>
                <Link
                  to="/terms"
                  className="muted"
                  style={{ textDecoration: "none" }}
                >
                  Terms of Service
                </Link>
                <Link
                  to="/refunds"
                  className="muted"
                  style={{ textDecoration: "none" }}
                >
                  Refund Policy
                </Link>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div
            style={{
              marginTop: 52,
              paddingTop: 22,
              borderTop: "1px solid rgba(255,255,255,0.06)",
              display: "flex",
              justifyContent: "space-between",
              gap: 14,
              flexWrap: "wrap",
              fontSize: "0.9rem",
              opacity: 0.5,
            }}
          >
            <div>
              © {new Date().getFullYear()} Bass Clarity. All rights reserved.
            </div>

            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              <Link
                to="/privacy"
                className="muted"
                style={{ textDecoration: "none" }}
              >
                Privacy
              </Link>
              <Link
                to="/terms"
                className="muted"
                style={{ textDecoration: "none" }}
              >
                Terms
              </Link>
              <Link
                to="/refunds"
                className="muted"
                style={{ textDecoration: "none" }}
              >
                Refunds
              </Link>
            </div>
          </div>
        </div>
      </footer>
      <style>{`
          @keyframes waterFlow {
            0% {
              background-position: 0% 50%;
            }
            50% {
              background-position: 100% 50%;
            }
            100% {
              background-position: 0% 50%;
            }
          }

          .water-text {
            /* Fallback */
            color: #fff;
            
            /* Lighter Palette for Dark Background */
            background: linear-gradient(
              -45deg,
              #60a5fa, /* Blue 400 */
              #eff6ff, /* Blue 50 - Almost White */
              #ffffff, /* Pure White */
              #38bdf8, /* Sky 400 */
              #93c5fd  /* Blue 300 */
            );
            background-size: 150% 150%;
            
            /* Clip and Fill */
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
            color: transparent; /* Fallback for some browsers */
            
            /* Animation */
            animation: waterFlow 6s ease infinite;
          }
      `}</style>
    </div>
  );
}
