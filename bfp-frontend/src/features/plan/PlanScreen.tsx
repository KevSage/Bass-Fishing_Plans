// src/features/plan/PlanScreen.tsx
import React from "react";
import type { PlanResponse } from "./types";
import { Section, Bullets, Lines } from "./sections";
import { PreviewFooterCTA } from "./PreviewFooterCTA";

export function PlanScreen({ plan }: { plan: PlanResponse }) {
  const geo = plan.geo;
  const p = plan.plan;
  const conditions = p?.conditions;

  const isPreview = conditions?.is_preview === true || p?.is_preview === true;

  const waterName = geo?.name ?? conditions?.location_name ?? "Your Area";

  return (
    <div style={{ marginTop: 18 }}>
      <div className="card">
        <div className="kicker">Bass Fishing Plan</div>
        <h2 className="h2" style={{ marginTop: 8 }}>
          {waterName}
        </h2>
        {p?.pattern_summary ? (
          <p className="p" style={{ marginTop: 10 }}>
            {p.pattern_summary}
          </p>
        ) : null}
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <Section title="Primary Plan">
          <Lines
            items={
              [p?.primary_technique, p?.featured_lure_name].filter(
                Boolean
              ) as string[]
            }
          />

          {p?.recommended_targets?.length ? (
            <Section title="Targets">
              <Bullets lines={p.recommended_targets} />
            </Section>
          ) : null}

          {p?.strategy_tips?.length ? (
            <Section title="How to Fish">
              <Bullets lines={p.strategy_tips} />
            </Section>
          ) : null}
        </Section>

        {p?.pattern_2 ? (
          <Section title="Counter-Condition Plan">
            <Lines
              items={
                [p.pattern_2.primary_lure_spec?.display_name].filter(
                  Boolean
                ) as string[]
              }
            />

            {p.pattern_2.recommended_targets?.length ? (
              <Section title="Targets">
                <Bullets lines={p.pattern_2.recommended_targets} />
              </Section>
            ) : null}
          </Section>
        ) : null}

        {plan.day_progression?.length ? (
          <Section title="Day Progression">
            <Bullets lines={plan.day_progression} />
          </Section>
        ) : null}
      </div>

      {isPreview ? <PreviewFooterCTA href="/subscribe" /> : null}
    </div>
  );
}
