// src/pages/VerifyEmail.tsx
import React from "react";
import { useClerk, useSignUp } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";

export function VerifyEmail() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const { user } = useClerk();
  const navigate = useNavigate();

  const [code, setCode] = React.useState("");
  const [verifying, setVerifying] = React.useState(false);
  const [resending, setResending] = React.useState(false);
  const [resent, setResent] = React.useState(false);
  const [error, setError] = React.useState("");

  // Redirect if already verified
  React.useEffect(() => {
    if (user?.emailAddresses[0]?.verification?.status === "verified") {
      navigate("/members", { replace: true });
    }
  }, [user, navigate]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    setVerifying(true);
    setError("");

    try {
      // Use the signUp object to attempt verification
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (completeSignUp.status === "complete") {
        // Set the session as active and redirect
        await setActive({ session: completeSignUp.createdSessionId });
        navigate("/members");
      } else {
        console.error("Incomplete signup status:", completeSignUp.status);
      }
    } catch (err: any) {
      setError(
        err.errors?.[0]?.message ||
          "Verification failed. Please check the code."
      );
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!isLoaded) return;
    setResending(true);
    try {
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setResent(true);
      setTimeout(() => setResent(false), 3000);
    } catch (err) {
      console.error("Failed to resend:", err);
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
        style={{ maxWidth: 480, width: "100%", textAlign: "center" }}
      >
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: 12 }}>
          Enter Verification Code
        </h1>
        <p style={{ fontSize: "1rem", opacity: 0.8, marginBottom: 24 }}>
          We sent a code to{" "}
          <strong style={{ color: "#4A90E2" }}>{signUp?.emailAddress}</strong>
        </p>

        <form onSubmit={handleVerify}>
          <input
            type="text"
            placeholder="6-digit code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.05)",
              color: "white",
              fontSize: "1.2rem",
              textAlign: "center",
              letterSpacing: "4px",
              marginBottom: "16px",
            }}
            required
          />

          {error && (
            <p
              style={{
                color: "#ff4d4d",
                fontSize: "0.9rem",
                marginBottom: "16px",
              }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={verifying || code.length < 6}
            className="btn"
            style={{ width: "100%", marginBottom: 16 }}
          >
            {verifying ? "Verifying..." : "Verify Account"}
          </button>
        </form>

        <button
          onClick={handleResend}
          disabled={resending || resent}
          style={{
            background: "none",
            border: "none",
            color: "#4A90E2",
            cursor: "pointer",
            textDecoration: "underline",
          }}
        >
          {resent ? "Code Sent!" : "Resend Code"}
        </button>
      </div>
    </div>
  );
}
