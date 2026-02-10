import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { soundManager } from '../../../lib/sounds';

export const ZeroScoreTask = ({ task, onSuccess, onFail }) => {
  const [score, setScore] = useState(0);
  const [result, setResult] = useState(null);

  const handleAdd = useCallback(() => {
    if (result) return;
    soundManager.playClick();
    setScore(s => s + 1);
  }, [result]);

  const handleSubtract = useCallback(() => {
    if (result) return;
    soundManager.playClick();
    setScore(s => Math.max(-10, s - 1));
  }, [result]);

  const handleFinish = useCallback(() => {
    soundManager.playClick();
    if (score === 0) {
      setResult('success');
      soundManager.playSuccess();
      setTimeout(() => { onSuccess(); setScore(0); setResult(null); }, 800);
    } else {
      setResult('fail');
      soundManager.playFail();
      setTimeout(() => { onFail(); setResult(null); }, 500);
    }
  }, [score, onSuccess, onFail]);

  return (
    <div className="flex flex-col items-center justify-center gap-8 w-full" data-testid="zero-score-task">
      <p className="text-lg text-slate-600 text-center">{task.instruction}</p>
      <div className="font-mono text-5xl font-bold text-slate-900" data-testid="zero-score-value">Score: {score}</div>
      <div className="flex gap-4">
        <motion.button className="px-6 py-3 rounded-xl bg-slate-800 text-white font-semibold touch-target" onClick={handleAdd} whileTap={{ scale: 0.95 }}>+1</motion.button>
        <motion.button className="px-6 py-3 rounded-xl bg-slate-800 text-white font-semibold touch-target" onClick={handleSubtract} whileTap={{ scale: 0.95 }}>−1</motion.button>
      </div>
      <motion.button
        className="px-8 py-4 rounded-xl font-bold touch-target"
        style={{ backgroundColor: result === 'success' ? '#10B981' : result === 'fail' ? '#EF4444' : '#0F172A', color: 'white' }}
        onClick={handleFinish}
        data-testid="zero-score-finish"
      >
        Finish
      </motion.button>
      <p className="font-mono text-sm text-slate-400">Get to 0 and press Finish</p>
    </div>
  );
};
