import React from "react";
import { Link } from "react-router-dom";
import {
  CompassIcon,
  TargetIcon,
  LayersIcon,
  BarChartIcon,
  CheckCircleIcon,
} from "../components/UnifiedIcons";

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

  return (
    <div
      style={{
        background: "linear-gradient(to bottom, #0a0a0a, #1a1a2e)",
        color: "#fff",
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

          <p
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
            season, conditions, and fish positioning into a focused, actionable
            fishing strategy — so you know where to fish, how to fish it, and
            why it works.
          </p>

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
            Bass Clarity doesn't show you data.
            <br />
            It interprets it.
          </h2>

          <p
            style={{
              ...bodyCenter,
              maxWidth: 920,
              marginBottom: "clamp(44px, 8vw, 72px)",
            }}
          >
            Bass Clarity interprets your weather, conditions, and seasonal bass
            data to create your personal, actionable fishing strategy.
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
                  src="/images/mobile_screenshots/Weather1.png"
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
                  "A Bass-Centric Daily Weather Outlook",
                  "Curated list of target areas based on season and your conditions.",
                  "Two complementary approaches based on your targets.",
                  "Soft plastic, trailer, color and gear recommendations based on the approaches.",
                  "Lure Specific Retrieves that explain how to execute and when to adjust.",
                  "A Full Day Progression plan that outlines your day from first light, to your last cast. ",
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
            Other apps overwhelm with data but its left up to you to intrepret
            what they mean. You still end up asking the same questions when
            approaching a new body of water.
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
            Overwhelming data creates more questions than answers. Bass Clarity
            exists because fishing decisions aren't made on spreadsheets —
            they're made on the water.
          </p>
        </div>
      </section>

      {/* HOW IT WORKS (Strategy Engine) */}
      <section style={{ padding: sectionPad, borderTop: sectionTopBorder }}>
        <div className="container" style={container(1100)}>
          <h2 style={h2Style}>Built to Turn Data Into Decisions</h2>
          <p style={leadStyle}>
            Bass Clarity ingests the same environmental, regional, seasonal, and
            situational data serious anglers already respect. Then we synthesize
            it into a cohesive plan.
          </p>
        </div>
        <div style={{ height: 46 }} />

        <div className="container" style={container(1200)}>
          {/* Mobile: phone first, then 2x2 cards */}
          {/* Desktop: 2x2 cards left, phone right */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: "clamp(32px, 6vw, 64px)",
              alignItems: "center",
            }}
            className="strategy-layout"
          >
            {/* Phone Mock - first on mobile, second on desktop */}
            <div
              style={{
                position: "relative",
                maxWidth: 420,
                margin: "0 auto",
                justifySelf: "center",
              }}
              className="strategy-phone"
            >
              <img
                src="/images/iphone15.png"
                alt="Bass Clarity strategy view"
                style={{
                  width: "100%",
                  display: "block",
                  position: "relative",
                  zIndex: 2,
                  pointerEvents: "none",
                }}
              />
              <img
                src="/images/mobile_screenshots/Jerkbait.png"
                alt="Strategy cards interface"
                style={{
                  position: "absolute",
                  top: "4%",
                  left: "6.2%",
                  width: "87.6%",
                  height: "92.8%",
                  borderRadius: "clamp(24px, 4vw, 40px)",
                  objectFit: "contain",
                  zIndex: 1,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: "-15%",
                  background:
                    "radial-gradient(circle, rgba(74, 144, 226, 0.14) 0%, transparent 70%)",
                  filter: "blur(60px)",
                  zIndex: 0,
                  pointerEvents: "none",
                }}
              />
            </div>

            {/* 2x2 Card Grid - second on mobile, first on desktop */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: 18,
              }}
              className="strategy-cards"
            >
              {[
                {
                  Icon: BarChartIcon,
                  title: "Two Dynamic Approaches",
                  bullets: [
                    "Primary and Secondary Approaches",
                    "Suggestions for Lures, Plastics and Gear",
                    "Color recommendations based on your conditions",
                  ],
                },
                {
                  Icon: CompassIcon,
                  title: "Strategy",
                  bullets: [
                    "Complete strategy, based on weather + seasonal context",
                    "Written for execution (not theory)",
                    "Natural understandable language",
                  ],
                },
                {
                  Icon: TargetIcon,
                  title: "Targets & Retrieves",
                  bullets: [
                    "Descriptions for all target areas and exactly how to approach them",
                    "Helps you to narrow the water, so that you focus on the most productive areas",
                  ],
                },
                {
                  Icon: LayersIcon,
                  title: "Day Progression Guidance",
                  bullets: [
                    "Early / Midday / Late",
                    "When to shift between approaches keeping adjustments intentional and not random",
                    "Teaches when to use what, and why",
                  ],
                },
              ].map((c, i) => (
                <div
                  key={i}
                  style={{
                    ...card,
                    padding: 18,
                    background: "rgba(255,255,255,0.02)",
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <div style={iconBadge}>
                      <c.Icon
                        style={{
                          width: 18,
                          height: 18,
                          color: "rgba(74,144,226,0.95)",
                        }}
                      />
                    </div>
                    <div style={{ fontWeight: 780, fontSize: "1.1rem" }}>
                      {c.title}
                    </div>
                  </div>

                  <ul
                    style={{
                      marginTop: 14,
                      paddingLeft: 18,
                      lineHeight: 1.8,
                      opacity: 0.82,
                      fontSize: "1.02rem",
                    }}
                  >
                    {c.bullets.map((b, idx) => (
                      <li key={idx}>{b}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div style={{ height: 48 }} />

          {/* "Why this stays calm" section */}
          <div
            style={{
              ...softCard,
              padding: "clamp(28px, 4.5vw, 38px)",
              maxWidth: 980,
              margin: "0 auto",
            }}
          >
            <div
              style={{
                ...eyebrow,
                marginBottom: 16,
                color: "rgba(74,144,226,0.95)",
              }}
            >
              Reassurance
            </div>
            <p style={{ ...pStyle, opacity: 0.86, marginTop: 0 }}>
              If your strategy isn't producing, generate another read after an
              hour. We'll give you another look with a revised plan based on
              your updated conditions.
            </p>
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

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 36,
              marginBottom: 60,
            }}
          >
            {[
              {
                title: "Disciplined, not rigid",
                body: "A clear starting point grounded in conditions — with room to adjust as the day unfolds.",
              },
              {
                title: "Flexible, not random",
                body: "Multiple valid approaches within structure. Variety with intent, not bait roulette.",
              },
              {
                title: "Explanatory, not prescriptive",
                body: "You understand why something fits today — not just what to throw.",
              },
              {
                title: "Designed for confidence, not noise",
                body: "Fewer unnecessary changes. Less second-guessing. More deliberate decisions.",
              },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  padding: "34px 30px",
                  background: "rgba(255,255,255,0.02)",
                  borderRadius: 16,
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <h3
                  style={{
                    fontSize: "1.15rem",
                    margin: "0 0 10px",
                    fontWeight: 600,
                    opacity: 0.95,
                  }}
                >
                  {item.title}
                </h3>
                <p style={{ margin: 0, opacity: 0.7, lineHeight: 1.65 }}>
                  {item.body}
                </p>
              </div>
            ))}
          </div>

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
      <section
        style={{
          padding: `clamp(72px, 9vw, 100px) ${sectionPadX}`,
          background: "rgba(74, 144, 226, 0.02)",
        }}
      >
        <div className="container" style={container(820)}>
          <p
            style={{
              fontSize: "clamp(1.15rem, 2.6vw, 1.4rem)",
              textAlign: "center",
              opacity: 0.85,
              lineHeight: 1.85,
              margin: 0,
            }}
          >
            Not a map app, not a weather app, not social media. No bite scores
            and bait lists. Bass Clarity is built for anglers who want to
            understand why something works — not just what to throw.
          </p>
        </div>
      </section>

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
