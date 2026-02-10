import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { soundManager } from '../../../lib/sounds';

export const DoubleReactTask = ({ task, onSuccess, onFail }) => {
  const [phase, setPhase] = useState('idle'); // idle, waiting, go, result
  const [result, setResult] = useState(null);
  const [bothOn, setBothOn] = useState(false);
  const timeoutRef = useRef(null);
  const goTimeRef = useRef(null);

  const minDelay = task.config?.min_delay ?? 2500;
  const maxDelay = task.config?.max_delay ?? 5500;
  const windowMs = task.config?.window_ms ?? 220;

  const startGame = useCallback(() => {
    setPhase('waiting');
    setResult(null);
    setBothOn(false);
    const delay = Math.floor(Math.random() * (maxDelay - minDelay)) + minDelay;
    timeoutRef.current = setTimeout(() => {
      setPhase('go');
      setBothOn(true);
      goTimeRef.current = Date.now();
      timeoutRef.current = setTimeout(() => {
        setPhase('result');
        setResult('fail');
        soundManager.playFail();
        setTimeout(() => {
          onFail();
          setPhase('idle');
          setResult(null);
        }, 500);
      }, windowMs + 400);
    }, delay);
  }, [minDelay, maxDelay, windowMs, onFail]);

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  const handleTap = useCallback(() => {
    if (phase === 'idle') {
      startGame();
      return;
    }
    if (phase === 'waiting') {
      clearTimeout(timeoutRef.current);
      setPhase('result');
      setResult('fail');
      soundManager.playFail();
      setTimeout(() => {
        onFail();
        setPhase('idle');
        setResult(null);
      }, 500);
      return;
    }
    if (phase === 'go') {
      clearTimeout(timeoutRef.current);
      const reaction = Date.now() - goTimeRef.current;
      if (reaction <= windowMs) {
        setPhase('result');
        setResult('success');
        soundManager.playSuccess();
        setTimeout(() => {
          onSuccess();
          setPhase('idle');
          setResult(null);
        }, 800);
      } else {
        setPhase('result');
        setResult('fail');
        soundManager.playFail();
        setTimeout(() => {
          onFail();
          setPhase('idle');
          setResult(null);
        }, 500);
      }
    }
  }, [phase, windowMs, startGame, onSuccess, onFail]);

  const color = result === 'success' ? '#10B981' : result === 'fail' ? '#EF4444' : bothOn ? '#10B981' : '#64748B';

  return (
    <div className="flex flex-col items-center justify-center gap-8 w-full" data-testid="double-react-task">
      <p className="text-lg text-slate-600 text-center">{task.instruction}</p>
      <div className="flex gap-8">
        <motion.div
          className="w-20 h-20 rounded-full"
          style={{ backgroundColor: bothOn ? '#10B981' : '#64748B' }}
          animate={bothOn ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 0.2 }}
        />
        <motion.div
          className="w-20 h-20 rounded-full touch-target"
          style={{ backgroundColor: color }}
          onClick={handleTap}
          animate={bothOn ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 0.2 }}
          data-testid="double-react-button"
        />
      </div>
      <p className="font-mono text-sm text-slate-400">
        {phase === 'go' ? 'Both green — TAP!' : phase === 'waiting' ? 'Wait for both...' : 'Tap to start'}
      </p>
    </div>
  );
};
