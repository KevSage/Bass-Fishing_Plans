// src/pages/Upgrade.tsx
// Premium upgrade page designed to maximize conversions

import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { usePlatformAuth } from "@/hooks/usePlatformAuth";
import { isNativePlatform, getApiBaseUrl } from "@/lib/platform";
import { useStoreKitPurchases } from "@/hooks/useStoreKitPurchases";
import { useNativeAuth } from "@/context/NativeAuthContext";

// ============================================================================
// ICONS
// ============================================================================

const CheckIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const LightningIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
  </svg>
);

const MapIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const ChartIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 20V10M12 20V4M6 20v-6" />
  </svg>
);

const CameraIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

const TrophyIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 22V8M14 22V8" />
    <path d="M8 6a4 4 0 0 0 8 0V4H8v2z" />
  </svg>
);

const SunIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

// ============================================================================
// FEATURE DATA
// ============================================================================

const FEATURES = [
  {
    icon: LightningIcon,
    title: "AI Fishing Plans",
    description: "Get personalized strategies based on real-time weather, water temp, and seasonal patterns. Know exactly what to throw before you launch.",
    highlight: true,
  },
  {
    icon: MapIcon,
    title: "Unlimited Lakes",
    description: "Save and track unlimited waters. Free users get 1 Home Lake. Pro unlocks every lake you fish.",
  },
  {
    icon: SunIcon,
    title: "Live Conditions",
    description: "Real-time weather, wind, pressure, and solar data overlaid on your map. See how conditions change throughout your trip.",
  },
  {
    icon: CameraIcon,
    title: "Catch Logging",
    description: "Log catches with photos, GPS, weather, and lure data. Build your personal fishing intelligence over time.",
  },
  {
    icon: ChartIcon,
    title: "Pattern Insights",
    description: "Analyze your catches by season, lake, technique, and conditions. Discover what actually works for you.",
  },
  {
    icon: TrophyIcon,
    title: "Journey & Badges",
    description: "Level up your angling career. Earn badges, track mastery, and see your progression as an angler.",
  },
];

const COMPARISON = [
  { feature: "Interactive Lake Map", free: true, pro: true },
  { feature: "Home Lake (1)", free: true, pro: true },
  { feature: "Basic Weather Display", free: true, pro: true },
  { feature: "AI Fishing Plans", free: false, pro: true },
  { feature: "Unlimited Saved Lakes", free: false, pro: true },
  { feature: "Real-Time Conditions", free: false, pro: true },
  { feature: "Catch Logging + Photos", free: false, pro: true },
  { feature: "Pattern Analytics", free: false, pro: true },
  { feature: "Journey & Badges", free: false, pro: true },
  { feature: "Lure Recommendations", free: false, pro: true },
  { feature: "Custom Lake Mapping", free: false, pro: true },
];

// Extracted styles for reuse in early returns
const upgradeStyles = `
  .upgrade-page {
    min-height: 100vh;
    background: linear-gradient(180deg, #0a0a0f 0%, #0f0f18 50%, #0a0a0f 100%);
    color: #fff;
    padding-bottom: 80px;
  }

  .hero {
    text-align: center;
    padding: 60px 24px 80px;
    max-width: 600px;
    margin: 0 auto;
  }

  .hero-badge {
    display: inline-block;
    padding: 6px 16px;
    background: linear-gradient(135deg, rgba(74, 144, 226, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%);
    border: 1px solid rgba(74, 144, 226, 0.3);
    border-radius: 100px;
    font-size: 0.7rem;
    font-weight: 800;
    letter-spacing: 0.15em;
    color: #4A90E2;
    margin-bottom: 24px;
  }

  .hero-title {
    font-size: 2.5rem;
    font-weight: 800;
    line-height: 1.1;
    margin: 0 0 20px;
    letter-spacing: -0.03em;
  }

  .gradient-text {
    background: linear-gradient(135deg, #4A90E2 0%, #8B5CF6 50%, #4A90E2 100%);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: gradient-shift 3s ease infinite;
  }

  @keyframes gradient-shift {
    0%, 100% { background-position: 0% center; }
    50% { background-position: 100% center; }
  }

  .hero-subtitle {
    font-size: 1.1rem;
    line-height: 1.6;
    color: rgba(255, 255, 255, 0.7);
    margin: 0 0 32px;
  }

  .hero-ctas {
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-width: 300px;
    margin: 0 auto 16px;
  }

  .cta-primary {
    padding: 16px 32px;
    background: linear-gradient(135deg, #4A90E2 0%, #357ABD 100%);
    border: none;
    border-radius: 14px;
    color: #fff;
    font-size: 1.1rem;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 8px 24px rgba(74, 144, 226, 0.3);
    transition: all 0.3s;
  }

  .cta-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 32px rgba(74, 144, 226, 0.4);
  }

  .cta-secondary {
    padding: 14px 32px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 14px;
    color: #fff;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;
  }

  .cta-secondary:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.2);
  }

  .restore-link {
    display: block;
    margin: 16px auto 0;
    padding: 8px 16px;
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.4);
    font-size: 0.85rem;
    cursor: pointer;
    text-decoration: underline;
    transition: color 0.2s;
  }

  .restore-link:hover {
    color: rgba(255, 255, 255, 0.6);
  }

  .restore-link:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .loading-spinner {
    width: 32px;
    height: 32px;
    border: 3px solid rgba(74, 144, 226, 0.2);
    border-top-color: #4A90E2;
    border-radius: 50%;
    margin: 0 auto;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function Upgrade() {
  const { isSignedIn } = usePlatformAuth();
  const navigate = useNavigate();
  const isNative = isNativePlatform();
  const nativeAuth = useNativeAuth();
  const {
    purchaseSubscription,
    restorePurchases,
    activateProOnBackend,
    isPurchasing,
    error: storeKitError,
    priceString,
  } = useStoreKitPurchases();
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isAlreadyPro, setIsAlreadyPro] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);

  // Monthly subscription only (annual adds complexity for restore/upgrade/downgrade)
  const monthlyPrice = 12.99;

  // Check membership status on mount for native users
  useEffect(() => {
    const checkMembershipStatus = async () => {
      if (!isNative || !nativeAuth.isSignedIn || !nativeAuth.userEmail) {
        setIsCheckingStatus(false);
        return;
      }

      try {
        const response = await fetch(`${getApiBaseUrl()}/mobile-auth/status`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: nativeAuth.userEmail,
            user_id: nativeAuth.userId || "",
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.is_member) {
            setIsAlreadyPro(true);
          }
        }
      } catch (err) {
        console.error("[Upgrade] Failed to check status:", err);
      } finally {
        setIsCheckingStatus(false);
      }
    };

    checkMembershipStatus();
  }, [isNative, nativeAuth.isSignedIn, nativeAuth.userEmail, nativeAuth.userId]);

  // Open App Store subscription management
  const handleManageSubscription = async () => {
    if (isNative) {
      try {
        const { NativePurchases } = await import("@capgo/native-purchases");
        await NativePurchases.manageSubscriptions();
      } catch (err) {
        // Fallback: open App Store subscriptions URL
        window.open("https://apps.apple.com/account/subscriptions", "_blank");
      }
    }
  };

  const handleUpgrade = async () => {
    // Native: Use StoreKit for in-app purchase
    if (isNative && isSignedIn && nativeAuth.userEmail) {
      setPurchaseError(null);

      const result = await purchaseSubscription();

      if (result.success && result.jws) {
        // Activate on backend with JWS for cryptographic verification
        const activation = await activateProOnBackend(
          nativeAuth.userEmail,
          result.transactionId || '',
          result.jws,
          nativeAuth.userId || undefined
        );

        if (activation.success) {
          navigate("/members?upgraded=true");
        } else {
          setPurchaseError(activation.error || "Activation failed. Please contact support.");
        }
      } else if (result.success && !result.jws) {
        // Purchase succeeded but no JWS - this shouldn't happen on iOS 15+
        setPurchaseError("Purchase completed but verification failed. Please contact support.");
      } else if (result.error && !result.error.includes("cancelled")) {
        setPurchaseError(result.error);
      }
      return;
    }

    // Web or not signed in: Navigate to subscribe/sign-up
    if (isSignedIn) {
      navigate("/subscribe");
    } else {
      navigate("/sign-up");
    }
  };

  const handleViewSample = () => {
    const PROD_SAMPLE_URL = "/plan?token=ByW0Xj_COI5ek3gimQnLQ6rsyrhkvGO9X7R8Aw6Rhus";
    const DEV_SAMPLE_URL = "/plan?token=FSt4LZJLD62XHHTmYOL1ZoWua6V34U9c9TGVbKt1vEU";
    navigate(import.meta.env.PROD ? PROD_SAMPLE_URL : DEV_SAMPLE_URL);
  };

  // Restore purchases - required by Apple App Store
  const handleRestorePurchases = async () => {
    if (!isNative || !nativeAuth.userEmail) return;

    setIsRestoring(true);
    setPurchaseError(null);

    try {
      const result = await restorePurchases();

      if (!result.success) {
        setPurchaseError(result.error || "Failed to restore purchases");
        return;
      }

      // If we got transactions with JWS, verify with the backend
      if (result.transactions && result.transactions.length > 0) {
        // Prioritize active transactions first (sorted by isActive=true first)
        const sortedTransactions = [...result.transactions].sort((a, b) => {
          if (a.isActive && !b.isActive) return -1;
          if (!a.isActive && b.isActive) return 1;
          return 0;
        });

        for (const tx of sortedTransactions) {
          if (tx.jws) {
            const activation = await activateProOnBackend(
              nativeAuth.userEmail,
              tx.transactionId,
              tx.jws,
              nativeAuth.userId || undefined
            );

            if (activation.success && activation.is_member) {
              navigate("/members?restored=true");
              return;
            }
          }
        }
        // Had transactions but none resulted in active membership
        setPurchaseError("No active subscriptions found. Your subscription may have expired.");
      } else {
        // No transactions returned
        setPurchaseError("No purchases to restore. If you believe this is an error, please contact support.");
      }
    } catch (err: any) {
      console.error("[Restore] Error:", err);
      setPurchaseError(err.message || "Restore failed. Please try again.");
    } finally {
      setIsRestoring(false);
    }
  };

  // Show loading state while checking membership
  if (isNative && isCheckingStatus) {
    return (
      <div className="upgrade-page">
        <section className="hero">
          <div className="hero-badge">BASS CLARITY PRO</div>
          <div style={{ padding: "60px 0", textAlign: "center" }}>
            <div className="loading-spinner" />
            <p style={{ color: "rgba(255,255,255,0.5)", marginTop: 16 }}>
              Checking subscription status...
            </p>
          </div>
        </section>
        <style>{upgradeStyles}</style>
      </div>
    );
  }

  // Already Pro - show confirmation and management options
  if (isAlreadyPro) {
    return (
      <div className="upgrade-page">
        <section className="hero">
          <div className="hero-badge" style={{ background: "linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(16, 185, 129, 0.2) 100%)", borderColor: "rgba(34, 197, 94, 0.3)", color: "#22c55e" }}>
            PRO MEMBER
          </div>
          <h1 className="hero-title">
            You're Already<br />
            <span className="gradient-text">Pro!</span>
          </h1>
          <p className="hero-subtitle">
            You have full access to all Bass Clarity Pro features.
            Thank you for being a Pro member!
          </p>

          <div className="hero-ctas">
            <button
              className="cta-primary"
              onClick={() => navigate("/members")}
            >
              Go to Map
            </button>
            <button
              className="cta-secondary"
              onClick={handleManageSubscription}
            >
              Manage Subscription
            </button>
          </div>

          <button
            className="restore-link"
            onClick={handleRestorePurchases}
            disabled={isRestoring || isPurchasing}
          >
            {isRestoring ? "Restoring..." : "Restore Purchases"}
          </button>
        </section>
        <style>{upgradeStyles}</style>
      </div>
    );
  }

  return (
    <div className="upgrade-page">
      {/* HERO SECTION */}
      <section className="hero">
        <div className="hero-badge">BASS CLARITY PRO</div>
        <h1 className="hero-title">
          Fish Smarter.<br />
          <span className="gradient-text">Catch More.</span>
        </h1>
        <p className="hero-subtitle">
          AI-powered fishing plans, real-time conditions, and pattern intelligence
          that turns every trip into an opportunity.
        </p>

        {/* PRICE DISPLAY */}
        <div className="price-display">
          <div className="price-main">
            <span className="currency">$</span>
            <span className="amount">{priceString ? priceString.replace('$', '') : monthlyPrice}</span>
            <span className="period">/mo</span>
          </div>
        </div>

        {/* CTA BUTTONS */}
        <div className="hero-ctas">
          {(purchaseError || storeKitError) && (
            <div className="purchase-error">
              {purchaseError || storeKitError}
            </div>
          )}
          <button
            className="cta-primary"
            onClick={handleUpgrade}
            disabled={isPurchasing || isRestoring}
          >
            {isPurchasing
              ? "Processing..."
              : isRestoring
                ? "Restoring..."
                : isSignedIn
                  ? "Upgrade Now"
                  : "Start Free Trial"}
          </button>
          <button className="cta-secondary" onClick={handleViewSample}>
            View Sample Plan
          </button>
        </div>

        <p className="guarantee">
          {isNative ? "Subscription managed by App Store." : "Cancel anytime. No questions asked."}
        </p>
        {isNative && isSignedIn && (
          <button
            className="restore-link"
            onClick={handleRestorePurchases}
            disabled={isRestoring || isPurchasing}
          >
            {isRestoring ? "Restoring..." : "Restore Purchases"}
          </button>
        )}
      </section>

      {/* FEATURES GRID */}
      <section className="features-section">
        <h2 className="section-title">Fish Smarter with Pro</h2>
        <div className="features-grid">
          {FEATURES.map((feature, i) => (
            <div
              key={feature.title}
              className={`feature-card ${feature.highlight ? "highlight" : ""}`}
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="feature-icon">
                <feature.icon size={24} />
              </div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-desc">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* COMPARISON TABLE */}
      <section className="comparison-section">
        <h2 className="section-title">Free vs Pro</h2>
        <div className="comparison-table">
          <div className="comparison-header">
            <div className="col-feature">Feature</div>
            <div className="col-free">Free</div>
            <div className="col-pro">Pro</div>
          </div>
          {COMPARISON.map((row, i) => (
            <div key={row.feature} className="comparison-row" style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="col-feature">{row.feature}</div>
              <div className="col-free">
                {row.free ? (
                  <span className="check-muted"><CheckIcon size={16} /></span>
                ) : (
                  <span className="dash">—</span>
                )}
              </div>
              <div className="col-pro">
                {row.pro ? (
                  <span className="check-pro"><CheckIcon size={16} /></span>
                ) : (
                  <span className="dash">—</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="final-cta">
        <h2>Ready to Fish Smarter?</h2>
        <p>Join thousands of anglers who've upgraded their game.</p>
        <button
          className="cta-primary large"
          onClick={handleUpgrade}
          disabled={isPurchasing || isRestoring}
        >
          {isPurchasing
            ? "Processing..."
            : isRestoring
              ? "Restoring..."
              : isSignedIn
                ? "Upgrade to Pro"
                : "Get Started"}
        </button>
        <p className="guarantee">
          {isNative ? "Subscription managed by App Store" : "30-day money-back guarantee"}
        </p>
      </section>

      {/* STYLES */}
      <style>{upgradeStyles}</style>
      <style>{`
        /* PRICING TOGGLE */
        .pricing-toggle {
          display: inline-flex;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 100px;
          padding: 4px;
          margin-bottom: 24px;
        }

        .toggle-btn {
          position: relative;
          padding: 10px 20px;
          background: transparent;
          border: none;
          border-radius: 100px;
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .toggle-btn.active {
          background: linear-gradient(135deg, #4A90E2 0%, #357ABD 100%);
          color: #fff;
          box-shadow: 0 4px 12px rgba(74, 144, 226, 0.3);
        }

        .save-badge {
          position: absolute;
          top: -8px;
          right: -8px;
          padding: 2px 6px;
          background: #22c55e;
          border-radius: 100px;
          font-size: 0.6rem;
          font-weight: 700;
          color: #fff;
        }

        /* PRICE DISPLAY */
        .price-display {
          margin-bottom: 32px;
        }

        .price-main {
          display: flex;
          align-items: flex-start;
          justify-content: center;
          gap: 2px;
        }

        .currency {
          font-size: 1.5rem;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.7);
          margin-top: 8px;
        }

        .amount {
          font-size: 4rem;
          font-weight: 800;
          letter-spacing: -0.03em;
          line-height: 1;
        }

        .period {
          font-size: 1.2rem;
          color: rgba(255, 255, 255, 0.5);
          align-self: flex-end;
          margin-bottom: 8px;
        }

        .price-detail {
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.4);
          margin-top: 4px;
        }

        .guarantee {
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.4);
          margin: 0;
        }

        .purchase-error {
          padding: 12px 16px;
          background: rgba(255, 107, 107, 0.1);
          border: 1px solid rgba(255, 107, 107, 0.3);
          border-radius: 12px;
          color: #ff6b6b;
          font-size: 0.9rem;
          text-align: center;
        }

        .cta-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .cta-primary.large {
          padding: 18px 40px;
          font-size: 1.2rem;
        }

        /* FEATURES */
        .features-section {
          padding: 60px 24px;
          max-width: 900px;
          margin: 0 auto;
        }

        .section-title {
          font-size: 1.75rem;
          font-weight: 800;
          text-align: center;
          margin: 0 0 40px;
          letter-spacing: -0.02em;
        }

        .features-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }

        @media (min-width: 600px) {
          .features-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 900px) {
          .features-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .feature-card {
          padding: 24px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 20px;
          transition: all 0.3s;
          animation: fadeInUp 0.5s ease-out backwards;
        }

        .feature-card:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.1);
          transform: translateY(-4px);
        }

        .feature-card.highlight {
          background: linear-gradient(145deg, rgba(74, 144, 226, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%);
          border-color: rgba(74, 144, 226, 0.2);
        }

        .feature-icon {
          width: 48px;
          height: 48px;
          background: rgba(74, 144, 226, 0.15);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #4A90E2;
          margin-bottom: 16px;
        }

        .feature-title {
          font-size: 1.1rem;
          font-weight: 700;
          margin: 0 0 8px;
        }

        .feature-desc {
          font-size: 0.9rem;
          line-height: 1.5;
          color: rgba(255, 255, 255, 0.6);
          margin: 0;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* COMPARISON */
        .comparison-section {
          padding: 60px 24px;
          max-width: 600px;
          margin: 0 auto;
        }

        .comparison-table {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 20px;
          overflow: hidden;
        }

        .comparison-header {
          display: grid;
          grid-template-columns: 1fr 60px 60px;
          gap: 8px;
          padding: 16px 20px;
          background: rgba(255, 255, 255, 0.03);
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: rgba(255, 255, 255, 0.5);
        }

        .comparison-row {
          display: grid;
          grid-template-columns: 1fr 60px 60px;
          gap: 8px;
          padding: 14px 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.04);
          font-size: 0.9rem;
          animation: fadeInUp 0.4s ease-out backwards;
        }

        .col-free, .col-pro {
          text-align: center;
        }

        .check-muted {
          color: rgba(255, 255, 255, 0.3);
        }

        .check-pro {
          color: #22c55e;
        }

        .dash {
          color: rgba(255, 255, 255, 0.2);
        }

        /* SOCIAL PROOF */
        .social-section {
          padding: 60px 24px;
          max-width: 700px;
          margin: 0 auto;
        }

        .stat-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        .stat-card {
          text-align: center;
          padding: 24px 16px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
        }

        .stat-value {
          font-size: 1.75rem;
          font-weight: 800;
          color: #4A90E2;
          margin-bottom: 4px;
        }

        .stat-label {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.5);
          font-weight: 500;
        }

        /* FINAL CTA */
        .final-cta {
          text-align: center;
          padding: 80px 24px;
          background: linear-gradient(180deg, transparent 0%, rgba(74, 144, 226, 0.05) 50%, transparent 100%);
        }

        .final-cta h2 {
          font-size: 2rem;
          font-weight: 800;
          margin: 0 0 12px;
        }

        .final-cta p {
          font-size: 1rem;
          color: rgba(255, 255, 255, 0.6);
          margin: 0 0 32px;
        }

        .final-cta .guarantee {
          margin-top: 16px;
        }

        /* RESPONSIVE */
        @media (max-width: 480px) {
          .hero-title {
            font-size: 2rem;
          }

          .amount {
            font-size: 3rem;
          }

          .stat-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }

          .stat-card {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            padding: 16px;
          }

          .stat-value {
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
}

export default Upgrade;
