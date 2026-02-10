import React from 'react';
import { ChevronUp } from 'lucide-react';
import { motion } from 'framer-motion';

export const SwipeHint = ({ show = true, currentIndex, totalTasks }) => {
  if (!show) return null;
  
  return (
    <div className="swipe-hint flex flex-col items-center gap-1" data-testid="swipe-hint">
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <ChevronUp size={20} className="text-slate-400" />
      </motion.div>
      <span className="text-xs font-mono text-slate-400">
        {currentIndex + 1} / {totalTasks}
      </span>
    </div>
  );
};
