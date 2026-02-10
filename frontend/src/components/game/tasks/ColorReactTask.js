import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { soundManager } from '../../../lib/sounds';

const COLORS = { red: '#EF4444', yellow: '#EAB308', green: '#22C55E' };

export const ColorReactTask = ({ task, onSuccess, onFail }) => {
  const [phase, setPhase] = useState('idle');
  const [result, setResult] = useState(null);
  const timeoutRef = useRef(null);
  const goTimeRef = useRef(null);

  const minDelay = task.config?.min_delay || 1500;
  const maxDelay = task.config?.max_delay || 4500;
  const windowMs = task.config?.window_ms || 250;

  const startGame = useCallback(() => {
    setPhase('waiting');
    setResult(null);
    const delay = Math.floor(Math.random() * (maxDelay - minDelay)) + minDelay;
    timeoutRef.current = setTimeout(() => {
      setPhase('go');
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
    soundManager.playClick();
    if (phase === 'idle') {
      startGame();
      return;
    }
    if (phase === 'waiting') {
      clearTimeout(timeoutRef.current);
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
        setResult('success');
        soundManager.playSuccess();
        setTimeout(() => {
          onSuccess();
          setPhase('idle');
          setResult(null);
        }, 800);
      } else {
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

  const bg = phase === 'go' ? COLORS.yellow : phase === 'waiting' ? COLORS.red : result === 'success' ? '#10B981' : result === 'fail' ? '#EF4444' : '#0F172A';

  return (
    <div className="flex flex-col items-center justify-center gap-8 w-full" data-testid="color-react-task">
      <p className="text-lg text-slate-600 text-center">{task.instruction}</p>
      <motion.button
        className="w-52 h-52 rounded-full touch-target flex items-center justify-center text-white font-bold text-xl shadow-lg"
        style={{ backgroundColor: bg }}
        onClick={handleTap}
        whileTap={{ scale: 0.95 }}
        animate={phase === 'go' ? { scale: [1, 1.08, 1] } : {}}
        transition={{ duration: 0.15 }}
        data-testid="color-react-button"
      >
        {phase === 'idle' ? 'START' : phase === 'waiting' ? 'WAIT...' : phase === 'go' ? 'NOW!' : result === 'success' ? 'NICE!' : 'MISSED'}
      </motion.button>
      <p className="font-mono text-sm text-slate-400">
        {phase === 'waiting' ? 'Red = wait. Tap only on yellow.' : phase === 'go' ? `Yellow! Tap within ${windowMs}ms` : phase === 'idle' ? 'Tap to begin' : ''}
      </p>
    </div>
  );
};
