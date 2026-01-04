import React from "react";
import { Link } from "react-router-dom";

/**
 * Weather Clarity Page
 * - Mobile-first, responsive up to wide screens
 * - Styled to match the Landing page (dark gradient, soft blue accents, calm typography)
 * - Focus: Weather/Conditions only (no preview/member language)
 */
export function WeatherClarityPage() {
  // -----------------------------
  // Shared typography + layout
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
              Weather Clarity
            </div>

            <h1 style={h1Style}>
              Not Just Weather
              <br />
              Your Weather
              <br />
            </h1>

            <p style={{ ...leadStyle, maxWidth: 980 }}>
              No Dashboards. No Charts. No Overlays.
              <br />
              Bass Clarity pulls live weather data directly from your location.
              We then take that data, analyze and create an actionable strategy
              for the water you're fishing. <br />
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
              <span style={pill}>🌡️ Temperature</span>
              <span style={pill}>💨 Wind + Safety</span>
              <span style={pill}>📉 Pressure</span>
              <span style={pill}>☁️ Sky + Precip</span>
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
                  src="/images/mobile_screenshots/Weather1.png"
                  alt="Weather cards and outlook"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "fill",
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
                <div style={{ height: 18 }} />

                <p style={{ ...pStyle, fontSize: "1.1rem", opacity: 0.86 }}>
                  Only the Information You Need.
                  <br />
                  No translation required.
                </p>

                <div style={{ height: 18 }} />

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
      </section>

      {/* HOW IT WORKS (Weather Engine) */}
      <section style={{ padding: sectionPad, borderTop: sectionTopBorder }}>
        <div className="container" style={container(1100)}>
          <h2 style={h2Style}>More Context, When You Need It</h2>
          <p style={leadStyle}>
            The goal is simple: keep the important numbers visible, then
            translate the rest into meaning — so the day feels readable without
            becoming a data dump. Just tap one of the cards for more clarity.
          </p>

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
                  src="/images/mobile_screenshots/WhatThisMeansToday.png"
                  alt="Weather cards and outlook"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
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
                      title: "Want a Deeper Dive?",
                      desc: "A quick tap expands the cards and explains how these conditions impact your day on the water.",
                    },
                    {
                      title: "4 Focused Cards",
                      desc: "Temperature, Wind, Pressure, and Sky/Precip — the core signals that shape the day.",
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
                <div style={{ height: 18 }} />

                <p style={{ ...pStyle, fontSize: "1.1rem", opacity: 0.86 }}>
                  Only the Information You Need.
                  <br />
                  No translation required.
                </p>

                <div style={{ height: 18 }} />

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
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 14,
            }}
          >
            {[
              {
                title: "1) Capture a weather snapshot",
                desc: "A single, consistent read of your location for today — temperature, wind, pressure, and sky/precip, plus supporting signals used internally.",
              },
              {
                title: "2) Compute derived signals",
                desc: "Trends like temperature swing, wind context, pressure movement, and stability indicators.",
              },
              {
                title: "3) Present it in two layers",
                desc: "Cards for glanceable numbers + tap-to-expand detail in natural language tied to your actual conditions.",
              },
              {
                title: "4) Synthesize an outlook blurb",
                desc: "A short, calm summary that connects the snapshot to what it implies for bass activity and the feel of the day.",
              },
            ].map((x, i) => (
              <div
                key={i}
                style={{
                  ...card,
                  padding: 18,
                  background: "rgba(255,255,255,0.02)",
                }}
              >
                <div
                  style={{
                    fontWeight: 750,
                    letterSpacing: "-0.01em",
                    marginBottom: 8,
                    color: "rgba(255,255,255,0.92)",
                  }}
                >
                  {x.title}
                </div>
                <div style={{ opacity: 0.78, lineHeight: 1.75 }}>{x.desc}</div>
              </div>
            ))}
          </div>

          <div style={{ height: 22 }} />

          <div
            style={{
              ...softCard,
              padding: "clamp(18px, 3.5vw, 26px)",
              maxWidth: 980,
              margin: "0 auto",
            }}
          >
            <div
              style={{
                ...eyebrow,
                marginBottom: 10,
                color: "rgba(74,144,226,0.95)",
              }}
            >
              Why this stays calm
            </div>
            <p style={{ ...pStyle, opacity: 0.86 }}>
              You’re still seeing what matters — like temperature and wind speed
              — but the experience stays quiet. The system emphasizes safety
              when wind is a factor, reduces noise elsewhere, and gives you
              detail only when you ask for it.
            </p>
          </div>
        </div>
      </section>

      {/* WHAT YOU SEE (Cards + Expansion) */}
      <section
        style={{
          padding: sectionPad,
          background: "rgba(74, 144, 226, 0.02)",
          borderTop: sectionTopBorder,
          borderBottom: sectionTopBorder,
        }}
      >
        <div className="container" style={container(1200)}>
          <h2 style={h2Style}>What you see in the plan</h2>
          <p style={leadStyle}>
            Four cards keep the section short. Expansions add detail in natural
            language — tied to today’s numbers — so it feels informative without
            turning into a dashboard.
          </p>

          <div style={{ height: 46 }} />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 14,
            }}
          >
            {[
              {
                icon: "🌡️",
                title: "Temperature",
                bullets: [
                  "High / low + swing",
                  "Expansion references today’s temps",
                  "Outlook pulls it in when it matters",
                ],
              },
              {
                icon: "💨",
                title: "Wind",
                bullets: [
                  "Speed + direction",
                  "Safety-forward when wind is strong",
                  "Expansion explains how the day feels",
                ],
              },
              {
                icon: "📉",
                title: "Pressure",
                bullets: [
                  "Current + trend context",
                  "Interprets stability vs change",
                  "Explained without solunar clutter",
                ],
              },
              {
                icon: "☁️",
                title: "Sky + Precip",
                bullets: [
                  "Cloud cover + rain",
                  "Simple phrasing (no noise)",
                  "Outlook mentions rain/moon only if relevant",
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
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 14,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background:
                        "linear-gradient(135deg, rgba(74,144,226,0.22) 0%, rgba(74,144,226,0.06) 100%)",
                      border: "1px solid rgba(74,144,226,0.20)",
                    }}
                  >
                    <span style={{ fontSize: "1.15rem" }}>{c.icon}</span>
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

          <div style={{ height: 26 }} />
        </div>
      </section>

      {/* BOTTOM NAV: next pages */}
      <section style={{ padding: sectionPad }}>
        <div className="container" style={container(1100)}>
          <h2 style={h2Style}>Next: the rest of the system</h2>
          <p style={leadStyle}>
            Weather is one layer of clarity. The next pages cover how Bass
            Clarity turns conditions into technique decisions — and then into a
            coherent, fishable strategy.
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
                Technique / Presentation Clarity
              </div>
              <div style={{ opacity: 0.78, lineHeight: 1.7 }}>
                How the plan selects technique families, lures, colors, and gear
                as a coherent set — not random suggestions.
              </div>
              <div style={{ marginTop: 14 }}>
                <Link to="/presentation" style={smallCta}>
                  Go to Presentation Clarity →
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
                Strategic Clarity
              </div>
              <div style={{ opacity: 0.78, lineHeight: 1.7 }}>
                Targets, retrieves, and day progression — the parts that make
                the plan executable on the water.
              </div>
              <div style={{ marginTop: 14 }}>
                <Link to="/strategy" style={smallCta}>
                  Go to Strategic Clarity →
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
