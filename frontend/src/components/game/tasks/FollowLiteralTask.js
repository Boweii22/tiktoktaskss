import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { soundManager } from '../../../lib/sounds';

export const FollowLiteralTask = ({ task, onSuccess, onFail }) => {
  const [result, setResult] = useState(null);
  const correctLabel = task.config?.correct_label || 'Smaller';
  const wrongLabel = task.config?.wrong_label || 'Bigger';

  const handleTap = useCallback((which) => {
    soundManager.playClick();
    if (which === correctLabel) {
      setResult('success');
      soundManager.playSuccess();
      setTimeout(() => { onSuccess(); setResult(null); }, 800);
    } else {
      setResult('fail');
      soundManager.playFail();
      setTimeout(() => { onFail(); setResult(null); }, 500);
    }
  }, [correctLabel, onSuccess, onFail]);

  return (
    <div className="flex flex-col items-center justify-center gap-8 w-full" data-testid="follow-literal-task">
      <p className="text-lg text-slate-600 text-center" style={{ color: 'var(--fg-default)' }}>{task.instruction}</p>
      <p className="text-xl font-semibold text-center" style={{ color: 'var(--fg-muted)' }}>Do exactly what the instruction says</p>
      <div className="flex gap-6 items-end">
        <motion.button
          className="px-8 py-6 rounded-2xl font-semibold touch-target bg-slate-700 text-white"
          style={{
            backgroundColor: result === 'success' ? '#10B981' : result === 'fail' ? '#EF4444' : 'var(--bg-subtle)',
            color: 'var(--fg-inverse)'
          }}
          onClick={() => handleTap(correctLabel)}
          data-testid="literal-correct"
        >
          {correctLabel}
        </motion.button>
        <motion.button
          className="px-10 py-8 rounded-2xl font-semibold touch-target bg-slate-800 text-white"
          style={{
            backgroundColor: result === 'success' ? '#10B981' : result === 'fail' ? '#EF4444' : 'var(--bg-subtle)',
            color: 'var(--fg-inverse)'
          }}
          onClick={() => handleTap(wrongLabel)}
          data-testid="literal-wrong"
        >
          {wrongLabel}
        </motion.button>
      </div>
    </div>
  );
};
