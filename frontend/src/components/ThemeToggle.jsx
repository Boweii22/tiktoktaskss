import React, { useRef, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import './ThemeToggle.css';

const ORB_SIZE = 52;
const PORTAL_DURATION = 1.1;

export function ThemeToggle() {
  const { theme, toggleTheme, isTransitioning, transitionTarget, endTransition } = useTheme();
  const buttonRef = useRef(null);
  const [portalOrigin, setPortalOrigin] = useState({ x: '50%', y: '50%' });
  const [isPressed, setIsPressed] = useState(false);

  const handleClick = useCallback(() => {
    const el = buttonRef.current;
    if (el) {
      const rect = el.getBoundingClientRect();
      setPortalOrigin({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      });
    }
    toggleTheme();
  }, [toggleTheme]);

  useEffect(() => {
    if (!isTransitioning || !transitionTarget) return;
    const t = setTimeout(endTransition, PORTAL_DURATION * 1000);
    return () => clearTimeout(t);
  }, [isTransitioning, transitionTarget, endTransition]);

  const isDark = theme === 'dark';
  const nextIsDark = transitionTarget === 'dark';

  return (
    <>
      <motion.button
        ref={buttonRef}
        type="button"
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        className="theme-orb"
        onClick={handleClick}
        onPointerDown={() => setIsPressed(true)}
        onPointerUp={() => setIsPressed(false)}
        onPointerLeave={() => setIsPressed(false)}
        initial={false}
        animate={{
          scale: isPressed ? 0.88 : 1,
          rotate: isTransitioning ? (nextIsDark ? 180 : -180) : 0
        }}
        transition={{
          scale: { type: 'spring', stiffness: 400, damping: 20 },
          rotate: { duration: PORTAL_DURATION * 0.6, ease: [0.32, 0.72, 0, 1] }
        }}
        style={{
          '--orb-size': `${ORB_SIZE}px`
        }}
        data-testid="theme-toggle"
      >
        <motion.div
          className="theme-orb__inner"
          animate={{
            opacity: isTransitioning ? 0.6 : 1,
            scale: isTransitioning ? 1.15 : 1
          }}
          transition={{ duration: 0.25 }}
        >
          {/* Sun: circle + rays */}
          <svg
            className="theme-orb__icon theme-orb__icon--sun"
            viewBox="0 0 64 64"
            fill="none"
            style={{ opacity: isDark ? 0 : 1 }}
          >
            <circle cx="32" cy="32" r="14" fill="currentColor" />
            <g stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
                const rad = (deg * Math.PI) / 180;
                const x1 = 32 + 18 * Math.cos(rad);
                const y1 = 32 + 18 * Math.sin(rad);
                const x2 = 32 + 26 * Math.cos(rad);
                const y2 = 32 + 26 * Math.sin(rad);
                return <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} />;
              })}
            </g>
          </svg>
          {/* Moon: full circle (clean night icon) */}
          <svg
            className="theme-orb__icon theme-orb__icon--moon"
            viewBox="0 0 64 64"
            fill="none"
            style={{ opacity: isDark ? 1 : 0 }}
          >
            <circle cx="32" cy="32" r="18" fill="currentColor" />
          </svg>
        </motion.div>
        <div className="theme-orb__glow" aria-hidden />
      </motion.button>

      <AnimatePresence>
        {isTransitioning && transitionTarget && (
          <motion.div
            className="theme-portal"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              '--portal-x': `${portalOrigin.x}px`,
              '--portal-y': `${portalOrigin.y}px`
            }}
            data-theme-reveal={transitionTarget}
          >
            <motion.div
              className="theme-portal__circle"
              initial={{ scale: 0, opacity: 1 }}
              animate={{
                scale: 1,
                opacity: 1
              }}
              transition={{
                duration: PORTAL_DURATION,
                ease: [0.33, 1, 0.68, 1]
              }}
              onAnimationComplete={() => {}}
            />
            <motion.div
              className="theme-portal__stars"
              initial={{ opacity: 0 }}
              animate={{ opacity: transitionTarget === 'dark' ? 1 : 0 }}
              transition={{ delay: 0.25, duration: 0.4 }}
            >
              {[...Array(24)].map((_, i) => (
                <span
                  key={i}
                  className="theme-portal__star"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 0.5}s`
                  }}
                />
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
