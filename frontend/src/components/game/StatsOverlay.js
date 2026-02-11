import React from 'react';
import { motion } from 'framer-motion';

export const StatsOverlay = ({ task, localAttempts = 0 }) => {
  const stats = task?.stats || {};
  const completionRate = stats.completion_rate ?? 0;
  const globalAttempts = stats.attempts ?? 0;

  return (
    <div className="stats-overlay" data-testid="stats-overlay">
      <motion.div
        className="stats-overlay__card"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, ease: [0.33, 1, 0.68, 1] }}
      >
        <div className="stats-overlay__row">
          <span className="stats-overlay__label">Pass rate</span>
          <span className="stats-overlay__value stats-overlay__value--success">
            {completionRate.toFixed(1)}%
          </span>
        </div>
        <div className="stats-overlay__row">
          <span className="stats-overlay__label">Your tries</span>
          <span className="stats-overlay__value">{localAttempts}</span>
        </div>
        <div className="stats-overlay__global">
          {globalAttempts.toLocaleString()} global attempts
        </div>
      </motion.div>
    </div>
  );
};
