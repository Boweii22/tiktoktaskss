import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { soundManager } from '../../../lib/sounds';

export const StaticTapTask = ({ task, onSuccess, onFail }) => {
  const [phase, setPhase] = useState(0); // 0-1 for animation cycle
  const [isStatic, setIsStatic] = useState(false);
  const [result, setResult] = useState(null);
  const animationRef = useRef(null);
  const startTimeRef = useRef(Date.now());
  
  const cycleMs = task.config?.cycle_ms || 4000;
  const windowMs = task.config?.window_ms || 50;
  
  // The circle appears static at phase 0.5 (middle of cycle)
  const staticPhase = 0.5;
  const staticWindow = windowMs / cycleMs;

  useEffect(() => {
    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const currentPhase = (elapsed % cycleMs) / cycleMs;
      setPhase(currentPhase);
      
      // Check if in static window
      const distFromStatic = Math.abs(currentPhase - staticPhase);
      setIsStatic(distFromStatic < staticWindow);
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, [cycleMs, staticWindow]);

  const handleTap = useCallback(() => {
    soundManager.playClick();
    
    if (isStatic) {
      setResult('success');
      soundManager.playSuccess();
      setTimeout(() => {
        onSuccess();
        setResult(null);
      }, 800);
    } else {
      setResult('fail');
      soundManager.playFail();
      setTimeout(() => {
        onFail();
        setResult(null);
      }, 500);
    }
  }, [isStatic, onSuccess, onFail]);

  // Very subtle movement - appears almost static
  const scale = 1 + Math.sin(phase * Math.PI * 2) * 0.02;
  const opacity = 0.9 + Math.sin(phase * Math.PI * 2) * 0.1;

  return (
    <div className="flex flex-col items-center justify-center gap-8 w-full" data-testid="static-tap-task">
      <p className="text-lg text-slate-600 text-center">{task.instruction}</p>
      
      <motion.button
        className="w-40 h-40 rounded-full touch-target flex items-center justify-center"
        style={{
          backgroundColor: result === 'success' ? '#10B981' : result === 'fail' ? '#EF4444' : '#0F172A',
          transform: `scale(${scale})`,
          opacity: opacity
        }}
        onClick={handleTap}
        whileTap={{ scale: 0.95 }}
        data-testid="static-tap-button"
      >
        <div className="w-4 h-4 bg-white rounded-full" />
      </motion.button>
      
      <p className="font-mono text-sm text-slate-400">
        {result === 'fail' ? 'It was still moving' : 'Watch carefully'}
      </p>
    </div>
  );
};
