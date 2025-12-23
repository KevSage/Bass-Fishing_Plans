// src/pages/Preview.tsx
// Fixed version with mount guard to prevent duplicate rendering

import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { generatePlan, RateLimitError } from "@/lib/api";
import { WaterBodyMapEnhanced } from "@/components/WaterBodyMap";

type WaterBody = {
  name: string;
  city?: string;
  state?: string;
  latitude: number;
  longitude: number;
};

export function PreviewEnhanced() {
  const mounted = useRef(false);
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [waterBody, setWaterBody] = useState<WaterBody | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [err, setErr] = useState<string | null>(null);
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitError | null>(
    null
  );
  const [loading, setLoading] = useState(false);

  // Guard against duplicate mounting
  useEffect(() => {
    if (mounted.current) {
      console.warn(
        "⚠️ PreviewEnhanced mounted TWICE - this should not happen!"
      );
      return;
    }
    mounted.current = true;
    console.log("✓ PreviewEnhanced mounted");

    return () => {
      console.log("PreviewEnhanced unmounting");
      mounted.current = false;
    };
  }, []);

  async function onGenerate() {
    if (!waterBody) {
      setErr("Please select a location on the map");
      return;
    }

    if (!email) {
      setErr("Please enter your email");
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

      // Redirect to plan page
      navigate("/plan", { state: { planResponse: res } });
    } catch (e: any) {
      if (e instanceof RateLimitError) {
        setRateLimitInfo(e);
        setErr(null);
      } else {
        setErr(e?.message ?? "Failed to generate plan.");
        setRateLimitInfo(null);
      }
      setLoading(false);
    }
  }

  return (
    <div style={{ position: "relative", height: "100vh" }}>
      {/* Header */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 999,
          background:
            "linear-gradient(to bottom, rgba(10,10,10,0.95) 0%, transparent 100%)",
          padding: "20px",
          pointerEvents: "none",
        }}
      >
        <div style={{ maxWidth: 600, margin: "0 auto", textAlign: "center" }}>
          <h1
            style={{
              fontSize: "clamp(1.5rem, 4vw, 2rem)",
              fontWeight: 700,
              marginBottom: 8,
            }}
          >
            Find Your Water
          </h1>
          <p style={{ fontSize: "clamp(0.9rem, 2vw, 1rem)", opacity: 0.8 }}>
            Pan and zoom to your fishing spot. Click any body of water to select
            it.
          </p>
        </div>
      </div>

      {/* Form Overlay */}
      <div
        style={{
          position: "absolute",
          top: 120,
          left: 20,
          zIndex: 1000,
          maxWidth: 380,
          width: "calc(100% - 40px)",
        }}
      >
        <div
          className="card"
          style={{
            background: "rgba(10, 10, 10, 0.95)",
            backdropFilter: "blur(20px)",
          }}
        >
          <div className="label">Search for a lake</div>
          <input
            className="input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Lake Guntersville..."
          />

          <div style={{ marginTop: 16 }}>
            <div className="label">Email</div>
            <input
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              type="email"
            />
          </div>

          {waterBody && (
            <div
              style={{
                marginTop: 16,
                padding: 16,
                background: "rgba(74, 144, 226, 0.15)",
                borderRadius: 12,
                border: "2px solid rgba(74, 144, 226, 0.4)",
              }}
            >
              <div
                style={{ fontWeight: 700, color: "#4A90E2", fontSize: "1.2em" }}
              >
                {waterBody.name}
              </div>
              {(waterBody.city || waterBody.state) && (
                <div style={{ fontSize: "0.9em", opacity: 0.8, marginTop: 4 }}>
                  📍{" "}
                  {[waterBody.city, waterBody.state].filter(Boolean).join(", ")}
                </div>
              )}
            </div>
          )}

          <button
            className="btn primary"
            style={{ marginTop: 16, width: "100%" }}
            disabled={!email || !waterBody || loading}
            onClick={onGenerate}
          >
            {loading ? "Generating…" : "Generate Preview Plan"}
          </button>

          {err && (
            <div
              style={{
                marginTop: 12,
                color: "rgba(255,160,160,0.95)",
                fontSize: "0.9em",
              }}
            >
              ⚠️ {err}
            </div>
          )}
        </div>
      </div>

      {/* Map */}
      <WaterBodyMapEnhanced
        onSelect={(wb) => setWaterBody(wb)}
        searchQuery={searchQuery}
        selectedWaterBody={waterBody}
      />
    </div>
  );
}
