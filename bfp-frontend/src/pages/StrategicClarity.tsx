import React from "react";
import { Link } from "react-router-dom";
import {
  CompassIcon,
  TargetIcon,
  LayersIcon,
  BarChartIcon,
  CheckCircleIcon,
} from "../components/UnifiedIcons";

/**
 * Strategic Clarity Page
 * - Uses WeatherClarity.tsx as the visual + layout source of truth:
 *   dark gradient, soft-blue accents, calm typography, section rhythm,
 *   hero + phone mock, and tight, readable cards.
 * - Focus: strategy (targets, retrieves, day progression) — no hype.
 */
export function StrategicClarityPage() {
  // -----------------------------
  // Shared typography + layout (match WeatherClarity)
  // -----------------------------
  const sectionPadY = "clamp(76px, 10vw, 132px)";
  const sectionPadX = "clamp(18px, 4vw, 24px)";
  const sectionPad = `${sectionPadY} ${sectionPadX}`;

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

  return (
    <div
      style={{
        background: "linear-gradient(to bottom, #0a0a0a, #1a1a2e)",
        color: "#fff",
        minHeight: "100vh",
      }}
    >
      {/* HERO */}
      <section
        style={{
          padding: `clamp(54px, 8vh, 96px) ${sectionPadX} 0`,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Soft gradient wash */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 25% 18%, rgba(74, 144, 226, 0.10) 0%, transparent 68%)",
            pointerEvents: "none",
          }}
        />

        <div className="container" style={container(1100)}>
          <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
            <div style={{ ...eyebrow, color: "rgba(74,144,226,0.95)" }}>
              Strategic Clarity
            </div>

            <h1 style={h1Style}>Fish With Intention.</h1>

            <p style={{ ...leadStyle, maxWidth: 980 }}>
              Know exactly what to do, and why you're doing it. No datapoints,
              charts, or graphs.
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
                  left: "6.2%",
                  width: "87.6%",
                  height: "92.4%",
                  borderRadius: "42px",
                  overflow: "hidden",
                  zIndex: 1,
                  background: "rgba(0,0,0,0.25)",
                }}
              >
                <img
                  src="/images/mobile_screenshots/WTW_Strategy.png"
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
                      desc: "Bass Clarity doesn't just tell you what to throw, we tell you why it makes sense for your conditions. Nothing left to intrepret, just sound reasoning.",
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
      <section style={{ padding: sectionPad, borderTop: sectionTopBorder }}>
        <div className="container" style={container(1100)}>
          <h2 style={h2Style}> Make Every Cast Deliberate.</h2>
          <p style={leadStyle}>
            Target areas include lure specific retrieve and cadence guidance
            that you will not get anywhere else.
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
                src="/images/mobile_screenshots/Targets1.png"
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
                  Icon: CompassIcon,
                  title: "Strategy",
                  bullets: [
                    "Complete strategy written for execution (not theory)",
                    "Natural understandable language",
                  ],
                },
                {
                  Icon: TargetIcon,
                  title: "Targets",
                  bullets: [
                    "Targets based on season and your conditions",

                    "Helps you to narrow the water",
                  ],
                },
                {
                  Icon: LayersIcon,
                  title: "Retrieves",
                  bullets: [
                    "Hundreds of retrieves specific to your lure",
                    "Cadence + control notes",
                  ],
                },
                {
                  Icon: BarChartIcon,
                  title: "Day progression",
                  bullets: [
                    "Explains when to shift between approaches keeping adjustments intentional, not random",
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
              Why this stays calm
            </div>
            <p style={{ ...pStyle, opacity: 0.86, marginTop: 0 }}>
              Strategic Clarity is designed to prevent option overload. The plan
              narrows down to a few decisions.
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
                left: "6.2%",
                width: "89.6%",
                height: "92.4%",
                borderRadius: "42px",
                overflow: "hidden",
                zIndex: 1,
                background: "rgba(0,0,0,0.25)",
              }}
            >
              <img
                src="/images/mobile_screenshots/DayProgression.png"
                alt="Strategy' cards and progression"
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

      {/* BOTTOM NAV: next pages */}
      <section style={{ padding: sectionPad }}>
        <div className="container" style={container(1100)}>
          <h2 style={h2Style}>Next: the rest of the system</h2>
          <p style={leadStyle}>
            Strategy is where the plan becomes executable. The other pages cover
            the inputs (weather) and the technique layer that turns conditions
            into presentation decisions.
          </p>

          <div style={{ height: 34 }} />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 14,
            }}
          >
            <div style={{ ...softCard, padding: 20 }}>
              <div style={{ fontWeight: 780, marginBottom: 10 }}>
                Weather Clarity
              </div>
              <div style={{ opacity: 0.78, lineHeight: 1.7 }}>
                The core numbers — temperature, wind, pressure, sky/precip — in
                a calm, readable format with plain-language expansions.
              </div>
              <div style={{ marginTop: 14 }}>
                <Link to="/weather" style={smallCta}>
                  Go to Weather Clarity →
                </Link>
              </div>
            </div>

            <div
              style={{
                ...card,
                padding: 20,
                background: "rgba(255,255,255,0.02)",
              }}
            >
              <div style={{ fontWeight: 780, marginBottom: 10 }}>
                Technique / Presentation Clarity
              </div>
              <div style={{ opacity: 0.78, lineHeight: 1.7 }}>
                How the plan selects technique families and related choices as a
                coherent set — not random suggestions.
              </div>
              <div style={{ marginTop: 14 }}>
                <Link to="/presentation" style={smallCta}>
                  Go to Presentation Clarity →
                </Link>
              </div>
            </div>
          </div>

          <div style={{ height: 26 }} />

          {/* Unobtrusive subscribe footer row */}
          <div
            style={{
              marginTop: 10,
              display: "flex",
              justifyContent: "center",
              gap: 10,
              flexWrap: "wrap",
              opacity: 0.98,
            }}
          >
            <Link to="/subscribe" style={primaryCta}>
              Start Your Free Trial
            </Link>
            <Link to="/" style={smallCta}>
              Back to Landing
            </Link>
          </div>
        </div>
      </section>

      {/* Minimal footer */}
      <footer
        style={{
          padding: "48px 18px",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          opacity: 0.78,
        }}
      >
        <div className="container" style={container(1100)}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 14,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <div style={{ fontSize: "0.95rem" }}>
              © {new Date().getFullYear()} Bass Clarity
            </div>

            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              <Link to="/privacy" style={{ ...smallCta, padding: "10px 12px" }}>
                Privacy
              </Link>
              <Link to="/terms" style={{ ...smallCta, padding: "10px 12px" }}>
                Terms
              </Link>
              <Link to="/refunds" style={{ ...smallCta, padding: "10px 12px" }}>
                Refunds
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
