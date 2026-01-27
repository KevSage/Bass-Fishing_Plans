import React, { useState, useEffect } from "react";
import { useAuth, useUser, SignInButton } from "@clerk/clerk-react";
import { Link, useNavigate } from "react-router-dom"; // Added Link/useNavigate

// Ensure this points to your real backend
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export function Subscribe() {
  const { isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [isMember, setIsMember] = useState(false);

  // 1. NEW: Check if user is already a member when the page loads
  useEffect(() => {
    if (isSignedIn) {
      const checkStatus = async () => {
        setCheckingStatus(true);
        try {
          const token = await getToken();
          const res = await fetch(`${API_BASE}/members/status`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            setIsMember(data.is_member);
          }
        } catch (err) {
          console.error("Failed to check status", err);
        } finally {
          setCheckingStatus(false);
        }
      };
      checkStatus();
    }
  }, [isSignedIn, getToken]);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const token = await getToken();

      // Call our new SECURE endpoint
      const response = await fetch(`${API_BASE}/billing/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Pass the user's proof of identity
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
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div
            style={{
              fontSize: "0.85rem",
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              color: "#4A90E2",
              marginBottom: 12,
              fontWeight: 700,
            }}
          >
            Bass Clarity Pro
          </div>
          <h1
            style={{
              fontSize: "clamp(2.5rem, 5vw, 3.5rem)",
              fontWeight: 800,
              marginBottom: 16,
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              background: "linear-gradient(180deg, #fff 0%, #a5a5a5 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Unlock the Water.
          </h1>
          <p
            style={{
              fontSize: "1.2rem",
              lineHeight: 1.6,
              opacity: 0.7,
              maxWidth: "480px",
              margin: "0 auto",
            }}
          >
            Get the full arsenal: AI strategies, real-time weather safety, and
            unlimited scouting for <strong>$10/month</strong>.
          </p>
        </div>

        {/* Benefits List */}
        <div
          style={{
            marginBottom: 40,
            padding: "32px",
            background:
              "linear-gradient(135deg, rgba(74, 144, 226, 0.08) 0%, rgba(10, 10, 10, 0.4) 100%)",
            borderRadius: 24,
            border: "1px solid rgba(74, 144, 226, 0.2)",
            boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
          }}
        >
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            {[
              "Unlimited AI Scouting Reports",
              "Works on ANY Water (Custom Lakes Supported)",
              "Live Wind, Gust & Safety Analysis",
              "Primary & Secondary Pattern Breakdowns",
              "Tournament-Grade Gear Recommendations",
              "Smart Catch Log & History",
            ].map((item, i) => (
              <li
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  fontSize: "1.05rem",
                  opacity: 0.9,
                }}
              >
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: "#4A90E2",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="4"
                  >
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* ACTION CARD */}
        <div
          style={{
            padding: "40px",
            background: "rgba(255, 255, 255, 0.03)",
            borderRadius: 24,
            border: "1px solid rgba(255, 255, 255, 0.08)",
            textAlign: "center",
          }}
        >
          {!isSignedIn ? (
            // STATE 1: GUEST USER
            <div>
              <h3
                style={{ fontSize: "1.2rem", marginBottom: 8, fontWeight: 700 }}
              >
                Step 1: Create Your Profile
              </h3>
              <p
                style={{ opacity: 0.6, marginBottom: 24, fontSize: "0.95rem" }}
              >
                Secure your data and history with a free account.
              </p>

              <SignInButton mode="modal">
                <button
                  style={{
                    width: "100%",
                    padding: "18px 24px",
                    fontSize: "1.1rem",
                    fontWeight: 700,
                    background: "#fff",
                    color: "#000",
                    border: "none",
                    borderRadius: 16,
                    cursor: "pointer",
                    transition: "all 0.2s",
                    boxShadow: "0 4px 20px rgba(255,255,255,0.15)",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.transform = "translateY(-2px)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.transform = "translateY(0)")
                  }
                >
                  Create Account / Log In
                </button>
              </SignInButton>
            </div>
          ) : isMember ? (
            // STATE 3: ALREADY A MEMBER (NEW)
            <div>
              <div style={{ marginBottom: 24 }}>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    background: "rgba(34, 197, 94, 0.1)",
                    color: "#4ade80",
                    padding: "6px 16px",
                    borderRadius: 99,
                    fontSize: "0.85rem",
                    fontWeight: 700,
                  }}
                >
                  <span>✓</span> Active Member
                </div>
                <div
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: 600,
                    color: "#fff",
                    marginTop: 16,
                  }}
                >
                  {user?.primaryEmailAddress?.emailAddress}
                </div>
              </div>

              <Link to="/members">
                <button
                  style={{
                    width: "100%",
                    padding: "18px 24px",
                    fontSize: "1.1rem",
                    fontWeight: 700,
                    background: "rgba(255, 255, 255, 0.1)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    borderRadius: 16,
                    color: "#fff",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background =
                      "rgba(255, 255, 255, 0.15)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background =
                      "rgba(255, 255, 255, 0.1)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  Go to Your Water →
                </button>
              </Link>

              <p style={{ marginTop: 16, fontSize: "0.85rem", opacity: 0.4 }}>
                You are already subscribed.{" "}
                <Link to="/account" style={{ color: "#4A90E2" }}>
                  Manage Billing
                </Link>
              </p>
            </div>
          ) : (
            // STATE 2: LOGGED IN BUT NOT PAID
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
                  style={{ fontSize: "1.1rem", fontWeight: 600, color: "#fff" }}
                >
                  {user?.primaryEmailAddress?.emailAddress}
                </div>
              </div>

              <button
                onClick={handleSubscribe}
                disabled={loading || checkingStatus}
                style={{
                  width: "100%",
                  padding: "18px 24px",
                  fontSize: "1.1rem",
                  fontWeight: 700,
                  background:
                    loading || checkingStatus
                      ? "rgba(74, 144, 226, 0.3)"
                      : "linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)",
                  border: "none",
                  borderRadius: 16,
                  color: "#fff",
                  cursor: loading || checkingStatus ? "not-allowed" : "pointer",
                  transition: "all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                  boxShadow:
                    "0 10px 30px rgba(74, 144, 226, 0.25), inset 0 1px 1px rgba(255,255,255,0.2)",
                }}
                onMouseEnter={(e) => {
                  if (!loading && !checkingStatus)
                    e.currentTarget.style.transform =
                      "translateY(-2px) scale(1.01)";
                }}
                onMouseLeave={(e) => {
                  if (!loading && !checkingStatus)
                    e.currentTarget.style.transform = "translateY(0) scale(1)";
                }}
              >
                {checkingStatus
                  ? "Verifying..."
                  : loading
                    ? "Preparing Checkout..."
                    : "Activate Subscription →"}
              </button>

              <p style={{ marginTop: 16, fontSize: "0.85rem", opacity: 0.4 }}>
                Secure payment via Stripe. Cancel anytime in your account.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
