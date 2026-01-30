import React, { useState } from "react";
import { Link } from "react-router-dom";

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: "How does Bass Clarity work?",
      answer:
        "Bass Clarity combines your selected water, current conditions, and seasonal context to produce clear fishing decisions. It also preserves your catches on a living map and surfaces Insights that show how your fishing adds up over time.",
    },
    {
      question: "Is Bass Clarity a fishing journal or a strategy tool?",
      answer:
        "Both. The map and Insights preserve your history (your lakes, catches, and spots), while Strategy translates today’s conditions into focused, bass-specific decisions you can actually execute.",
    },
    {
      question: "Can I import past catches?",
      answer:
        "Yes. You can upload past catch photos and Bass Clarity will place them by location and time when that information is available — so your history doesn’t start at zero.",
    },
    {
      question: "Is my map and catch history private?",
      answer:
        "Yes. Your catches, locations, and saved waters are private to your account. Bass Clarity is built around your experience — not public sharing or crowdsourced spot maps.",
    },
    {
      question: "How does Strategy work?",
      answer:
        "Strategy is session-based and tied to the water you’re fishing. You’ll get a clear starting presentation and a structured adjustment if conditions or activity call for a change — with short reasoning, not a long list.",
    },
    {
      question: "Do you analyze the same data as other fishing apps?",
      answer:
        "Yes. Bass Clarity evaluates the same core environmental signals many apps display as charts and overlays — but translates them into decisions instead of making you interpret raw numbers.",
    },
    {
      question: "Does it work on ponds and small waters?",
      answer:
        "Yes. You can select supported lakes, save your own waters, or tap anywhere on the map to fish unnamed ponds and small lakes.",
    },
    {
      question: "Do I have to follow the recommendations?",
      answer:
        "No. Bass Clarity supports your judgment. Use the strategy as a clear starting point, take what helps, and fish your style.",
    },
    {
      question: "What do I need to log a catch?",
      answer:
        "Logging is designed to be quick. Add a photo if you have one, confirm a few details, and Bass Clarity stores the catch with its place and time to build your map and Insights.",
    },
    {
      question: "Can I cancel anytime?",
      answer:
        "Yes. You can cancel your subscription at any time from your account settings. You’ll keep access through the end of your current billing period.",
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
          Create Your Catchlog
        </Link>
      </section>
    </div>
  );
}
