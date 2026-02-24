import React, { useEffect, useRef, ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  CompassIcon,
  TargetIcon,
  LayersIcon,
  BarChartIcon,
  CheckCircleIcon,
  // Added these for the Comparison Table
  CheckIcon,
  XIcon,
  CrownIcon,
  ThermometerIcon,
  WindIcon,
  CloudIcon,
  MapPinIcon,
  ActivityIcon,
} from "../components/UnifiedIcons";

// --- 1. ANIMATION UTILITIES ---

const Reveal = ({
  children,
  delay = 0,
}: {
  children: ReactNode;
  delay?: number;
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" },
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="reveal-block"
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

// --- 2. STYLES ---

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

const bodyCenter = {
  fontSize: "1.15rem",
  lineHeight: 1.8,
  opacity: 0.75,
  textAlign: "center" as const,
  maxWidth: 860,
  margin: "0 auto",
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

const sectionTopBorder = "1px solid rgba(255,255,255,0.06)";

const grid2Col = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: "clamp(28px, 6vw, 64px)",
  alignItems: "center",
} as const;

// --- 3. COMPARISON COMPONENT (NEW) ---

function ComparisonTable() {
  return (
    <div className="pricing-grid">
      {/* FREE TIER */}
      <div className="pricing-card free">
        <div className="card-header">
          <div className="water-text" style={{ ...eyebrow, marginBottom: 8 }}>
            Free Tier
          </div>
          <h3 className="plan-name">Angler</h3>
          <p className="plan-desc">Build your Catchlog & map history.</p>
        </div>

        <div className="features-list">
          <div className="feature-row">
            <CheckIcon size={18} /> Unlimited Catch Logging
          </div>
          <div className="feature-row">
            <CheckIcon size={18} /> Interactive Map Dashboard
          </div>
          <div className="feature-row">
            <CheckIcon size={18} /> 1 Home Lake (Weather)
          </div>
          <div className="feature-row">
            <CheckIcon size={18} /> Auto Image Location Extraction
          </div>
          <div className="feature-row dim">
            <XIcon size={18} /> AI Fishing Plan Generator
          </div>
          <div className="feature-row dim">
            <XIcon size={18} /> Advanced Insights
          </div>
          <div className="feature-row dim">
            <XIcon size={18} /> Action Camera Uploads
          </div>
          <div className="feature-row dim">
            <XIcon size={18} />
            Lake Customization
          </div>
        </div>

        <Link to="/subscribe" className="plan-btn secondary">
          Start - Free
        </Link>
      </div>

      {/* PRO TIER */}
      <div className="pricing-card pro">
        <div className="popular-badge">MOST POPULAR</div>
        <div className="card-header">
          <div
            className="water-text"
            style={{ ...eyebrow, marginBottom: 8, color: "#4A90E2" }}
          >
            Pro Tier
          </div>
          <h3 className="plan-name">
            Pro{" "}
            <span>
              $10<span className="period">/mo</span>
            </span>
          </h3>
          <p className="plan-desc">Full predictive intelligence.</p>
        </div>

        <div className="features-list">
          <div className="feature-row highlight">
            <CrownIcon size={18} /> <strong>Everything in Angler</strong>
          </div>
          <div className="feature-row">
            <CheckIcon size={18} /> Unlimited Lakes and Live Weather
          </div>

          <div className="feature-row">
            <CheckIcon size={18} /> Unlimited AI Strategy Engine
          </div>
          <div className="feature-row">
            <CheckIcon size={18} /> Quick Action Camera Upload
          </div>
          <div className="feature-row">
            <CheckIcon size={18} /> Full Featured Insights
          </div>
          <div className="feature-row">
            <CheckIcon size={18} /> Lake Customization
          </div>
          <div className="feature-row">
            <CheckIcon size={18} /> Daily Catchlog
          </div>
        </div>

        <Link to="/subscribe" className="plan-btn primary">
          Get Bass Clarity Pro
        </Link>
        <p
          style={{
            textAlign: "center",
            fontSize: "0.8rem",
            opacity: 0.6,
            marginTop: 12,
          }}
        ></p>
      </div>
    </div>
  );
}

// --- 4. MAIN PAGE ---

export function Landing() {
  const sectionPadY = "clamp(84px, 10vw, 140px)";
  const sectionPadX = "clamp(18px, 4vw, 24px)";
  const sectionPad = `${sectionPadY} ${sectionPadX}`;

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
        width: "100%",
        overflowX: "clip",
      }}
    >
      {/* ================= HERO SECTION ================= */}
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
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 30% 20%, rgba(74, 144, 226, 0.08) 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "url(/images/hero_bass.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "65% 45%",
            opacity: 1,
            filter: "brightness(0.85)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.8) 100%)",
            zIndex: 1,
          }}
        />

        <div
          className="container"
          style={{
            position: "relative",
            zIndex: 2,
            textAlign: "center",
            maxWidth: 980,
            padding: `0 ${sectionPadX}`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Reveal>
            <h1
              style={{
                ...h1Style,
                color: "#ffffff",
                textShadow: "0 4px 24px rgba(0,0,0,0.6)",
                marginBottom: 20,
              }}
            >
              Clarity on the Water.
            </h1>
          </Reveal>

          <Reveal delay={100}>
            <p
              style={{
                fontSize: "clamp(1rem, 2.2vw, 1.2rem)",
                lineHeight: 1.6,
                color: "rgba(255,255,255,0.9)",
                textShadow: "0 2px 12px rgba(0,0,0,0.5)",
                maxWidth: 640,
                margin: "0 auto 32px",
                fontWeight: 500,
              }}
            >
              More than a fishing app. A way to understand your water,
              preserve what you've learned, and fish with real intention.
            </p>
          </Reveal>

          <Reveal delay={200}>
            <Link
              to="/subscribe"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "16px 32px",
                fontSize: "1.05rem",
                fontWeight: 700,
                background: "linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)",
                color: "#fff",
                border: "none",
                borderRadius: 14,
                textDecoration: "none",
                boxShadow: "0 10px 30px rgba(74, 144, 226, 0.3)",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow =
                  "0 15px 40px rgba(74, 144, 226, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 10px 30px rgba(74, 144, 226, 0.3)";
              }}
            >
              Get Started Free
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </Reveal>

          <Reveal delay={300}>
            <p
              style={{
                fontSize: "0.9rem",
                color: "rgba(255,255,255,0.55)",
                marginTop: 24,
                fontWeight: 500,
                letterSpacing: "0.02em",
              }}
            >
              Strategy grounded in tradition. Insight built from your own history.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ================= INTRO ================= */}
      <section
        style={{ padding: sectionPad, background: "rgba(74, 144, 226, 0.02)" }}
      >
        <div className="container" style={container(1200)}>
          <Reveal>
            <h2
              className="water-text"
              style={{
                ...h2Style,
                fontSize: "clamp(2.25rem, 5.5vw, 3.5rem)",
                marginBottom: 28,
              }}
            >
              Built Different.
            </h2>
            <p
              style={{
                ...bodyCenter,
                maxWidth: 920,
                marginBottom: "clamp(44px, 8vw, 72px)",
              }}
            >
              Other apps give you data without direction. Charts without clarity.
              Someone else's hot spots instead of your own understanding.
              <br /><br />
              Bass Clarity focuses on the individual angler. Your waters. Your catches.
              Your patterns. We use AI to surface what worked, when, and why—so every
              trip builds on the last.
            </p>
          </Reveal>

          <div style={grid2Col}>
            <Reveal delay={200}>
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
                    top: "4%",
                    width: "101%",
                    height: "92.4%",
                    borderRadius: "70px",
                    overflow: "hidden",
                    zIndex: 1,
                  }}
                >
                  <video
                    src="/video/intro1.mov"
                    autoPlay
                    muted
                    loop
                    playsInline
                    style={{
                      width: "100%",
                      height: "97.5%",
                      objectFit: "contain",
                    }}
                  />
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ================= LOCATION CLARITY ================= */}
      <section style={{ padding: sectionPad, borderTop: sectionTopBorder }}>
        <div className="container" style={container(1100)}>
          <Reveal>
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
              Every catch. Every spot. Every condition. Logged and mapped over
              time, so patterns reveal themselves naturally—through your own
              experience, not someone else's data.
            </p>
          </Reveal>
        </div>

        <div
          style={{
            ...grid2,
            marginTop: "clamp(34px, 6vw, 54px)",
            paddingBottom: "clamp(48px, 7vw, 72px)",
          }}
        >
          <Reveal delay={200}>
            <div
              style={{ position: "relative", maxWidth: 420, margin: "0 auto" }}
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
                  top: "5%",
                  left: "3.1%",
                  width: "97%",
                  height: "92.4%",
                  borderRadius: "75px",
                  overflow: "hidden",
                  zIndex: 1,
                  background: "rgba(0,0,0,0.25)",
                }}
              >
                <video
                  src="/video/mapvid2.mov"
                  autoPlay
                  muted
                  loop
                  playsInline
                  style={{
                    width: "100%",
                    height: "97.5%",
                    objectFit: "contain",
                  }}
                />
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
          </Reveal>

          <Reveal>
            <div style={{ padding: "0 4px", maxWidth: 640, margin: "0 auto" }}>
              <div style={{ ...softCard, padding: "clamp(18px, 3.5vw, 28px)" }}>
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
                      title: "Start Where You Are",
                      desc: "Import past catches and see your water come to life immediately.",
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
          </Reveal>
        </div>
      </section>

      {/* ================= INSIGHT CLARITY ================= */}
      <section style={{ padding: sectionPad, borderTop: sectionTopBorder }}>
        <div className="container" style={container(1100)}>
          <Reveal>
            <div
              style={{ textAlign: "center", position: "relative", zIndex: 1 }}
            >
              <div
                className="water-text"
                style={{ ...eyebrow, color: "rgba(74,144,226,0.95)" }}
              >
                Insight Clarity
              </div>
              <h2 style={h2Style}>Every Catch Tells You More.</h2>
              <p style={{ ...leadStyle, maxWidth: 980 }}>
                Every photo captures more than the moment. Location, date, time,
                season, weather—automatically extracted and preserved. Add your
                lure and color, and each catch becomes a data point that sharpens
                your edge over time.
              </p>
            </div>
          </Reveal>

          <div
            style={{
              ...grid2,
              marginTop: "clamp(34px, 6vw, 54px)",
              paddingBottom: "clamp(48px, 7vw, 72px)",
            }}
          >
            <Reveal delay={200}>
              <div
                style={{
                  position: "relative",
                  maxWidth: 420,
                  margin: "0 auto",
                }}
              >
                <img
                  src="/images/iphone15.png"
                  alt="Mobile"
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
                    top: "4.8%",
                    left: "2.2%",
                    width: "94.6%",
                    height: "92.4%",
                    borderRadius: "72px",
                    overflow: "hidden",
                    zIndex: 1,
                    background: "rgba(0,0,0,0.25)",
                  }}
                >
                  <img
                    src="/images/ProductionScreenshots/InsightsFinal.png"
                    alt="Insights"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                      filter: "brightness(0.92) contrast(1.08) saturate(0.95)",
                    }}
                  />
                </div>
              </div>
            </Reveal>

            <Reveal>
              <div
                style={{ padding: "0 4px", maxWidth: 640, margin: "0 auto" }}
              >
                <div
                  style={{ ...softCard, padding: "clamp(18px, 3.5vw, 28px)" }}
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
                    <Bullet
                      title="Automatic Context"
                      desc="Location, weather, and time pulled from every photo—no manual entry required."
                    />
                    <Bullet
                      title="The Details That Matter"
                      desc="Log your lure, color, and technique. Build a record of what actually worked."
                    />
                    <Bullet
                      title="Patterns Over Time"
                      desc="See which conditions, baits, and spots produce—across seasons, not just single trips."
                    />
                    <Bullet
                      title="Know Your Strengths"
                      desc="Your catch history, organized and visualized. See which baits you've got dialed in, which lakes produce for you, and where you might want to spend more time."
                    />
                  </ul>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ================= YOUR JOURNEY ================= */}
      <section style={{ padding: sectionPad, borderTop: sectionTopBorder }}>
        <div className="container" style={container(1100)}>
          <Reveal>
            <div
              style={{ textAlign: "center", position: "relative", zIndex: 1 }}
            >
              <div
                className="water-text"
                style={{ ...eyebrow, color: "rgba(74,144,226,0.95)" }}
              >
                Your Journey
              </div>
              <h2 style={h2Style}>Grow With Every Trip.</h2>
              <p style={{ ...leadStyle, maxWidth: 980 }}>
                See how far you've come. Track the techniques you're developing,
                celebrate real milestones, and watch your skills sharpen—season
                after season.
              </p>
            </div>
          </Reveal>

          <div
            style={{
              ...grid2,
              marginTop: "clamp(34px, 6vw, 54px)",
              paddingBottom: "clamp(48px, 7vw, 72px)",
            }}
          >
            <Reveal delay={200}>
              <div
                style={{
                  position: "relative",
                  maxWidth: 420,
                  margin: "0 auto",
                }}
              >
                <img
                  src="/images/iphone15.png"
                  alt="Mobile"
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
                    top: "4.8%",
                    left: "2.2%",
                    width: "94.6%",
                    height: "92.4%",
                    borderRadius: "72px",
                    overflow: "hidden",
                    zIndex: 1,
                    background: "rgba(0,0,0,0.25)",
                  }}
                >
                  <img
                    src="/images/ProductionScreenshots/Journey.png"
                    alt="Journey"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                      filter: "brightness(0.92) contrast(1.08) saturate(0.95)",
                    }}
                  />
                </div>
              </div>
            </Reveal>

            <Reveal>
              <div
                style={{ padding: "0 4px", maxWidth: 640, margin: "0 auto" }}
              >
                <div
                  style={{ ...softCard, padding: "clamp(18px, 3.5vw, 28px)" }}
                >
                  <div
                    style={{
                      ...eyebrow,
                      marginBottom: 12,
                      color: "rgba(255,255,255,0.68)",
                    }}
                  >
                    Your Progress, Visualized
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
                      title="Skill Development"
                      desc="See which techniques you're sharpening and where there's room to grow."
                    />
                    <Bullet
                      title="Milestones That Matter"
                      desc="Achievements tied to real moments—your first double-digit bass, back-to-back catches, joining the 100 club."
                    />
                    <Bullet
                      title="Seasonal Reflection"
                      desc="Look back on each season—what worked, what clicked, and how you've improved."
                    />
                    <Bullet
                      title="Growth You Can See"
                      desc="Watch your progress unfold over time, not just in numbers—but in skill and confidence."
                    />
                  </ul>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ================= DATA CLARITY ================= */}
      <section style={{ padding: sectionPad, borderTop: sectionTopBorder }}>
        <div className="container" style={container(1100)}>
          <Reveal>
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
            <h2 style={h2Style}>AI-Enhanced. Angler-Driven.</h2>
            <p style={leadStyle}>
              We process the same data other apps dump on your screen—but we
              interpret it. Live conditions, seasonal bass behavior, and proven
              strategy come together into a clear, actionable plan. Use our
              suggestions, or bring your confidence baits and let the engine
              build around what you already trust.
            </p>
          </Reveal>
        </div>

        <div
          style={{
            ...grid2,
            marginTop: "clamp(34px, 6vw, 54px)",
            paddingBottom: "clamp(48px, 7vw, 72px)",
          }}
        >
          <Reveal delay={200}>
            <div
              style={{ position: "relative", maxWidth: 420, margin: "0 auto" }}
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
                  top: "5%",
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
                  src="/video/bass-clarity-loading3.mov"
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
          </Reveal>

          <Reveal>
            <div style={{ padding: "0 4px", maxWidth: 640, margin: "0 auto" }}>
              <div style={{ ...softCard, padding: "clamp(18px, 3.5vw, 28px)" }}>
                <div
                  style={{
                    ...eyebrow,
                    marginBottom: 12,
                    color: "rgba(255,255,255,0.68)",
                  }}
                >
                  Strategy, Built Around You
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
                      title: "Grounded in Real Strategy",
                      desc: "Lures, colors, and targets based on how bass actually behave—not generic lists.",
                    },
                    {
                      title: "Your Conditions, Interpreted",
                      desc: "Season, region, weather, and water—processed into a plan, not a dashboard.",
                    },
                    {
                      title: "Use What You Trust",
                      desc: "Bring your confidence baits. The AI builds strategy around what you want to throw.",
                    },
                    {
                      title: "Show, Don't Tell",
                      desc: "No charts to decode. No data to interpret yourself. Just clear direction for your day.",
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
          </Reveal>
        </div>
      </section>

      {/* ================= WEATHER CLARITY ================= */}
      <section style={{ padding: sectionPad, borderTop: sectionTopBorder }}>
        <div className="container" style={container(1100)}>
          <Reveal>
            <div
              style={{ textAlign: "center", position: "relative", zIndex: 1 }}
            >
              <div
                className="water-text"
                style={{ ...eyebrow, color: "rgba(74,144,226,0.95)" }}
              >
                Weather Clarity
              </div>
              <h2 style={h2Style}>Your Weather, In Context.</h2>
              <p style={{ ...leadStyle, maxWidth: 980 }}>
                We don't just show you the weather—we tell you what it means
                for your day on the water.
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
                  <CloudIcon size={20} /> Sky + Precipitation
                </span>
              </div>
            </div>
          </Reveal>

          <div
            style={{
              ...grid2,
              marginTop: "clamp(34px, 6vw, 54px)",
              paddingBottom: "clamp(48px, 7vw, 72px)",
            }}
          >
            <Reveal delay={200}>
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
                    alt="Weather cards"
                    style={{
                      width: "102%",
                      height: "100%",
                      objectFit: "contain",
                      filter: "brightness(0.92) contrast(1.08) saturate(0.95)",
                    }}
                  />
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
            </Reveal>

            <Reveal>
              <div
                style={{ padding: "0 4px", maxWidth: 640, margin: "0 auto" }}
              >
                <div
                  style={{ ...softCard, padding: "clamp(18px, 3.5vw, 28px)" }}
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
                        title: "Tap for Insight",
                        desc: "Every weather card opens into a deeper explanation of what that metric means for bass.",
                      },
                      {
                        title: "Context, Not Just Numbers",
                        desc: "68°F means something different in March than it does in July. We account for that.",
                      },
                      {
                        title: "Your Location, Your Conditions",
                        desc: "Localized data interpreted for where you're fishing—not generic regional forecasts.",
                      },
                      {
                        title: "Bass Mood, Explained",
                        desc: "See how active fish are likely to be and understand why—based on what's happening right now.",
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
            </Reveal>
          </div>
        </div>
      </section>

      {/* ================= FULL DAY PROGRESSION ================= */}
      <section style={{ padding: sectionPad, borderTop: sectionTopBorder }}>
        <div className="container" style={container(1100)}>
          <Reveal>
            <div
              style={{ textAlign: "center", position: "relative", zIndex: 1 }}
            >
              <div
                className="water-text"
                style={{ ...eyebrow, color: "rgba(74,144,226,0.95)" }}
              >
                Strategic Clarity
              </div>
              <h2 style={h2Style}>Your Plan, All Day Long.</h2>
              <p style={{ ...leadStyle, maxWidth: 980 }}>
                Clear, actionable guidance from daybreak to last cast. Every
                transition pulls directly from your plan—same lures, same
                targets, adapted for how the day unfolds.
              </p>
            </div>
          </Reveal>

          <div
            style={{
              ...grid2,
              marginTop: "clamp(34px, 6vw, 54px)",
              paddingBottom: "clamp(48px, 7vw, 72px)",
            }}
          >
            <Reveal delay={200}>
              <div
                style={{
                  position: "relative",
                  maxWidth: 420,
                  margin: "0 auto",
                }}
              >
                <img
                  src="/images/iphone15.png"
                  alt="Mobile"
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
                    alt="Progression"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                      filter: "brightness(0.92) contrast(1.08) saturate(0.95)",
                    }}
                  />
                </div>
              </div>
            </Reveal>

            <Reveal>
              <div
                style={{ padding: "0 4px", maxWidth: 640, margin: "0 auto" }}
              >
                <div
                  style={{ ...softCard, padding: "clamp(18px, 3.5vw, 28px)" }}
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
                    <Bullet
                      title="Plan-Connected Guidance"
                      desc="Morning, midday, and evening advice references your AI-generated strategy directly—nothing disconnected."
                    />
                    <Bullet
                      title="Transitions That Make Sense"
                      desc="Know when to shift spots, adjust retrieves, or change depth—tied to how the day progresses."
                    />
                    <Bullet
                      title="Specificity You Can Use"
                      desc="Not vague tips. Real direction for each phase of your day on the water."
                    />
                  </ul>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ================= TECHNIQUE CLARITY ================= */}
      <section style={{ padding: sectionPad, borderTop: sectionTopBorder }}>
        <div className="container" style={container(1100)}>
          <Reveal>
            <div
              style={{ textAlign: "center", position: "relative", zIndex: 1 }}
            >
              <div
                className="water-text"
                style={{ ...eyebrow, color: "rgba(74,144,226,0.95)" }}
              >
                Technique / Presentation Clarity
              </div>
              <h1 style={h1Style}>Two Techniques. Dialed In.</h1>
              <p style={{ ...leadStyle, maxWidth: 980 }}>
                Two techniques that make sense for your conditions—a primary to
                anchor your approach and a pivot for when bass are positioned
                differently. Fish with confidence knowing what to lean on,
                especially when the bite gets tough.
              </p>
            </div>
          </Reveal>

          <div
            style={{
              ...grid2,
              marginTop: "clamp(34px, 6vw, 54px)",
              paddingBottom: "clamp(48px, 7vw, 72px)",
            }}
          >
            <Reveal delay={200}>
              <div
                style={{
                  position: "relative",
                  maxWidth: 420,
                  margin: "0 auto",
                }}
              >
                <img
                  src="/images/iphone15.png"
                  alt="Mobile"
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
                    alt="Pattern"
                    style={{
                      width: "100%",
                      height: "101%",
                      objectFit: "contain",
                      filter: "brightness(0.92) contrast(1.08) saturate(0.95)",
                    }}
                  />
                </div>
              </div>
            </Reveal>

            <Reveal>
              <div
                style={{ padding: "0 4px", maxWidth: 640, margin: "0 auto" }}
              >
                <div
                  style={{ ...softCard, padding: "clamp(18px, 3.5vw, 28px)" }}
                >
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
                      title="Primary - Your Foundation"
                      desc="The technique that makes the most sense for your conditions. Start here."
                    />
                    <Bullet
                      title="Pivot - Your Backup With Purpose"
                      desc="For when bass are positioned differently. Not random—strategically paired with your primary."
                    />
                    <Bullet
                      title="Confidence When It Counts"
                      desc="Know exactly what to lean on when the bite slows down. No second-guessing."
                    />
                    <Bullet
                      title="The Why, Explained"
                      desc="We tell you why each technique was chosen and how they work together."
                    />
                    <Bullet
                      title="Details That Matter"
                      desc="Trailer, color, and gear suggestions—all matched to your water and light conditions."
                    />
                  </ul>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ================= STRATEGIC CLARITY ================= */}
      <section style={{ padding: sectionPad, borderTop: sectionTopBorder }}>
        <div className="container" style={container(1100)}>
          <Reveal>
            <div
              style={{ textAlign: "center", position: "relative", zIndex: 1 }}
            >
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
          </Reveal>

          <div
            style={{
              ...grid2,
              marginTop: "clamp(34px, 6vw, 54px)",
              paddingBottom: "clamp(48px, 7vw, 72px)",
            }}
          >
            <Reveal delay={200}>
              <div
                style={{
                  position: "relative",
                  maxWidth: 420,
                  margin: "0 auto",
                }}
              >
                <img
                  src="/images/iphone15.png"
                  alt="Mobile"
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
                    alt="Strategy"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                      filter: "brightness(0.92) contrast(1.08) saturate(0.95)",
                    }}
                  />
                </div>
              </div>
            </Reveal>

            <Reveal>
              <div
                style={{ padding: "0 4px", maxWidth: 640, margin: "0 auto" }}
              >
                <div
                  style={{ ...softCard, padding: "clamp(18px, 3.5vw, 28px)" }}
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
                    <Bullet
                      title="The Logic"
                      desc="Why this presentation fits your conditions on the water"
                    />
                    <Bullet
                      title="The Gameplan"
                      desc="Commit to the plan. A brief overview of your lure and plan for execution"
                    />
                    <Bullet
                      title="Targets"
                      desc="Targets are narrowed to the places most likely to hold fish based on today's conditions."
                    />
                    <Bullet
                      title="Retrieve Guidance"
                      desc="130+ lure-specific retrieves, adjusted for your targets and conditions."
                    />
                  </ul>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ================= BUILT FOR ANGLERS ================= */}
      <section
        style={{ padding: sectionPad, background: "rgba(74, 144, 226, 0.02)" }}
      >
        <div className="container" style={container(900)}>
          <Reveal>
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
              translating today’s conditions into clear, intentional strategy.
            </p>
          </Reveal>
          <Reveal delay={200}>
            <div
              style={{
                position: "relative",
                maxWidth: 420,
                margin: "0 auto",
              }}
            >
              <img
                src="/images/iphone15.png"
                alt="Mobile"
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
                  left: "2.2%",
                  width: "99.6%",
                  height: "93%",
                  borderRadius: "42px",
                  overflow: "hidden",
                  zIndex: 1,
                  background: "rgba(0,0,0,0.25)",
                }}
              >
                <img
                  src="/images/ProductionScreenshots/chatterbait.png"
                  alt="Insights"
                  style={{
                    width: "98%",
                    height: "100%",
                    objectFit: "contain",
                    filter: "brightness(0.92) contrast(1.08) saturate(0.95)",
                    borderRadius: "80px",
                  }}
                />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ================= COMPARISON & PRICING ================= */}
      <section style={{ padding: sectionPad, borderTop: sectionTopBorder }}>
        <div className="container" style={container(1000)}>
          <Reveal>
            <div style={{ textAlign: "center" }}>
              <h2 className="water-text" style={h2Style}>
                Start with Clarity
              </h2>
              <p style={{ ...leadStyle, marginBottom: 60 }}>
                Start building your history today.
              </p>
            </div>
          </Reveal>

          <Reveal delay={200}>
            <ComparisonTable />
          </Reveal>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
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
                Modern tools. Timeless approach.
              </p>
            </div>
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
                  to="/members"
                  className="muted"
                  style={{ textDecoration: "none" }}
                >
                  Map Dashboard
                </Link>
                <Link
                  to="/subscribe"
                  className="muted"
                  style={{ textDecoration: "none" }}
                >
                  Pricing
                </Link>
              </div>
            </div>
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
                <Link
                  to="/faq"
                  className="muted"
                  style={{ textDecoration: "none" }}
                >
                  FAQ
                </Link>
                <Link
                  to="/support"
                  className="muted"
                  style={{ textDecoration: "none" }}
                >
                  Support
                </Link>
                <a
                  href="mailto:bassclarity@gmail.com"
                  className="muted"
                  style={{ textDecoration: "none" }}
                >
                  Contact Us
                </a>
              </div>
            </div>
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
                Legal
              </h4>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
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
              </div>
            </div>
          </div>
          <div
            style={{
              marginTop: 52,
              paddingTop: 22,
              borderTop: "1px solid rgba(255,255,255,0.06)",
              textAlign: "center",
              fontSize: "0.9rem",
              opacity: 0.5,
            }}
          >
            © {new Date().getFullYear()} Bass Clarity. All rights reserved.
          </div>
        </div>
      </footer>

      {/* ================= CSS ================= */}
      <style>{`
        /* Animations */
        .reveal-block {
          opacity: 0;
          transform: translateY(30px);
          transition: opacity 0.8s ease-out, transform 0.8s ease-out;
        }
        .reveal-block.visible {
          opacity: 1;
          transform: translateY(0);
        }

        @keyframes waterFlow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .water-text {
          color: #fff;
          background: linear-gradient(-45deg, #60a5fa, #eff6ff, #ffffff, #38bdf8, #93c5fd);
          background-size: 150% 150%;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          color: transparent;
          animation: waterFlow 6s ease infinite;
        }

        /* Pricing Grid */
        .pricing-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 32px;
          align-items: center;
        }
        
        .pricing-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 24px;
          padding: 40px;
          position: relative;
          text-align: left;
        }

        .pricing-card.pro {
          background: rgba(74, 144, 226, 0.08);
          border: 1px solid rgba(74, 144, 226, 0.3);
          box-shadow: 0 20px 60px rgba(74, 144, 226, 0.15);
          transform: scale(1.05);
          z-index: 2;
        }

        .popular-badge {
          position: absolute;
          top: -12px;
          left: 50%;
          transform: translateX(-50%);
          background: #4A90E2;
          color: white;
          font-size: 0.75rem;
          font-weight: 800;
          padding: 4px 12px;
          border-radius: 100px;
          letter-spacing: 0.05em;
        }

        .plan-name { font-size: 1.5rem; font-weight: 700; margin-bottom: 8px; color: #fff; }
        .price { font-size: 2rem; font-weight: 800; color: #fff; margin-left: 8px; }
        .price .period { font-size: 1rem; color: rgba(255,255,255,0.5); font-weight: 500; }
        .plan-desc { color: rgba(255,255,255,0.6); margin-bottom: 30px; font-size: 0.95rem; }
        
        .features-list { display: flex; flex-direction: column; gap: 16px; margin-bottom: 40px; }
        .feature-row { display: flex; align-items: center; gap: 12px; font-size: 0.95rem; color: rgba(255,255,255,0.9); }
        .feature-row svg { color: #4A90E2; flex-shrink: 0; }
        .feature-row.dim { opacity: 0.4; }
        .feature-row.dim svg { color: rgba(255,255,255,0.3); }
        .feature-row.highlight { color: #4A90E2; }

        .plan-btn {
          display: block; width: 100%; padding: 16px; border-radius: 14px;
          text-align: center; font-weight: 700; text-decoration: none; transition: transform 0.2s;
        }
        .plan-btn.secondary {
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff;
        }
        .plan-btn.secondary:hover { background: rgba(255,255,255,0.1); }
        
        .plan-btn.primary {
          background: linear-gradient(135deg, #4A90E2 0%, #357ABD 100%);
          color: #fff;
          box-shadow: 0 10px 20px rgba(74, 144, 226, 0.3);
        }
        .plan-btn.primary:hover { transform: translateY(-2px); }

        .muted { color: rgba(255,255,255,0.5); transition: color 0.2s; }
        .muted:hover { color: #fff; }

        @media (max-width: 768px) {
          .pricing-card.pro { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
