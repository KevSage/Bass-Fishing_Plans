import React from "react";
import { Link } from "react-router-dom";

export function Landing() {
  return (
    <div
      style={{
        background: "linear-gradient(to bottom, #0a0a0a, #1a1a2e)",
        color: "#fff",
      }}
    >
      {/* ============================================
          HERO SECTION - CLARITY EVERY TIME, EVERYWHERE
          ============================================ */}
      <section
        style={{
          minHeight: "92vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Gradient background */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 30% 20%, rgba(74, 144, 226, 0.08) 0%, transparent 70%)",
          }}
        />

        {/* Bass hero image - FULL VISIBILITY */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "url(/images/hero_bass.jpeg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: 1,
            filter: "brightness(0.9)",
          }}
        />

        {/* Dark overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.85) 100%)",
          }}
        />

        <div
          className="container"
          style={{
            position: "relative",
            zIndex: 1,
            textAlign: "center",
            maxWidth: 1020,
            padding: "0 24px",
          }}
        >
          {/* Main headline */}
          <h1
            style={{
              fontSize: "clamp(2.75rem, 7.5vw, 5rem)",
              fontWeight: 700,
              lineHeight: 1.1,
              marginBottom: 32,
              letterSpacing: "-0.03em",
            }}
          >
            Bass Clarity
          </h1>

          {/* THE PROMISE */}
          <p
            style={{
              fontSize: "clamp(1.3rem, 3.2vw, 1.65rem)",
              lineHeight: 1.4,
              opacity: 0.95,
              marginBottom: 28,
              maxWidth: 980,
              margin: "0 auto 28px",
              fontWeight: 500,
            }}
          >
            Clarity every time you fish, everywhere you fish.
          </p>

          {/* What that means */}
          <p
            style={{
              fontSize: "clamp(1.15rem, 2.6vw, 1.35rem)",
              lineHeight: 1.6,
              opacity: 0.8,
              marginBottom: 20,
              fontWeight: 400,
              maxWidth: 920,
              margin: "0 auto 20px",
            }}
          >
            Clear strategy. Clear execution. Clear reasoning. Know what to
            throw, how to fish it, and why it works—for any lake, any
            conditions, any season.
          </p>

          {/* Stats bar */}
          <p
            style={{
              fontSize: "clamp(1rem, 2.2vw, 1.15rem)",
              opacity: 0.65,
              marginBottom: 52,
              fontWeight: 400,
            }}
          >
            1000+ lakes • All 50 states • Every season
          </p>

          {/* CTA */}
          <Link
            className="btn primary"
            to="/preview"
            style={{
              fontSize: "1.2rem",
              padding: "22px 60px",
              background: "linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)",
              borderRadius: 16,
              fontWeight: 600,
              display: "inline-block",
              boxShadow: "0 8px 24px rgba(74, 144, 226, 0.3)",
              transition: "all 0.3s ease",
            }}
          >
            Get clarity for your next trip
          </Link>
          <p
            style={{
              marginTop: 20,
              fontSize: "1rem",
              opacity: 0.5,
              fontWeight: 400,
            }}
          >
            No credit card required
          </p>
        </div>
      </section>

      {/* ============================================
          FROM CONFUSION TO CLARITY
          ============================================ */}
      <section
        style={{
          padding: "140px 24px",
        }}
      >
        <div className="container" style={{ maxWidth: 1100 }}>
          <h2
            style={{
              fontSize: "clamp(2.25rem, 5.5vw, 3.5rem)",
              fontWeight: 700,
              textAlign: "center",
              marginBottom: 32,
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
            }}
          >
            From Confusion to Clarity
          </h2>

          <p
            style={{
              fontSize: "clamp(1.15rem, 2.5vw, 1.35rem)",
              textAlign: "center",
              opacity: 0.8,
              marginBottom: 80,
              maxWidth: 860,
              margin: "0 auto 80px",
              lineHeight: 1.6,
            }}
          >
            Most apps dump data and leave you guessing. Bass Clarity cuts
            through the noise and delivers clear answers.
          </p>

          {/* Two column comparison */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: 48,
              marginBottom: 80,
            }}
          >
            {/* The Confusion */}
            <div
              style={{
                padding: "48px 40px",
                background: "rgba(255,255,255,0.02)",
                borderRadius: 20,
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <h3
                style={{
                  fontSize: "1.4rem",
                  fontWeight: 600,
                  marginBottom: 28,
                  color: "#888",
                }}
              >
                The Confusion
              </h3>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  fontSize: "1.1rem",
                  lineHeight: 2.2,
                  opacity: 0.6,
                }}
              >
                <li>→ Weather charts and data dumps</li>
                <li>→ Generic lure lists</li>
                <li>→ "Figure it out yourself"</li>
                <li>→ Overwhelming choices</li>
                <li>→ No clear direction</li>
              </ul>
            </div>

            {/* The Clarity */}
            <div
              style={{
                padding: "48px 40px",
                background:
                  "linear-gradient(135deg, rgba(74, 144, 226, 0.08) 0%, rgba(74, 144, 226, 0.03) 100%)",
                borderRadius: 20,
                border: "1px solid rgba(74, 144, 226, 0.2)",
              }}
            >
              <h3
                style={{
                  fontSize: "1.4rem",
                  fontWeight: 600,
                  marginBottom: 28,
                  color: "#4A90E2",
                }}
              >
                The Clarity
              </h3>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  fontSize: "1.1rem",
                  lineHeight: 2.2,
                  opacity: 0.9,
                }}
              >
                <li>✓ Clear strategy built FROM data</li>
                <li>✓ Specific lures matched to conditions</li>
                <li>✓ Exactly what to throw and where</li>
                <li>✓ Two focused approaches</li>
                <li>✓ Clear direction, confident execution</li>
              </ul>
            </div>
          </div>

          <p
            style={{
              fontSize: "clamp(1.2rem, 2.8vw, 1.45rem)",
              textAlign: "center",
              opacity: 0.75,
              fontStyle: "italic",
              lineHeight: 1.6,
            }}
          >
            Cut through the noise. Fish with clarity.
          </p>
        </div>
      </section>

      {/* ============================================
          MOBILE PHONE MOCKUP - See The Clarity
          ============================================ */}
      <section
        style={{
          padding: "140px 24px",
        }}
      >
        <div className="container" style={{ maxWidth: 1200 }}>
          <h2
            style={{
              fontSize: "clamp(2rem, 5vw, 3rem)",
              fontWeight: 700,
              textAlign: "center",
              marginBottom: 24,
              letterSpacing: "-0.02em",
            }}
          >
            See the Clarity
          </h2>

          <p
            style={{
              fontSize: "1.2rem",
              textAlign: "center",
              opacity: 0.7,
              marginBottom: 80,
              maxWidth: 720,
              margin: "0 auto 80px",
              lineHeight: 1.6,
            }}
          >
            Complete strategic approach, ready to execute. Everything connects.
          </p>

          {/* iPhone Mockup Placeholder */}
          <div
            style={{
              maxWidth: 400,
              margin: "0 auto",
              padding: "60px 40px",
              background: "rgba(255,255,255,0.03)",
              borderRadius: 24,
              border: "2px dashed rgba(74, 144, 226, 0.3)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "4rem",
                marginBottom: 24,
                opacity: 0.3,
              }}
            >
              📱
            </div>
            <p
              style={{
                fontSize: "1.1rem",
                opacity: 0.6,
                marginBottom: 12,
              }}
            >
              iPhone Mockup Placeholder
            </p>
            <p
              style={{
                fontSize: "0.95rem",
                opacity: 0.4,
                lineHeight: 1.6,
              }}
            >
              TODO: Replace with scrolling plan screenshot showing:
              <br />• Weather section
              <br />• Pattern 1 + 2
              <br />• Lure-specific retrieves
              <br />• Download buttons
            </p>
          </div>

          <div
            style={{
              marginTop: 80,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 32,
            }}
          >
            {[
              {
                title: "Everything Connects",
                desc: "Pattern 2 complements Pattern 1. Gear matches technique. Strategic coherence.",
              },
              {
                title: "Lure-Specific Retrieves",
                desc: "Multiple ways to work each bait, matched to conditions and targets.",
              },
              {
                title: "Clear Reasoning",
                desc: "Understand why this approach works for these conditions.",
              },
              {
                title: "Mobile Optimized",
                desc: "Downloadable PDFs readable in direct sunlight.",
              },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  padding: "28px 32px",
                  background: "rgba(255,255,255,0.02)",
                  borderRadius: 14,
                  border: "1px solid rgba(255,255,255,0.08)",
                  textAlign: "center",
                }}
              >
                <h4
                  style={{
                    fontSize: "1.15rem",
                    fontWeight: 600,
                    marginBottom: 10,
                    color: "#4A90E2",
                  }}
                >
                  {item.title}
                </h4>
                <p
                  style={{
                    fontSize: "1rem",
                    opacity: 0.7,
                    lineHeight: 1.6,
                  }}
                >
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================
          EVERYWHERE YOU FISH - 1000 Lakes
          ============================================ */}
      <section
        style={{
          padding: "140px 24px",
        }}
      >
        <div className="container" style={{ maxWidth: 1000 }}>
          <h2
            style={{
              fontSize: "clamp(2rem, 5vw, 3rem)",
              fontWeight: 700,
              textAlign: "center",
              marginBottom: 24,
              letterSpacing: "-0.02em",
            }}
          >
            Clarity Everywhere You Fish
          </h2>

          <p
            style={{
              fontSize: "1.2rem",
              textAlign: "center",
              opacity: 0.7,
              marginBottom: 80,
              maxWidth: 780,
              margin: "0 auto 80px",
              lineHeight: 1.6,
            }}
          >
            1000+ lakes across all 50 states. Same clarity, different water.
          </p>

          {/* 1000 Lakes Feature */}
          <div
            style={{
              background:
                "linear-gradient(135deg, rgba(74, 144, 226, 0.08) 0%, rgba(74, 144, 226, 0.03) 100%)",
              border: "1px solid rgba(74, 144, 226, 0.2)",
              borderRadius: 20,
              padding: "56px 48px",
              marginBottom: 60,
            }}
          >
            <div
              style={{
                fontSize: "clamp(3rem, 6vw, 4.5rem)",
                fontWeight: 700,
                textAlign: "center",
                marginBottom: 24,
                background: "linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              1000+ Lakes
            </div>
            <p
              style={{
                fontSize: "1.25rem",
                textAlign: "center",
                opacity: 0.9,
                lineHeight: 1.7,
              }}
            >
              From Lake Fork to Lake Champlain. From the Delta to Lake Lanier.
              Bass Clarity delivers consistent clarity everywhere you fish.
            </p>
          </div>

          {/* Coverage Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 32,
            }}
          >
            {[
              {
                title: "All 50 States",
                desc: "Complete coverage coast to coast. Your home lake and your tournament lake.",
              },
              {
                title: "Every Season",
                desc: "Strategy adapts to seasonal patterns. What works NOW, not year-round generics.",
              },
              {
                title: "Any Conditions",
                desc: "Sunny, cloudy, windy, calm. Strategy built for YOUR conditions today.",
              },
              {
                title: "Consistent Clarity",
                desc: "Same strategic approach everywhere. New lake? Same clarity.",
              },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  padding: "32px 28px",
                  background: "rgba(255,255,255,0.02)",
                  borderRadius: 16,
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <h3
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: 600,
                    marginBottom: 12,
                    color: "#4A90E2",
                  }}
                >
                  {item.title}
                </h3>
                <p
                  style={{
                    fontSize: "1.05rem",
                    lineHeight: 1.7,
                    opacity: 0.8,
                  }}
                >
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================
          CLARITY WHEN YOU NEED IT
          ============================================ */}
      <section
        style={{
          padding: "140px 24px",
        }}
      >
        <div className="container" style={{ maxWidth: 1000 }}>
          <h2
            style={{
              fontSize: "clamp(2rem, 5vw, 3rem)",
              fontWeight: 700,
              textAlign: "center",
              marginBottom: 24,
              letterSpacing: "-0.02em",
            }}
          >
            Clarity When You Need It Most
          </h2>

          <p
            style={{
              fontSize: "1.2rem",
              textAlign: "center",
              opacity: 0.7,
              marginBottom: 80,
              maxWidth: 780,
              margin: "0 auto 80px",
              lineHeight: 1.6,
            }}
          >
            Not just before you launch. Every time you need clarity.
          </p>

          <div
            style={{
              display: "grid",
              gap: 40,
            }}
          >
            {[
              {
                title: "Before You Launch",
                desc: "Know what to bring, how to fish it, why it works. Start your day with clarity.",
              },
              {
                title: "3 Hours In, No Bites",
                desc: "Did conditions change? Generate a new plan right from the water. Check if wind, clouds, or temperature shift warrant a different approach.",
              },
              {
                title: "New Lake, Tournament Day",
                desc: "Never fished it before? Get instant clarity. Strategic approach built specifically for this water.",
              },
              {
                title: "Conditions Shift Mid-Day",
                desc: "Wind picks up. Clouds roll in. Water gets choppy. Adapt your strategy when it matters.",
              },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  padding: "40px 44px",
                  background: "rgba(255,255,255,0.02)",
                  borderRadius: 16,
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <h3
                  style={{
                    fontSize: "1.35rem",
                    fontWeight: 600,
                    marginBottom: 14,
                    color: "#4A90E2",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {item.title}
                </h3>
                <p
                  style={{
                    fontSize: "1.1rem",
                    lineHeight: 1.7,
                    opacity: 0.85,
                  }}
                >
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          <p
            style={{
              marginTop: 64,
              textAlign: "center",
              fontSize: "1.3rem",
              opacity: 0.75,
              fontStyle: "italic",
            }}
          >
            Clarity every time you need it. Not just once.
          </p>
        </div>
      </section>

      {/* ============================================
          HOW IT WORKS - What Makes It Clear
          ============================================ */}
      <section
        style={{
          padding: "140px 24px",
        }}
      >
        <div className="container" style={{ maxWidth: 1000 }}>
          <h2
            style={{
              fontSize: "clamp(2rem, 5vw, 3rem)",
              fontWeight: 700,
              textAlign: "center",
              marginBottom: 24,
              letterSpacing: "-0.02em",
            }}
          >
            What Makes Bass Clarity Clear
          </h2>

          <p
            style={{
              fontSize: "1.2rem",
              textAlign: "center",
              opacity: 0.7,
              marginBottom: 80,
              maxWidth: 760,
              margin: "0 auto 80px",
              lineHeight: 1.6,
            }}
          >
            Strategic coherence. Everything connects. Nothing contradicts.
          </p>

          <div
            style={{
              display: "grid",
              gap: 36,
            }}
          >
            {[
              {
                title: "Two Complementary Approaches",
                desc: "Not scattered tips. Two focused strategies that work together. Everything connects—your second approach complements your first, your gear matches your technique, strategy is coherent from start to finish.",
              },
              {
                title: "1000+ Lakes",
                desc: "If it's not in our database, select your water from a map. Consistent clarity everywhere—your home lake, tournament lake, or that spot you've never fished.",
              },
              {
                title: "Weather Analysis",
                desc: "Not just data displayed—analysis of how weather affects the water below. Wind direction, cloud cover, temperature trends all factor into your strategy.",
              },
              {
                title: "Lure-Specific Intelligence",
                desc: "Lures matched to your conditions. Trailer recommendations based on forage profile. Multiple retrieves per lure depending on bass temperament and activity level.",
              },
              {
                title: "Regional Seasonal Logic",
                desc: "What works NOW for your phase and region. Late-fall Texas gets different tactics than late-fall Michigan. Our seasonal data accounts for regional variation—not one-size-fits-all calendar dates.",
              },
              {
                title: "Targets + Day Progression",
                desc: "Narrow your water to specific structure types. Understand how to work secondary points vs channel swings. Day progression logic—where to start, where to go next.",
              },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  padding: "36px 40px",
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
                  {item.title}
                </h3>
                <p
                  style={{
                    fontSize: "1.1rem",
                    lineHeight: 1.7,
                    opacity: 0.8,
                  }}
                >
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          <p
            style={{
              marginTop: 64,
              textAlign: "center",
              fontSize: "1.3rem",
              opacity: 0.75,
              fontStyle: "italic",
            }}
          >
            Not scattered tips. Systematic clarity.
          </p>
        </div>
      </section>

      {/* ============================================
          FOR SERIOUS ANGLERS
          ============================================ */}
      <section
        style={{
          padding: "140px 24px",
        }}
      >
        <div className="container" style={{ maxWidth: 1000 }}>
          <h2
            style={{
              fontSize: "clamp(2rem, 5vw, 3rem)",
              fontWeight: 700,
              textAlign: "center",
              marginBottom: 24,
              letterSpacing: "-0.02em",
            }}
          >
            Clarity Under Pressure
          </h2>

          <p
            style={{
              fontSize: "1.2rem",
              textAlign: "center",
              opacity: 0.7,
              marginBottom: 80,
              maxWidth: 820,
              margin: "0 auto 80px",
              lineHeight: 1.6,
            }}
          >
            Tournament day. New lake. Tough conditions. When you need clarity
            most, Bass Clarity delivers.
          </p>

          <div
            style={{
              display: "grid",
              gap: 40,
            }}
          >
            {[
              {
                title: "Pattern Discipline",
                desc: "Not 20 random tips. Two calculated approaches that work together. Strategic discipline when it matters.",
              },
              {
                title: "Tactical Execution",
                desc: "Lure-specific retrieves applied to specific structure. How to work secondary points vs channel swings. Specific, not generic.",
              },
              {
                title: "Strategic Coherence",
                desc: "Everything connects. Your Pattern 2 doesn't contradict Pattern 1. Your gear fits your technique. Systematic clarity.",
              },
              {
                title: "Behavioral Logic",
                desc: "Targets based on where bass position in different phases. Not generic 'throw it everywhere' advice.",
              },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  padding: "36px 40px",
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
                  {item.title}
                </h3>
                <p
                  style={{
                    fontSize: "1.1rem",
                    lineHeight: 1.7,
                    opacity: 0.8,
                  }}
                >
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          <p
            style={{
              marginTop: 64,
              textAlign: "center",
              fontSize: "1.3rem",
              opacity: 0.75,
              fontStyle: "italic",
              lineHeight: 1.6,
            }}
          >
            Clarity when the pressure's on. Strategic discipline. No BS.
          </p>
        </div>
      </section>

      {/* ============================================
          PRICING SECTION
          ============================================ */}
      <section
        style={{
          padding: "140px 24px",
        }}
      >
        <div
          className="container"
          style={{
            maxWidth: 760,
            textAlign: "center",
          }}
        >
          <h2
            style={{
              fontSize: "clamp(3.5rem, 7vw, 5rem)",
              fontWeight: 700,
              marginBottom: 28,
              letterSpacing: "-0.03em",
              background: "linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            $15/month
          </h2>

          <p
            style={{
              fontSize: "1.3rem",
              lineHeight: 1.7,
              opacity: 0.85,
              marginBottom: 20,
            }}
          >
            Clarity every time you fish, everywhere you fish
          </p>

          <p
            style={{
              fontSize: "1.1rem",
              opacity: 0.6,
              marginBottom: 52,
              lineHeight: 1.8,
            }}
          >
            Less than one fishing trip.
            <br />
            Less than a Jackhammer or a Vision 110.
            <br />
            Less than one wasted Saturday guessing.
          </p>

          <Link
            className="btn primary"
            to="/subscribe"
            style={{
              fontSize: "1.2rem",
              padding: "22px 60px",
              background: "linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)",
              borderRadius: 16,
              fontWeight: 600,
              display: "inline-block",
              boxShadow: "0 8px 24px rgba(74, 144, 226, 0.3)",
            }}
          >
            Get Clarity
          </Link>

          <p
            style={{
              marginTop: 32,
              fontSize: "1rem",
              opacity: 0.5,
            }}
          >
            Cancel anytime
          </p>
        </div>
      </section>

      {/* ============================================
          FINAL CTA SECTION
          ============================================ */}
      <section
        style={{
          padding: "120px 24px 160px",
        }}
      >
        <div
          className="container"
          style={{
            maxWidth: 900,
            textAlign: "center",
          }}
        >
          <h2
            style={{
              fontSize: "clamp(2.5rem, 6vw, 4rem)",
              fontWeight: 700,
              lineHeight: 1.2,
              marginBottom: 52,
              letterSpacing: "-0.03em",
            }}
          >
            Stop guessing.
            <br />
            Start fishing with clarity.
          </h2>

          <Link
            className="btn primary"
            to="/preview"
            style={{
              fontSize: "1.2rem",
              padding: "22px 60px",
              background: "linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)",
              borderRadius: 16,
              fontWeight: 600,
              display: "inline-block",
              boxShadow: "0 8px 24px rgba(74, 144, 226, 0.3)",
            }}
          >
            Get clarity for your next trip
          </Link>

          <p
            style={{
              marginTop: 24,
              fontSize: "1rem",
              opacity: 0.5,
            }}
          >
            No credit card required
          </p>
        </div>
      </section>

      {/* ============================================
          FOOTER
          ============================================ */}
      <footer
        style={{
          padding: "60px 24px",
          background: "#0a0a0a",
          borderTop: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div
          className="container"
          style={{
            maxWidth: 1200,
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            gap: 48,
          }}
        >
          {/* Brand */}
          <div style={{ flex: "1 1 250px" }}>
            <div
              style={{
                fontSize: "1.3rem",
                fontWeight: 700,
                marginBottom: 16,
                color: "#4A90E2",
              }}
            >
              Bass Clarity
            </div>
            <p style={{ opacity: 0.6, fontSize: "0.95rem", lineHeight: 1.6 }}>
              Clarity every time you fish, everywhere you fish.
            </p>
          </div>

          {/* Links */}
          <div style={{ flex: "1 1 150px" }}>
            <h4
              style={{
                fontSize: "0.9rem",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: 20,
                opacity: 0.5,
              }}
            >
              Product
            </h4>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
                fontSize: "0.95rem",
              }}
            >
              <Link
                to="/preview"
                style={{
                  opacity: 0.7,
                  transition: "opacity 0.2s",
                }}
              >
                Try Free Sample
              </Link>
              <Link
                to="/subscribe"
                style={{
                  opacity: 0.7,
                  transition: "opacity 0.2s",
                }}
              >
                Pricing
              </Link>
            </div>
          </div>

          {/* Support */}
          <div style={{ flex: "1 1 150px" }}>
            <h4
              style={{
                fontSize: "0.9rem",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: 20,
                opacity: 0.5,
              }}
            >
              Support
            </h4>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
                fontSize: "0.95rem",
              }}
            >
              <Link
                to="/about"
                style={{
                  opacity: 0.7,
                  transition: "opacity 0.2s",
                }}
              >
                About
              </Link>
              <a
                href="mailto:support@bassclarity.com"
                style={{
                  opacity: 0.7,
                  transition: "opacity 0.2s",
                }}
              >
                Contact
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div
          style={{
            marginTop: 60,
            paddingTop: 32,
            borderTop: "1px solid rgba(255,255,255,0.06)",
            textAlign: "center",
            fontSize: "0.9rem",
            opacity: 0.4,
          }}
        >
          © 2025 Bass Clarity. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
