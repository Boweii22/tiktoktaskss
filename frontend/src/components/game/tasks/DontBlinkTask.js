import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { soundManager } from '../../../lib/sounds';

export const DontBlinkTask = ({ task, onSuccess, onFail }) => {
  const [scale, setScale] = useState(0.2);
  const [started, setStarted] = useState(false);
  const [result, setResult] = useState(null);
  const startRef = useRef(null);
  const rafRef = useRef(null);

  const growMs = task.config?.grow_ms ?? 4500;
  const windowMs = task.config?.window_ms ?? 120;
  const targetScale = 1;
  const okStart = (growMs - windowMs) / 2;
  const okEnd = okStart + windowMs;

  useEffect(() => {
    if (!started || !startRef.current) return;
    const animate = () => {
      const elapsed = Date.now() - startRef.current;
      if (elapsed >= growMs) {
        setScale(targetScale);
        cancelAnimationFrame(rafRef.current);
        return;
      }
      const t = elapsed / growMs;
      setScale(0.2 + t * (targetScale - 0.2));
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [started, growMs]);

  const handleTap = useCallback(() => {
    soundManager.playClick();
    if (!started) {
      setStarted(true);
      startRef.current = Date.now();
      return;
    }
    if (!startRef.current) return;
    const elapsed = Date.now() - startRef.current;
    if (elapsed >= okStart && elapsed <= okEnd) {
      setResult('success');
      soundManager.playSuccess();
      setTimeout(() => { onSuccess(); setResult(null); }, 800);
    } else {
      setResult('fail');
      soundManager.playFail();
      setTimeout(() => { onFail(); setResult(null); }, 500);
    }
  }, [started, okStart, okEnd, onSuccess, onFail]);

  return (
    <div className="flex flex-col items-center justify-center gap-8 w-full" data-testid="dont-blink-task">
      <p className="text-lg text-slate-600 text-center">{task.instruction}</p>
      <motion.div
        className="rounded-full touch-target cursor-pointer flex items-center justify-center bg-slate-900 text-white font-medium"
        style={{
          width: 80 + scale * 100,
          height: 80 + scale * 100,
          backgroundColor: result === 'success' ? '#10B981' : result === 'fail' ? '#EF4444' : '#0F172A'
        }}
        onClick={handleTap}
        data-testid="dont-blink-button"
      >
        {!started ? 'Start' : ''}
      </motion.div>
      <p className="font-mono text-sm text-slate-400">{!started ? 'Tap to start growth' : 'Tap when the size feels right'}</p>
    </div>
  );
};
