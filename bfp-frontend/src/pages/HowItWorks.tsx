// src/pages/HowItWorks.tsx
import React from "react";
import { Link } from "react-router-dom";

export function HowItWorksPage() {
  return (
    <div className="page">
      <main className="page__main">
        {/* HERO */}
        <section className="page__hero">
          <div className="container">
            <h1 className="h1">How Bass Clarity Works</h1>
            <p className="p muted" style={{ maxWidth: 820, marginTop: 10 }}>
              Not a data dump. Not generic tips. Bass Clarity turns conditions
              into a coherent strategy you can execute.
            </p>

            <div
              style={{
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
                marginTop: 18,
              }}
            >
              <Link to="/preview" className="btn primary">
                Try Free Sample
              </Link>
              <Link to="/subscribe" className="btn">
                Subscribe
              </Link>
              <Link to="/faq" className="btn">
                FAQ
              </Link>
            </div>
          </div>
        </section>

        {/* SECTION 1 — WHAT YOU GET */}
        <section className="page__section">
          <div className="container">
            <div className="card" style={{ padding: 26 }}>
              <h2 className="h2">What You Get</h2>
              <p className="p muted" style={{ marginTop: 10, maxWidth: 900 }}>
                Each plan is built for a specific lake and date. It’s designed
                to be read quickly and used on the water.
              </p>

              <div
                style={{
                  marginTop: 18,
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                  gap: 14,
                }}
              >
                {[
                  {
                    title: "Conditions → Strategy",
                    desc: "A clear interpretation of the day’s conditions and what they imply below the surface.",
                  },
                  {
                    title: "Two Complementary Patterns",
                    desc: "Two focused approaches that don’t contradict each other—built to cover the day intelligently.",
                  },
                  {
                    title: "Targets + Execution",
                    desc: "Where to apply each pattern and how to fish it (specific structure and positioning cues).",
                  },
                  {
                    title: "Lure-Specific Retrieves",
                    desc: "Multiple retrieves per lure so you can match bass mood and activity level.",
                  },
                  {
                    title: "Coherent Gear Choices",
                    desc: "Gear suggestions that align with the techniques—not random lists.",
                  },
                  {
                    title: "Mobile-Friendly PDF",
                    desc: "Readable on the water (sunlight-friendly layout).",
                  },
                ].map((x, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "16px 16px",
                      borderRadius: 14,
                      border: "1px solid rgba(255,255,255,0.10)",
                      background: "rgba(255,255,255,0.03)",
                    }}
                  >
                    <div style={{ fontWeight: 650, marginBottom: 8 }}>
                      {x.title}
                    </div>
                    <div className="muted" style={{ lineHeight: 1.6 }}>
                      {x.desc}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 18 }}>
                <Link to="/preview" className="btn primary">
                  See an Example Plan
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2 — HOW TO USE */}
        <section className="page__section">
          <div className="container">
            <div className="card" style={{ padding: 26 }}>
              <h2 className="h2">How to Use It</h2>
              <p className="p muted" style={{ marginTop: 10, maxWidth: 900 }}>
                The workflow is simple: start with a coherent plan, execute it
                long enough to learn something, then adapt only when it actually
                matters.
              </p>

              <div style={{ marginTop: 18, display: "grid", gap: 12 }}>
                {[
                  {
                    title: "1) Before you launch",
                    desc: "Generate your plan for the lake/date. Pack the two patterns. Commit to the starting targets.",
                  },
                  {
                    title: "2) Start the day with Pattern 1",
                    desc: "Fish the first pattern with focus. Use the retrieves to match pace and mood.",
                  },
                  {
                    title:
                      "3) Rotate to Pattern 2 when conditions or feedback justify it",
                    desc: "Pattern 2 is not ‘another random idea.’ It complements Pattern 1 and covers a different look.",
                  },
                  {
                    title: "4) If the day changes, regenerate",
                    desc: "If wind, cloud cover, temp trend, or overall feel shifts meaningfully—generate an updated plan.",
                  },
                ].map((s, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "16px 16px",
                      borderRadius: 14,
                      border: "1px solid rgba(255,255,255,0.10)",
                      background: "rgba(255,255,255,0.02)",
                    }}
                  >
                    <div style={{ fontWeight: 650, marginBottom: 6 }}>
                      {s.title}
                    </div>
                    <div className="muted" style={{ lineHeight: 1.6 }}>
                      {s.desc}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3 — WHY IT WORKS */}
        <section className="page__section">
          <div className="container">
            <div className="card" style={{ padding: 26 }}>
              <h2 className="h2">Why It Works</h2>
              <p className="p muted" style={{ marginTop: 10, maxWidth: 980 }}>
                Most fishing apps show you more information than you can
                actually act on. Bass Clarity is designed around coherence:
                fewer moving parts, clear execution, and reasoning you can
                trust.
              </p>

              <div
                style={{
                  marginTop: 18,
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                  gap: 14,
                }}
              >
                {[
                  {
                    title: "Coherence over choice overload",
                    desc: "Two patterns with purpose beats twenty disconnected suggestions.",
                  },
                  {
                    title: "Execution-first output",
                    desc: "Targets, retrieves, and progression logic—so you can fish, not interpret dashboards.",
                  },
                  {
                    title: "Condition-aware, not generic",
                    desc: "Built for the day you’re fishing, not a year-round lure list.",
                  },
                ].map((x, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "16px 16px",
                      borderRadius: 14,
                      border: "1px solid rgba(255,255,255,0.10)",
                      background: "rgba(255,255,255,0.03)",
                    }}
                  >
                    <div style={{ fontWeight: 650, marginBottom: 8 }}>
                      {x.title}
                    </div>
                    <div className="muted" style={{ lineHeight: 1.6 }}>
                      {x.desc}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4 — PREVIEW VS MEMBERS */}
        <section className="page__section">
          <div className="container">
            <div className="card" style={{ padding: 26 }}>
              <h2 className="h2">Preview vs Members</h2>
              <p className="p muted" style={{ marginTop: 10, maxWidth: 900 }}>
                The preview is a quick sample. Members get full access and
                repeat usage.
              </p>

              <div
                style={{
                  marginTop: 18,
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                  gap: 14,
                }}
              >
                <div
                  style={{
                    padding: "18px 16px",
                    borderRadius: 14,
                    border: "1px solid rgba(255,255,255,0.10)",
                    background: "rgba(255,255,255,0.02)",
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: 10 }}>
                    Free Preview
                  </div>
                  <ul
                    className="muted"
                    style={{ lineHeight: 1.9, margin: 0, paddingLeft: 18 }}
                  >
                    <li>One sample plan experience</li>
                    <li>See the structure and clarity</li>
                    <li>Decide if it fits your style</li>
                  </ul>
                  <div style={{ marginTop: 14 }}>
                    <Link to="/preview" className="btn primary">
                      Try Preview
                    </Link>
                  </div>
                </div>

                <div
                  style={{
                    padding: "18px 16px",
                    borderRadius: 14,
                    border: "1px solid rgba(74,144,226,0.25)",
                    background: "rgba(74,144,226,0.08)",
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: 10 }}>
                    Members
                  </div>
                  <ul
                    className="muted"
                    style={{ lineHeight: 1.9, margin: 0, paddingLeft: 18 }}
                  >
                    <li>Full plan access</li>
                    <li>Generate whenever you need clarity</li>
                    <li>Save time, reduce guesswork</li>
                  </ul>
                  <div style={{ marginTop: 14 }}>
                    <Link to="/subscribe" className="btn primary">
                      Subscribe
                    </Link>
                  </div>
                </div>
              </div>

              <p className="muted" style={{ marginTop: 14 }}>
                Billing details and cancellations are covered in{" "}
                <Link to="/refunds" className="link">
                  Refund Policy
                </Link>
                .
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 5 — ABOUT (condensed) */}
        <section className="page__section">
          <div className="container">
            <div className="card" style={{ padding: 26 }}>
              <h2 className="h2">About Bass Clarity</h2>
              <p className="p muted" style={{ marginTop: 10, maxWidth: 980 }}>
                Bass Clarity exists for anglers who want fewer distractions and
                better decisions. The goal is simple: reduce the chaos, give you
                a plan you can trust, and help you execute with confidence.
              </p>

              <div style={{ marginTop: 16 }}>
                <Link to="/support" className="btn">
                  Contact Support
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="page__section">
          <div className="container">
            <div
              className="card"
              style={{
                padding: 28,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 14,
                flexWrap: "wrap",
                border: "1px solid rgba(74,144,226,0.25)",
                background: "rgba(74,144,226,0.07)",
              }}
            >
              <div style={{ maxWidth: 760 }}>
                <div style={{ fontWeight: 750, fontSize: "1.15rem" }}>
                  Want to see it in action?
                </div>
                <div
                  className="muted"
                  style={{ marginTop: 6, lineHeight: 1.6 }}
                >
                  Try a free sample plan or subscribe for full access.
                </div>
              </div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <Link to="/preview" className="btn primary">
                  Try Free Sample
                </Link>
                <Link to="/subscribe" className="btn">
                  Subscribe
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
