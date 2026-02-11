import React, { useRef, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import './ThemeToggle.css';

const ORB_SIZE = 52;
const PORTAL_DURATION = 1.0;

// Fixed star positions for a natural constellation feel
const STAR_POSITIONS = [
  [12, 18], [87, 14], [34, 72], [68, 88], [8, 45], [92, 52], [22, 32], [76, 38],
  [45, 22], [55, 78], [18, 58], [82, 68], [5, 28], [95, 42], [28, 8], [72, 92],
  [42, 48], [58, 12], [15, 82], [85, 24], [38, 58], [62, 35], [25, 45], [75, 65]
];

export function ThemeToggle() {
  const { theme, toggleTheme, isTransitioning, transitionTarget, endTransition } = useTheme();
  const buttonRef = useRef(null);
  const [portalOrigin, setPortalOrigin] = useState({ x: '50%', y: '50%' });
  const [isPressed, setIsPressed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showRipple, setShowRipple] = useState(false);

  const handleClick = useCallback(() => {
    setShowRipple(true);
    setTimeout(() => setShowRipple(false), 650);
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
  const showDarkIcon = isTransitioning ? nextIsDark : isDark;

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
        onPointerLeave={() => { setIsPressed(false); setIsHovered(false); }}
        onPointerEnter={() => setIsHovered(true)}
        initial={false}
        animate={{
          scale: isPressed ? 0.88 : isHovered ? 1.08 : 1,
          rotate: isTransitioning ? (nextIsDark ? 180 : -180) : 0
        }}
        transition={{
          scale: { type: 'spring', stiffness: 500, damping: 25 },
          rotate: { duration: PORTAL_DURATION * 0.55, ease: [0.22, 1, 0.36, 1] }
        }}
        style={{ '--orb-size': `${ORB_SIZE}px` }}
        data-testid="theme-toggle"
      >
        <AnimatePresence>
          {showRipple && (
            <motion.span
              className="theme-orb__ripple"
              aria-hidden
              initial={{ opacity: 0.8, scale: 0.9 }}
              animate={{ opacity: 0, scale: 2.2 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            />
          )}
        </AnimatePresence>
        <motion.div
          className="theme-orb__inner"
          animate={{
            opacity: isTransitioning ? 0.7 : 1,
            scale: isTransitioning ? 1.2 : 1
          }}
          transition={{ duration: 0.2 }}
        >
          <AnimatePresence mode="wait">
            {!showDarkIcon ? (
              <motion.div
                key="sun"
                className="theme-orb__icon-wrap"
                initial={{ opacity: 0, scale: 0.6, rotate: -30 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.7, rotate: 30 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              >
                <svg className="theme-orb__icon theme-orb__icon--sun" viewBox="0 0 64 64" fill="none">
                  <circle cx="32" cy="32" r="12" fill="currentColor" />
                  <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
                      const rad = (deg * Math.PI) / 180;
                      const x1 = 32 + 16 * Math.cos(rad);
                      const y1 = 32 + 16 * Math.sin(rad);
                      const x2 = 32 + 24 * Math.cos(rad);
                      const y2 = 32 + 24 * Math.sin(rad);
                      return <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} />;
                    })}
                  </g>
                </svg>
              </motion.div>
            ) : (
              <motion.div
                key="moon"
                className="theme-orb__icon-wrap"
                initial={{ opacity: 0, scale: 0.6, rotate: 30 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.7, rotate: -30 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              >
                <svg className="theme-orb__icon theme-orb__icon--moon" viewBox="0 0 64 64" fill="none">
                  {/* Crescent: main circle + offset cutout (evenodd) */}
                  <path
                    d="M32 12 A20 20 0 1 1 32 52 A20 20 0 1 1 32 12 Z M40 28 A16 16 0 1 0 40 60 A16 16 0 1 0 40 28 Z"
                    fill="currentColor"
                    fillRule="evenodd"
                  />
                </svg>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
        <div className="theme-orb__glow" aria-hidden />
        <div className="theme-orb__shine" aria-hidden />
      </motion.button>

      <AnimatePresence>
        {isTransitioning && transitionTarget && (
          <motion.div
            className="theme-portal"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{
              '--portal-x': `${portalOrigin.x}px`,
              '--portal-y': `${portalOrigin.y}px`
            }}
            data-theme-reveal={transitionTarget}
          >
            <motion.div
              className="theme-portal__circle"
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                duration: PORTAL_DURATION,
                ease: [0.25, 0.46, 0.45, 0.94]
              }}
            />
            <motion.div
              className="theme-portal__ring"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                duration: PORTAL_DURATION * 0.8,
                ease: [0.22, 1, 0.36, 1],
                delay: 0.05
              }}
            />
            <motion.div
              className="theme-portal__stars"
              initial={{ opacity: 0 }}
              animate={{ opacity: transitionTarget === 'dark' ? 1 : 0 }}
              transition={{ delay: 0.35, duration: 0.5 }}
            >
              {STAR_POSITIONS.map(([left, top], i) => (
                <motion.span
                  key={i}
                  className="theme-portal__star"
                  style={{
                    left: `${left}%`,
                    top: `${top}%`
                  }}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{
                    opacity: transitionTarget === 'dark' ? 0.9 : 0,
                    scale: transitionTarget === 'dark' ? 1 : 0
                  }}
                  transition={{
                    delay: 0.4 + i * 0.03,
                    duration: 0.35,
                    ease: [0.22, 1, 0.36, 1]
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
