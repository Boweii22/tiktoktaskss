import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { soundManager } from '../../../lib/sounds';

export const MisleadingTask = ({ task, onSuccess, onFail }) => {
  const [result, setResult] = useState(null);
  
  // The instruction says "Tap the blue button" but blue button fails
  // The correct answer is the red button (which is labeled "blue" in text)
  const correctAction = task.config?.correct_action || 'red';

  const handleTap = useCallback((color) => {
    soundManager.playClick();
    
    // The "correct" button is the RED one, not the blue one
    // Instruction says "Tap the blue button" - this is misleading
    if (color === correctAction) {
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
  }, [correctAction, onSuccess, onFail]);

  return (
    <div className="flex flex-col items-center justify-center gap-8 w-full" data-testid="misleading-task">
      <p className="text-lg text-slate-600 text-center">{task.instruction}</p>
      
      <div className="flex gap-6">
        {/* Blue colored button - this is the WRONG answer despite instruction */}
        <motion.button
          className="w-28 h-28 rounded-2xl touch-target flex items-center justify-center text-white font-semibold"
          style={{ backgroundColor: result === 'fail' ? '#EF4444' : '#3B82F6' }}
          onClick={() => handleTap('blue')}
          whileTap={{ scale: 0.95 }}
          data-testid="blue-button"
        >
          Blue
        </motion.button>
        
        {/* Red colored button with text "Blue" - this is the CORRECT answer */}
        <motion.button
          className="w-28 h-28 rounded-2xl touch-target flex items-center justify-center text-white font-semibold"
          style={{ backgroundColor: result === 'success' ? '#10B981' : '#EF4444' }}
          onClick={() => handleTap('red')}
          whileTap={{ scale: 0.95 }}
          data-testid="red-button"
        >
          Blue
        </motion.button>
      </div>
      
      <p className="font-mono text-sm text-slate-400">
        {result === 'fail' ? 'Read more carefully' : 'Follow the instruction'}
      </p>
    </div>
  );
};
