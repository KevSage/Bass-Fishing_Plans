// src/features/plan/sections.tsx
import React from "react";

export function Section({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginTop: 14 }}>
      {title ? (
        <div className="label" style={{ marginBottom: 8 }}>
          {title}
        </div>
      ) : null}
      <div>{children}</div>
    </div>
  );
}

export function Bullets({ lines }: { lines: string[] }) {
  if (!lines?.length) return null;
  return (
    <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 6 }}>
      {lines.map((t, i) => (
        <li key={i} className="p" style={{ margin: 0 }}>
          {t}
        </li>
      ))}
    </ul>
  );
}

export function Lines({ items }: { items: string[] }) {
  if (!items?.length) return null;
  return (
    <div style={{ display: "grid", gap: 6 }}>
      {items.map((t, i) => (
        <div key={i} className="p" style={{ margin: 0 }}>
          {t}
        </div>
      ))}
    </div>
  );
}
