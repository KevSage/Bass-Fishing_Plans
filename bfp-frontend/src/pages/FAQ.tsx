import React, { useState } from "react";
import { Link } from "react-router-dom";

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: "How does Bass Clarity work?",
      answer:
        "Bass Clarity analyzes current weather, seasonal phase, and regional patterns to generate a complete fishing strategy. You select your lake, we analyze conditions, and deliver a plan with specific lures, retrieves, targets, and reasoning—all in about 30 seconds.",
    },
    {
      question: "What's the difference between Preview and Members?",
      answer:
        "Preview gives you ONE focused pattern with weather analysis, lures, colors, targets, and retrieves. Members get TWO complementary patterns, matched gear specifications (rod/reel/line), pattern summaries, strategy tips, day progression, and unlimited plan generation. Preview users can generate one plan every 30 days; members have no limits.",
    },
    {
      question: "How many lakes are in your database?",
      answer:
        "1000+ lakes across all 50 states. If your lake isn't in the database, you can select any water body from our interactive map. Same clarity, any water.",
    },
    {
      question: "Can I use Bass Clarity for tournament fishing?",
      answer:
        "Absolutely. Bass Clarity was built for strategic discipline under pressure. Members get two complementary approaches, matched gear, and day progression—perfect for tournament scenarios where you need systematic clarity, not scattered tips.",
    },
    {
      question: "What if conditions change while I'm fishing?",
      answer:
        "Members can generate a new plan right from the water. Wind picks up? Clouds roll in? Water gets choppy? Check if conditions warrant a different approach. Clarity when you need it most.",
    },
    {
      question: "Do I need cell service to view my plan?",
      answer:
        "No. Download your plan as a PDF before you launch. It works offline, is readable in direct sunlight, and you can print it if you prefer paper on the water.",
    },
    {
      question: "How accurate is the seasonal data?",
      answer:
        "Our seasonal logic accounts for regional variation. Late-fall in Texas is different from late-fall in Michigan. We don't use one-size-fits-all calendar dates—your plan adapts to your region and current phase.",
    },
    {
      question: "What lure brands do you recommend?",
      answer:
        "We specify lure types (crankbait, Texas rig, chatterbait), colors, and trailers—not specific brands. This gives you flexibility to use what you already own or trust.",
    },
    {
      question: "Can I save my plans?",
      answer:
        "Yes. Every plan has a unique link emailed to you. You can access past plans anytime, and members can save PDFs for offline reference.",
    },
    {
      question: "What if I fish small ponds or private lakes?",
      answer:
        "No problem. Use our interactive map to click any water body. Bass Clarity works for tournament reservoirs, neighborhood ponds, and everything in between.",
    },
    {
      question: "How do I know which pattern to start with?",
      answer:
        "Members get both Pattern 1 (primary) and Pattern 2 (complementary pivot). Start with Pattern 1. If it slows or conditions change, switch to Pattern 2. They're designed to work together, not compete.",
    },
    {
      question: "What kind of gear specs do members get?",
      answer:
        "Rod power and action, reel gear ratio, and line type/weight—all matched to how you're fishing it. Bottom contact gets heavy gear. Finesse gets lighter touch. Deliberate, not random.",
    },
    {
      question: "Can I cancel anytime?",
      answer:
        "Yes. Cancel your $15/month membership anytime. No contracts, no hassle.",
    },
    {
      question: "Do you cover saltwater fishing?",
      answer:
        "Not yet. Bass Clarity is currently focused exclusively on largemouth and smallmouth bass in freshwater.",
    },
    {
      question: "What if my lake isn't working?",
      answer:
        "Contact us. We're constantly expanding our database and want to know which lakes matter to you.",
    },
    {
      question: "How is this different from other fishing apps?",
      answer:
        "Most apps dump data and leave you guessing. Bass Clarity cuts through the noise with clear strategy: what to throw, how to fish it, why it works. We don't just show weather—we analyze how it affects the water below. We don't just list lures—we match them to conditions with specific retrieves for each target type. Everything connects. That's clarity.",
    },
  ];

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
            Frequently Asked Questions
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
            Everything you need to know about Bass Clarity.
          </p>
        </div>
      </section>

      {/* FAQ List */}
      <section style={{ padding: "80px 24px 120px" }}>
        <div className="container" style={{ maxWidth: 900 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {faqs.map((faq, index) => (
              <div
                key={index}
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 12,
                  overflow: "hidden",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(74, 144, 226, 0.05)";
                  e.currentTarget.style.borderColor = "rgba(74, 144, 226, 0.2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                }}
              >
                <button
                  onClick={() =>
                    setOpenIndex(openIndex === index ? null : index)
                  }
                  style={{
                    width: "100%",
                    padding: "24px 28px",
                    background: "transparent",
                    border: "none",
                    color: "#fff",
                    textAlign: "left",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 20,
                  }}
                >
                  <span
                    style={{
                      fontSize: "1.2rem",
                      fontWeight: 600,
                      lineHeight: 1.4,
                    }}
                  >
                    {faq.question}
                  </span>
                  <span
                    style={{
                      fontSize: "1.5rem",
                      flexShrink: 0,
                      transition: "transform 0.3s ease",
                      transform:
                        openIndex === index ? "rotate(180deg)" : "rotate(0deg)",
                      color: "#4A90E2",
                    }}
                  >
                    ▼
                  </span>
                </button>
                {openIndex === index && (
                  <div
                    style={{
                      padding: "0 28px 24px",
                      fontSize: "1.05rem",
                      lineHeight: 1.7,
                      opacity: 0.85,
                    }}
                  >
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Still Have Questions CTA */}
      <section
        style={{
          padding: "100px 24px",
        }}
      >
        <div
          className="container"
          style={{ maxWidth: 700, textAlign: "center" }}
        >
          <h2
            style={{
              fontSize: "clamp(2rem, 5vw, 3rem)",
              fontWeight: 700,
              marginBottom: 24,
            }}
          >
            Still Have Questions?
          </h2>
          <p
            style={{
              fontSize: "1.2rem",
              opacity: 0.7,
              marginBottom: 40,
              lineHeight: 1.6,
            }}
          >
            Try a free preview plan and see Bass Clarity in action.
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
              marginBottom: 24,
              boxShadow: "0 8px 24px rgba(74, 144, 226, 0.3)",
            }}
          >
            5 Day Free Trial
          </Link>
          <div>
            <p style={{ opacity: 0.6, fontSize: "1rem" }}>
              Or email us at{" "}
              <a
                href="mailto:support@bassclarity.com"
                style={{
                  color: "#4A90E2",
                  textDecoration: "none",
                }}
              >
                support@bassclarity.com
              </a>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
