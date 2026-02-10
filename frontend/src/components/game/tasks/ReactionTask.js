import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { soundManager } from '../../../lib/sounds';

export const ReactionTask = ({ task, onSuccess, onFail }) => {
  const [phase, setPhase] = useState('waiting'); // waiting, ready, go, result
  const [result, setResult] = useState(null);
  
  const timeoutRef = useRef(null);
  const goTimeRef = useRef(null);
  
  const minDelay = task.config?.min_delay || 2000;
  const maxDelay = task.config?.max_delay || 5000;
  const windowMs = task.config?.window_ms || 200;

  const startGame = useCallback(() => {
    setPhase('ready');
    setResult(null);
    
    // Random delay before "GO"
    const delay = Math.floor(Math.random() * (maxDelay - minDelay)) + minDelay;
    
    timeoutRef.current = setTimeout(() => {
      setPhase('go');
      goTimeRef.current = Date.now();
      
      // Auto-fail if too slow
      timeoutRef.current = setTimeout(() => {
        if (phase !== 'result') {
          setPhase('result');
          setResult('fail');
          soundManager.playFail();
          setTimeout(() => {
            onFail();
            setPhase('waiting');
            setResult(null);
          }, 500);
        }
      }, windowMs + 500); // Give them window + buffer
    }, delay);
  }, [minDelay, maxDelay, windowMs, phase, onFail]);

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

  const handleTap = useCallback(() => {
    soundManager.playClick();
    
    if (phase === 'waiting') {
      startGame();
      return;
    }
    
    if (phase === 'ready') {
      // Tapped too early!
      clearTimeout(timeoutRef.current);
      setPhase('result');
      setResult('fail');
      soundManager.playFail();
      setTimeout(() => {
        onFail();
        setPhase('waiting');
        setResult(null);
      }, 500);
      return;
    }
    
    if (phase === 'go') {
      clearTimeout(timeoutRef.current);
      const reactionTime = Date.now() - goTimeRef.current;
      
      if (reactionTime <= windowMs) {
        setPhase('result');
        setResult('success');
        soundManager.playSuccess();
        setTimeout(() => {
          onSuccess();
          setPhase('waiting');
          setResult(null);
        }, 800);
      } else {
        setPhase('result');
        setResult('fail');
        soundManager.playFail();
        setTimeout(() => {
          onFail();
          setPhase('waiting');
          setResult(null);
        }, 500);
      }
    }
  }, [phase, windowMs, startGame, onSuccess, onFail]);

  const getColor = () => {
    if (result === 'success') return '#10B981';
    if (result === 'fail') return '#EF4444';
    if (phase === 'go') return '#10B981';
    if (phase === 'ready') return '#F59E0B';
    return '#0F172A';
  };

  const getText = () => {
    if (result === 'success') return 'PERFECT!';
    if (result === 'fail') return phase === 'ready' ? 'TOO EARLY!' : 'TOO SLOW!';
    if (phase === 'go') return 'NOW!';
    if (phase === 'ready') return 'WAIT...';
    return 'START';
  };

  return (
    <div className="flex flex-col items-center justify-center gap-8 w-full" data-testid="reaction-task">
      <p className="text-lg text-slate-600 text-center">{task.instruction}</p>
      
      <motion.button
        className="w-48 h-48 rounded-full touch-target flex items-center justify-center text-white font-bold text-xl"
        style={{ backgroundColor: getColor() }}
        onClick={handleTap}
        whileTap={{ scale: 0.95 }}
        animate={phase === 'go' ? { scale: [1, 1.1, 1] } : {}}
        transition={{ duration: 0.2 }}
        data-testid="reaction-button"
      >
        {getText()}
      </motion.button>
      
      <p className="font-mono text-sm text-slate-400">
        {phase === 'waiting' ? 'Tap to begin' : 
         phase === 'ready' ? 'Wait for green...' :
         phase === 'go' ? `React in ${windowMs}ms!` :
         result === 'fail' ? 'Try again' : 'Nice!'}
      </p>
    </div>
  );
};
