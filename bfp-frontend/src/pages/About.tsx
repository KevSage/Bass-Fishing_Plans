import React from "react";
import { Link } from "react-router-dom";

export function About() {
  return (
    <div
      style={{
        background: "#0a0a0a",
        color: "#fff",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* HERO */}
      <section
        style={{
          padding: "120px 24px 80px",
          textAlign: "center",
          maxWidth: 860,
        }}
      >
        <h1
          style={{
            fontSize: "clamp(2.4rem, 5vw, 3.4rem)",
            fontWeight: 800,
            marginBottom: 24,
            letterSpacing: "-0.03em",
            background: "linear-gradient(to bottom, #ffffff, #9ca3af)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            lineHeight: 1.1,
          }}
        >
          Clarity Over Noise.
        </h1>

        <p
          style={{
            fontSize: "1.2rem",
            color: "rgba(255,255,255,0.65)",
            lineHeight: 1.6,
            maxWidth: 640,
            margin: "0 auto",
          }}
        >
          Bass Clarity is built to help anglers understand the moment — not
          overwhelm it.
        </p>
      </section>

      {/* CORE PROBLEM */}
      <section style={{ padding: "60px 24px", maxWidth: 860 }}>
        <div
          style={{
            borderLeft: "2px solid #3b82f6",
            paddingLeft: 32,
          }}
        >
          <h2
            style={{
              fontSize: "1.75rem",
              fontWeight: 700,
              marginBottom: 20,
              letterSpacing: "-0.01em",
            }}
          >
            The Problem Bass Clarity Exists to Solve
          </h2>

          <p
            style={{
              fontSize: "1.05rem",
              lineHeight: 1.8,
              color: "rgba(255,255,255,0.7)",
              marginBottom: 20,
            }}
          >
            Fishing decisions rarely fail because of a lack of information. They
            fail because too many signals compete for attention at the moment a
            decision needs to be made.
          </p>

          <p
            style={{
              fontSize: "1.05rem",
              lineHeight: 1.8,
              color: "rgba(255,255,255,0.7)",
            }}
          >
            Bass Clarity was designed to reduce that pressure — by organizing
            conditions, patterns, and tactics into a small set of clear,
            situational decisions.
          </p>
        </div>
      </section>

      {/* PHILOSOPHY */}
      <section
        style={{
          padding: "80px 24px",
          maxWidth: 980,
          width: "100%",
        }}
      >
        <h2
          style={{
            fontSize: "2rem",
            fontWeight: 700,
            marginBottom: 48,
            textAlign: "center",
            letterSpacing: "-0.02em",
          }}
        >
          The Philosophy Behind Bass Clarity
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 48,
          }}
        >
          <div>
            <h3
              style={{
                fontSize: "1.25rem",
                fontWeight: 600,
                marginBottom: 12,
              }}
            >
              Fishing Is a Pattern Skill
            </h3>
            <p
              style={{
                fontSize: "1rem",
                lineHeight: 1.7,
                color: "rgba(255,255,255,0.55)",
              }}
            >
              Bass behavior follows patterns shaped by season, weather, light,
              and pressure. Bass Clarity is designed to surface those patterns
              clearly and consistently.
            </p>
          </div>

          <div>
            <h3
              style={{
                fontSize: "1.25rem",
                fontWeight: 600,
                marginBottom: 12,
              }}
            >
              Education Beats Memorization
            </h3>
            <p
              style={{
                fontSize: "1rem",
                lineHeight: 1.7,
                color: "rgba(255,255,255,0.55)",
              }}
            >
              Rather than listing tactics, Bass Clarity explains why decisions
              fit the conditions — allowing understanding to build naturally
              over time.
            </p>
          </div>

          <div>
            <h3
              style={{
                fontSize: "1.25rem",
                fontWeight: 600,
                marginBottom: 12,
              }}
            >
              Technology Should Teach
            </h3>
            <p
              style={{
                fontSize: "1rem",
                lineHeight: 1.7,
                color: "rgba(255,255,255,0.55)",
              }}
            >
              Bass Clarity uses technology to interpret signals, not bypass
              learning. The goal is deeper understanding, not shortcuts.
            </p>
          </div>

          <div>
            <h3
              style={{
                fontSize: "1.25rem",
                fontWeight: 600,
                marginBottom: 12,
              }}
            >
              Restraint Is a Feature
            </h3>
            <p
              style={{
                fontSize: "1rem",
                lineHeight: 1.7,
                color: "rgba(255,255,255,0.55)",
              }}
            >
              Fewer decisions, clearly explained, lead to better execution. Bass
              Clarity intentionally limits output to preserve focus.
            </p>
          </div>
        </div>
      </section>

      {/* WHO IT’S FOR */}
      <section style={{ padding: "80px 24px", maxWidth: 860 }}>
        <h2
          style={{
            fontSize: "2rem",
            fontWeight: 700,
            marginBottom: 32,
            letterSpacing: "-0.02em",
            textAlign: "center",
          }}
        >
          Who Bass Clarity Is Built For
        </h2>

        <p
          style={{
            fontSize: "1.05rem",
            lineHeight: 1.8,
            color: "rgba(255,255,255,0.65)",
            textAlign: "center",
            maxWidth: 720,
            margin: "0 auto",
          }}
        >
          Bass Clarity is built for anglers who value understanding over
          shortcuts — whether fishing from the bank, a kayak, or a boat. It
          supports growth without requiring expensive electronics or constant
          guesswork.
        </p>
      </section>

      {/* CTA */}
      <section
        style={{
          padding: "0 24px 120px",
          textAlign: "center",
          maxWidth: 600,
        }}
      >
        <h2
          style={{
            fontSize: "1.7rem",
            fontWeight: 700,
            marginBottom: 20,
            letterSpacing: "-0.02em",
          }}
        >
          Built to Help You See the Water More Clearly.
        </h2>

        <p
          style={{
            fontSize: "1rem",
            color: "rgba(255,255,255,0.6)",
            marginBottom: 32,
            lineHeight: 1.6,
          }}
        >
          Bass Clarity doesn’t replace the angler. It sharpens the way decisions
          are made.
        </p>

        <Link
          to="/subscribe"
          style={{
            fontSize: "1rem",
            padding: "16px 40px",
            background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
            borderRadius: 999,
            fontWeight: 600,
            letterSpacing: "0.01em",
            display: "inline-block",
            textDecoration: "none",
            color: "#fff",
            boxShadow: "0 10px 40px rgba(37, 99, 235, 0.3)",
          }}
        >
          Start Your Free Trial
        </Link>

        <div style={{ marginTop: 24 }}>
          <Link
            to="/"
            style={{
              color: "rgba(255,255,255,0.45)",
              fontSize: "0.9rem",
              textDecoration: "none",
            }}
          >
            Back to Home
          </Link>
        </div>
      </section>
    </div>
  );
}
