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
        className={`pnav-btn ${isActive ? "active" : ""}`}
        aria-label={item.label}
      >
        <div className="pnav-icon">
          <item.Icon size={22} />
        </div>
        <span className="pnav-label">{item.label}</span>
      </button>
    );
  };

  return (
    <nav className="plan-nav">
      <div className="pnav-deck">
        <div className="pnav-cluster">{LEFT_ITEMS.map(renderNavBtn)}</div>

        <div className="pnav-orb-wrap">
          <button
            onClick={onMapClick}
            className="pnav-orb"
            aria-label="Return to Map"
          >
            <div className="pnav-orb-glow" />
            <MapOrb size={30} />
          </button>
        </div>

        <div className="pnav-cluster">{RIGHT_ITEMS.map(renderNavBtn)}</div>
      </div>

      <style>{`
        .plan-nav {
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 1000;
          width: 95%;
          max-width: 400px;
        }

        .pnav-deck {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
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

        .pnav-cluster {
          display: flex;
          flex: 1;
          justify-content: space-evenly;
          align-items: center;
          padding: 0 38px 0 0;
        }

        .pnav-cluster:last-child {
          padding: 0 0 0 38px;
        }

        .pnav-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-width: 65px;
          height: 50px;
          border: none;
          background: transparent;
          cursor: pointer;
          border-radius: 12px;
          transition: all 0.2s ease;
          padding: 4px 6px;
          color: rgba(255, 255, 255, 0.5);
          gap: 4px;
        }

        .pnav-btn.active {
          color: #4A90E2;
        }

        .pnav-btn.active svg {
          filter: drop-shadow(0 0 6px rgba(74, 144, 226, 0.6));
        }

        .pnav-btn:active {
          transform: scale(0.95);
        }

        .pnav-icon {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .pnav-label {
          font-size: 11px;
          font-weight: 500;
          white-space: nowrap;
        }

        .pnav-orb-wrap {
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

        .pnav-orb {
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

        .pnav-orb:active {
          transform: scale(0.9);
        }

        .pnav-orb-glow {
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          background: linear-gradient(180deg, rgba(74, 144, 226, 0.6), transparent);
          opacity: 0.3;
          z-index: -1;
          animation: pnav-pulse 3s infinite;
        }

        @keyframes pnav-pulse {
          0% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.1); }
          100% { opacity: 0.3; transform: scale(1); }
        }
      `}</style>
    </nav>
  );
}
