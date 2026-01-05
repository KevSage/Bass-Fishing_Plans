import React from "react";
import { Link } from "react-router-dom";

/**
 * Location Clarity Page
 * - Mobile-first, responsive up to wide screens
 * - Styled to match the Landing page (dark gradient, soft blue accents, calm typography)
 */
export function LocationClarityPage() {
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

  const grid2Col = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "clamp(28px, 6vw, 64px)",
    alignItems: "center",
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
              Location Clarity
            </div>

            <h1 style={h1Style}>
              Choose Your Water.
              <br />
              Any Water.
              <br />
            </h1>

            <p style={{ ...leadStyle, maxWidth: 980 }}>
              Bass Clarity pulls live weather data directly from your location.
              We then take that data, analyze and create an actionable strategy
              for the water you're fishing. <br />
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
                  src="/images/mobile_screenshots/Location.png"
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
                      desc: "Seearch our database of 0ver 1000 lakes and reservoirs. You can also search by city or state.",
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
      </section>

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
              Location Clarity
            </div>

            <h1 style={h1Style}>
              Real Strategy
              <br />
              Requires Real Intelligence.
              <br />
            </h1>

            <p style={{ ...leadStyle, maxWidth: 980 }}>
              Behind the scenes, Bass Clarity evaluates thousands of
              condition-to-outcome relationships to eliminate what doesn't
              matter. <br />
              {/* The goal is simple: turn conditions into a coherent plan you can
              execute.{" "} */}
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
                <video
                  src="/video/bass-clarity-loading.mp4"
                  autoPlay
                  muted
                  loop
                  playsInline
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "fill",
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
                      title: "Regional Awareness",
                      desc: "We understand that Winter in Florida is much different than a Winter in the Northeast.",
                    },
                    {
                      title: "We Consider Your Location",
                      desc: "A single, consistent read of your water today based on your location's recent weather trends",
                    },
                    {
                      title: "Capture a weather snapshot",
                      desc: "Temperature, wind, pressure, and sky/precip, plus supporting signals used internally",
                    },
                    {
                      title: "Compute derived signals",
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
                Weather Clarity
              </div>
              <div style={{ opacity: 0.78, lineHeight: 1.7 }}>
                The weather snapshot and tap-to-expand cards that keep the day
                readable without turning fishing into a dashboard.
              </div>
              <div style={{ marginTop: 14 }}>
                <Link to="/weather" style={smallCta}>
                  Back to Weather Clarity
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

      {/* ============================================
          HOW IT THINKS - With Visual Proof
          ============================================ */}

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
