import React from "react";
import { Link } from "react-router-dom";

export function About() {
  return (
    <div className="container" style={{ paddingTop: 44, paddingBottom: 60 }}>
      <div className="kicker">About</div>
      <h1 className="h2" style={{ marginTop: 10 }}>Bass Fishing Plans is a plan you can actually fish.</h1>
      <p className="p" style={{ marginTop: 12 }}>
        It synthesizes your location, current conditions, and seasonal bass positioning into one cohesive approach. No dashboards. No noise.
      </p>

      <hr />

      <div className="kicker">FAQ</div>

      <div className="card" style={{ marginTop: 14 }}>
        <div style={{ fontSize: 16 }}>Do plans generate automatically?</div>
        <div className="muted" style={{ marginTop: 8, lineHeight: 1.6 }}>No. Plans are generated only when you ask. No spam. No auto-send.</div>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <div style={{ fontSize: 16 }}>What does “unlimited” mean?</div>
        <div className="muted" style={{ marginTop: 8, lineHeight: 1.6 }}>Unlimited requests while your subscription is active. One plan per request.</div>
      </div>

      <div className="btnRow" style={{ marginTop: 18 }}>
        <Link className="btn primary" to="/preview">Get a plan</Link>
        <Link className="btn" to="/">Back home</Link>
      </div>
    </div>
  );
}
