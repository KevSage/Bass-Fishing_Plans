// src/pages/PlanPage.tsx
// Fixed version with mount guard to prevent duplicate rendering

import React, { useRef, useEffect, useCallback } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import type { PlanGenerateResponse } from "@/features/plan/types";
import { PlanDownloads } from "@/features/plan/PlanDownloads";
import { PlanScreen } from "@/features/plan/PlanScreen";

export function PlanPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const hasFetched = useRef(false);

  const planResponse = location.state?.planResponse as
    | PlanGenerateResponse
    | undefined;

  // Check if we have a token in URL
  const token = React.useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("token");
  }, [location.search]);

  const [tokenPlan, setTokenPlan] = React.useState<PlanGenerateResponse | null>(
    null
  );
  const [loading, setLoading] = React.useState(!!token && !planResponse);
  const [error, setError] = React.useState<string | null>(null);

  // Memoized fetch function
  const fetchPlan = useCallback(async (tokenValue: string) => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/plan/view/${tokenValue}`
      );
      const data = await res.json();

      // Add plan_url if missing
      if (!data.plan_url) {
        data.plan_url = `${window.location.origin}/plan/view/${tokenValue}`;
      }

      setTokenPlan(data);
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
      hasFetched.current = false; // Allow retry on error
    }
  }, []);

  // Load plan by token - only once per unique token
  useEffect(() => {
    if (token && !planResponse && !hasFetched.current) {
      fetchPlan(token);
    }
  }, [token, planResponse, fetchPlan]); // Correct dependencies

  const plan = planResponse || tokenPlan;

  // If no plan data, redirect back
  if (loading) {
    return (
      <div
        className="container"
        style={{ paddingTop: 80, textAlign: "center" }}
      >
        <h2 className="h2">Loading Plan...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="container"
        style={{ paddingTop: 80, textAlign: "center" }}
      >
        <h2 className="h2">Error Loading Plan</h2>
        <p className="p" style={{ marginTop: 16, opacity: 0.7 }}>
          {error}
        </p>
        <Link
          to="/preview"
          className="btn primary"
          style={{ marginTop: 24, display: "inline-block" }}
        >
          Generate a New Plan
        </Link>
      </div>
    );
  }

  if (!plan) {
    return (
      <div
        className="container"
        style={{ paddingTop: 80, textAlign: "center" }}
      >
        <h2 className="h2">No Plan Found</h2>
        <p className="p" style={{ marginTop: 16, opacity: 0.7 }}>
          It looks like you haven't generated a plan yet.
        </p>
        <Link
          to="/preview"
          className="btn primary"
          style={{ marginTop: 24, display: "inline-block" }}
        >
          Generate a Plan
        </Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: 44, paddingBottom: 80 }}>
      {/* Plan Display */}
      <PlanScreen response={plan} />

      {/* Downloads Section - MOVED TO BOTTOM */}
      <PlanDownloads response={plan} />

      {/* Share Section */}
      {plan.plan_url && (
        <div className="card" style={{ marginTop: 32, textAlign: "center" }}>
          <h3 style={{ marginBottom: 12 }}>Share This Plan</h3>
          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              background: "rgba(255,255,255,0.03)",
              padding: 12,
              borderRadius: 8,
              marginBottom: 12,
            }}
          >
            <input
              type="text"
              value={plan.plan_url}
              readOnly
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                color: "inherit",
                fontSize: "0.9em",
                padding: 8,
              }}
              onClick={(e) => e.currentTarget.select()}
            />
            <button
              className="btn"
              style={{
                background:
                  "linear-gradient(135deg, rgba(74, 144, 226, 0.15) 0%, rgba(74, 144, 226, 0.08) 100%)",
                border: "1px solid rgba(74, 144, 226, 0.3)",
                fontWeight: 500,
              }}
              onClick={() => {
                navigator.clipboard.writeText(plan.plan_url);
                alert("Link copied!");
              }}
            >
              Copy
            </button>
          </div>
          <p style={{ fontSize: "0.85em", opacity: 0.6 }}>
            Anyone with this link can view your plan
          </p>
        </div>
      )}
    </div>
  );
}
