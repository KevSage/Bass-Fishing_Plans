import React from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import type { PlanResponse } from "./types";
import { MobileFieldPlanPDF } from "./pdf/MobileFieldPlanPDF";
import { PrintablePlanPDF } from "./pdf/PrintablePlanPDF";

// src/features/plan/PlanDownloads.tsx

export function PlanDownloads({ plan }: { plan: PlanResponse }) {
  const geo = plan?.geo;
  const p = plan?.plan;
  const conditions = p?.conditions;

  const waterName =
    geo?.name ??
    conditions?.location_name ??
    (plan as any)?.geo?.name ??
    "Your Area";

  // TODO: wire to your real artifact fields
  // const artifacts = plan.artifacts ?? {};
  // const mobileUrl = artifacts.mobile_pdf_url ?? artifacts.mobile?.url ?? null;
  // const printUrl  = artifacts.print_pdf_url  ?? artifacts.printable?.url ?? null;

  return (
    <div className="card">
      <div className="label">Downloads</div>
      <div className="p" style={{ marginTop: 6 }}>
        {waterName}
      </div>
      {/* buttons here */}
    </div>
  );
}
