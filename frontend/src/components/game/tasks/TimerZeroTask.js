import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { soundManager } from '../../../lib/sounds';

export const TimerZeroTask = ({ task, onSuccess, onFail }) => {
  const [display, setDisplay] = useState(3);
  const [result, setResult] = useState(null);
  const phaseRef = useRef('countdown');
  const zeroWindowStartRef = useRef(0);
  const zeroWindowEndRef = useRef(0);
  const intervalRef = useRef(null);

  const windowMs = task.config?.window_ms ?? 180;

  useEffect(() => {
    if (phaseRef.current !== 'countdown') return;
    const t = setTimeout(() => {
      setDisplay(2);
      const t2 = setTimeout(() => {
        setDisplay(1);
        const t3 = setTimeout(() => {
          setDisplay(0.02);
          const jumpAt = 200 + Math.random() * 400;
          const t4 = setTimeout(() => {
            const now = Date.now();
            zeroWindowStartRef.current = now;
            zeroWindowEndRef.current = now + windowMs;
            setDisplay(0);
            phaseRef.current = 'zero';
            const t5 = setTimeout(() => {
              if (phaseRef.current === 'zero') {
                setDisplay(-0.01);
                phaseRef.current = 'past';
                setResult('fail');
                soundManager.playFail();
                setTimeout(() => { onFail(); setResult(null); phaseRef.current = 'countdown'; setDisplay(3); }, 500);
              }
            }, windowMs + 50);
          }, jumpAt);
        }, 800);
      }, 800);
    }, 800);
    return () => clearTimeout(t);
  }, [windowMs, onFail]);

  const handleTap = useCallback(() => {
    soundManager.playClick();
    if (phaseRef.current === 'zero') {
      const now = Date.now();
      if (now >= zeroWindowStartRef.current && now <= zeroWindowEndRef.current) {
        setResult('success');
        soundManager.playSuccess();
        setTimeout(() => { onSuccess(); setResult(null); phaseRef.current = 'countdown'; setDisplay(3); }, 800);
      } else {
        setResult('fail');
        soundManager.playFail();
        setTimeout(() => { onFail(); setResult(null); phaseRef.current = 'countdown'; setDisplay(3); }, 500);
      }
    } else if (phaseRef.current === 'countdown') {
      setResult('fail');
      soundManager.playFail();
      setTimeout(() => { onFail(); setResult(null); }, 500);
    }
  }, [onSuccess, onFail]);

  return (
    <div className="flex flex-col items-center justify-center gap-8 w-full" data-testid="timer-zero-task">
      <p className="text-lg text-slate-600 text-center">{task.instruction}</p>
      <motion.div
        className="w-48 h-48 rounded-full touch-target cursor-pointer flex items-center justify-center font-mono text-5xl font-bold"
        style={{
          backgroundColor: result === 'success' ? '#10B981' : result === 'fail' ? '#EF4444' : '#0F172A',
          color: 'white'
        }}
        onClick={handleTap}
        data-testid="timer-zero-display"
      >
        {typeof display === 'number' && display < 0 ? '-0.01' : display}
      </motion.div>
      <p className="font-mono text-sm text-slate-400">Tap when it hits zero</p>
    </div>
  );
};
