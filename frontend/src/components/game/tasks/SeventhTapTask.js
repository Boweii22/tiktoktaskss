import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { soundManager } from '../../../lib/sounds';

export const SeventhTapTask = ({ task, onSuccess, onFail }) => {
  const [litIndex, setLitIndex] = useState(-1);
  const [phase, setPhase] = useState('idle'); // idle, running, result
  const [result, setResult] = useState(null);
  const timeoutRef = useRef(null);
  const seventhLitAtRef = useRef(null);

  const count = task.config?.count ?? 7;
  const intervalMs = task.config?.interval_ms ?? 650;
  const windowMs = task.config?.window_ms ?? 280;

  const startGame = useCallback(() => {
    setPhase('running');
    setResult(null);
    setLitIndex(-1);
    seventhLitAtRef.current = null;
    let i = 0;
    const scheduleNext = () => {
      if (i >= count) {
        timeoutRef.current = setTimeout(() => {
          setLitIndex(count - 1);
          seventhLitAtRef.current = Date.now();
          timeoutRef.current = setTimeout(() => {
            setPhase('result');
            setResult('fail');
            soundManager.playFail();
            setTimeout(() => {
              onFail();
              setPhase('idle');
              setLitIndex(-1);
              setResult(null);
            }, 500);
          }, windowMs + 100);
        }, intervalMs);
        return;
      }
      timeoutRef.current = setTimeout(() => {
        setLitIndex(i);
        i += 1;
        scheduleNext();
      }, intervalMs);
    };
    scheduleNext();
  }, [count, intervalMs, windowMs, onFail]);

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  const handleTap = useCallback(() => {
    soundManager.playClick();
    if (phase === 'idle') {
      startGame();
      return;
    }
    if (phase !== 'running' || result) return;
    const now = Date.now();
    const seventhAt = seventhLitAtRef.current;
    if (seventhAt == null) {
      clearTimeout(timeoutRef.current);
      setPhase('result');
      setResult('fail');
      soundManager.playFail();
      setTimeout(() => {
        onFail();
        setPhase('idle');
        setLitIndex(-1);
        setResult(null);
      }, 500);
      return;
    }
    const elapsed = now - seventhAt;
    if (elapsed >= 0 && elapsed <= windowMs) {
      clearTimeout(timeoutRef.current);
      setPhase('result');
      setResult('success');
      soundManager.playSuccess();
      setTimeout(() => {
        onSuccess();
        setPhase('idle');
        setLitIndex(-1);
        setResult(null);
      }, 800);
    } else {
      clearTimeout(timeoutRef.current);
      setPhase('result');
      setResult('fail');
      soundManager.playFail();
      setTimeout(() => {
        onFail();
        setPhase('idle');
        setLitIndex(-1);
        setResult(null);
      }, 500);
    }
  }, [phase, result, windowMs, startGame, onSuccess, onFail]);

  return (
    <div className="flex flex-col items-center justify-center gap-8 w-full" data-testid="seventh-tap-task">
      <p className="text-lg text-slate-600 text-center">{task.instruction}</p>
      <div
        className="flex gap-2 justify-center items-end cursor-pointer touch-target py-4"
        onClick={handleTap}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && handleTap()}
      >
        {Array.from({ length: count }, (_, i) => (
          <motion.div
            key={i}
            className="w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-mono"
            style={{
              backgroundColor: result === 'success' && i === count - 1 ? '#10B981' : result === 'fail' && i === count - 1 ? '#EF4444' : litIndex === i ? '#0F172A' : '#E2E8F0',
              borderColor: litIndex === i ? '#0F172A' : '#E2E8F0',
              color: litIndex === i ? 'white' : '#64748B'
            }}
            animate={litIndex === i ? { scale: [1, 1.15, 1] } : {}}
            transition={{ duration: 0.15 }}
          >
            {i + 1}
          </motion.div>
        ))}
      </div>
      <p className="font-mono text-sm text-slate-400">
        {phase === 'idle' ? 'Tap to start' : phase === 'running' ? 'Wait for the 7th dot — then tap' : result === 'fail' ? 'Wrong moment' : 'Perfect'}
      </p>
    </div>
  );
};
