// src/components/MapOrb.tsx
import React from "react";

interface MapOrbProps {
  size?: number;
  className?: string;
  active?: boolean;
  variant?: "default" | "indigo" | "white"; // Added 'white'
}

export const MapOrb = ({
  size = 24,
  className = "",
  active = true,
  variant = "default",
}: MapOrbProps) => {
  // Define colors based on variant
  // Default (Blue): #4A90E2 -> RGB: 74, 144, 226
  // Indigo: #6366f1 -> RGB: 99, 102, 241 (Tailwind Indigo-500)
  // White: #ffffff -> RGB: 255, 255, 255 (Dimmed via opacity in variable)

  let color = "#4A90E2";
  let shadowRgb = "74, 144, 226";

  if (variant === "indigo") {
    color = "#6366f1";
    shadowRgb = "99, 102, 241";
  } else if (variant === "white") {
    color = "rgba(255, 255, 255, 0.85)"; // Slightly dimmed white
    shadowRgb = "255, 255, 255";
  }

  const styleVars = {
    "--orb-color": color,
    "--orb-shadow-rgb": shadowRgb,
    width: size,
    height: size,
  } as React.CSSProperties;

  return (
    <div
      className={`map-orb-container ${className}`}
      style={styleVars}
      aria-label="Go to Map"
    >
      <div className="orb-core" />
      {active && <div className="orb-pulse" />}

      <style>{`
        .map-orb-container {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-sizing: border-box;
        }
        
        .orb-core {
          width: 40%;
          height: 40%;
          background: var(--orb-color);
          border-radius: 50%;
          z-index: 2;
          box-shadow: 0 0 8px rgba(var(--orb-shadow-rgb), 0.8);
          transition: background 0.3s ease, box-shadow 0.3s ease;
        }

        .orb-pulse {
          position: absolute;
          inset: 0; 
          margin: auto;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: transparent;
          z-index: 1;
          pointer-events: none;
          
          animation: orb-pulsate 2s infinite cubic-bezier(0.66, 0, 0, 1);
        }

        @keyframes orb-pulsate {
          0% {
            box-shadow: 0 0 0 0 rgba(var(--orb-shadow-rgb), 0.6);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(var(--orb-shadow-rgb), 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(var(--orb-shadow-rgb), 0);
          }
        }
      `}</style>
    </div>
  );
};
