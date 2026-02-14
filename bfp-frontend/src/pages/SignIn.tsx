import React, { useState, useEffect } from "react";
import { useSignIn, useAuth } from "@clerk/clerk-react";
import { Link, useNavigate } from "react-router-dom";
import { isNativePlatform } from "@/lib/platform";
import { useNativeAuth } from "@/context/NativeAuthContext";
import * as AppleSignInModule from "@capacitor-community/apple-sign-in";
import AppleIcon from "@/components/AppleIcon";

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

  // Web form state (only used on web)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showClerkWarning, setShowClerkWarning] = useState(false);

  // Apple Sign-In state (only used on native)
  const [appleSignInLoading, setAppleSignInLoading] = useState(false);

  // Scroll input into view when keyboard opens (mobile - web fallback only)
  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setTimeout(() => {
      e.target.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 300);
  };

  // Redirect if already signed in
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      navigate("/members");
    }
  }, [isLoaded, isSignedIn, navigate]);

  // Show warning if auth doesn't load within 5 seconds (web only)
  useEffect(() => {
    if (!isNative && !isLoaded) {
      const timer = setTimeout(() => {
        setShowClerkWarning(true);
      }, 5000);
      return () => clearTimeout(timer);
    } else {
      setShowClerkWarning(false);
    }
  }, [isNative, isLoaded]);

  // ============================================
  // Apple Sign-In (Native only)
  // ============================================
  const handleSignInWithApple = async () => {
    setAppleSignInLoading(true);
    setError("");

    try {
      const options = {
        clientId: "com.bassclarity.app",
        redirectURI: "https://bassclarity.com",
        scopes: "email name",
      };
      const { response } = await AppleSignInModule.SignInWithApple.authorize(options);

      if (response && response.identityToken) {
        console.log("[SignIn] Apple Sign-In successful, calling backend...");
        const result = await nativeAuth.signInWithApple(
          response.identityToken,
          response.email || "",
          response.givenName || "",
          response.familyName || ""
        );
        if (result.success) {
          navigate("/members");
        } else {
          setError(result.error || "Sign in failed. Please try again.");
        }
      } else {
        setError("Sign in failed. Please try again.");
      }
    } catch (err: any) {
      if (err.message === "Canceled" || err.message?.includes("cancel")) {
        // User cancelled - don't show error
        console.log("[SignIn] Apple Sign-In cancelled by user");
      } else {
        console.error("[SignIn] Apple Sign-In error:", err);
        setError(err.message || "Sign in failed. Please try again.");
      }
    } finally {
      setAppleSignInLoading(false);
    }
  };

  // ============================================
  // Email/Password Sign-In (Web only)
  // ============================================
  const handleWebSignIn = async () => {
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    if (!clerkIsLoaded || !signIn) {
      setError("Authentication is still loading. Please wait a moment.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Sign in with email and password together
      const result = await signIn.create({
        identifier: email,
        password,
      });

      console.log("[SignIn] Result:", {
        status: result.status,
        hasSessionId: !!result.createdSessionId
      });

      if (result.createdSessionId) {
        await setActive({ session: result.createdSessionId });
        navigate("/members");
      } else if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        navigate("/members");
      } else {
        console.error("[SignIn] Unexpected status:", result.status, result);
        setError(`Unable to sign in (status: ${result.status}). Please try again or contact support.`);
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
      handleWebSignIn();
    }
  };

  // ============================================
  // Render
  // ============================================
  return (
    <section
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        overflow: "auto",
        overflowX: "hidden",
        backgroundColor: "#0a0a0a",
        WebkitOverflowScrolling: "touch",
      }}
    >
      {/* Background Image */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage: "url(/images/hero_bass.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "65% 55%",
          filter: "brightness(0.7)",
          zIndex: 0,
        }}
      />
      {/* Gradient Overlay */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.8) 100%)",
          zIndex: 1,
        }}
      />

      {/* Spacer for vertical centering */}
      <div style={{ flex: "1 1 auto", minHeight: 40 }} />

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
          margin: "0 auto",
          flex: "0 0 auto",
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
            {isNative ? "Get Started" : "Welcome Back"}
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Error Message */}
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

            {/* ============================================ */}
            {/* NATIVE: Apple Sign-In Only */}
            {/* ============================================ */}
            {isNative && (
              <>
                <button
                  type="button"
                  onClick={handleSignInWithApple}
                  disabled={appleSignInLoading}
                  style={{
                    width: "100%",
                    padding: "16px",
                    borderRadius: 10,
                    border: "1px solid rgba(255,255,255,0.2)",
                    background: appleSignInLoading ? "rgba(0,0,0,0.5)" : "#000",
                    color: "white",
                    fontSize: "1.1rem",
                    fontWeight: 600,
                    cursor: appleSignInLoading ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                  }}
                >
                  <AppleIcon />
                  {appleSignInLoading ? "Signing in..." : "Sign in with Apple"}
                </button>

                <p
                  style={{
                    fontSize: "0.85rem",
                    color: "rgba(255,255,255,0.5)",
                    marginTop: 8,
                  }}
                >
                  Sign in or create an account instantly with your Apple ID
                </p>
              </>
            )}

            {/* ============================================ */}
            {/* WEB: Email/Password Form */}
            {/* ============================================ */}
            {!isNative && (
              <>
                {showClerkWarning && !clerkIsLoaded && (
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

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={handleKeyPress}
                  onFocus={handleInputFocus}
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
                  onFocus={handleInputFocus}
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
                  onClick={handleWebSignIn}
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

                <div
                  style={{
                    marginTop: 8,
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
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bottom spacer */}
      <div style={{ flex: "1 1 auto", minHeight: 100 }} />
    </section>
  );
}
