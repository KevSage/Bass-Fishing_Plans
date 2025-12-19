import React, { useState } from "react";
import { generatePreview } from "@/lib/api";
import type { PlanResponse } from "@/features/plan/types";
import { PlanDownloads } from "@/features/plan/PlanDownloads";
import { PlanScreen } from "@/features/plan/PlanScreen";

export function Preview() {
  const [email, setEmail] = useState("");
  const [zip, setZip] = useState("");
  const [plan, setPlan] = useState<PlanResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onGenerate() {
    setErr(null);
    setLoading(true);
    try {
      const payload = { email, zip }; // adjust to your backend's preview contract
      const p = await generatePreview(payload);
      setPlan(p);
      const res = await generatePreview(payload);
      console.log("preview response:", res);
      setPlan(res);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to generate preview.");
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
        />

        <div className="label" style={{ marginTop: 14 }}>
          ZIP (if location is not available)
        </div>
        <input
          className="input"
          value={zip}
          onChange={(e) => setZip(e.target.value)}
          placeholder="30309"
        />

        <button
          className="btn primary"
          style={{ marginTop: 14, cursor: "pointer" }}
          disabled={!email || loading}
          onClick={onGenerate}
        >
          {loading ? "Generating…" : "Generate preview plan"}
        </button>

        {err ? (
          <div style={{ marginTop: 12, color: "rgba(255,160,160,0.95)" }}>
            {err}
          </div>
        ) : null}
      </div>

      {plan ? (
        <div style={{ marginTop: 18 }}>
          <PlanDownloads plan={plan} />
          <div style={{ height: 18 }} />
          <PlanScreen plan={plan} />
        </div>
      ) : null}
    </div>
  );
}
