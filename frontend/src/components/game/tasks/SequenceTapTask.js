import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { soundManager } from '../../../lib/sounds';

export const SequenceTapTask = ({ task, onSuccess, onFail }) => {
  const [nextExpected, setNextExpected] = useState(1);
  const [result, setResult] = useState(null);
  const length = task.config?.length || 4;

  const handleTap = useCallback(
    (num) => {
      soundManager.playClick();
      if (num === nextExpected) {
        if (num === length) {
          setResult('success');
          soundManager.playSuccess();
          setTimeout(() => {
            onSuccess();
            setNextExpected(1);
            setResult(null);
          }, 800);
        } else {
          setNextExpected((prev) => prev + 1);
        }
      } else {
        setResult('fail');
        soundManager.playFail();
        setTimeout(() => {
          onFail();
          setNextExpected(1);
          setResult(null);
        }, 500);
      }
    },
    [nextExpected, length, onSuccess, onFail]
  );

  return (
    <div className="flex flex-col items-center justify-center gap-8 w-full" data-testid="sequence-tap-task">
      <p className="text-lg text-slate-600 text-center">{task.instruction}</p>
      <div className="flex gap-3 flex-wrap justify-center max-w-xs">
        {Array.from({ length }, (_, i) => i + 1).map((n) => (
          <motion.button
            key={n}
            className="w-16 h-16 rounded-xl touch-target flex items-center justify-center text-white font-bold text-xl"
            style={{
              backgroundColor:
                result === 'success'
                  ? '#10B981'
                  : result === 'fail'
                    ? '#EF4444'
                    : n < nextExpected
                      ? '#10B981'
                      : '#0F172A'
            }}
            onClick={() => handleTap(n)}
            whileTap={{ scale: 0.95 }}
            data-testid={`sequence-button-${n}`}
          >
            {n}
          </motion.button>
        ))}
      </div>
      <p className="font-mono text-sm text-slate-400">
        {result === 'fail' ? 'Wrong order — start over' : `Tap next: ${nextExpected}`}
      </p>
    </div>
  );
};
