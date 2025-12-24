// src/features/plan/lures/LureImage.tsx
// Displays lure image using lure name from backend

import React, { useState } from "react";
import { getLureImagePath } from "@/config/lureImageMap";

type LureImageProps = {
  assetKey: string; // Kept for backward compatibility but not used
  lureName: string; // This is what we actually use
  size?: "small" | "medium" | "large";
};

export function LureImage({ lureName, size = "medium" }: LureImageProps) {
  const [imageError, setImageError] = useState(false);

  // Get image path from mapping
  const imagePath = getLureImagePath(lureName);

  const sizeMap = {
    small: 120,
    medium: 200,
    large: 300,
  };

  const imageSize = sizeMap[size];

  // If no mapping found or image error, show placeholder
  if (!imagePath || imageError) {
    // Fallback if image doesn't exist yet
    return (
      <div
        className="lure-placeholder"
        style={{
          width: imageSize,
          height: imageSize,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(255,255,255,0.05)",
          border: "2px dashed rgba(255,255,255,0.2)",
          borderRadius: 8,
          padding: 16,
          textAlign: "center",
        }}
      >
        <div>
          <div style={{ fontSize: "0.9em", opacity: 0.7 }}>{lureName}</div>
          <div style={{ fontSize: "0.7em", opacity: 0.5, marginTop: 4 }}>
            Image coming soon
          </div>
        </div>
      </div>
    );
  }

  return (
    <img
      src={imagePath}
      alt={lureName}
      className="lure-image"
      style={{
        width: imageSize,
        height: imageSize,
        objectFit: "contain",
      }}
      onError={() => setImageError(true)}
    />
  );
}
