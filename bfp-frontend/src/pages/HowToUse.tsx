import React from "react";
import { Link } from "react-router-dom";

export function HowToUse() {
  return (
    <div className="container" style={{ paddingTop: 44, paddingBottom: 60 }}>
      {/* Header */}
      <section style={{ maxWidth: 720, margin: "0 auto" }}>
        <div className="kicker">How It Works</div>
        <h1 className="h1" style={{ marginTop: 10 }}>
          How to Use Bass Fishing Plans
        </h1>
        <p className="p" style={{ marginTop: 16, fontSize: "1.05em" }}>
          Bass Fishing Plans is designed to fit naturally into how anglers already fish.
        </p>
        <p className="p" style={{ marginTop: 14 }}>
          It isn't something you manage all day.
          <br />It's something you reference briefly, then fish with intention.
        </p>
      </section>

      <hr style={{ margin: "60px 0" }} />

      {/* When to Generate a Plan */}
      <section className="grid2">
        <div>
          <h2 className="h2">When to Generate a Plan</h2>
          <p className="p" style={{ marginTop: 14 }}>
            Plans are generated when you're fishing, not days in advance.
          </p>
          <p className="p" style={{ marginTop: 14 }}>
            Most anglers request a plan:
          </p>
          <ul style={{ marginTop: 12, paddingLeft: 20, lineHeight: 1.7 }}>
            <li className="p">When they arrive at the water</li>
            <li className="p">Before launching</li>
            <li className="p">When they want a fresh read for the day</li>
          </ul>
        </div>
        <div className="card">
          <p className="p">Each plan reflects:</p>
          <ul style={{ marginTop: 12, paddingLeft: 20, lineHeight: 1.7 }}>
            <li className="p">That location</li>
            <li className="p">That moment</li>
            <li className="p">That set of conditions</li>
          </ul>
          <p className="p" style={{ marginTop: 16, fontWeight: 500 }}>
            Nothing is pushed.
            <br />Nothing updates unless you ask.
          </p>
        </div>
      </section>

      <hr style={{ margin: "60px 0" }} />

      {/* Start With the Primary Pattern */}
      <section style={{ maxWidth: 720, margin: "0 auto" }}>
        <h2 className="h2">Start With the Primary Pattern</h2>
        <p className="p" style={{ marginTop: 14 }}>
          Begin with the primary pattern.
        </p>
        
        <div className="card" style={{ marginTop: 20 }}>
          <p className="p">Fish it deliberately:</p>
          <ul style={{ marginTop: 12, paddingLeft: 20, lineHeight: 1.7 }}>
            <li className="p">Spend time in the right areas</li>
            <li className="p">Work the presentation the way it's intended</li>
            <li className="p">Pay attention to depth, positioning, and activity</li>
          </ul>
          <p className="p" style={{ marginTop: 16, fontWeight: 500 }}>
            The plan is built to be fished — not skimmed and abandoned.
          </p>
        </div>

        <p className="p" style={{ marginTop: 20 }}>
          If bass behavior aligns with the assumptions, stay committed.
        </p>
      </section>

      <hr style={{ margin: "60px 0" }} />

      {/* Use the Counter Pattern Intentionally */}
      <section className="grid2">
        <div>
          <h2 className="h2">Use the Counter Pattern Intentionally</h2>
          <p className="p" style={{ marginTop: 14 }}>
            The counter pattern isn't a reaction to a slow start.
          </p>
          <p className="p" style={{ marginTop: 14 }}>
            It's designed for a different bass behavior or positioning scenario.
          </p>
        </div>
        <div className="card">
          <p className="p">Use it when:</p>
          <ul style={{ marginTop: 12, paddingLeft: 20, lineHeight: 1.7 }}>
            <li className="p">You're executing correctly</li>
            <li className="p">You're fishing the right areas</li>
            <li className="p">But bass behavior doesn't fully match the primary pattern</li>
          </ul>
          <p className="p" style={{ marginTop: 16, fontWeight: 500 }}>
            It's a thoughtful adjustment, not a reset.
          </p>
        </div>
      </section>

      <hr style={{ margin: "60px 0" }} />

      {/* If You're Not Getting Bit */}
      <section style={{ maxWidth: 720, margin: "0 auto" }}>
        <h2 className="h2">If You're Not Getting Bit</h2>
        <p className="p" style={{ marginTop: 14 }}>
          If you've given the plan a fair window and you're fishing it correctly but not getting bit, 
          don't change everything at once.
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

        <p className="p" style={{ marginTop: 20, fontStyle: "italic" }}>
          Often, small refinements within the current approach matter more than switching patterns immediately.
        </p>
      </section>

      <hr style={{ margin: "60px 0" }} />

      {/* When to Request a New Plan */}
      <section className="grid2">
        <div>
          <h2 className="h2">When to Request a New Plan</h2>
          <p className="p" style={{ marginTop: 14 }}>
            A new plan is appropriate when:
          </p>
          <ul style={{ marginTop: 12, paddingLeft: 20, lineHeight: 1.7 }}>
            <li className="p">Conditions have changed meaningfully</li>
            <li className="p">Enough time has passed that bass positioning is likely different</li>
          </ul>
        </div>
        <div className="card">
          <p className="p">
            To encourage proper execution and prevent constant refreshing, plans have a 
            <strong> 3-hour cooldown period</strong> before regeneration is available.
          </p>
          <p className="p" style={{ marginTop: 14 }}>
            Once the cooldown has passed, you can request a fresh plan whenever it makes sense 
            for how you're fishing.
          </p>
          <p className="p" style={{ marginTop: 14, fontWeight: 500 }}>
            The goal is deliberate adjustment — not constant updates.
          </p>
        </div>
      </section>

      <hr style={{ margin: "60px 0" }} />

      {/* Viewing Your Plan */}
      <section style={{ maxWidth: 720, margin: "0 auto" }}>
        <h2 className="h2">Viewing Your Plan</h2>
        <p className="p" style={{ marginTop: 14 }}>
          Each plan includes two formats:
        </p>
        <ul style={{ marginTop: 12, paddingLeft: 20, lineHeight: 1.7 }}>
          <li className="p">A mobile-optimized dark PDF for quick reference on the water</li>
          <li className="p">A print-friendly version for review, notes, or prep</li>
        </ul>
        
        <div className="card" style={{ marginTop: 20 }}>
          <p className="p">Most anglers:</p>
          <ul style={{ marginTop: 12, paddingLeft: 20, lineHeight: 1.7 }}>
            <li className="p">Read the plan once</li>
            <li className="p">Reference it briefly</li>
            <li className="p">Put the phone away and fish</li>
          </ul>
        </div>
      </section>

      <hr style={{ margin: "60px 0" }} />

      {/* Learning Through Use */}
      <section className="grid2">
        <div>
          <h2 className="h2">Learning Through Use</h2>
          <p className="p" style={{ marginTop: 14 }}>
            Bass Fishing Plans doesn't quiz you or lecture you.
          </p>
          <p className="p" style={{ marginTop: 14 }}>
            But over time, patterns emerge:
          </p>
          <ul style={{ marginTop: 12, paddingLeft: 20, lineHeight: 1.7 }}>
            <li className="p">When consistency matters</li>
            <li className="p">When change is justified</li>
            <li className="p">How conditions influence bass positioning and behavior</li>
          </ul>
        </div>
        <div className="card">
          <p className="p" style={{ fontSize: "1.05em" }}>
            The plan doesn't replace your judgment.
          </p>
          <p className="p" style={{ fontSize: "1.05em", marginTop: 12, fontWeight: 500 }}>
            It sharpens it.
          </p>
        </div>
      </section>

      <hr style={{ margin: "60px 0" }} />

      {/* The Point */}
      <section style={{ maxWidth: 640, margin: "0 auto", textAlign: "center" }}>
        <h2 className="h2">The Point</h2>
        <p className="p" style={{ marginTop: 14, fontSize: "1.05em" }}>
          Bass Fishing Plans isn't meant to be a constant companion.
        </p>
        <p className="p" style={{ marginTop: 16, fontSize: "1.05em", fontWeight: 500 }}>
          It's meant to give you clarity — then get out of the way.
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
