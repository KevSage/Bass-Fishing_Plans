// src/components/MapOrb.tsx
import React from "react";

interface MapOrbProps {
  size?: number;
  className?: string;
  active?: boolean;
}

export const MapOrb = ({
  size = 24,
  className = "",
  active = true,
}: MapOrbProps) => {
  return (
    <div
      className={`map-orb-container ${className}`}
      style={{ width: size, height: size }}
      aria-label="Go to Map"
    >
      <div className="orb-core" />
      {active && <div className="orb-pulse" />}

      <style>{`
        .map-orb-container {
          position: relative;
          display: flex; /* Ensures core is centered */
          align-items: center;
          justify-content: center;
          cursor: pointer;
          /* Important: Prevents parent styles from distorting us */
          box-sizing: border-box; 
        }
        
        .orb-core {
          width: 40%;
          height: 40%;
          background: #4A90E2;
          border-radius: 50%;
          z-index: 2;
          box-shadow: 0 0 8px rgba(74, 144, 226, 0.9);
        }

        .orb-pulse {
          position: absolute;
          /* ✅ ROBUST CENTERING FIX: Snap to all 4 edges */
          inset: 0; 
          margin: auto;
          
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: transparent;
          
          /* The Pulse Animation */
          box-shadow: 0 0 0 0 rgba(74, 144, 226, 0.7);
          animation: orb-pulsate 2s infinite cubic-bezier(0.66, 0, 0, 1);
          z-index: 1;
          pointer-events: none;
        }

        @keyframes orb-pulsate {
          0% {
            box-shadow: 0 0 0 0 rgba(74, 144, 226, 0.7);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(74, 144, 226, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(74, 144, 226, 0);
          }
        }
      `}</style>
    </div>
  );
};
