// src/components/LoadingStates.tsx
// Beautiful loading states for plan generation

import React from 'react';

// Plan Generation Loading
export function PlanGenerating() {
  return (
    <div className="plan-generating">
      <div className="generating-animation">
        {/* Animated fishing lure */}
        <div className="fishing-line">
          <div className="lure-spinner">
            <svg width="60" height="60" viewBox="0 0 60 60">
              <circle 
                cx="30" 
                cy="30" 
                r="25" 
                fill="none" 
                stroke="#4A90E2" 
                strokeWidth="3"
                strokeDasharray="120"
                strokeDashoffset="0"
                className="spinner-circle"
              />
              <circle cx="30" cy="30" r="15" fill="#4A90E2" opacity="0.2" />
              <circle cx="30" cy="30" r="8" fill="#4A90E2" />
            </svg>
          </div>
        </div>
      </div>
      
      <div style={{ textAlign: 'center', marginTop: 32 }}>
        <h3 className="h3" style={{ marginBottom: 12 }}>Analyzing conditions...</h3>
        <p className="text-muted">Building your location-specific plan</p>
      </div>

      <style>{`
        .plan-generating {
          padding: 80px 20px;
          text-align: center;
        }
        
        .generating-animation {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100px;
        }
        
        .fishing-line {
          position: relative;
          width: 2px;
          height: 40px;
          background: linear-gradient(to bottom, transparent, #4A90E2);
          animation: fishingLineBob 2s ease-in-out infinite;
        }
        
        .lure-spinner {
          position: absolute;
          bottom: -30px;
          left: 50%;
          transform: translateX(-50%);
          animation: lureSwing 2s ease-in-out infinite;
        }
        
        .spinner-circle {
          animation: spinnerRotate 1.5s linear infinite;
          transform-origin: center;
        }
        
        @keyframes fishingLineBob {
          0%, 100% { height: 40px; }
          50% { height: 60px; }
        }
        
        @keyframes lureSwing {
          0%, 100% { transform: translateX(-50%) rotate(-5deg); }
          50% { transform: translateX(-50%) rotate(5deg); }
        }
        
        @keyframes spinnerRotate {
          from { stroke-dashoffset: 0; }
          to { stroke-dashoffset: 240; }
        }
      `}</style>
    </div>
  );
}

// Card Skeleton
export function CardSkeleton() {
  return (
    <div className="card skeleton" style={{ height: 200 }}>
      <div className="skeleton title" style={{ marginBottom: 16 }} />
      <div className="skeleton text" />
      <div className="skeleton text" />
      <div className="skeleton text" style={{ width: '80%' }} />
    </div>
  );
}

// Plan Skeleton
export function PlanSkeleton() {
  return (
    <div style={{ marginTop: 18 }}>
      {/* Header Skeleton */}
      <div className="card">
        <div className="skeleton" style={{ width: 100, height: 20, marginBottom: 12 }} />
        <div className="skeleton title" style={{ width: 250, marginBottom: 8 }} />
        <div className="skeleton" style={{ width: 150, height: 16 }} />
      </div>

      {/* Conditions Skeleton */}
      <div className="card" style={{ marginTop: 20 }}>
        <div className="skeleton" style={{ width: 120, height: 20, marginBottom: 16 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16 }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="skeleton" style={{ height: 60, borderRadius: 8 }} />
          ))}
        </div>
      </div>

      {/* Pattern Skeleton */}
      <div className="card" style={{ marginTop: 20 }}>
        <div className="skeleton" style={{ width: 100, height: 24, borderRadius: 20, marginBottom: 16 }} />
        <div className="skeleton title" style={{ width: 200, marginBottom: 20 }} />
        
        {/* Lure image skeleton */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <div className="skeleton circle" style={{ width: 160, height: 160 }} />
        </div>
        
        <div className="skeleton text" style={{ marginTop: 16 }} />
        <div className="skeleton text" />
        <div className="skeleton text" style={{ width: '70%' }} />
      </div>
    </div>
  );
}

// Inline Spinner
export function Spinner({ size = 40 }: { size?: number }) {
  return (
    <div className="spinner" style={{ width: size, height: size }} />
  );
}

// Button Loading State
export function ButtonLoading({ children }: { children: React.ReactNode }) {
  return (
    <button className="btn primary" disabled style={{ position: 'relative' }}>
      <span style={{ opacity: 0.5 }}>{children}</span>
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      }}>
        <Spinner size={20} />
      </div>
    </button>
  );
}

// Empty State
export function EmptyState({ 
  title, 
  description, 
  action 
}: { 
  title: string; 
  description: string; 
  action?: React.ReactNode;
}) {
  return (
    <div style={{
      textAlign: 'center',
      padding: 80,
      maxWidth: 500,
      margin: '0 auto',
    }}>
      <div style={{
        width: 80,
        height: 80,
        margin: '0 auto 24px',
        borderRadius: '50%',
        background: 'var(--bg-card)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '2em',
        opacity: 0.5,
      }}>
        🎣
      </div>
      <h3 className="h3" style={{ marginBottom: 12 }}>{title}</h3>
      <p className="text-muted" style={{ marginBottom: 24 }}>{description}</p>
      {action}
    </div>
  );
}

// Error State
export function ErrorState({ 
  message, 
  onRetry 
}: { 
  message: string; 
  onRetry?: () => void;
}) {
  return (
    <div className="card" style={{
      background: 'rgba(255, 107, 107, 0.05)',
      border: '1px solid rgba(255, 107, 107, 0.2)',
      padding: 32,
      textAlign: 'center',
    }}>
      <div style={{
        fontSize: '3em',
        marginBottom: 16,
      }}>
        ⚠️
      </div>
      <h3 className="h3" style={{ marginBottom: 12 }}>Something went wrong</h3>
      <p className="text-muted" style={{ marginBottom: 24 }}>{message}</p>
      {onRetry && (
        <button className="btn secondary" onClick={onRetry}>
          Try Again
        </button>
      )}
    </div>
  );
}

// Success Toast
export function SuccessToast({ message }: { message: string }) {
  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      right: 24,
      background: 'var(--success)',
      color: 'white',
      padding: '16px 24px',
      borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-lg)',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      animation: 'slideInRight 0.3s ease',
      zIndex: 9999,
    }}>
      <span style={{ fontSize: '1.5em' }}>✓</span>
      <span style={{ fontWeight: 600 }}>{message}</span>
    </div>
  );
}

// Progress Bar
export function ProgressBar({ progress }: { progress: number }) {
  return (
    <div style={{
      width: '100%',
      height: 8,
      background: 'var(--bg-card)',
      borderRadius: 'var(--radius-full)',
      overflow: 'hidden',
    }}>
      <div style={{
        height: '100%',
        background: 'var(--gradient-primary)',
        width: `${progress}%`,
        transition: 'width 0.3s ease',
        borderRadius: 'var(--radius-full)',
      }} />
    </div>
  );
}
