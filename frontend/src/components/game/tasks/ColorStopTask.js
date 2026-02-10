import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { soundManager } from '../../../lib/sounds';

export const ColorStopTask = ({ task, onSuccess, onFail }) => {
  const [hue, setHue] = useState(0);
  const [result, setResult] = useState(null);
  const startRef = useRef(Date.now());
  const rafRef = useRef(null);

  const cycleMs = task.config?.cycle_ms ?? 5000;
  const windowMs = task.config?.window_ms ?? 70;
  const staticPhase = 0.5;
  const windowPhase = windowMs / cycleMs;

  useEffect(() => {
    const animate = () => {
      const elapsed = (Date.now() - startRef.current) % cycleMs;
      const phase = elapsed / cycleMs;
      setHue((phase * 360) % 360);
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [cycleMs]);

  const handleTap = useCallback(() => {
    soundManager.playClick();
    const elapsed = (Date.now() - startRef.current) % cycleMs;
    const phase = elapsed / cycleMs;
    const dist = Math.abs(phase - staticPhase);
    const inWindow = dist < windowPhase / 2 || dist > 1 - windowPhase / 2;
    if (inWindow) {
      setResult('success');
      soundManager.playSuccess();
      setTimeout(() => { onSuccess(); setResult(null); }, 800);
    } else {
      setResult('fail');
      soundManager.playFail();
      setTimeout(() => { onFail(); setResult(null); }, 500);
    }
  }, [cycleMs, windowPhase, staticPhase, onSuccess, onFail]);

  return (
    <div className="flex flex-col items-center justify-center gap-8 w-full" data-testid="color-stop-task">
      <p className="text-lg text-slate-600 text-center">{task.instruction}</p>
      <motion.div
        className="w-56 h-56 rounded-3xl touch-target cursor-pointer"
        style={{
          backgroundColor: result === 'success' ? '#10B981' : result === 'fail' ? '#EF4444' : `hsl(${hue}, 70%, 45%)`
        }}
        onClick={handleTap}
        data-testid="color-stop-area"
      />
      <p className="font-mono text-sm text-slate-400">Tap when the color seems to stop changing</p>
    </div>
  );
};
