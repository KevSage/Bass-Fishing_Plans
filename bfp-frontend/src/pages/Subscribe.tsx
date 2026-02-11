import React, { useState, useEffect } from "react";
import { useAuth, useUser, useSignUp } from "@clerk/clerk-react";
import { Link, useNavigate } from "react-router-dom";
import { BackIcon } from "@/components/UnifiedIcons";
import { isNativePlatform } from "@/lib/platform";
import { useNativeAuth } from "@/context/NativeAuthContext";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export function Subscribe() {
  // Check platform once at component mount
  const isNative = isNativePlatform();

  // Native auth (only used on mobile)
  const nativeAuth = useNativeAuth();

  // Clerk hooks (used on web, also available on native but we use nativeAuth instead)
  const { isSignedIn: clerkIsSignedIn, getToken: clerkGetToken } = useAuth();
  const { user: clerkUser } = useUser();
  const { isLoaded: clerkIsLoaded, signUp, setActive } = useSignUp();

  // Platform-aware values
  const isSignedIn = isNative ? nativeAuth.isSignedIn : clerkIsSignedIn;
  const isLoaded = isNative ? nativeAuth.isLoaded : clerkIsLoaded;
  const user = isNative
    ? { primaryEmailAddress: { emailAddress: nativeAuth.userEmail } }
    : clerkUser;
  const getToken = isNative ? nativeAuth.getToken : clerkGetToken;

  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);

  // Sign up form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showSignUpForm, setShowSignUpForm] = useState(true); // Show form by default
  const [verifying, setVerifying] = useState(false);
  const [code, setCode] = useState("");

  // Mobile verification state (verify before payment)
  const [mobileVerifying, setMobileVerifying] = useState(false);
  const [mobileVerified, setMobileVerified] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [sendingCode, setSendingCode] = useState(false);

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
            // Check if user has actual paid subscription (not just FREE_MODE access)
            const subStatus = data.subscription_status;
            setHasActiveSubscription(
              subStatus === "active" || subStatus === "trialing",
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
  }, [isSignedIn, getToken]);

  // Send verification code for mobile
  const handleSendVerificationCode = async () => {
    console.log("[Subscribe] handleSendVerificationCode called");
    console.log("[Subscribe] nativeAuth.userEmail:", nativeAuth.userEmail);

    if (!nativeAuth.userEmail) {
      setError("Email not found. Please sign out and sign in again.");
      return;
    }

    setSendingCode(true);
    setError("");

    try {
      console.log("[Subscribe] Sending verification to:", nativeAuth.userEmail);
      const response = await fetch(
        `${API_BASE}/mobile-auth/send-verification`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: nativeAuth.userEmail }),
        },
      );

      console.log("[Subscribe] Response status:", response.status);
      const data = await response.json();
      console.log("[Subscribe] Response data:", data);

      if (data.success) {
        setMobileVerifying(true);
      } else {
        setError(data.error || "Failed to send verification code");
      }
    } catch (err) {
      console.error("[Subscribe] Send verification error:", err);
      setError("Failed to send verification code. Please try again.");
    } finally {
      setSendingCode(false);
    }
  };

  // Verify code for mobile
  const handleVerifyMobileCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError("Please enter the 6-digit code");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE}/mobile-auth/verify-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: nativeAuth.userEmail,
          code: verificationCode,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMobileVerified(true);
        setMobileVerifying(false);
        // Now proceed to checkout
        handleSubscribe();
      } else {
        setError(data.error || "Invalid code. Please try again.");
      }
    } catch (err) {
      console.error("Verify code error:", err);
      setError("Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    console.log("[Subscribe] handleSubscribe called");
    console.log(
      "[Subscribe] isNative:",
      isNative,
      "mobileVerified:",
      mobileVerified,
    );

    // Mobile: Require verification before checkout
    if (isNative && !mobileVerified) {
      console.log("[Subscribe] Triggering verification flow");
      handleSendVerificationCode();
      return;
    }

    setLoading(true);
    try {
      let data;

      if (isNative) {
        // Mobile: Use mobile-specific checkout endpoint
        const response = await fetch(`${API_BASE}/mobile-auth/checkout`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: nativeAuth.userEmail,
            user_id: nativeAuth.userId,
          }),
        });
        data = await response.json();
        if (!data.success)
          throw new Error(data.error || "Failed to start checkout");
      } else {
        // Web: Use standard checkout with JWT
        const token = await getToken();
        const response = await fetch(`${API_BASE}/billing/checkout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) throw new Error("Failed to start checkout");
        data = await response.json();
      }

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
      if (isNative) {
        // Mobile: Use native auth (Clerk SDK doesn't work in WebView)
        // TODO: Add custom email verification later
        const result = await nativeAuth.signUp(email, password);
        if (!result.success) {
          setError(result.error || "Failed to create account");
        }
        // On success, isSignedIn updates automatically via context
      } else {
        // Web: Use Clerk SDK with email verification
        if (!clerkIsLoaded || !signUp) {
          setError("Authentication is still loading. Please wait a moment.");
          setLoading(false);
          return;
        }

        // Create account
        await signUp.create({
          emailAddress: email,
          password,
        });

        // Send verification email
        await signUp.prepareEmailAddressVerification({
          strategy: "email_code",
        });

        // Show verification form
        setVerifying(true);
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
        // Navigate to members area with welcome flag
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
      handleSignUp();
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
            // STATE 1: GUEST USER - Show Sign Up Form or Verification
            verifying ? (
              // VERIFICATION FORM
              <div>
                <h3
                  style={{
                    fontSize: "1.2rem",
                    marginBottom: 8,
                    fontWeight: 700,
                  }}
                >
                  Verify Your Email
                </h3>
                <p
                  style={{
                    opacity: 0.6,
                    marginBottom: 24,
                    fontSize: "0.95rem",
                  }}
                >
                  We sent a code to{" "}
                  <strong style={{ color: "#fff" }}>{email}</strong>
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
                      onKeyPress={(e) => {
                        if (e.key === "Enter" && !loading) {
                          e.preventDefault();
                          handleVerify();
                        }
                      }}
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
                    {loading ? "Verifying..." : "Verify Email"}
                  </button>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginTop: 4,
                    }}
                  >
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
                        setError("");
                        try {
                          await signUp.prepareEmailAddressVerification({
                            strategy: "email_code",
                          });
                          setError(""); // Clear any previous error
                          alert("Verification code resent!");
                        } catch (err: any) {
                          setError(
                            err.errors?.[0]?.message || "Failed to resend code",
                          );
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
                        fontWeight: 500,
                        cursor: loading ? "not-allowed" : "pointer",
                        textDecoration: "underline",
                      }}
                    >
                      Resend code
                    </button>
                  </div>
                </div>
              </div>
            ) : showSignUpForm ? (
              // SIGN UP FORM
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
          ) : hasActiveSubscription ? (
            // STATE 3: ALREADY SUBSCRIBED
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
                <div
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: 600,
                    color: "#fff",
                    marginTop: 16,
                  }}
                >
                  {user?.primaryEmailAddress?.emailAddress}
                </div>
              </div>

              <p
                style={{
                  opacity: 0.7,
                  marginBottom: 24,
                  fontSize: "0.95rem",
                  lineHeight: 1.6,
                }}
              >
                Thank you for supporting Bass Clarity! Your subscription helps
                keep the app running and improving.
              </p>

              <Link to="/members">
                <button
                  style={{
                    width: "100%",
                    padding: "18px 24px",
                    fontSize: "1.1rem",
                    fontWeight: 700,
                    background:
                      "linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)",
                    border: "none",
                    borderRadius: 16,
                    color: "#fff",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    boxShadow: "0 10px 30px rgba(74, 144, 226, 0.25)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
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
            // STATE 2B: MEMBER (FREE ACCESS) - CAN OPTIONALLY SUBSCRIBE
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
                <div
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: 600,
                    color: "#fff",
                    marginTop: 16,
                  }}
                >
                  {user?.primaryEmailAddress?.emailAddress}
                </div>
              </div>

              <p
                style={{
                  opacity: 0.7,
                  marginBottom: 24,
                  fontSize: "0.95rem",
                  lineHeight: 1.6,
                }}
              >
                You have full access to Bass Clarity! Subscriptions are optional
                and help support continued development.
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
                  transition: "all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                  boxShadow:
                    "0 10px 30px rgba(74, 144, 226, 0.25), inset 0 1px 1px rgba(255,255,255,0.2)",
                  marginBottom: 12,
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
                  ? "Checking..."
                  : loading
                    ? "Preparing Checkout..."
                    : "Support Bass Clarity - $10/month"}
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
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  Continue to Map →
                </button>
              </Link>
            </div>
          ) : mobileVerifying ? (
            // STATE 2B: MOBILE EMAIL VERIFICATION
            <div>
              <h3
                style={{
                  fontSize: "1.2rem",
                  marginBottom: 8,
                  fontWeight: 700,
                }}
              >
                Verify Your Email
              </h3>
              <p
                style={{
                  opacity: 0.6,
                  marginBottom: 24,
                  fontSize: "0.95rem",
                }}
              >
                We sent a code to{" "}
                <strong style={{ color: "#fff" }}>
                  {nativeAuth.userEmail}
                </strong>
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
                    htmlFor="verificationCode"
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
                    id="verificationCode"
                    type="text"
                    value={verificationCode}
                    onChange={(e) =>
                      setVerificationCode(
                        e.target.value.replace(/\D/g, "").slice(0, 6),
                      )
                    }
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !loading) {
                        e.preventDefault();
                        handleVerifyMobileCode();
                      }
                    }}
                    placeholder="Enter 6-digit code"
                    autoComplete="one-time-code"
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      borderRadius: 8,
                      border: "1px solid rgba(255,255,255,0.1)",
                      background: "rgba(0,0,0,0.3)",
                      color: "white",
                      fontSize: "1.2rem",
                      outline: "none",
                      letterSpacing: "0.3em",
                      textAlign: "center",
                    }}
                    disabled={loading}
                    maxLength={6}
                  />
                </div>

                <button
                  onClick={handleVerifyMobileCode}
                  disabled={loading || verificationCode.length !== 6}
                  style={{
                    width: "100%",
                    padding: "18px 24px",
                    fontSize: "1.1rem",
                    fontWeight: 700,
                    background:
                      loading || verificationCode.length !== 6
                        ? "rgba(74, 144, 226, 0.3)"
                        : "linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)",
                    color: "white",
                    border: "none",
                    borderRadius: 16,
                    cursor:
                      loading || verificationCode.length !== 6
                        ? "not-allowed"
                        : "pointer",
                    marginTop: 8,
                  }}
                >
                  {loading ? "Verifying..." : "Verify & Continue to Payment"}
                </button>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: 4,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setMobileVerifying(false);
                      setVerificationCode("");
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
                    ← Back
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setError("");
                      handleSendVerificationCode();
                    }}
                    disabled={sendingCode}
                    style={{
                      background: "none",
                      border: "none",
                      color: "rgba(255,255,255,0.5)",
                      fontSize: "0.85rem",
                      fontWeight: 500,
                      cursor: sendingCode ? "not-allowed" : "pointer",
                      textDecoration: "underline",
                    }}
                  >
                    {sendingCode ? "Sending..." : "Resend code"}
                  </button>
                </div>
              </div>
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
                  {user?.primaryEmailAddress?.emailAddress}
                </div>
              </div>

              <button
                onClick={() => {
                  console.log("[Subscribe] BUTTON CLICKED!");
                  handleSubscribe();
                }}
                disabled={loading || checkingStatus || sendingCode}
                style={{
                  width: "100%",
                  padding: "18px 24px",
                  fontSize: "1.1rem",
                  fontWeight: 700,
                  background:
                    loading || checkingStatus || sendingCode
                      ? "rgba(74, 144, 226, 0.3)"
                      : "linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)",
                  border: "none",
                  borderRadius: 16,
                  color: "#fff",
                  cursor:
                    loading || checkingStatus || sendingCode
                      ? "not-allowed"
                      : "pointer",
                  transition: "all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                  boxShadow:
                    "0 10px 30px rgba(74, 144, 226, 0.25), inset 0 1px 1px rgba(255,255,255,0.2)",
                }}
                onMouseEnter={(e) => {
                  if (!loading && !checkingStatus && !sendingCode)
                    e.currentTarget.style.transform =
                      "translateY(-2px) scale(1.01)";
                }}
                onMouseLeave={(e) => {
                  if (!loading && !checkingStatus && !sendingCode)
                    e.currentTarget.style.transform = "translateY(0) scale(1)";
                }}
              >
                {checkingStatus
                  ? "Verifying..."
                  : loading || sendingCode
                    ? "Preparing..."
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
