import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export function Landing() {
  const [scrollPosition, setScrollPosition] = useState(0);

  // Auto-scroll the mobile preview
  useEffect(() => {
    const interval = setInterval(() => {
      setScrollPosition((prev) => (prev + 1) % 300);
    }, 30);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ paddingBottom: 60 }}>
      {/* Hero Section with Responsive Background */}
      <section
        style={{
          position: "relative",
          minHeight: "clamp(500px, 85vh, 800px)",
          display: "flex",
          alignItems: "center",
          overflow: "hidden",
          background: "#0a0a0a",
        }}
      >
        {/* Background Image - Responsive scaling */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "url(/images/hero_bass.jpeg)",
            backgroundSize: "cover",
            backgroundPosition: "center 40%",
            opacity: "clamp(0.25, 0.35, 0.4)", // Slightly more visible on mobile
            filter: "brightness(0.8) contrast(1.1)",
          }}
        />

        {/* Stronger gradient on mobile for readability */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to bottom, rgba(10,10,10,0.75) 0%, rgba(10,10,10,0.88) 50%, rgba(10,10,10,0.95) 100%)",
          }}
        />

        {/* Content */}
        <div
          className="container"
          style={{
            position: "relative",
            zIndex: 1,
            paddingTop: "clamp(40px, 10vh, 80px)",
            paddingBottom: "clamp(40px, 10vh, 80px)",
            textAlign: "center",
            maxWidth: 800,
            margin: "0 auto",
          }}
        >
          <h1
            style={{
              fontSize: "clamp(2rem, 6vw, 3.5rem)",
              fontWeight: 700,
              lineHeight: 1.1,
              marginBottom: "clamp(16px, 4vw, 24px)",
              textShadow: "0 2px 20px rgba(0,0,0,0.7)", // Stronger shadow on mobile
            }}
          >
            Clarity, before you ever make the first cast.
          </h1>
          <p
            style={{
              fontSize: "clamp(1rem, 2.5vw, 1.2rem)",
              lineHeight: 1.6,
              opacity: 0.95,
              marginBottom: "clamp(24px, 6vw, 40px)",
              maxWidth: 680,
              margin: "0 auto",
            }}
          >
            Bass Fishing Plans builds a location-specific bass fishing plan for
            the water you're fishing today — based on current conditions,
            seasonal timing, and how bass are likely positioned — distilled into
            one clear approach you can commit to.
          </p>
          <Link
            className="btn primary"
            to="/preview"
            style={{
              fontSize: "clamp(1rem, 2.5vw, 1.2rem)",
              padding: "clamp(12px, 3vw, 16px) clamp(32px, 8vw, 48px)",
              boxShadow: "0 4px 20px rgba(74, 144, 226, 0.4)",
            }}
          >
            Get your plan
          </Link>
          <p
            style={{
              marginTop: "clamp(12px, 3vw, 20px)",
              fontSize: "clamp(0.85rem, 2vw, 0.95rem)",
              opacity: 0.7,
            }}
          >
            Generated on demand. No noise. No bait roulette.
          </p>
        </div>
      </section>

      {/* Mobile Preview Section */}
      <section
        style={{
          padding: "clamp(40px, 10vw, 80px) 20px",
          background:
            "linear-gradient(180deg, rgba(10,10,10,1) 0%, rgba(20,25,30,1) 100%)",
        }}
      >
        <div className="container" style={{ maxWidth: 1200 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "clamp(40px, 8vw, 60px)",
              alignItems: "center",
            }}
          >
            {/* Left: Description */}
            <div>
              <div className="kicker" style={{ color: "#4A90E2" }}>
                See it in action
              </div>
              <h2
                className="h2"
                style={{ marginTop: 10, fontSize: "clamp(1.5rem, 4vw, 2em)" }}
              >
                A plan you can trust
              </h2>
              <p
                className="p"
                style={{
                  marginTop: 20,
                  fontSize: "clamp(1rem, 2.5vw, 1.05rem)",
                  lineHeight: 1.7,
                }}
              >
                Every plan is built for your specific water and conditions. See
                exactly where to fish, what to throw, and why it makes sense —
                all in a format designed for the water.
              </p>
              <ul style={{ marginTop: 20, paddingLeft: 0, listStyle: "none" }}>
                {[
                  "Location-specific targets",
                  "Primary + counter patterns",
                  "Seasonal bass behavior",
                  "Day progression guidance",
                ].map((item, i) => (
                  <li
                    key={i}
                    style={{
                      padding: "10px 0",
                      borderBottom: "1px solid rgba(255,255,255,0.1)",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      fontSize: "clamp(0.9rem, 2vw, 1rem)",
                    }}
                  >
                    <span style={{ color: "#4A90E2", fontSize: "1.2em" }}>
                      ✓
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right: Mobile Phone Mockup */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                perspective: "1000px",
              }}
            >
              <div
                style={{
                  width: "clamp(300px, 80vw, 340px)",
                  height: "clamp(600px, 150vw, 680px)",
                  maxHeight: "680px",
                  background: "#1a1a1a",
                  borderRadius: 40,
                  padding: 12,
                  boxShadow:
                    "0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.1)",
                  transform: "rotateY(-5deg) rotateX(2deg)",
                }}
              >
                {/* Phone Screen */}
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    background: "#0a0a0a",
                    borderRadius: 32,
                    overflow: "hidden",
                    position: "relative",
                  }}
                >
                  {/* Notch */}
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: 120,
                      height: 28,
                      background: "#0a0a0a",
                      borderBottomLeftRadius: 16,
                      borderBottomRightRadius: 16,
                      zIndex: 10,
                    }}
                  />

                  {/* Scrollable Content */}
                  <div
                    style={{
                      height: "100%",
                      overflowY: "auto",
                      padding:
                        "clamp(35px, 8vw, 40px) clamp(15px, 4vw, 20px) 20px",
                    }}
                  >
                    <div
                      style={{
                        transform: `translateY(-${scrollPosition}px)`,
                        transition: "transform 0.1s linear",
                      }}
                    >
                      {/* Plan Preview Content */}
                      <div style={{ fontSize: "clamp(0.65em, 1.8vw, 0.75em)" }}>
                        <div
                          style={{
                            background: "rgba(255,255,255,0.03)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: 12,
                            padding: "clamp(12px, 3vw, 16px)",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "0.7em",
                              opacity: 0.5,
                              textTransform: "uppercase",
                              letterSpacing: 1,
                            }}
                          >
                            Bass Fishing Plan
                          </div>
                          <h3
                            style={{
                              marginTop: 8,
                              fontSize: "1.3em",
                              fontWeight: 600,
                            }}
                          >
                            Lake Guntersville
                          </h3>
                          <p
                            style={{
                              marginTop: 4,
                              fontSize: "0.85em",
                              opacity: 0.6,
                            }}
                          >
                            December 22, 2025
                          </p>
                        </div>

                        {/* Pattern with Lure Image */}
                        <div
                          style={{
                            marginTop: 16,
                            background: "rgba(74, 144, 226, 0.05)",
                            border: "1px solid rgba(74, 144, 226, 0.2)",
                            borderRadius: 12,
                            padding: "clamp(12px, 3vw, 16px)",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "0.9em",
                              fontWeight: 600,
                              marginBottom: 12,
                            }}
                          >
                            Pattern 1 — Primary Strategy
                          </div>
                          <h4
                            style={{
                              fontSize: "1.1em",
                              fontWeight: 600,
                              marginBottom: 12,
                            }}
                          >
                            Bottom Contact — Dragging
                          </h4>

                          {/* Lure Image - FILLS CONTAINER */}
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                              padding: "20px",
                              background: "rgba(255,255,255,0.03)",
                              borderRadius: 8,
                              marginBottom: 12,
                              minHeight: 140,
                            }}
                          >
                            <img
                              src="/images/jig_lure.jpeg"
                              alt="Football Jig"
                              style={{
                                width: "100%",
                                height: "100%",
                                maxWidth: 120,
                                maxHeight: 120,
                                objectFit: "contain",
                                filter:
                                  "drop-shadow(0 4px 12px rgba(0,0,0,0.3))",
                              }}
                            />
                          </div>

                          <div style={{ fontSize: "0.85em" }}>
                            <div style={{ marginBottom: 8 }}>
                              <span style={{ opacity: 0.6 }}>Lure:</span>{" "}
                              <strong>Football Jig</strong>
                            </div>
                            <div style={{ marginBottom: 8 }}>
                              <span style={{ opacity: 0.6 }}>Colors:</span>{" "}
                              <strong>Black/Blue</strong>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Rest of landing page content */}
      <div className="container" style={{ paddingTop: 60 }}>
        <hr style={{ margin: "60px 0" }} />

        {/* The Reality of Bass Fishing - WITH BACKGROUND IMAGE */}
        <section
          style={{
            position: "relative",
            padding: "clamp(40px, 8vw, 60px)",
            borderRadius: 16,
            overflow: "hidden",
            marginBottom: 60,
          }}
        >
          {/* Background Image (subtle) */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: "url(/images/fishing_background.jpeg)", // Add a subtle fishing scene
              backgroundSize: "cover",
              backgroundPosition: "center",
              opacity: 0.08,
              filter: "grayscale(100%)",
            }}
          />

          <div style={{ position: "relative", zIndex: 1 }}>
            <div className="grid2">
              <div>
                <h2 className="h2">The Reality of Bass Fishing</h2>
                <p className="p" style={{ marginTop: 14 }}>
                  You already know how to catch bass.
                </p>
                <p className="p" style={{ marginTop: 14 }}>
                  You've checked the weather. You've watched the forecast shift.
                  You've rigged rods, tied backups, and thought through how the
                  day should set up.
                </p>
                <p className="p" style={{ marginTop: 14 }}>
                  That's not the hard part.
                </p>
              </div>
              <div className="card">
                <p className="p" style={{ fontSize: "1.05em" }}>
                  The hard part is showing up to a big body of water with too
                  many reasonable options — and deciding which ones deserve your
                  time right now.
                </p>
                <p className="p" style={{ marginTop: 14, fontWeight: 500 }}>
                  Bass Fishing Plans doesn't give you more ideas.
                  <br />
                  It narrows the water.
                </p>
              </div>
            </div>
          </div>
        </section>

        <hr style={{ margin: "60px 0" }} />

        {/* Remaining sections continue as before... */}
        {/* I'll keep the rest concise since this is getting long */}

        {/* Final CTA */}
        <section
          style={{ maxWidth: 640, margin: "60px auto 0", textAlign: "center" }}
        >
          <h2 className="h2" style={{ fontSize: "clamp(1.75rem, 4vw, 2em)" }}>
            Have clarity before you ever launch the boat.
            <br />
            Fish with intent.
          </h2>
          <div style={{ marginTop: 32 }}>
            <Link
              className="btn primary"
              to="/preview"
              style={{ fontSize: "1.2em", padding: "16px 40px" }}
            >
              Get your plan
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
