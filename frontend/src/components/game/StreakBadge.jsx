import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import './StreakBadge.css';

export function StreakBadge({ currentStreak = 0, longestStreak = 0, justIncreased, justReset }) {
  const [showBump, setShowBump] = useState(false);
  const [showReset, setShowReset] = useState(false);

  useEffect(() => {
    if (justIncreased) {
      setShowBump(true);
      const t = setTimeout(() => setShowBump(false), 600);
      return () => clearTimeout(t);
    }
  }, [justIncreased]);

  useEffect(() => {
    if (justReset) {
      setShowReset(true);
      const t = setTimeout(() => setShowReset(false), 800);
      return () => clearTimeout(t);
    }
  }, [justReset]);

  return (
    <motion.div
      className={`streak-badge ${currentStreak > 0 ? 'streak-badge--active' : 'streak-badge--zero'} ${showBump ? 'streak-badge--bump' : ''} ${showReset ? 'streak-badge--reset' : ''}`}
      initial={false}
      animate={showBump ? { scale: [1, 1.35, 1], transition: { duration: 0.4 } } : {}}
      data-testid="streak-badge"
    >
      <span className="streak-badge__flame" aria-hidden>🔥</span>
      <span className="streak-badge__count">{currentStreak}</span>
      {longestStreak > 0 && longestStreak !== currentStreak && (
        <span className="streak-badge__best">Best {longestStreak}</span>
      )}
    </motion.div>
  );
}
