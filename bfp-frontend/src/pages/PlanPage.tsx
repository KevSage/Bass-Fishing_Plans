// src/pages/PlanPage.tsx
// Fixed version with mount guard to prevent duplicate rendering

import React, { useRef, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import type { PlanGenerateResponse } from "@/features/plan/types";
import { PlanDownloads } from "@/features/plan/PlanDownloads";
import { PlanScreen } from "@/features/plan/PlanScreen";

export function PlanPage() {
  const mounted = useRef(false);
  const location = useLocation();
  const navigate = useNavigate();
  const planResponse = location.state?.planResponse as
    | PlanGenerateResponse
    | undefined;

  // Guard against duplicate mounting
  useEffect(() => {
    if (mounted.current) {
      console.warn("⚠️ PlanPage mounted TWICE - this should not happen!");
      return;
    }
    mounted.current = true;
    console.log("✓ PlanPage mounted");

    return () => {
      console.log("PlanPage unmounting");
      mounted.current = false;
    };
  }, []);

  // If no plan data, redirect back
  if (!planResponse) {
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
      {/* Header Actions */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <button
          onClick={() => navigate("/preview")}
          className="btn"
          style={{ display: "flex", alignItems: "center", gap: 8 }}
        >
          ← Generate Another Plan
        </button>

        {!planResponse.is_member && (
          <Link to="/subscribe" className="btn primary">
            Get Full Plans
          </Link>
        )}
      </div>

      {/* Downloads Section */}
      <PlanDownloads response={planResponse} />

      <div style={{ height: 24 }} />

      {/* Plan Display */}
      <PlanScreen response={planResponse} />

      {/* Share Section */}
      {planResponse.plan_url && (
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
              value={planResponse.plan_url}
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
              className="btn secondary"
              onClick={() => {
                navigator.clipboard.writeText(planResponse.plan_url);
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
