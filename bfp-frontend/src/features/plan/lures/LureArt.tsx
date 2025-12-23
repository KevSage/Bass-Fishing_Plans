import React from "react";
import type { LureRender } from "../../plan/types";

/**
 * New lure art style ONLY.
 * Placeholder until masters are added.
 */
export function LureArt({
  lure,
  size = 220,
}: {
  lure: LureRender;
  size?: number;
}) {
  const w = size;
  const h = Math.round(size * 0.62);
  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 440 270"
      role="img"
      aria-label={lure.lure_name}
    >
      <rect
        x="0"
        y="0"
        width="440"
        height="270"
        fill="rgba(238,242,246,0.04)"
        rx="18"
      />
      <text
        x="24"
        y="54"
        fill="rgba(238,242,246,0.85)"
        fontSize="22"
        fontFamily="ui-sans-serif, system-ui"
      >
        {lure.lure_key}
      </text>
      <text
        x="24"
        y="86"
        fill="rgba(238,242,246,0.60)"
        fontSize="14"
        fontFamily="ui-sans-serif, system-ui"
      >
        primary={lure.primary_color} secondary={lure.secondary_color ?? "—"}{" "}
        accent={lure.accent_color ?? "—"}
      </text>
      {/* placeholder stroke shape */}
      <path
        d="M60 170 C120 120, 220 120, 300 170 S390 220, 410 170"
        stroke="rgba(238,242,246,0.35)"
        strokeWidth="6"
        fill="none"
      />
    </svg>
  );
}
