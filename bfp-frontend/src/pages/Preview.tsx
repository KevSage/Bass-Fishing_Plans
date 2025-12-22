// src/pages/Preview.tsx
// Updated to use interactive map with soft-lock

import React, { useState } from "react";
import { generatePlan, RateLimitError } from "@/lib/api";
import type { PlanGenerateResponse } from "@/features/plan/types";
import { PlanDownloads } from "@/features/plan/PlanDownloads";
import { PlanScreen } from "@/features/plan/PlanScreen";
import { WaterBodyMap } from "@/components/WaterBodyMap";

type WaterBody = {
  name: string;
  city?: string;
  state?: string;
  latitude: number;
  longitude: number;
};

export function Preview() {
  const [email, setEmail] = useState("");
  const [waterBody, setWaterBody] = useState<WaterBody | null>(null);

  const [response, setResponse] = useState<PlanGenerateResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitError | null>(
    null
  );
  const [loading, setLoading] = useState(false);

  async function onGenerate() {
    if (!waterBody) {
      setErr("Please select a location on the map");
      return;
    }

    setErr(null);
    setRateLimitInfo(null);
    setLoading(true);

    try {
      const payload = {
        email,
        latitude: waterBody.latitude,
        longitude: waterBody.longitude,
        location_name: waterBody.name,
      };

      const res = await generatePlan(payload);
      console.log("Plan response:", res);
      setResponse(res);
    } catch (e: any) {
      if (e instanceof RateLimitError) {
        setRateLimitInfo(e);
        setErr(null);
      } else {
        setErr(e?.message ?? "Failed to generate plan.");
        setRateLimitInfo(null);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container" style={{ paddingTop: 44, paddingBottom: 60 }}>
      <div className="kicker">Preview</div>
      <h1 className="h2" style={{ marginTop: 10 }}>
        Get a preview plan
      </h1>
      <p className="p" style={{ marginTop: 12 }}>
        A limited example plan so you can see how Bass Fishing Plans thinks.
      </p>

      <div className="card" style={{ marginTop: 18 }}>
        <div className="label">Email</div>
        <input
          className="input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          type="email"
        />

        <div className="label" style={{ marginTop: 20 }}>
          Select Your Water
        </div>
        <div style={{ marginTop: 10 }}>
          <WaterBodyMap
            onSelect={(wb) => setWaterBody(wb)}
            initialCenter={[-86.7816, 33.5186]} // Alabama - adjust to your region
            initialZoom={6}
          />
        </div>

        {waterBody && (
          <div
            style={{
              marginTop: 12,
              padding: 12,
              background: "rgba(74, 144, 226, 0.15)",
              borderRadius: 8,
              border: "1px solid rgba(74, 144, 226, 0.3)",
            }}
          >
            <div style={{ fontWeight: 600, color: "#4A90E2" }}>
              ✓ Selected: {waterBody.name}
            </div>
            {(waterBody.city || waterBody.state) && (
              <div style={{ fontSize: "0.9em", opacity: 0.8, marginTop: 4 }}>
                {[waterBody.city, waterBody.state].filter(Boolean).join(", ")}
              </div>
            )}
            <div style={{ fontSize: "0.85em", opacity: 0.6, marginTop: 6 }}>
              {waterBody.latitude.toFixed(4)}°, {waterBody.longitude.toFixed(4)}
              °
            </div>
          </div>
        )}

        <button
          className="btn primary"
          style={{ marginTop: 16, cursor: "pointer" }}
          disabled={!email || !waterBody || loading}
          onClick={onGenerate}
        >
          {loading ? "Generating…" : "Generate preview plan"}
        </button>

        {/* Rate Limit Error */}
        {rateLimitInfo && (
          <div
            style={{
              marginTop: 12,
              padding: 16,
              background: "rgba(255,200,100,0.1)",
              borderRadius: 8,
            }}
          >
            <div style={{ color: "rgba(255,200,100,0.95)", fontWeight: 600 }}>
              Rate Limit Reached
            </div>
            <div style={{ marginTop: 8, fontSize: "0.95em", opacity: 0.9 }}>
              {rateLimitInfo.message}
            </div>
            {rateLimitInfo.error === "rate_limit_preview" && (
              <div style={{ marginTop: 12 }}>
                <a
                  href="/subscribe"
                  className="btn primary"
                  style={{ display: "inline-block" }}
                >
                  Subscribe for Unlimited Plans
                </a>
              </div>
            )}
          </div>
        )}

        {/* General Error */}
        {err && (
          <div style={{ marginTop: 12, color: "rgba(255,160,160,0.95)" }}>
            {err}
          </div>
        )}
      </div>

      {/* Plan Display */}
      {response && (
        <div style={{ marginTop: 18 }}>
          <PlanDownloads response={response} />
          <div style={{ height: 18 }} />
          <PlanScreen response={response} />
        </div>
      )}
    </div>
  );
}
