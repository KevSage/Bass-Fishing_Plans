import React, { useEffect, useState } from "react";
import { usePlatformAuth } from "@/hooks/usePlatformAuth";
import { useNativeAuth } from "@/context/NativeAuthContext";
import { isNativePlatform, getApiBaseUrl } from "@/lib/platform";
import { listPlanHistoryMobile } from "@/lib/catches-api";
import {
  MapPinIcon,
  CalendarIcon,
  ArrowRightIcon,
} from "@/components/UnifiedIcons";

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
  const { getToken } = usePlatformAuth();
  const nativeAuth = useNativeAuth();
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
      let data: PlanHistoryResponse;

      if (isNativePlatform() && nativeAuth.userEmail && nativeAuth.userId) {
        // Use mobile endpoint
        data = await listPlanHistoryMobile(
          nativeAuth.userEmail,
          nativeAuth.userId,
          10,
          offset
        );
      } else {
        // Use web endpoint with JWT
        const token = await getToken();
        const response = await fetch(
          `${API_BASE}/members/plan-history?limit=10&offset=${offset}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Failed to fetch plan history: ${response.status} - ${errorText}`,
          );
        }

        data = await response.json();
      }

      if (offset === 0) {
        setPlans(data.plans);
      } else {
        setPlans((prev) => [...prev, ...data.plans]);
      }

      setHasMore(data.has_more);
    } catch (err) {
      console.error("Failed to fetch plan history:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load plan history",
      );
    } finally {
      setLoading(false);
    }
  };

  const copyPlanLink = (plan: Plan) => {
    navigator.clipboard.writeText(plan.plan_url);
    const toast = document.createElement("div");
    toast.textContent = "Link copied";
    toast.style.cssText =
      "position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%); background: #10B981; color: white; padding: 8px 16px; border-radius: 20px; font-size: 0.85rem; font-weight: 600; z-index: 9999; box-shadow: 0 4px 12px rgba(0,0,0,0.3);";
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  // --- STYLES ---
  const containerStyle: React.CSSProperties = {
    background: "rgba(255, 255, 255, 0.02)",
    border: "1px solid rgba(255, 255, 255, 0.06)",
    borderRadius: "20px",
    padding: "28px",
    marginBottom: "24px",
  };

  const headerStyle: React.CSSProperties = {
    fontSize: "1.1rem",
    fontWeight: 700,
    color: "#fff",
    marginBottom: "4px",
  };

  const subHeaderStyle: React.CSSProperties = {
    fontSize: "0.85rem",
    color: "rgba(255,255,255,0.4)",
    marginBottom: "24px",
  };

  const itemStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    padding: "20px",
    background: "rgba(255, 255, 255, 0.03)",
    borderRadius: "16px",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    transition: "background 0.2s",
  };

  if (loading && offset === 0) {
    return (
      <div style={containerStyle}>
        <h2 style={headerStyle}>Plan History</h2>
        <div
          style={{
            padding: "20px 0",
            color: "rgba(255,255,255,0.4)",
            fontSize: "0.9rem",
          }}
        >
          Loading history...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={containerStyle}>
        <h2 style={headerStyle}>Plan History</h2>
        <div
          style={{ color: "#ef4444", fontSize: "0.9rem", padding: "20px 0" }}
        >
          {error}
        </div>
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div style={containerStyle}>
        <h2 style={headerStyle}>Plan History</h2>
        <div style={{ textAlign: "center", padding: "32px 0" }}>
          <p
            style={{
              color: "rgba(255,255,255,0.4)",
              fontSize: "0.9rem",
              marginBottom: "20px",
            }}
          >
            No plans generated in the last 30 days.
          </p>
          <a
            href="/members"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 20px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "100px",
              color: "#fff",
              textDecoration: "none",
              fontSize: "0.85rem",
              fontWeight: 600,
            }}
          >
            Generate New Plan
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div>
        <h2 style={headerStyle}>Plan History</h2>
        <p style={subHeaderStyle}>Recent intelligence (30-day retention)</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {(showAll ? plans : plans.slice(0, 3)).map((plan) => (
          <div key={plan.id} style={itemStyle}>
            {/* Top Row: Icon + Name + Badge */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <div style={{ display: "flex", gap: "12px" }}>
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    background: "rgba(74, 144, 226, 0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#4A90E2",
                  }}
                >
                  <MapPinIcon size={16} />
                </div>
                <div>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: "0.95rem",
                      fontWeight: 600,
                      color: "#fff",
                    }}
                  >
                    {plan.lake_name}
                  </h3>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      marginTop: "4px",
                    }}
                  >
                    <CalendarIcon size={12} color="rgba(255,255,255,0.4)" />
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: "rgba(255,255,255,0.4)",
                      }}
                    >
                      {formatDate(plan.generation_date)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Badge */}
              {/* <span
                style={{
                  fontSize: "0.65rem",
                  padding: "2px 8px",
                  borderRadius: "6px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  background:
                    plan.plan_type === "member"
                      ? "rgba(34, 197, 94, 0.1)"
                      : "rgba(255,255,255,0.05)",
                  color:
                    plan.plan_type === "member"
                      ? "#4ade80"
                      : "rgba(255,255,255,0.4)",
                  border:
                    plan.plan_type === "member"
                      ? "1px solid rgba(34, 197, 94, 0.2)"
                      : "1px solid rgba(255,255,255,0.1)",
                }}
              >
                {plan.plan_type}
              </span> */}
            </div>

            {/* Action Buttons */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
                marginTop: "4px",
              }}
            >
              <a
                href={plan.plan_url}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  padding: "10px",
                  background:
                    "linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)",
                  borderRadius: "10px",
                  color: "#fff",
                  textDecoration: "none",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  boxShadow: "0 4px 12px rgba(74, 144, 226, 0.2)",
                }}
              >
                Open Plan <ArrowRightIcon size={14} />
              </a>
              <button
                onClick={() => copyPlanLink(plan)}
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "10px",
                  color: "rgba(255,255,255,0.8)",
                  fontSize: "0.85rem",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Copy Link
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Toggles / Load More */}
      <div
        style={{
          marginTop: "24px",
          display: "flex",
          justifyContent: "center",
          gap: "12px",
        }}
      >
        {plans.length > 3 && (
          <button
            onClick={() => setShowAll(!showAll)}
            style={{
              background: "none",
              border: "none",
              color: "rgba(255,255,255,0.5)",
              fontSize: "0.8rem",
              fontWeight: 500,
              cursor: "pointer",
              padding: "8px 16px",
            }}
          >
            {showAll ? "Show Less" : `View All (${plans.length})`}
          </button>
        )}

        {showAll && hasMore && (
          <button
            onClick={() => setOffset(offset + 10)}
            disabled={loading}
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#fff",
              padding: "8px 16px",
              borderRadius: "100px",
              fontSize: "0.8rem",
              cursor: loading ? "wait" : "pointer",
            }}
          >
            {loading ? "Loading..." : "Load Older Plans"}
          </button>
        )}
      </div>
    </div>
  );
}
