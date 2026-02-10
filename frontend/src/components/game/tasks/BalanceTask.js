import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { soundManager } from '../../../lib/sounds';

export const BalanceTask = ({ task, onSuccess, onFail }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [timeHeld, setTimeHeld] = useState(0);
  const [isBalancing, setIsBalancing] = useState(false);
  const [result, setResult] = useState(null);
  
  const containerRef = useRef(null);
  const animationRef = useRef(null);
  const lastUpdateRef = useRef(Date.now());
  
  const duration = task.config?.duration || 5000;
  const sensitivity = task.config?.sensitivity || 2;
  const threshold = 60; // Max distance from center

  // Drift simulation - shape slowly falls if not corrected
  useEffect(() => {
    if (!isBalancing || result) return;
    
    const drift = () => {
      const now = Date.now();
      const delta = now - lastUpdateRef.current;
      lastUpdateRef.current = now;
      
      setPosition(prev => {
        // Add slight random drift
        const driftX = (Math.random() - 0.5) * sensitivity * (delta / 16);
        const driftY = (Math.random() - 0.3) * sensitivity * (delta / 16); // Gravity bias
        
        const newX = prev.x + driftX;
        const newY = prev.y + driftY;
        
        // Check if out of bounds
        const distance = Math.sqrt(newX * newX + newY * newY);
        if (distance > threshold) {
          setResult('fail');
          soundManager.playFail();
          setTimeout(() => {
            onFail();
            resetGame();
          }, 500);
          return prev;
        }
        
        return { x: newX, y: newY };
      });
      
      setTimeHeld(prev => {
        const newTime = prev + delta;
        if (newTime >= duration) {
          setResult('success');
          soundManager.playSuccess();
          setTimeout(() => {
            onSuccess();
            resetGame();
          }, 800);
          return duration;
        }
        return newTime;
      });
      
      animationRef.current = requestAnimationFrame(drift);
    };
    
    animationRef.current = requestAnimationFrame(drift);
    return () => cancelAnimationFrame(animationRef.current);
  }, [isBalancing, result, duration, sensitivity, onSuccess, onFail]);

  const resetGame = () => {
    setPosition({ x: 0, y: 0 });
    setTimeHeld(0);
    setIsBalancing(false);
    setResult(null);
  };

  const handleMove = useCallback((e) => {
    if (!isBalancing || result) return;
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Move opposite to touch direction (like balancing a plate)
    const deltaX = (clientX - centerX) * 0.3;
    const deltaY = (clientY - centerY) * 0.3;
    
    setPosition(prev => ({
      x: Math.max(-threshold, Math.min(threshold, prev.x - deltaX * 0.1)),
      y: Math.max(-threshold, Math.min(threshold, prev.y - deltaY * 0.1))
    }));
  }, [isBalancing, result]);

  const handleStart = () => {
    if (!isBalancing) {
      setIsBalancing(true);
      lastUpdateRef.current = Date.now();
      soundManager.playClick();
    }
  };

  const progress = (timeHeld / duration) * 100;
  const distance = Math.sqrt(position.x * position.x + position.y * position.y);
  const danger = distance / threshold;

  return (
    <div className="flex flex-col items-center justify-center gap-6 w-full" data-testid="balance-task">
      <p className="text-lg text-slate-600 text-center">{task.instruction}</p>
      
      {/* Timer */}
      <div className="font-mono text-2xl font-bold" style={{ color: result === 'success' ? '#10B981' : '#0F172A' }}>
        {(timeHeld / 1000).toFixed(1)}s / {duration / 1000}s
      </div>
      
      {/* Balance area */}
      <div 
        ref={containerRef}
        className="relative w-[280px] h-[280px] rounded-full bg-slate-100 touch-none"
        onMouseMove={handleMove}
        onTouchMove={handleMove}
        onTouchStart={handleStart}
        onMouseDown={handleStart}
        data-testid="balance-area"
      >
        {/* Danger zone indicator */}
        <div 
          className="absolute inset-4 rounded-full border-2 border-dashed transition-colors"
          style={{ borderColor: danger > 0.7 ? '#EF4444' : '#E2E8F0' }}
        />
        
        {/* Center target */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-slate-300" />
        </div>
        
        {/* Balancing shape */}
        <motion.div
          className="absolute w-16 h-16 rounded-xl flex items-center justify-center"
          style={{
            left: '50%',
            top: '50%',
            x: position.x - 32,
            y: position.y - 32,
            backgroundColor: result === 'success' ? '#10B981' : result === 'fail' ? '#EF4444' : danger > 0.7 ? '#F59E0B' : '#0F172A',
            rotate: position.x * 0.5
          }}
          data-testid="balance-shape"
        >
          <div className="w-3 h-3 bg-white rounded-full" />
        </motion.div>
      </div>
      
      {/* Progress bar */}
      <div className="w-64 h-1 bg-slate-200 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-emerald-500 rounded-full"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      <p className="font-mono text-sm text-slate-400">
        {!isBalancing ? 'Touch to start' : result === 'fail' ? 'Lost balance!' : 'Keep it centered'}
      </p>
    </div>
  );
};
