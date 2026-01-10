import React, { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { MapPinIcon } from "@/components/UnifiedIcons";

interface Plan {
  id: string;
  lake_name: string;
  generation_date: string;
  plan_type: "member" | "preview";
  conditions: {
    temp_low: number;
    temp_high: number;
    sky_condition: string;
    wind_speed: number;
  };
  plan_url: string;
  can_download_pdf: boolean;
}

interface PlanHistoryResponse {
  plans: Plan[];
  total: number;
  has_more: boolean;
}

export function PlanHistory() {
  const { getToken } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

  useEffect(() => {
    fetchPlans();
  }, [offset]);

  const fetchPlans = async () => {
    try {
      const token = await getToken();
      const response = await fetch(
        `${API_BASE}/members/plan-history?limit=10&offset=${offset}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to fetch plan history: ${response.status} - ${errorText}`
        );
      }

      const data: PlanHistoryResponse = await response.json();

      if (offset === 0) {
        setPlans(data.plans);
      } else {
        setPlans((prev) => [...prev, ...data.plans]);
      }

      setHasMore(data.has_more);
    } catch (err) {
      console.error("Failed to fetch plan history:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load plan history"
      );
    } finally {
      setLoading(false);
    }
  };

  const copyPlanLink = (plan: Plan) => {
    // Use the backend's plan_url directly - it's already in correct format
    navigator.clipboard.writeText(plan.plan_url);

    const toast = document.createElement("div");
    toast.textContent = "Link copied to clipboard!";
    toast.style.cssText =
      "position: fixed; bottom: 20px; right: 20px; background: #22c55e; color: white; padding: 12px 24px; border-radius: 8px; font-weight: 500; z-index: 9999;";
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return (
      date.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }) +
      " at " +
      date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      })
    );
  };

  if (loading && offset === 0) {
    return (
      <div
        style={{
          background:
            "linear-gradient(135deg, rgba(74, 144, 226, 0.08) 0%, rgba(10, 10, 10, 0.4) 100%)",
          border: "1px solid rgba(74, 144, 226, 0.2)",
          borderRadius: 16,
          padding: 32,
          marginBottom: 24,
        }}
      >
        <h2
          style={{
            fontSize: "1.25rem",
            fontWeight: 600,
            color: "#4A90E2",
            marginBottom: 16,
          }}
        >
          Plan History
        </h2>
        <div style={{ textAlign: "center", padding: "32px 0" }}>
          <div className="spinner"></div>
          <p style={{ color: "rgba(255,255,255,0.6)", marginTop: 16 }}>
            Loading your plans...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          background:
            "linear-gradient(135deg, rgba(74, 144, 226, 0.08) 0%, rgba(10, 10, 10, 0.4) 100%)",
          border: "1px solid rgba(74, 144, 226, 0.2)",
          borderRadius: 16,
          padding: 32,
          marginBottom: 24,
        }}
      >
        <h2
          style={{
            fontSize: "1.25rem",
            fontWeight: 600,
            color: "#4A90E2",
            marginBottom: 16,
          }}
        >
          Plan History
        </h2>
        <div
          style={{
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            borderRadius: 12,
            padding: 16,
          }}
        >
          <p style={{ color: "#ef4444" }}>{error}</p>
        </div>
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div
        style={{
          background:
            "linear-gradient(135deg, rgba(74, 144, 226, 0.08) 0%, rgba(10, 10, 10, 0.4) 100%)",
          border: "1px solid rgba(74, 144, 226, 0.2)",
          borderRadius: 16,
          padding: 32,
          marginBottom: 24,
        }}
      >
        <h2
          style={{
            fontSize: "1.25rem",
            fontWeight: 600,
            color: "#4A90E2",
            marginBottom: 16,
          }}
        >
          Plan History
        </h2>
        <div style={{ textAlign: "center", padding: "48px 0" }}>
          <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: 24 }}>
            You haven't generated any plans yet
          </p>
          <a href="/members" className="btn primary">
            Generate Your First Plan
          </a>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        background:
          "linear-gradient(135deg, rgba(74, 144, 226, 0.08) 0%, rgba(10, 10, 10, 0.4) 100%)",
        border: "1px solid rgba(74, 144, 226, 0.2)",
        borderRadius: 16,
        padding: 32,
        marginBottom: 24,
      }}
    >
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600, color: "#4A90E2" }}>
          Plan History
        </h2>
        <p
          style={{
            fontSize: "0.875rem",
            color: "rgba(255,255,255,0.6)",
            marginTop: 4,
          }}
        >
          Your plans from the last 30 days
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {(showAll ? plans : plans.slice(0, 3)).map((plan) => (
          <div
            key={plan.id}
            style={{
              padding: 20,
              background: "rgba(255, 255, 255, 0.03)",
              borderRadius: 12,
              border: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 8,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ color: "#4A90E2" }}>
                  <MapPinIcon size={18} />
                </div>
                <h3
                  style={{ color: "#fff", fontWeight: 500, fontSize: "1.1rem" }}
                >
                  {plan.lake_name}
                </h3>
              </div>
              <span
                style={{
                  padding: "4px 10px",
                  borderRadius: 6,
                  fontSize: "0.75rem",
                  fontWeight: 500,
                  ...(plan.plan_type === "member"
                    ? {
                        background: "rgba(59, 130, 246, 0.2)",
                        color: "#60a5fa",
                        border: "1px solid rgba(59, 130, 246, 0.3)",
                      }
                    : {
                        background: "rgba(156, 163, 175, 0.2)",
                        color: "#9ca3af",
                        border: "1px solid rgba(156, 163, 175, 0.3)",
                      }),
                }}
              >
                {plan.plan_type === "member" ? "Member" : "Preview"}
              </span>
            </div>

            {/* Date */}
            <div
              style={{
                fontSize: "0.875rem",
                color: "rgba(255,255,255,0.6)",
                marginBottom: 16,
              }}
            >
              {formatDate(plan.generation_date)}
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <a
                href={plan.plan_url}
                className="btn primary"
                style={{
                  textDecoration: "none",
                  fontSize: "0.875rem",
                  padding: "10px 20px",
                  background:
                    "linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)",
                  borderRadius: 8,
                  fontWeight: 600,
                  border: "none",
                  color: "#fff",
                }}
              >
                View Plan
              </a>
              <button
                onClick={() => copyPlanLink(plan)}
                style={{
                  fontSize: "0.875rem",
                  padding: "10px 20px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: 8,
                  color: "#fff",
                  cursor: "pointer",
                  fontWeight: 500,
                }}
                title="Copy link"
              >
                📋 Copy Link
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Show All / Show Less Toggle */}
      {plans.length > 3 && (
        <div style={{ marginTop: 20, textAlign: "center" }}>
          <button
            onClick={() => setShowAll(!showAll)}
            style={{
              padding: "12px 24px",
              background: "rgba(74, 144, 226, 0.1)",
              border: "1px solid rgba(74, 144, 226, 0.3)",
              borderRadius: 8,
              color: "#4A90E2",
              cursor: "pointer",
              fontWeight: 500,
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(74, 144, 226, 0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(74, 144, 226, 0.1)";
            }}
          >
            {showAll ? `Show Less ▲` : `Show All ${plans.length} Plans ▼`}
          </button>
        </div>
      )}

      {/* Load More (only when showing all AND there's more to load) */}
      {showAll && hasMore && (
        <div style={{ marginTop: 16, textAlign: "center" }}>
          <button
            onClick={() => setOffset(offset + 10)}
            disabled={loading}
            style={{
              padding: "12px 24px",
              background: loading
                ? "rgba(255, 255, 255, 0.03)"
                : "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: 8,
              color: "#fff",
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: 500,
              opacity: loading ? 0.5 : 1,
            }}
          >
            {loading ? "Loading..." : "Load More Plans"}
          </button>
        </div>
      )}
    </div>
  );
}
