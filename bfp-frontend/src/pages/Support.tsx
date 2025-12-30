// src/pages/Support.tsx
import React from "react";
import { Link } from "react-router-dom";

export function SupportPage() {
  return (
    <div className="page">
      <main className="page__main">
        <section className="page__hero">
          <div className="container">
            <h1 className="h1">Support</h1>
            <p className="muted">
              Quick help, clear answers. If something isn’t working, we’ll fix
              it.
            </p>
          </div>
        </section>

        <section className="page__section">
          <div className="container">
            <div className="grid" style={{ gap: 16 }}>
              {/* Primary contact */}
              <div className="card">
                <h2 className="h2">Contact</h2>
                <p className="muted" style={{ marginTop: 8 }}>
                  Email is the fastest way to reach us.
                </p>

                <div style={{ marginTop: 16 }}>
                  <a
                    className="btn primary"
                    href="mailto:support@bassclarity.com"
                  >
                    Email support@bassclarity.com
                  </a>
                </div>

                <div style={{ marginTop: 14 }}>
                  <p className="muted" style={{ marginBottom: 6 }}>
                    Include:
                  </p>
                  <ul className="muted" style={{ lineHeight: 1.8 }}>
                    <li>Your account email</li>
                    <li>What page you were on (or what you clicked)</li>
                    <li>What you expected vs what happened</li>
                    <li>A screenshot if possible</li>
                  </ul>
                </div>
              </div>

              {/* Common issues */}
              <div className="card">
                <h2 className="h2">Common Issues</h2>

                <div className="prose" style={{ marginTop: 10 }}>
                  <h3>Plan won’t generate</h3>
                  <p className="muted">
                    Refresh the page and try again. If it still fails, email
                    support with the lake and date you selected.
                  </p>

                  <h3>Can’t access after subscribing</h3>
                  <p className="muted">
                    Make sure you’re signed into the same email you used at
                    checkout. If you’re unsure, email support and we’ll help
                    match access.
                  </p>

                  <h3>Billing or cancellation question</h3>
                  <p className="muted">
                    See our{" "}
                    <Link className="link" to="/refunds">
                      Refund &amp; Cancellation Policy
                    </Link>
                    . If you think there’s an error, email us with the charge
                    date and amount.
                  </p>
                </div>
              </div>

              {/* Response expectations */}
              <div className="card">
                <h2 className="h2">Response Time</h2>
                <p className="muted" style={{ marginTop: 8, lineHeight: 1.8 }}>
                  We typically respond within <strong>24–48 hours</strong>.
                  During peak periods (weekends / major weather shifts), it may
                  take a bit longer.
                </p>
              </div>

              {/* Helpful links */}
              <div className="card">
                <h2 className="h2">Helpful Links</h2>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 10,
                    marginTop: 12,
                  }}
                >
                  <Link className="btn" to="/faq">
                    FAQ
                  </Link>
                  <Link className="btn" to="/how-to-use">
                    How to Use
                  </Link>
                  <Link className="btn" to="/privacy">
                    Privacy Policy
                  </Link>
                  <Link className="btn" to="/terms">
                    Terms of Service
                  </Link>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 22 }}>
              <p className="muted" style={{ textAlign: "center" }}>
                If you’re stuck, email us. We’ll get you back on track.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
