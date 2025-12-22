// src/components/Navigation.tsx
// Mobile-first navigation with hamburger menu

import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const links = [
    { to: '/', label: 'Home' },
    { to: '/what-your-plan-includes', label: 'What You Get' },
    { to: '/how-to-use', label: 'How to Use' },
    { to: '/faq', label: 'FAQ' },
    { to: '/preview', label: 'Get a Plan' },
    { to: '/subscribe', label: 'Subscribe' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* Header */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        background: 'rgba(10, 10, 10, 0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      }}>
        <div className="container" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
        }}>
          {/* Logo */}
          <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{ fontWeight: 600, fontSize: '1.1em' }}>
              Bass Fishing Plans
            </div>
          </Link>

          {/* Desktop Nav - hidden on mobile */}
          <nav style={{
            display: 'none',
            gap: 24,
            alignItems: 'center',
          }}
          className="desktop-nav">
            {links.slice(1, -1).map((link) => (
              <Link
                key={link.to}
                to={link.to}
                style={{
                  textDecoration: 'none',
                  color: isActive(link.to) ? '#fff' : 'rgba(255, 255, 255, 0.7)',
                  fontSize: '0.95em',
                  fontWeight: isActive(link.to) ? 600 : 400,
                }}
              >
                {link.label}
              </Link>
            ))}
            <Link to="/subscribe" className="btn primary" style={{ padding: '8px 20px' }}>
              Subscribe
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="mobile-menu-btn"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'inherit',
              cursor: 'pointer',
              padding: 8,
            }}
            aria-label="Toggle menu"
          >
            {isOpen ? (
              // Close icon
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            ) : (
              // Hamburger icon
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12h18M3 6h18M3 18h18" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 57, // Below header
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(10, 10, 10, 0.98)',
            backdropFilter: 'blur(10px)',
            zIndex: 999,
            padding: '20px',
            overflowY: 'auto',
          }}
          onClick={() => setIsOpen(false)}
        >
          <nav style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}>
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setIsOpen(false)}
                style={{
                  textDecoration: 'none',
                  color: isActive(link.to) ? '#fff' : 'rgba(255, 255, 255, 0.8)',
                  fontSize: '1.1em',
                  fontWeight: isActive(link.to) ? 600 : 400,
                  padding: '16px 12px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}

      {/* CSS for desktop nav */}
      <style>{`
        @media (min-width: 768px) {
          .mobile-menu-btn {
            display: none !important;
          }
          .desktop-nav {
            display: flex !important;
          }
        }
      `}</style>
    </>
  );
}
