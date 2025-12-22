import React from "react";
import { Link } from "react-router-dom";

export function FAQ() {
  return (
    <div className="container" style={{ paddingTop: 44, paddingBottom: 60 }}>
      {/* Header */}
      <section style={{ maxWidth: 720, margin: "0 auto" }}>
        <div className="kicker">FAQ</div>
        <h1 className="h1" style={{ marginTop: 10 }}>
          Frequently Asked Questions
        </h1>
      </section>

      <hr style={{ margin: "60px 0" }} />

      {/* What is Bass Fishing Plans? */}
      <section style={{ maxWidth: 720, margin: "0 auto" }}>
        <h2 className="h2">What is Bass Fishing Plans?</h2>
        <p className="p" style={{ marginTop: 14 }}>
          Bass Fishing Plans generates a location-specific bass fishing plan for the water you're fishing today.
        </p>
        <p className="p" style={{ marginTop: 14 }}>
          Each plan interprets current conditions and seasonal timing to determine how bass are most likely 
          positioned and behaving — then distills that into a clear approach you can commit to.
        </p>
        <p className="p" style={{ marginTop: 14, fontWeight: 500 }}>
          It's not about giving you more options.
          <br />It's about narrowing the water and helping you fish with intent.
        </p>
      </section>

      <hr style={{ margin: "40px 0" }} />

      {/* Is this a weather app? */}
      <section style={{ maxWidth: 720, margin: "0 auto" }}>
        <h2 className="h2">Is this a weather app?</h2>
        <p className="p" style={{ marginTop: 14 }}>
          No.
        </p>
        <p className="p" style={{ marginTop: 14 }}>
          Weather and conditions are inputs, not the product.
        </p>
        <p className="p" style={{ marginTop: 14 }}>
          Bass Fishing Plans uses those inputs to decide what matters today — where bass are likely positioned, 
          how they're feeding, and which approaches deserve your time.
        </p>
      </section>

      <hr style={{ margin: "40px 0" }} />

      {/* Why does each plan only include two patterns? */}
      <section style={{ maxWidth: 720, margin: "0 auto" }}>
        <h2 className="h2">Why does each plan only include two patterns?</h2>
        <p className="p" style={{ marginTop: 14 }}>
          Because more patterns don't lead to better decisions.
        </p>
        <p className="p" style={{ marginTop: 14 }}>
          On most days, bass are doing one primary thing, with a secondary behavior showing up if positioning 
          or activity shifts slightly.
        </p>
        
        <div className="card" style={{ marginTop: 20 }}>
          <p className="p">Each pattern already includes:</p>
          <ul style={{ marginTop: 12, paddingLeft: 20, lineHeight: 1.7 }}>
            <li className="p">Where to fish</li>
            <li className="p">How to fish it</li>
            <li className="p">What to use</li>
            <li className="p">Why it makes sense</li>
          </ul>
        </div>

        <p className="p" style={{ marginTop: 14 }}>
          Adding more options increases scrolling and second-guessing without improving clarity.
        </p>
      </section>

      <hr style={{ margin: "40px 0" }} />

      {/* Does limiting the plan to two patterns restrict how I fish? */}
      <section style={{ maxWidth: 720, margin: "0 auto" }}>
        <h2 className="h2">Does limiting the plan to two patterns restrict how I fish?</h2>
        <p className="p" style={{ marginTop: 14 }}>
          No.
        </p>
        <p className="p" style={{ marginTop: 14 }}>
          Most anglers carry multiple rods and already have other baits tied on.
        </p>
        <p className="p" style={{ marginTop: 14 }}>
          The plan gives you two optimized setups for the conditions you're fishing — a clear foundation 
          for the day — while leaving plenty of room for anything else you want to throw.
        </p>
        <p className="p" style={{ marginTop: 14, fontStyle: "italic" }}>
          Many anglers simply dedicate one or two rods to the plan and fish everything else as they normally would.
        </p>
      </section>

      <hr style={{ margin: "40px 0" }} />

      {/* Why do some plans look similar from trip to trip? */}
      <section style={{ maxWidth: 720, margin: "0 auto" }}>
        <h2 className="h2">Why do some plans look similar from trip to trip?</h2>
        <p className="p" style={{ marginTop: 14 }}>
          Because bass behavior is seasonal, not random.
        </p>
        <p className="p" style={{ marginTop: 14 }}>
          For stretches of time, conditions favor similar positioning and presentations. When that's the case, 
          the correct approach doesn't change just to introduce variety.
        </p>
        <p className="p" style={{ marginTop: 14 }}>
          As seasons progress, weather patterns shift, or conditions change meaningfully, plans evolve naturally.
        </p>
        <p className="p" style={{ marginTop: 14, fontWeight: 500 }}>
          Consistency is a feature — not a flaw.
        </p>
      </section>

      <hr style={{ margin: "40px 0" }} />

      {/* When should I expect plans to change? */}
      <section style={{ maxWidth: 720, margin: "0 auto" }}>
        <h2 className="h2">When should I expect plans to change?</h2>
        <p className="p" style={{ marginTop: 14 }}>
          You'll see changes when factors that influence bass positioning change.
        </p>
        
        <div className="card" style={{ marginTop: 20 }}>
          <p className="p">Common triggers include:</p>
          <ul style={{ marginTop: 12, paddingLeft: 20, lineHeight: 1.7 }}>
            <li className="p">Significant weather shifts</li>
            <li className="p">Cold fronts or warming trends</li>
            <li className="p">Seasonal transitions</li>
            <li className="p">Meaningful time passing since the last plan</li>
          </ul>
        </div>

        <p className="p" style={{ marginTop: 14, fontWeight: 500 }}>
          Plans change because bass behavior changes — not to rotate baits.
        </p>
      </section>

      <hr style={{ margin: "40px 0" }} />

      {/* What if I'm following the plan and not getting bit? */}
      <section style={{ maxWidth: 720, margin: "0 auto" }}>
        <h2 className="h2">What if I'm following the plan and not getting bit?</h2>
        <p className="p" style={{ marginTop: 14 }}>
          If you're executing the plan correctly and fishing the right areas, the first step isn't to request 
          a new plan.
        </p>
        
        <div className="card" style={{ marginTop: 20 }}>
          <p className="p">Use what you're observing:</p>
          <ul style={{ marginTop: 12, paddingLeft: 20, lineHeight: 1.7 }}>
            <li className="p">Depth</li>
            <li className="p">Positioning</li>
            <li className="p">Activity level</li>
            <li className="p">How bass are responding</li>
          </ul>
        </div>

        <p className="p" style={{ marginTop: 14, fontStyle: "italic" }}>
          Often, small refinements within the current approach matter more than switching entirely.
        </p>
      </section>

      <hr style={{ margin: "40px 0" }} />

      {/* When can I request a new plan? */}
      <section style={{ maxWidth: 720, margin: "0 auto" }}>
        <h2 className="h2">When can I request a new plan?</h2>
        <p className="p" style={{ marginTop: 14 }}>
          Plans can be regenerated after a <strong>3-hour cooldown period</strong>.
        </p>
        <p className="p" style={{ marginTop: 14 }}>
          This window is intentional. It gives you enough time to fish the current plan properly before 
          introducing a new set of assumptions.
        </p>
        <p className="p" style={{ marginTop: 14 }}>
          Once the cooldown has passed, you can request a fresh plan whenever it makes sense for how you're fishing.
        </p>
        <p className="p" style={{ marginTop: 14, fontWeight: 500 }}>
          The goal is deliberate adjustment — not constant refreshing.
        </p>
      </section>

      <hr style={{ margin: "40px 0" }} />

      {/* Will using Bass Fishing Plans help me learn? */}
      <section style={{ maxWidth: 720, margin: "0 auto" }}>
        <h2 className="h2">Will using Bass Fishing Plans help me learn?</h2>
        <p className="p" style={{ marginTop: 14 }}>
          Yes — indirectly.
        </p>
        
        <div className="card" style={{ marginTop: 20 }}>
          <p className="p">As you fish more plans, you'll start to recognize:</p>
          <ul style={{ marginTop: 12, paddingLeft: 20, lineHeight: 1.7 }}>
            <li className="p">How seasonal movement affects positioning</li>
            <li className="p">When consistency matters</li>
            <li className="p">When change is justified</li>
            <li className="p">Why certain approaches repeat — and when they don't</li>
          </ul>
        </div>

        <p className="p" style={{ marginTop: 14 }}>
          The plan doesn't replace your judgment.
          <br /><strong>It sharpens it.</strong>
        </p>
      </section>

      <hr style={{ margin: "40px 0" }} />

      {/* What formats do I get when I generate a plan? */}
      <section style={{ maxWidth: 720, margin: "0 auto" }}>
        <h2 className="h2">What formats do I get when I generate a plan?</h2>
        <p className="p" style={{ marginTop: 14 }}>
          Each plan includes two formats:
        </p>
        <ul style={{ marginTop: 12, paddingLeft: 20, lineHeight: 1.7 }}>
          <li className="p">A mobile-optimized dark PDF for quick reference on the water</li>
          <li className="p">A print-friendly PDF for review, notes, or prep</li>
        </ul>
        <p className="p" style={{ marginTop: 14, fontStyle: "italic" }}>
          Most anglers read the plan once, reference it briefly, and get back to fishing.
        </p>
      </section>

      <hr style={{ margin: "60px 0" }} />

      {/* The Bottom Line */}
      <section style={{ maxWidth: 640, margin: "0 auto", textAlign: "center" }}>
        <h2 className="h2">The Bottom Line</h2>
        <p className="p" style={{ marginTop: 14, fontSize: "1.05em" }}>
          Bass Fishing Plans isn't about fishing more.
          <br />It's about fishing with clarity.
        </p>
        <p className="p" style={{ marginTop: 16, fontSize: "1.05em" }}>
          If you value restraint, intention, and understanding why something works, this was built for you.
        </p>
        <div style={{ marginTop: 32 }}>
          <Link className="btn primary" to="/preview" style={{ fontSize: "1.1em", padding: "14px 32px" }}>
            Get your plan
          </Link>
        </div>
      </section>
    </div>
  );
}
