// src/components/MapOrb.tsx
import React from "react";

interface MapOrbProps {
  size?: number;
  className?: string;
  active?: boolean;
  variant?: "default" | "indigo"; // CHANGED: gold -> indigo
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
  const isIndigo = variant === "indigo";

  const styleVars = {
    "--orb-color": isIndigo ? "#6366f1" : "#4A90E2",
    "--orb-shadow-rgb": isIndigo ? "99, 102, 241" : "74, 144, 226",
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
          box-shadow: 0 0 8px rgba(var(--orb-shadow-rgb), 0.9);
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
            box-shadow: 0 0 0 0 rgba(var(--orb-shadow-rgb), 0.7);
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
