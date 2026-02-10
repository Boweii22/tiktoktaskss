import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { soundManager } from '../../../lib/sounds';

const GRACE_MS = 500;

export const DontTapTask = ({ task, onSuccess, onFail }) => {
  const [started, setStarted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState(null);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);
  const graceUntilRef = useRef(0);

  const duration = task.config?.duration || 5000;

  const startGame = useCallback(() => {
    setStarted(true);
    setElapsed(0);
    setResult(null);
    startTimeRef.current = Date.now();
    graceUntilRef.current = Date.now() + GRACE_MS;
    intervalRef.current = setInterval(() => {
      setElapsed(Date.now() - startTimeRef.current);
    }, 50);
  }, []);

  useEffect(() => {
    if (!started || result) return;
    if (elapsed >= duration) {
      clearInterval(intervalRef.current);
      setResult('success');
      soundManager.playSuccess();
      setTimeout(() => {
        onSuccess();
        setStarted(false);
        setResult(null);
      }, 800);
    }
    return () => {};
  }, [started, elapsed, duration, result, onSuccess]);

  useEffect(() => () => clearInterval(intervalRef.current), []);

  const handleTap = useCallback(() => {
    if (!started) {
      soundManager.playClick();
      startGame();
      return;
    }
    if (Date.now() < graceUntilRef.current) return;
    clearInterval(intervalRef.current);
    setResult('fail');
    soundManager.playFail();
    setTimeout(() => {
      onFail();
      setStarted(false);
      setResult(null);
    }, 500);
  }, [started, startGame, onFail]);

  return (
    <div
      className="flex flex-col items-center justify-center gap-8 w-full h-full cursor-pointer"
      onClick={handleTap}
      onTouchStart={(e) => e.target === e.currentTarget && handleTap()}
      data-testid="dont-tap-task"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleTap()}
    >
      <p className="text-lg text-slate-600 text-center">{task.instruction}</p>
      <motion.div
        className="w-56 h-56 rounded-2xl flex items-center justify-center select-none"
        style={{
          backgroundColor: result === 'success' ? '#10B981' : result === 'fail' ? '#EF4444' : started ? '#F59E0B' : '#0F172A'
        }}
        animate={started && !result ? { scale: [1, 1.02, 1], opacity: [1, 0.9, 1] } : {}}
        transition={{ duration: 0.8, repeat: Infinity }}
        data-testid="dont-tap-area"
      >
        {!started ? (
          <span className="text-white font-bold text-2xl">START</span>
        ) : result ? (
          <span className="text-white font-bold text-xl">{result === 'success' ? 'YOU WIN!' : 'YOU TAPPED!'}</span>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <span className="text-white font-black text-4xl tracking-tighter">TAP!!!</span>
            <span className="font-mono text-white/80 text-sm">{(elapsed / 1000).toFixed(1)}s</span>
          </div>
        )}
      </motion.div>
      <p className="font-mono text-sm text-slate-400">
        {!started ? 'Tap to start — then do not tap' : result === 'fail' ? 'The screen said TAP and you did. Oops.' : 'Resist the urge!'}
      </p>
    </div>
  );
};
