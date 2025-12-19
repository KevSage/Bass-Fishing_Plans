import React from "react";
import { Link } from "react-router-dom";

export function Landing() {
  return (
    <div className="container" style={{ paddingTop: 44, paddingBottom: 60 }}>
      <div className="grid2">
        <div>
          <div className="kicker">Bass Fishing Plans</div>
          <h1 className="h1" style={{ marginTop: 10 }}>A Clear Plan for Your Water — Every Time You Fish</h1>
          <p className="p" style={{ marginTop: 14 }}>
            Each plan is generated on demand by synthesizing your location, current conditions, and seasonal bass positioning into a single, confident approach — not generic advice, not guesswork.
          </p>
          <div className="btnRow">
            <Link className="btn primary" to="/preview">Get a plan</Link>
            <Link className="btn" to="/preview">View a preview</Link>
          </div>
        </div>

        {/* Hero screenshot placeholder (will be real Plan crop once lure masters are in) */}
        <div className="card">
          <div className="kicker">What a plan looks like</div>
          <div className="muted" style={{ marginTop: 10, fontSize: 13 }}>
            (This will be replaced by the locked hero crop: technique + lure + targets + one execution line.)
          </div>
          <div style={{ marginTop: 18, height: 360, borderRadius: 18, border: "1px solid rgba(238,242,246,0.10)", background: "rgba(238,242,246,0.03)" }} />
        </div>
      </div>

      <hr />

      <section className="grid2">
        <div>
          <h2 className="h2">Too Many Options. Not Enough Clarity.</h2>
          <p className="p" style={{ marginTop: 10 }}>
            Most anglers carry ten rods and still second-guess where to start. Bass Fishing Plans narrows the noise to a single, confident approach — so you spend less time deciding and more time fishing.
          </p>
        </div>
        <div className="card subtle">
          <div className="kicker">Simple pricing</div>
          <div style={{ fontSize: 34, marginTop: 10, letterSpacing: "-0.02em" }}>$15<span className="muted" style={{ fontSize: 14 }}>/month</span></div>
          <div className="muted" style={{ marginTop: 10, lineHeight: 1.55 }}>Unlimited plans. Cancel anytime.</div>
          <div className="btnRow">
            <Link className="btn primary" to="/subscribe">Subscribe</Link>
            <Link className="btn" to="/about">About / FAQ</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
