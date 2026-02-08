import React, { useState, useEffect } from "react";
import { useSignIn, useAuth } from "@clerk/clerk-react";
import { Link, useNavigate } from "react-router-dom";
import { BackIcon } from "@/components/UnifiedIcons";
import { isNativePlatform } from "@/lib/platform";
import { useNativeAuth } from "@/context/NativeAuthContext";

export default function SignInPage() {
  // Clerk SDK hooks (for web)
  const { isLoaded: clerkIsLoaded, signIn, setActive } = useSignIn();
  const { isSignedIn: clerkIsSignedIn } = useAuth();

  // Native auth (for iOS/Android)
  const nativeAuth = useNativeAuth();

  // Platform-aware state
  const isNative = isNativePlatform();
  const isLoaded = isNative ? nativeAuth.isLoaded : clerkIsLoaded;
  const isSignedIn = isNative ? nativeAuth.isSignedIn : clerkIsSignedIn;

  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showClerkWarning, setShowClerkWarning] = useState(false);

  // Debug logging
  console.log("[SignIn] Platform:", isNative ? "native" : "web");
  console.log("[SignIn] isLoaded:", isLoaded, "isSignedIn:", isSignedIn);

  // On-screen debug info (temporary)
  const [showDebug, setShowDebug] = useState(true);

  // Redirect if already signed in
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      navigate("/members");
    }
  }, [isLoaded, isSignedIn, navigate]);

  // Show warning if auth doesn't load within 5 seconds
  useEffect(() => {
    if (!isLoaded) {
      const timer = setTimeout(() => {
        setShowClerkWarning(true);
      }, 5000);
      return () => clearTimeout(timer);
    } else {
      setShowClerkWarning(false);
    }
  }, [isLoaded]);

  const handleSignIn = async () => {
    // Basic validation
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    // Check if auth is ready
    if (!isLoaded) {
      setError("Authentication is still loading. Please wait a moment and try again.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (isNative) {
        // Use native direct API
        console.log("[SignIn] Using native auth...");
        const result = await nativeAuth.signIn(email, password);

        if (result.success) {
          console.log("[SignIn] Native sign-in successful");
          navigate("/members");
        } else {
          setError(result.error || "Invalid email or password");
        }
      } else {
        // Use Clerk SDK (web)
        if (!signIn) {
          setError("Authentication is still loading. Please wait a moment and try again.");
          return;
        }

        const result = await signIn.create({
          identifier: email,
          password,
        });

        console.log("Sign in result status:", result.status);
        console.log("Created session ID:", result.createdSessionId);

        if (result.createdSessionId) {
          console.log("✅ Have session ID - setting active session");
          await setActive({ session: result.createdSessionId });
          navigate("/members");
        } else if (result.status === "complete") {
          await setActive({ session: result.createdSessionId });
          navigate("/members");
        } else {
          console.error("No session ID available. Status:", result.status);
          setError(
            `Unable to sign in. Your account may need attention. Please contact support or try creating a new account.`,
          );
        }
      }
    } catch (err: any) {
      console.error("Sign in error:", err);
      const errorMessage =
        err.errors?.[0]?.longMessage ||
        err.errors?.[0]?.message ||
        err.message ||
        "Invalid email or password";

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle Enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) {
      e.preventDefault();
      handleSignIn();
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
          backgroundImage: "url(/hero_bass.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "right center",
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

      {/* Debug Panel (tap to dismiss) */}
      {showDebug && (
        <div
          onClick={() => setShowDebug(false)}
          style={{
            position: "absolute",
            top: "max(50px, env(safe-area-inset-top))",
            right: 10,
            zIndex: 100,
            background: "rgba(0,0,0,0.9)",
            padding: 10,
            borderRadius: 8,
            fontSize: 11,
            color: "#0f0",
            fontFamily: "monospace",
            maxWidth: 200,
          }}
        >
          <div>Platform: {isNative ? "NATIVE" : "WEB"}</div>
          <div>isLoaded: {isLoaded ? "YES" : "NO"}</div>
          <div>isSignedIn: {isSignedIn ? "YES" : "NO"}</div>
          {!isNative && <div>signIn exists: {signIn ? "YES" : "NO"}</div>}
          <div style={{ color: "#888", marginTop: 4 }}>tap to dismiss</div>
        </div>
      )}

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
            {/* Clerk Loading Warning (mainly for mobile) */}
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
                placeholder="Enter your password"
                autoComplete="current-password"
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
              to="/subscribe"
              style={{
                color: "#4A90E2",
                textDecoration: "none",
                fontWeight: 500,
              }}
            >
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
