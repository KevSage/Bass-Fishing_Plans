// src/pages/VerifyEmail.tsx
import React from "react";
import { useClerk } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";

export function VerifyEmail() {
  const { user } = useClerk();
  const navigate = useNavigate();
  const [resending, setResending] = React.useState(false);
  const [resent, setResent] = React.useState(false);

  // If user is already verified, redirect to members
  React.useEffect(() => {
    if (user?.emailAddresses[0]?.verification?.status === "verified") {
      navigate("/members", { replace: true });
    }
  }, [user, navigate]);

  const handleResend = async () => {
    setResending(true);
    try {
      await user?.emailAddresses[0]?.prepareVerification({
        strategy: "email_code",
      });
      setResent(true);
      setTimeout(() => setResent(false), 3000);
    } catch (error) {
      console.error("Failed to resend:", error);
    } finally {
      setResending(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(to bottom, #0a0a0a, #1a1a2e)",
        padding: "20px",
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: 480,
          width: "100%",
          textAlign: "center",
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: 80,
            height: 80,
            margin: "0 auto 24px",
            background: "linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 8px 24px rgba(74, 144, 226, 0.3)",
          }}
        >
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
        </div>

        {/* Title */}
        <h1
          style={{
            fontSize: "1.75rem",
            fontWeight: 700,
            marginBottom: 12,
          }}
        >
          Check Your Email
        </h1>

        {/* Description */}
        <p
          style={{
            fontSize: "1rem",
            opacity: 0.8,
            lineHeight: 1.6,
            marginBottom: 24,
          }}
        >
          We've sent a verification link to{" "}
          <strong style={{ color: "#4A90E2" }}>
            {user?.emailAddresses[0]?.emailAddress}
          </strong>
        </p>

        {/* Instructions */}
        <div
          style={{
            background: "rgba(74, 144, 226, 0.1)",
            border: "1px solid rgba(74, 144, 226, 0.2)",
            borderRadius: 12,
            padding: "16px 20px",
            marginBottom: 24,
            textAlign: "left",
          }}
        >
          <p
            style={{
              fontSize: "0.9rem",
              opacity: 0.9,
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            Click the link in the email to verify your account and start
            generating fishing plans. The link will expire in 24 hours.
          </p>
        </div>

        {/* Resend Button */}
        <button
          onClick={handleResend}
          disabled={resending || resent}
          className="btn"
          style={{
            width: "100%",
            marginBottom: 16,
            background: resent
              ? "rgba(76, 175, 80, 0.2)"
              : "rgba(255, 255, 255, 0.05)",
            border: resent
              ? "1px solid rgba(76, 175, 80, 0.3)"
              : "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          {resent ? "✓ Email Sent!" : resending ? "Sending..." : "Resend Email"}
        </button>

        {/* Divider */}
        <div
          style={{
            height: 1,
            background: "rgba(255, 255, 255, 0.1)",
            margin: "24px 0",
          }}
        />

        {/* Help Text */}
        <p
          style={{
            fontSize: "0.85rem",
            opacity: 0.6,
            lineHeight: 1.6,
          }}
        >
          Didn't receive the email? Check your spam folder or{" "}
          <button
            onClick={handleResend}
            style={{
              background: "none",
              border: "none",
              color: "#4A90E2",
              textDecoration: "underline",
              cursor: "pointer",
              padding: 0,
              fontSize: "inherit",
            }}
          >
            resend verification email
          </button>
          .
        </p>
      </div>
    </div>
  );
}
