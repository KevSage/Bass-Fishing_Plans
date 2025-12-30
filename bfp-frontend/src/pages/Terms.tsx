// src/pages/Terms.tsx
import React from "react";
import { Link } from "react-router-dom";

export function Terms() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(to bottom, #0a0a0a, #1a1a2e)",
        color: "#fff",
        padding: "80px 20px 60px",
      }}
    >
      <div className="container" style={{ maxWidth: 900 }}>
        {/* Header */}
        <section style={{ textAlign: "center", marginBottom: 60 }}>
          <div
            style={{
              fontSize: "0.85rem",
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              color: "#4A90E2",
              marginBottom: 12,
              fontWeight: 600,
            }}
          >
            Legal
          </div>

          <h1
            style={{
              fontSize: "clamp(2.25rem, 5vw, 3rem)",
              fontWeight: 700,
              marginBottom: 16,
              letterSpacing: "-0.02em",
            }}
          >
            Terms of Service
          </h1>

          <p
            style={{
              fontSize: "1.05rem",
              lineHeight: 1.7,
              opacity: 0.75,
              maxWidth: 760,
              margin: "0 auto",
            }}
          >
            These Terms govern your use of Bass Clarity and any plans, content,
            or services we provide. By using the site, you agree to these Terms.
          </p>

          <div style={{ marginTop: 18, fontSize: "0.95rem", opacity: 0.6 }}>
            Effective date: <strong>TODO</strong>
          </div>
        </section>

        {/* Quick links */}
        <section
          className="card"
          style={{
            marginBottom: 28,
            background:
              "linear-gradient(135deg, rgba(74, 144, 226, 0.08) 0%, rgba(10, 10, 10, 0.4) 100%)",
            border: "1px solid rgba(74, 144, 226, 0.2)",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            <Link to="/privacy" className="btn" style={{ opacity: 0.95 }}>
              Privacy Policy
            </Link>
            <Link to="/refunds" className="btn" style={{ opacity: 0.95 }}>
              Refunds
            </Link>
            <Link to="/contact" className="btn" style={{ opacity: 0.95 }}>
              Contact
            </Link>
          </div>
          <p style={{ marginTop: 14, textAlign: "center", opacity: 0.65 }}>
            Tip: Keep these pages linked in the site footer.
          </p>
        </section>

        {/* Content blocks */}
        <section className="card" style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: "1.6rem", fontWeight: 700, marginBottom: 12 }}>
            1) What Bass Clarity Provides
          </h2>
          <p style={{ fontSize: "1.05rem", lineHeight: 1.8, opacity: 0.85 }}>
            Bass Clarity provides fishing strategy plans generated from the
            inputs you provide (such as location, date, and preferences) plus
            our internal logic and data sources. Plans are informational and
            meant to support decision-making.
          </p>
        </section>

        <section className="card" style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: "1.6rem", fontWeight: 700, marginBottom: 12 }}>
            2) No Guarantees
          </h2>
          <p style={{ fontSize: "1.05rem", lineHeight: 1.8, opacity: 0.85 }}>
            Fishing outcomes depend on many variables outside our control. We do
            not guarantee catches, tournament results, or performance.
          </p>
        </section>

        <section className="card" style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: "1.6rem", fontWeight: 700, marginBottom: 12 }}>
            3) Account, Access, and Eligibility
          </h2>
          <ul
            style={{
              marginTop: 10,
              paddingLeft: 20,
              lineHeight: 1.9,
              fontSize: "1.05rem",
              opacity: 0.85,
            }}
          >
            <li>
              You are responsible for activity on your account and for keeping
              login credentials secure.
            </li>
            <li>
              You must provide accurate information when creating an account and
              generating plans.
            </li>
            <li>
              You may not use the service in any way that violates laws or these
              Terms.
            </li>
          </ul>
        </section>

        <section className="card" style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: "1.6rem", fontWeight: 700, marginBottom: 12 }}>
            4) Subscriptions and Billing
          </h2>
          <p style={{ fontSize: "1.05rem", lineHeight: 1.8, opacity: 0.85 }}>
            If you subscribe, you authorize us (and our payment processor) to
            charge your selected payment method on a recurring basis according
            to your plan. You can manage your subscription and cancellation
            through your account.
          </p>
          <p style={{ fontSize: "1.05rem", lineHeight: 1.8, opacity: 0.85 }}>
            Refund terms are described in our{" "}
            <Link to="/refunds" style={{ color: "#4A90E2" }}>
              Refund Policy
            </Link>
            .
          </p>
        </section>

        <section className="card" style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: "1.6rem", fontWeight: 700, marginBottom: 12 }}>
            5) Acceptable Use
          </h2>
          <ul
            style={{
              marginTop: 10,
              paddingLeft: 20,
              lineHeight: 1.9,
              fontSize: "1.05rem",
              opacity: 0.85,
            }}
          >
            <li>No scraping, reverse engineering, or automated abuse.</li>
            <li>
              No attempts to disrupt the service or access private systems.
            </li>
            <li>
              No re-selling or republishing plans as your own without written
              permission.
            </li>
          </ul>
        </section>

        <section className="card" style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: "1.6rem", fontWeight: 700, marginBottom: 12 }}>
            6) Intellectual Property
          </h2>
          <p style={{ fontSize: "1.05rem", lineHeight: 1.8, opacity: 0.85 }}>
            Bass Clarity, the plan format, copy, branding, and underlying logic
            are owned by us or our licensors. You receive a limited,
            non-transferable right to access the service for personal use.
          </p>
        </section>

        <section className="card" style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: "1.6rem", fontWeight: 700, marginBottom: 12 }}>
            7) User Content and Inputs
          </h2>
          <p style={{ fontSize: "1.05rem", lineHeight: 1.8, opacity: 0.85 }}>
            You may provide inputs (like a lake selection or preferences) to
            generate plans. You are responsible for ensuring you have rights to
            any content you submit. We may use your inputs to operate and
            improve the service.
          </p>
        </section>

        <section className="card" style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: "1.6rem", fontWeight: 700, marginBottom: 12 }}>
            8) Service Availability and Changes
          </h2>
          <p style={{ fontSize: "1.05rem", lineHeight: 1.8, opacity: 0.85 }}>
            We may update, modify, or discontinue features to maintain quality
            and reliability. We may also update these Terms from time to time.
          </p>
        </section>

        <section className="card" style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: "1.6rem", fontWeight: 700, marginBottom: 12 }}>
            9) Limitation of Liability
          </h2>
          <p style={{ fontSize: "1.05rem", lineHeight: 1.8, opacity: 0.85 }}>
            To the maximum extent allowed by law, Bass Clarity is not liable for
            indirect or consequential damages, or for losses related to fishing
            outcomes, travel decisions, or reliance on plan content.
          </p>
        </section>

        <section className="card" style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: "1.6rem", fontWeight: 700, marginBottom: 12 }}>
            10) Contact
          </h2>
          <p style={{ fontSize: "1.05rem", lineHeight: 1.8, opacity: 0.85 }}>
            Questions about these Terms? Use the{" "}
            <Link to="/contact" style={{ color: "#4A90E2" }}>
              Contact page
            </Link>
            .
          </p>
        </section>

        {/* Footer CTA */}
        <section style={{ marginTop: 36, textAlign: "center" }}>
          <Link
            to="/"
            className="btn primary"
            style={{ display: "inline-block" }}
          >
            Back to Home
          </Link>

          <p style={{ marginTop: 16, opacity: 0.6 }}>
            Note: This template is a solid baseline, but it isn’t legal advice.
          </p>
        </section>
      </div>
    </div>
  );
}
