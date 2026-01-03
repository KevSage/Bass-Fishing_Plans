import React from "react";
import { Link } from "react-router-dom";

/**
 * Presentation Clarity Page
 * - Matches WeatherClarityPage structure + visual language (inline styles, calm spacing, dark gradient, soft blue accents).
 * - Uses a small "UnifiedIcon" stub (NOT emoji). Swap to your real unified icon system.
 * - Focus: Technique / Presentation intelligence (presentation family → lure/rig pairing → color guidance → plain-English reasoning).
 *
 * Routes referenced:
 *  - /subscribe
 *  - /weather-clarity
 *  - /strategic-clarity
 *  - / (landing)
 *
 * Image placeholders:
 *  - /images/iphone15.png
 *  - /images/mobile_screenshots/PatternCard.png (or update path to your real screenshot)
 */

type IconName =
  | "presentation"
  | "lure"
  | "rig"
  | "color"
  | "logic"
  | "summary"
  | "gear"
  | "arrowRight";

function UnifiedIcon({ name, size = 40 }: { name: IconName; size?: number }) {
  // Stub: Replace with your canonical unified icon component.
  // Example swap:
  //   import { UnifiedIcon } from "@/components/icons/UnifiedIcon";
  //   return <UnifiedIcon name={name} size={size} />;
  const label = (() => {
    switch (name) {
      case "presentation":
        return "PF";
      case "lure":
        return "LR";
      case "rig":
        return "RG";
      case "color":
        return "CL";
      case "logic":
        return "LG";
      case "summary":
        return "SM";
      case "gear":
        return "GR";
      case "arrowRight":
        return "→";
      default:
        return "•";
    }
  })();

  return (
    <div
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        borderRadius: 14,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(135deg, rgba(74,144,226,0.22) 0%, rgba(74,144,226,0.06) 100%)",
        border: "1px solid rgba(74,144,226,0.20)",
        boxShadow: "0 10px 26px rgba(74,144,226,0.14)",
        color: "rgba(255,255,255,0.92)",
        fontWeight: 800,
        letterSpacing: "0.08em",
        fontSize: name === "arrowRight" ? "1rem" : "0.78rem",
      }}
    >
      {label}
    </div>
  );
}

export function PresentationClarityPage() {
  // -----------------------------
  // Shared typography + layout (mirrors WeatherClarityPage)
  // -----------------------------
  const sectionPadY = "clamp(76px, 10vw, 132px)";
  const sectionPadX = "clamp(18px, 4vw, 24px)";
  const sectionPad = `${sectionPadY} ${sectionPadX}`;

  const container = (maxWidth: number) =>
    ({
      maxWidth,
      margin: "0 auto",
      width: "100%",
    } as const);

  const eyebrow = {
    fontSize: "0.82rem",
    textTransform: "uppercase" as const,
    letterSpacing: "0.14em",
    opacity: 0.75,
  } as const;

  const h1Style = {
    fontSize: "clamp(2.05rem, 5.6vw, 3.75rem)",
    fontWeight: 720,
    lineHeight: 1.12,
    letterSpacing: "-0.03em",
    margin: "14px 0 18px",
  } as const;

  const h2Style = {
    fontSize: "clamp(1.8rem, 4.6vw, 3rem)",
    fontWeight: 720,
    letterSpacing: "-0.02em",
    lineHeight: 1.18,
    margin: "0 0 18px",
    textAlign: "center" as const,
  } as const;

  const leadStyle = {
    fontSize: "clamp(1.08rem, 2.4vw, 1.28rem)",
    lineHeight: 1.75,
    opacity: 0.86,
    maxWidth: 920,
    margin: "0 auto",
    textAlign: "center" as const,
  } as const;

  const pStyle = {
    fontSize: "1.08rem",
    lineHeight: 1.85,
    opacity: 0.78,
    margin: 0,
  } as const;

  const card = {
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.03)",
    boxShadow: "0 18px 60px rgba(0,0,0,0.35)",
  } as const;

  const softCard = {
    borderRadius: 18,
    border: "1px solid rgba(74,144,226,0.16)",
    background:
      "linear-gradient(145deg, rgba(74, 144, 226, 0.06) 0%, rgba(10,10,10,0.44) 55%, rgba(74, 144, 226, 0.03) 100%)",
    boxShadow: "0 18px 60px rgba(0,0,0,0.35)",
  } as const;

  const grid2 = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))",
    gap: "clamp(22px, 5vw, 54px)",
    alignItems: "center",
  } as const;

  const pill = {
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 14px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.03)",
    fontSize: "0.95rem",
    opacity: 0.9,
  } as const;

  const smallCta = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "12px 16px",
    borderRadius: 14,
    textDecoration: "none",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.03)",
    color: "rgba(255,255,255,0.92)",
    fontWeight: 600,
    fontSize: "0.98rem",
    transition: "all 0.2s ease",
    whiteSpace: "nowrap" as const,
  } as const;

  const primaryCta = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "16px 20px",
    borderRadius: 16,
    textDecoration: "none",
    background: "linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)",
    boxShadow: "0 10px 28px rgba(74, 144, 226, 0.28)",
    color: "#fff",
    fontWeight: 700,
    fontSize: "1.05rem",
    whiteSpace: "nowrap" as const,
  } as const;

  const sectionTopBorder = "1px solid rgba(255,255,255,0.06)";

  const Bullet = ({ title, desc }: { title: string; desc: string }) => (
    <li style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
      <div
        style={{
          width: 10,
          height: 10,
          borderRadius: 999,
          marginTop: 8,
          background: "rgba(74,144,226,0.95)",
          boxShadow: "0 6px 18px rgba(74,144,226,0.22)",
          flexShrink: 0,
        }}
      />
      <div>
        <div style={{ fontWeight: 720, opacity: 0.92 }}>{title}</div>
        <div style={{ opacity: 0.78, lineHeight: 1.7 }}>{desc}</div>
      </div>
    </li>
  );

  return (
    <div
      style={{
        background: "linear-gradient(to bottom, #0a0a0a, #1a1a2e)",
        color: "#fff",
        minHeight: "100vh",
      }}
    >
      {/* HERO */}
      <section
        style={{
          padding: `clamp(54px, 8vh, 96px) ${sectionPadX} 0`,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Soft gradient wash */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 25% 18%, rgba(74, 144, 226, 0.10) 0%, transparent 68%)",
            pointerEvents: "none",
          }}
        />

        <div className="container" style={container(1100)}>
          <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
            <div style={{ ...eyebrow, color: "rgba(74,144,226,0.95)" }}>
              Technique / Presentation Clarity
            </div>

            <h1 style={h1Style}>
              Know the presentation —
              <br />
              not just the lure.
            </h1>

            <p style={{ ...leadStyle, maxWidth: 980 }}>
              Bass Clarity starts with how the bait should move and where it
              should operate in the water column. Then it selects the lure
              system, colors, and supporting details that best express that
              presentation for today.
            </p>

            <div
              style={{
                marginTop: 26,
                display: "flex",
                justifyContent: "center",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <span style={pill}>
                <UnifiedIcon name="presentation" size={26} /> Presentation
                family
              </span>
              <span style={pill}>
                <UnifiedIcon name="lure" size={26} /> Lure + rig pairing
              </span>
              <span style={pill}>
                <UnifiedIcon name="color" size={26} /> Color guidance
              </span>
              <span style={pill}>
                <UnifiedIcon name="logic" size={26} /> Plain‑English reasoning
              </span>
            </div>
          </div>

          {/* Phone + Quick explainer */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))",
              gap: "clamp(22px, 5vw, 54px)",
              alignItems: "center",
              marginTop: "clamp(34px, 6vw, 54px)",
              paddingBottom: "clamp(48px, 7vw, 72px)",
            }}
          >
            {/* Phone mock */}
            <div
              style={{ position: "relative", maxWidth: 420, margin: "0 auto" }}
            >
              <img
                src="/images/iphone15.png"
                alt="Bass Clarity on mobile"
                style={{
                  width: "100%",
                  display: "block",
                  position: "relative",
                  zIndex: 2,
                  pointerEvents: "none",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: "3.8%",
                  left: "6.9%",
                  width: "87.6%",
                  height: "92.4%",
                  borderRadius: "42px",
                  overflow: "hidden",
                  zIndex: 1,
                  background: "rgba(0,0,0,0.25)",
                }}
              >
                <img
                  src="/images/mobile_screenshots/hero_jig1.png"
                  alt="Pattern card (example)"
                  style={{
                    width: "100%",
                    height: "101%",
                    objectFit: "contain",
                    filter: "brightness(0.92) contrast(1.08) saturate(0.95)",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(to bottom, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.30) 100%)",
                  }}
                />
              </div>
            </div>

            {/* Text block */}
            <div style={{ padding: "0 4px", maxWidth: 640, margin: "0 auto" }}>
              <div style={{ ...softCard, padding: "clamp(18px, 3.5vw, 28px)" }}>
                <div
                  style={{
                    ...eyebrow,
                    marginBottom: 12,
                    color: "rgba(255,255,255,0.68)",
                  }}
                >
                  What you’ll notice
                </div>

                <div style={{ height: 14 }} />

                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    margin: 0,
                    display: "grid",
                    gap: 14,
                  }}
                >
                  <Bullet
                    title="A Clear Presentation"
                    desc="You’re not left guessing how the bait should be worked — the plan names the style first."
                  />
                  <Bullet
                    title="A Complete Lure System"
                    desc="When “the lure” requires a soft plastic or trailer, that pairing is part of the recommendation."
                  />
                  <Bullet
                    title="Two Color Options, Optimized"
                    desc="One for clearer water, one for reduced visibility — chosen from realistic, lure‑specific pools."
                  />
                </ul>

                <div style={{ height: 18 }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}

      {/* WHAT YOU SEE */}
      <section
        style={{
          padding: sectionPad,
          background: "rgba(74, 144, 226, 0.02)",
          borderTop: sectionTopBorder,
          borderBottom: sectionTopBorder,
        }}
      >
        <div className="container" style={container(1200)}>
          <h2 style={h2Style}>What you see in the pattern card</h2>
          <p style={leadStyle}>
            A few focused fields make the card glanceable. The explanation stays
            short — but it’s detailed enough to build confidence.
          </p>

          <div style={{ height: 46 }} />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 14,
            }}
          >
            {[
              {
                icon: "presentation" as IconName,
                title: "Presentation family",
                bullets: [
                  "Names the style (not just the bait).",
                  "Helps you fish it correctly on purpose.",
                  "The plan picks the movement + water column first.",
                ],
              },
              {
                icon: "lure" as IconName,
                title: "Featured Lure",
                bullets: [
                  "A specific lure type for the day.",
                  "If needed: rig + plastic or trailer pairing.",
                  "Best expresses the presentation for today’s conditions",
                ],
              },
              {
                icon: "color" as IconName,
                title: "Color guidance",
                bullets: [
                  "Two options based on visibility.",
                  "Chosen from realistic, bait-specific colors, not random.",
                  "Simple enough to act on immediately.",
                ],
              },
              {
                icon: "logic" as IconName,
                title: "Why this fits today",
                bullets: [
                  "Explains the reasoning in plain English",
                  "Connects conditions to lure behavior.",
                  "Lures always refereneced contextually, based on your local conditions",
                ],
              },
              {
                icon: "summary" as IconName,
                title: "Pattern summary",
                bullets: [
                  "The big-picture read on the day.",
                  "What the plan suggests fish may do.",
                  "Keeps expectations realistic and calm.",
                ],
              },
              {
                icon: "gear" as IconName,
                title: "Gear alignment",
                bullets: [
                  "Rod / reel / line recommendations.",
                  "Matches the presentation’s demands.",
                  "Keeps the setup coherent end‑to‑end.",
                ],
              },
            ].map((c, i) => (
              <div
                key={i}
                style={{
                  ...card,
                  padding: 18,
                  background: "rgba(255,255,255,0.02)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <UnifiedIcon name={c.icon} />
                  <div style={{ fontWeight: 780, fontSize: "1.1rem" }}>
                    {c.title}
                  </div>
                </div>

                <ul
                  style={{
                    marginTop: 14,
                    paddingLeft: 18,
                    lineHeight: 1.8,
                    opacity: 0.82,
                    fontSize: "1.02rem",
                  }}
                >
                  {c.bullets.map((b, idx) => (
                    <li key={idx}>{b}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div style={{ height: 26 }} />
        </div>
        <div
          style={{
            ...softCard,
            padding: "clamp(18px, 3.5vw, 26px)",
            maxWidth: 980,
            margin: "0 auto",
          }}
        >
          <div
            style={{
              ...eyebrow,
              marginBottom: 10,
              color: "rgba(74,144,226,0.95)",
            }}
          >
            Why this stays calm
          </div>
          <p style={{ ...pStyle, opacity: 0.86 }}>
            The plan gives you specificity without a pile of options. It names
            the presentation, picks the best expression of it, then explains the
            choice in normal language you can actually use on the water.
          </p>
        </div>
      </section>

      {/* BOTTOM NAV: next pages */}
      <section style={{ padding: sectionPad }}>
        <div className="container" style={container(1100)}>
          <h2 style={h2Style}>Next: Strategic Clarity</h2>
          <p style={leadStyle}>
            Presentation tells you how to fish the bait. Strategic Clarity turns
            the day into targets, retrieves, and a progression that feels
            executable.
          </p>

          <div style={{ height: 34 }} />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 14,
            }}
          >
            <div style={{ ...softCard, padding: 20 }}>
              <div style={{ fontWeight: 780, marginBottom: 10 }}>
                Strategic Clarity
              </div>
              <div style={{ opacity: 0.78, lineHeight: 1.7 }}>
                Targets, retrieves, and day progression — the parts that make
                the plan fishable on the water.
              </div>
              <div style={{ marginTop: 14 }}>
                <Link to="/strategy" style={smallCta}>
                  Go to Strategic Clarity{" "}
                  <span
                    style={{
                      marginLeft: 10,
                      display: "inline-flex",
                      alignItems: "center",
                    }}
                  >
                    <UnifiedIcon name="arrowRight" size={26} />
                  </span>
                </Link>
              </div>
            </div>

            <div
              style={{
                ...card,
                padding: 20,
                background: "rgba(255,255,255,0.02)",
              }}
            >
              <div style={{ fontWeight: 780, marginBottom: 10 }}>
                Weather Clarity
              </div>
              <div style={{ opacity: 0.78, lineHeight: 1.7 }}>
                The weather snapshot and tap-to-expand cards that keep the day
                readable without turning fishing into a dashboard.
              </div>
              <div style={{ marginTop: 14 }}>
                <Link to="/weather" style={smallCta}>
                  Back to Weather Clarity
                </Link>
              </div>
            </div>
          </div>

          <div style={{ height: 26 }} />

          {/* Unobtrusive subscribe footer row */}
          <div
            style={{
              marginTop: 10,
              display: "flex",
              justifyContent: "center",
              gap: 10,
              flexWrap: "wrap",
              opacity: 0.98,
            }}
          >
            <Link to="/subscribe" style={primaryCta}>
              Start Your Free Trial
            </Link>
            <Link to="/" style={smallCta}>
              Back to Landing
            </Link>
          </div>
        </div>
      </section>

      {/* Minimal footer */}
      <footer
        style={{
          padding: "48px 18px",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          opacity: 0.78,
        }}
      >
        <div className="container" style={container(1100)}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 14,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <div style={{ fontSize: "0.95rem" }}>
              © {new Date().getFullYear()} Bass Clarity
            </div>

            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              <Link to="/privacy" style={{ ...smallCta, padding: "10px 12px" }}>
                Privacy
              </Link>
              <Link to="/terms" style={{ ...smallCta, padding: "10px 12px" }}>
                Terms
              </Link>
              <Link to="/refunds" style={{ ...smallCta, padding: "10px 12px" }}>
                Refunds
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
