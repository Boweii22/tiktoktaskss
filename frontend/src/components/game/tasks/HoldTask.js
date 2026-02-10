import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { soundManager } from '../../../lib/sounds';

export const HoldTask = ({ task, onSuccess, onFail }) => {
  const [isHolding, setIsHolding] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState(null);
  
  const startTimeRef = useRef(null);
  const intervalRef = useRef(null);
  
  const target = task.config?.target || 3000;
  const tolerance = task.config?.tolerance || 20;

  const startHold = useCallback(() => {
    soundManager.playClick();
    setIsHolding(true);
    setResult(null);
    startTimeRef.current = Date.now();
    
    intervalRef.current = setInterval(() => {
      const currentElapsed = Date.now() - startTimeRef.current;
      setElapsed(currentElapsed);
    }, 10);
  }, []);

  const endHold = useCallback(() => {
    if (!isHolding) return;
    
    setIsHolding(false);
    clearInterval(intervalRef.current);
    
    const finalTime = Date.now() - startTimeRef.current;
    setElapsed(finalTime);
    
    const diff = Math.abs(finalTime - target);
    
    if (diff <= tolerance) {
      setResult('success');
      soundManager.playSuccess();
      setTimeout(() => {
        onSuccess();
        setElapsed(0);
        setResult(null);
      }, 800);
    } else {
      setResult('fail');
      soundManager.playFail();
      setTimeout(() => {
        onFail();
        setElapsed(0);
        setResult(null);
      }, 500);
    }
  }, [isHolding, target, tolerance, onSuccess, onFail]);

  const displayTime = (elapsed / 1000).toFixed(3);
  const progressPercent = Math.min((elapsed / target) * 100, 150);

  return (
    <div className="flex flex-col items-center justify-center gap-8 w-full" data-testid="hold-task">
      <p className="text-lg text-slate-600 text-center">{task.instruction}</p>
      
      <div className="relative">
        {/* Progress ring */}
        <svg className="w-48 h-48 progress-ring" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#E2E8F0"
            strokeWidth="4"
          />
          <motion.circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={result === 'success' ? '#10B981' : result === 'fail' ? '#EF4444' : '#0F172A'}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 45}`}
            strokeDashoffset={`${2 * Math.PI * 45 * (1 - Math.min(progressPercent, 100) / 100)}`}
            initial={false}
          />
        </svg>
        
        {/* Hold button */}
        <motion.button
          className="absolute inset-0 m-auto w-32 h-32 rounded-full bg-slate-900 text-white font-mono text-2xl touch-target flex items-center justify-center"
          onTouchStart={startHold}
          onTouchEnd={endHold}
          onMouseDown={startHold}
          onMouseUp={endHold}
          onMouseLeave={() => isHolding && endHold()}
          whileTap={{ scale: 0.95 }}
          animate={{
            backgroundColor: result === 'success' ? '#10B981' : result === 'fail' ? '#EF4444' : '#0F172A'
          }}
          data-testid="hold-button"
        >
          {isHolding ? displayTime : 'HOLD'}
        </motion.button>
      </div>
      
      <p className="font-mono text-sm text-slate-400">
        {isHolding ? `Release at ${(target / 1000).toFixed(3)}` : result === 'fail' ? `${displayTime}s - Too ${elapsed > target ? 'long' : 'short'}` : 'Hold and release'}
      </p>
    </div>
  );
};
