import React, { useState, useEffect } from "react";
import { useSignIn, useClerk } from "@clerk/clerk-react";
import { Link, useNavigate } from "react-router-dom";
import { BackIcon } from "@/components/UnifiedIcons";

export default function SignInPage() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const clerk = useClerk();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [clerkReady, setClerkReady] = useState(false);

  // Monitor Clerk loading status
  useEffect(() => {
    console.log("Clerk status check:");
    console.log("- isLoaded:", isLoaded);
    console.log("- signIn exists:", !!signIn);
    console.log("- clerk exists:", !!clerk);
    console.log("- clerk.loaded:", clerk?.loaded);

    if (isLoaded && signIn) {
      console.log("✅ Clerk is ready!");
      setClerkReady(true);
    } else {
      console.log("⏳ Waiting for Clerk...");
    }
  }, [isLoaded, signIn, clerk]);

  // Log if Clerk hasn't loaded after 5 seconds
  useEffect(() => {
    if (!isLoaded) {
      const timer = setTimeout(() => {
        console.warn("⚠️ Clerk still not loaded after 5 seconds");
        console.log(
          "This may indicate Clerk cannot initialize in the iOS wrapper",
        );
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [isLoaded]);

  const handleSignIn = async () => {
    console.log("🎣 Sign in button clicked!");
    console.log("Email:", email);
    console.log("Clerk ready:", clerkReady);
    console.log("isLoaded:", isLoaded);

    // Basic validation
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    // Check if Clerk is ready
    if (!isLoaded || !signIn) {
      setError(
        "Authentication system is still loading. Please wait 5 seconds and try again.",
      );
      console.error(
        "Clerk not ready - isLoaded:",
        isLoaded,
        "signIn:",
        !!signIn,
      );
      return;
    }

    setLoading(true);
    setError("");

    try {
      console.log("Calling signIn.create...");

      const result = await signIn.create({
        identifier: email,
        password,
      });

      console.log("Sign in result:", result);
      console.log("Result status:", result.status);

      if (result.status === "complete") {
        console.log("✅ Sign in complete! Setting session...");
        await setActive({ session: result.createdSessionId });
        console.log("✅ Session set! Navigating to /members");

        // Small delay to ensure session is fully set
        setTimeout(() => {
          navigate("/members");
        }, 500);
      } else {
        console.log("❌ Sign in incomplete. Status:", result.status);
        setError(
          `Sign in incomplete. Status: ${result.status}. Please check your email for verification.`,
        );
      }
    } catch (err: any) {
      console.error("❌ Sign in error:", err);
      console.error("Error details:", JSON.stringify(err, null, 2));

      const errorMessage =
        err.errors?.[0]?.longMessage ||
        err.errors?.[0]?.message ||
        err.message ||
        "Invalid email or password.";

      setError(errorMessage);
    } finally {
      setLoading(false);
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
      {/* --- BACKGROUND LAYERS --- */}
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
          backgroundImage: "url(/images/hero_bass.jpg)",
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

      {/* --- BACK BUTTON --- */}
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
          }}
        >
          <BackIcon size={18} />
          <span>Back</span>
        </Link>
      </div>

      {/* --- CUSTOM FORM CONTAINER --- */}
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
          Welcome Back.
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
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Clerk Status Indicator */}
            {!clerkReady && (
              <div
                style={{
                  color: "#fbbf24",
                  fontSize: "0.85rem",
                  background: "rgba(251, 191, 36, 0.1)",
                  padding: 10,
                  borderRadius: 8,
                  textAlign: "center",
                }}
              >
                ⏳ Loading authentication... (this may take a few seconds)
              </div>
            )}

            {clerkReady && (
              <div
                style={{
                  color: "#10b981",
                  fontSize: "0.85rem",
                  background: "rgba(16, 185, 129, 0.1)",
                  padding: 10,
                  borderRadius: 8,
                  textAlign: "center",
                }}
              >
                ✓ Ready to sign in
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div
                style={{
                  color: "#ff6b6b",
                  fontSize: "0.9rem",
                  background: "rgba(255,0,0,0.1)",
                  padding: 10,
                  borderRadius: 8,
                }}
              >
                {error}
              </div>
            )}

            {/* Email Input */}
            <div style={{ textAlign: "left" }}>
              <label
                style={{
                  color: "rgba(255,255,255,0.7)",
                  fontSize: "0.85rem",
                  marginBottom: 6,
                  display: "block",
                }}
              >
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(0,0,0,0.2)",
                  color: "white",
                  fontSize: "1rem",
                  outline: "none",
                }}
                disabled={loading}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSignIn();
                  }
                }}
              />
            </div>

            {/* Password Input */}
            <div style={{ textAlign: "left" }}>
              <label
                style={{
                  color: "rgba(255,255,255,0.7)",
                  fontSize: "0.85rem",
                  marginBottom: 6,
                  display: "block",
                }}
              >
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(0,0,0,0.2)",
                  color: "white",
                  fontSize: "1rem",
                  outline: "none",
                }}
                disabled={loading}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSignIn();
                  }
                }}
              />
            </div>

            {/* Submit Button */}
            <button
              type="button"
              onClick={handleSignIn}
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
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </div>

          {/* Footer Links */}
          <div
            style={{
              marginTop: 20,
              fontSize: "0.85rem",
              color: "rgba(255,255,255,0.5)",
            }}
          >
            Don't have an account?{" "}
            <Link
              to="/sign-up"
              style={{ color: "#4A90E2", textDecoration: "none" }}
            >
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
