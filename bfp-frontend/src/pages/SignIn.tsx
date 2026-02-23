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

  // Second factor verification state
  const [needsSecondFactor, setNeedsSecondFactor] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");

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
      const errorMsg = err.message || "";
      // User cancelled - error 1001 is Apple's "user canceled" code
      const isCancelled =
        errorMsg === "Canceled" ||
        errorMsg.includes("cancel") ||
        errorMsg.includes("1001") ||
        errorMsg.includes("AuthorizationError");

      if (isCancelled) {
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
        hasSessionId: !!result.createdSessionId,
        secondFactors: result.supportedSecondFactors
      });

      if (result.createdSessionId) {
        await setActive({ session: result.createdSessionId });
        navigate("/members");
      } else if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        navigate("/members");
      } else if (result.status === "needs_second_factor") {
        // Need to verify with email code
        const emailFactor = result.supportedSecondFactors?.find(
          (factor: any) => factor.strategy === "email_code"
        );

        if (emailFactor) {
          await signIn.prepareSecondFactor({
            strategy: "email_code",
          });
          setNeedsSecondFactor(true);
          setError("");
        } else {
          // Check for other factors like phone_code
          const phoneFactor = result.supportedSecondFactors?.find(
            (factor: any) => factor.strategy === "phone_code"
          );
          if (phoneFactor) {
            await signIn.prepareSecondFactor({
              strategy: "phone_code",
            });
            setNeedsSecondFactor(true);
            setError("");
          } else {
            console.error("[SignIn] No supported second factor:", result.supportedSecondFactors);
            setError("Additional verification required but no supported method available.");
          }
        }
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
      if (needsSecondFactor) {
        handleVerifyCode();
      } else {
        handleWebSignIn();
      }
    }
  };

  // Verify second factor code
  const handleVerifyCode = async () => {
    if (!verificationCode) {
      setError("Please enter the verification code");
      return;
    }

    if (!signIn) {
      setError("Authentication error. Please refresh and try again.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await signIn.attemptSecondFactor({
        strategy: "email_code",
        code: verificationCode,
      });

      console.log("[SignIn] Second factor result:", {
        status: result.status,
        hasSessionId: !!result.createdSessionId
      });

      if (result.status === "complete" && result.createdSessionId) {
        await setActive({ session: result.createdSessionId });
        navigate("/members");
      } else {
        setError("Verification failed. Please try again.");
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

  // ============================================
  // Render
  // ============================================

  // Native: Premium minimal design (position:fixed to cover nav bar)
  if (isNative) {
    return (
      <section
        style={{
          position: "fixed",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(180deg, #081321 0%, #0B1A2E 100%)",
          zIndex: 9999,
          overflow: "hidden",
        }}
      >
        {/* Radial focus field behind logo */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(ellipse at 50% 40%, rgba(0, 170, 255, 0.14) 0%, rgba(0, 170, 255, 0.06) 35%, rgba(10, 22, 38, 0) 70%)",
            pointerEvents: "none",
          }}
        />

        {/* Content container */}
        <div
          style={{
            position: "relative",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            paddingTop: "env(safe-area-inset-top)",
            paddingBottom: "env(safe-area-inset-bottom)",
          }}
        >
          {/* Logo + Typography - positioned at 42% from top */}
          <div
            style={{
              position: "absolute",
              top: "42%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              width: "100%",
              padding: "0 24px",
            }}
          >
            {/* Logo Mark */}
            <img
              src="/images/splash-logo.png"
              alt="Bass Clarity"
              style={{
                width: "50%",
                minWidth: 160,
                maxWidth: 260,
                height: "auto",
              }}
            />

            {/* Title */}
            <h1
              style={{
                marginTop: 28,
                fontSize: "32px",
                fontWeight: 600,
                color: "#FFFFFF",
                letterSpacing: "0.5px",
                textAlign: "center",
              }}
            >
              Bass Clarity
            </h1>

            {/* Subtitle */}
            <p
              style={{
                marginTop: 10,
                fontSize: "16px",
                fontWeight: 400,
                color: "#A9B4C6",
                opacity: 0.88,
                lineHeight: "22px",
                textAlign: "center",
              }}
            >
              AI-Powered Fishing Intelligence
            </p>
          </div>

          {/* CTA Section - positioned near bottom */}
          <div
            style={{
              position: "absolute",
              bottom: "calc(env(safe-area-inset-bottom) + 80px)",
              left: 0,
              right: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "0 24px",
            }}
          >
            {/* Error Message */}
            {error && (
              <div
                style={{
                  color: "#ff6b6b",
                  fontSize: "14px",
                  background: "rgba(255,107,107,0.1)",
                  padding: 12,
                  borderRadius: 8,
                  marginBottom: 16,
                  width: "100%",
                  maxWidth: 420,
                  textAlign: "center",
                }}
              >
                {error}
              </div>
            )}

            {/* Apple Sign In Button */}
            <button
              type="button"
              onClick={handleSignInWithApple}
              disabled={appleSignInLoading}
              style={{
                width: "100%",
                maxWidth: 420,
                height: 54,
                borderRadius: 14,
                border: "1px solid rgba(255, 255, 255, 0.06)",
                background: appleSignInLoading ? "rgba(0,0,0,0.7)" : "#000000",
                color: "#FFFFFF",
                fontSize: "17px",
                fontWeight: 600,
                cursor: appleSignInLoading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                boxShadow: "0 10px 24px rgba(0, 0, 0, 0.45)",
              }}
            >
              <AppleIcon />
              {appleSignInLoading ? "Signing in..." : "Sign in with Apple"}
            </button>

            {/* Supporting Text */}
            <p
              style={{
                marginTop: 16,
                fontSize: "13px",
                fontWeight: 400,
                color: "#6E7C91",
                opacity: 0.9,
                textAlign: "center",
              }}
            >
              Secure. Private. No spam.
            </p>
          </div>
        </div>
      </section>
    );
  }

  // Web: Original design with email/password
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
            Welcome Back
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
            {/* WEB: Email/Password Form */}
            {/* ============================================ */}
            {!needsSecondFactor && (
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

            {/* ============================================ */}
            {/* WEB: Verification Code Input */}
            {/* ============================================ */}
            {needsSecondFactor && (
              <>
                <p
                  style={{
                    fontSize: "0.9rem",
                    color: "rgba(255,255,255,0.7)",
                    marginBottom: 8,
                  }}
                >
                  We sent a verification code to your email. Please enter it below.
                </p>

                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  onKeyPress={handleKeyPress}
                  onFocus={handleInputFocus}
                  placeholder="Enter code"
                  autoComplete="one-time-code"
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    borderRadius: 10,
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "rgba(255,255,255,0.08)",
                    color: "white",
                    fontSize: "1.1rem",
                    textAlign: "center",
                    letterSpacing: "0.2em",
                    outline: "none",
                  }}
                />

                <button
                  type="button"
                  onClick={handleVerifyCode}
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
                  {loading ? "Verifying..." : "Verify Code"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setNeedsSecondFactor(false);
                    setVerificationCode("");
                    setError("");
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "rgba(255,255,255,0.5)",
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    marginTop: 8,
                  }}
                >
                  ← Back to sign in
                </button>
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
