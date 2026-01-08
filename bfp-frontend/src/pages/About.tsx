// src/components/About.tsx
// Updated: "Stealth Luxury" Design.
// Fixes: Removed blocky cards, refined typography, added premium gradients.

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
      {/* --- HERO SECTION --- */}
      <section
        style={{
          padding: "120px 24px 80px",
          textAlign: "center",
          maxWidth: 800,
        }}
      >
        <h1
          style={{
            fontSize: "clamp(2.5rem, 5vw, 3.5rem)", // Tightened up
            fontWeight: 800,
            marginBottom: 24,
            letterSpacing: "-0.03em",
            background: "linear-gradient(to bottom, #fff, #94a3b8)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            lineHeight: 1.1,
          }}
        >
          Clarity, Not Noise.
        </h1>
        <p
          style={{
            fontSize: "1.2rem",
            color: "rgba(255, 255, 255, 0.6)",
            lineHeight: 1.6,
            maxWidth: 600,
            margin: "0 auto",
          }}
        >
          Built for anglers who want strategic precision, not just data dumps.
        </p>
      </section>

      {/* --- THE PROBLEM (Text Focused) --- */}
      <section style={{ padding: "60px 24px", width: "100%", maxWidth: 800 }}>
        <div style={{ borderLeft: "2px solid #3b82f6", paddingLeft: 32 }}>
          <h2
            style={{
              fontSize: "1.75rem",
              fontWeight: 700,
              marginBottom: 24,
              color: "#fff",
              letterSpacing: "-0.01em",
            }}
          >
            The Problem
          </h2>
          <p
            style={{
              fontSize: "1.05rem",
              lineHeight: 1.8,
              color: "rgba(255, 255, 255, 0.7)",
              marginBottom: 24,
            }}
          >
            Most fishing apps dump raw data on you and leave you guessing.
            Barometric pressure graphs, solunar tables, wind charts—all the
            information, none of the answers.
          </p>
          <p
            style={{
              fontSize: "1.15rem",
              lineHeight: 1.6,
              color: "#fff",
              fontWeight: 500,
            }}
          >
            Bass Clarity cuts through the noise. We don't just show you the
            weather; we analyze how it affects the water below.
          </p>
        </div>
      </section>

      {/* --- PHILOSOPHY GRID (Clean Lines) --- */}
      <section style={{ padding: "80px 24px", width: "100%", maxWidth: 900 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 60,
          }}
        >
          {/* Item 1 */}
          <div>
            <h3
              style={{
                fontSize: "1.25rem",
                fontWeight: 600,
                color: "#fff",
                marginBottom: 12,
              }}
            >
              Strategic Discipline
            </h3>
            <p
              style={{
                fontSize: "1rem",
                lineHeight: 1.7,
                color: "rgba(255,255,255,0.5)",
              }}
            >
              We aren't for anglers who want random tips. We are for those who
              treat fishing like a craft. Systematic, deliberate, and adaptable.
            </p>
          </div>

          {/* Item 2 */}
          <div>
            <h3
              style={{
                fontSize: "1.25rem",
                fontWeight: 600,
                color: "#fff",
                marginBottom: 12,
              }}
            >
              Everything Connects
            </h3>
            <p
              style={{
                fontSize: "1rem",
                lineHeight: 1.7,
                color: "rgba(255,255,255,0.5)",
              }}
            >
              Your Pattern 2 complements Pattern 1. Your gear matches your
              technique. We ensure your plan is coherent from start to finish.
            </p>
          </div>

          {/* Item 3 */}
          <div>
            <h3
              style={{
                fontSize: "1.25rem",
                fontWeight: 600,
                color: "#fff",
                marginBottom: 12,
              }}
            >
              Honest Intelligence
            </h3>
            <p
              style={{
                fontSize: "1rem",
                lineHeight: 1.7,
                color: "rgba(255,255,255,0.5)",
              }}
            >
              We don't guess depth when we don't know it. We rely on verified
              seasonal logic and biological principles, not guesswork.
            </p>
          </div>

          {/* Item 4 */}
          <div>
            <h3
              style={{
                fontSize: "1.25rem",
                fontWeight: 600,
                color: "#fff",
                marginBottom: 12,
              }}
            >
              Regional Logic
            </h3>
            <p
              style={{
                fontSize: "1rem",
                lineHeight: 1.7,
                color: "rgba(255,255,255,0.5)",
              }}
            >
              Late fall in Michigan is different from late fall in Texas. Our
              engine adapts to your specific latitude and seasonal phase.
            </p>
          </div>
        </div>
      </section>

      {/* --- DIVIDER --- */}
      <div
        style={{
          width: "100%",
          maxWidth: 900,
          height: 1,
          background: "rgba(255,255,255,0.1)",
        }}
      />

      {/* --- DIFFERENTIATORS (Sleek List) --- */}
      <section style={{ padding: "100px 24px", width: "100%", maxWidth: 800 }}>
        <h2
          style={{
            fontSize: "2rem",
            fontWeight: 700,
            marginBottom: 48,
            textAlign: "center",
            letterSpacing: "-0.02em",
          }}
        >
          How We're Different
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          {[
            {
              title: "We Analyze, Not Just Display",
              desc: "Other apps show weather. We translate it into behavior.",
            },
            {
              title: "Lure-Specific Retrieves",
              desc: "We don't just say 'Crankbait'. We say 'Parallel retrieves along riprap with deflection'.",
            },
            {
              title: "Complementary Patterns",
              desc: "Two distinct approaches (Primary & Pivot) designed to work together, not compete.",
            },
            {
              title: "1000+ Lakes",
              desc: "And if yours isn't there, you can map any water body instantly.",
            },
          ].map((item, i) => (
            <div
              key={i}
              style={{ display: "flex", gap: 24, alignItems: "flex-start" }}
            >
              <div
                style={{
                  marginTop: 6,
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#3b82f6",
                  boxShadow: "0 0 10px rgba(59, 130, 246, 0.5)",
                }}
              />
              <div>
                <h3
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: 600,
                    color: "#fff",
                    marginBottom: 4,
                  }}
                >
                  {item.title}
                </h3>
                <p
                  style={{
                    fontSize: "0.95rem",
                    color: "rgba(255,255,255,0.5)",
                    margin: 0,
                  }}
                >
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* --- CTA SECTION (Premium Pill) --- */}
      <section
        style={{
          padding: "0 24px 120px",
          textAlign: "center",
          maxWidth: 600,
        }}
      >
        <h2
          style={{
            fontSize: "1.75rem",
            fontWeight: 700,
            marginBottom: 24,
            letterSpacing: "-0.02em",
          }}
        >
          Experience Clarity.
        </h2>
        <p
          style={{
            fontSize: "1rem",
            color: "rgba(255, 255, 255, 0.6)",
            marginBottom: 32,
            lineHeight: 1.6,
          }}
        >
          See what systematic fishing strategy looks like.
        </p>

        <Link
          to="/subscribe"
          className="btn primary"
          style={{
            fontSize: "1rem",
            padding: "16px 40px",
            background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
            borderRadius: 100, // Pill
            fontWeight: 600,
            letterSpacing: "0.01em",
            display: "inline-block",
            marginBottom: 24,
            textDecoration: "none",
            boxShadow: "0 10px 40px rgba(37, 99, 235, 0.3)",
            transition: "transform 0.2s, box-shadow 0.2s",
          }}
        >
          Start 5-Day Free Trial
        </Link>

        <div>
          <Link
            to="/"
            style={{
              color: "rgba(255,255,255,0.4)",
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
