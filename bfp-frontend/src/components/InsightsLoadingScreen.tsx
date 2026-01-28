import React, { useState, useEffect } from "react";

const INSIGHT_MESSAGES = [
  "Querying Historical Database...",
  "Correlating Weather Variables...",
  "Detecting Seasonal Trends...",
  "Compiling Performance Metrics...",
  "Analyzing Lure Effectiveness...",
  "Synthesizing Catch Patterns...",
];

export function InsightsLoadingScreen() {
  const [loadingMsg, setLoadingMsg] = useState(INSIGHT_MESSAGES[0]);

  useEffect(() => {
    let index = Math.floor(Math.random() * INSIGHT_MESSAGES.length);
    setLoadingMsg(INSIGHT_MESSAGES[index]);

    const interval = setInterval(() => {
      index = (index + 1) % INSIGHT_MESSAGES.length;
      setLoadingMsg(INSIGHT_MESSAGES[index]);
    }, 1800);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        padding: 60,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        opacity: 0.8,
      }}
    >
      <div className="data-wave">
        <div className="bar bar-1" />
        <div className="bar bar-2" />
        <div className="bar bar-3" />
        <div className="bar bar-4" />
        <div className="bar bar-5" />
      </div>

      <div
        style={{
          marginTop: 24,
          color: "#4A90E2",
          fontSize: "0.8rem",
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          textAlign: "center",
          minWidth: "260px",
          animation: "pulseText 1.5s ease-in-out infinite",
        }}
      >
        {loadingMsg}
      </div>

      <style>{`
        .data-wave { display: flex; align-items: center; gap: 6px; height: 40px; }
        .bar { width: 6px; background: #4A90E2; border-radius: 4px; animation: equalize 1s ease-in-out infinite; box-shadow: 0 0 8px rgba(74, 144, 226, 0.4); }
        .bar-1 { height: 20px; animation-delay: 0.0s; }
        .bar-2 { height: 35px; animation-delay: 0.1s; }
        .bar-3 { height: 50px; animation-delay: 0.2s; }
        .bar-4 { height: 35px; animation-delay: 0.3s; }
        .bar-5 { height: 20px; animation-delay: 0.4s; }
        @keyframes equalize { 0%, 100% { transform: scaleY(1); opacity: 0.6; } 50% { transform: scaleY(1.8); opacity: 1; } }
        @keyframes pulseText { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
      `}</style>
    </div>
  );
}
