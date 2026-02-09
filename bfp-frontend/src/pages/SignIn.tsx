import React, { useState, useEffect } from "react";
import { useSignIn, useAuth } from "@clerk/clerk-react";
import { Link, useNavigate } from "react-router-dom";
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
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    if (!isLoaded) {
      setError("Authentication is still loading. Please wait a moment.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (isNative) {
        const result = await nativeAuth.signIn(email, password);
        if (result.success) {
          navigate("/members");
        } else {
          setError(result.error || "Invalid email or password");
        }
      } else {
        if (!signIn) {
          setError("Authentication is still loading. Please wait a moment.");
          return;
        }

        const result = await signIn.create({
          identifier: email,
          password,
        });

        if (result.createdSessionId) {
          await setActive({ session: result.createdSessionId });
          navigate("/members");
        } else if (result.status === "complete") {
          await setActive({ session: result.createdSessionId });
          navigate("/members");
        } else {
          setError("Unable to sign in. Please contact support.");
        }
      }
    } catch (err: any) {
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) {
      e.preventDefault();
      handleSignIn();
    }
  };

  return (
    <section
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        backgroundColor: "#0a0a0a",
      }}
    >
      {/* Background Image - positioned like Landing page hero */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "url(/images/hero_bass.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "65% 45%",
          filter: "brightness(0.7)",
          zIndex: 0,
        }}
      />
      {/* Gradient Overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.8) 100%)",
          zIndex: 1,
        }}
      />

      {/* Form Container */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          textAlign: "center",
          maxWidth: 400,
          width: "100%",
          padding: "0 24px",
          paddingTop: "env(safe-area-inset-top)",
        }}
      >
        {/* Branding */}
        <h1
          style={{
            fontSize: "2.2rem",
            fontWeight: 700,
            color: "#ffffff",
            textShadow: "0 4px 24px rgba(0,0,0,0.6)",
            marginBottom: 8,
          }}
        >
          Bass Clarity
        </h1>
        <p
          style={{
            fontSize: "1rem",
            color: "rgba(255,255,255,0.7)",
            marginBottom: 32,
          }}
        >
          AI-Powered Fishing Intelligence
        </p>

        {/* Form Card */}
        <div
          style={{
            background: "rgba(15, 15, 18, 0.92)",
            borderRadius: 20,
            border: "1px solid rgba(255,255,255,0.08)",
            padding: 24,
          }}
        >
          <h2
            style={{
              fontSize: "1.3rem",
              fontWeight: 600,
              color: "#fff",
              marginBottom: 20,
            }}
          >
            Welcome Back
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {showClerkWarning && !isLoaded && (
              <div
                style={{
                  color: "#fbbf24",
                  fontSize: "0.85rem",
                  background: "rgba(251, 191, 36, 0.1)",
                  padding: 12,
                  borderRadius: 8,
                  textAlign: "center",
                }}
              >
                Authentication is taking longer than usual...
              </div>
            )}

            {error && (
              <div
                style={{
                  color: "#ff6b6b",
                  fontSize: "0.9rem",
                  background: "rgba(255,107,107,0.1)",
                  padding: 12,
                  borderRadius: 8,
                }}
              >
                {error}
              </div>
            )}

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Email address"
              autoComplete="email"
              disabled={loading}
              style={{
                width: "100%",
                padding: "14px 16px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.08)",
                color: "white",
                fontSize: "1rem",
                outline: "none",
              }}
            />

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Password"
              autoComplete="current-password"
              disabled={loading}
              style={{
                width: "100%",
                padding: "14px 16px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.08)",
                color: "white",
                fontSize: "1rem",
                outline: "none",
              }}
            />

            <button
              type="button"
              onClick={handleSignIn}
              disabled={loading}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: 10,
                border: "none",
                background: loading ? "rgba(74,144,226,0.5)" : "#4A90E2",
                color: "white",
                fontSize: "1rem",
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                marginTop: 4,
              }}
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </div>

          <div
            style={{
              marginTop: 20,
              fontSize: "0.9rem",
              color: "rgba(255,255,255,0.5)",
            }}
          >
            New here?{" "}
            <Link
              to="/subscribe"
              style={{
                color: "#4A90E2",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              Subscribe
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
