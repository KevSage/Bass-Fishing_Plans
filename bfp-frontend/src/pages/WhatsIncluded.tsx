import React from "react";
import { Link } from "react-router-dom";

export function WhatsIncluded() {
  return (
    <div style={{ background: "#000", color: "#fff", minHeight: "100vh" }}>
      {/* Hero Section */}
      <section
        style={{
          padding: "120px 24px 80px",
          background: "linear-gradient(180deg, #000 0%, #0a0a0a 100%)",
        }}
      >
        <div className="container" style={{ maxWidth: 900, textAlign: "center" }}>
          <h1
            style={{
              fontSize: "clamp(2.5rem, 6vw, 4rem)",
              fontWeight: 700,
              marginBottom: 24,
              letterSpacing: "-0.03em",
            }}
          >
            What's Included
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
            Every plan delivers complete strategic clarity. Here's exactly what you get.
          </p>
        </div>
      </section>

      {/* Core Features */}
      <section style={{ padding: "80px 24px" }}>
        <div className="container" style={{ maxWidth: 1100 }}>
          <h2
            style={{
              fontSize: "clamp(2rem, 5vw, 2.75rem)",
              fontWeight: 700,
              marginBottom: 60,
              textAlign: "center",
            }}
          >
            Every Plan Includes
          </h2>

          <div style={{ display: "grid", gap: 48 }}>
            {/* Weather Analysis */}
            <div
              style={{
                padding: "40px",
                background: "rgba(255,255,255,0.02)",
                borderRadius: 16,
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <h3
                style={{
                  fontSize: "1.75rem",
                  fontWeight: 600,
                  marginBottom: 16,
                  color: "#4A90E2",
                }}
              >
                Weather Analysis
              </h3>
              <p
                style={{
                  fontSize: "1.1rem",
                  lineHeight: 1.7,
                  opacity: 0.85,
                  marginBottom: 20,
                }}
              >
                Not just data displayed—analysis of how weather affects the water below.
              </p>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  fontSize: "1.05rem",
                  lineHeight: 2,
                  opacity: 0.8,
                }}
              >
                <li>→ Temperature, wind, sky conditions</li>
                <li>→ How conditions affect bass behavior</li>
                <li>→ What it means for your strategy</li>
              </ul>
            </div>

            {/* Two Complementary Patterns (Members Only) */}
            <div
              style={{
                padding: "40px",
                background:
                  "linear-gradient(135deg, rgba(74, 144, 226, 0.08) 0%, rgba(74, 144, 226, 0.03) 100%)",
                borderRadius: 16,
                border: "1px solid rgba(74, 144, 226, 0.2)",
              }}
            >
              <div
                style={{
                  display: "inline-block",
                  padding: "4px 12px",
                  background: "#4A90E2",
                  borderRadius: 6,
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  marginBottom: 16,
                }}
              >
                Members Only
              </div>
              <h3
                style={{
                  fontSize: "1.75rem",
                  fontWeight: 600,
                  marginBottom: 16,
                  color: "#4A90E2",
                }}
              >
                Two Complementary Approaches
              </h3>
              <p
                style={{
                  fontSize: "1.1rem",
                  lineHeight: 1.7,
                  opacity: 0.85,
                  marginBottom: 20,
                }}
              >
                Not scattered tips. Two focused strategies that work together. Everything connects—your second approach complements your first, your gear matches your technique.
              </p>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  fontSize: "1.05rem",
                  lineHeight: 2,
                  opacity: 0.8,
                }}
              >
                <li>→ Pattern 1: Primary approach</li>
                <li>→ Pattern 2: Complementary pivot</li>
                <li>→ Strategic coherence from start to finish</li>
              </ul>
            </div>

            {/* Lure-Specific Intelligence */}
            <div
              style={{
                padding: "40px",
                background: "rgba(255,255,255,0.02)",
                borderRadius: 16,
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <h3
                style={{
                  fontSize: "1.75rem",
                  fontWeight: 600,
                  marginBottom: 16,
                  color: "#4A90E2",
                }}
              >
                Lure-Specific Intelligence
              </h3>
              <p
                style={{
                  fontSize: "1.1rem",
                  lineHeight: 1.7,
                  opacity: 0.85,
                  marginBottom: 20,
                }}
              >
                Multiple ways to work each bait, matched to conditions and bass activity.
              </p>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  fontSize: "1.05rem",
                  lineHeight: 2,
                  opacity: 0.8,
                }}
              >
                <li>→ Specific lures matched to conditions</li>
                <li>→ Trailer recommendations (forage/profile)</li>
                <li>→ Multiple retrieves per lure (bass temperament)</li>
                <li>→ Retrieves matched to specific targets</li>
              </ul>
            </div>

            {/* Matched Gear (Members Only) */}
            <div
              style={{
                padding: "40px",
                background:
                  "linear-gradient(135deg, rgba(74, 144, 226, 0.08) 0%, rgba(74, 144, 226, 0.03) 100%)",
                borderRadius: 16,
                border: "1px solid rgba(74, 144, 226, 0.2)",
              }}
            >
              <div
                style={{
                  display: "inline-block",
                  padding: "4px 12px",
                  background: "#4A90E2",
                  borderRadius: 6,
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  marginBottom: 16,
                }}
              >
                Members Only
              </div>
              <h3
                style={{
                  fontSize: "1.75rem",
                  fontWeight: 600,
                  marginBottom: 16,
                  color: "#4A90E2",
                }}
              >
                Matched Gear Specifications
              </h3>
              <p
                style={{
                  fontSize: "1.1rem",
                  lineHeight: 1.7,
                  opacity: 0.85,
                  marginBottom: 20,
                }}
              >
                Rod, reel, and line matched to how you're fishing it. Bottom contact gets heavy gear. Finesse gets lighter touch. Deliberate, not random.
              </p>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  fontSize: "1.05rem",
                  lineHeight: 2,
                  opacity: 0.8,
                }}
              >
                <li>→ Rod power and action</li>
                <li>→ Reel gear ratio</li>
                <li>→ Line type and weight</li>
              </ul>
            </div>

            {/* Targets + Structure */}
            <div
              style={{
                padding: "40px",
                background: "rgba(255,255,255,0.02)",
                borderRadius: 16,
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <h3
                style={{
                  fontSize: "1.75rem",
                  fontWeight: 600,
                  marginBottom: 16,
                  color: "#4A90E2",
                }}
              >
                Targets + Structure
              </h3>
              <p
                style={{
                  fontSize: "1.1rem",
                  lineHeight: 1.7,
                  opacity: 0.85,
                  marginBottom: 20,
                }}
              >
                Narrow your water to specific structure types. Understand how to work each target.
              </p>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  fontSize: "1.05rem",
                  lineHeight: 2,
                  opacity: 0.8,
                }}
              >
                <li>→ Secondary points, channel swings, shallow flats</li>
                <li>→ Definitions for each target type</li>
                <li>→ Where to focus your time</li>
              </ul>
            </div>

            {/* Day Progression (Members Only) */}
            <div
              style={{
                padding: "40px",
                background:
                  "linear-gradient(135deg, rgba(74, 144, 226, 0.08) 0%, rgba(74, 144, 226, 0.03) 100%)",
                borderRadius: 16,
                border: "1px solid rgba(74, 144, 226, 0.2)",
              }}
            >
              <div
                style={{
                  display: "inline-block",
                  padding: "4px 12px",
                  background: "#4A90E2",
                  borderRadius: 6,
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  marginBottom: 16,
                }}
              >
                Members Only
              </div>
              <h3
                style={{
                  fontSize: "1.75rem",
                  fontWeight: 600,
                  marginBottom: 16,
                  color: "#4A90E2",
                }}
              >
                Day Progression
              </h3>
              <p
                style={{
                  fontSize: "1.1rem",
                  lineHeight: 1.7,
                  opacity: 0.85,
                  marginBottom: 20,
                }}
              >
                Where to start, where to go next. Adjust your approach as conditions change throughout the day.
              </p>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  fontSize: "1.05rem",
                  lineHeight: 2,
                  opacity: 0.8,
                }}
              >
                <li>→ Morning strategy</li>
                <li>→ Mid-day adjustments</li>
                <li>→ Evening approach</li>
              </ul>
            </div>

            {/* Regional Seasonal Logic */}
            <div
              style={{
                padding: "40px",
                background: "rgba(255,255,255,0.02)",
                borderRadius: 16,
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <h3
                style={{
                  fontSize: "1.75rem",
                  fontWeight: 600,
                  marginBottom: 16,
                  color: "#4A90E2",
                }}
              >
                Regional Seasonal Logic
              </h3>
              <p
                style={{
                  fontSize: "1.1rem",
                  lineHeight: 1.7,
                  opacity: 0.85,
                  marginBottom: 20,
                }}
              >
                What works NOW for your phase and region. Late-fall Texas gets different tactics than late-fall Michigan. Our seasonal data accounts for regional variation—not one-size-fits-all calendar dates.
              </p>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  fontSize: "1.05rem",
                  lineHeight: 2,
                  opacity: 0.8,
                }}
              >
                <li>→ Pre-spawn, spawn, post-spawn, summer, fall, winter</li>
                <li>→ Regional timing differences</li>
                <li>→ Transition period tactics</li>
              </ul>
            </div>

            {/* Downloadable PDFs */}
            <div
              style={{
                padding: "40px",
                background: "rgba(255,255,255,0.02)",
                borderRadius: 16,
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <h3
                style={{
                  fontSize: "1.75rem",
                  fontWeight: 600,
                  marginBottom: 16,
                  color: "#4A90E2",
                }}
              >
                Downloadable PDFs
              </h3>
              <p
                style={{
                  fontSize: "1.1rem",
                  lineHeight: 1.7,
                  opacity: 0.85,
                  marginBottom: 20,
                }}
              >
                Mobile-optimized and printable. Readable in direct sunlight.
              </p>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  fontSize: "1.05rem",
                  lineHeight: 2,
                  opacity: 0.8,
                }}
              >
                <li>→ Full plan PDF</li>
                <li>→ Quick reference card</li>
                <li>→ Take it on the water</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Preview vs Member Comparison */}
      <section
        style={{
          padding: "100px 24px",
          background: "linear-gradient(180deg, #0a0a0a 0%, #000 100%)",
        }}
      >
        <div className="container" style={{ maxWidth: 1100 }}>
          <h2
            style={{
              fontSize: "clamp(2rem, 5vw, 2.75rem)",
              fontWeight: 700,
              marginBottom: 24,
              textAlign: "center",
            }}
          >
            Preview vs Members
          </h2>
          <p
            style={{
              fontSize: "1.2rem",
              textAlign: "center",
              opacity: 0.7,
              marginBottom: 80,
            }}
          >
            Try it free, upgrade for complete clarity
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: 48,
            }}
          >
            {/* Preview */}
            <div
              style={{
                padding: "40px",
                background: "rgba(255,255,255,0.02)",
                borderRadius: 20,
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <h3
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 600,
                  marginBottom: 24,
                  color: "rgba(255,255,255,0.9)",
                }}
              >
                Free Preview
              </h3>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  fontSize: "1.05rem",
                  lineHeight: 2.2,
                  opacity: 0.8,
                }}
              >
                <li>✓ Weather analysis</li>
                <li>✓ ONE pattern</li>
                <li>✓ Lure + colors</li>
                <li>✓ Where to fish</li>
                <li>✓ How to work it</li>
                <li>✓ Downloadable PDF</li>
              </ul>
            </div>

            {/* Members */}
            <div
              style={{
                padding: "40px",
                background:
                  "linear-gradient(135deg, rgba(74, 144, 226, 0.12) 0%, rgba(74, 144, 226, 0.04) 100%)",
                borderRadius: 20,
                border: "1px solid rgba(74, 144, 226, 0.25)",
              }}
            >
              <h3
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 600,
                  marginBottom: 24,
                  color: "#4A90E2",
                }}
              >
                $15/month Members
              </h3>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  fontSize: "1.05rem",
                  lineHeight: 2.2,
                  opacity: 0.9,
                }}
              >
                <li>✓ Everything in Preview</li>
                <li>✓ TWO complementary patterns</li>
                <li>✓ Matched gear specs (rod/reel/line)</li>
                <li>✓ Pattern summaries</li>
                <li>✓ Strategy tips</li>
                <li>✓ Day progression</li>
                <li>✓ Unlimited plans</li>
              </ul>
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
            Get Clarity for Your Next Trip
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
            }}
          >
            Try Free Preview
          </Link>
          <p style={{ opacity: 0.5, fontSize: "1rem" }}>
            No credit card required
          </p>
        </div>
      </section>
    </div>
  );
}
