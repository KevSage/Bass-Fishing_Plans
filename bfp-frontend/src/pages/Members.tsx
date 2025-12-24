import { useEffect, useState } from "react";
import { useAuth, UserButton } from "@clerk/clerk-react";
import { useMemberStatus } from "../hooks/userMemberStatus";

export function Members() {
  const { getToken } = useAuth();
  const { status, loading, error, refetch } = useMemberStatus();

  const handleSubscribe = async () => {
    if (!status?.email) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/billing/subscribe`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: status.email }),
        }
      );

      const data = await response.json();
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      }
    } catch (err) {
      console.error("Subscribe error:", err);
    }
  };

  const formatTimeRemaining = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days} day${days === 1 ? "" : "s"}`;
    }
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <div
        className="container"
        style={{ paddingTop: 80, textAlign: "center" }}
      >
        <div style={{ fontSize: "1.2em", opacity: 0.7 }}>Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="container"
        style={{ paddingTop: 80, textAlign: "center" }}
      >
        <div className="card" style={{ maxWidth: 500, margin: "0 auto" }}>
          <h2 style={{ color: "#ff6b6b", marginBottom: 16 }}>Error</h2>
          <p style={{ opacity: 0.8, marginBottom: 24 }}>{error}</p>
          <button onClick={refetch} className="btn primary">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", paddingBottom: 60 }}>
      {/* Header */}
      <div
        style={{
          borderBottom: "1px solid rgba(238,242,246,0.10)",
          background: "rgba(10,10,10,0.95)",
        }}
      >
        <div
          className="container"
          style={{
            paddingTop: 20,
            paddingBottom: 20,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h1 style={{ fontSize: "1.5em", fontWeight: 700, margin: 0 }}>
            Member Dashboard
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontSize: "0.9em", opacity: 0.7 }}>
              {status?.email}
            </span>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container" style={{ paddingTop: 40, maxWidth: 900 }}>
        {/* Membership Status */}
        <div className="card">
          <h2 style={{ fontSize: "2em", fontWeight: 700, marginBottom: 24 }}>
            {status?.is_member ? "Active Member" : "Free Account"}
          </h2>

          {status?.is_member ? (
            <div
              style={{
                background: "rgba(78, 205, 196, 0.1)",
                border: "2px solid rgba(78, 205, 196, 0.3)",
                borderRadius: 12,
                padding: 24,
                marginBottom: 24,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 16,
                }}
              >
                <span style={{ fontSize: "1.5em" }}>✅</span>
                <span style={{ fontSize: "1.2em", fontWeight: 600 }}>
                  Premium Member
                </span>
              </div>
              <ul style={{ margin: 0, paddingLeft: 24, lineHeight: 1.8 }}>
                <li>Unlimited plan generations</li>
                <li>Advanced AI insights (Pattern 2)</li>
                <li>Elite lure recommendations</li>
                <li>Detailed cover strategies</li>
              </ul>
            </div>
          ) : (
            <div
              style={{
                background: "rgba(74, 144, 226, 0.1)",
                border: "2px solid rgba(74, 144, 226, 0.3)",
                borderRadius: 12,
                padding: 24,
                marginBottom: 24,
              }}
            >
              <h3
                style={{
                  fontSize: "1.3em",
                  fontWeight: 600,
                  marginBottom: 16,
                }}
              >
                Upgrade to Premium - $15/month
              </h3>
              <ul style={{ margin: 0, paddingLeft: 24, lineHeight: 1.8 }}>
                <li>
                  <strong>Unlimited Plans:</strong> Generate as many plans as
                  you want (3-hour cooldown)
                </li>
                <li>
                  <strong>Advanced AI Insights:</strong> Get Pattern 2 analysis
                  with elite lure specs
                </li>
                <li>
                  <strong>Instant Access:</strong> View plans immediately, no
                  email wait
                </li>
              </ul>
              <button
                onClick={handleSubscribe}
                className="btn primary"
                style={{
                  width: "100%",
                  marginTop: 20,
                  padding: "14px 24px",
                  fontSize: "1.1em",
                }}
              >
                Subscribe Now
              </button>
            </div>
          )}

          {/* Rate Limit Status */}
          {status?.is_member && (
            <div>
              <h3
                style={{
                  fontSize: "1.2em",
                  fontWeight: 600,
                  marginBottom: 16,
                }}
              >
                Plan Generation
              </h3>
              {status.rate_limit_allowed ? (
                <div
                  style={{
                    background: "rgba(78, 205, 196, 0.1)",
                    border: "1px solid rgba(78, 205, 196, 0.2)",
                    borderRadius: 8,
                    padding: 16,
                  }}
                >
                  <p style={{ margin: 0, marginBottom: 12 }}>
                    ✓ Ready to generate a new plan
                  </p>
                  <a
                    href="/preview"
                    className="btn primary"
                    style={{ textDecoration: "none" }}
                  >
                    Generate Plan
                  </a>
                </div>
              ) : (
                <div
                  style={{
                    background: "rgba(255, 230, 109, 0.1)",
                    border: "1px solid rgba(255, 230, 109, 0.2)",
                    borderRadius: 8,
                    padding: 16,
                  }}
                >
                  <p style={{ margin: 0 }}>
                    Next plan available in:{" "}
                    <strong>
                      {formatTimeRemaining(status.rate_limit_seconds)}
                    </strong>
                  </p>
                  <p
                    style={{
                      margin: 0,
                      marginTop: 8,
                      fontSize: "0.9em",
                      opacity: 0.7,
                    }}
                  >
                    Members can generate unlimited plans with a 3-hour cooldown
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Free Tier Info */}
          {!status?.is_member && (
            <div
              style={{
                borderTop: "1px solid rgba(255,255,255,0.1)",
                paddingTop: 24,
                marginTop: 24,
              }}
            >
              <h3
                style={{
                  fontSize: "1.2em",
                  fontWeight: 600,
                  marginBottom: 12,
                }}
              >
                Free Preview
              </h3>
              <p style={{ opacity: 0.8, marginBottom: 12 }}>
                You can still try our service with limited access:
              </p>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: 24,
                  lineHeight: 1.6,
                  opacity: 0.7,
                }}
              >
                <li>One preview plan every 30 days</li>
                <li>Basic Pattern 1 analysis only</li>
                <li>Plan delivered via email</li>
              </ul>
              <a
                href="/preview"
                className="btn"
                style={{
                  marginTop: 16,
                  display: "inline-block",
                  textDecoration: "none",
                }}
              >
                Try Preview →
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
