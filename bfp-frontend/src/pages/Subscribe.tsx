import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export function Subscribe() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    if (!agreedToTerms) {
      setError("Please agree to the Terms of Service and Privacy Policy");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/billing/subscribe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error("Failed to create checkout session");
      }

      const data = await response.json();

      if (data.checkout_url) {
        // Redirect to Stripe Checkout
        window.location.href = data.checkout_url;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (err) {
      console.error("Checkout error:", err);
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(to bottom, #0a0a0a, #1a1a2e)",
        color: "#fff",
        padding: "80px 20px 60px",
      }}
    >
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
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
            Subscribe
          </div>
          <h1
            style={{
              fontSize: "clamp(2rem, 5vw, 2.75rem)",
              fontWeight: 700,
              marginBottom: 16,
              letterSpacing: "-0.02em",
            }}
          >
            $15/month
          </h1>
          <p
            style={{
              fontSize: "1.15rem",
              lineHeight: 1.6,
              opacity: 0.8,
            }}
          >
            Unlimited plans. Cancel anytime.
          </p>
        </div>

        {/* What's Included Quick List */}
        <div
          style={{
            marginBottom: 40,
            padding: "32px",
            background:
              "linear-gradient(135deg, rgba(74, 144, 226, 0.08) 0%, rgba(10, 10, 10, 0.4) 100%)",
            borderRadius: 16,
            border: "1px solid rgba(74, 144, 226, 0.2)",
          }}
        >
          <h3
            style={{
              fontSize: "1.1rem",
              fontWeight: 600,
              marginBottom: 16,
              color: "#4A90E2",
            }}
          >
            What You Get
          </h3>
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              fontSize: "1rem",
              lineHeight: 2,
              opacity: 0.9,
              margin: 0,
            }}
          >
            <li>✓ Unlimited plan generation</li>
            <li>✓ Two complementary patterns</li>
            <li>✓ Matched gear specifications</li>
            <li>✓ Day progression guidance</li>
            <li>✓ Downloadable PDFs</li>
            <li>✓ 1000+ lakes across all 50 states</li>
          </ul>
        </div>

        {/* Subscribe Form Card */}
        <div
          style={{
            padding: "40px",
            background:
              "linear-gradient(135deg, rgba(74, 144, 226, 0.08) 0%, rgba(10, 10, 10, 0.4) 100%)",
            borderRadius: 16,
            border: "1px solid rgba(74, 144, 226, 0.2)",
          }}
        >
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 8 }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  marginBottom: 8,
                  opacity: 0.9,
                }}
              >
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={loading}
                required
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  fontSize: "1rem",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  borderRadius: 8,
                  color: "#fff",
                  outline: "none",
                  transition: "all 0.2s",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#4A90E2";
                  e.currentTarget.style.background = "rgba(74, 144, 226, 0.05)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor =
                    "rgba(255, 255, 255, 0.15)";
                  e.currentTarget.style.background =
                    "rgba(255, 255, 255, 0.05)";
                }}
              />
            </div>

            {/* Terms Checkbox */}
            <div style={{ marginTop: 20, marginBottom: 24 }}>
              <label
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "start",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  opacity: 0.8,
                }}
              >
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  required
                  style={{
                    marginTop: 4,
                    cursor: "pointer",
                    width: 16,
                    height: 16,
                    flexShrink: 0,
                  }}
                />
                <span>
                  I agree to the{" "}
                  <Link
                    to="/terms"
                    style={{ color: "#4A90E2", textDecoration: "underline" }}
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    to="/privacy"
                    style={{ color: "#4A90E2", textDecoration: "underline" }}
                  >
                    Privacy Policy
                  </Link>
                </span>
              </label>
            </div>

            {error && (
              <div
                style={{
                  marginBottom: 20,
                  padding: "14px 16px",
                  background: "rgba(239, 68, 68, 0.1)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  borderRadius: 8,
                  color: "#ef4444",
                  fontSize: "0.95rem",
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "16px 24px",
                fontSize: "1.1rem",
                fontWeight: 600,
                background: loading
                  ? "rgba(74, 144, 226, 0.5)"
                  : "linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)",
                border: "none",
                borderRadius: 12,
                color: "#fff",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.3s",
                boxShadow: loading
                  ? "none"
                  : "0 8px 24px rgba(74, 144, 226, 0.3)",
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow =
                    "0 12px 32px rgba(74, 144, 226, 0.4)";
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 8px 24px rgba(74, 144, 226, 0.3)";
                }
              }}
            >
              {loading ? "Loading..." : "Continue to Checkout →"}
            </button>
          </form>

          <div
            style={{
              marginTop: 20,
              textAlign: "center",
              fontSize: "0.9rem",
              opacity: 0.6,
            }}
          >
            You'll be redirected to Stripe to complete your payment securely.
          </div>
        </div>

        {/* Additional Info */}
        <div
          style={{
            marginTop: 40,
            textAlign: "center",
            fontSize: "0.95rem",
            opacity: 0.7,
          }}
        >
          <p style={{ marginBottom: 12 }}>
            Cancel anytime. No questions asked.
          </p>
          <p>
            Questions?{" "}
            <a
              href="mailto:support@bassclarity.com"
              style={{ color: "#4A90E2", textDecoration: "underline" }}
            >
              Contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
