import React, { useState } from "react";
import { generateMemberPlan } from "@/lib/api";
import type { PlanGenerateResponse, PlanResponse } from "@/features/plan/types";
import { PlanDownloads } from "@/features/plan/PlanDownloads";
import { PlanScreen } from "@/features/plan/PlanScreen";

/**
 * Members Generate Page (locked contract)
 * NOTE: Mapbox soft-lock selection UI is a placeholder here.
 * We'll implement the real interactive map + soft-lock behavior next.
 */
export function Members() {
  const [email, setEmail] = useState("");
  const [waterName, setWaterName] = useState("");
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  const [plan, setPlan] = useState<PlanGenerateResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onGenerate() {
    setErr(null);
    setLoading(true);
    try {
      const payload = {
        email,
        water: { name: waterName, lat: Number(lat), lon: Number(lon) },
      };
      const p = await generateMemberPlan(payload);
      setPlan(p);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to generate plan.");
    } finally {
      setLoading(false);
    }
  }

  const canGenerate = Boolean(email && waterName && lat && lon);

  return (
    <div className="container" style={{ paddingTop: 44, paddingBottom: 60 }}>
      <div className="kicker">Members</div>
      <h1 className="h2" style={{ marginTop: 10 }}>
        Choose your water, generate a full plan
      </h1>
      <p className="p" style={{ marginTop: 12 }}>
        Select a body of water and generate a complete plan. (Auth wiring comes
        later; this page assumes access.)
      </p>

      <div className="card" style={{ marginTop: 18 }}>
        <div className="label">Email</div>
        <input
          className="input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />

        <hr />

        <div className="kicker">Water selection</div>
        <div className="muted" style={{ marginTop: 10, fontSize: 13 }}>
          Mapbox soft-lock selection UI will be implemented next. For now, enter
          water name + coordinates to validate the full flow.
        </div>

        <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
          <div>
            <div className="label">Water name</div>
            <input
              className="input"
              value={waterName}
              onChange={(e) => setWaterName(e.target.value)}
              placeholder="Lake Lanier"
            />
          </div>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <div>
              <div className="label">Lat</div>
              <input
                className="input"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                placeholder="34.188"
              />
            </div>
            <div>
              <div className="label">Lon</div>
              <input
                className="input"
                value={lon}
                onChange={(e) => setLon(e.target.value)}
                placeholder="-84.073"
              />
            </div>
          </div>
        </div>

        <button
          className="btn primary"
          style={{ marginTop: 14, cursor: "pointer" }}
          disabled={!canGenerate || loading}
          onClick={onGenerate}
        >
          {loading ? "Generating…" : "Generate full plan"}
        </button>

        {err ? (
          <div style={{ marginTop: 12, color: "rgba(255,160,160,0.95)" }}>
            {err}
          </div>
        ) : null}
      </div>

      {plan ? (
        <div style={{ marginTop: 18 }}>
          <PlanDownloads response={plan} />
          <div style={{ height: 18 }} />
          <PlanScreen response={plan} />
        </div>
      ) : null}
    </div>
  );
}
