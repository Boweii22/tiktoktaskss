import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { soundManager } from '../../../lib/sounds';

export const TapNothingTask = ({ task, onSuccess, onFail }) => {
  const [started, setStarted] = useState(false);
  const [result, setResult] = useState(null);
  const startTimeRef = useRef(null);

  const triggerAfterMs = task.config?.trigger_after_ms ?? 5200;
  const windowMs = task.config?.window_ms ?? 280;

  const handleTap = useCallback(() => {
    if (!started) {
      soundManager.playClick();
      setStarted(true);
      startTimeRef.current = Date.now();
      return;
    }
    soundManager.playClick();
    const elapsed = Date.now() - startTimeRef.current;
    if (elapsed >= triggerAfterMs && elapsed <= triggerAfterMs + windowMs) {
      setResult('success');
      soundManager.playSuccess();
      setTimeout(() => { onSuccess(); setStarted(false); setResult(null); }, 800);
    } else {
      setResult('fail');
      soundManager.playFail();
      setTimeout(() => { onFail(); setStarted(false); setResult(null); }, 500);
    }
  }, [started, triggerAfterMs, windowMs, onSuccess, onFail]);

  return (
    <div className="flex flex-col items-center justify-center gap-8 w-full" data-testid="tap-nothing-task">
      <p className="text-lg text-slate-600 text-center">{task.instruction}</p>
      <motion.div
        className="w-56 h-56 rounded-2xl touch-target cursor-pointer flex items-center justify-center bg-slate-100 border-2 border-slate-200"
        style={{
          borderColor: result === 'success' ? '#10B981' : result === 'fail' ? '#EF4444' : '#E2E8F0'
        }}
        onClick={handleTap}
        data-testid="tap-nothing-area"
      >
        {!started ? 'Start' : result ? (result === 'success' ? 'Yes' : 'No') : '…'}
      </motion.div>
      <p className="font-mono text-sm text-slate-400">Nothing will change. Tap at the right moment anyway.</p>
    </div>
  );
};
