import React, { useState, useEffect } from "react";
import { useAuth, useUser, useSignUp } from "@clerk/clerk-react";
import { Link, useNavigate } from "react-router-dom";
import { isNativePlatform } from "@/lib/platform";
import { useNativeAuth } from "@/context/NativeAuthContext";
import * as AppleSignInModule from "@capacitor-community/apple-sign-in";
import AppleIcon from "@/components/AppleIcon";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

// Pro features list - shared between platforms
const PRO_FEATURES = [
  "Unlimited Lake Scouting on ANY Water",
  "Unlimited AI Generated Plans for Any Location",
  "Customized Lure/Gear Recommendations",
  "Full Day Strategy. Any Location, Any Time",
  "Smart Catch Log & History",
  "Your Insights including Personal Best, Productive Lakes/Lures/Techniques",
];

export function Subscribe() {
  const isNative = isNativePlatform();
  const navigate = useNavigate();

  // ============================================
  // NATIVE: Apple Sign-In Flow
  // ============================================
  if (isNative) {
    return <NativeSubscribePage navigate={navigate} />;
  }

  // ============================================
  // WEB: Clerk + Stripe Flow
  // ============================================
  return <WebSubscribePage navigate={navigate} />;
}

// ============================================
// NATIVE SUBSCRIBE PAGE (Apple Sign-In + Apple IAP)
// ============================================
function NativeSubscribePage({ navigate }: { navigate: (path: string) => void }) {
  const nativeAuth = useNativeAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Redirect if already signed in
  useEffect(() => {
    if (nativeAuth.isSignedIn) {
      navigate("/members");
    }
  }, [nativeAuth.isSignedIn, navigate]);

  const handleSignInWithApple = async () => {
    setLoading(true);
    setError("");

    try {
      const options = {
        clientId: "com.bassclarity.app",
        redirectURI: "https://bassclarity.com",
        scopes: "email name",
      };
      const { response } = await AppleSignInModule.SignInWithApple.authorize(options);

      if (response && response.identityToken) {
        console.log("[Subscribe] Apple Sign-In successful, calling backend...");
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
        console.log("[Subscribe] Apple Sign-In cancelled by user");
      } else {
        console.error("[Subscribe] Apple Sign-In error:", err);
        setError(err.message || "Sign in failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(to bottom, #0a0a0a, #1a1a2e)",
        color: "#fff",
        padding: "60px 20px 40px",
        paddingTop: "calc(60px + env(safe-area-inset-top))",
      }}
    >
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div
            style={{
              fontSize: "0.85rem",
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              color: "#4A90E2",
              marginBottom: 12,
              fontWeight: 700,
            }}
          >
            Bass Clarity Pro
          </div>
          <h1
            style={{
              fontSize: "clamp(2rem, 5vw, 3rem)",
              fontWeight: 800,
              marginBottom: 16,
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              background: "linear-gradient(180deg, #fff 0%, #a5a5a5 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Unlock the Water.
          </h1>
          <p
            style={{
              fontSize: "1.1rem",
              lineHeight: 1.6,
              opacity: 0.7,
              maxWidth: "400px",
              margin: "0 auto",
            }}
          >
            AI-powered fishing intelligence at your fingertips.
          </p>
        </div>

        {/* Benefits List */}
        <div
          style={{
            marginBottom: 32,
            padding: "24px",
            background:
              "linear-gradient(135deg, rgba(74, 144, 226, 0.08) 0%, rgba(10, 10, 10, 0.4) 100%)",
            borderRadius: 20,
            border: "1px solid rgba(74, 144, 226, 0.2)",
          }}
        >
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            {PRO_FEATURES.map((item, i) => (
              <li
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  fontSize: "0.95rem",
                  opacity: 0.9,
                }}
              >
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: "#4A90E2",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="4"
                  >
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Action Card */}
        <div
          style={{
            padding: "32px 24px",
            background: "rgba(255, 255, 255, 0.03)",
            borderRadius: 20,
            border: "1px solid rgba(255, 255, 255, 0.08)",
            textAlign: "center",
          }}
        >
          <h3
            style={{
              fontSize: "1.2rem",
              marginBottom: 8,
              fontWeight: 700,
            }}
          >
            Get Started
          </h3>
          <p
            style={{
              opacity: 0.6,
              marginBottom: 24,
              fontSize: "0.95rem",
            }}
          >
            Sign in with Apple to access all features
          </p>

          {error && (
            <div
              style={{
                color: "#ff6b6b",
                fontSize: "0.9rem",
                background: "rgba(255,107,107,0.1)",
                padding: 12,
                borderRadius: 8,
                marginBottom: 16,
              }}
            >
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleSignInWithApple}
            disabled={loading}
            style={{
              width: "100%",
              padding: "16px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.2)",
              background: loading ? "rgba(0,0,0,0.5)" : "#000",
              color: "white",
              fontSize: "1.1rem",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
            }}
          >
            <AppleIcon />
            {loading ? "Signing in..." : "Sign in with Apple"}
          </button>

          <p
            style={{
              fontSize: "0.8rem",
              color: "rgba(255,255,255,0.4)",
              marginTop: 16,
            }}
          >
            Creates an account or signs you in instantly
          </p>

          <div
            style={{
              marginTop: 20,
              paddingTop: 20,
              borderTop: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <Link
              to="/sign-in"
              style={{
                color: "#4A90E2",
                fontSize: "0.9rem",
                textDecoration: "none",
              }}
            >
              Already have an account? Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// WEB SUBSCRIBE PAGE (Clerk + Stripe)
// ============================================
function WebSubscribePage({ navigate }: { navigate: (path: string) => void }) {
  const { isSignedIn: clerkIsSignedIn, getToken: clerkGetToken } = useAuth();
  const { user: clerkUser } = useUser();
  const { isLoaded: clerkIsLoaded, signUp, setActive } = useSignUp();

  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);

  // Sign up form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [code, setCode] = useState("");

  // Check if user is already a member
  useEffect(() => {
    if (clerkIsSignedIn) {
      const checkStatus = async () => {
        setCheckingStatus(true);
        try {
          const token = await clerkGetToken();
          const res = await fetch(`${API_BASE}/members/status`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            setIsMember(data.is_member);
            const subStatus = data.subscription_status;
            setHasActiveSubscription(
              subStatus === "active" || subStatus === "trialing"
            );
          }
        } catch (err) {
          console.error("Failed to check status", err);
        } finally {
          setCheckingStatus(false);
        }
      };
      checkStatus();
    }
  }, [clerkIsSignedIn, clerkGetToken]);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const token = await clerkGetToken();
      const response = await fetch(`${API_BASE}/billing/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to start checkout");
      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Checkout error:", err);
      alert("Something went wrong initializing payment. Please try again.");
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (!clerkIsLoaded || !signUp) {
        setError("Authentication is still loading. Please wait a moment.");
        setLoading(false);
        return;
      }

      await signUp.create({
        emailAddress: email,
        password,
      });

      await signUp.prepareEmailAddressVerification({
        strategy: "email_code",
      });

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

    if (!clerkIsLoaded || !signUp) {
      setError("Please wait a moment and try again");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await signUp.attemptEmailAddressVerification({ code });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        navigate("/members?welcome=true");
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) {
      e.preventDefault();
      if (verifying) {
        handleVerify();
      } else {
        handleSignUp();
      }
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(to bottom, #0a0a0a, #1a1a2e)",
        color: "#fff",
        padding: "80px 20px 60px",
      }}
    >
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div
            style={{
              fontSize: "0.85rem",
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              color: "#4A90E2",
              marginBottom: 12,
              fontWeight: 700,
            }}
          >
            Bass Clarity Pro
          </div>
          <h1
            style={{
              fontSize: "clamp(2.5rem, 5vw, 3.5rem)",
              fontWeight: 800,
              marginBottom: 16,
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              background: "linear-gradient(180deg, #fff 0%, #a5a5a5 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Unlock the Water.
          </h1>
          <p
            style={{
              fontSize: "1.2rem",
              lineHeight: 1.6,
              opacity: 0.7,
              maxWidth: "480px",
              margin: "0 auto",
            }}
          >
            Get the full arsenal: AI strategies, real-time weather safety, and
            unlimited scouting for <strong>$12.99/month</strong>.
          </p>
        </div>

        {/* Benefits List */}
        <div
          style={{
            marginBottom: 40,
            padding: "32px",
            background:
              "linear-gradient(135deg, rgba(74, 144, 226, 0.08) 0%, rgba(10, 10, 10, 0.4) 100%)",
            borderRadius: 24,
            border: "1px solid rgba(74, 144, 226, 0.2)",
            boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
          }}
        >
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            {PRO_FEATURES.map((item, i) => (
              <li
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  fontSize: "1.05rem",
                  opacity: 0.9,
                }}
              >
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: "#4A90E2",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="4"
                  >
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* ACTION CARD */}
        <div
          style={{
            padding: "40px",
            background: "rgba(255, 255, 255, 0.03)",
            borderRadius: 24,
            border: "1px solid rgba(255, 255, 255, 0.08)",
            textAlign: "center",
          }}
        >
          {!clerkIsSignedIn ? (
            // GUEST USER - Sign Up or Verify
            verifying ? (
              // VERIFICATION FORM
              <div>
                <h3 style={{ fontSize: "1.2rem", marginBottom: 8, fontWeight: 700 }}>
                  Verify Your Email
                </h3>
                <p style={{ opacity: 0.6, marginBottom: 24, fontSize: "0.95rem" }}>
                  We sent a code to <strong style={{ color: "#fff" }}>{email}</strong>
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 16, textAlign: "left" }}>
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

                  <div>
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
                      autoComplete="one-time-code"
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        borderRadius: 8,
                        border: "1px solid rgba(255,255,255,0.1)",
                        background: "rgba(0,0,0,0.3)",
                        color: "white",
                        fontSize: "1rem",
                        outline: "none",
                        letterSpacing: "0.3em",
                        textAlign: "center",
                      }}
                      disabled={loading}
                      maxLength={6}
                    />
                  </div>

                  <button
                    onClick={handleVerify}
                    disabled={loading}
                    style={{
                      width: "100%",
                      padding: "18px 24px",
                      fontSize: "1.1rem",
                      fontWeight: 700,
                      background: loading ? "rgba(74, 144, 226, 0.3)" : "#4A90E2",
                      color: "white",
                      border: "none",
                      borderRadius: 16,
                      cursor: loading ? "not-allowed" : "pointer",
                      marginTop: 8,
                    }}
                  >
                    {loading ? "Verifying..." : "Verify Email"}
                  </button>

                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                    <button
                      type="button"
                      onClick={() => {
                        setVerifying(false);
                        setCode("");
                        setError("");
                      }}
                      disabled={loading}
                      style={{
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
                    <button
                      type="button"
                      onClick={async () => {
                        if (!signUp) return;
                        setLoading(true);
                        try {
                          await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
                          alert("Verification code resent!");
                        } catch (err: any) {
                          setError(err.errors?.[0]?.message || "Failed to resend code");
                        } finally {
                          setLoading(false);
                        }
                      }}
                      disabled={loading}
                      style={{
                        background: "none",
                        border: "none",
                        color: "rgba(255,255,255,0.5)",
                        fontSize: "0.85rem",
                        cursor: loading ? "not-allowed" : "pointer",
                        textDecoration: "underline",
                      }}
                    >
                      Resend code
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              // SIGN UP FORM
              <div>
                <h3 style={{ fontSize: "1.2rem", marginBottom: 8, fontWeight: 700 }}>
                  Create Your Account
                </h3>
                <p style={{ opacity: 0.6, marginBottom: 24, fontSize: "0.95rem" }}>
                  Then subscribe to unlock all features
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 16, textAlign: "left" }}>
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

                  <div>
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
                      placeholder="you@example.com"
                      autoComplete="email"
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        borderRadius: 8,
                        border: "1px solid rgba(255,255,255,0.1)",
                        background: "rgba(0,0,0,0.3)",
                        color: "white",
                        fontSize: "1rem",
                        outline: "none",
                      }}
                      disabled={loading}
                    />
                  </div>

                  <div>
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
                        background: "rgba(0,0,0,0.3)",
                        color: "white",
                        fontSize: "1rem",
                        outline: "none",
                      }}
                      disabled={loading}
                      minLength={8}
                    />
                  </div>

                  <button
                    onClick={handleSignUp}
                    disabled={loading}
                    style={{
                      width: "100%",
                      padding: "18px 24px",
                      fontSize: "1.1rem",
                      fontWeight: 700,
                      background: loading ? "rgba(74, 144, 226, 0.3)" : "#4A90E2",
                      color: "white",
                      border: "none",
                      borderRadius: 16,
                      cursor: loading ? "not-allowed" : "pointer",
                      marginTop: 8,
                    }}
                  >
                    {loading ? "Creating Account..." : "Create Account"}
                  </button>

                  <p style={{ marginTop: 12, fontSize: "0.85rem", opacity: 0.6, textAlign: "center" }}>
                    Already have an account?{" "}
                    <Link to="/sign-in" style={{ color: "#4A90E2", fontWeight: 500 }}>
                      Sign In
                    </Link>
                  </p>
                </div>
              </div>
            )
          ) : hasActiveSubscription ? (
            // ALREADY SUBSCRIBED
            <div>
              <div style={{ marginBottom: 24 }}>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    background: "rgba(34, 197, 94, 0.1)",
                    color: "#4ade80",
                    padding: "6px 16px",
                    borderRadius: 99,
                    fontSize: "0.85rem",
                    fontWeight: 700,
                  }}
                >
                  <span>✓</span> Active Subscriber
                </div>
                <div style={{ fontSize: "1.1rem", fontWeight: 600, color: "#fff", marginTop: 16 }}>
                  {clerkUser?.primaryEmailAddress?.emailAddress}
                </div>
              </div>

              <p style={{ opacity: 0.7, marginBottom: 24, fontSize: "0.95rem", lineHeight: 1.6 }}>
                Thank you for supporting Bass Clarity!
              </p>

              <Link to="/members">
                <button
                  style={{
                    width: "100%",
                    padding: "18px 24px",
                    fontSize: "1.1rem",
                    fontWeight: 700,
                    background: "linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)",
                    border: "none",
                    borderRadius: 16,
                    color: "#fff",
                    cursor: "pointer",
                  }}
                >
                  Go to Your Water →
                </button>
              </Link>

              <p style={{ marginTop: 16, fontSize: "0.85rem", opacity: 0.4 }}>
                <Link to="/account" style={{ color: "#4A90E2" }}>
                  Manage Subscription
                </Link>
              </p>
            </div>
          ) : isMember ? (
            // MEMBER WITH FREE ACCESS
            <div>
              <div style={{ marginBottom: 24 }}>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    background: "rgba(34, 197, 94, 0.1)",
                    color: "#4ade80",
                    padding: "6px 16px",
                    borderRadius: 99,
                    fontSize: "0.85rem",
                    fontWeight: 700,
                  }}
                >
                  <span>✓</span> Account Active
                </div>
                <div style={{ fontSize: "1.1rem", fontWeight: 600, color: "#fff", marginTop: 16 }}>
                  {clerkUser?.primaryEmailAddress?.emailAddress}
                </div>
              </div>

              <p style={{ opacity: 0.7, marginBottom: 24, fontSize: "0.95rem", lineHeight: 1.6 }}>
                You have full access to Bass Clarity!
              </p>

              <button
                onClick={handleSubscribe}
                disabled={loading || checkingStatus}
                style={{
                  width: "100%",
                  padding: "18px 24px",
                  fontSize: "1.1rem",
                  fontWeight: 700,
                  background:
                    loading || checkingStatus
                      ? "rgba(74, 144, 226, 0.3)"
                      : "linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)",
                  border: "none",
                  borderRadius: 16,
                  color: "#fff",
                  cursor: loading || checkingStatus ? "not-allowed" : "pointer",
                  marginBottom: 12,
                }}
              >
                {checkingStatus ? "Checking..." : loading ? "Preparing..." : "Support Bass Clarity - $12.99/month"}
              </button>

              <Link to="/members">
                <button
                  style={{
                    width: "100%",
                    padding: "16px 24px",
                    fontSize: "1rem",
                    fontWeight: 600,
                    background: "transparent",
                    border: "1px solid rgba(255,255,255,0.2)",
                    borderRadius: 16,
                    color: "#fff",
                    cursor: "pointer",
                  }}
                >
                  Continue to Map →
                </button>
              </Link>
            </div>
          ) : (
            // LOGGED IN BUT NOT SUBSCRIBED
            <div>
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: "0.85rem", opacity: 0.5, marginBottom: 4 }}>
                  Logged in as
                </div>
                <div style={{ fontSize: "1.1rem", fontWeight: 600, color: "#fff" }}>
                  {clerkUser?.primaryEmailAddress?.emailAddress}
                </div>
              </div>

              <button
                onClick={handleSubscribe}
                disabled={loading || checkingStatus}
                style={{
                  width: "100%",
                  padding: "18px 24px",
                  fontSize: "1.1rem",
                  fontWeight: 700,
                  background:
                    loading || checkingStatus
                      ? "rgba(74, 144, 226, 0.3)"
                      : "linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)",
                  border: "none",
                  borderRadius: 16,
                  color: "#fff",
                  cursor: loading || checkingStatus ? "not-allowed" : "pointer",
                }}
              >
                {checkingStatus ? "Verifying..." : loading ? "Preparing..." : "Activate Subscription →"}
              </button>

              <p style={{ marginTop: 16, fontSize: "0.85rem", opacity: 0.4 }}>
                Secure payment via Stripe. Cancel anytime.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
