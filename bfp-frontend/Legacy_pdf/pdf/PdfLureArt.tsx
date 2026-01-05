import React from "react";
import { View, Text } from "@react-pdf/renderer";
import type { LureRender } from "../types";

export function PdfLureArt({ lure, width = 220 }: { lure: LureRender; width?: number }) {
  return (
    <View style={{ marginTop: 6 }}>
      <View style={{ width, height: width * 0.62, backgroundColor: "rgba(238,242,246,0.05)", borderRadius: 12, padding: 10 }}>
        <Text style={{ fontSize: 10, color: "rgba(238,242,246,0.78)" }}>Lure: {lure.lure_key}</Text>
        <Text style={{ fontSize: 9, color: "rgba(238,242,246,0.60)", marginTop: 4 }}>
          {lure.primary_color}{lure.secondary_color ? ` / ${lure.secondary_color}` : ""}{lure.accent_color ? ` / ${lure.accent_color}` : ""}
        </Text>
      </View>
      <Text style={{ fontSize: 11, marginTop: 8 }}>{lure.lure_name}</Text>
    </View>
  );
}
