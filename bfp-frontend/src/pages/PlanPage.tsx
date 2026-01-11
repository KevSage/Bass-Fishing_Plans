// src/pages/PlanPage.tsx
// Fixed: Separated copy states so buttons don't animate simultaneously

import React, { useRef, useEffect, useCallback, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import type { PlanGenerateResponse } from "@/features/plan/types";
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

  const [tokenPlan, setTokenPlan] = useState<PlanGenerateResponse | null>(null);
  const [loading, setLoading] = useState(!!token && !planResponse);
  const [error, setError] = useState<string | null>(null);

  // SEPARATE FEEDBACK STATES
  const [shareSuccess, setShareSuccess] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Helper to get current URL
  const getPlanUrl = useCallback(() => {
    return planResponse?.plan_url || tokenPlan?.plan_url || "";
  }, [planResponse, tokenPlan]);

  // Handler for the "Copy Link" button
  const handleCopyBtnClick = useCallback(() => {
    const url = getPlanUrl();
    if (!url) return;

    navigator.clipboard.writeText(url).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000); // Reset after 2s
    });
  }, [getPlanUrl]);

  // Handler for the "Share" button (Desktop Fallback)
  const handleShareBtnClick = useCallback(() => {
    const url = getPlanUrl();
    if (!url) return;

    if (navigator.share) {
      navigator
        .share({
          title: `Bass Clarity Plan`,
          text: `Check out my fishing plan!`,
          url: url,
        })
        .catch(console.error);
    } else {
      // Fallback for Desktop: Triggers IT'S OWN success state
      navigator.clipboard.writeText(url).then(() => {
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 2000);
      });
    }
  }, [getPlanUrl]);

  // Memoized fetch function
  const fetchPlan = useCallback(async (tokenValue: string) => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/plan/view/${tokenValue}`
      );
      const data = await res.json();

      if (!data.plan_url) {
        data.plan_url = `${window.location.origin}/plan/view/${tokenValue}`;
      }

      setTokenPlan(data);
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
      hasFetched.current = false;
    }
  }, []);

  // Load plan by token
  useEffect(() => {
    if (token && !planResponse && !hasFetched.current) {
      fetchPlan(token);
    }
  }, [token, planResponse, fetchPlan]);

  const plan = planResponse || tokenPlan;

  // COST PROTECTION: Only enable live weather calls if this is a NEW generation
  const enableLiveUpdates = !!planResponse && !token;

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
      {/* Pass the cost-protection flag down */}
      <PlanScreen response={plan} enableLiveUpdates={enableLiveUpdates} />

      {/* Modern Circular Social Share Bar */}
      {plan.plan_url && (
        <div
          style={{
            marginTop: 40,
            padding: "24px",
            background: "rgba(10, 10, 10, 0.4)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: 24,
            position: "relative",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {/* Subtle Glow */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: "50%",
              transform: "translateX(-50%)",
              width: "40%",
              height: 1,
              background:
                "linear-gradient(90deg, transparent, rgba(74, 144, 226, 0.4), transparent)",
            }}
          />

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 20,
              width: "100%",
            }}
          >
            <h3
              style={{
                fontSize: "0.95rem",
                fontWeight: 700,
                color: "rgba(255,255,255,0.9)",
                margin: 0,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Share Plan
            </h3>
            <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.4)" }}>
              Public Link
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            {/* 1. Native Mobile Share (Primary) */}
            <ShareButton
              label={shareSuccess ? "Copied" : "Share"}
              icon={
                shareSuccess ? (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#fff"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                    <polyline points="16 6 12 2 8 6" />
                    <line x1="12" y1="2" x2="12" y2="15" />
                  </svg>
                )
              }
              onClick={handleShareBtnClick}
              isPrimary
              isSuccess={shareSuccess} // Only reacts to shareSuccess
            />

            {/* 2. Copy Link */}
            <ShareButton
              label={copySuccess ? "Copied!" : "Copy Link"}
              icon={
                copySuccess ? (
                  // Success Checkmark
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#4ade80"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  // Link Icon
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                )
              }
              onClick={handleCopyBtnClick}
              isSuccess={copySuccess} // Only reacts to copySuccess
            />

            {/* 3. Facebook */}
            <ShareButton
              label="Facebook"
              icon={
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              }
              onClick={() => {
                window.open(
                  `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                    getPlanUrl()
                  )}`,
                  "_blank"
                );
              }}
            />

            {/* 4. Twitter / X */}
            <ShareButton
              label="X / Twitter"
              icon={
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              }
              onClick={() => {
                window.open(
                  `https://twitter.com/intent/tweet?text=${encodeURIComponent(
                    `Fishing plan for ${plan.plan.location}`
                  )}&url=${encodeURIComponent(getPlanUrl())}`,
                  "_blank"
                );
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function ShareButton({ label, icon, onClick, isPrimary, isSuccess }: any) {
  // Dynamic styles for success state
  const successStyle = {
    background: "rgba(74, 222, 128, 0.15)",
    border: "1px solid rgba(74, 222, 128, 0.5)",
    boxShadow: "0 0 15px rgba(74, 222, 128, 0.2)",
    transform: "scale(1.05)",
  };

  const primaryStyle = {
    background: "linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)",
    border: "none",
    boxShadow: "0 4px 12px rgba(74, 144, 226, 0.4)",
  };

  const defaultStyle = {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    boxShadow: "none",
  };

  // Determine base style
  let activeStyle = defaultStyle;
  if (isSuccess) activeStyle = successStyle;
  else if (isPrimary) activeStyle = primaryStyle;

  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "48px",
        height: "48px",
        borderRadius: "50%",
        color: "#fff",
        cursor: "pointer",
        transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)", // Bouncy transition
        ...activeStyle,
      }}
    >
      <div
        style={{ opacity: isPrimary || isSuccess ? 1 : 0.85, display: "flex" }}
      >
        {icon}
      </div>
    </button>
  );
}
