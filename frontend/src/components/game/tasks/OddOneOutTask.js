import React, { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { soundManager } from '../../../lib/sounds';

const COLORS = ['#3B82F6', '#3B82F6', '#3B82F6', '#EF4444', '#22C55E', '#F59E0B', '#8B5CF6'];

export const OddOneOutTask = ({ task, onSuccess, onFail }) => {
  const [result, setResult] = useState(null);
  const count = task.config?.count || 4;

  const { options, correctIndex } = useMemo(() => {
    const correct = Math.floor(Math.random() * count);
    const options = Array(count).fill(COLORS[0]);
    options[correct] = COLORS[1 + Math.floor(Math.random() * (COLORS.length - 1))];
    return { options, correctIndex: correct };
  }, [count]);

  const handleTap = useCallback(
    (index) => {
      soundManager.playClick();
      if (index === correctIndex) {
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
    },
    [correctIndex, onSuccess, onFail]
  );


  return (
    <div className="flex flex-col items-center justify-center gap-8 w-full" data-testid="odd-one-out-task">
      <p className="text-lg text-slate-600 text-center">{task.instruction}</p>
      <div className="grid grid-cols-2 gap-4 w-64">
        {options.map((color, i) => (
          <motion.button
            key={i}
            className="w-full aspect-square rounded-2xl touch-target flex items-center justify-center"
            style={{
              backgroundColor: result === 'success' ? '#10B981' : result === 'fail' && i === correctIndex ? '#10B981' : result === 'fail' ? '#EF4444' : color
            }}
            onClick={() => handleTap(i)}
            whileTap={{ scale: 0.95 }}
            data-testid={`odd-button-${i}`}
          />
        ))}
      </div>
      <p className="font-mono text-sm text-slate-400">
        {result === 'fail' ? 'One circle had a different color' : 'Find the odd one'}
      </p>
    </div>
  );
};
