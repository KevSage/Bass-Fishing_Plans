// src/features/plan/PlanNavigation.tsx
import React, { useEffect, useState } from "react";
import { MapOrb } from "@/components/MapOrb";
import {
  CloudIcon,
  ClockIcon,
  TargetIcon,
  CompassIcon,
} from "@/components/UnifiedIcons";

export type PlanTab = "weather" | "pattern1" | "pattern2" | "timeline";

interface PlanNavigationProps {
  activeTab: PlanTab;
  onTabChange: (tab: PlanTab) => void;
  onMapClick: () => void;
}

const LEFT_ITEMS = [
  { id: "weather" as PlanTab, label: "Overview", Icon: CloudIcon },
  { id: "pattern1" as PlanTab, label: "Primary", Icon: TargetIcon },
];

const RIGHT_ITEMS = [
  { id: "pattern2" as PlanTab, label: "Pivot", Icon: CompassIcon },
  { id: "timeline" as PlanTab, label: "Timeline", Icon: ClockIcon },
];

export function PlanNavigation({
  activeTab,
  onTabChange,
  onMapClick,
}: PlanNavigationProps) {
  const renderNavBtn = (item: any) => {
    const isActive = activeTab === item.id;
    return (
      <button
        key={item.id}
        onClick={() => onTabChange(item.id)}
        className={`nav-btn ${isActive ? "active" : ""}`}
        aria-label={item.label}
      >
        <div className="icon-wrapper">
          {/* We rely on CSS 'currentColor' inheritance now */}
          <item.Icon size={22} />
          <span>{item.label}</span>
        </div>
      </button>
    );
  };

  return (
    <nav className="plan-navigation-container">
      <div className="glass-deck">
        <div className="nav-cluster">{LEFT_ITEMS.map(renderNavBtn)}</div>

        <div className="orb-container">
          <button
            onClick={onMapClick}
            className="orb-btn"
            aria-label="Return to Map"
          >
            <div className="orb-glow" />
            <MapOrb size={30} />
          </button>
        </div>

        <div className="nav-cluster">{RIGHT_ITEMS.map(renderNavBtn)}</div>
      </div>

      <style>{`
        .plan-navigation-container {
          position: fixed;
          bottom: 30px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 1000;
          width: 95%;
          max-width: 400px;
        }

        .glass-deck {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 16px;
          background: rgba(18, 18, 18, 0.9);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 28px;
          box-shadow: 
            0 20px 40px rgba(0, 0, 0, 0.6),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
          height: 70px;
          position: relative;
        }

        .nav-cluster {
          display: flex;
          gap: 12px;
        }

        .nav-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          border: none;
          background: transparent;
          cursor: pointer;
          border-radius: 16px;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          
          /* DEFAULT STATE (Inactive) */
          color: rgba(255, 255, 255, 0.35); 
        }

        /* ACTIVE STATE - Bright Blue Icon */
        .nav-btn.active {
          background: rgba(255, 255, 255, 0.03); /* Extremely subtle touch target highlight */
          transform: translateY(-2px);
          
          /* This forces the icon to turn blue */
          color: #4A90E2; 
        }

        /* Target the SVG inside the active button for the glow */
        .nav-btn.active svg {
          filter: drop-shadow(0 0 6px rgba(74, 144, 226, 0.6));
        }

        .nav-btn:active {
          transform: scale(0.95);
        }

        .orb-container {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          width: 76px;
          height: 76px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(18, 18, 18, 0.95);
          border-radius: 50%;
          box-shadow: 0 -10px 20px rgba(0,0,0,0.5); 
          margin-top: -24px;
        }

        .orb-btn {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          border: none;
          background: #000;
          cursor: pointer;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s ease;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.8);
        }

        .orb-btn:active {
          transform: scale(0.9);
        }

        .orb-glow {
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          background: linear-gradient(180deg, rgba(74, 144, 226, 0.6), transparent);
          opacity: 0.3;
          z-index: -1;
          animation: orb-pulse 3s infinite;
        }

        @keyframes orb-pulse {
          0% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.1); }
          100% { opacity: 0.3; transform: scale(1); }
        }
      `}</style>
    </nav>
  );
}
