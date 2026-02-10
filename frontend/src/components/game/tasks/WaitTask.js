import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { soundManager } from '../../../lib/sounds';

export const WaitTask = ({ task, onSuccess, onFail }) => {
  const [waiting, setWaiting] = useState(false);
  const [waitTime, setWaitTime] = useState(0);
  const [targetTime, setTargetTime] = useState(0);
  const [showButton, setShowButton] = useState(false);
  const [result, setResult] = useState(null);
  
  const timeoutRef = useRef(null);
  const intervalRef = useRef(null);
  
  const minWait = task.config?.min_wait || 3000;
  const maxWait = task.config?.max_wait || 8000;

  const startWaiting = useCallback(() => {
    // Generate random wait time
    const target = Math.floor(Math.random() * (maxWait - minWait)) + minWait;
    setTargetTime(target);
    setWaiting(true);
    setWaitTime(0);
    
    // Start counting
    intervalRef.current = setInterval(() => {
      setWaitTime(prev => prev + 100);
    }, 100);
    
    // Show button after target time
    timeoutRef.current = setTimeout(() => {
      setShowButton(true);
      soundManager.playClick();
    }, target);
  }, [minWait, maxWait]);

  useEffect(() => {
    return () => {
      clearTimeout(timeoutRef.current);
      clearInterval(intervalRef.current);
    };
  }, []);

  const handlePrematureTap = useCallback(() => {
    if (showButton) return; // Button is visible, this is a valid tap
    
    soundManager.playFail();
    setResult('fail');
    clearTimeout(timeoutRef.current);
    clearInterval(intervalRef.current);
    
    setTimeout(() => {
      onFail();
      setWaiting(false);
      setShowButton(false);
      setResult(null);
    }, 500);
  }, [showButton, onFail]);

  const handleSuccessTap = useCallback(() => {
    soundManager.playSuccess();
    setResult('success');
    clearInterval(intervalRef.current);
    
    setTimeout(() => {
      onSuccess();
      setWaiting(false);
      setShowButton(false);
      setResult(null);
    }, 800);
  }, [onSuccess]);

  return (
    <div 
      className="flex flex-col items-center justify-center gap-8 w-full h-full"
      onClick={waiting && !showButton ? handlePrematureTap : undefined}
      data-testid="wait-task"
    >
      <p className="text-lg text-slate-600 text-center">{task.instruction}</p>
      
      {!waiting ? (
        <motion.button
          className="w-40 h-40 rounded-full bg-slate-900 text-white font-semibold touch-target"
          onClick={startWaiting}
          whileTap={{ scale: 0.95 }}
          data-testid="start-wait-button"
        >
          Start
        </motion.button>
      ) : (
        <div className="flex flex-col items-center gap-4">
          {/* Waiting indicator */}
          <motion.div
            className="w-40 h-40 rounded-full flex items-center justify-center"
            style={{
              backgroundColor: result === 'success' ? '#10B981' : result === 'fail' ? '#EF4444' : '#F1F5F9',
              border: '2px solid',
              borderColor: result === 'success' ? '#10B981' : result === 'fail' ? '#EF4444' : '#E2E8F0'
            }}
            animate={!showButton && !result ? { scale: [1, 1.02, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
            data-testid="waiting-indicator"
          >
            {showButton ? (
              <motion.button
                className="w-full h-full rounded-full bg-emerald-500 text-white font-bold text-lg touch-target"
                onClick={handleSuccessTap}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileTap={{ scale: 0.95 }}
                data-testid="success-button"
              >
                TAP!
              </motion.button>
            ) : (
              <span className="font-mono text-slate-400 text-sm">
                {(waitTime / 1000).toFixed(1)}s
              </span>
            )}
          </motion.div>
        </div>
      )}
      
      <p className="font-mono text-sm text-slate-400">
        {result === 'fail' ? 'Too early! Patience.' : waiting && !showButton ? "Don't touch the screen" : 'Tap when ready'}
      </p>
    </div>
  );
};
