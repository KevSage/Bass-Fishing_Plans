// src/components/FAQ.tsx
// Updated: "Stealth Luxury" Design.
// Fixes: Removed blocky cards, reduced font sizes, added elegant hairline dividers.

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
      question: "How accurate is the seasonal data?",
      answer:
        "Our seasonal logic accounts for regional variation. Late-fall in Texas is different from late-fall in Michigan. We don't use one-size-fits-all calendar dates—your plan adapts to your region and current phase.",
    },
    {
      question: "Can I save my plans?",
      answer:
        "Yes. You can view the 10 most recent plans you've generated for reference, directly from your account page.",
    },
    {
      question: "What if I fish small ponds or private lakes?",
      answer:
        "No problem. Use our interactive map to click any water body. Bass Clarity works for tournament reservoirs, neighborhood ponds, and everything in between.",
    },
    {
      question: "How do I know which pattern to start with?",
      answer:
        "Pattern 1 (primary) and Pattern 2 (complementary pivot). Start with Pattern 1. If it slows or conditions change, switch to Pattern 2. They're designed to work together, not compete.",
    },
    {
      question: "What kind of gear specs do members get?",
      answer:
        "Rod power and action, reel gear ratio, and line type/weight—all matched to how you're fishing it. Bottom contact gets heavy gear. Finesse gets lighter touch. Deliberate, not random.",
    },
    {
      question: "Can I cancel anytime?",
      answer:
        "Yes. Cancel your $10/month membership anytime. No contracts, no hassle.",
    },
    {
      question: "What if my lake isn't in the database?",
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
          padding: "100px 24px 60px",
          textAlign: "center",
          maxWidth: 800,
        }}
      >
        <h1
          style={{
            fontSize: "clamp(2rem, 4vw, 2.5rem)", // Much smaller, sharper
            fontWeight: 700,
            marginBottom: 16,
            letterSpacing: "-0.02em",
            background: "linear-gradient(to bottom, #fff, #a1a1aa)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Frequently Asked Questions
        </h1>
        <p
          style={{
            fontSize: "1.05rem",
            color: "rgba(255, 255, 255, 0.6)",
            lineHeight: 1.6,
          }}
        >
          Everything you need to know about how Bass Clarity works.
        </p>
      </section>

      {/* --- FAQ LIST --- */}
      <section
        style={{ width: "100%", maxWidth: 800, padding: "0 24px 100px" }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          {faqs.map((faq, index) => (
            <div
              key={index}
              style={{
                borderBottom: "1px solid rgba(255,255,255,0.08)", // Hairline divider
                transition: "background 0.2s",
              }}
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                style={{
                  width: "100%",
                  padding: "24px 0", // Vertical padding only
                  background: "transparent",
                  border: "none",
                  color: "#fff",
                  textAlign: "left",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 24,
                }}
              >
                <span
                  style={{
                    fontSize: "1rem", // Sleek size
                    fontWeight: 500,
                    lineHeight: 1.4,
                    letterSpacing: "0.01em",
                    opacity: openIndex === index ? 1 : 0.8,
                    transition: "opacity 0.2s",
                  }}
                >
                  {faq.question}
                </span>

                {/* Modern Plus/Minus Icon */}
                <div
                  style={{
                    position: "relative",
                    width: 14,
                    height: 14,
                    marginTop: 4,
                    opacity: 0.6,
                    flexShrink: 0,
                  }}
                >
                  {/* Horizontal Line */}
                  <div
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: 0,
                      width: "100%",
                      height: 2,
                      background: "currentColor",
                      transform: "translateY(-50%)",
                    }}
                  />
                  {/* Vertical Line (Rotates) */}
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: "50%",
                      width: 2,
                      height: "100%",
                      background: "currentColor",
                      // transform: "translateX(-50%)",
                      transition: "transform 0.3s ease",
                      transformOrigin: "center",
                      transform:
                        openIndex === index
                          ? "translateX(-50%) rotate(90deg)"
                          : "translateX(-50%) rotate(0deg)",
                      opacity: openIndex === index ? 0 : 1, // Fade out vertical line to make minus
                    }}
                  />
                </div>
              </button>

              {openIndex === index && (
                <div
                  style={{
                    paddingBottom: 24,
                    fontSize: "0.95rem",
                    lineHeight: 1.7,
                    color: "rgba(255, 255, 255, 0.6)",
                    maxWidth: "95%",
                    animation: "fadeIn 0.3s ease",
                  }}
                >
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* --- CTA SECTION --- */}
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
            marginBottom: 16,
            letterSpacing: "-0.02em",
          }}
        >
          Still have questions?
        </h2>
        <p
          style={{
            fontSize: "1rem",
            color: "rgba(255, 255, 255, 0.6)",
            marginBottom: 32,
            lineHeight: 1.6,
          }}
        >
          The best way to understand Bass Clarity is to see it in action.
        </p>

        <Link
          to="/subscribe"
          className="btn primary"
          style={{
            fontSize: "1rem",
            padding: "16px 40px", // Sleeker pill shape
            background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
            borderRadius: 100, // Full rounded
            fontWeight: 600,
            letterSpacing: "0.01em",
            display: "inline-block",
            marginBottom: 24,
            textDecoration: "none",
            boxShadow: "0 10px 30px rgba(37, 99, 235, 0.25)", // Soft glow
            transition: "transform 0.2s, box-shadow 0.2s",
          }}
        >
          Start 5-Day Free Trial
        </Link>

        <div>
          <a
            href="mailto:support@bassclarity.com"
            style={{
              color: "rgba(255, 255, 255, 0.4)",
              textDecoration: "none",
              fontSize: "0.9rem",
              borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
              paddingBottom: 2,
            }}
          >
            Contact Support
          </a>
        </div>
      </section>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
