import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { soundManager } from '../../../lib/sounds';

export const SwipeSpeedTask = ({ task, onSuccess, onFail }) => {
  const [result, setResult] = useState(null);
  const startRef = useRef(null);

  const minSpeed = task.config?.min_speed ?? 45;
  const maxSpeed = task.config?.max_speed ?? 85;
  const minDistance = task.config?.min_distance ?? 120;

  const handleTouchStart = useCallback((e) => {
    startRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now() };
  }, []);

  const handleTouchEnd = useCallback((e) => {
    if (!startRef.current) return;
    const end = e.changedTouches[0];
    const dx = end.clientX - startRef.current.x;
    const dy = end.clientY - startRef.current.y;
    const dist = Math.hypot(dx, dy);
    const dt = (Date.now() - startRef.current.t) / 1000;
    if (dt < 0.01 || dist < minDistance) {
      setResult('fail');
      soundManager.playFail();
      setTimeout(() => { onFail(); setResult(null); }, 500);
      startRef.current = null;
      return;
    }
    const speed = dist / dt;
    if (speed >= minSpeed && speed <= maxSpeed) {
      setResult('success');
      soundManager.playSuccess();
      setTimeout(() => { onSuccess(); setResult(null); }, 800);
    } else {
      setResult('fail');
      soundManager.playFail();
      setTimeout(() => { onFail(); setResult(null); }, 500);
    }
    startRef.current = null;
  }, [minDistance, minSpeed, maxSpeed, onSuccess, onFail]);

  const handleMouseDown = useCallback((e) => {
    startRef.current = { x: e.clientX, y: e.clientY, t: Date.now() };
  }, []);

  const handleMouseUp = useCallback((e) => {
    if (!startRef.current) return;
    const dist = Math.hypot(e.clientX - startRef.current.x, e.clientY - startRef.current.y);
    const dt = (Date.now() - startRef.current.t) / 1000;
    if (dt < 0.01 || dist < minDistance) {
      setResult('fail');
      soundManager.playFail();
      setTimeout(() => { onFail(); setResult(null); }, 500);
      startRef.current = null;
      return;
    }
    const speed = dist / dt;
    if (speed >= minSpeed && speed <= maxSpeed) {
      setResult('success');
      soundManager.playSuccess();
      setTimeout(() => { onSuccess(); setResult(null); }, 800);
    } else {
      setResult('fail');
      soundManager.playFail();
      setTimeout(() => { onFail(); setResult(null); }, 500);
    }
    startRef.current = null;
  }, [minDistance, minSpeed, maxSpeed, onSuccess, onFail]);

  return (
    <div className="flex flex-col items-center justify-center gap-8 w-full" data-testid="swipe-speed-task">
      <p className="text-lg text-slate-600 text-center">{task.instruction}</p>
      <div
        className="w-48 h-64 rounded-2xl touch-none flex items-center justify-center select-none"
        style={{
          backgroundColor: result === 'success' ? '#10B981' : result === 'fail' ? '#EF4444' : '#0F172A'
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => { startRef.current = null; }}
        data-testid="swipe-speed-area"
      >
        <span className="text-white/80 text-sm">Swipe slow</span>
      </div>
      <p className="font-mono text-sm text-slate-400">Speed: {minSpeed}–{maxSpeed} px/s</p>
    </div>
  );
};
