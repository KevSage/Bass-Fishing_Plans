// src/features/plan/lures/LureImage.tsx
// Displays lure image using asset_key from backend

import React, { useState } from "react";

type LureImageProps = {
  assetKey: string;
  lureName: string;
  size?: "small" | "medium" | "large";
};

export function LureImage({ assetKey, lureName, size = "medium" }: LureImageProps) {
  const [imageError, setImageError] = useState(false);

  // Image path - adjust this to match where your lure images are hosted
  const imagePath = `/lures/${assetKey}`;

  const sizeMap = {
    small: 120,
    medium: 200,
    large: 300,
  };

  const imageSize = sizeMap[size];

  if (imageError) {
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
          <div style={{ fontSize: "0.9em", opacity: 0.7 }}>
            {lureName}
          </div>
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
