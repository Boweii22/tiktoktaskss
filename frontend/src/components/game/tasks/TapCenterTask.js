import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { soundManager } from '../../../lib/sounds';

export const TapCenterTask = ({ task, onSuccess, onFail }) => {
  const [result, setResult] = useState(null);
  const boxRef = useRef(null);

  const tolerancePx = task.config?.tolerance_px ?? 10;

  const handleTap = useCallback((e) => {
    soundManager.playClick();
    const box = boxRef.current;
    if (!box) return;
    const rect = box.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const clientX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
    const clientY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
    const dist = Math.hypot(clientX - centerX, clientY - centerY);
    if (dist <= tolerancePx) {
      setResult('success');
      soundManager.playSuccess();
      setTimeout(() => { onSuccess(); setResult(null); }, 800);
    } else {
      setResult('fail');
      soundManager.playFail();
      setTimeout(() => { onFail(); setResult(null); }, 500);
    }
  }, [tolerancePx, onSuccess, onFail]);

  return (
    <div className="flex flex-col items-center justify-center gap-8 w-full" data-testid="tap-center-task">
      <p className="text-lg text-slate-600 text-center">{task.instruction}</p>
      <div
        ref={boxRef}
        className="relative w-48 h-48 rounded-full bg-slate-200 touch-target cursor-pointer flex items-center justify-center"
        onClick={handleTap}
        onTouchEnd={(e) => { if (e.changedTouches?.length) handleTap(e); }}
        data-testid="tap-center-area"
      >
        <div className="w-4 h-4 rounded-full bg-slate-700" />
        <div
          className="absolute inset-0 rounded-full border-2 border-transparent"
          style={{ borderColor: result === 'success' ? '#10B981' : result === 'fail' ? '#EF4444' : 'transparent' }}
        />
      </div>
      <p className="font-mono text-sm text-slate-400">Tolerance: {tolerancePx}px from center</p>
    </div>
  );
};
