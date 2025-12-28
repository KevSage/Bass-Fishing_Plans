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
    const url = `${window.location.origin}${plan.plan_url}`;
    navigator.clipboard.writeText(url);

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
      <div className="card" style={{ marginBottom: 24 }}>
        <h2
          style={{
            fontSize: "1.25rem",
            fontWeight: 600,
            color: "#fff",
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
      <div className="card" style={{ marginBottom: 24 }}>
        <h2
          style={{
            fontSize: "1.25rem",
            fontWeight: 600,
            color: "#fff",
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
      <div className="card" style={{ marginBottom: 24 }}>
        <h2
          style={{
            fontSize: "1.25rem",
            fontWeight: 600,
            color: "#fff",
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
    <div className="card" style={{ marginBottom: 24 }}>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600, color: "#fff" }}>
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
        {plans.map((plan) => (
          <div key={plan.id} className="card" style={{ padding: 16 }}>
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
                <h3 style={{ color: "#fff", fontWeight: 500 }}>
                  {plan.lake_name}
                </h3>
              </div>
              <span
                style={{
                  padding: "4px 8px",
                  borderRadius: 4,
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
                marginBottom: 12,
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
                  padding: "8px 16px",
                }}
              >
                View Plan
              </a>
              <button
                onClick={() => copyPlanLink(plan)}
                className="btn"
                style={{ fontSize: "0.875rem", padding: "8px 16px" }}
                title="Copy link"
              >
                📋 Copy Link
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Load More */}
      {hasMore && (
        <div style={{ marginTop: 16, textAlign: "center" }}>
          <button
            onClick={() => setOffset(offset + 10)}
            disabled={loading}
            className="btn"
            style={{ opacity: loading ? 0.5 : 1 }}
          >
            {loading ? "Loading..." : "Show More Plans"}
          </button>
        </div>
      )}
    </div>
  );
}
