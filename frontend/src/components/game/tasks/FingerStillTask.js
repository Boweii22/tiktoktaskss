import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { soundManager } from '../../../lib/sounds';

export const FingerStillTask = ({ task, onSuccess, onFail }) => {
  const [timeHeld, setTimeHeld] = useState(0);
  const [result, setResult] = useState(null);
  const [started, setStarted] = useState(false);
  const startPosRef = useRef(null);
  const intervalRef = useRef(null);

  const duration = task.config?.duration ?? 3000;
  const maxMovePx = task.config?.max_move_px ?? 6;

  const getPos = (e) => {
    if (e.touches?.length) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    return { x: e.clientX, y: e.clientY };
  };

  const handleStart = useCallback((e) => {
    if (started) return;
    soundManager.playClick();
    const pos = getPos(e);
    startPosRef.current = { ...pos, t: Date.now() };
    setStarted(true);
    setTimeHeld(0);
    intervalRef.current = setInterval(() => {
      setTimeHeld(t => {
        if (t + 100 >= duration) {
          clearInterval(intervalRef.current);
          setResult('success');
          soundManager.playSuccess();
          setTimeout(() => { onSuccess(); setStarted(false); setResult(null); }, 800);
          return duration;
        }
        return t + 100;
      });
    }, 100);
  }, [started, duration, onSuccess]);

  const handleMove = useCallback((e) => {
    if (!started || result) return;
    const pos = getPos(e);
    const start = startPosRef.current;
    if (!start) return;
    const dist = Math.hypot(pos.x - start.x, pos.y - start.y);
    if (dist > maxMovePx) {
      clearInterval(intervalRef.current);
      setResult('fail');
      soundManager.playFail();
      setTimeout(() => { onFail(); setStarted(false); setResult(null); }, 500);
    }
  }, [started, result, maxMovePx, onFail]);

  const handleEnd = useCallback(() => {
    if (started && !result) {
      clearInterval(intervalRef.current);
      setResult('fail');
      soundManager.playFail();
      setTimeout(() => { onFail(); setStarted(false); setResult(null); }, 500);
    }
  }, [started, result, onFail]);

  return (
    <div className="flex flex-col items-center justify-center gap-8 w-full" data-testid="finger-still-task">
      <p className="text-lg text-slate-600 text-center">{task.instruction}</p>
      <motion.div
        className="w-52 h-52 rounded-full touch-none select-none flex items-center justify-center"
        style={{
          backgroundColor: result === 'success' ? '#10B981' : result === 'fail' ? '#EF4444' : '#0F172A'
        }}
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
        onMouseDown={handleStart}
        onMouseMove={handleMove}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        data-testid="finger-still-area"
      >
        <span className="text-white font-mono text-lg">{(timeHeld / 1000).toFixed(1)}s</span>
      </motion.div>
      <p className="font-mono text-sm text-slate-400">Don't move. Any jitter fails.</p>
    </div>
  );
};
