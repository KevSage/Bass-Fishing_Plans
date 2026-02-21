import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PlanHistory } from "../components/PlanHistory";
import { usePlatformAuth, usePlatformUser } from "@/hooks/usePlatformAuth";
import { useNativeAuth } from "@/context/NativeAuthContext";
import { isNativePlatform, getApiBaseUrl } from "@/lib/platform";
import { useStoreKitPurchases } from "@/hooks/useStoreKitPurchases";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

// --- LOCAL ICONS ---
const CrownIcon = ({
  size = 24,
  className,
}: {
  size?: number;
  className?: string;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
  </svg>
);
const ShieldCheckIcon = ({
  size = 24,
  className,
}: {
  size?: number;
  className?: string;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);
const MapPinIcon = ({
  size = 24,
  className,
}: {
  size?: number;
  className?: string;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);
const HelpCircleIcon = ({
  size = 24,
  className,
}: {
  size?: number;
  className?: string;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);
const ArrowRightIcon = ({
  size = 24,
  className,
}: {
  size?: number;
  className?: string;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);
const LogOutIcon = ({
  size = 24,
  className,
}: {
  size?: number;
  className?: string;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

interface SubscriptionData {
  status: "active" | "inactive" | "cancelled" | "expired";
  nextBillingDate?: string;
  plan: string;
  price: string;
}

interface MemberStatus {
  email: string;
  is_member: boolean;
  has_subscription: boolean;
  rate_limit_allowed: boolean;
  rate_limit_seconds: number;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: string | null;
  next_billing_date: number | null;
  cancel_at_period_end: boolean | null;
  plan_interval: string | null;
  plan_amount: number | null;
}

// Mapbox style options (curated for fishing - no road-heavy styles)
// Note: Light theme CSS is ready in members.css but removed from options until
// we generate light-themed favorite thumbnails, PlanPage map, and lure images
const MAPBOX_STYLES = [
  { value: "mapbox://styles/kaiwenphoenix/cmlssh825005w01s6awzzdncn", label: "Dark", description: "Clean, matches app UI" },
  { value: "mapbox://styles/mapbox/outdoors-v12", label: "Outdoors", description: "Topographic detail" },
  { value: "mapbox://styles/mapbox/satellite-streets-v12", label: "Satellite", description: "Aerial imagery" },
];

const MAPBOX_STYLE_KEY = "bc_mapbox_style";
const DEFAULT_MAP_STYLE = "mapbox://styles/kaiwenphoenix/cmlssh825005w01s6awzzdncn";

export function Account() {
  const { user, isLoaded } = usePlatformUser();
  const { signOut, getToken } = usePlatformAuth();
  const nativeAuth = useNativeAuth();
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(
    null,
  );
  const [memberStatus, setMemberStatus] = useState<MemberStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // StoreKit for iOS restore purchases
  const { restorePurchases } = useStoreKitPurchases();
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Map style preference - reset to default if saved style is no longer available
  const [mapStyle, setMapStyle] = useState(() => {
    const saved = localStorage.getItem(MAPBOX_STYLE_KEY);
    const isValidStyle = MAPBOX_STYLES.some(s => s.value === saved);
    if (saved && !isValidStyle) {
      localStorage.setItem(MAPBOX_STYLE_KEY, DEFAULT_MAP_STYLE);
      return DEFAULT_MAP_STYLE;
    }
    return saved || DEFAULT_MAP_STYLE;
  });

  const handleMapStyleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStyle = e.target.value;
    setMapStyle(newStyle);
    localStorage.setItem(MAPBOX_STYLE_KEY, newStyle);
  };

  useEffect(() => {
    const fetchSubscription = async () => {
      // For native platform, check nativeAuth instead of user
      if (isNativePlatform()) {
        if (!nativeAuth.isSignedIn || !nativeAuth.userEmail || !nativeAuth.userId) {
          setLoading(false);
          return;
        }
      } else {
        if (!isLoaded || !user) return;
      }

      try {
        let data: MemberStatus;

        if (isNativePlatform() && nativeAuth.userEmail && nativeAuth.userId) {
          // Use mobile endpoint for native platforms
          console.log('[Account] Fetching member status via mobile endpoint');
          const response = await fetch(`${getApiBaseUrl()}/mobile-auth/status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: nativeAuth.userEmail,
              user_id: nativeAuth.userId,
            }),
          });

          if (!response.ok) {
            throw new Error("Failed to fetch subscription status");
          }

          data = await response.json();
        } else {
          // Web platform: use JWT token
          const token = await getToken();
          const response = await fetch(`${API_BASE}/members/status`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (!response.ok)
            throw new Error("Failed to fetch subscription status");

          data = await response.json();
        }

        setMemberStatus(data);

        if (data.is_member) {
          let mappedStatus: "active" | "inactive" | "cancelled" | "expired" =
            "active";
          if (data.subscription_status) {
            switch (data.subscription_status.toLowerCase()) {
              case "active":
              case "trialing":
                mappedStatus = "active";
                break;
              case "past_due":
              case "unpaid":
                mappedStatus = "inactive";
                break;
              case "canceled":
                mappedStatus = "cancelled";
                break;
              case "incomplete":
              case "incomplete_expired":
                mappedStatus = "expired";
                break;
              default:
                // Default to active for FREE_MODE (no subscription_status)
                mappedStatus = "active";
            }
          }

          setSubscription({
            status: mappedStatus,
            nextBillingDate: data.next_billing_date
              ? new Date(data.next_billing_date * 1000).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : undefined,
            plan: data.plan_interval === "year" ? "Annual" : "Monthly",
            price: `$${data.plan_amount || 10}/${data.plan_interval || "mo"}`,
          });
        } else if (data.has_subscription) {
          setSubscription({
            status: "inactive",
            plan: data.plan_interval === "year" ? "Annual" : "Monthly",
            price: `$${data.plan_amount || 10}/${data.plan_interval || "mo"}`,
          });
        }
      } catch (err) {
        console.error("Failed to fetch subscription:", err);
        setError("Unable to sync subscription data");
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, [isLoaded, user?.id, nativeAuth.isSignedIn, nativeAuth.userEmail]); // getToken removed from deps to prevent loop

  const handleManageSubscription = async () => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_BASE}/billing/portal`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to create portal session");

      const data = await response.json();
      window.location.href = data.portal_url;
    } catch (err) {
      console.error("Failed to open portal:", err);
      setError("Subscription portal unavailable");
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  // Restore purchases for iOS (Apple requires this)
  const handleRestorePurchases = async () => {
    if (!isNativePlatform()) return;

    setIsRestoring(true);
    setRestoreMessage(null);

    try {
      const result = await restorePurchases();

      if (result.success) {
        // Check with backend if subscription is now active
        // The restore operation syncs with Apple's servers, so backend should reflect the status
        if (nativeAuth.userEmail && nativeAuth.userId) {
          const response = await fetch(`${getApiBaseUrl()}/mobile-auth/status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: nativeAuth.userEmail,
              user_id: nativeAuth.userId,
            }),
          });

          const data = await response.json();

          if (data.is_member) {
            setRestoreMessage({ type: 'success', text: 'Subscription restored successfully!' });
            // Refresh the page to update UI
            setTimeout(() => window.location.reload(), 1500);
          } else {
            setRestoreMessage({ type: 'error', text: 'No active subscription found' });
          }
        }
      } else {
        setRestoreMessage({ type: 'error', text: 'No purchases to restore' });
      }
    } catch (err) {
      console.error('[Account] Restore failed:', err);
      setRestoreMessage({ type: 'error', text: 'Failed to restore purchases' });
    } finally {
      setIsRestoring(false);
    }
  };

  // On native, use nativeAuth.isLoaded; on web, use Clerk's isLoaded
  const authLoaded = isNativePlatform() ? nativeAuth.isLoaded : isLoaded;

  if (!authLoaded || loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#070708",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "rgba(255,255,255,0.5)",
          fontSize: "0.9rem",
          letterSpacing: "0.05em",
        }}
      >
        LOADING ACCOUNT...
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      active: {
        bg: "rgba(34, 197, 94, 0.1)",
        text: "#4ade80",
        border: "rgba(34, 197, 94, 0.2)",
      },
      inactive: {
        bg: "rgba(156, 163, 175, 0.1)",
        text: "#9ca3af",
        border: "rgba(156, 163, 175, 0.2)",
      },
      cancelled: {
        bg: "rgba(239, 68, 68, 0.1)",
        text: "#f87171",
        border: "rgba(239, 68, 68, 0.2)",
      },
      expired: {
        bg: "rgba(251, 146, 60, 0.1)",
        text: "#fb923c",
        border: "rgba(251, 146, 60, 0.2)",
      },
    };
    const style = styles[status as keyof typeof styles] || styles.inactive;

    return (
      <span
        style={{
          padding: "4px 12px",
          borderRadius: "100px",
          fontSize: "0.75rem",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          border: `1px solid ${style.border}`,
          background: style.bg,
          color: style.text,
        }}
      >
        {status}
      </span>
    );
  };

  const isPro = subscription && subscription.status === "active";

  return (
    <div className="account-page">
      <div className="account-container">
        {/* HEADER */}
        <header className="account-header">
          <div>
            <h1 className="header-title">Account</h1>
            <p className="header-email">
              {isNativePlatform() ? nativeAuth.userEmail : user?.primaryEmailAddress?.emailAddress}
            </p>
          </div>
          {isPro && (
            <div className="pro-badge">
              <CrownIcon size={14} />
              <span>PRO MEMBER</span>
            </div>
          )}
        </header>

        {error && (
          <div className="error-banner">
            <p>{error}</p>
          </div>
        )}

        {/* SUBSCRIPTION CARD */}
        <section className="glass-card main-card">
          <div className="card-row">
            <div>
              <span className="label">Current Plan</span>
              <div className={`plan-name ${isPro ? "text-blue" : ""}`}>
                {isPro ? "Bass Clarity Pro" : "Angler (Free)"}
              </div>
            </div>
            {subscription && getStatusBadge(subscription.status)}
          </div>

          {!isPro ? (
            // FREE USER VIEW
            <div className="upsell-container">
              <div className="benefit-list">
                {[
                  "AI Fishing Plan Generator",
                  "Real-Time Lake Weather & Wind",
                  "Advanced Pattern Insights",
                  "Unlimited Saved Lakes",
                  "Auto-Log GPS & Weather",
                ].map((feature) => (
                  <div key={feature} className="benefit-item">
                    <div className="check-box">
                      <ShieldCheckIcon size={14} className="text-blue" />
                    </div>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <Link to="/upgrade" className="upgrade-btn">
                Upgrade to Pro
              </Link>
              <p className="upsell-footer">Instant access. Cancel anytime.</p>

              {/* Restore Purchases for native iOS (Apple requires this) */}
              {isNativePlatform() && (
                <button
                  onClick={handleRestorePurchases}
                  disabled={isRestoring}
                  className="restore-btn"
                >
                  {isRestoring ? 'Restoring...' : 'Restore Purchases'}
                </button>
              )}

              {/* Restore message */}
              {restoreMessage && (
                <p className={`restore-message ${restoreMessage.type}`}>
                  {restoreMessage.text}
                </p>
              )}
            </div>
          ) : (
            // PRO USER VIEW
            <div className="subscription-details">
              <div className="detail-row">
                <span className="label">Billing Interval</span>
                <span className="value">{subscription?.plan}</span>
              </div>
              <div className="detail-row">
                <span className="label">Price</span>
                <span className="value">{subscription?.price}</span>
              </div>
              {subscription?.nextBillingDate && (
                <div className="detail-row">
                  <span className="label">Next Billing</span>
                  <span className="value">{subscription.nextBillingDate}</span>
                </div>
              )}
              {/* Hide Manage Subscription on native (Stripe portal doesn't work in WebView) */}
              {subscription.status === "active" && !isNativePlatform() && (
                <button
                  onClick={handleManageSubscription}
                  className="manage-link"
                >
                  Manage Subscription
                </button>
              )}
              {/* Show contact support for native users */}
              {subscription.status === "active" && isNativePlatform() && (
                <>
                  <a
                    href="mailto:bassclarity@gmail.com?subject=Subscription%20Support"
                    className="manage-link"
                    style={{ textAlign: "center", textDecoration: "none" }}
                  >
                    Contact Support for Billing
                  </a>
                  <button
                    onClick={handleRestorePurchases}
                    disabled={isRestoring}
                    className="restore-btn-pro"
                  >
                    {isRestoring ? 'Restoring...' : 'Restore Purchases'}
                  </button>
                  {restoreMessage && (
                    <p className={`restore-message ${restoreMessage.type}`}>
                      {restoreMessage.text}
                    </p>
                  )}
                </>
              )}
            </div>
          )}
        </section>

        {/* PLAN HISTORY (Premium Feature) */}
        {memberStatus?.has_subscription && <PlanHistory />}

        {/* QUICK LINKS GRID */}
        <nav className="nav-grid">
          <Link to="/members" className="glass-card nav-item">
            <div className="nav-icon-box">
              <MapPinIcon size={18} />
            </div>
            <div className="nav-text">
              <span className="nav-title">Map Dashboard</span>
              <ArrowRightIcon size={14} className="nav-arrow" />
            </div>
          </Link>

          <Link to="/faq" className="glass-card nav-item">
            <div className="nav-icon-box">
              <HelpCircleIcon size={18} />
            </div>
            <div className="nav-text">
              <span className="nav-title">Support & FAQ</span>
              <ArrowRightIcon size={14} className="nav-arrow" />
            </div>
          </Link>
        </nav>

        {/* PREFERENCES SECTION */}
        <section className="glass-card preferences-card">
          <h2 className="preferences-title">Preferences</h2>

          <div className="preference-row">
            <div className="preference-label">
              <span className="preference-name">Map Style</span>
              <span className="preference-desc">Choose your preferred map appearance</span>
            </div>
            <select
              value={mapStyle}
              onChange={handleMapStyleChange}
              className="preference-select"
            >
              {MAPBOX_STYLES.map((style) => (
                <option key={style.value} value={style.value}>
                  {style.label}
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* FOOTER ACTIONS */}
        <footer className="account-footer">
          <button onClick={handleSignOut} className="sign-out-btn">
            <LogOutIcon size={16} />
            <span>Sign Out</span>
          </button>
          <p className="support-text">
            Bass Clarity &copy; 2026.{" "}
            <a href="mailto:bassclarity@gmail.com">Contact Support</a>
          </p>
        </footer>
      </div>

      <style>{`
        /* Reduced top padding from 100px to 80px */
        .account-page { 
          min-height: 100vh; 
          background: #070708; 
          color: #fff; 
          padding: 80px 24px 60px; 
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }
        .account-container { max-width: 600px; margin: 0 auto; }
        
        .account-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
        .header-title { font-size: 1.75rem; font-weight: 800; letter-spacing: -0.02em; margin: 0; }
        .header-email { color: rgba(255,255,255,0.4); font-size: 0.9rem; margin: 4px 0 0; }

        .pro-badge { 
          display: flex; align-items: center; gap: 6px; 
          background: rgba(74, 144, 226, 0.1); border: 1px solid rgba(74, 144, 226, 0.3); 
          padding: 6px 12px; border-radius: 100px; color: #4A90E2; 
          font-size: 0.7rem; font-weight: 800; letter-spacing: 0.05em; 
        }

        .glass-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 20px; transition: all 0.2s ease; }
        .main-card { padding: 28px; margin-bottom: 24px; }
        
        .card-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
        .label { font-size: 0.75rem; color: rgba(255,255,255,0.4); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 4px; }
        .plan-name { font-size: 1.1rem; font-weight: 700; color: rgba(255,255,255,0.8); }
        .text-blue { color: #4A90E2 !important; }

        .upsell-container { background: rgba(0,0,0,0.2); border-radius: 16px; padding: 24px; }
        .benefit-list { display: flex; flex-direction: column; gap: 12px; margin-bottom: 24px; }
        .benefit-item { display: flex; align-items: center; gap: 12px; font-size: 0.85rem; color: rgba(255,255,255,0.75); }
        .check-box { color: #4A90E2; display: flex; align-items: center; }
        
        .upgrade-btn { 
          display: block; width: 100%; padding: 14px; 
          background: linear-gradient(135deg, #4A90E2 0%, #357ABD 100%); 
          color: #fff; border-radius: 12px; text-align: center; text-decoration: none; 
          font-weight: 700; font-size: 0.95rem; transition: transform 0.2s;
          box-shadow: 0 8px 24px rgba(74, 144, 226, 0.2);
        }
        .upgrade-btn:hover { transform: translateY(-1px); filter: brightness(1.1); }
        .upsell-footer { text-align: center; font-size: 0.75rem; color: rgba(255,255,255,0.3); margin-top: 12px; }

        .subscription-details { border-top: 1px solid rgba(255,255,255,0.06); padding-top: 24px; }
        .detail-row { display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 16px; }
        .value { font-weight: 600; color: rgba(255,255,255,0.9); }
        .manage-link { 
          width: 100%; margin-top: 12px; padding: 14px; 
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); 
          color: #fff; border-radius: 12px; font-size: 0.85rem; font-weight: 600; cursor: pointer; 
          transition: background 0.2s;
        }
        .manage-link:hover { background: rgba(255,255,255,0.1); }

        .nav-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 16px; }
        .nav-item { padding: 24px; text-decoration: none; display: flex; flex-direction: column; gap: 16px; }
        .nav-item:hover { background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.12); }
        .nav-icon-box { width: 40px; height: 40px; background: rgba(255,255,255,0.04); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.7); }
        .nav-text { display: flex; justify-content: space-between; align-items: center; }
        .nav-title { font-size: 0.9rem; font-weight: 600; color: rgba(255,255,255,0.9); }
        .nav-arrow { color: rgba(255,255,255,0.2); }

        .account-footer { margin-top: 80px; text-align: center; }
        .sign-out-btn { background: none; border: none; color: rgba(255,255,255,0.3); display: flex; align-items: center; gap: 8px; margin: 0 auto 24px; cursor: pointer; font-size: 0.9rem; font-weight: 500; transition: color 0.2s; }
        .sign-out-btn:hover { color: #ef4444; }
        .support-text { font-size: 0.75rem; color: rgba(255,255,255,0.2); }
        .support-text a { color: inherit; text-decoration: underline; }

        .error-banner { background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 12px; padding: 12px 16px; margin-bottom: 24px; color: #f87171; font-size: 0.85rem; }

        .restore-btn {
          width: 100%; margin-top: 16px; padding: 12px;
          background: transparent; border: 1px solid rgba(255,255,255,0.15);
          color: rgba(255,255,255,0.6); border-radius: 10px;
          font-size: 0.85rem; font-weight: 500; cursor: pointer;
          transition: all 0.2s;
        }
        .restore-btn:hover { border-color: rgba(255,255,255,0.3); color: rgba(255,255,255,0.8); }
        .restore-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .restore-btn-pro {
          width: 100%; margin-top: 12px; padding: 12px;
          background: transparent; border: 1px solid rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.4); border-radius: 10px;
          font-size: 0.8rem; font-weight: 500; cursor: pointer;
          transition: all 0.2s;
        }
        .restore-btn-pro:hover { border-color: rgba(255,255,255,0.2); color: rgba(255,255,255,0.6); }
        .restore-btn-pro:disabled { opacity: 0.5; cursor: not-allowed; }

        .restore-message { text-align: center; font-size: 0.8rem; margin-top: 12px; padding: 8px 12px; border-radius: 8px; }
        .restore-message.success { background: rgba(34, 197, 94, 0.1); color: #4ade80; }
        .restore-message.error { background: rgba(239, 68, 68, 0.1); color: #f87171; }

        .preferences-card { padding: 24px; margin-top: 24px; }
        .preferences-title { font-size: 1rem; font-weight: 700; margin: 0 0 20px; color: rgba(255,255,255,0.9); }
        .preference-row { display: flex; justify-content: space-between; align-items: center; gap: 16px; }
        .preference-label { display: flex; flex-direction: column; gap: 2px; }
        .preference-name { font-size: 0.9rem; font-weight: 600; color: rgba(255,255,255,0.85); }
        .preference-desc { font-size: 0.75rem; color: rgba(255,255,255,0.4); }
        .preference-select {
          padding: 10px 14px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          color: #fff;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          min-width: 140px;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.5)' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
          padding-right: 36px;
        }
        .preference-select:focus { outline: none; border-color: rgba(74,144,226,0.5); }
        .preference-select option { background: #1a1a1f; color: #fff; }

        @media (max-width: 600px) {
          .account-page { padding: 20px 20px 40px; }
          .header-title { font-size: 1.5rem; }
          .card-row { flex-direction: column; gap: 12px; align-items: flex-start; }
        }
      `}</style>
    </div>
  );
}
