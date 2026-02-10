import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { soundManager } from '../../../lib/sounds';

export const TapSameSpotTask = ({ task, onSuccess, onFail }) => {
  const [step, setStep] = useState(0);
  const [result, setResult] = useState(null);
  const firstTapRef = useRef(null);
  const boxRef = useRef(null);

  const tolerancePx = task.config?.tolerance_px ?? 8;

  const getTapPos = (e) => {
    if (e.changedTouches?.length) return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
    return { x: e.clientX, y: e.clientY };
  };

  const handleTap = useCallback((e) => {
    soundManager.playClick();
    const pos = getTapPos(e);
    if (step === 0) {
      firstTapRef.current = pos;
      setStep(1);
    } else {
      const first = firstTapRef.current;
      if (!first) return;
      const dist = Math.hypot(pos.x - first.x, pos.y - first.y);
      if (dist <= tolerancePx) {
        setResult('success');
        soundManager.playSuccess();
        setTimeout(() => { onSuccess(); setStep(0); setResult(null); firstTapRef.current = null; }, 800);
      } else {
        setResult('fail');
        soundManager.playFail();
        setTimeout(() => { onFail(); setStep(0); setResult(null); firstTapRef.current = null; }, 500);
      }
    }
  }, [step, tolerancePx, onSuccess, onFail]);

  return (
    <div className="flex flex-col items-center justify-center gap-8 w-full" data-testid="tap-same-spot-task">
      <p className="text-lg text-slate-600 text-center">{task.instruction}</p>
      <div
        ref={boxRef}
        className="w-64 h-64 rounded-2xl bg-slate-100 touch-target cursor-pointer flex items-center justify-center border-2 border-slate-200"
        onClick={handleTap}
        onTouchEnd={(e) => { if (e.changedTouches?.length) handleTap(e); }}
        style={{ borderColor: result === 'success' ? '#10B981' : result === 'fail' ? '#EF4444' : undefined }}
        data-testid="tap-same-spot-area"
      >
        {step === 0 ? 'Tap once' : 'Tap the same spot'}
      </div>
      <p className="font-mono text-sm text-slate-400">Within {tolerancePx}px of first tap</p>
    </div>
  );
};
