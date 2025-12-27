import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export function Subscribe() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address");
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
    <div className="container" style={{ paddingTop: 44, paddingBottom: 60 }}>
      <div className="kicker">Subscribe</div>
      <h1 className="h2" style={{ marginTop: 10 }}>
        Unlimited full plans — $15/month
      </h1>
      <p className="p" style={{ marginTop: 12 }}>
        Plans are generated on demand. No notifications. No auto-send.
      </p>

      <div className="card" style={{ marginTop: 18 }}>
        <form onSubmit={handleSubmit}>
          <div className="label">Email</div>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            disabled={loading}
            required
          />

          {error && (
            <div
              style={{
                marginTop: 10,
                padding: 12,
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                borderRadius: 6,
                color: "#ef4444",
                fontSize: 14,
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn primary"
            style={{ marginTop: 14, width: "100%" }}
            disabled={loading}
          >
            {loading ? "Loading..." : "Continue to checkout →"}
          </button>
        </form>

        <div className="muted" style={{ marginTop: 14, fontSize: 13 }}>
          You'll be redirected to Stripe to complete your payment securely.
        </div>
      </div>
    </div>
  );
}
