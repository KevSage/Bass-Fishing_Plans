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

export function MobileFieldPlanPDF({ plan }: { plan: PlanPayload }) {
  const isPreview = plan?.conditions?.is_preview === true;

  return (
    <Document>
      <Page size="A4" style={pdfBase.pageDark}>
        <View style={[pdfBase.header, pdfBase.muted]}>
          <Text>{plan.conditions.water_name}</Text>
          <Text>{plan.conditions.date_label}</Text>
          <Text>{plan.conditions.synthesis_phrase}</Text>
        </View>

        <Text style={pdfBase.technique}>{plan.primary.technique_name}</Text>
        <Text style={[pdfBase.reason, pdfBase.muted]}>{plan.primary.reasoning_one_liner}</Text>
        <PdfLureArt lure={plan.primary.lure} width={240} />

        <Text style={[pdfBase.sectionTitle, pdfBase.muted]}>Targets</Text>
        <Bullets items={plan.primary.targets} />

        <Text style={[pdfBase.sectionTitle, pdfBase.muted]}>How to Fish</Text>
        <Bullets items={plan.primary.how_to_fish} />

        <Text style={[pdfBase.sectionTitle, pdfBase.muted]}>Gear</Text>
        <Text style={pdfBase.gear}>{plan.primary.gear}</Text>

        <View style={pdfBase.divider} />

        <Text style={[pdfBase.sectionTitle, pdfBase.muted]}>Counter-Condition Plan</Text>
        <Text style={[pdfBase.reason, pdfBase.muted]}>If fish are present but not engaging…</Text>

        <Text style={pdfBase.technique}>{plan.counter.technique_name}</Text>
        <Text style={[pdfBase.reason, pdfBase.muted]}>{plan.counter.reasoning_one_liner}</Text>
        <PdfLureArt lure={plan.counter.lure} width={210} />

        <Text style={[pdfBase.sectionTitle, pdfBase.muted]}>Targets</Text>
        <Bullets items={plan.counter.targets} />

        <Text style={[pdfBase.sectionTitle, pdfBase.muted]}>How to Fish</Text>
        <Bullets items={plan.counter.how_to_fish} />

        <Text style={[pdfBase.sectionTitle, pdfBase.muted]}>Gear</Text>
        <Text style={pdfBase.gear}>{plan.counter.gear}</Text>

        <View style={pdfBase.divider} />

        <Text style={[pdfBase.sectionTitle, pdfBase.muted]}>Day Progression</Text>
        <Bullets items={plan.day_progression} />

        <Text style={[pdfBase.sectionTitle, pdfBase.muted]}>What to Do</Text>
        <Bullets items={plan.what_to_do} />

        <Text style={[pdfBase.footer, pdfBase.muted]}>{plan.footer_cue ?? "Fish this plan with intent."}</Text>

        {isPreview ? (
          <View style={{ marginTop: 18 }}>
            <View style={pdfBase.divider} />
            <Text style={{ fontSize: 11, lineHeight: 1.5 }}>
              This is a preview plan. Full plans include deeper execution detail, expanded targets, gear setup, and day-progression
              notes — built specifically for your water (with lake selection).
            </Text>
            <Text style={{ fontSize: 11, lineHeight: 1.5, marginTop: 8 }}>
              Subscribers can request a fresh full plan anytime they fish.
            </Text>
            <Text style={{ fontSize: 11, marginTop: 10 }}>
              Get unlimited full plans → {plan.preview_cta_href ?? "Subscribe"}
            </Text>
          </View>
        ) : null}
      </Page>
    </Document>
  );
}
