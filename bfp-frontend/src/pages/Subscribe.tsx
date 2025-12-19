import React, { useState } from "react";

export function Subscribe() {
  const [email, setEmail] = useState("");

  return (
    <div className="container" style={{ paddingTop: 44, paddingBottom: 60 }}>
      <div className="kicker">Subscribe</div>
      <h1 className="h2" style={{ marginTop: 10 }}>Unlimited full plans — $15/month</h1>
      <p className="p" style={{ marginTop: 12 }}>
        Plans are generated on demand. No notifications. No auto-send.
      </p>

      <div className="card" style={{ marginTop: 18 }}>
        <div className="label">Email</div>
        <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        <div className="muted" style={{ marginTop: 10, fontSize: 13 }}>
          (Stripe checkout wiring goes here — frontend will redirect to your existing checkout session endpoint.)
        </div>
        <a className="btn primary" style={{ marginTop: 14 }} href="#">
          Continue to checkout →
        </a>
      </div>
    </div>
  );
}
