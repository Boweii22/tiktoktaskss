import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { soundManager } from '../../../lib/sounds';

export const FollowLiteralTask = ({ task, onSuccess, onFail }) => {
  const [result, setResult] = useState(null);
  const instruction = 'Tap the smaller button.';
  const correctChoice = 'smaller';

  const handleTap = useCallback((which) => {
    soundManager.playClick();
    if (which === correctChoice) {
      setResult('success');
      soundManager.playSuccess();
      setTimeout(() => { onSuccess(); setResult(null); }, 800);
    } else {
      setResult('fail');
      soundManager.playFail();
      setTimeout(() => { onFail(); setResult(null); }, 500);
    }
  }, [onSuccess, onFail]);

  return (
    <div className="flex flex-col items-center justify-center gap-8 w-full" data-testid="follow-literal-task">
      <p className="text-lg text-slate-600 text-center">{task.instruction}</p>
      <p className="text-xl font-semibold text-slate-800">“{instruction}”</p>
      <div className="flex gap-6 items-end">
        <motion.button
          className="px-8 py-6 rounded-2xl font-semibold touch-target bg-slate-700 text-white"
          style={{
            backgroundColor: result === 'success' ? '#10B981' : result === 'fail' ? '#EF4444' : '#475569'
          }}
          onClick={() => handleTap('smaller')}
          data-testid="literal-smaller"
        >
          Smaller
        </motion.button>
        <motion.button
          className="px-10 py-8 rounded-2xl font-semibold touch-target bg-slate-800 text-white"
          style={{ backgroundColor: '#334155' }}
          onClick={() => handleTap('bigger')}
          data-testid="literal-bigger"
        >
          Bigger
        </motion.button>
      </div>
      <p className="font-mono text-sm text-slate-400">Do exactly what the instruction says</p>
    </div>
  );
};
