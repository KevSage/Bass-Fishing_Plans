import React, { useState, useEffect } from "react";
import { useAuth, useUser, useSignUp } from "@clerk/clerk-react";
import { Link, useNavigate } from "react-router-dom";
import { BackIcon } from "@/components/UnifiedIcons";
import { isNativePlatform } from "@/lib/platform";
import { useNativeAuth } from "@/context/NativeAuthContext";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export function Subscribe() {
  // Clerk SDK hooks (for web)
  const { isSignedIn: clerkIsSignedIn, getToken: clerkGetToken } = useAuth();
  const { user: clerkUser } = useUser();
  const { isLoaded: clerkIsLoaded, signUp, setActive } = useSignUp();

  // Native auth (for iOS/Android)
  const nativeAuth = useNativeAuth();

  // Platform-aware state
  const isNative = isNativePlatform();
  const isLoaded = isNative ? nativeAuth.isLoaded : clerkIsLoaded;
  const isSignedIn = isNative ? nativeAuth.isSignedIn : clerkIsSignedIn;
  const userEmail = isNative
    ? nativeAuth.userEmail
    : clerkUser?.primaryEmailAddress?.emailAddress;

  // Platform-aware getToken
  const getToken = async () => {
    if (isNative) {
      return nativeAuth.getToken();
    }
    return clerkGetToken();
  };

  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [isMember, setIsMember] = useState(false);

  // Sign up form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showSignUpForm, setShowSignUpForm] = useState(true); // Show form by default

  // Debug logging
  console.log("[Subscribe] Platform:", isNative ? "native" : "web");
  console.log("[Subscribe] isLoaded:", isLoaded, "isSignedIn:", isSignedIn);

  // Check if user is already a member
  useEffect(() => {
    if (isSignedIn) {
      const checkStatus = async () => {
        setCheckingStatus(true);
        try {
          const token = await getToken();
          const res = await fetch(`${API_BASE}/members/status`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            setIsMember(data.is_member);
          }
        } catch (err) {
          console.error("Failed to check status", err);
        } finally {
          setCheckingStatus(false);
        }
      };
      checkStatus();
    }
  }, [isSignedIn, getToken]);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const token = await getToken();

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

    if (!isLoaded) {
      setError("Authentication is still loading. Please wait a moment.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (isNative) {
        // Use native direct API
        console.log("[Subscribe] Using native auth for sign-up...");
        const result = await nativeAuth.signUp(email, password);

        if (result.success) {
          console.log("[Subscribe] Native sign-up successful");
          // After creating account, reload to show subscription option
          window.location.reload();
        } else {
          setError(result.error || "Failed to create account");
        }
      } else {
        // Use Clerk SDK (web)
        if (!signUp) {
          setError("Authentication is still loading. Please wait a moment.");
          return;
        }

        const result = await signUp.create({
          emailAddress: email,
          password,
        });

        // Since email verification is disabled, account should be complete immediately
        if (result.status === "complete") {
          await setActive({ session: result.createdSessionId });
          // After creating account, reload to show subscription option
          window.location.reload();
        } else {
          // Fallback if somehow verification is required
          setError(
            "Account created but needs verification. Please check your email.",
          );
        }
      }
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) {
      e.preventDefault();
      handleSignUp();
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        position: "relative",
        color: "#fff",
        padding: "80px 20px 60px",
        overflow: "hidden",
      }}
    >
      {/* Background Image */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "url(/hero_bass.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "right center",
          filter: "brightness(0.7)",
          zIndex: 0,
        }}
      />
      {/* Gradient Overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to bottom, rgba(10,10,10,0.6) 0%, rgba(26,26,46,0.9) 100%)",
          zIndex: 1,
        }}
      />
      <div style={{ maxWidth: 640, margin: "0 auto", position: "relative", zIndex: 2 }}>
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
            unlimited scouting for <strong>$10/month</strong>.
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
            {[
              "Unlimited Lake Scouting on ANY Water",
              "Unlimited AI Generated Plans for Any Location",
              "Customized Lure/Gear Recommendations",
              "Full Day Strategy. Any Location, Any Time",
              "Smart Catch Log & History",
              "Your Insights including Personal Best, Productive Lakes/Lures/Techniques",
            ].map((item, i) => (
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
          {!isSignedIn ? (
            // STATE 1: GUEST USER - Show Sign Up Form
            showSignUpForm ? (
              <div>
                <h3
                  style={{
                    fontSize: "1.2rem",
                    marginBottom: 8,
                    fontWeight: 700,
                  }}
                >
                  Create Your Account
                </h3>
                <p
                  style={{
                    opacity: 0.6,
                    marginBottom: 24,
                    fontSize: "0.95rem",
                  }}
                >
                  Then subscribe to unlock all features
                </p>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 16,
                    textAlign: "left",
                  }}
                >
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
                      background: loading
                        ? "rgba(74, 144, 226, 0.3)"
                        : "#4A90E2",
                      color: "white",
                      border: "none",
                      borderRadius: 16,
                      cursor: loading ? "not-allowed" : "pointer",
                      marginTop: 8,
                    }}
                  >
                    {loading ? "Creating Account..." : "Create Account"}
                  </button>

                  <p
                    style={{
                      marginTop: 12,
                      fontSize: "0.85rem",
                      opacity: 0.6,
                      textAlign: "center",
                    }}
                  >
                    Already have an account?{" "}
                    <Link
                      to="/sign-in"
                      style={{ color: "#4A90E2", fontWeight: 500 }}
                    >
                      Sign In
                    </Link>
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <h3
                  style={{
                    fontSize: "1.2rem",
                    marginBottom: 8,
                    fontWeight: 700,
                  }}
                >
                  Step 1: Create Your Profile
                </h3>
                <p
                  style={{
                    opacity: 0.6,
                    marginBottom: 24,
                    fontSize: "0.95rem",
                  }}
                >
                  Secure your data and history with a free account.
                </p>

                <button
                  onClick={() => setShowSignUpForm(true)}
                  style={{
                    width: "100%",
                    padding: "18px 24px",
                    fontSize: "1.1rem",
                    fontWeight: 700,
                    background: "#fff",
                    color: "#000",
                    border: "none",
                    borderRadius: 16,
                    cursor: "pointer",
                    transition: "all 0.2s",
                    boxShadow: "0 4px 20px rgba(255,255,255,0.15)",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.transform = "translateY(-2px)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.transform = "translateY(0)")
                  }
                >
                  Get Started
                </button>

                <p style={{ marginTop: 16, fontSize: "0.85rem", opacity: 0.6 }}>
                  Already have an account?{" "}
                  <Link
                    to="/sign-in"
                    style={{ color: "#4A90E2", fontWeight: 500 }}
                  >
                    Sign In
                  </Link>
                </p>
              </div>
            )
          ) : isMember ? (
            // STATE 3: ALREADY A MEMBER
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
                  <span>✓</span> Active Member
                </div>
                <div
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: 600,
                    color: "#fff",
                    marginTop: 16,
                  }}
                >
                  {userEmail}
                </div>
              </div>

              <Link to="/members">
                <button
                  style={{
                    width: "100%",
                    padding: "18px 24px",
                    fontSize: "1.1rem",
                    fontWeight: 700,
                    background: "rgba(255, 255, 255, 0.1)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    borderRadius: 16,
                    color: "#fff",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background =
                      "rgba(255, 255, 255, 0.15)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background =
                      "rgba(255, 255, 255, 0.1)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  Go to Your Water →
                </button>
              </Link>

              <p style={{ marginTop: 16, fontSize: "0.85rem", opacity: 0.4 }}>
                You are already subscribed.{" "}
                <Link to="/account" style={{ color: "#4A90E2" }}>
                  Manage Billing
                </Link>
              </p>
            </div>
          ) : (
            // STATE 2: LOGGED IN BUT NOT PAID
            <div>
              <div style={{ marginBottom: 24 }}>
                <div
                  style={{
                    fontSize: "0.85rem",
                    opacity: 0.5,
                    marginBottom: 4,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Logged in as
                </div>
                <div
                  style={{ fontSize: "1.1rem", fontWeight: 600, color: "#fff" }}
                >
                  {userEmail}
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
                  transition: "all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                  boxShadow:
                    "0 10px 30px rgba(74, 144, 226, 0.25), inset 0 1px 1px rgba(255,255,255,0.2)",
                }}
                onMouseEnter={(e) => {
                  if (!loading && !checkingStatus)
                    e.currentTarget.style.transform =
                      "translateY(-2px) scale(1.01)";
                }}
                onMouseLeave={(e) => {
                  if (!loading && !checkingStatus)
                    e.currentTarget.style.transform = "translateY(0) scale(1)";
                }}
              >
                {checkingStatus
                  ? "Verifying..."
                  : loading
                    ? "Preparing Checkout..."
                    : "Activate Subscription →"}
              </button>

              <p style={{ marginTop: 16, fontSize: "0.85rem", opacity: 0.4 }}>
                Secure payment via Stripe. Cancel anytime in your account.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
