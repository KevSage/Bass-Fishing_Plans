import React from "react";
import { Link } from "react-router-dom";

export function Landing() {
  return (
    <div style={{ background: "#000" }}>
      {/* HERO - Clean, confident, simple */}
      <section
        style={{
          minHeight: "88vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Subtle gradient background */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 30% 20%, rgba(74, 144, 226, 0.06) 0%, transparent 70%)",
          }}
        />

        {/* Bass image - subtle, professional */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "url(/images/hero_bass.jpeg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: 0.28,
            filter: "brightness(0.65) saturate(1.2)",
          }}
        />

        {/* Dark overlay for text clarity */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.8) 100%)",
          }}
        />

        <div
          className="container"
          style={{
            position: "relative",
            zIndex: 1,
            textAlign: "center",
            maxWidth: 980,
            padding: "0 24px",
          }}
        >
          <h1
            style={{
              fontSize: "clamp(2.5rem, 7vw, 4.75rem)",
              fontWeight: 700,
              lineHeight: 1.08,
              marginBottom: 32,
              letterSpacing: "-0.03em",
            }}
          >
            Everyone has the data.
            <br />
            We actually do something with it.
          </h1>
          <p
            style={{
              fontSize: "clamp(1.2rem, 2.8vw, 1.45rem)",
              lineHeight: 1.5,
              opacity: 0.9,
              marginBottom: 16,
              maxWidth: 860,
              margin: "0 auto 16px",
              fontWeight: 400,
            }}
          >
            Bass Fishing Plans runs a synthesis engine that calculates a
            lake-optimized strategy from current conditions, seasonal bass
            behavior, and regional spawn timing.
          </p>
          <p
            style={{
              fontSize: "clamp(1.1rem, 2.5vw, 1.3rem)",
              lineHeight: 1.5,
              opacity: 0.75,
              marginBottom: 48,
              fontWeight: 400,
            }}
          >
            Not a pattern library. Not generic AI. Not yesterday's catches.
            <br />A calculation engine for your water today.
          </p>
          <Link
            className="btn primary"
            to="/preview"
            style={{
              fontSize: "1.15rem",
              padding: "20px 56px",
              background: "#4A90E2",
              borderRadius: 14,
              fontWeight: 600,
              display: "inline-block",
            }}
          >
            Try one free
          </Link>
          <p
            style={{
              marginTop: 20,
              fontSize: "1rem",
              opacity: 0.55,
              fontWeight: 400,
            }}
          >
            No signup required
          </p>
        </div>
      </section>

      {/* HOW THE ENGINE WORKS - Show the depth */}
      <section
        style={{
          padding: "140px 24px",
          background: "linear-gradient(180deg, #000 0%, #0a0a0a 100%)",
        }}
      >
        <div className="container" style={{ maxWidth: 1000 }}>
          <h2
            style={{
              fontSize: "clamp(2rem, 5vw, 3rem)",
              fontWeight: 700,
              textAlign: "center",
              marginBottom: 80,
              letterSpacing: "-0.02em",
            }}
          >
            How the engine works
          </h2>

          {/* Steps */}
          <div style={{ display: "grid", gap: 60 }}>
            {/* Step 1 */}
            <div
              style={{
                padding: "40px",
                background: "rgba(255,255,255,0.02)",
                borderRadius: 16,
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div
                style={{
                  fontSize: "0.9rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "#4A90E2",
                  marginBottom: 16,
                  fontWeight: 600,
                }}
              >
                Step 1: Data Collection
              </div>
              <div
                style={{ fontSize: "1.15rem", lineHeight: 1.8, opacity: 0.85 }}
              >
                <p style={{ marginBottom: 12 }}>
                  <strong>Lake GPS coordinates</strong> → Weather API
                </p>
                <p style={{ marginBottom: 12 }}>
                  <strong>Current date/time</strong> → Phase calculation
                </p>
                <p>
                  <strong>Latitude</strong> → Regional spawn timing (FL bass ≠
                  MI bass)
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div
              style={{
                padding: "40px",
                background: "rgba(255,255,255,0.02)",
                borderRadius: 16,
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div
                style={{
                  fontSize: "0.9rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "#4A90E2",
                  marginBottom: 16,
                  fontWeight: 600,
                }}
              >
                Step 2: Engine Processing
              </div>
              <div
                style={{ fontSize: "1.15rem", lineHeight: 1.8, opacity: 0.85 }}
              >
                <p style={{ marginBottom: 12 }}>
                  ✓ Presentation family selection (based on phase + conditions)
                </p>
                <p style={{ marginBottom: 12 }}>
                  ✓ Lure matching (from canonical buckets)
                </p>
                <p style={{ marginBottom: 12 }}>
                  ✓ Retrieve pattern scoring (130+ options, weather-aware)
                </p>
                <p style={{ marginBottom: 12 }}>
                  ✓ Target evaluation (50+ definitions, matched to positioning)
                </p>
                <p style={{ marginBottom: 12 }}>
                  ✓ Soft plastic selection (contextual to conditions)
                </p>
                <p style={{ marginBottom: 12 }}>
                  ✓ Color validation (clarity + light penetration)
                </p>
                <p>✓ Gear matching (rod/reel/line, deterministic)</p>
              </div>
            </div>

            {/* Step 3 */}
            <div
              style={{
                padding: "40px",
                background: "rgba(255,255,255,0.02)",
                borderRadius: 16,
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div
                style={{
                  fontSize: "0.9rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "#4A90E2",
                  marginBottom: 16,
                  fontWeight: 600,
                }}
              >
                Step 3: Dual Approach Generation
              </div>
              <div
                style={{ fontSize: "1.15rem", lineHeight: 1.8, opacity: 0.85 }}
              >
                <p style={{ marginBottom: 12 }}>
                  <strong>Primary approach</strong> → Highest-scoring complete
                  strategy
                </p>
                <p>
                  <strong>Counter approach</strong> → Contrasting presentation
                  for different behavior
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div
              style={{
                padding: "40px",
                background: "rgba(255,255,255,0.02)",
                borderRadius: 16,
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div
                style={{
                  fontSize: "0.9rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "#4A90E2",
                  marginBottom: 16,
                  fontWeight: 600,
                }}
              >
                Step 4: Output Synthesis
              </div>
              <div
                style={{ fontSize: "1.15rem", lineHeight: 1.8, opacity: 0.85 }}
              >
                <p style={{ marginBottom: 12 }}>
                  <strong>Execution guide</strong> → What to throw, where to
                  fish it, how to work it
                </p>
                <p style={{ marginBottom: 12 }}>
                  <strong>Reasoning</strong> → Why it works, how it connects to
                  bass behavior
                </p>
                <p>
                  <strong>Day progression</strong> → What to watch for as
                  conditions shift
                </p>
              </div>
            </div>
          </div>

          <p
            style={{
              marginTop: 80,
              textAlign: "center",
              fontSize: "1.35rem",
              fontWeight: 600,
              opacity: 0.95,
            }}
          >
            This isn't a pattern library. It's a calculation engine.
            <br />
            <span
              style={{ fontSize: "1.15rem", fontWeight: 400, opacity: 0.7 }}
            >
              Every plan is custom-built for your lake, your conditions, today.
            </span>
          </p>
        </div>
      </section>

      {/* THE REALITY - Empathy section */}
      <section
        style={{
          padding: "140px 24px",
          background: "#000",
        }}
      >
        <div className="container" style={{ maxWidth: 960 }}>
          <h2
            style={{
              fontSize: "clamp(2rem, 5vw, 3.25rem)",
              fontWeight: 700,
              lineHeight: 1.25,
              marginBottom: 48,
              letterSpacing: "-0.03em",
            }}
          >
            You already know how to fish.
          </h2>
          <div
            style={{
              fontSize: "1.3rem",
              lineHeight: 1.7,
              opacity: 0.88,
              maxWidth: 840,
            }}
          >
            <p style={{ marginBottom: 32 }}>
              You've checked the weather. You've watched the forecast shift.
              You've rigged rods, tied backups, and thought through how the day
              should set up.
            </p>
            <p style={{ marginBottom: 32 }}>That's not the hard part.</p>
            <p
              style={{
                fontSize: "1.45rem",
                fontWeight: 600,
                opacity: 1,
                paddingLeft: 32,
                borderLeft: "4px solid #4A90E2",
                lineHeight: 1.6,
              }}
            >
              The hard part is showing up to a big body of water with too many
              reasonable options—and deciding which ones deserve your time right
              now.
            </p>
          </div>
        </div>
      </section>

      {/* WHAT CHANGES - The unspoken benefits */}
      <section
        style={{
          padding: "140px 24px",
          background: "linear-gradient(180deg, #000 0%, #0a0a0a 100%)",
        }}
      >
        <div className="container" style={{ maxWidth: 1000 }}>
          <h2
            style={{
              fontSize: "clamp(2rem, 5vw, 3rem)",
              fontWeight: 700,
              textAlign: "center",
              marginBottom: 24,
              letterSpacing: "-0.02em",
            }}
          >
            What changes when you have a plan
          </h2>
          <p
            style={{
              textAlign: "center",
              fontSize: "1.2rem",
              opacity: 0.7,
              marginBottom: 80,
              maxWidth: 700,
              margin: "0 auto 80px",
            }}
          >
            Beyond catching more bass, here's what's different:
          </p>

          <div style={{ display: "grid", gap: 48 }}>
            {[
              {
                title: "You get an anchor",
                desc: "Bring 2 rods or 10—doesn't matter. You know at least two are dialed in for your water today. The plan gives you confidence, not restriction.",
              },
              {
                title: "You stop guessing at colors",
                desc: "The plan tells you which colors work—and why. Not because 'it worked last week.' Because conditions say so.",
              },
              {
                title: "You commit instead of wandering",
                desc: "You stop fishing every spot halfway. The plan tells you where bass SHOULD be positioned—so you give it a real shot.",
              },
              {
                title: "You get lure-specific retrieve guidance",
                desc: "Not 'work it slow.' Not generic advice. Actual cadence from 130+ retrieve patterns: 'Drag 2-3 feet, pause 3-5 seconds on secondary points—most bites come when the bait settles into the contour.' Matched to the lure, the conditions, and the presentation.",
              },
              {
                title: "You target the right depth",
                desc: "No more fishing every column hoping to connect. The plan gives you the range that makes sense today.",
              },
              {
                title: "You adapt with intent",
                desc: "Weather shifts? Bite slows down? Day progression guidance keeps you deliberate, not desperate.",
              },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  padding: "32px 0",
                  borderBottom:
                    i < 5 ? "1px solid rgba(255,255,255,0.08)" : "none",
                }}
              >
                <h3
                  style={{
                    fontSize: "1.4rem",
                    fontWeight: 600,
                    marginBottom: 12,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    // fontSize: "1.1rem",
                    color: "#4A90E2",
                  }}
                >
                  {item.title}
                </h3>
                <p
                  style={{
                    fontSize: "1.15rem",
                    lineHeight: 1.7,
                    opacity: 0.8,
                  }}
                >
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          <p
            style={{
              marginTop: 80,
              textAlign: "center",
              fontSize: "1.3rem",
              fontStyle: "italic",
              opacity: 0.75,
            }}
          >
            Not easier fishing. Clearer fishing.
          </p>
        </div>
      </section>

      {/* EVERYTHING YOU NEED - The value */}
      <section
        style={{
          padding: "140px 24px",
          background: "#000",
        }}
      >
        <div className="container" style={{ maxWidth: 960 }}>
          <h2
            style={{
              fontSize: "clamp(2rem, 5vw, 3rem)",
              fontWeight: 700,
              textAlign: "center",
              marginBottom: 80,
              letterSpacing: "-0.02em",
            }}
          >
            Everything you need. Nothing you don't.
          </h2>

          <div
            style={{
              background: "rgba(74, 144, 226, 0.03)",
              border: "1px solid rgba(74, 144, 226, 0.15)",
              borderRadius: 16,
              padding: "48px",
            }}
          >
            <p
              style={{
                fontSize: "1.2rem",
                lineHeight: 1.8,
                opacity: 0.85,
                marginBottom: 32,
              }}
            >
              Behind every plan, the engine processes:
            </p>
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                fontSize: "1.1rem",
                lineHeight: 2,
                opacity: 0.8,
              }}
            >
              <li>→ 130+ lure-specific retrieve patterns</li>
              <li>→ 50+ target definitions</li>
              <li>→ 7 presentation families</li>
              <li>→ Regional spawn timing logic</li>
              <li>→ Weather-aware tip scoring</li>
              <li>→ Contextual soft plastic selection</li>
              <li>→ Thousands of possible permutations</li>
            </ul>

            <div
              style={{
                marginTop: 48,
                paddingTop: 32,
                borderTop: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <p
                style={{
                  fontSize: "1.2rem",
                  lineHeight: 1.8,
                  opacity: 0.85,
                  marginBottom: 24,
                }}
              >
                What you get:
              </p>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  fontSize: "1.1rem",
                  lineHeight: 2,
                  opacity: 0.8,
                }}
              >
                <li>✓ Primary approach</li>
                <li>✓ Counter approach</li>
                <li>✓ Complete execution guidance</li>
                <li>✓ Explanation of why it works</li>
                <li>✓ How it connects to bass behavior</li>
              </ul>
            </div>

            <p
              style={{
                marginTop: 48,
                fontSize: "1.25rem",
                fontWeight: 600,
                textAlign: "center",
                opacity: 0.95,
              }}
            >
              We calculate everything. You fish one clear plan.
            </p>
          </div>
        </div>
      </section>

      {/* PRICING - Confident, not pushy */}
      <section
        style={{
          padding: "140px 24px",
          background: "linear-gradient(180deg, #000 0%, #0a0a0a 100%)",
        }}
      >
        <div
          className="container"
          style={{
            maxWidth: 700,
            textAlign: "center",
          }}
        >
          <h2
            style={{
              fontSize: "clamp(3rem, 6vw, 4.5rem)",
              fontWeight: 700,
              marginBottom: 24,
              letterSpacing: "-0.03em",
            }}
          >
            $15/month
          </h2>
          <p
            style={{
              fontSize: "1.25rem",
              lineHeight: 1.7,
              opacity: 0.85,
              marginBottom: 16,
            }}
          >
            Unlimited plans. No limits on lakes, no caps on generations.
          </p>
          <p
            style={{
              fontSize: "1.1rem",
              opacity: 0.6,
              marginBottom: 48,
              lineHeight: 1.6,
            }}
          >
            Less than one fishing trip.
            <br />
            Less than one bag of Senkos.
            <br />
            Less than one wasted Saturday guessing.
          </p>
          <Link
            className="btn primary"
            to="/subscribe"
            style={{
              fontSize: "1.15rem",
              padding: "20px 56px",
              background: "#4A90E2",
              borderRadius: 14,
              fontWeight: 600,
            }}
          >
            Get started
          </Link>
        </div>
      </section>

      {/* FINAL CTA - Simple, powerful */}
      <section
        style={{
          padding: "120px 24px 140px",
          background: "#000",
        }}
      >
        <div
          className="container"
          style={{
            maxWidth: 880,
            textAlign: "center",
          }}
        >
          <h2
            style={{
              fontSize: "clamp(2.25rem, 5.5vw, 3.75rem)",
              fontWeight: 700,
              lineHeight: 1.2,
              marginBottom: 48,
              letterSpacing: "-0.03em",
            }}
          >
            Have clarity before you ever
            <br />
            launch the boat.
          </h2>
          <Link
            className="btn primary"
            to="/preview"
            style={{
              fontSize: "1.15rem",
              padding: "20px 56px",
              background: "#4A90E2",
              borderRadius: 14,
              fontWeight: 600,
            }}
          >
            Try one free
          </Link>
          <p
            style={{
              marginTop: 20,
              fontSize: "1rem",
              opacity: 0.5,
            }}
          >
            No credit card required
          </p>
        </div>
      </section>
    </div>
  );
}
