import React, { useState, useEffect } from "react";
import { ActivityIcon } from "@/components/UnifiedIcons";

interface PlanGenerationLoaderProps {
  lakeName: string;
  onComplete?: () => void;
}

const steps = [
  { label: "Analyzing lake conditions", duration: 6000 },
  { label: "Checking weather patterns", duration: 7000 },
  { label: "Identifying bass patterns", duration: 7500 },
  { label: "Analyzing water temperature", duration: 6500 },
  { label: "Selecting optimal lures", duration: 8000 },
  { label: "Matching color profiles", duration: 7000 },
  { label: "Generating strategy", duration: 8000 },
  { label: "Finalizing your plan", duration: 7000 },
];

const totalDuration = steps.reduce((sum, step) => sum + step.duration, 0); // ~57 seconds

export function PlanGenerationLoader({
  lakeName,
  onComplete,
}: PlanGenerationLoaderProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    let elapsed = 0;
    let stepIndex = 0;

    // Progress through steps
    const stepTimers = steps.map((step, index) => {
      elapsed += index > 0 ? steps[index - 1].duration : 0;
      return setTimeout(() => {
        setCurrentStep(index + 1);
      }, elapsed);
    });

    // Update elapsed time for progress bar
    const interval = setInterval(() => {
      setElapsedTime((prev) => {
        const next = prev + 100;
        return next <= totalDuration ? next : totalDuration;
      });
    }, 100);

    // Complete
    const completeTimer = setTimeout(() => {
      if (onComplete) onComplete();
    }, totalDuration);

    return () => {
      stepTimers.forEach(clearTimeout);
      clearTimeout(completeTimer);
      clearInterval(interval);
    };
  }, [onComplete]);

  const progress = Math.min(100, (elapsedTime / totalDuration) * 100);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(to bottom, #0a0a0a, #1a1a2e)",
        padding: "20px",
      }}
    >
      <div style={{ maxWidth: 500, width: "100%" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div
            style={{
              fontSize: "0.85rem",
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              color: "#4A90E2",
              marginBottom: 12,
            }}
          >
            Generating Your Plan
          </div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 700, marginBottom: 8 }}>
            {lakeName}
          </h1>
          <p style={{ opacity: 0.6, fontSize: "0.95rem" }}>
            Creating your personalized fishing strategy...
          </p>
        </div>

        {/* Steps */}
        <div style={{ marginBottom: 32 }}>
          {steps.map((step, index) => {
            const isComplete = index < currentStep;
            const isActive = index === currentStep;
            const isPending = index > currentStep;

            return (
              <div
                key={index}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  marginBottom: 16,
                  opacity: isComplete ? 1 : isActive ? 1 : 0.4,
                  transition: "opacity 0.3s ease",
                }}
              >
                {/* Icon */}
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: isComplete
                      ? "#4A90E2"
                      : isActive
                      ? "rgba(74, 144, 226, 0.2)"
                      : "rgba(255, 255, 255, 0.1)",
                    border: isComplete
                      ? "none"
                      : `2px solid ${
                          isActive ? "#4A90E2" : "rgba(255, 255, 255, 0.2)"
                        }`,
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    transition: "all 0.3s ease",
                  }}
                >
                  {isComplete ? (
                    "✓"
                  ) : isActive ? (
                    <ActivityIcon size={14} style={{ color: "#4A90E2" }} />
                  ) : (
                    "○"
                  )}
                </div>

                {/* Label */}
                <div
                  style={{
                    fontSize: "0.95rem",
                    fontWeight: isActive ? 600 : 400,
                    color:
                      isComplete || isActive ? "#fff" : "rgba(255,255,255,0.5)",
                  }}
                >
                  {step.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* Progress Bar */}
        <div style={{ marginBottom: 12 }}>
          <div
            style={{
              width: "100%",
              height: 8,
              background: "rgba(255, 255, 255, 0.1)",
              borderRadius: 4,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: "100%",
                background: "linear-gradient(90deg, #4A90E2, #5BA3F5)",
                transition: "width 0.1s linear",
                borderRadius: 4,
              }}
            />
          </div>
        </div>

        {/* Percentage */}
        <div
          style={{
            textAlign: "center",
            fontSize: "0.9rem",
            opacity: 0.6,
            fontWeight: 600,
          }}
        >
          {Math.round(progress)}%
        </div>

        {/* Subtle Tip at Bottom */}
        <div
          style={{
            textAlign: "center",
            fontSize: "0.75rem",
            opacity: 0.25,
            marginTop: 32,
          }}
        >
          Location-specific plans may take up to 60 seconds
        </div>
      </div>
    </div>
  );
}
