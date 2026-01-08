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
  } as const);

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
    } as const);

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

          {/* <p
            style={{
              fontSize: "clamp(1.1rem, 2.5vw, 1.35rem)",
              lineHeight: 1.65,
              opacity: 0.9,
              maxWidth: 900,
              margin: "0 auto clamp(32px, 6vw, 48px)",
              fontWeight: 400,
            }}
          >
            Bass Clarity is an intelligent Bass Fishing App that interprets
            season and conditions into a focused, actionable fishing strategy.
          </p> */}

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
            style={{
              ...h2Style,
              fontSize: "clamp(2.25rem, 5.5vw, 3.5rem)",
              marginBottom: 28,
            }}
          >
            Bass Fishing, Clarified
          </h2>

          <p
            style={{
              ...bodyCenter,
              maxWidth: 920,
              marginBottom: "clamp(44px, 8vw, 72px)",
            }}
          >
            Bass Clarity is an intelligent Bass Fishing App that interprets
            season and conditions into a focused, actionable fishing strategy.
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
                  src="/images/ProductionScreenshots/chatterbait.png"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                  }}
                />
              </div>
            </div>

            {/* Features List */}
            <div style={{ paddingLeft: 6, maxWidth: 560, margin: "0 auto" }}>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  display: "grid",
                  gap: "clamp(18px, 3.8vw, 28px)",
                  margin: 0,
                }}
              >
                {[
                  "Daily Weather Outlook",
                  "Curated list of target areas ",
                  "Two complementary approaches.",
                  "Soft plastic/trailer suggestions",
                  "Gear recommendations",
                  "Lure Specific Retrieves.",
                  "A Full Day Progression plan",
                ].map((item, i) => (
                  <li
                    key={i}
                    style={{
                      fontSize: "1.2rem",
                      opacity: 0.9,
                      paddingLeft: 30,
                      position: "relative",
                      lineHeight: 1.6,
                    }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        left: 0,
                        color: "#4A90E2",
                        fontWeight: 700,
                        fontSize: "1.35rem",
                      }}
                    >
                      •
                    </span>
                    {item}
                  </li>
                ))}
              </ul>

              <p
                style={{
                  marginTop: 40,
                  fontSize: "1.1rem",
                  opacity: 0.65,
                  fontStyle: "italic",
                  lineHeight: 1.7,
                }}
              >
                Everything works together — nothing is random.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          THE PROBLEM
          ============================================ */}
      <section style={{ padding: sectionPad }}>
        <div className="container" style={container(1100)}>
          <h2
            style={{
              ...h2Style,
              fontSize: "clamp(2.25rem, 5.5vw, 3.5rem)",
              marginBottom: 36,
            }}
          >
            Less Data, More Direction.
          </h2>

          <p style={{ ...leadStyle, marginBottom: "clamp(36px, 7vw, 64px)" }}>
            When everything matters, nothing stands out.
          </p>

          <div style={{ ...grid2Col, marginBottom: "clamp(32px, 6vw, 56px)" }}>
            {/* Confused app image (quieted) */}
            <div style={{ maxWidth: "min(420px, 100%)", margin: "0 auto" }}>
              <img
                src="/images/confused-fishing-app.png"
                alt="Overwhelming fishing app with data"
                style={{
                  width: "100%",
                  borderRadius: 20,
                  boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
                  filter: "grayscale(0.4) brightness(0.75)",
                }}
              />
            </div>

            {/* Questions as a single flowing block */}

            {/* Features List */}
            <div style={{ paddingLeft: 6, maxWidth: 560, margin: "0 auto" }}>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  display: "grid",
                  gap: "clamp(18px, 3.8vw, 28px)",
                  margin: 0,
                }}
              >
                {[
                  "Where should I start?",
                  "What should I throw?",
                  "Where should I throw it?",
                  "How should I work this lure?",
                  "Shallow or Deep? Fast or Slow?",
                  "What should I change — and when? ",
                ].map((item, i) => (
                  <li
                    key={i}
                    style={{
                      fontSize: "1.2rem",
                      opacity: 0.9,
                      paddingLeft: 30,
                      position: "relative",
                      lineHeight: 1.2,
                    }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        left: 0,
                        color: "#4A90E2",
                        fontWeight: 700,
                        fontSize: "1.35rem",
                      }}
                    >
                      •
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p
            style={{
              ...bodyCenter,
              opacity: 0.6,
              fontStyle: "italic",
              maxWidth: 880,
            }}
          >
            Bass Clarity exists because fishing decisions aren't made on
            spreadsheets — they're made on the water.
          </p>
        </div>
      </section>

      {/* HOW IT WORKS (Strategy Engine) */}
      <section style={{ padding: sectionPad, borderTop: sectionTopBorder }}>
        <div className="container" style={container(1100)}>
          <h2 style={h2Style}>Data Into Decisions</h2>
          <p style={leadStyle}>
            Behind the scenes, Bass Clarity evaluates thousands of
            condition-to-outcome relationships to eliminate what doesn't matter.{" "}
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
                    title: "Regional Awareness",
                    desc: "We understand that Winter in Florida is much different than a Winter in the Northeast.",
                  },
                  {
                    title: "We Consider Your Location",
                    desc: "A single, consistent read of your water today based on your location's recent weather trends",
                  },
                  // {
                  //   title: "Your Weather Snapshot",
                  //   desc: "Temperature, wind, pressure, and sky/precip, plus supporting signals used internally",
                  // },
                  {
                    title: "Your Weather Snapshot",
                    desc: "Trends like temperature swing, wind context, pressure movement, and stability indicators.",
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
            <div style={{ ...eyebrow, color: "rgba(74,144,226,0.95)" }}>
              Location Clarity
            </div>

            <h1 style={h1Style}>
              Choose Your Water.
              <br />
              Any Water.
              <br />
            </h1>

            <p style={{ ...leadStyle, maxWidth: 980 }}>
              Analyzes live weather data directly from your location.
              {/* We then take that data, analyze and create an actionable strategy
              for the water you're fishing. <br /> */}
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
              <span style={pill}>Bass Boat</span>
              <span style={pill}>Kayak</span>
              <span style={pill}>Bank</span>
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
                  left: "4.2%",
                  width: "93.6%",
                  height: "92.4%",
                  borderRadius: "60px",
                  overflow: "hidden",
                  zIndex: 1,
                  background: "rgba(0,0,0,0.25)",
                }}
              >
                <img
                  src="/images/mobile_screenshots/Location1.png"
                  alt="Weather cards and outlook"
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
                      title: "Lake Search",
                      desc: "Search our database of 0ver 1000 lakes and reservoirs. You can also search by city or state.",
                    },
                    {
                      title: "Fishing a smaller water body?",
                      desc: "Skip the search. Find your water on the map, tap and label.",
                    },
                    {
                      title: "Boat and Bank Friendly",
                      desc: "Your strategy is generated based on access. If you're a bank angler, we'll make sure that your targets are accessible and your approach matches your access",
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
        </div>

        <div className="container" style={container(1100)}>
          <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
            <div style={{ ...eyebrow, color: "rgba(74,144,226,0.95)" }}>
              Weather Clarity
            </div>

            <h1 style={h1Style}>
              {/* Not Just Weather
                     <br /> */}
              Your Weather, Simplified
              <br />
            </h1>

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
                  left: "4.2%",
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
                  What you’ll notice
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
                      title: "Four Data Cards",
                      desc: "Temperature, Wind, Pressure, and Sky/Precip — the core signals that shape the day.",
                    },
                    {
                      title: "Want a Deeper Dive?",
                      desc: "A quick tap expands the cards and explains how these conditions impact your day on the water.",
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

                {/* <p style={{ ...pStyle, fontSize: "1.1rem", opacity: 0.86 }}>
                         Only the Information You Need.
                         <br />
                         No translation required.
                       </p> */}

                {/* <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                         <Link to="/subscribe" style={primaryCta}>
                           Start Your Free Trial
                         </Link>
                         <Link to="/how-it-works" style={smallCta}>
                           See how it works
                         </Link>
                       </div> */}
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
      </section>

      <section style={{ padding: sectionPad, borderTop: sectionTopBorder }}>
        {/* <div style={{ height: 36 }} /> */}
        <div className="container" style={container(1100)}>
          <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
            <div style={{ ...eyebrow, color: "rgba(74,144,226,0.95)" }}>
              Technique / Presentation Clarity
            </div>

            <h1 style={h1Style}>Complementary Approaches.</h1>
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
                  src="/images/mobile_screenshots/Primary1.png"
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
                  Primary (Pattern 1)
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
                    title="Anchors Your Day"
                    desc="Meant to serve as the best starting point, based on your current weather, season and conditions"
                  />
                  <Bullet
                    title="Pattern Summary"
                    desc="We explain why we chose this presentation and why it makes sense."
                  />
                  <Bullet
                    title="Fish with Confidence"
                    desc="No Decision Paralysis. Figuring out which presentation best suits your conditions is no longer a struggle."
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
                  src="/images/ProductionScreenshots/pivot.png"
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
                  Pivot (Pattern 2)
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
                    title="A Powerful Alternate "
                    desc="A stretegic complement to the primary pattern."
                  />
                  <Bullet
                    title="The Pivot"
                    desc="When bass are less active Pattern 2 targets bass in a different water column."
                  />
                  <Bullet
                    title="Search and Destroy"
                    desc="If your primary pattern is a Search Bait pattern 2 will often serve as the followup. "
                  />
                  <Bullet
                    title="What You'll Notice (Real Intelligence)"
                    desc="References the primary pattern and explains in plain language its role and relation to the first."
                  />
                </ul>

                <div style={{ height: 18 }} />
              </div>
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
                  src="/images/ProductionScreenshots/Why.png"
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
                  Expert Tuning
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
                    title="Soft Plastic/Trailer Guidance"
                    desc="Plastic recommendations based on forage, profile and season."
                  />
                  <Bullet
                    title="Color Suggestions"
                    desc="Color tuneing based on water clarity and light penetration."
                  />
                  <Bullet
                    title="Gear Recommendations"
                    desc="Gear recommendation optimized for each approach, includes Rod/Reel/Line recommendations"
                  />
                </ul>

                <div style={{ height: 18 }} />
              </div>
            </div>
          </div>
        </div>
        <div style={{ height: 36 }} />

        <div className="container" style={container(1100)}>
          <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
            <div style={{ ...eyebrow, color: "rgba(74,144,226,0.95)" }}>
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
                  src="/images/ProductionScreenshots/Targets.png"
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
                      title: "Why This Works",
                      desc: "Nothing left to intrepret, just sound reasoning.",
                    },
                    {
                      title: "Strategy",
                      desc: "Targets are narrowed to the places most likely to hold fish based on today's conditions.",
                    },
                    {
                      title: "Retrieve Guidance",
                      desc: "More than 130+ lure specific retrieves that adjusts for targets and conditions",
                    },
                    {
                      title: "Full Day Progression",
                      desc: "A coherent plan arc without constant second-guessing.",
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
      {/* HOW IT WORKS (Strategy Engine) */}
      {/* <div className="container" style={container(1100)}>
        <h2 style={h2Style}> Make Every Cast Deliberate.</h2>
        <p style={leadStyle}>
          Complete strategy including target areas, retrieves specific to your
          lure
        </p>
      </div> */}
      {/* <div style={{ height: 24 }} /> */}

      <div className="container" style={container(1100)}>
        <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
          <div style={{ ...eyebrow, color: "rgba(74,144,226,0.95)" }}>
            Strategic Clarity
          </div>

          <h2 style={h2Style}>Full Day Progression.</h2>

          <p style={{ ...leadStyle, maxWidth: 980 }}>
            Know where to start, transition and adjust. Clear actionable
            guidance, from daybreak, to last cast.
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
                top: "3.8%",
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
                Clarity leads to Confidence.
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
                    title: "Where To Start",
                    desc: "Bass Clarity doesn't just tell you what to throw, we tell you why it makes sense for your conditions. Nothing left to intrepret, just sound reasoning.",
                  },
                  {
                    title: "What to Expect",
                    desc: "Targets are narrowed to the places most likely to hold fish based on today's conditions.",
                  },
                  {
                    title: "Transitions and Adjustments",
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
          <h2 style={h2Style}>Built for How Anglers Actually Fish</h2>

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
            Just a clear starting point — and a smart adjustment if the day
            unfolds differently than expected.
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
            style={{
              fontSize: "clamp(3.25rem, 7vw, 5rem)",
              fontWeight: 700,
              marginBottom: 18,
              letterSpacing: "-0.03em",
              background: "linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
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
                  href="mailto:support@bassclarity.com"
                  className="muted"
                  style={{ textDecoration: "none" }}
                >
                  support@bassclarity.com
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
    </div>
  );
}
