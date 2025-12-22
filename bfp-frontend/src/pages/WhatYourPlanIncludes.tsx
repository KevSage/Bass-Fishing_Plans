import React from "react";
import { Link } from "react-router-dom";

export function WhatYourPlanIncludes() {
  return (
    <div className="container" style={{ paddingTop: 44, paddingBottom: 60 }}>
      {/* Header */}
      <section style={{ maxWidth: 720, margin: "0 auto" }}>
        <div className="kicker">What Your Plan Gets</div>
        <h1 className="h1" style={{ marginTop: 10 }}>
          What Your Plan Includes
        </h1>
        <p className="p" style={{ marginTop: 16, fontSize: "1.05em" }}>
          A Bass Fishing Plan isn't a single lure or a general recommendation.
          It's a structured read of your water, built for how bass are most likely positioned and behaving right now.
        </p>
        <p className="p" style={{ marginTop: 14 }}>
          Every plan is generated for where you're fishing today and gives you a clear framework you can commit to.
        </p>
      </section>

      <hr style={{ margin: "60px 0" }} />

      {/* Built for One Place, One Day */}
      <section className="grid2">
        <div>
          <h2 className="h2">Built for One Place, One Day</h2>
          <p className="p" style={{ marginTop: 14 }}>
            Each plan is location-specific and time-specific.
          </p>
          <p className="p" style={{ marginTop: 14 }}>
            It accounts for:
          </p>
          <ul style={{ marginTop: 12, paddingLeft: 20, lineHeight: 1.7 }}>
            <li className="p">Current conditions</li>
            <li className="p">Seasonal timing</li>
            <li className="p">How bass typically position and feed under those conditions</li>
          </ul>
        </div>
        <div className="card">
          <p className="p" style={{ fontSize: "1.05em" }}>
            This isn't global advice and it isn't recycled content.
          </p>
          <p className="p" style={{ fontSize: "1.05em", marginTop: 12, fontWeight: 500 }}>
            It's a focused interpretation of your water, that day.
          </p>
        </div>
      </section>

      <hr style={{ margin: "60px 0" }} />

      {/* Primary Pattern */}
      <section style={{ maxWidth: 720, margin: "0 auto" }}>
        <h2 className="h2">Primary Pattern</h2>
        <p className="p" style={{ marginTop: 14 }}>
          The primary pattern is the main way the plan expects bass to be caught.
        </p>
        
        <div className="card" style={{ marginTop: 20 }}>
          <div className="kicker">It includes:</div>
          <ul style={{ marginTop: 14, paddingLeft: 20, lineHeight: 1.8 }}>
            <li className="p">The core technique / presentation</li>
            <li className="p">Specific lure choices and colors that best express that presentation</li>
            <li className="p">Target areas — points, edges, transitions, and zones worth your time</li>
            <li className="p">How to fish it — cadence, positioning, and timing</li>
            <li className="p">Why it makes sense given current bass behavior</li>
          </ul>
          <p className="p" style={{ marginTop: 16, fontWeight: 500 }}>
            This is the approach the plan wants you to start with and spend time on.
          </p>
        </div>
      </section>

      <hr style={{ margin: "60px 0" }} />

      {/* Counter Pattern */}
      <section style={{ maxWidth: 720, margin: "0 auto" }}>
        <h2 className="h2">Counter Pattern</h2>
        <p className="p" style={{ marginTop: 14 }}>
          Bass don't always behave exactly as expected.
        </p>
        <p className="p" style={{ marginTop: 14 }}>
          The counter pattern exists for a different bass behavior or positioning scenario, 
          not as a backup for impatience.
        </p>
        
        <div className="card" style={{ marginTop: 20 }}>
          <div className="kicker">It provides:</div>
          <ul style={{ marginTop: 14, paddingLeft: 20, lineHeight: 1.8 }}>
            <li className="p">A contrasting presentation</li>
            <li className="p">Different water, depth, or mood</li>
            <li className="p">Clear guidance on when it becomes relevant</li>
          </ul>
          <p className="p" style={{ marginTop: 16, fontWeight: 500 }}>
            It's a deliberate alternative, not a second guess.
          </p>
        </div>
      </section>

      <hr style={{ margin: "60px 0" }} />

      {/* Targets That Matter */}
      <section className="grid2">
        <div>
          <h2 className="h2">Targets That Matter</h2>
          <p className="p" style={{ marginTop: 14 }}>
            The plan doesn't just tell you what to throw — it tells you where to spend your time.
          </p>
          <p className="p" style={{ marginTop: 14 }}>
            You'll see guidance around:
          </p>
          <ul style={{ marginTop: 12, paddingLeft: 20, lineHeight: 1.7 }}>
            <li className="p">Points</li>
            <li className="p">Breaks</li>
            <li className="p">Edges</li>
            <li className="p">Transitions</li>
            <li className="p">Zones that are likely to hold bass under current conditions</li>
          </ul>
        </div>
        <div className="card">
          <p className="p" style={{ fontSize: "1.05em", fontWeight: 500 }}>
            This is how the plan narrows the lake and keeps you from fishing everything halfway.
          </p>
        </div>
      </section>

      <hr style={{ margin: "60px 0" }} />

      {/* Gear Setup */}
      <section style={{ maxWidth: 720, margin: "0 auto" }}>
        <h2 className="h2">Gear Setup</h2>
        <p className="p" style={{ marginTop: 14 }}>
          Each plan includes concise gear guidance matched to the patterns:
        </p>
        <ul style={{ marginTop: 12, paddingLeft: 20, lineHeight: 1.7 }}>
          <li className="p">Rod type</li>
          <li className="p">Line considerations</li>
          <li className="p">Setup intent</li>
        </ul>
        <p className="p" style={{ marginTop: 14, fontStyle: "italic" }}>
          It's enough to be useful without turning into a checklist or a gear dump.
        </p>
      </section>

      <hr style={{ margin: "60px 0" }} />

      {/* Day Progression Guidance */}
      <section className="grid2">
        <div>
          <h2 className="h2">Day Progression Guidance</h2>
          <p className="p" style={{ marginTop: 14 }}>
            Fishing isn't static.
          </p>
          <p className="p" style={{ marginTop: 14 }}>
            The plan helps you understand:
          </p>
          <ul style={{ marginTop: 12, paddingLeft: 20, lineHeight: 1.7 }}>
            <li className="p">What to watch for as the day unfolds</li>
            <li className="p">What changes matter</li>
            <li className="p">When adjustments are justified</li>
            <li className="p">When consistency is still the right move</li>
          </ul>
        </div>
        <div className="card">
          <p className="p" style={{ fontSize: "1.05em", fontWeight: 500 }}>
            This keeps the plan relevant beyond the first hour.
          </p>
        </div>
      </section>

      <hr style={{ margin: "60px 0" }} />

      {/* Context, Not Just Answers */}
      <section style={{ maxWidth: 720, margin: "0 auto" }}>
        <h2 className="h2">Context, Not Just Answers</h2>
        <p className="p" style={{ marginTop: 14 }}>
          Every plan includes explanation.
        </p>
        <p className="p" style={{ marginTop: 14 }}>
          You're not just told what to do — you're shown why it fits the conditions and how bass 
          are likely responding.
        </p>
        
        <div className="card" style={{ marginTop: 20 }}>
          <p className="p">Over time, this builds understanding:</p>
          <ul style={{ marginTop: 12, paddingLeft: 20, lineHeight: 1.7 }}>
            <li className="p">Of seasonal movement</li>
            <li className="p">Of positioning</li>
            <li className="p">Of why certain approaches repeat — and when they change</li>
          </ul>
        </div>
      </section>

      <hr style={{ margin: "60px 0" }} />

      {/* What a Plan Is Not */}
      <section style={{ maxWidth: 720, margin: "0 auto" }}>
        <h2 className="h2">What a Plan Is Not</h2>
        <p className="p" style={{ marginTop: 14 }}>
          A Bass Fishing Plan is not:
        </p>
        <ul style={{ marginTop: 12, paddingLeft: 20, lineHeight: 1.7 }}>
          <li className="p">A lure list</li>
          <li className="p">A weather report</li>
          <li className="p">A collection of options</li>
          <li className="p">A promise that you'll never adjust</li>
        </ul>
        <p className="p" style={{ marginTop: 16, fontWeight: 500 }}>
          It's a disciplined starting point designed to reduce decision paralysis and help you fish with intent.
        </p>
      </section>

      <hr style={{ margin: "60px 0" }} />

      {/* The Point */}
      <section style={{ maxWidth: 640, margin: "0 auto", textAlign: "center" }}>
        <h2 className="h2">The Point</h2>
        <p className="p" style={{ marginTop: 14, fontSize: "1.05em" }}>
          The value of the plan isn't novelty.
          <br />It's clarity.
        </p>
        <p className="p" style={{ marginTop: 16, fontSize: "1.05em" }}>
          It gives you one clear way to start, one clear alternative when needed, and the confidence 
          to commit instead of second-guessing.
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
