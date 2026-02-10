import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { soundManager } from '../../../lib/sounds';

export const WaitLongerTask = ({ task, onSuccess, onFail }) => {
  const [started, setStarted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState(null);
  const startTimeRef = useRef(null);
  const intervalRef = useRef(null);

  const correctAfterMs = task.config?.correct_after_ms ?? 5500;
  const windowMs = task.config?.window_ms ?? 400;

  const handleStart = useCallback(() => {
    soundManager.playClick();
    setStarted(true);
    setResult(null);
    setElapsed(0);
    startTimeRef.current = Date.now();
    intervalRef.current = setInterval(() => setElapsed(Date.now() - startTimeRef.current), 50);
  }, []);

  const handleTap = useCallback(() => {
    if (!started) return;
    soundManager.playClick();
    const el = Date.now() - startTimeRef.current;
    clearInterval(intervalRef.current);
    if (el >= correctAfterMs && el <= correctAfterMs + windowMs) {
      setResult('success');
      soundManager.playSuccess();
      setTimeout(() => { onSuccess(); setStarted(false); setResult(null); }, 800);
    } else {
      setResult('fail');
      soundManager.playFail();
      setTimeout(() => { onFail(); setStarted(false); setResult(null); }, 500);
    }
  }, [started, correctAfterMs, windowMs, onSuccess, onFail]);

  useEffect(() => () => clearInterval(intervalRef.current), []);

  return (
    <div className="flex flex-col items-center justify-center gap-8 w-full" data-testid="wait-longer-task">
      <p className="text-lg text-slate-600 text-center">{task.instruction}</p>
      {!started ? (
        <motion.button className="w-44 h-44 rounded-full bg-slate-900 text-white font-bold touch-target" onClick={handleStart}>Start</motion.button>
      ) : (
        <motion.button
          className="w-44 h-44 rounded-full touch-target font-bold text-white"
          style={{ backgroundColor: result === 'success' ? '#10B981' : result === 'fail' ? '#EF4444' : '#0F172A' }}
          onClick={handleTap}
        >
          {(elapsed / 1000).toFixed(1)}s — Tap?
        </motion.button>
      )}
      <p className="font-mono text-sm text-slate-400">Window opens after {correctAfterMs / 1000}s. Too soon or too late fails.</p>
    </div>
  );
};
