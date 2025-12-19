// src/features/plan/PreviewFooterCTA.tsx
import React from "react";

export function PreviewFooterCTA({ href }: { href: string }) {
  return (
    <div className="card" style={{ marginTop: 18 }}>
      <div className="label">Preview</div>
      <p className="p" style={{ marginTop: 8 }}>
        This is a preview plan. Full plans include deeper execution detail,
        expanded targets, gear setup, and day-progression notes — built
        specifically for your water (with lake selection). Subscribers can
        request a fresh full plan anytime they fish.
      </p>
      <a
        className="btn primary"
        style={{ display: "inline-flex", marginTop: 10 }}
        href={href}
      >
        Get unlimited full plans →
      </a>
    </div>
  );
}
