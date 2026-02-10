import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { soundManager } from '../../../lib/sounds';

export const TrapTapTask = ({ task, onSuccess, onFail }) => {
  const [tapCount, setTapCount] = useState(0);
  const [trapPosition, setTrapPosition] = useState(-1);
  const [result, setResult] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  
  const requiredTaps = task.config?.required_taps || 50;

  useEffect(() => {
    // Set random trap position at game start
    if (!gameStarted) {
      const trap = Math.floor(Math.random() * requiredTaps) + 1;
      setTrapPosition(trap);
    }
  }, [gameStarted, requiredTaps]);

  const handleTap = useCallback(() => {
    if (result) return;
    
    if (!gameStarted) {
      setGameStarted(true);
    }
    
    soundManager.playTick();
    const newCount = tapCount + 1;
    
    if (newCount === trapPosition) {
      // Hit the trap!
      setResult('fail');
      soundManager.playFail();
      setTimeout(() => {
        onFail();
        setTapCount(0);
        setGameStarted(false);
        setResult(null);
      }, 500);
      return;
    }
    
    setTapCount(newCount);
    
    if (newCount >= requiredTaps) {
      setResult('success');
      soundManager.playSuccess();
      setTimeout(() => {
        onSuccess();
        setTapCount(0);
        setGameStarted(false);
        setResult(null);
      }, 800);
    }
  }, [tapCount, trapPosition, result, gameStarted, requiredTaps, onSuccess, onFail]);

  const progress = (tapCount / requiredTaps) * 100;

  return (
    <div className="flex flex-col items-center justify-center gap-8 w-full" data-testid="trap-tap-task">
      <p className="text-lg text-slate-600 text-center">{task.instruction}</p>
      
      {/* Progress bar */}
      <div className="w-64 h-2 bg-slate-200 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{
            backgroundColor: result === 'success' ? '#10B981' : result === 'fail' ? '#EF4444' : '#0F172A'
          }}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.05 }}
        />
      </div>
      
      {/* Tap button */}
      <motion.button
        className="w-40 h-40 rounded-full touch-target flex flex-col items-center justify-center gap-2"
        style={{
          backgroundColor: result === 'success' ? '#10B981' : result === 'fail' ? '#EF4444' : '#0F172A'
        }}
        onClick={handleTap}
        whileTap={{ scale: 0.92 }}
        data-testid="trap-tap-button"
      >
        <span className="text-white font-mono text-4xl font-bold">{tapCount}</span>
        <span className="text-white/60 text-sm">/ {requiredTaps}</span>
      </motion.button>
      
      <p className="font-mono text-sm text-slate-400">
        {result === 'fail' ? 'Bad luck! That tap was trapped.' : 'Tap fast. Watch out.'}
      </p>
    </div>
  );
};
