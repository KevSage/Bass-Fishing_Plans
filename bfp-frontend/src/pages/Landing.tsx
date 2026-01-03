import React from "react";
import { Link } from "react-router-dom";

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
          <h1 style={h1Style}>
            Clear Fishing Decisions.
            <br />
            Without the Guesswork.
          </h1>

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
            Bass Clarity interprets season, conditions, and fish positioning
            into a focused, actionable fishing strategy — so you know where to
            fish, how to fish it, and why it works.
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
            Most fishing apps give you more data than direction.
          </h2>

          <p style={{ ...leadStyle, marginBottom: "clamp(36px, 7vw, 64px)" }}>
            Charts, bite scores, forecasts, and bait lists. Plenty of
            information — but still no clear plan.
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
            <div style={{ maxWidth: 560, margin: "0 auto" }}>
              <p
                style={{
                  fontSize: "clamp(1.2rem, 2.6vw, 1.45rem)",
                  lineHeight: 1.8,
                  opacity: 0.8,
                  margin: 0,
                }}
              >
                You still end up asking the same questions on the water.
                <br />
                <br />
                Where should I actually be fishing?
                <br />
                Why isn’t this working?
                <br />
                What should I change — and when?
              </p>
            </div>
          </div>

          <p
            style={{
              fontSize: "1.35rem",
              textAlign: "center",
              opacity: 0.75,
              fontWeight: 500,
              marginBottom: 12,
            }}
          >
            Information doesn’t fish for you. Decisions do.
          </p>

          <p
            style={{
              ...bodyCenter,
              opacity: 0.6,
              fontStyle: "italic",
              maxWidth: 880,
            }}
          >
            Bass Clarity exists because fishing decisions aren’t made on
            spreadsheets — they’re made on the water.
          </p>
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
            Bass Clarity interprets season, conditions, and fish positioning
            into a focused, actionable fishing strategy
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
                  left: "5.5%",
                  width: "87.6%",
                  height: "92.4%",
                  borderRadius: "42px",
                  overflow: "hidden",
                  zIndex: 1,
                }}
              >
                <img
                  src="/images/mobile_screenshots/Weather.png"
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
                  "Techniques that fit the situation",
                  "Dynamic Approaches That Complement One Another",
                  "Lures That Express Those approaches including soft plastic, trailer, and color and gear recommendations.",
                  "Suggested Targets and Other High Producing Areas Based on Season and Your Conditions",
                  "Lure Specific Retrieves that explain how to execute for each given target",
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
            Bass Clarity interprets season, conditions, and fish positioning
            into a focused, actionable fishing strategy
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
                  left: "5.5%",
                  width: "87.6%",
                  height: "92.4%",
                  borderRadius: "42px",
                  overflow: "hidden",
                  zIndex: 1,
                }}
              >
                <img
                  src="/images/mobile_screenshots/hero_jig.png"
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
                  "Techniques that fit the situation",
                  "Dynamic Approaches That Complement One Another",
                  "Lures That Express Those approaches including soft plastic, trailer, and color and gear recommendations.",
                  "Suggested Targets and Other High Producing Areas Based on Season and Your Conditions",
                  "Lure Specific Retrieves that explain how to execute for each given target",
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
          HOW IT THINKS - With Visual Proof
          ============================================ */}
      <section style={{ padding: sectionPad }}>
        <div className="container" style={container(1200)}>
          <h2 style={h2Style}>
            A Fishing Engine Built to Turn Data Into Decisions
          </h2>

          <p
            style={{
              ...leadStyle,
              maxWidth: 840,
              marginBottom: "clamp(44px, 8vw, 80px)",
            }}
          >
            Behind the scenes, Bass Clarity evaluates thousands of
            condition-to-outcome relationships to eliminate what doesn’t matter.
            <br />
            Not charts, not rankings, not guesses. We translate real-world
            conditions into a cohesive plan:
          </p>

          <div style={grid2Col}>
            {/* iPhone with Loading Video */}
            <div
              style={{
                position: "relative",
                maxWidth: "min(380px, 100%)",
                margin: "0 auto",
              }}
            >
              <img
                src="/images/iphone15.png"
                alt="Bass Clarity analyzing"
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
                  left: "6.2%",
                  width: "87.6%",
                  height: "92.4%",
                  borderRadius: "42px",
                  overflow: "hidden",
                  zIndex: 1,
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
              </div>
            </div>

            {/* Replaces checklist + removes steps entirely */}
            <div style={{ paddingLeft: 6, maxWidth: 620, margin: "0 auto" }}>
              <p
                style={{
                  fontSize: "1.2rem",
                  lineHeight: 1.8,
                  opacity: 0.78,
                  marginBottom: 24,
                }}
              >
                What you're seeing isn't a checklist. It's a decision system.
                <br />
                <br />
                Bass Clarity ingests the same environmental, seasonal, and
                situational data serious anglers already respect.
                <br />
                <br />
                Bass Clarity doesn't promise fish. It gives you a better way to
                think, decide, and execute — every time you're on the water.
              </p>

              <p
                style={{
                  marginTop: 18,
                  fontSize: "1.1rem",
                  opacity: 0.65,
                  fontStyle: "italic",
                  lineHeight: 1.7,
                }}
              >
                Freedom within structure — multiple correct options, without
                chaos.
              </p>
            </div>
          </div>
        </div>
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

          <p
            style={{
              fontSize: "1.25rem",
              textAlign: "center",
              opacity: 0.7,
              fontWeight: 500,
              fontStyle: "italic",
              maxWidth: 700,
              margin: "0 auto",
              lineHeight: 1.7,
            }}
          >
            The goal isn't to fish perfectly. It's to fish deliberately.
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
            5-day free trial
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
            Bass Clarity is built for anglers who want to understand why
            something works — not just what to throw. Whether you fish once a
            week or plan trips months ahead, it gives you a disciplined starting
            point and a smarter way to adjust.
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
