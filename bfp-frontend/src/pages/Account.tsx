import { useUser, useClerk, useAuth } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PlanHistory } from "../components/PlanHistory";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

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

export function Account() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(
    null
  );
  const [memberStatus, setMemberStatus] = useState<MemberStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!isLoaded || !user) return;

      try {
        const token = await getToken();
        const response = await fetch(`${API_BASE}/members/status`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok)
          throw new Error("Failed to fetch subscription status");

        const data: MemberStatus = await response.json();
        setMemberStatus(data);

        if (data.is_member && data.next_billing_date) {
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
                mappedStatus = "inactive";
            }
          }

          setSubscription({
            status: mappedStatus,
            nextBillingDate: new Date(
              data.next_billing_date * 1000
            ).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            }),
            plan: data.plan_interval === "year" ? "Annual" : "Monthly",
            price: `$${data.plan_amount || 15}/${
              data.plan_interval || "month"
            }`,
          });
        } else if (data.has_subscription) {
          setSubscription({
            status: "inactive",
            plan: data.plan_interval === "year" ? "Annual" : "Monthly",
            price: `$${data.plan_amount || 15}/${
              data.plan_interval || "month"
            }`,
          });
        }
      } catch (err) {
        console.error("Failed to fetch subscription:", err);
        setError("Failed to load subscription data");
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, [isLoaded, user?.id, getToken]);

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
      setError("Failed to open subscription portal. Please try again.");
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (!isLoaded || loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(180deg, #1a1a1a 0%, #0a0a0a 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ color: "#fff", fontSize: "1.1rem" }}>Loading...</div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      active: {
        bg: "rgba(34, 197, 94, 0.2)",
        text: "#4ade80",
        border: "rgba(34, 197, 94, 0.3)",
      },
      inactive: {
        bg: "rgba(156, 163, 175, 0.2)",
        text: "#9ca3af",
        border: "rgba(156, 163, 175, 0.3)",
      },
      cancelled: {
        bg: "rgba(239, 68, 68, 0.2)",
        text: "#f87171",
        border: "rgba(239, 68, 68, 0.3)",
      },
      expired: {
        bg: "rgba(251, 146, 60, 0.2)",
        text: "#fb923c",
        border: "rgba(251, 146, 60, 0.3)",
      },
    };
    const style = styles[status as keyof typeof styles];

    return (
      <span
        style={{
          padding: "6px 12px",
          borderRadius: 20,
          fontSize: "0.875rem",
          fontWeight: 500,
          border: `1px solid ${style.border}`,
          background: style.bg,
          color: style.text,
        }}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #1a1a1a 0%, #0a0a0a 100%)",
        padding: "48px 24px",
        color: "#fff",
      }}
    >
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <div style={{ marginBottom: 32 }}>
          <h1
            style={{
              fontSize: "clamp(2rem, 5vw, 2.5rem)",
              fontWeight: 600,
              marginBottom: 8,
            }}
          >
            Account
          </h1>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "1.1rem" }}>
            Manage your subscription and account settings
          </p>
        </div>

        {error && (
          <div
            style={{
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: 12,
              padding: 16,
              marginBottom: 24,
            }}
          >
            <p style={{ color: "#ef4444" }}>{error}</p>
          </div>
        )}

        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 12,
            padding: 24,
            marginBottom: 24,
          }}
        >
          <h2
            style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: 16 }}
          >
            Account Information
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ color: "rgba(255,255,255,0.6)" }}>Email</span>
              <span style={{ fontWeight: 500 }}>
                {memberStatus?.email ||
                  user?.primaryEmailAddress?.emailAddress ||
                  "Not available"}
              </span>
            </div>
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}></div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ color: "rgba(255,255,255,0.6)" }}>Name</span>
              <span style={{ fontWeight: 500 }}>
                {user?.fullName || "Not set"}
              </span>
            </div>
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}></div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ color: "rgba(255,255,255,0.6)" }}>
                Member Since
              </span>
              <span style={{ fontWeight: 500 }}>
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })
                  : "Unknown"}
              </span>
            </div>
          </div>
        </div>

        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 12,
            padding: 24,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 16,
            }}
          >
            <h2 style={{ fontSize: "1.25rem", fontWeight: 600 }}>
              Subscription
            </h2>
            {subscription && getStatusBadge(subscription.status)}
          </div>

          {subscription &&
            subscription.status === "active" &&
            memberStatus?.cancel_at_period_end && (
              <div
                style={{
                  background: "rgba(251, 146, 60, 0.1)",
                  border: "1px solid rgba(251, 146, 60, 0.3)",
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 24,
                }}
              >
                <p style={{ color: "#fb923c" }}>
                  Your subscription has been cancelled and will end on{" "}
                  {subscription.nextBillingDate}. You'll continue to have access
                  until then.
                </p>
              </div>
            )}

          {subscription ? (
            <div style={{ marginBottom: 24 }}>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 16 }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span style={{ color: "rgba(255,255,255,0.6)" }}>Plan</span>
                  <span style={{ fontWeight: 500 }}>{subscription.plan}</span>
                </div>
                <div
                  style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}
                ></div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span style={{ color: "rgba(255,255,255,0.6)" }}>Price</span>
                  <span style={{ fontWeight: 500 }}>{subscription.price}</span>
                </div>
                {subscription.nextBillingDate && (
                  <>
                    <div
                      style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}
                    ></div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span style={{ color: "rgba(255,255,255,0.6)" }}>
                        Next Billing Date
                      </span>
                      <span style={{ fontWeight: 500 }}>
                        {subscription.nextBillingDate}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div style={{ marginBottom: 24 }}>
              <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: 16 }}>
                You don't have an active subscription.
              </p>
              <Link to="/subscribe" className="btn primary">
                Subscribe Now
              </Link>
            </div>
          )}

          {subscription && subscription.status === "active" && (
            <button
              onClick={handleManageSubscription}
              className="btn"
              style={{ width: "100%" }}
            >
              Manage Subscription
            </button>
          )}
        </div>

        <PlanHistory />

        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 12,
            padding: 24,
            marginBottom: 24,
          }}
        >
          <h2
            style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: 16 }}
          >
            Quick Links
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Link
              to="/members"
              className="card"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: 12,
                textDecoration: "none",
                color: "#fff",
              }}
            >
              <span>Members Dashboard</span>
              <span>→</span>
            </Link>
            <Link
              to="/faq"
              className="card"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: 12,
                textDecoration: "none",
                color: "#fff",
              }}
            >
              <span>FAQ</span>
              <span>→</span>
            </Link>
          </div>
        </div>

        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <button
            onClick={handleSignOut}
            style={{
              background: "none",
              border: "none",
              color: "#ef4444",
              fontWeight: 500,
              cursor: "pointer",
              fontSize: "1rem",
            }}
          >
            Sign Out
          </button>
        </div>

        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.5)" }}>
            Need help?{" "}
            <a
              href="mailto:support@bassclarity.com"
              style={{ color: "#4a90e2", textDecoration: "none" }}
            >
              Contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
