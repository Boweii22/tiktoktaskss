import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { soundManager } from '../../../lib/sounds';

export const AlignTask = ({ task, onSuccess, onFail }) => {
  const [position1, setPosition1] = useState(0);
  const [position2, setPosition2] = useState(180);
  const [result, setResult] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  
  const animationRef = useRef(null);
  const startTimeRef = useRef(Date.now());
  
  const speed = task.config?.speed || 3;
  const windowMs = task.config?.window_ms || 100;
  const alignThresholdDeg = task.config?.align_threshold_deg ?? 15;

  useEffect(() => {
    if (!gameStarted || result) return;
    
    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current;
      
      // Two shapes moving at different speeds
      const p1 = (elapsed * speed * 0.1) % 360;
      const p2 = (elapsed * speed * 0.07 + 180) % 360;
      
      setPosition1(p1);
      setPosition2(p2);
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, [gameStarted, result, speed]);

  const handleTap = useCallback(() => {
    if (!gameStarted) {
      setGameStarted(true);
      startTimeRef.current = Date.now();
      soundManager.playClick();
      return;
    }
    
    soundManager.playClick();
    
    // Check if aligned (within threshold)
    const diff = Math.abs(position1 - position2);
    const aligned = diff < alignThresholdDeg || diff > (360 - alignThresholdDeg);
    
    if (aligned) {
      setResult('success');
      soundManager.playSuccess();
      setTimeout(() => {
        onSuccess();
        setGameStarted(false);
        setResult(null);
      }, 800);
    } else {
      setResult('fail');
      soundManager.playFail();
      setTimeout(() => {
        onFail();
        setGameStarted(false);
        setResult(null);
      }, 500);
    }
  }, [gameStarted, position1, position2, alignThresholdDeg, onSuccess, onFail]);

  // Convert angle to position on circle
  const getPosition = (angle) => {
    const radius = 100;
    const rad = (angle - 90) * (Math.PI / 180);
    return {
      x: 120 + radius * Math.cos(rad),
      y: 120 + radius * Math.sin(rad)
    };
  };

  const pos1 = getPosition(position1);
  const pos2 = getPosition(position2);

  return (
    <div className="flex flex-col items-center justify-center gap-6 w-full" data-testid="align-task">
      <p className="text-lg text-slate-600 text-center">{task.instruction}</p>
      
      {/* Circular track */}
      <div 
        className="relative w-[240px] h-[240px] cursor-pointer touch-target"
        onClick={handleTap}
        data-testid="align-area"
      >
        {/* Track circle */}
        <svg className="w-full h-full" viewBox="0 0 240 240">
          <circle
            cx="120"
            cy="120"
            r="100"
            fill="none"
            stroke="#E2E8F0"
            strokeWidth="2"
          />
          
          {/* Shape 1 - Square */}
          <motion.rect
            x={pos1.x - 12}
            y={pos1.y - 12}
            width="24"
            height="24"
            rx="4"
            fill={result === 'success' ? '#10B981' : result === 'fail' ? '#EF4444' : '#0F172A'}
          />
          
          {/* Shape 2 - Square (hollow) */}
          <motion.rect
            x={pos2.x - 16}
            y={pos2.y - 16}
            width="32"
            height="32"
            rx="6"
            fill="none"
            stroke={result === 'success' ? '#10B981' : result === 'fail' ? '#EF4444' : '#0F172A'}
            strokeWidth="3"
          />
        </svg>
        
        {/* Center tap indicator */}
        {!gameStarted && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-slate-400 font-medium">Tap to start</span>
          </div>
        )}
        
        {gameStarted && (
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              className="w-16 h-16 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              <span className="text-xs text-slate-400">TAP</span>
            </motion.div>
          </div>
        )}
      </div>
      
      <p className="font-mono text-sm text-slate-400">
        {!gameStarted ? 'Tap to begin' : result === 'fail' ? 'Not aligned!' : 'Tap when shapes overlap'}
      </p>
    </div>
  );
};
