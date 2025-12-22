// src/features/plan/PlanScreen.tsx
// Updated to display new backend plan structure
// FIXED: Removed style props from Section (not supported)

import React from "react";
import type { Plan, PlanGenerateResponse } from "./types";
import { isMemberPlan } from "./types";
import { Section, Bullets, Lines } from "./sections";
import { PreviewFooterCTA } from "./PreviewFooterCTA";
import { LureImage } from "./lures/LureImage";

export function PlanScreen({ response }: { response: PlanGenerateResponse }) {
  const { plan, is_member, plan_url } = response;
  const conditions = plan.conditions;

  return (
    <div style={{ marginTop: 18 }}>
      {/* Header */}
      <div className="card">
        <div className="kicker">Bass Fishing Plan</div>
        <h2 className="h2" style={{ marginTop: 8 }}>
          {conditions.location_name}
        </h2>
        <p className="p" style={{ marginTop: 4, opacity: 0.7 }}>
          {conditions.trip_date}
        </p>
      </div>

      {/* Conditions */}
      <div className="card" style={{ marginTop: 14 }}>
        <Section title="Conditions">
          <div className="conditions-grid">
            <div className="condition-item">
              <span className="condition-label">Temperature:</span>
              <span className="condition-value">
                {conditions.temp_low}°F - {conditions.temp_high}°F
              </span>
            </div>
            <div className="condition-item">
              <span className="condition-label">Wind:</span>
              <span className="condition-value">
                {conditions.wind_speed} mph
              </span>
            </div>
            <div className="condition-item">
              <span className="condition-label">Sky:</span>
              <span className="condition-value">
                {conditions.sky_condition}
              </span>
            </div>
            <div className="condition-item">
              <span className="condition-label">Phase:</span>
              <span className="condition-value">{conditions.phase}</span>
            </div>
          </div>
        </Section>

        {/* Outlook */}
        <div style={{ marginTop: 16 }}>
          <Section title="Outlook">
            <p className="p">
              {isMemberPlan(plan) ? plan.outlook_blurb : plan.outlook_blurb}
            </p>
          </Section>
        </div>
      </div>

      {/* Plan Content */}
      {isMemberPlan(plan) ? (
        <MemberPlanView plan={plan} />
      ) : (
        <PreviewPlanView plan={plan} />
      )}

      {/* Day Progression */}
      <div className="card" style={{ marginTop: 14 }}>
        <Section title="Day Progression">
          <Bullets
            lines={
              isMemberPlan(plan) ? plan.day_progression : plan.day_progression
            }
          />
        </Section>
      </div>

      {/* Preview CTA */}
      {!is_member && <PreviewFooterCTA href="/subscribe" />}

      {/* Share Link */}
      <div className="card" style={{ marginTop: 14 }}>
        <Section title="Share This Plan">
          <div style={{ marginTop: 8 }}>
            <input
              className="input"
              value={plan_url}
              readOnly
              onClick={(e) => e.currentTarget.select()}
              style={{ fontFamily: "monospace", fontSize: "0.9em" }}
            />
            <button
              className="btn secondary"
              style={{ marginTop: 8, width: "100%" }}
              onClick={() => {
                navigator.clipboard.writeText(plan_url);
                alert("Link copied to clipboard!");
              }}
            >
              Copy Link
            </button>
          </div>
        </Section>
      </div>
    </div>
  );
}

// Preview Plan (Pattern 1 only)
function PreviewPlanView({
  plan,
}: {
  plan: Extract<Plan, { base_lure: string }>;
}) {
  return (
    <div className="card" style={{ marginTop: 14 }}>
      <Section title="Pattern 1">
        <div style={{ marginTop: 12 }}>
          <h3 className="h3">{plan.presentation}</h3>

          {/* Lure Image */}
          <div style={{ marginTop: 12 }}>
            <LureImage
              assetKey={plan.colors.asset_key}
              lureName={plan.base_lure}
            />
          </div>

          {/* Lure Details */}
          <div style={{ marginTop: 12 }}>
            <div className="lure-detail">
              <span className="label">Lure:</span>
              <span className="value">{plan.base_lure}</span>
            </div>
            <div className="lure-detail">
              <span className="label">Colors:</span>
              <span className="value">
                {plan.color_recommendations.join(", ")}
              </span>
            </div>
            {plan.colors.accent_color && (
              <div className="lure-detail">
                <span className="label">
                  {plan.colors.accent_material === "metallic"
                    ? "Blade:"
                    : "Accent:"}
                </span>
                <span className="value">{plan.colors.accent_color}</span>
              </div>
            )}
          </div>

          {/* Why This Works */}
          {plan.why_this_works && (
            <div style={{ marginTop: 16 }}>
              <Section title="Why This Works">
                <p className="p">{plan.why_this_works}</p>
              </Section>
            </div>
          )}

          {/* Targets */}
          {plan.targets?.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <Section title="Targets">
                <Bullets lines={plan.targets} />
              </Section>
            </div>
          )}

          {/* How to Fish It */}
          {plan.work_it?.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <Section title="How to Fish It">
                <Bullets lines={plan.work_it} />
              </Section>
            </div>
          )}
        </div>
      </Section>
    </div>
  );
}

// Member Plan (Pattern 1 + Pattern 2)
function MemberPlanView({ plan }: { plan: Extract<Plan, { primary: any }> }) {
  return (
    <>
      {/* Pattern 1 */}
      <div className="card" style={{ marginTop: 14 }}>
        <Section title="Pattern 1 — Primary Strategy">
          <div style={{ marginTop: 12 }}>
            <h3 className="h3">{plan.primary.presentation}</h3>

            {/* Lure Image */}
            <div style={{ marginTop: 12 }}>
              <LureImage
                assetKey={plan.primary.colors.asset_key}
                lureName={plan.primary.base_lure}
              />
            </div>

            {/* Lure Details */}
            <div style={{ marginTop: 12 }}>
              <div className="lure-detail">
                <span className="label">Lure:</span>
                <span className="value">{plan.primary.base_lure}</span>
              </div>
              <div className="lure-detail">
                <span className="label">Colors:</span>
                <span className="value">
                  {plan.primary.color_recommendations.join(", ")}
                </span>
              </div>
              {plan.primary.colors.accent_color && (
                <div className="lure-detail">
                  <span className="label">
                    {plan.primary.colors.accent_material === "metallic"
                      ? "Blade:"
                      : "Accent:"}
                  </span>
                  <span className="value">
                    {plan.primary.colors.accent_color}
                  </span>
                </div>
              )}
            </div>

            {/* Why This Works */}
            <div style={{ marginTop: 16 }}>
              <Section title="Why This Works">
                <p className="p">{plan.primary.why_this_works}</p>
              </Section>
            </div>

            {/* Targets */}
            <div style={{ marginTop: 16 }}>
              <Section title="Targets">
                <Bullets lines={plan.primary.targets} />
              </Section>
            </div>

            {/* How to Fish It */}
            <div style={{ marginTop: 16 }}>
              <Section title="How to Fish It">
                <Bullets lines={plan.primary.work_it} />
              </Section>
            </div>
          </div>
        </Section>
      </div>

      {/* Pattern 2 */}
      <div className="card" style={{ marginTop: 14 }}>
        <Section title="Pattern 2 — The Pivot Plan">
          <div style={{ marginTop: 12 }}>
            <h3 className="h3">{plan.secondary.presentation}</h3>

            {/* Lure Image */}
            <div style={{ marginTop: 12 }}>
              <LureImage
                assetKey={plan.secondary.colors.asset_key}
                lureName={plan.secondary.base_lure}
              />
            </div>

            {/* Lure Details */}
            <div style={{ marginTop: 12 }}>
              <div className="lure-detail">
                <span className="label">Lure:</span>
                <span className="value">{plan.secondary.base_lure}</span>
              </div>
              <div className="lure-detail">
                <span className="label">Colors:</span>
                <span className="value">
                  {plan.secondary.color_recommendations.join(", ")}
                </span>
              </div>
              {plan.secondary.colors.accent_color && (
                <div className="lure-detail">
                  <span className="label">
                    {plan.secondary.colors.accent_material === "metallic"
                      ? "Blade:"
                      : "Accent:"}
                  </span>
                  <span className="value">
                    {plan.secondary.colors.accent_color}
                  </span>
                </div>
              )}
            </div>

            {/* Why This Works */}
            <div style={{ marginTop: 16 }}>
              <Section title="Why This Works">
                <p className="p">{plan.secondary.why_this_works}</p>
              </Section>
            </div>

            {/* Targets */}
            <div style={{ marginTop: 16 }}>
              <Section title="Targets">
                <Bullets lines={plan.secondary.targets} />
              </Section>
            </div>

            {/* How to Fish It */}
            <div style={{ marginTop: 16 }}>
              <Section title="How to Fish It">
                <Bullets lines={plan.secondary.work_it} />
              </Section>
            </div>
          </div>
        </Section>
      </div>
    </>
  );
}
