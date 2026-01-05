import React from "react";
import { Document, Page, View, Text } from "@react-pdf/renderer";
import type { PlanPayload } from "../types";
import { pdfBase } from "./pdfStyles";
import { PdfLureArt } from "./PdfLureArt";

function Bullets({ items }: { items: string[] }) {
  return (
    <View>
      {items.map((t, i) => (
        <Text key={i} style={pdfBase.bullet}>• {t}</Text>
      ))}
    </View>
  );
}

export function PrintablePlanPDF({ plan }: { plan: PlanPayload }) {
  const isPreview = plan?.conditions?.is_preview === true;

  return (
    <Document>
      <Page size="LETTER" style={pdfBase.pageLight}>
        <View style={[pdfBase.header, pdfBase.mutedLight]}>
          <Text>{plan.conditions.water_name}</Text>
          <Text>{plan.conditions.date_label}</Text>
          <Text>{plan.conditions.synthesis_phrase}</Text>
        </View>

        <Text style={[pdfBase.technique, { color: "#0b0f14" }]}>{plan.primary.technique_name}</Text>
        <Text style={[pdfBase.reason, pdfBase.mutedLight]}>{plan.primary.reasoning_one_liner}</Text>
        <PdfLureArt lure={plan.primary.lure} width={200} />

        <Text style={[pdfBase.sectionTitle, pdfBase.mutedLight]}>Targets</Text>
        <Bullets items={plan.primary.targets} />

        <Text style={[pdfBase.sectionTitle, pdfBase.mutedLight]}>How to Fish</Text>
        <Bullets items={plan.primary.how_to_fish} />

        <Text style={[pdfBase.sectionTitle, pdfBase.mutedLight]}>Gear</Text>
        <Text style={[pdfBase.gear, { color: "#0b0f14" }]}>{plan.primary.gear}</Text>

        <View style={pdfBase.dividerLight} />

        <Text style={[pdfBase.sectionTitle, pdfBase.mutedLight]}>Counter-Condition Plan</Text>
        <Text style={[pdfBase.reason, pdfBase.mutedLight]}>If fish are present but not engaging…</Text>

        <Text style={[pdfBase.technique, { color: "#0b0f14" }]}>{plan.counter.technique_name}</Text>
        <Text style={[pdfBase.reason, pdfBase.mutedLight]}>{plan.counter.reasoning_one_liner}</Text>
        <PdfLureArt lure={plan.counter.lure} width={170} />

        <Text style={[pdfBase.sectionTitle, pdfBase.mutedLight]}>Targets</Text>
        <Bullets items={plan.counter.targets} />

        <Text style={[pdfBase.sectionTitle, pdfBase.mutedLight]}>How to Fish</Text>
        <Bullets items={plan.counter.how_to_fish} />

        <Text style={[pdfBase.sectionTitle, pdfBase.mutedLight]}>Gear</Text>
        <Text style={[pdfBase.gear, { color: "#0b0f14" }]}>{plan.counter.gear}</Text>

        <View style={pdfBase.dividerLight} />

        <Text style={[pdfBase.sectionTitle, pdfBase.mutedLight]}>Day Progression</Text>
        <Bullets items={plan.day_progression} />

        <Text style={[pdfBase.sectionTitle, pdfBase.mutedLight]}>What to Do</Text>
        <Bullets items={plan.what_to_do} />

        <Text style={[pdfBase.footer, pdfBase.mutedLight]}>{plan.footer_cue ?? "Fish this plan with intent."}</Text>

        {isPreview ? (
          <View style={{ marginTop: 16 }}>
            <View style={pdfBase.dividerLight} />
            <Text style={{ fontSize: 10, lineHeight: 1.5, color: "#0b0f14" }}>
              This is a preview plan. Full plans include deeper execution detail, expanded targets, gear setup, and day-progression
              notes — built specifically for your water (with lake selection).
            </Text>
            <Text style={{ fontSize: 10, lineHeight: 1.5, marginTop: 6, color: "#0b0f14" }}>
              Subscribers can request a fresh full plan anytime they fish.
            </Text>
            <Text style={{ fontSize: 10, marginTop: 8, color: "#0b0f14" }}>
              Get unlimited full plans → {plan.preview_cta_href ?? "Subscribe"}
            </Text>
          </View>
        ) : null}
      </Page>
    </Document>
  );
}
