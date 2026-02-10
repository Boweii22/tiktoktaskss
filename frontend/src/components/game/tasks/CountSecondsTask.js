import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { soundManager } from '../../../lib/sounds';

export const CountSecondsTask = ({ task, onSuccess, onFail }) => {
  const [started, setStarted] = useState(false);
  const [result, setResult] = useState(null);
  const startTimeRef = useRef(null);

  const targetSeconds = task.config?.target_seconds || 7;
  const toleranceMs = task.config?.tolerance_ms || 800;

  const handleStart = useCallback(() => {
    soundManager.playClick();
    setStarted(true);
    setResult(null);
    startTimeRef.current = Date.now();
  }, []);

  const handleTap = useCallback(() => {
    if (!started) return;
    const elapsed = Date.now() - startTimeRef.current;
    const targetMs = targetSeconds * 1000;
    const diff = Math.abs(elapsed - targetMs);
    if (diff <= toleranceMs) {
      setResult('success');
      soundManager.playSuccess();
      setTimeout(() => {
        onSuccess();
        setStarted(false);
        setResult(null);
      }, 800);
    } else {
      setResult('fail');
      soundManager.playFail();
      setTimeout(() => {
        onFail();
        setStarted(false);
        setResult(null);
      }, 500);
    }
  }, [started, targetSeconds, toleranceMs, onSuccess, onFail]);

  return (
    <div className="flex flex-col items-center justify-center gap-8 w-full" data-testid="count-seconds-task">
      <p className="text-lg text-slate-600 text-center">{task.instruction}</p>
      {!started ? (
        <motion.button
          className="w-48 h-48 rounded-full bg-slate-900 text-white font-bold text-xl touch-target"
          onClick={handleStart}
          whileTap={{ scale: 0.95 }}
          data-testid="count-start-button"
        >
          Start & count to {targetSeconds}
        </motion.button>
      ) : (
        <motion.button
          className="w-48 h-48 rounded-full touch-target flex items-center justify-center text-white font-bold text-xl"
          style={{
            backgroundColor: result === 'success' ? '#10B981' : result === 'fail' ? '#EF4444' : '#0F172A'
          }}
          onClick={handleTap}
          whileTap={{ scale: 0.95 }}
          data-testid="count-tap-button"
        >
          {result ? (result === 'success' ? 'Perfect!' : 'Nope') : 'TAP at ' + targetSeconds}
        </motion.button>
      )}
      <p className="font-mono text-sm text-slate-400">
        {!started ? 'No timer. Count in your head.' : result === 'fail' ? `Window: ${targetSeconds}s ± ${toleranceMs / 1000}s` : 'Tap when you think it\'s time'}
      </p>
    </div>
  );
};
