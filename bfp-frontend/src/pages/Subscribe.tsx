// src/pages/Subscribe.tsx
import React, { useState } from "react";
import { useAuth, useUser, SignInButton } from "@clerk/clerk-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export function Subscribe() {
  const { isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const token = await getToken();

      // Call our new SECURE endpoint
      const response = await fetch(`${API_BASE}/billing/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Pass the identity proof
        },
      });

      if (!response.ok) throw new Error("Failed to start checkout");

      const data = await response.json();
      if (data.url) {
        // Redirect to Stripe
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Checkout error:", err);
      alert("Something went wrong initializing payment. Please try again.");
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
            $10/month
          </h1>
          <p style={{ fontSize: "1.15rem", lineHeight: 1.6, opacity: 0.8 }}>
            Unlimited plans. Cancel anytime.
          </p>
        </div>

        {/* Benefits List */}
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
            <li>✓ 1000+ lakes across all 50 states</li>
          </ul>
        </div>

        {/* ACTION CARD */}
        <div
          style={{
            padding: "40px",
            background: "rgba(255, 255, 255, 0.03)",
            borderRadius: 16,
            border: "1px solid rgba(255, 255, 255, 0.1)",
            textAlign: "center",
          }}
        >
          {!isSignedIn ? (
            // STATE 1: GUEST USER (Auth First)
            <div>
              <h3 style={{ fontSize: "1.1rem", marginBottom: 12 }}>
                Step 1: Create Account
              </h3>
              <p
                style={{
                  opacity: 0.7,
                  marginBottom: 24,
                  fontSize: "0.95rem",
                }}
              >
                Create a free account to link your subscription.
              </p>

              <SignInButton mode="modal">
                <button
                  style={{
                    width: "100%",
                    padding: "16px 24px",
                    fontSize: "1.1rem",
                    fontWeight: 600,
                    background: "#fff",
                    color: "#000",
                    border: "none",
                    borderRadius: 12,
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  Sign Up / Log In
                </button>
              </SignInButton>
            </div>
          ) : (
            // STATE 2: LOGGED IN USER (Payment Second)
            <div>
              <div style={{ marginBottom: 24 }}>
                <div
                  style={{
                    fontSize: "0.85rem",
                    opacity: 0.5,
                    marginBottom: 4,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Logged in as
                </div>
                <div
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: 600,
                    color: "#fff",
                  }}
                >
                  {user?.primaryEmailAddress?.emailAddress}
                </div>
              </div>

              <button
                onClick={handleSubscribe}
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "16px 24px",
                  fontSize: "1.1rem",
                  fontWeight: 600,
                  background: loading
                    ? "rgba(74, 144, 226, 0.3)"
                    : "linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)",
                  border: "none",
                  borderRadius: 12,
                  color: "#fff",
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                  boxShadow: "0 8px 24px rgba(74, 144, 226, 0.25)",
                }}
              >
                {loading ? "Preparing Checkout..." : "Proceed to Payment →"}
              </button>

              <p
                style={{
                  marginTop: 16,
                  fontSize: "0.85rem",
                  opacity: 0.5,
                }}
              >
                Secure payment via Stripe
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
