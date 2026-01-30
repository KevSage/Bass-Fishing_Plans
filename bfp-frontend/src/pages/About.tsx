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
          Your Water. Your History. Clear Decisions.
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
          Bass Clarity is an intelligent fishing app built to help anglers
          understand their water, preserve their fishing history, and make clear
          decisions when it matters.
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
            Built Around Real Fishing
          </h2>

          <p
            style={{
              fontSize: "1.05rem",
              lineHeight: 1.8,
              color: "rgba(255,255,255,0.7)",
              marginBottom: 20,
            }}
          >
            You choose your water, fish, and log catches naturally — often
            starting with a photo. Over time, your map fills with real
            locations, real results, and lived history.
          </p>

          <p
            style={{
              fontSize: "1.05rem",
              lineHeight: 1.8,
              color: "rgba(255,255,255,0.7)",
            }}
          >
            Bass Clarity is designed to preserve what you’ve earned on the water
            and make it accessible — without dashboards, charts, or information
            overload.
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
          How Bass Clarity Works
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
              Your Map Is the Record
            </h3>
            <p
              style={{
                fontSize: "1rem",
                lineHeight: 1.7,
                color: "rgba(255,255,255,0.55)",
              }}
            >
              Every catch is stored with its location, time, and context. As
              your history grows, productive areas and patterns emerge naturally
              through repetition and density — not guesses.
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
              Insights Bring It Together
            </h3>
            <p
              style={{
                fontSize: "1rem",
                lineHeight: 1.7,
                color: "rgba(255,255,255,0.55)",
              }}
            >
              Insights turn your catches, photos, and waters into a clear record
              — highlighting best days, productive lakes, and what’s actually
              worked over time.
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
              From Conditions to Decisions
            </h3>
            <p
              style={{
                fontSize: "1rem",
                lineHeight: 1.7,
                color: "rgba(255,255,255,0.55)",
              }}
            >
              When it’s time to fish, Bass Clarity evaluates the same core
              environmental signals used by leading apps — and translates them
              into focused strategy: technique, targets, and execution, with
              simple reasoning.
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
              Designed for Focus
            </h3>
            <p
              style={{
                fontSize: "1rem",
                lineHeight: 1.7,
                color: "rgba(255,255,255,0.55)",
              }}
            >
              The app is intentionally restrained. You get fewer, better
              decisions — and you always stay in control of how closely you
              follow the plan.
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
          Bass Clarity is for anglers who want clarity without noise — whether
          fishing from the bank, a kayak, or a boat. It’s built to support real
          fishing and real learning over time.
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
          Built for the Long Run
        </h2>

        <p
          style={{
            fontSize: "1rem",
            color: "rgba(255,255,255,0.6)",
            marginBottom: 32,
            lineHeight: 1.6,
          }}
        >
          Upload past catch photos to bring your history in from day one, or
          start fresh and let it build naturally. Bass Clarity doesn’t replace
          intuition — it preserves experience and sharpens decisions when it
          matters.
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
          Create Your Catchlog
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
