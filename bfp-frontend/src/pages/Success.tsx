import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useUser, SignedIn, SignedOut } from "@clerk/clerk-react";

export function Success() {
  const { user } = useUser();
  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    if (user?.primaryEmailAddress?.emailAddress) {
      setEmail(user.primaryEmailAddress.emailAddress);
    }
  }, [user?.primaryEmailAddress?.emailAddress]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #1a1a1a 0%, #0a0a0a 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div style={{ maxWidth: 800, width: "100%" }}>
        {/* Success Card */}
        <div className="card" style={{ padding: 48, textAlign: "center" }}>
          {/* Success Icon */}
          <div
            style={{
              width: 64,
              height: 64,
              background: "rgba(34, 197, 94, 0.2)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 24px",
            }}
          >
            <svg
              style={{ width: 32, height: 32, color: "#22c55e" }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          {/* Headline */}
          <h1
            style={{
              fontSize: "clamp(1.75rem, 5vw, 2rem)",
              fontWeight: 600,
              color: "#fff",
              marginBottom: 16,
            }}
          >
            Payment Successful!
          </h1>

          {/* If signed out - prompt to create account */}
          <SignedOut>
            <p
              style={{
                fontSize: "1.25rem",
                color: "rgba(255,255,255,0.8)",
                marginBottom: 32,
              }}
            >
              Now create your account to access your subscription
            </p>

            <div
              style={{
                background: "rgba(59, 130, 246, 0.1)",
                border: "1px solid rgba(59, 130, 246, 0.2)",
                borderRadius: 12,
                padding: 24,
                marginBottom: 32,
                textAlign: "left",
              }}
            >
              <h2
                style={{
                  fontSize: "1.125rem",
                  fontWeight: 600,
                  color: "#fff",
                  marginBottom: 12,
                }}
              >
                Next Step
              </h2>
              <p style={{ color: "rgba(255,255,255,0.8)", marginBottom: 16 }}>
                Sign up with the same email you used for payment to activate
                your membership.
              </p>
            </div>

            <Link
              to="/sign-up"
              className="btn primary"
              style={{ textDecoration: "none", display: "inline-block" }}
            >
              Create Account
            </Link>

            <div style={{ marginTop: 24 }}>
              <p
                style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.6)" }}
              >
                Already have an account?{" "}
                <Link
                  to="/sign-in"
                  style={{ color: "#60a5fa", textDecoration: "none" }}
                >
                  Sign in here
                </Link>
              </p>
            </div>
          </SignedOut>

          {/* If signed in - show welcome */}
          <SignedIn>
            <p
              style={{
                fontSize: "1.25rem",
                color: "rgba(255,255,255,0.8)",
                marginBottom: 32,
              }}
            >
              Your subscription is now active.
            </p>

            {/* Details */}
            <div
              className="card"
              style={{ padding: 24, marginBottom: 32, textAlign: "left" }}
            >
              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span style={{ color: "rgba(255,255,255,0.6)" }}>
                    Account
                  </span>
                  <span style={{ color: "#fff", fontWeight: 500 }}>
                    {email || "Loading..."}
                  </span>
                </div>
                <div
                  style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}
                ></div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span style={{ color: "rgba(255,255,255,0.6)" }}>Plan</span>
                  <span style={{ color: "#fff", fontWeight: 500 }}>
                    $10/month • Unlimited plans
                  </span>
                </div>
                <div
                  style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}
                ></div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span style={{ color: "rgba(255,255,255,0.6)" }}>
                    Billing
                  </span>
                  <span style={{ color: "#fff", fontWeight: 500 }}>
                    Monthly (auto-renews)
                  </span>
                </div>
              </div>
            </div>

            {/* Receipt Notice */}
            <p
              style={{
                fontSize: "0.875rem",
                color: "rgba(255,255,255,0.6)",
                marginBottom: 32,
              }}
            >
              A confirmation email with your receipt has been sent to{" "}
              <span style={{ color: "#fff" }}>{email || "your email"}</span>
            </p>

            {/* Next Steps */}
            <div
              style={{
                background: "rgba(59, 130, 246, 0.1)",
                border: "1px solid rgba(59, 130, 246, 0.2)",
                borderRadius: 12,
                padding: 24,
                marginBottom: 32,
                textAlign: "left",
              }}
            >
              <h2
                style={{
                  fontSize: "1.125rem",
                  fontWeight: 600,
                  color: "#fff",
                  marginBottom: 12,
                }}
              >
                Next Steps
              </h2>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  color: "rgba(255,255,255,0.8)",
                }}
              >
                <li style={{ display: "flex", alignItems: "flex-start" }}>
                  <span style={{ color: "#60a5fa", marginRight: 8 }}>1.</span>
                  <span>Navigate to your Members dashboard</span>
                </li>
                <li style={{ display: "flex", alignItems: "flex-start" }}>
                  <span style={{ color: "#60a5fa", marginRight: 8 }}>2.</span>
                  <span>Select your lake and fishing date</span>
                </li>
                <li style={{ display: "flex", alignItems: "flex-start" }}>
                  <span style={{ color: "#60a5fa", marginRight: 8 }}>3.</span>
                  <span>Generate your first lake-optimized strategy</span>
                </li>
              </ul>
            </div>

            {/* CTA Buttons */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 16,
                marginBottom: 32,
              }}
            >
              <Link
                to="/members"
                className="btn primary"
                style={{ textDecoration: "none" }}
              >
                Go to Members Dashboard
              </Link>
              <Link
                to="/account"
                className="btn"
                style={{ textDecoration: "none" }}
              >
                View Account
              </Link>
            </div>
          </SignedIn>

          {/* Support Link */}
          <div
            style={{
              paddingTop: 32,
              borderTop: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <p style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.6)" }}>
              Questions or need help?{" "}
              <a
                href="mailto:support@bassclarity.com"
                style={{ color: "#60a5fa", textDecoration: "none" }}
              >
                Contact support
              </a>
            </p>
          </div>
        </div>

        {/* Additional Info */}
        <SignedIn>
          <div style={{ marginTop: 24, textAlign: "center" }}>
            <p style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.5)" }}>
              You can manage your subscription anytime from your{" "}
              <Link
                to="/account"
                style={{ color: "#60a5fa", textDecoration: "none" }}
              >
                Account page
              </Link>
            </p>
          </div>
        </SignedIn>
      </div>
    </div>
  );
}
