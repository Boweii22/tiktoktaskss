import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { soundManager } from '../../../lib/sounds';

export const TapOnceTask = ({ task, onSuccess, onFail }) => {
  const [started, setStarted] = useState(false);
  const [result, setResult] = useState(null);
  const startTimeRef = useRef(null);
  const windowStartRef = useRef(0);
  const windowEndRef = useRef(0);

  const minWait = task.config?.min_wait ?? 4000;
  const maxWait = task.config?.max_wait ?? 9000;
  const windowMs = task.config?.window_ms ?? 350;

  const handleTapFixed = useCallback(() => {
    if (!started) {
      soundManager.playClick();
      setStarted(true);
      setResult(null);
      startTimeRef.current = Date.now();
      const triggerAt = Math.floor(Math.random() * (maxWait - minWait)) + minWait;
      windowStartRef.current = triggerAt;
      windowEndRef.current = triggerAt + windowMs;
      return;
    }
    soundManager.playClick();
    const elapsed = Date.now() - startTimeRef.current;
    if (elapsed >= windowStartRef.current && elapsed <= windowEndRef.current) {
      setResult('success');
      soundManager.playSuccess();
      setTimeout(() => { onSuccess(); setStarted(false); setResult(null); }, 800);
    } else {
      setResult('fail');
      soundManager.playFail();
      setTimeout(() => { onFail(); setStarted(false); setResult(null); }, 500);
    }
  }, [started, minWait, maxWait, windowMs, onSuccess, onFail]);

  return (
    <div className="flex flex-col items-center justify-center gap-8 w-full" data-testid="tap-once-task">
      <p className="text-lg text-slate-600 text-center">{task.instruction}</p>
      <motion.div
        className="w-52 h-52 rounded-full touch-target cursor-pointer flex items-center justify-center"
        style={{
          backgroundColor: result === 'success' ? '#10B981' : result === 'fail' ? '#EF4444' : '#0F172A'
        }}
        onClick={handleTapFixed}
        data-testid="tap-once-area"
      >
        {!started ? 'Start' : result ? (result === 'success' ? 'Yes' : 'No') : '…'}
      </motion.div>
      <p className="font-mono text-sm text-slate-400">{started && !result ? 'One tap. No cue.' : 'Tap once at the right moment'}</p>
    </div>
  );
};
