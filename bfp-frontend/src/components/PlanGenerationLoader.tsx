import React, { useState, useEffect } from "react";

interface PlanGenerationLoaderProps {
  lakeName: string;
  onComplete?: () => void;
}

// CONFIGURATION: The "Honest" Inference Engine
const STEPS_CONFIG = [
  {
    label: "Analyzing Regional Conditions",
    duration: 6000,
    logs: [
      "Accessing local weather telemetry...",
      "Calculating solunar influence indices...",
      "Analyzing barometric pressure trends...",
      "Evaluating cloud cover & light penetration...",
    ],
  },
  {
    label: "Modeling Bass Biology",
    duration: 6000,
    logs: [
      "Estimating water temperature variance...",
      "Predicting metabolic feeding windows...",
      "Determining seasonal progression...",
      "Inferring regional migration activity...",
    ],
  },
  {
    label: "Predicting Structural Affinities",
    duration: 6000,
    logs: [
      "Identifying high-probability cover types...",
      "Prioritizing seasonal staging areas...",
      "Evaluating wind-blown bank potential...",
      "Inferring optimal depth zones...",
    ],
  },
  {
    label: "Computing Presentation Strategy",
    duration: 5000,
    logs: [
      "Analyzing reaction vs. finesse viability...",
      "Optimizing lure vibration signatures...",
      "Calibrating retrieval cadence...",
      "Matching regional hatch profiles...",
    ],
  },
  {
    label: "Refining Visual Profile",
    duration: 6000,
    logs: [
      "Assessing water column light refraction...",
      "Matching forage base color palettes...",
      "Adjusting for estimated turbidity...",
      "Finalizing contrast ratios...",
    ],
  },
  {
    label: "Generating Tactical Plan",
    duration: 700,
    logs: [
      "Synthesizing pattern confidence levels...",
      "Compiling gear specifications...",
      "Formulating target location types...",
      "Finalizing strategic output...",
    ],
  },
];

const TOTAL_DURATION = STEPS_CONFIG.reduce(
  (sum, step) => sum + step.duration,
  0,
);

export function PlanGenerationLoader({
  lakeName,
  onComplete,
}: PlanGenerationLoaderProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [logLine, setLogLine] = useState("");

  useEffect(() => {
    let logTimer: NodeJS.Timeout;

    // 1. Manage Steps
    let cumulativeTime = 0;
    STEPS_CONFIG.forEach((step, index) => {
      setTimeout(() => {
        setCurrentStepIndex(index);

        let logIndex = 0;
        setLogLine(step.logs[0]);

        const logInterval = Math.max(800, step.duration / step.logs.length);

        logTimer = setInterval(() => {
          logIndex++;
          if (logIndex < step.logs.length) {
            setLogLine(step.logs[logIndex]);
          }
        }, logInterval);

        setTimeout(() => clearInterval(logTimer), step.duration);
      }, cumulativeTime);
      cumulativeTime += step.duration;
    });

    // 2. Global Progress
    const progressInterval = setInterval(() => {
      setElapsedTime((prev) => Math.min(prev + 100, TOTAL_DURATION));
    }, 100);

    const completeTimer = setTimeout(() => {
      if (onComplete) onComplete();
    }, TOTAL_DURATION + 1000);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(completeTimer);
      clearInterval(logTimer);
    };
  }, [onComplete]);

  const progressPercent = Math.min(100, (elapsedTime / TOTAL_DURATION) * 100);
  const activeStep =
    STEPS_CONFIG[currentStepIndex] || STEPS_CONFIG[STEPS_CONFIG.length - 1];

  return (
    <div className="loader-container">
      {/* Background Effects */}
      <div className="topo-bg" />
      <div className="vignette-overlay" />

      <div className="loader-content">
        {/* HEADER */}
        <div className="header-section">
          <div className="system-status">SYSTEM ACTIVE // GENERATING PLAN</div>
          <h1 className="lake-title">{lakeName}</h1>
        </div>

        {/* THE VISUAL CORE (Animation) */}
        <div className="core-wrapper">
          <svg className="progress-ring" width="220" height="220">
            <circle
              className="progress-ring-bg"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="2"
              fill="transparent"
              r="108"
              cx="110"
              cy="110"
            />
            <circle
              className="progress-ring-fill"
              stroke="#4A90E2"
              strokeWidth="2"
              fill="transparent"
              r="108"
              cx="110"
              cy="110"
              style={{
                strokeDasharray: `${2 * Math.PI * 108}`,
                strokeDashoffset: `${2 * Math.PI * 108 * (1 - progressPercent / 100)}`,
                transition: "stroke-dashoffset 0.1s linear",
              }}
            />
          </svg>

          <div className="neural-core">
            <div className="core-ring ring-1" />
            <div className="core-ring ring-2" />
            <div className="core-ring ring-3" />
            <div className="core-center-glow" />
          </div>
        </div>

        {/* STATUS READOUT (Below Core) */}
        <div className="status-readout">
          <div className="percent-block">
            <span className="percent-val">{Math.round(progressPercent)}</span>
            <span className="percent-sym">%</span>
          </div>
          <div className="step-label">{activeStep.label}</div>
        </div>

        {/* TERMINAL LOG */}
        <div className="terminal-section">
          <div className="log-line">
            <span className="log-prompt">{">"}</span>
            <span className="log-text">{logLine}</span>
            <span className="blinking-cursor">_</span>
          </div>
        </div>

        {/* STEP DOTS */}
        <div className="step-dots">
          {STEPS_CONFIG.map((_, idx) => (
            <div
              key={idx}
              className={`step-dot ${idx <= currentStepIndex ? "active" : ""}`}
            />
          ))}
        </div>
      </div>

      <style>{`
        /* FONTS & LAYOUT */
        .loader-container {
          position: fixed; inset: 0; background: #050505;
          display: flex; align-items: center; justify-content: center;
          color: #fff; 
          font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          overflow: hidden;
        }

        /* BACKGROUND */
        .topo-bg {
          position: absolute; inset: -50%;
          background-image: 
            radial-gradient(circle at center, transparent 0%, #050505 80%),
            repeating-linear-gradient(0deg, transparent 0px, transparent 1px, rgba(74, 144, 226, 0.03) 1px, rgba(74, 144, 226, 0.03) 2px),
            repeating-linear-gradient(90deg, transparent 0px, transparent 1px, rgba(74, 144, 226, 0.03) 1px, rgba(74, 144, 226, 0.03) 2px);
          background-size: 100px 100px;
          transform: perspective(500px) rotateX(20deg) scale(1.5);
          animation: drift 60s linear infinite;
          z-index: 0;
        }
        .vignette-overlay {
          position: absolute; inset: 0;
          background: radial-gradient(circle at center, transparent 30%, #050505 90%);
          z-index: 1;
        }
        @keyframes drift {
          0% { transform: perspective(500px) rotateX(20deg) scale(1.5) translateY(0); }
          100% { transform: perspective(500px) rotateX(20deg) scale(1.5) translateY(100px); }
        }

        /* CONTENT */
        .loader-content {
          position: relative; z-index: 10;
          display: flex; flex-direction: column; align-items: center;
          width: 100%; max-width: 600px;
        }

        /* HEADER */
        .header-section { text-align: center; margin-bottom: 32px; }
        .system-status {
          font-size: 0.7rem; color: #4A90E2; font-weight: 700;
          letter-spacing: 0.15em; text-transform: uppercase; margin-bottom: 8px;
          opacity: 0.9; font-family: 'Consolas', 'Monaco', monospace;
        }
        .lake-title {
          font-size: 2.5rem; font-weight: 700; margin: 0; letter-spacing: -0.03em;
          background: linear-gradient(180deg, #fff 0%, #a5a5a5 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }

        /* CORE ANIMATION */
        .core-wrapper {
          position: relative; width: 220px; height: 220px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 32px;
        }
        .progress-ring { position: absolute; inset: 0; transform: rotate(-90deg); }
        .neural-core {
          position: absolute; width: 160px; height: 160px;
          border-radius: 50%; display: flex; align-items: center; justify-content: center;
        }
        .core-ring {
          position: absolute; border-radius: 50%;
          border: 1px solid #4A90E2; box-shadow: 0 0 15px rgba(74, 144, 226, 0.15);
        }
        .ring-1 { width: 100%; height: 100%; opacity: 0.2; animation: spin 12s linear infinite; border-style: dashed; }
        .ring-2 { width: 70%; height: 70%; opacity: 0.4; animation: spin 8s linear infinite reverse; border-top-color: transparent; }
        .ring-3 { width: 40%; height: 40%; opacity: 0.8; animation: pulse 3s ease-in-out infinite; border: 1px solid #4A90E2; }
        .core-center-glow {
          position: absolute; width: 12px; height: 12px; background: #4A90E2;
          border-radius: 50%; box-shadow: 0 0 40px 20px rgba(74, 144, 226, 0.4);
          animation: heartbeat 2s ease-in-out infinite;
        }

        /* STATUS READOUT */
        .status-readout { text-align: center; margin-bottom: 24px; }
        .percent-block { margin-bottom: 8px; }
        .percent-val { font-size: 3rem; font-weight: 700; color: #fff; line-height: 1; letter-spacing: -0.02em; }
        .percent-sym { font-size: 1rem; color: rgba(255,255,255,0.4); margin-left: 4px; font-weight: 400; vertical-align: super; }
        .step-label {
          font-size: 1.1rem; color: #fff; font-weight: 500; letter-spacing: 0.01em;
        }

        /* TERMINAL LOG */
        .terminal-section { height: 60px; display: flex; align-items: flex-start; justify-content: center; }
        .log-line {
          font-family: 'Consolas', 'Monaco', 'Andale Mono', 'Ubuntu Mono', monospace;
          font-size: 0.9rem; color: #4A90E2; 
          background: rgba(74, 144, 226, 0.08);
          padding: 8px 16px; border-radius: 6px; 
          border: 1px solid rgba(74, 144, 226, 0.15);
          display: inline-flex; align-items: center;
        }
        .log-prompt { opacity: 0.6; margin-right: 10px; font-weight: 700; }
        .log-text { opacity: 0.9; }
        .blinking-cursor { animation: blink 1s step-end infinite; margin-left: 6px; color: #4A90E2; font-weight: 700; }

        /* STEP DOTS */
        .step-dots { display: flex; gap: 8px; margin-top: 16px; }
        .step-dot {
          width: 5px; height: 5px; border-radius: 50%; background: rgba(255,255,255,0.1);
          transition: all 0.3s ease;
        }
        .step-dot.active { background: #4A90E2; box-shadow: 0 0 10px #4A90E2; transform: scale(1.4); }

        /* ANIMATIONS */
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 0.5; transform: scale(1); } 50% { opacity: 1; transform: scale(1.05); } }
        @keyframes heartbeat { 0%, 100% { transform: scale(1); opacity: 0.6; } 15% { transform: scale(1.4); opacity: 1; } }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
      `}</style>
    </div>
  );
}
