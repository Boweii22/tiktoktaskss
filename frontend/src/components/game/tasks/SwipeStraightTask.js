import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { soundManager } from '../../../lib/sounds';

export const SwipeStraightTask = ({ task, onSuccess, onFail }) => {
  const [result, setResult] = useState(null);
  const startRef = useRef(null);

  const maxAngleDeg = task.config?.max_angle_deg ?? 10;
  const minDistance = task.config?.min_distance ?? 100;

  const getPos = (e) => {
    if (e.touches?.length) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    return { x: e.clientX, y: e.clientY };
  };

  const handleStart = useCallback((e) => {
    startRef.current = getPos(e);
  }, []);

  const handleEnd = useCallback((e) => {
    if (!startRef.current) return;
    const end = e.changedTouches ? e.changedTouches[0] : e;
    const endPos = { x: end.clientX, y: end.clientY };
    const dx = endPos.x - startRef.current.x;
    const dy = endPos.y - startRef.current.y;
    const dist = Math.hypot(dx, dy);
    if (dist < minDistance) {
      setResult('fail');
      soundManager.playFail();
      setTimeout(() => { onFail(); setResult(null); startRef.current = null; }, 500);
      return;
    }
    const angleRad = Math.atan2(Math.abs(dx), dy);
    const angleDeg = (angleRad * 180) / Math.PI;
    if (angleDeg <= maxAngleDeg) {
      setResult('success');
      soundManager.playSuccess();
      setTimeout(() => { onSuccess(); setResult(null); startRef.current = null; }, 800);
    } else {
      setResult('fail');
      soundManager.playFail();
      setTimeout(() => { onFail(); setResult(null); startRef.current = null; }, 500);
    }
  }, [minDistance, maxAngleDeg, onSuccess, onFail]);

  const handleMouseUp = useCallback((e) => {
    if (!startRef.current) return;
    const endPos = { x: e.clientX, y: e.clientY };
    const dx = endPos.x - startRef.current.x;
    const dy = endPos.y - startRef.current.y;
    const dist = Math.hypot(dx, dy);
    if (dist < minDistance) {
      setResult('fail');
      soundManager.playFail();
      setTimeout(() => { onFail(); setResult(null); startRef.current = null; }, 500);
      return;
    }
    const angleRad = Math.atan2(Math.abs(dx), dy);
    const angleDeg = (angleRad * 180) / Math.PI;
    if (angleDeg <= maxAngleDeg) {
      setResult('success');
      soundManager.playSuccess();
      setTimeout(() => { onSuccess(); setResult(null); startRef.current = null; }, 800);
    } else {
      setResult('fail');
      soundManager.playFail();
      setTimeout(() => { onFail(); setResult(null); startRef.current = null; }, 500);
    }
  }, [minDistance, maxAngleDeg, onSuccess, onFail]);

  return (
    <div
      className="flex flex-col items-center justify-center gap-8 w-full h-full touch-none select-none"
      onTouchStart={handleStart}
      onTouchEnd={handleEnd}
      onMouseDown={handleStart}
      onMouseUp={handleMouseUp}
      data-testid="swipe-straight-task"
    >
      <p className="text-lg text-slate-600 text-center">{task.instruction}</p>
      <div
        className="w-full flex-1 flex items-end justify-center pb-8"
        style={{ backgroundColor: result === 'success' ? 'rgba(16,185,129,0.2)' : result === 'fail' ? 'rgba(239,68,68,0.2)' : 'transparent' }}
      >
        <span className="font-mono text-slate-400 text-sm">Swipe straight up from here</span>
      </div>
      <p className="font-mono text-sm text-slate-400">Within ±{maxAngleDeg}° of vertical, min distance {minDistance}px</p>
    </div>
  );
};
