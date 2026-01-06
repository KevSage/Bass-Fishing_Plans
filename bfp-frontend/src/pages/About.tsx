import React from "react";
import { Link } from "react-router-dom";

export function About() {
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
            About Bass Clarity
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
            Built for anglers who want strategic clarity, not data overload.
          </p>
        </div>
      </section>

      {/* The Problem */}
      <section style={{ padding: "80px 24px" }}>
        <div className="container" style={{ maxWidth: 900 }}>
          <h2
            style={{
              fontSize: "clamp(2rem, 5vw, 2.75rem)",
              fontWeight: 700,
              marginBottom: 32,
            }}
          >
            The Problem We Solve
          </h2>
          <p
            style={{
              fontSize: "1.2rem",
              lineHeight: 1.8,
              opacity: 0.85,
              marginBottom: 28,
            }}
          >
            Most fishing apps dump data and leave you guessing. Weather charts,
            solunar tables, moon phases, barometric pressure graphs—all the
            information, none of the answers.
          </p>
          <p
            style={{
              fontSize: "1.2rem",
              lineHeight: 1.8,
              opacity: 0.85,
              marginBottom: 28,
            }}
          >
            You're staring at numbers you don't understand, trying to translate
            data into action. Should you throw a crankbait or a jig? What color?
            What retrieve? Where do you even start?
          </p>
          <p
            style={{
              fontSize: "1.2rem",
              lineHeight: 1.8,
              opacity: 0.85,
            }}
          >
            <strong style={{ color: "#4A90E2" }}>
              Bass Clarity cuts through the noise.
            </strong>{" "}
            We don't dump data—we deliver clarity. Clear strategy. Clear
            execution. Clear reasoning.
          </p>
        </div>
      </section>

      {/* Our Philosophy */}
      <section
        style={{
          padding: "100px 24px",
        }}
      >
        <div className="container" style={{ maxWidth: 900 }}>
          <h2
            style={{
              fontSize: "clamp(2rem, 5vw, 2.75rem)",
              fontWeight: 700,
              marginBottom: 60,
            }}
          >
            Our Philosophy
          </h2>

          <div style={{ display: "grid", gap: 48 }}>
            {/* Clarity Over Complexity */}
            <div>
              <h3
                style={{
                  fontSize: "1.75rem",
                  fontWeight: 600,
                  marginBottom: 16,
                  color: "#4A90E2",
                }}
              >
                Clarity Over Complexity
              </h3>
              <p style={{ fontSize: "1.1rem", lineHeight: 1.8, opacity: 0.85 }}>
                The best strategy isn't the one with the most data—it's the one
                you can execute with confidence. We give you exactly what you
                need to know: what to throw, how to fish it, why it works. No
                clutter, no confusion.
              </p>
            </div>

            {/* Everything Connects */}
            <div>
              <h3
                style={{
                  fontSize: "1.75rem",
                  fontWeight: 600,
                  marginBottom: 16,
                  color: "#4A90E2",
                }}
              >
                Everything Connects
              </h3>
              <p style={{ fontSize: "1.1rem", lineHeight: 1.8, opacity: 0.85 }}>
                Your Pattern 2 complements Pattern 1. Your gear matches your
                technique. Your lures match conditions. Bass Clarity plans are
                coherent from start to finish—not scattered tips pulled from
                different sources that contradict each other.
              </p>
            </div>

            {/* Honest Intelligence */}
            <div>
              <h3
                style={{
                  fontSize: "1.75rem",
                  fontWeight: 600,
                  marginBottom: 16,
                  color: "#4A90E2",
                }}
              >
                Honest Intelligence
              </h3>
              <p
                style={{
                  fontSize: "1.1rem",
                  lineHeight: 1.8,
                  opacity: 0.85,
                  marginBottom: 20,
                }}
              >
                We don't guess your lake's exact depth when we don't have that
                data. We don't make up temperature readings. We don't claim to
                know things we can't verify.
              </p>
              <p style={{ fontSize: "1.1rem", lineHeight: 1.8, opacity: 0.85 }}>
                What we DO know: seasonal patterns for your region, how weather
                affects bass behavior, which presentations work in which
                conditions, and how to match lures to targets. That's where our
                clarity comes from—honesty about what we know and don't know.
              </p>
            </div>

            {/* Strategic Discipline */}
            <div>
              <h3
                style={{
                  fontSize: "1.75rem",
                  fontWeight: 600,
                  marginBottom: 16,
                  color: "#4A90E2",
                }}
              >
                Strategic Discipline
              </h3>
              <p style={{ fontSize: "1.1rem", lineHeight: 1.8, opacity: 0.85 }}>
                Bass Clarity isn't for anglers who want 20 random tips. It's for
                serious anglers who want systematic clarity. Tournament anglers.
                Weekend warriors who treat fishing like a craft. People who want
                to fish smarter, not just harder.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How We're Different */}
      <section style={{ padding: "100px 24px" }}>
        <div className="container" style={{ maxWidth: 900 }}>
          <h2
            style={{
              fontSize: "clamp(2rem, 5vw, 2.75rem)",
              fontWeight: 700,
              marginBottom: 60,
            }}
          >
            How We're Different
          </h2>

          <div style={{ display: "grid", gap: 40 }}>
            <div
              style={{
                padding: "32px",
                background: "rgba(255,255,255,0.02)",
                borderRadius: 16,
                border: "1px solid rgba(255,255,255,0.08)",
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
                We Analyze, Not Just Display
              </h3>
              <p
                style={{
                  fontSize: "1.05rem",
                  lineHeight: 1.7,
                  opacity: 0.85,
                  margin: 0,
                }}
              >
                Other apps show you weather data. We tell you how it affects the
                water below and what it means for your strategy.
              </p>
            </div>

            <div
              style={{
                padding: "32px",
                background: "rgba(255,255,255,0.02)",
                borderRadius: 16,
                border: "1px solid rgba(255,255,255,0.08)",
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
                Regional Seasonal Logic
              </h3>
              <p
                style={{
                  fontSize: "1.05rem",
                  lineHeight: 1.7,
                  opacity: 0.85,
                  margin: 0,
                }}
              >
                Late-fall in Texas is different from late-fall in Michigan. Our
                plans account for regional variation—not one-size-fits-all
                calendar dates.
              </p>
            </div>

            <div
              style={{
                padding: "32px",
                background: "rgba(255,255,255,0.02)",
                borderRadius: 16,
                border: "1px solid rgba(255,255,255,0.08)",
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
                Lure-Specific Retrieves
              </h3>
              <p
                style={{
                  fontSize: "1.05rem",
                  lineHeight: 1.7,
                  opacity: 0.85,
                  margin: 0,
                }}
              >
                We don't just say "throw a crankbait." We tell you how to work
                it based on bass activity and then match those retrieves to
                specific targets like secondary points and channel swings.
              </p>
            </div>

            <div
              style={{
                padding: "32px",
                background: "rgba(255,255,255,0.02)",
                borderRadius: 16,
                border: "1px solid rgba(255,255,255,0.08)",
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
                Two Complementary Approaches
              </h3>
              <p
                style={{
                  fontSize: "1.05rem",
                  lineHeight: 1.7,
                  opacity: 0.85,
                  margin: 0,
                }}
              >
                Not scattered tips. Two focused patterns that work together.
                When Pattern 1 slows, Pattern 2 picks up. Strategic coherence
                under pressure.
              </p>
            </div>

            <div
              style={{
                padding: "32px",
                background: "rgba(255,255,255,0.02)",
                borderRadius: 16,
                border: "1px solid rgba(255,255,255,0.08)",
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
                1000+ Lakes
              </h3>
              <p
                style={{
                  fontSize: "1.05rem",
                  lineHeight: 1.7,
                  opacity: 0.85,
                  margin: 0,
                }}
              >
                If it's not in our database, select it from the map. Consistent
                clarity everywhere—your home lake, tournament lake, or that spot
                you've never fished.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Who It's For */}
      <section
        style={{
          padding: "100px 24px",
        }}
      >
        <div className="container" style={{ maxWidth: 900 }}>
          <h2
            style={{
              fontSize: "clamp(2rem, 5vw, 2.75rem)",
              fontWeight: 700,
              marginBottom: 32,
            }}
          >
            Who Bass Clarity Is For
          </h2>
          <p
            style={{
              fontSize: "1.2rem",
              lineHeight: 1.8,
              opacity: 0.85,
              marginBottom: 40,
            }}
          >
            Bass Clarity is for anglers who:
          </p>
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              fontSize: "1.15rem",
              lineHeight: 2.2,
              opacity: 0.85,
            }}
          >
            <li>→ Want strategic clarity, not data dumps</li>
            <li>→ Fish tournaments or treat fishing like a craft</li>
            <li>→ Value systematic approaches over random tips</li>
            <li>→ Want to fish smarter, not just harder</li>
            <li>→ Need confidence under pressure</li>
            <li>→ Appreciate honesty about what works and why</li>
          </ul>
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
            Experience Clarity
          </h2>
          <p
            style={{
              fontSize: "1.2rem",
              opacity: 0.7,
              marginBottom: 40,
              lineHeight: 1.6,
            }}
          >
            See what strategic clarity looks like. Generate your first plan
            free.
          </p>
          <Link
            to="/subscribe"
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
            5-Day Free Trial
          </Link>
          <p style={{ opacity: 0.5, fontSize: "1rem" }}>Get Clarity</p>
        </div>
      </section>
    </div>
  );
}
