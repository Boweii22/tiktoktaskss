import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { soundManager } from '../../../lib/sounds';

export const MultipleChoiceTask = ({ task, onSuccess, onFail }) => {
  const [result, setResult] = useState(null);
  const options = task.config?.options || ['A', 'B', 'C'];
  const correctIndex = Math.min(task.config?.correct_index ?? 0, options.length - 1);

  const handleTap = useCallback((index) => {
    soundManager.playClick();
    if (index === correctIndex) {
      setResult('success');
      soundManager.playSuccess();
      setTimeout(() => { onSuccess(); setResult(null); }, 800);
    } else {
      setResult('fail');
      soundManager.playFail();
      setTimeout(() => { onFail(); setResult(null); }, 500);
    }
  }, [correctIndex, onSuccess, onFail]);

  return (
    <div className="flex flex-col items-center justify-center gap-8 w-full" data-testid="multiple-choice-task">
      <p className="text-lg text-center max-w-md" style={{ color: 'var(--fg-default)' }}>{task.instruction}</p>
      <div className="flex flex-col gap-4 w-full max-w-xs">
        {options.map((opt, i) => (
          <motion.button
            key={i}
            className="w-full px-6 py-4 rounded-xl font-semibold touch-target text-left"
            style={{
              backgroundColor: result === 'success' && i === correctIndex ? '#10B981' : result === 'fail' && i === correctIndex ? '#10B981' : result === 'fail' ? '#EF4444' : 'var(--bg-subtle)',
              color: result === 'success' && i === correctIndex ? 'white' : result === 'fail' && i === correctIndex ? 'white' : 'var(--fg-default)'
            }}
            onClick={() => handleTap(i)}
            whileTap={{ scale: 0.98 }}
          >
            {opt}
          </motion.button>
        ))}
      </div>
    </div>
  );
};
