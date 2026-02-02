import React, { useState, useEffect } from "react";
import { useSignUp, useAuth } from "@clerk/clerk-react";
import { Link, useNavigate } from "react-router-dom";
import { BackIcon } from "@/components/UnifiedIcons";

export default function SignUpPage() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const { isSignedIn } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showClerkWarning, setShowClerkWarning] = useState(false);

  // Redirect if already signed in
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      navigate("/members");
    }
  }, [isLoaded, isSignedIn, navigate]);

  // Show warning if Clerk doesn't load within 5 seconds (mobile issue)
  useEffect(() => {
    if (!isLoaded) {
      const timer = setTimeout(() => {
        setShowClerkWarning(true);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isLoaded]);

  const handleSubmit = async () => {
    // Basic validation
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    // Check if Clerk is ready
    if (!isLoaded || !signUp) {
      setError(
        "Authentication is still loading. Please wait a moment and try again.",
      );
      return;
    }

    setLoading(true);
    setError("");

    try {
      await signUp.create({
        emailAddress: email,
        password,
      });

      // Send verification email
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });

      // Show verification form
      setVerifying(true);
    } catch (err: any) {
      const errorMessage =
        err.errors?.[0]?.longMessage ||
        err.errors?.[0]?.message ||
        "Failed to create account";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!code) {
      setError("Please enter the verification code");
      return;
    }

    if (!isLoaded || !signUp) {
      setError("Please wait a moment and try again");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        navigate("/members");
      } else {
        setError("Verification incomplete. Please try again.");
      }
    } catch (err: any) {
      const errorMessage =
        err.errors?.[0]?.longMessage ||
        err.errors?.[0]?.message ||
        "Invalid verification code";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle Enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) {
      e.preventDefault();
      if (verifying) {
        handleVerify();
      } else {
        handleSubmit();
      }
    }
  };

  return (
    <section
      style={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        backgroundColor: "#0a0a0a",
      }}
    >
      {/* Background Layers */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 30% 20%, rgba(74, 144, 226, 0.08) 0%, transparent 70%)",
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "url(/images/hero_bass.png)",
          backgroundSize: "cover",
          backgroundPosition: "65% 45%",
          opacity: 1,
          filter: "brightness(0.85)",
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.8) 100%)",
          zIndex: 1,
        }}
      />

      {/* Back Button */}
      <div
        style={{
          position: "absolute",
          top: "max(20px, env(safe-area-inset-top))",
          left: 24,
          zIndex: 10,
        }}
      >
        <Link
          to="/"
          style={{
            color: "rgba(255,255,255,0.8)",
            textDecoration: "none",
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: "0.9rem",
            background: "rgba(0,0,0,0.4)",
            backdropFilter: "blur(4px)",
            padding: "8px 16px",
            borderRadius: 100,
            border: "1px solid rgba(255,255,255,0.1)",
            transition: "all 0.2s",
          }}
        >
          <BackIcon size={18} />
          <span>Back</span>
        </Link>
      </div>

      {/* Form Container */}
      <div
        className="container"
        style={{
          position: "relative",
          zIndex: 2,
          textAlign: "center",
          maxWidth: 420,
          width: "100%",
          padding: "0 20px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <h1
          style={{
            fontSize: "2.5rem",
            fontWeight: 700,
            color: "#ffffff",
            textShadow: "0 4px 24px rgba(0,0,0,0.6)",
            marginBottom: 32,
          }}
        >
          {verifying ? "Verify Email" : "Create Account"}
        </h1>

        <div
          style={{
            width: "100%",
            background: "rgba(20, 20, 25, 0.85)",
            backdropFilter: "blur(12px)",
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.08)",
            padding: 32,
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.6)",
          }}
        >
          {!verifying ? (
            // Sign Up Form
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Clerk Loading Warning */}
              {showClerkWarning && !isLoaded && (
                <div
                  style={{
                    color: "#fbbf24",
                    fontSize: "0.85rem",
                    background: "rgba(251, 191, 36, 0.1)",
                    padding: 10,
                    borderRadius: 8,
                    textAlign: "center",
                    border: "1px solid rgba(251, 191, 36, 0.2)",
                  }}
                >
                  ⏳ Authentication is taking longer than usual...
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div
                  style={{
                    color: "#ff6b6b",
                    fontSize: "0.9rem",
                    background: "rgba(255,0,0,0.1)",
                    padding: 12,
                    borderRadius: 8,
                    border: "1px solid rgba(255,107,107,0.2)",
                  }}
                >
                  {error}
                </div>
              )}

              {/* Email Input */}
              <div style={{ textAlign: "left" }}>
                <label
                  htmlFor="email"
                  style={{
                    color: "rgba(255,255,255,0.7)",
                    fontSize: "0.85rem",
                    marginBottom: 6,
                    display: "block",
                    fontWeight: 500,
                  }}
                >
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter your email"
                  autoComplete="email"
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    borderRadius: 8,
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "rgba(0,0,0,0.2)",
                    color: "white",
                    fontSize: "1rem",
                    outline: "none",
                    transition: "border-color 0.2s",
                  }}
                  disabled={loading}
                />
              </div>

              {/* Password Input */}
              <div style={{ textAlign: "left" }}>
                <label
                  htmlFor="password"
                  style={{
                    color: "rgba(255,255,255,0.7)",
                    fontSize: "0.85rem",
                    marginBottom: 6,
                    display: "block",
                    fontWeight: 500,
                  }}
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    borderRadius: 8,
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "rgba(0,0,0,0.2)",
                    color: "white",
                    fontSize: "1rem",
                    outline: "none",
                    transition: "border-color 0.2s",
                  }}
                  disabled={loading}
                  minLength={8}
                />
                <small
                  style={{
                    color: "rgba(255,255,255,0.5)",
                    fontSize: "0.75rem",
                    marginTop: 4,
                    display: "block",
                  }}
                >
                  Must be at least 8 characters
                </small>
              </div>

              {/* Submit Button */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                style={{
                  marginTop: 8,
                  width: "100%",
                  padding: "14px",
                  borderRadius: 8,
                  border: "none",
                  background: loading ? "#93c5fd" : "#4A90E2",
                  color: "white",
                  fontSize: "1rem",
                  fontWeight: 600,
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "background 0.2s",
                }}
              >
                {loading ? "Creating account..." : "Sign Up"}
              </button>

              {/* Footer Links */}
              <div
                style={{
                  marginTop: 12,
                  fontSize: "0.85rem",
                  color: "rgba(255,255,255,0.5)",
                }}
              >
                Already have an account?{" "}
                <Link
                  to="/sign-in"
                  style={{
                    color: "#4A90E2",
                    textDecoration: "none",
                    fontWeight: 500,
                  }}
                >
                  Sign In
                </Link>
              </div>
            </div>
          ) : (
            // Verification Form
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <p
                style={{
                  color: "rgba(255,255,255,0.7)",
                  fontSize: "0.9rem",
                  marginBottom: 8,
                }}
              >
                We sent a verification code to{" "}
                <strong style={{ color: "#fff" }}>{email}</strong>
              </p>

              {/* Error Message */}
              {error && (
                <div
                  style={{
                    color: "#ff6b6b",
                    fontSize: "0.9rem",
                    background: "rgba(255,0,0,0.1)",
                    padding: 12,
                    borderRadius: 8,
                    border: "1px solid rgba(255,107,107,0.2)",
                  }}
                >
                  {error}
                </div>
              )}

              {/* Verification Code Input */}
              <div style={{ textAlign: "left" }}>
                <label
                  htmlFor="code"
                  style={{
                    color: "rgba(255,255,255,0.7)",
                    fontSize: "0.85rem",
                    marginBottom: 6,
                    display: "block",
                    fontWeight: 500,
                  }}
                >
                  Verification Code
                </label>
                <input
                  id="code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter 6-digit code"
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    borderRadius: 8,
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "rgba(0,0,0,0.2)",
                    color: "white",
                    fontSize: "1rem",
                    outline: "none",
                    transition: "border-color 0.2s",
                    letterSpacing: "0.3em",
                    textAlign: "center",
                  }}
                  disabled={loading}
                  maxLength={6}
                  autoComplete="one-time-code"
                />
              </div>

              {/* Verify Button */}
              <button
                type="button"
                onClick={handleVerify}
                disabled={loading}
                style={{
                  marginTop: 8,
                  width: "100%",
                  padding: "14px",
                  borderRadius: 8,
                  border: "none",
                  background: loading ? "#93c5fd" : "#4A90E2",
                  color: "white",
                  fontSize: "1rem",
                  fontWeight: 600,
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "background 0.2s",
                }}
              >
                {loading ? "Verifying..." : "Verify Email"}
              </button>

              {/* Back to Sign Up */}
              <button
                type="button"
                onClick={() => {
                  setVerifying(false);
                  setCode("");
                  setError("");
                }}
                disabled={loading}
                style={{
                  marginTop: 4,
                  background: "none",
                  border: "none",
                  color: "#4A90E2",
                  fontSize: "0.85rem",
                  fontWeight: 500,
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                ← Back to sign up
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
