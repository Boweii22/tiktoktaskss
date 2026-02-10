import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { soundManager } from '../../../lib/sounds';

export const VibrationEndTask = ({ task, onSuccess, onFail }) => {
  const [holding, setHolding] = useState(false);
  const [result, setResult] = useState(null);
  const startTimeRef = useRef(null);
  const endWindowStartRef = useRef(0);
  const endWindowEndRef = useRef(0);
  const timeoutRef = useRef(null);

  const durationMs = task.config?.duration_ms ?? 6000;
  const windowMs = task.config?.window_ms ?? 400;

  useEffect(() => () => {
    clearTimeout(timeoutRef.current);
    if (navigator.vibrate) navigator.vibrate(0);
  }, []);

  const handleStart = useCallback(() => {
    soundManager.playClick();
    setHolding(true);
    setResult(null);
    startTimeRef.current = Date.now();
    endWindowStartRef.current = durationMs - 100;
    endWindowEndRef.current = durationMs + windowMs;
    if (navigator.vibrate) {
      navigator.vibrate([80, 400, 80, 500, 80, 600, 80, durationMs - 2500, 0]);
    }
    timeoutRef.current = setTimeout(() => {
      if (navigator.vibrate) navigator.vibrate(0);
    }, durationMs + 300);
  }, [durationMs, windowMs]);

  const handleEnd = useCallback(() => {
    if (!holding) return;
    clearTimeout(timeoutRef.current);
    if (navigator.vibrate) navigator.vibrate(0);
    const elapsed = Date.now() - startTimeRef.current;
    setHolding(false);
    if (elapsed >= endWindowStartRef.current && elapsed <= endWindowEndRef.current) {
      setResult('success');
      soundManager.playSuccess();
      setTimeout(() => { onSuccess(); setResult(null); }, 800);
    } else {
      setResult('fail');
      soundManager.playFail();
      setTimeout(() => { onFail(); setResult(null); }, 500);
    }
  }, [holding, onSuccess, onFail]);

  return (
    <div className="flex flex-col items-center justify-center gap-8 w-full" data-testid="vibration-end-task">
      <p className="text-lg text-slate-600 text-center">{task.instruction}</p>
      <motion.button
        className="w-52 h-52 rounded-full touch-target font-bold text-xl select-none text-white"
        style={{
          backgroundColor: result === 'success' ? '#10B981' : result === 'fail' ? '#EF4444' : holding ? '#F59E0B' : '#0F172A'
        }}
        onTouchStart={handleStart}
        onTouchEnd={(e) => { e.preventDefault(); handleEnd(); }}
        onMouseDown={handleStart}
        onMouseUp={handleEnd}
        onMouseLeave={() => holding && handleEnd()}
        data-testid="vibration-button"
      >
        {!holding ? 'Hold' : 'Release when it stops'}
      </motion.button>
      <p className="font-mono text-sm text-slate-400">It may fake stop. Release only when it really ends.</p>
    </div>
  );
};
