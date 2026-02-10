import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { soundManager } from '../../../lib/sounds';

export const HesitationTask = ({ task, onSuccess, onFail }) => {
  const [gameActive, setGameActive] = useState(false);
  const [result, setResult] = useState(null);
  
  const timeoutRef = useRef(null);
  const startTimeRef = useRef(null);
  
  const maxDelay = task.config?.max_delay || 500;

  const startGame = useCallback(() => {
    setGameActive(true);
    setResult(null);
    startTimeRef.current = Date.now();
    
    // Auto-fail if they hesitate too long
    timeoutRef.current = setTimeout(() => {
      setResult('fail');
      soundManager.playFail();
      setTimeout(() => {
        onFail();
        setGameActive(false);
        setResult(null);
      }, 500);
    }, maxDelay);
  }, [maxDelay, onFail]);

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

  const handleTap = useCallback(() => {
    if (!gameActive) {
      soundManager.playClick();
      startGame();
      return;
    }
    
    clearTimeout(timeoutRef.current);
    const reactionTime = Date.now() - startTimeRef.current;
    
    if (reactionTime <= maxDelay) {
      setResult('success');
      soundManager.playSuccess();
      setTimeout(() => {
        onSuccess();
        setGameActive(false);
        setResult(null);
      }, 800);
    }
  }, [gameActive, maxDelay, startGame, onSuccess]);

  return (
    <div className="flex flex-col items-center justify-center gap-8 w-full" data-testid="hesitation-task">
      <p className="text-lg text-slate-600 text-center">{task.instruction}</p>
      
      <div className="relative">
        {/* Countdown ring */}
        {gameActive && !result && (
          <svg className="absolute inset-0 w-48 h-48 progress-ring" viewBox="0 0 100 100">
            <motion.circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#EF4444"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 45}`}
              initial={{ strokeDashoffset: 0 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 45 }}
              transition={{ duration: maxDelay / 1000, ease: "linear" }}
            />
          </svg>
        )}
        
        <motion.button
          className="w-48 h-48 rounded-full touch-target flex items-center justify-center text-white font-bold text-lg"
          style={{
            backgroundColor: result === 'success' ? '#10B981' : result === 'fail' ? '#EF4444' : '#0F172A'
          }}
          onClick={handleTap}
          whileTap={{ scale: 0.95 }}
          data-testid="hesitation-button"
        >
          {!gameActive ? 'TAP TO START' : 
           result === 'success' ? 'QUICK!' :
           result === 'fail' ? 'TOO SLOW' : 'TAP NOW!'}
        </motion.button>
      </div>
      
      <p className="font-mono text-sm text-slate-400">
        {!gameActive ? 'When the game starts, tap immediately' : 
         result === 'fail' ? `You had ${maxDelay}ms` :
         'No hesitation allowed'}
      </p>
    </div>
  );
};
