import React from "react";
import { Link } from "react-router-dom";

export function WhatYourPlanIncludes() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(to bottom, #0a0a0a, #1a1a2e)",
        color: "#fff",
        padding: "80px 20px 60px",
      }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        {/* Header */}
        <section style={{ textAlign: "center", marginBottom: 80 }}>
          <div
            style={{
              fontSize: "0.85rem",
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              color: "#4A90E2",
              marginBottom: 12,
              fontWeight: 600,
            }}
          >
            What Your Plan Gets
          </div>
          <h1
            style={{
              fontSize: "clamp(2.25rem, 5vw, 3rem)",
              fontWeight: 700,
              marginBottom: 24,
              letterSpacing: "-0.02em",
            }}
          >
            What Your Plan Includes
          </h1>
          <p
            style={{
              fontSize: "1.15rem",
              lineHeight: 1.7,
              opacity: 0.9,
              maxWidth: 720,
              margin: "0 auto 20px",
            }}
          >
            A Bass Fishing Plan isn't a single lure or a general recommendation.
            It's a structured read of your water, built for how bass are most
            likely positioned and behaving right now.
          </p>
          <p
            style={{
              fontSize: "1.05rem",
              lineHeight: 1.7,
              opacity: 0.8,
              maxWidth: 720,
              margin: "0 auto",
            }}
          >
            Every plan is generated for where you're fishing today and gives you
            a clear framework you can commit to.
          </p>
        </section>

        {/* Built for One Place, One Day */}
        <section
          className="card"
          style={{
            marginBottom: 40,
            background:
              "linear-gradient(135deg, rgba(74, 144, 226, 0.08) 0%, rgba(10, 10, 10, 0.4) 100%)",
            border: "1px solid rgba(74, 144, 226, 0.2)",
          }}
        >
          <h2
            style={{
              fontSize: "1.75rem",
              fontWeight: 700,
              marginBottom: 16,
              color: "#4A90E2",
            }}
          >
            Built for One Place, One Day
          </h2>
          <p style={{ fontSize: "1.05rem", lineHeight: 1.7, opacity: 0.9 }}>
            Each plan is location-specific and time-specific.
          </p>
          <p
            style={{
              fontSize: "1.05rem",
              lineHeight: 1.7,
              opacity: 0.9,
              marginTop: 14,
            }}
          >
            It accounts for:
          </p>
          <ul
            style={{
              marginTop: 12,
              paddingLeft: 20,
              lineHeight: 1.8,
              fontSize: "1.05rem",
              opacity: 0.85,
            }}
          >
            <li>Current conditions</li>
            <li>Seasonal timing</li>
            <li>How bass typically position and feed under those conditions</li>
          </ul>
          <div
            style={{
              marginTop: 24,
              padding: "20px 24px",
              background: "rgba(74, 144, 226, 0.1)",
              borderRadius: 12,
              border: "1px solid rgba(74, 144, 226, 0.2)",
            }}
          >
            <p
              style={{
                fontSize: "1.1rem",
                lineHeight: 1.6,
                margin: 0,
                opacity: 0.95,
              }}
            >
              This isn't global advice and it isn't recycled content.
            </p>
            <p
              style={{
                fontSize: "1.1rem",
                lineHeight: 1.6,
                marginTop: 10,
                fontWeight: 600,
              }}
            >
              It's a focused interpretation of your water, that day.
            </p>
          </div>
        </section>

        {/* Primary Pattern */}
        <section
          className="card"
          style={{
            marginBottom: 40,
            background:
              "linear-gradient(135deg, rgba(74, 144, 226, 0.08) 0%, rgba(10, 10, 10, 0.4) 100%)",
            border: "1px solid rgba(74, 144, 226, 0.2)",
          }}
        >
          <h2
            style={{
              fontSize: "1.75rem",
              fontWeight: 700,
              marginBottom: 16,
              color: "#4A90E2",
            }}
          >
            Primary Pattern
          </h2>
          <p style={{ fontSize: "1.05rem", lineHeight: 1.7, opacity: 0.9 }}>
            The primary pattern is the main way the plan expects bass to be
            caught.
          </p>

          <div
            style={{
              marginTop: 20,
              padding: "20px 24px",
              background: "rgba(255, 255, 255, 0.03)",
              borderRadius: 12,
              border: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            <div
              style={{
                fontSize: "0.85rem",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                color: "rgba(255, 255, 255, 0.6)",
                marginBottom: 14,
                fontWeight: 600,
              }}
            >
              It includes:
            </div>
            <ul
              style={{
                paddingLeft: 20,
                lineHeight: 1.9,
                fontSize: "1.05rem",
                opacity: 0.85,
              }}
            >
              <li>The core technique / presentation</li>
              <li>
                Specific lure choices and colors that best express that
                presentation
              </li>
              <li>
                Target areas — points, edges, transitions, and zones worth your
                time
              </li>
              <li>How to fish it — cadence, positioning, and timing</li>
              <li>Why it makes sense given current bass behavior</li>
            </ul>
            <p
              style={{
                marginTop: 16,
                fontSize: "1.05rem",
                fontWeight: 600,
                opacity: 0.95,
              }}
            >
              This is the approach the plan wants you to start with and spend
              time on.
            </p>
          </div>
        </section>

        {/* Counter Pattern */}
        <section
          className="card"
          style={{
            marginBottom: 40,
            background:
              "linear-gradient(135deg, rgba(74, 144, 226, 0.08) 0%, rgba(10, 10, 10, 0.4) 100%)",
            border: "1px solid rgba(74, 144, 226, 0.2)",
          }}
        >
          <h2
            style={{
              fontSize: "1.75rem",
              fontWeight: 700,
              marginBottom: 16,
              color: "#4A90E2",
            }}
          >
            Counter Pattern
          </h2>
          <p style={{ fontSize: "1.05rem", lineHeight: 1.7, opacity: 0.9 }}>
            Bass don't always behave exactly as expected.
          </p>
          <p
            style={{
              fontSize: "1.05rem",
              lineHeight: 1.7,
              opacity: 0.9,
              marginTop: 14,
            }}
          >
            The counter pattern exists for a different bass behavior or
            positioning scenario, not as a backup for impatience.
          </p>

          <div
            style={{
              marginTop: 20,
              padding: "20px 24px",
              background: "rgba(255, 255, 255, 0.03)",
              borderRadius: 12,
              border: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            <div
              style={{
                fontSize: "0.85rem",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                color: "rgba(255, 255, 255, 0.6)",
                marginBottom: 14,
                fontWeight: 600,
              }}
            >
              It provides:
            </div>
            <ul
              style={{
                paddingLeft: 20,
                lineHeight: 1.9,
                fontSize: "1.05rem",
                opacity: 0.85,
              }}
            >
              <li>A contrasting presentation</li>
              <li>Different water, depth, or mood</li>
              <li>Clear guidance on when it becomes relevant</li>
            </ul>
            <p
              style={{
                marginTop: 16,
                fontSize: "1.05rem",
                fontWeight: 600,
                opacity: 0.95,
              }}
            >
              It's a deliberate alternative, not a second guess.
            </p>
          </div>
        </section>

        {/* Targets That Matter */}
        <section
          className="card"
          style={{
            marginBottom: 40,
            background:
              "linear-gradient(135deg, rgba(74, 144, 226, 0.08) 0%, rgba(10, 10, 10, 0.4) 100%)",
            border: "1px solid rgba(74, 144, 226, 0.2)",
          }}
        >
          <h2
            style={{
              fontSize: "1.75rem",
              fontWeight: 700,
              marginBottom: 16,
              color: "#4A90E2",
            }}
          >
            Targets That Matter
          </h2>
          <p style={{ fontSize: "1.05rem", lineHeight: 1.7, opacity: 0.9 }}>
            The plan doesn't just tell you what to throw — it tells you where to
            spend your time.
          </p>
          <p
            style={{
              fontSize: "1.05rem",
              lineHeight: 1.7,
              opacity: 0.9,
              marginTop: 14,
            }}
          >
            You'll see guidance around:
          </p>
          <ul
            style={{
              marginTop: 12,
              paddingLeft: 20,
              lineHeight: 1.8,
              fontSize: "1.05rem",
              opacity: 0.85,
            }}
          >
            <li>Points</li>
            <li>Breaks</li>
            <li>Edges</li>
            <li>Transitions</li>
            <li>Zones that are likely to hold bass under current conditions</li>
          </ul>
          <div
            style={{
              marginTop: 24,
              padding: "20px 24px",
              background: "rgba(74, 144, 226, 0.1)",
              borderRadius: 12,
              border: "1px solid rgba(74, 144, 226, 0.2)",
            }}
          >
            <p
              style={{
                fontSize: "1.1rem",
                fontWeight: 600,
                margin: 0,
                opacity: 0.95,
              }}
            >
              This is how the plan narrows the lake and keeps you from fishing
              everything halfway.
            </p>
          </div>
        </section>

        {/* Gear Setup */}
        <section
          className="card"
          style={{
            marginBottom: 40,
            background:
              "linear-gradient(135deg, rgba(74, 144, 226, 0.08) 0%, rgba(10, 10, 10, 0.4) 100%)",
            border: "1px solid rgba(74, 144, 226, 0.2)",
          }}
        >
          <h2
            style={{
              fontSize: "1.75rem",
              fontWeight: 700,
              marginBottom: 16,
              color: "#4A90E2",
            }}
          >
            Gear Setup
          </h2>
          <p style={{ fontSize: "1.05rem", lineHeight: 1.7, opacity: 0.9 }}>
            Each plan includes concise gear guidance matched to the patterns:
          </p>
          <ul
            style={{
              marginTop: 12,
              paddingLeft: 20,
              lineHeight: 1.8,
              fontSize: "1.05rem",
              opacity: 0.85,
            }}
          >
            <li>Rod type</li>
            <li>Line considerations</li>
            <li>Setup intent</li>
          </ul>
          <p
            style={{
              marginTop: 14,
              fontSize: "1.05rem",
              fontStyle: "italic",
              opacity: 0.75,
            }}
          >
            It's enough to be useful without turning into a checklist or a gear
            dump.
          </p>
        </section>

        {/* Day Progression Guidance */}
        <section
          className="card"
          style={{
            marginBottom: 40,
            background:
              "linear-gradient(135deg, rgba(74, 144, 226, 0.08) 0%, rgba(10, 10, 10, 0.4) 100%)",
            border: "1px solid rgba(74, 144, 226, 0.2)",
          }}
        >
          <h2
            style={{
              fontSize: "1.75rem",
              fontWeight: 700,
              marginBottom: 16,
              color: "#4A90E2",
            }}
          >
            Day Progression Guidance
          </h2>
          <p style={{ fontSize: "1.05rem", lineHeight: 1.7, opacity: 0.9 }}>
            Fishing isn't static.
          </p>
          <p
            style={{
              fontSize: "1.05rem",
              lineHeight: 1.7,
              opacity: 0.9,
              marginTop: 14,
            }}
          >
            The plan helps you understand:
          </p>
          <ul
            style={{
              marginTop: 12,
              paddingLeft: 20,
              lineHeight: 1.8,
              fontSize: "1.05rem",
              opacity: 0.85,
            }}
          >
            <li>What to watch for as the day unfolds</li>
            <li>What changes matter</li>
            <li>When adjustments are justified</li>
            <li>When consistency is still the right move</li>
          </ul>
          <div
            style={{
              marginTop: 24,
              padding: "20px 24px",
              background: "rgba(74, 144, 226, 0.1)",
              borderRadius: 12,
              border: "1px solid rgba(74, 144, 226, 0.2)",
            }}
          >
            <p
              style={{
                fontSize: "1.1rem",
                fontWeight: 600,
                margin: 0,
                opacity: 0.95,
              }}
            >
              This keeps the plan relevant beyond the first hour.
            </p>
          </div>
        </section>

        {/* Context, Not Just Answers */}
        <section
          className="card"
          style={{
            marginBottom: 40,
            background:
              "linear-gradient(135deg, rgba(74, 144, 226, 0.08) 0%, rgba(10, 10, 10, 0.4) 100%)",
            border: "1px solid rgba(74, 144, 226, 0.2)",
          }}
        >
          <h2
            style={{
              fontSize: "1.75rem",
              fontWeight: 700,
              marginBottom: 16,
              color: "#4A90E2",
            }}
          >
            Context, Not Just Answers
          </h2>
          <p style={{ fontSize: "1.05rem", lineHeight: 1.7, opacity: 0.9 }}>
            Every plan includes explanation.
          </p>
          <p
            style={{
              fontSize: "1.05rem",
              lineHeight: 1.7,
              opacity: 0.9,
              marginTop: 14,
            }}
          >
            You're not just told what to do — you're shown why it fits the
            conditions and how bass are likely responding.
          </p>

          <div
            style={{
              marginTop: 20,
              padding: "20px 24px",
              background: "rgba(255, 255, 255, 0.03)",
              borderRadius: 12,
              border: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            <p
              style={{
                fontSize: "1.05rem",
                opacity: 0.9,
                marginBottom: 12,
              }}
            >
              Over time, this builds understanding:
            </p>
            <ul
              style={{
                paddingLeft: 20,
                lineHeight: 1.8,
                fontSize: "1.05rem",
                opacity: 0.85,
              }}
            >
              <li>Of seasonal movement</li>
              <li>Of positioning</li>
              <li>Of why certain approaches repeat — and when they change</li>
            </ul>
          </div>
        </section>

        {/* What a Plan Is Not */}
        <section
          className="card"
          style={{
            marginBottom: 40,
            background:
              "linear-gradient(135deg, rgba(74, 144, 226, 0.08) 0%, rgba(10, 10, 10, 0.4) 100%)",
            border: "1px solid rgba(74, 144, 226, 0.2)",
          }}
        >
          <h2
            style={{
              fontSize: "1.75rem",
              fontWeight: 700,
              marginBottom: 16,
              color: "#4A90E2",
            }}
          >
            What a Plan Is Not
          </h2>
          <p style={{ fontSize: "1.05rem", lineHeight: 1.7, opacity: 0.9 }}>
            A Bass Fishing Plan is not:
          </p>
          <ul
            style={{
              marginTop: 12,
              paddingLeft: 20,
              lineHeight: 1.8,
              fontSize: "1.05rem",
              opacity: 0.85,
            }}
          >
            <li>A lure list</li>
            <li>A weather report</li>
            <li>A collection of options</li>
            <li>A promise that you'll never adjust</li>
          </ul>
          <p
            style={{
              marginTop: 16,
              fontSize: "1.1rem",
              fontWeight: 600,
              opacity: 0.95,
            }}
          >
            It's a disciplined starting point designed to reduce decision
            paralysis and help you fish with intent.
          </p>
        </section>

        {/* The Point - Final CTA */}
        <section
          style={{
            textAlign: "center",
            marginTop: 60,
            padding: "48px 32px",
            background:
              "linear-gradient(135deg, rgba(74, 144, 226, 0.12) 0%, rgba(74, 144, 226, 0.04) 100%)",
            borderRadius: 24,
            border: "1px solid rgba(74, 144, 226, 0.25)",
          }}
        >
          <h2
            style={{
              fontSize: "1.75rem",
              fontWeight: 700,
              marginBottom: 20,
              color: "#4A90E2",
            }}
          >
            The Point
          </h2>
          <p
            style={{
              fontSize: "1.15rem",
              lineHeight: 1.7,
              opacity: 0.9,
              marginBottom: 16,
            }}
          >
            The value of the plan isn't novelty.
            <br />
            It's clarity.
          </p>
          <p
            style={{
              fontSize: "1.15rem",
              lineHeight: 1.7,
              opacity: 0.9,
              marginBottom: 32,
            }}
          >
            It gives you one clear way to start, one clear alternative when
            needed, and the confidence to commit instead of second-guessing.
          </p>
          <Link
            className="btn primary"
            to="/preview"
            style={{
              fontSize: "1.1rem",
              padding: "16px 40px",
              background: "linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)",
              borderRadius: 12,
              fontWeight: 600,
              display: "inline-block",
              boxShadow: "0 8px 24px rgba(74, 144, 226, 0.3)",
            }}
          >
            Get your plan
          </Link>
        </section>
      </div>
    </div>
  );
}
