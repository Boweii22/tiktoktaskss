import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { soundManager } from '../../../lib/sounds';

export const RapidTapTask = ({ task, onSuccess, onFail }) => {
  const [tapCount, setTapCount] = useState(0);
  const [gameActive, setGameActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [result, setResult] = useState(null);
  
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);
  
  const requiredTaps = task.config?.required_taps || 10;
  const timeLimit = task.config?.time_limit || 2000;
  const tolerance = task.config?.tolerance || 0;

  const startGame = useCallback(() => {
    setGameActive(true);
    setTapCount(0);
    setResult(null);
    startTimeRef.current = Date.now();
    setTimeLeft(timeLimit);
    
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, timeLimit - elapsed);
      setTimeLeft(remaining);
      
      if (remaining <= 0) {
        clearInterval(intervalRef.current);
        // Check result
        setGameActive(false);
      }
    }, 50);
  }, [timeLimit]);

  useEffect(() => {
    if (!gameActive && tapCount > 0 && result === null) {
      // Game ended, check result
      const diff = Math.abs(tapCount - requiredTaps);
      
      if (diff <= tolerance) {
        setResult('success');
        soundManager.playSuccess();
        setTimeout(() => {
          onSuccess();
          setTapCount(0);
          setResult(null);
        }, 800);
      } else {
        setResult('fail');
        soundManager.playFail();
        setTimeout(() => {
          onFail();
          setTapCount(0);
          setResult(null);
        }, 500);
      }
    }
  }, [gameActive, tapCount, requiredTaps, tolerance, result, onSuccess, onFail]);

  useEffect(() => {
    return () => clearInterval(intervalRef.current);
  }, []);

  const handleTap = useCallback(() => {
    if (!gameActive) {
      soundManager.playClick();
      startGame();
      return;
    }
    
    soundManager.playTick();
    setTapCount(prev => prev + 1);
  }, [gameActive, startGame]);

  const progress = (timeLeft / timeLimit) * 100;

  return (
    <div className="flex flex-col items-center justify-center gap-6 w-full" data-testid="rapid-tap-task">
      <p className="text-lg text-slate-600 text-center">{task.instruction}</p>
      
      {/* Timer bar */}
      <div className="w-64 h-2 bg-slate-200 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{
            backgroundColor: gameActive ? (progress < 30 ? '#EF4444' : '#0F172A') : '#E2E8F0',
            width: `${gameActive ? progress : 100}%`
          }}
        />
      </div>
      
      {/* Tap counter */}
      <motion.button
        className="w-48 h-48 rounded-full touch-target flex flex-col items-center justify-center gap-2"
        style={{
          backgroundColor: result === 'success' ? '#10B981' : result === 'fail' ? '#EF4444' : '#0F172A'
        }}
        onClick={handleTap}
        whileTap={{ scale: 0.92 }}
        data-testid="rapid-tap-button"
      >
        <span className="text-white font-mono text-5xl font-bold">{tapCount}</span>
        <span className="text-white/60 text-sm">/ {requiredTaps}</span>
      </motion.button>
      
      <p className="font-mono text-sm text-slate-400">
        {!gameActive && !result ? 'Tap to start' :
         gameActive ? `${(timeLeft / 1000).toFixed(1)}s remaining` :
         result === 'fail' ? `You tapped ${tapCount} times` :
         'Perfect timing!'}
      </p>
    </div>
  );
};
