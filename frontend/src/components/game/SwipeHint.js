import React from 'react';
import { ChevronUp } from 'lucide-react';
import { motion } from 'framer-motion';

export const SwipeHint = ({ show = true, currentIndex, totalTasks }) => {
  if (!show) return null;
  
  return (
    <motion.div
      className="swipe-hint"
      data-testid="swipe-hint"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      <motion.div
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: [0.33, 1, 0.68, 1] }}
      >
        <ChevronUp size={22} style={{ color: 'var(--fg-muted)' }} strokeWidth={2.5} />
      </motion.div>
      <span className="swipe-hint__text" style={{ color: 'var(--fg-muted)' }}>
        {currentIndex + 1} / {totalTasks}
      </span>
    </motion.div>
  );
};
