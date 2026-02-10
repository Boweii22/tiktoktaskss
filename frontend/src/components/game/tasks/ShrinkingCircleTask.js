import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { soundManager } from '../../../lib/sounds';

const CIRCLE_CENTER = { x: 150, y: 150 };

export const ShrinkingCircleTask = ({ task, onSuccess, onFail }) => {
  const [circleSize, setCircleSize] = useState(150);
  const [dotPosition, setDotPosition] = useState({ x: 50, y: 200 });
  const [isDragging, setIsDragging] = useState(false);
  const [result, setResult] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  
  const containerRef = useRef(null);
  const shrinkIntervalRef = useRef(null);
  
  const shrinkRate = task.config?.shrink_rate || 0.97;
  const minSize = task.config?.min_size || 15;

  useEffect(() => {
    if (gameStarted && !result) {
      shrinkIntervalRef.current = setInterval(() => {
        setCircleSize(prev => {
          const newSize = prev * shrinkRate;
          if (newSize < minSize) {
            clearInterval(shrinkIntervalRef.current);
            setResult('fail');
            soundManager.playFail();
            setTimeout(() => {
              onFail();
              resetGame();
            }, 500);
            return minSize;
          }
          return newSize;
        });
      }, 50);
    }
    
    return () => clearInterval(shrinkIntervalRef.current);
  }, [gameStarted, result, shrinkRate, minSize, onFail]);

  const resetGame = () => {
    setCircleSize(150);
    setDotPosition({ x: 50, y: 200 });
    setGameStarted(false);
    setResult(null);
  };

  const checkCollision = useCallback((pos) => {
    const dx = pos.x - CIRCLE_CENTER.x;
    const dy = pos.y - CIRCLE_CENTER.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < circleSize / 2 - 10; // Dot radius is ~10
  }, [circleSize]);

  const handleDragStart = () => {
    if (!gameStarted) {
      setGameStarted(true);
    }
    setIsDragging(true);
    soundManager.playClick();
  };

  const handleDrag = useCallback((_, info) => {
    if (result) return;
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const newX = Math.max(10, Math.min(290, info.point.x - rect.left));
    const newY = Math.max(10, Math.min(290, info.point.y - rect.top));
    
    setDotPosition({ x: newX, y: newY });
    
    if (checkCollision({ x: newX, y: newY })) {
      clearInterval(shrinkIntervalRef.current);
      setResult('success');
      soundManager.playSuccess();
      setTimeout(() => {
        onSuccess();
        resetGame();
      }, 800);
    }
  }, [result, checkCollision, onSuccess]);

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <div className="flex flex-col items-center justify-center gap-6 w-full" data-testid="shrinking-circle-task">
      <p className="text-lg text-slate-600 text-center">{task.instruction}</p>
      
      <div 
        ref={containerRef}
        className="relative w-[300px] h-[300px] bg-slate-100 rounded-2xl overflow-hidden touch-none"
        data-testid="shrinking-circle-area"
      >
        {/* Target circle */}
        <motion.div
          className="absolute rounded-full border-2 border-dashed"
          style={{
            width: circleSize,
            height: circleSize,
            left: CIRCLE_CENTER.x - circleSize / 2,
            top: CIRCLE_CENTER.y - circleSize / 2,
            borderColor: result === 'success' ? '#10B981' : result === 'fail' ? '#EF4444' : '#0F172A',
            backgroundColor: result === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'transparent'
          }}
          data-testid="target-circle"
        />
        
        {/* Draggable dot */}
        <motion.div
          className="absolute w-6 h-6 rounded-full cursor-grab active:cursor-grabbing touch-target"
          style={{
            backgroundColor: result === 'success' ? '#10B981' : result === 'fail' ? '#EF4444' : '#0F172A',
            left: dotPosition.x - 12,
            top: dotPosition.y - 12,
            boxShadow: isDragging ? '0 4px 12px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.1)'
          }}
          drag
          dragMomentum={false}
          dragElastic={0}
          onDragStart={handleDragStart}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
          whileDrag={{ scale: 1.2 }}
          data-testid="draggable-dot"
        />
      </div>
      
      <p className="font-mono text-sm text-slate-400">
        {!gameStarted ? 'Drag the dot' : result === 'fail' ? 'Too slow!' : `Circle: ${Math.round(circleSize)}px`}
      </p>
    </div>
  );
};
