// src/features/plan/PlanDownloads.tsx
// Updated to use new backend download URLs

import React from "react";
import type { PlanGenerateResponse } from "./types";

export function PlanDownloads({ response }: { response: PlanGenerateResponse }) {
  const { token } = response;
  
  // Download URLs from backend
  const mobileUrl = `${import.meta.env.VITE_API_BASE ?? "http://localhost:8000"}/plan/download/${token}/mobile`;
  const a4Url = `${import.meta.env.VITE_API_BASE ?? "http://localhost:8000"}/plan/download/${token}/a4`;

  return (
    <div className="card">
      <div className="kicker">Downloads</div>
      <h3 className="h3" style={{ marginTop: 8 }}>
        Save Your Plan
      </h3>
      <p className="p" style={{ marginTop: 8, opacity: 0.8 }}>
        Download your plan for offline viewing or printing.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }}>
        <a
          href={mobileUrl}
          download
          className="btn secondary"
          style={{ textDecoration: "none", textAlign: "center" }}
        >
          📱 Mobile Dark
        </a>
        <a
          href={a4Url}
          download
          className="btn secondary"
          style={{ textDecoration: "none", textAlign: "center" }}
        >
          🖨️ A4 Printable
        </a>
      </div>

      <p style={{ marginTop: 12, fontSize: "0.85em", opacity: 0.6 }}>
        Mobile version optimized for on-the-water viewing. A4 version for printing and tackle box storage.
      </p>
    </div>
  );
}
