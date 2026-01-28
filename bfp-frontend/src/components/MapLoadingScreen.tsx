import React, { useState, useEffect } from "react";

const LOADING_MESSAGES = [
  "Triangulating GPS Position...",
  "Retrieving Saved Locations...",
  "Syncing Weather Telemetry...",
  "Rendering Lake Boundaries...",
  "Analyzing Atmospheric Pressure...",
  "Constructing Geospatial Grid...",
];

export function MapLoadingScreen() {
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MESSAGES[0]);

  useEffect(() => {
    // Pick a random start index
    let index = Math.floor(Math.random() * LOADING_MESSAGES.length);
    setLoadingMsg(LOADING_MESSAGES[index]);

    // Cycle messages
    const interval = setInterval(() => {
      index = (index + 1) % LOADING_MESSAGES.length;
      setLoadingMsg(LOADING_MESSAGES[index]);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        height: "100%",
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "transparent",
      }}
    >
      <div className="sonar-loader">
        <div className="sonar-emitter" />
        <div className="sonar-wave wave-1" />
        <div className="sonar-wave wave-2" />
        <div className="sonar-wave wave-3" />
      </div>

      <div
        style={{
          marginTop: 32,
          color: "#4A90E2",
          fontSize: "0.85rem",
          fontWeight: 700,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          opacity: 0.9,
          minWidth: "240px",
          textAlign: "center",
          animation: "fadeInOut 2s ease-in-out infinite",
        }}
      >
        {loadingMsg}
      </div>

      <style>{`
        .sonar-loader { position: relative; width: 120px; height: 120px; display: flex; align-items: center; justify-content: center; }
        .sonar-emitter { width: 16px; height: 16px; background: #4A90E2; border-radius: 50%; z-index: 2; box-shadow: 0 0 15px rgba(74, 144, 226, 0.8); animation: breathe 2s ease-in-out infinite; }
        .sonar-wave { position: absolute; border: 2px solid #4A90E2; border-radius: 50%; opacity: 0; top: 50%; left: 50%; transform: translate(-50%, -50%); animation: ripple 2.5s cubic-bezier(0, 0.2, 0.8, 1) infinite; }
        .wave-1 { animation-delay: 0s; }
        .wave-2 { animation-delay: 0.6s; }
        .wave-3 { animation-delay: 1.2s; }
        @keyframes ripple { 0% { width: 0; height: 0; opacity: 0; border-width: 4px; } 5% { opacity: 1; } 100% { width: 100%; height: 100%; opacity: 0; border-width: 0px; } }
        @keyframes breathe { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(0.8); opacity: 0.7; } }
        @keyframes fadeInOut { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
      `}</style>
    </div>
  );
}
