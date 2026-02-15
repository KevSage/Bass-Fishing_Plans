// src/pages/Journey.tsx

import React, { useMemo, useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeftIcon, TrophyIcon, LockIcon } from "@/components/UnifiedIcons";
// - Import the exact same hook and types
import { useCatchLog, type ActiveLake } from "@/components/CatchLog";
import { calculateJourney, Badge } from "@/lib/journeyUtils";
import { InsightsLoadingScreen } from "@/components/InsightsLoadingScreen";
import { useMemberStatus } from "@/hooks/useMemberStatus";

// =============================================================================
// SUB-COMPONENTS (Visuals)
// =============================================================================

const LevelRing = ({
  level,
  progress,
  totalCatches,
}: {
  level: number;
  progress: number;
  totalCatches: number;
}) => {
  const radius = 58;
  const stroke = 8;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="level-ring-container">
      <div className="ring-wrapper">
        <svg height={radius * 2} width={radius * 2} className="ring-svg">
          <circle
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={stroke}
            fill="transparent"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <circle
            stroke="#4A90E2"
            strokeWidth={stroke}
            strokeDasharray={circumference + " " + circumference}
            style={{ strokeDashoffset }}
            strokeLinecap="round"
            fill="transparent"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            className="ring-progress"
          />
        </svg>
        <div className="ring-content">
          <span className="ring-label">LEVEL</span>
          <span className="ring-value">{level}</span>
        </div>
      </div>
      <div className="hero-stats">
        <div className="hero-stat-item">
          <span className="stat-val">{totalCatches}</span>
          <span className="stat-lbl">Lifetime Catches</span>
        </div>
        <div className="hero-divider" />
        <div className="hero-stat-item">
          <span className="stat-val">{Math.floor(progress)}%</span>
          <span className="stat-lbl">To Next Level</span>
        </div>
      </div>
      <style>{`
        .level-ring-container {
          display: flex; align-items: center; gap: 24px;
          padding: 24px; background: linear-gradient(145deg, rgba(20,20,25,0.6) 0%, rgba(10,10,12,0.8) 100%);
          border-radius: 24px; border: 1px solid rgba(255,255,255,0.08);
          margin-bottom: 24px;
        }
        .ring-wrapper { position: relative; width: 116px; height: 116px; flex-shrink: 0; }
        .ring-svg { transform: rotate(-90deg); }
        .ring-progress { transition: stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1); }
        .ring-content { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
        .ring-label { font-size: 0.65rem; font-weight: 700; color: rgba(255,255,255,0.4); letter-spacing: 0.1em; }
        .ring-value { font-size: 2.2rem; font-weight: 800; color: #fff; line-height: 1; text-shadow: 0 0 20px rgba(74, 144, 226, 0.5); }
        
        .hero-stats { display: flex; gap: 20px; align-items: center; }
        .hero-stat-item { display: flex; flex-direction: column; gap: 2px; }
        .stat-val { font-size: 1.4rem; font-weight: 700; color: #fff; }
        .stat-lbl { font-size: 0.8rem; color: rgba(255,255,255,0.5); }
        .hero-divider { width: 1px; height: 30px; background: rgba(255,255,255,0.1); }
      `}</style>
    </div>
  );
};

const SeasonCard = ({ season }: { season: any }) => (
  <div className="season-card">
    <div className="season-header">
      <span className="season-badge">CURRENT SEASON</span>
      <span className="season-name">{season.name}</span>
    </div>
    <div className="season-grid">
      <div className="season-metric">
        <span className="s-val">{season.catchCount}</span>
        <span className="s-lbl">Catches</span>
      </div>
      <div className="season-metric">
        <span className="s-val highlight">{season.bestLure}</span>
        <span className="s-lbl">Top Pattern</span>
      </div>
      <div className="season-metric">
        <span className="s-val">{season.bestLake}</span>
        <span className="s-lbl">Top Lake</span>
      </div>
    </div>
    <style>{`
      .season-card {
        background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
        border-radius: 20px; padding: 20px; margin-bottom: 32px;
        position: relative; overflow: hidden;
      }
      .season-card::before {
        content: ''; position: absolute; top: 0; left: 0; width: 4px; height: 100%;
        background: #FBBF24; /* Gold accent for current season */
      }
      .season-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 16px; }
      .season-badge { font-size: 0.7rem; font-weight: 700; color: #FBBF24; letter-spacing: 0.05em; }
      .season-name { font-size: 0.95rem; font-weight: 600; color: rgba(255,255,255,0.9); }
      .season-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
      .season-metric { display: flex; flex-direction: column; gap: 4px; }
      .s-val { font-size: 1.1rem; font-weight: 700; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .s-val.highlight { color: #FBBF24; }
      .s-lbl { font-size: 0.75rem; color: rgba(255,255,255,0.5); }
    `}</style>
  </div>
);

const MasteryBar = ({ skill, delay }: { skill: any; delay: number }) => {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => setWidth(skill.progress), delay);
    return () => clearTimeout(timer);
  }, [skill.progress, delay]);

  const getBarColor = (level: string) => {
    switch (level) {
      case "Elite":
        return "#A855F7";
      case "Specialist":
        return "#FBBF24";
      case "Dialed":
        return "#3B82F6";
      default:
        return "#64748B";
    }
  };

  return (
    <div className="mastery-item">
      <div className="m-header">
        <span className="m-name">{skill.name}</span>
        <span className="m-lvl" style={{ color: getBarColor(skill.level) }}>
          {skill.level} <span className="m-count">({skill.count})</span>
        </span>
      </div>
      <div className="m-track">
        <div
          className="m-fill"
          style={{
            width: `${width}%`,
            backgroundColor: getBarColor(skill.level),
            boxShadow: `0 0 12px ${getBarColor(skill.level)}40`,
          }}
        />
      </div>
      <style>{`
        .mastery-item { margin-bottom: 16px; }
        .m-header { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 0.9rem; }
        .m-name { font-weight: 600; color: rgba(255,255,255,0.9); }
        .m-lvl { font-weight: 700; font-size: 0.8rem; }
        .m-count { opacity: 0.6; font-weight: 400; }
        .m-track { width: 100%; height: 6px; background: rgba(255,255,255,0.08); border-radius: 3px; overflow: hidden; }
        .m-fill { height: 100%; border-radius: 3px; transition: width 1s cubic-bezier(0.4, 0, 0.2, 1); }
      `}</style>
    </div>
  );
};

const BadgeCard = ({
  badge,
  onClick,
}: {
  badge: Badge;
  onClick: () => void;
}) => {
  const isUnlocked = badge.isUnlocked;

  const getGradient = (tier: string) => {
    switch (tier) {
      case "platinum":
        return "linear-gradient(135deg, #e2e2e2 0%, #9ca3af 100%)";
      case "gold":
        return "linear-gradient(135deg, #FCD34D 0%, #B45309 100%)";
      case "silver":
        return "linear-gradient(135deg, #F3F4F6 0%, #9CA3AF 100%)";
      case "obsidian":
        return "linear-gradient(135deg, #4B5563 0%, #1F2937 100%)";
      default:
        return "linear-gradient(135deg, #dca578 0%, #8c5836 100%)";
    }
  };

  return (
    <button
      className={`badge-btn ${!isUnlocked ? "locked" : ""}`}
      onClick={onClick}
      disabled={!isUnlocked}
    >
      <div
        className="badge-coin"
        style={{
          background: isUnlocked
            ? getGradient(badge.tier)
            : "rgba(255,255,255,0.05)",
        }}
      >
        {isUnlocked ? (
          <TrophyIcon size={20} className="badge-icon-unlocked" />
        ) : (
          <LockIcon size={16} className="badge-icon-locked" />
        )}
      </div>
      <span className="badge-title">{badge.title}</span>
      <style>{`
        .badge-btn {
          background: transparent; border: none; display: flex; flex-direction: column;
          align-items: center; gap: 10px; cursor: pointer; padding: 0;
          transition: transform 0.2s;
        }
        .badge-btn:active { transform: scale(0.95); }
        .badge-btn.locked { opacity: 0.5; cursor: default; }
        
        .badge-coin {
          width: 64px; height: 64px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          position: relative;
        }
        .badge-coin::after {
          content: ''; position: absolute; inset: 0; border-radius: 50%;
          background: linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 60%);
        }
        .badge-icon-unlocked { color: rgba(0,0,0,0.6); mix-blend-mode: multiply; }
        .badge-icon-locked { color: rgba(255,255,255,0.3); }
        .badge-title { font-size: 0.75rem; color: rgba(255,255,255,0.8); font-weight: 500; text-align: center; line-height: 1.2; }
      `}</style>
    </button>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function Journey() {
  const navigate = useNavigate();
  const { isActive } = useMemberStatus();

  // --- DATA FETCHING (REPLICATING INSIGHTS.TSX) ---

  // - We use the EXACT same virtual lake configuration as Insights.tsx
  // This likely triggers the "fetch all" logic in the hook/backend.
  const virtualActiveLake = useMemo<ActiveLake>(
    () => ({ id: "upload-session", name: "Photo Upload", lat: 0, lng: 0 }),
    [],
  );

  // - Use the hook exactly as Insights does
  const catchLog = useCatchLog(virtualActiveLake, { disableListView: true });

  // Destructure entries directly from the hook result
  const { entries, isLoading } = catchLog;

  // Debugging: Check if entries are arriving
  useEffect(() => {
    if (!isLoading) {
      console.log("Journey Data Loaded:", entries.length, "entries found.");
    }
  }, [entries, isLoading]);

  // Calculate Journey Stats from the hook data
  const stats = useMemo(() => calculateJourney(entries), [entries]);

  // Animation State
  const [showContent, setShowContent] = useState(false);
  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => setShowContent(true), 100);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  if (isLoading) {
    return <InsightsLoadingScreen />;
  }

  return (
    <div className="journey-page">
      {/* PRO GATE OVERLAY */}
      {!isActive && (
        <div className="journey-gate-overlay">
          <div className="journey-gate-card">
            <div className="gate-icon">
              <LockIcon size={32} />
            </div>
            <h2>Unlock Your Journey</h2>
            <p>
              Track your angling progress, earn badges, and master techniques
              with Bass Clarity Pro.
            </p>
            <ul className="gate-features">
              <li>Level up with every catch logged</li>
              <li>Earn badges for milestones</li>
              <li>Track technique mastery</li>
              <li>See seasonal patterns</li>
            </ul>
            <Link to="/upgrade" className="gate-cta">
              Upgrade to Pro
            </Link>
            <button
              onClick={() => navigate(-1)}
              className="gate-back"
            >
              Go Back
            </button>
          </div>
        </div>
      )}

      <div className={`j-content ${showContent ? "visible" : ""} ${!isActive ? "j-blurred" : ""}`}>
        {/* HERO RING */}
        <LevelRing
          level={stats.level}
          progress={(stats.currentXP / stats.nextLevelXP) * 100}
          totalCatches={stats.totalCatches}
        />

        {/* SEASON CARD */}
        <SeasonCard season={stats.season} />

        {/* MASTERY STACK */}
        <div className="section-block">
          <div className="section-title">Technique Mastery</div>
          <div className="mastery-list">
            {stats.mastery.slice(0, 5).map((skill, i) => (
              <MasteryBar
                key={skill.name}
                skill={skill}
                delay={i * 100 + 300}
              />
            ))}
            {stats.mastery.length === 0 && (
              <div className="empty-state-box">
                <p>Log catches to see your mastery DNA.</p>
              </div>
            )}
          </div>
        </div>

        {/* TROPHY CASE */}
        <div className="section-block">
          <div className="section-title">Trophy Case</div>
          <div className="badge-grid">
            {stats.badges.map((badge) => (
              <BadgeCard
                key={badge.id}
                badge={badge}
                onClick={() =>
                  alert(`Unlocked: ${badge.title}\n${badge.description}`)
                }
              />
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .journey-page {
          background: #0a0a0a; min-height: 100vh; color: #fff;
          padding: 20px; padding-bottom: 80px; max-width: 600px; margin: 0 auto;
        }
        .j-header {
          display: flex; align-items: center; gap: 16px; margin-bottom: 24px;
        }
        .j-header h1 { font-size: 1.2rem; font-weight: 700; margin: 0; }
        .j-back-btn {
          background: rgba(255,255,255,0.1); border: none; color: white;
          width: 40px; height: 40px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center; cursor: pointer;
        }
        
        .j-content { opacity: 0; transform: translateY(20px); transition: all 0.6s ease-out; }
        .j-content.visible { opacity: 1; transform: translateY(0); }

        .section-block { margin-bottom: 40px; }
        .section-title {
          font-size: 1rem; font-weight: 700; color: #fff; margin-bottom: 16px;
          display: flex; align-items: center; gap: 8px;
        }
        .empty-state-box {
          padding: 20px; background: rgba(255,255,255,0.03); border-radius: 12px;
          border: 1px dashed rgba(255,255,255,0.1); text-align: center;
        }
        .empty-state-box p { font-size: 0.9rem; color: rgba(255,255,255,0.4); margin: 0; font-style: italic; }

        .badge-grid {
          display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px 10px;
        }

        /* PRO GATE STYLES */
        .j-blurred {
          filter: blur(8px);
          pointer-events: none;
          user-select: none;
        }

        .journey-gate-overlay {
          position: fixed;
          inset: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          padding-top: calc(env(safe-area-inset-top, 0px) + 80px);
          background: rgba(0, 0, 0, 0.4);
        }

        .journey-gate-card {
          background: linear-gradient(145deg, rgba(20, 20, 28, 0.98) 0%, rgba(10, 10, 14, 0.98) 100%);
          border: 1px solid rgba(74, 144, 226, 0.3);
          border-radius: 24px;
          padding: 32px 28px;
          max-width: 360px;
          width: 100%;
          text-align: center;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        }

        .gate-icon {
          width: 64px;
          height: 64px;
          margin: 0 auto 20px;
          background: rgba(74, 144, 226, 0.15);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #4A90E2;
        }

        .journey-gate-card h2 {
          margin: 0 0 12px;
          font-size: 1.4rem;
          font-weight: 700;
          color: #fff;
        }

        .journey-gate-card > p {
          margin: 0 0 20px;
          font-size: 0.95rem;
          line-height: 1.5;
          color: rgba(255, 255, 255, 0.7);
        }

        .gate-features {
          list-style: none;
          padding: 0;
          margin: 0 0 24px;
          text-align: left;
        }

        .gate-features li {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 0;
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.8);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .gate-features li::before {
          content: '✓';
          color: #4A90E2;
          font-weight: 700;
        }

        .gate-cta {
          display: block;
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #4A90E2 0%, #357ABD 100%);
          border: none;
          border-radius: 14px;
          color: #fff;
          font-size: 1rem;
          font-weight: 700;
          text-decoration: none;
          text-align: center;
          cursor: pointer;
          box-shadow: 0 8px 24px rgba(74, 144, 226, 0.3);
          transition: transform 0.2s, filter 0.2s;
        }

        .gate-cta:hover {
          transform: translateY(-1px);
          filter: brightness(1.1);
        }

        .gate-back {
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.4);
          font-size: 0.9rem;
          margin-top: 16px;
          cursor: pointer;
          padding: 8px 16px;
        }

        .gate-back:hover {
          color: rgba(255, 255, 255, 0.7);
        }
      `}</style>
    </div>
  );
}
