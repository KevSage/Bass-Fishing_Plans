// src/pages/FAQ.tsx
// FAQ with collapsible accordion

import React from "react";
import { Link } from "react-router-dom";
import { FAQAccordion } from "@/components/FAQAccordion";

const faqItems = [
  {
    question: "What is Bass Fishing Plans?",
    answer:
      "Bass Fishing Plans generates a location-specific bass fishing plan for the water you're fishing today. Each plan interprets current conditions and seasonal timing to determine how bass are most likely positioned and behaving — then distills that into a clear approach you can commit to. It's not about giving you more options. It's about narrowing the water and helping you fish with intent.",
  },
  {
    question: "Is this a weather app?",
    answer:
      "No. Weather and conditions are inputs, not the product. Bass Fishing Plans uses those inputs to decide what matters today — where bass are likely positioned, how they're feeding, and which approaches deserve your time.",
  },
  {
    question: "Why does each plan only include two patterns?",
    answer: (
      <>
        <p>Because more patterns don't lead to better decisions.</p>
        <p style={{ marginTop: 12 }}>
          On most days, bass are doing one primary thing, with a secondary
          behavior showing up if positioning or activity shifts slightly.
        </p>
        <p style={{ marginTop: 12 }}>Each pattern already includes:</p>
        <ul style={{ marginTop: 8, paddingLeft: 20 }}>
          <li>Where to fish</li>
          <li>How to fish it</li>
          <li>What to use</li>
          <li>Why it makes sense</li>
        </ul>
        <p style={{ marginTop: 12 }}>
          Adding more options increases scrolling and second-guessing without
          improving clarity.
        </p>
      </>
    ),
  },
  {
    question: "Does limiting the plan to two patterns restrict how I fish?",
    answer:
      "No. Most anglers carry multiple rods and already have other baits tied on. The plan gives you two optimized setups for the conditions you're fishing — a clear foundation for the day — while leaving plenty of room for anything else you want to throw. Many anglers simply dedicate one or two rods to the plan and fish everything else as they normally would.",
  },
  {
    question: "Why do some plans look similar from trip to trip?",
    answer:
      "Because bass behavior is seasonal, not random. For stretches of time, conditions favor similar positioning and presentations. When that's the case, the correct approach doesn't change just to introduce variety. As seasons progress, weather patterns shift, or conditions change meaningfully, plans evolve naturally. Consistency is a feature — not a flaw.",
  },
  {
    question: "When should I expect plans to change?",
    answer: (
      <>
        <p>
          You'll see changes when factors that influence bass positioning
          change.
        </p>
        <p style={{ marginTop: 12 }}>Common triggers include:</p>
        <ul style={{ marginTop: 8, paddingLeft: 20 }}>
          <li>Significant weather shifts</li>
          <li>Cold fronts or warming trends</li>
          <li>Seasonal transitions</li>
          <li>Meaningful time passing since the last plan</li>
        </ul>
        <p style={{ marginTop: 12 }}>
          Plans change because bass behavior changes — not to rotate baits.
        </p>
      </>
    ),
  },
  {
    question: "What if I'm following the plan and not getting bit?",
    answer: (
      <>
        <p>
          If you're executing the plan correctly and fishing the right areas,
          the first step isn't to request a new plan.
        </p>
        <p style={{ marginTop: 12 }}>Use what you're observing:</p>
        <ul style={{ marginTop: 8, paddingLeft: 20 }}>
          <li>Depth</li>
          <li>Positioning</li>
          <li>Activity level</li>
          <li>How bass are responding</li>
        </ul>
        <p style={{ marginTop: 12 }}>
          Often, small refinements within the current approach matter more than
          switching entirely.
        </p>
      </>
    ),
  },
  {
    question: "When can I request a new plan?",
    answer:
      "Plans can be regenerated after a 3-hour cooldown period. This window is intentional. It gives you enough time to fish the current plan properly before introducing a new set of assumptions. Once the cooldown has passed, you can request a fresh plan whenever it makes sense for how you're fishing. The goal is deliberate adjustment — not constant refreshing.",
  },
  {
    question: "Will using Bass Fishing Plans help me learn?",
    answer: (
      <>
        <p>Yes — indirectly.</p>
        <p style={{ marginTop: 12 }}>
          As you fish more plans, you'll start to recognize:
        </p>
        <ul style={{ marginTop: 8, paddingLeft: 20 }}>
          <li>How seasonal movement affects positioning</li>
          <li>When consistency matters</li>
          <li>When change is justified</li>
          <li>Why certain approaches repeat — and when they don't</li>
        </ul>
        <p style={{ marginTop: 12 }}>
          The plan doesn't replace your judgment.{" "}
          <strong>It sharpens it.</strong>
        </p>
      </>
    ),
  },
  {
    question: "What formats do I get when I generate a plan?",
    answer:
      "Each plan includes two formats: a mobile-optimized dark PDF for quick reference on the water, and a print-friendly PDF for review, notes, or prep. Most anglers read the plan once, reference it briefly, and get back to fishing.",
  },
];

export function FAQ() {
  return (
    <div className="container" style={{ paddingTop: 44, paddingBottom: 60 }}>
      {/* Header */}
      <section style={{ maxWidth: 720, margin: "0 auto", textAlign: "center" }}>
        <div className="kicker">FAQ</div>
        <h1 className="h1" style={{ marginTop: 10 }}>
          Frequently Asked Questions
        </h1>
        <p className="p" style={{ marginTop: 16, opacity: 0.8 }}>
          Everything you need to know about Bass Fishing Plans
        </p>
      </section>

      <div style={{ marginTop: 48, maxWidth: 800, margin: "48px auto 0" }}>
        <FAQAccordion items={faqItems} />
      </div>

      <hr style={{ margin: "60px 0" }} />

      {/* The Bottom Line */}
      <section style={{ maxWidth: 640, margin: "0 auto", textAlign: "center" }}>
        <h2 className="h2">The Bottom Line</h2>
        <p className="p" style={{ marginTop: 14, fontSize: "1.05em" }}>
          Bass Fishing Plans isn't about fishing more.
          <br />
          It's about fishing with clarity.
        </p>
        <p className="p" style={{ marginTop: 16, fontSize: "1.05em" }}>
          If you value restraint, intention, and understanding why something
          works, this was built for you.
        </p>
        <div style={{ marginTop: 32 }}>
          <Link
            className="btn primary"
            to="/preview"
            style={{ fontSize: "1.1em", padding: "14px 32px" }}
          >
            Get your plan
          </Link>
        </div>
      </section>
    </div>
  );
}
