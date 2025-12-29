import React from "react";
import { Link } from "react-router-dom";

export function HowToUse() {
  return (
    <div
      style={{
        background: "linear-gradient(to bottom, #0a0a0a, #1a1a2e)",
        color: "#fff",
        minHeight: "100vh",
      }}
    >
      {/* Hero */}
      <section
        style={{
          padding: "120px 24px 80px",
        }}
      >
        <div
          className="container"
          style={{ maxWidth: 900, textAlign: "center" }}
        >
          <h1
            style={{
              fontSize: "clamp(2.5rem, 6vw, 4rem)",
              fontWeight: 700,
              marginBottom: 24,
              letterSpacing: "-0.03em",
            }}
          >
            How to Use Bass Clarity
          </h1>
          <p
            style={{
              fontSize: "clamp(1.15rem, 2.5vw, 1.35rem)",
              opacity: 0.8,
              lineHeight: 1.6,
              maxWidth: 720,
              margin: "0 auto",
            }}
          >
            From selection to execution. Here's how to get the most out of your
            Bass Clarity plans.
          </p>
        </div>
      </section>

      {/* Step-by-Step Process */}
      <section style={{ padding: "80px 24px" }}>
        <div className="container" style={{ maxWidth: 900 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 64 }}>
            {/* Step 1 */}
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 20,
                  marginBottom: 24,
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    background:
                      "linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.5rem",
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  1
                </div>
                <h2
                  style={{
                    fontSize: "2rem",
                    fontWeight: 700,
                    margin: 0,
                  }}
                >
                  Select Your Water
                </h2>
              </div>
              <div style={{ marginLeft: 76 }}>
                <p
                  style={{
                    fontSize: "1.15rem",
                    lineHeight: 1.7,
                    opacity: 0.85,
                    marginBottom: 20,
                  }}
                >
                  Choose your lake from our database or select any water body
                  from the map.
                </p>
                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    fontSize: "1.05rem",
                    lineHeight: 2,
                    opacity: 0.75,
                  }}
                >
                  <li>→ Search 1000+ lakes by name</li>
                  <li>→ Click any water on the interactive map</li>
                  <li>→ Works for your home lake or new tournament water</li>
                </ul>
              </div>
            </div>

            {/* Step 2 */}
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 20,
                  marginBottom: 24,
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    background:
                      "linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.5rem",
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  2
                </div>
                <h2
                  style={{
                    fontSize: "2rem",
                    fontWeight: 700,
                    margin: 0,
                  }}
                >
                  Generate Your Plan
                </h2>
              </div>
              <div style={{ marginLeft: 76 }}>
                <p
                  style={{
                    fontSize: "1.15rem",
                    lineHeight: 1.7,
                    opacity: 0.85,
                    marginBottom: 20,
                  }}
                >
                  Bass Clarity analyzes current weather, seasonal phase, and
                  regional patterns to build your strategic approach.
                </p>
                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    fontSize: "1.05rem",
                    lineHeight: 2,
                    opacity: 0.75,
                  }}
                >
                  <li>→ Weather analysis (temp, wind, sky)</li>
                  <li>→ Seasonal phase for your region</li>
                  <li>→ Complete strategy in 30 seconds</li>
                </ul>
              </div>
            </div>

            {/* Step 3 */}
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 20,
                  marginBottom: 24,
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    background:
                      "linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.5rem",
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  3
                </div>
                <h2
                  style={{
                    fontSize: "2rem",
                    fontWeight: 700,
                    margin: 0,
                  }}
                >
                  Review Your Strategy
                </h2>
              </div>
              <div style={{ marginLeft: 76 }}>
                <p
                  style={{
                    fontSize: "1.15rem",
                    lineHeight: 1.7,
                    opacity: 0.85,
                    marginBottom: 20,
                  }}
                >
                  Your plan shows you exactly what to throw, how to fish it, and
                  why it works.
                </p>
                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    fontSize: "1.05rem",
                    lineHeight: 2,
                    opacity: 0.75,
                  }}
                >
                  <li>→ Preview: ONE focused pattern</li>
                  <li>→ Members: TWO complementary approaches</li>
                  <li>→ Lure, colors, retrieves, targets</li>
                  <li>→ Clear reasoning for every decision</li>
                </ul>
              </div>
            </div>

            {/* Step 4 */}
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 20,
                  marginBottom: 24,
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    background:
                      "linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.5rem",
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  4
                </div>
                <h2
                  style={{
                    fontSize: "2rem",
                    fontWeight: 700,
                    margin: 0,
                  }}
                >
                  Download + Take It On the Water
                </h2>
              </div>
              <div style={{ marginLeft: 76 }}>
                <p
                  style={{
                    fontSize: "1.15rem",
                    lineHeight: 1.7,
                    opacity: 0.85,
                    marginBottom: 20,
                  }}
                >
                  Download your plan as a PDF. Readable on your phone in direct
                  sunlight or print it out.
                </p>
                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    fontSize: "1.05rem",
                    lineHeight: 2,
                    opacity: 0.75,
                  }}
                >
                  <li>→ Full plan PDF</li>
                  <li>→ Quick reference card</li>
                  <li>→ Mobile-optimized format</li>
                </ul>
              </div>
            </div>

            {/* Step 5 */}
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 20,
                  marginBottom: 24,
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    background:
                      "linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.5rem",
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  5
                </div>
                <h2
                  style={{
                    fontSize: "2rem",
                    fontWeight: 700,
                    margin: 0,
                  }}
                >
                  Execute With Confidence
                </h2>
              </div>
              <div style={{ marginLeft: 76 }}>
                <p
                  style={{
                    fontSize: "1.15rem",
                    lineHeight: 1.7,
                    opacity: 0.85,
                    marginBottom: 20,
                  }}
                >
                  Fish your plan. Start with Pattern 1. If conditions change or
                  bites slow, adjust.
                </p>
                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    fontSize: "1.05rem",
                    lineHeight: 2,
                    opacity: 0.75,
                  }}
                >
                  <li>→ Follow the retrieves matched to each target</li>
                  <li>→ Use day progression to adjust</li>
                  <li>→ Pattern 2 if Pattern 1 slows (members)</li>
                </ul>
              </div>
            </div>

            {/* Step 6 */}
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 20,
                  marginBottom: 24,
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    background:
                      "linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.5rem",
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  6
                </div>
                <h2
                  style={{
                    fontSize: "2rem",
                    fontWeight: 700,
                    margin: 0,
                  }}
                >
                  Adapt If Needed
                </h2>
              </div>
              <div style={{ marginLeft: 76 }}>
                <p
                  style={{
                    fontSize: "1.15rem",
                    lineHeight: 1.7,
                    opacity: 0.85,
                    marginBottom: 20,
                  }}
                >
                  Conditions change? Generate a new plan right from the water.
                </p>
                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    fontSize: "1.05rem",
                    lineHeight: 2,
                    opacity: 0.75,
                  }}
                >
                  <li>→ 3 hours in, no bites? Check if conditions shifted</li>
                  <li>→ Wind picked up? Clouds rolled in?</li>
                  <li>→ Generate fresh strategy on the spot (members)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pro Tips */}
      <section
        style={{
          padding: "100px 24px",
        }}
      >
        <div className="container" style={{ maxWidth: 900 }}>
          <h2
            style={{
              fontSize: "2.5rem",
              fontWeight: 700,
              marginBottom: 60,
              textAlign: "center",
            }}
          >
            Pro Tips
          </h2>

          <div style={{ display: "grid", gap: 32 }}>
            <div
              style={{
                padding: "32px",
                background: "rgba(74, 144, 226, 0.08)",
                borderRadius: 16,
                borderLeft: "4px solid #4A90E2",
              }}
            >
              <h3
                style={{
                  fontSize: "1.3rem",
                  fontWeight: 600,
                  marginBottom: 12,
                  color: "#4A90E2",
                }}
              >
                Generate Before You Go
              </h3>
              <p
                style={{
                  fontSize: "1.05rem",
                  lineHeight: 1.7,
                  opacity: 0.85,
                  margin: 0,
                }}
              >
                Create your plan the night before. Know what to bring, what to
                rig, what to expect. Start your day with clarity.
              </p>
            </div>

            <div
              style={{
                padding: "32px",
                background: "rgba(74, 144, 226, 0.08)",
                borderRadius: 16,
                borderLeft: "4px solid #4A90E2",
              }}
            >
              <h3
                style={{
                  fontSize: "1.3rem",
                  fontWeight: 600,
                  marginBottom: 12,
                  color: "#4A90E2",
                }}
              >
                Download for Offline Access
              </h3>
              <p
                style={{
                  fontSize: "1.05rem",
                  lineHeight: 1.7,
                  opacity: 0.85,
                  margin: 0,
                }}
              >
                Save the PDF to your phone. No cell service? No problem. Your
                plan works offline.
              </p>
            </div>

            <div
              style={{
                padding: "32px",
                background: "rgba(74, 144, 226, 0.08)",
                borderRadius: 16,
                borderLeft: "4px solid #4A90E2",
              }}
            >
              <h3
                style={{
                  fontSize: "1.3rem",
                  fontWeight: 600,
                  marginBottom: 12,
                  color: "#4A90E2",
                }}
              >
                Trust the System
              </h3>
              <p
                style={{
                  fontSize: "1.05rem",
                  lineHeight: 1.7,
                  opacity: 0.85,
                  margin: 0,
                }}
              >
                Your plan is built on regional seasonal logic and current
                conditions. Give it time. Work the retrieves as described.
                Strategic discipline pays off.
              </p>
            </div>

            <div
              style={{
                padding: "32px",
                background: "rgba(74, 144, 226, 0.08)",
                borderRadius: 16,
                borderLeft: "4px solid #4A90E2",
              }}
            >
              <h3
                style={{
                  fontSize: "1.3rem",
                  fontWeight: 600,
                  marginBottom: 12,
                  color: "#4A90E2",
                }}
              >
                Use Pattern 2 as a Pivot (Members)
              </h3>
              <p
                style={{
                  fontSize: "1.05rem",
                  lineHeight: 1.7,
                  opacity: 0.85,
                  margin: 0,
                }}
              >
                Pattern 2 isn't a backup—it's a complementary approach. If
                Pattern 1 slows, switch. They work together by design.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "100px 24px" }}>
        <div
          className="container"
          style={{ maxWidth: 700, textAlign: "center" }}
        >
          <h2
            style={{
              fontSize: "clamp(2rem, 5vw, 3rem)",
              fontWeight: 700,
              marginBottom: 32,
            }}
          >
            Ready to Fish With Clarity?
          </h2>
          <Link
            to="/preview"
            className="btn primary"
            style={{
              fontSize: "1.2rem",
              padding: "22px 60px",
              background: "linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)",
              borderRadius: 16,
              fontWeight: 600,
              display: "inline-block",
              marginBottom: 16,
              boxShadow: "0 8px 24px rgba(74, 144, 226, 0.3)",
            }}
          >
            Generate Your First Plan
          </Link>
          <p style={{ opacity: 0.5, fontSize: "1rem" }}>
            No credit card required
          </p>
        </div>
      </section>
    </div>
  );
}
