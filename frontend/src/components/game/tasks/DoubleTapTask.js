import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { soundManager } from '../../../lib/sounds';

export const DoubleTapTask = ({ task, onSuccess, onFail }) => {
  const [tapCount, setTapCount] = useState(0);
  const [result, setResult] = useState(null);
  const firstTapRef = useRef(null);
  const timeoutRef = useRef(null);

  const minGap = task.config?.min_gap || 200;
  const maxGap = task.config?.max_gap || 600;

  const reset = useCallback(() => {
    setTapCount(0);
    setResult(null);
    firstTapRef.current = null;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  const handleTap = useCallback(() => {
    soundManager.playClick();

    if (tapCount === 0) {
      firstTapRef.current = Date.now();
      setTapCount(1);
      timeoutRef.current = setTimeout(() => {
        setResult('fail');
        soundManager.playFail();
        setTimeout(() => {
          onFail();
          reset();
        }, 500);
      }, maxGap + 300);
      return;
    }

    if (tapCount === 1) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      const gap = Date.now() - firstTapRef.current;
      if (gap >= minGap && gap <= maxGap) {
        setResult('success');
        soundManager.playSuccess();
        setTimeout(() => {
          onSuccess();
          reset();
        }, 800);
      } else {
        setResult('fail');
        soundManager.playFail();
        setTimeout(() => {
          onFail();
          reset();
        }, 500);
      }
    }
  }, [tapCount, minGap, maxGap, onSuccess, onFail, reset]);

  return (
    <div className="flex flex-col items-center justify-center gap-8 w-full" data-testid="double-tap-task">
      <p className="text-lg text-slate-600 text-center">{task.instruction}</p>
      <motion.button
        className="w-48 h-48 rounded-full touch-target flex items-center justify-center text-white font-bold text-xl"
        style={{
          backgroundColor: result === 'success' ? '#10B981' : result === 'fail' ? '#EF4444' : '#0F172A'
        }}
        onClick={handleTap}
        whileTap={{ scale: 0.95 }}
        data-testid="double-tap-button"
      >
        {tapCount === 0 ? 'TAP' : 'TAP AGAIN'}
      </motion.button>
      <p className="font-mono text-sm text-slate-400">
        {result === 'fail' ? (tapCount === 1 ? 'Too slow — tap again sooner!' : 'Gap must be 0.2–0.6s') : 'First tap, then second within the window'}
      </p>
    </div>
  );
};
