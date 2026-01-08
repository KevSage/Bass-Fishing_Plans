import React, { useState } from "react";
import { Link } from "react-router-dom";

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: "How does Bass Clarity work?",
      answer:
        "Bass Clarity interprets current conditions — weather, seasonal phase, and location — and translates them into a clear fishing plan. Each plan includes patterns, targets, retrieves, and short explanations that show why the decisions fit the moment.",
    },
    {
      question:
        "Is Bass Clarity an educational tool or a recommendation engine?",
      answer:
        "Both. Bass Clarity provides clear recommendations, but always explains the reasoning behind them. Over time, anglers learn how conditions influence decisions, not just what to throw on a given day.",
    },
    {
      question: "How many lakes are supported?",
      answer:
        "Bass Clarity includes over 1,000 mapped lakes across the U.S. If your water isn’t listed, you can generate a plan for any lake, reservoir, or pond directly from the interactive map.",
    },
    {
      question: "What if conditions change while I’m fishing?",
      answer:
        "Plans can be regenerated on the water when conditions shift. If wind, cloud cover, or light changes meaningfully, Bass Clarity can re-evaluate and suggest an updated approach.",
    },
    {
      question: "How accurate is the seasonal logic?",
      answer:
        "Seasonal behavior is region-specific. Bass Clarity accounts for latitude and local climate rather than fixed calendar dates, allowing plans to reflect how fish actually behave in your area.",
    },
    {
      question: "How do I know which pattern to start with?",
      answer:
        "Each plan includes a Primary pattern and a complementary Pivot pattern. Start with the Primary. If activity slows or conditions shift, the Pivot provides a natural adjustment rather than a competing idea.",
    },
    {
      question: "What kind of gear recommendations are included?",
      answer:
        "Each pattern includes rod power and action, reel gear ratio, and line type matched to the technique and presentation. Gear is selected to support execution, not to showcase variety.",
    },
    {
      question: "Can I save or revisit past plans?",
      answer:
        "Yes. Your most recent plans are saved automatically and can be reviewed from your account page for reference and learning.",
    },
    {
      question: "Does Bass Clarity work for ponds and small lakes?",
      answer:
        "Yes. Bass Clarity is designed to work on any water body — from large reservoirs to neighborhood ponds — as long as conditions and location can be identified.",
    },
    {
      question: "Can I cancel my subscription?",
      answer:
        "Yes. You can cancel at any time from your account settings. There are no contracts or long-term commitments.",
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
      {/* HERO */}
      <section
        style={{
          padding: "100px 24px 60px",
          textAlign: "center",
          maxWidth: 800,
        }}
      >
        <h1
          style={{
            fontSize: "clamp(2rem, 4vw, 2.5rem)",
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
            color: "rgba(255,255,255,0.6)",
            lineHeight: 1.6,
          }}
        >
          Clear answers about how Bass Clarity thinks and what it provides.
        </p>
      </section>

      {/* FAQ LIST */}
      <section
        style={{ width: "100%", maxWidth: 800, padding: "0 24px 100px" }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          {faqs.map((faq, index) => (
            <div
              key={index}
              style={{
                borderBottom: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                style={{
                  width: "100%",
                  padding: "24px 0",
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
                    fontSize: "1rem",
                    fontWeight: 500,
                    lineHeight: 1.4,
                    opacity: openIndex === index ? 1 : 0.85,
                  }}
                >
                  {faq.question}
                </span>

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
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: "50%",
                      width: 2,
                      height: "100%",
                      background: "currentColor",
                      transformOrigin: "center",
                      transform:
                        openIndex === index
                          ? "translateX(-50%) rotate(90deg)"
                          : "translateX(-50%) rotate(0deg)",
                      opacity: openIndex === index ? 0 : 1,
                      transition: "transform 0.3s ease",
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
                    color: "rgba(255,255,255,0.6)",
                    maxWidth: "95%",
                  }}
                >
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
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
            fontSize: "1.6rem",
            fontWeight: 700,
            marginBottom: 16,
            letterSpacing: "-0.02em",
          }}
        >
          Ready to see it in action?
        </h2>
        <p
          style={{
            fontSize: "1rem",
            color: "rgba(255,255,255,0.6)",
            marginBottom: 32,
            lineHeight: 1.6,
          }}
        >
          The best way to understand Bass Clarity is to use it on your water.
        </p>

        <Link
          to="/subscribe"
          style={{
            fontSize: "1rem",
            padding: "16px 40px",
            background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
            borderRadius: 100,
            fontWeight: 600,
            letterSpacing: "0.01em",
            display: "inline-block",
            textDecoration: "none",
            color: "#fff",
            boxShadow: "0 10px 30px rgba(37, 99, 235, 0.25)",
          }}
        >
          Start Your Free Trial
        </Link>
      </section>
    </div>
  );
}
