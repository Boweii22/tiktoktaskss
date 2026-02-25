import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { soundManager } from '../../../lib/sounds';

export const TwoTapTask = ({ task, onSuccess, onFail }) => {
  const target    = task.config?.target_ms   ?? 2000;
  const tolerance = task.config?.tolerance_ms ?? 80;

  const [phase, setPhase]   = useState('idle'); // idle | waiting | result
  const [result, setResult] = useState(null);
  const [diff, setDiff]     = useState(null);
  const firstTapRef = useRef(null);

  const handleTap = useCallback(() => {
    if (phase === 'idle') {
      soundManager.playClick();
      firstTapRef.current = Date.now();
      setPhase('waiting');
      return;
    }
    if (phase === 'waiting') {
      soundManager.playClick();
      const elapsed = Date.now() - firstTapRef.current;
      const d = Math.abs(elapsed - target);
      setDiff(d);
      if (d <= tolerance) {
        soundManager.playSuccess();
        setResult('success');
        setPhase('result');
        setTimeout(() => { onSuccess(); setPhase('idle'); setResult(null); setDiff(null); }, 900);
      } else {
        soundManager.playFail();
        setResult('fail');
        setPhase('result');
        setTimeout(() => { onFail(); setPhase('idle'); setResult(null); setDiff(null); }, 700);
      }
    }
  }, [phase, target, tolerance, onSuccess, onFail]);

  const targetSec = (target / 1000).toFixed(1);

  return (
    <div className="flex flex-col items-center justify-center gap-8 w-full select-none" data-testid="two-tap-task">
      <p className="text-center" style={{ color: 'var(--fg-muted)', fontSize: '0.9rem' }}>
        {task.instruction}
      </p>

      <motion.button
        className="w-48 h-48 rounded-full flex items-center justify-center text-white font-bold text-xl"
        style={{
          background: phase === 'idle' ? 'var(--brand-primary)' :
                      phase === 'waiting' ? '#374151' :
                      result === 'success' ? '#10B981' : '#EF4444',
        }}
        onClick={handleTap}
        whileTap={{ scale: 0.93 }}
        animate={phase === 'waiting' ? { boxShadow: ['0 0 0 0 rgba(245,158,11,0)', '0 0 0 24px rgba(245,158,11,0.18)', '0 0 0 0 rgba(245,158,11,0)'] } : {}}
        transition={phase === 'waiting' ? { duration: 1.8, repeat: Infinity } : {}}
      >
        {phase === 'idle'    ? 'TAP 1' :
         phase === 'waiting' ? 'TAP 2' :
         result === 'success' ? '✓ PERFECT' : `✗ ${diff > 0 ? '+' : ''}${((Date.now() - (firstTapRef.current || 0)) - target > 0 ? '+' : '') }${diff}ms`}
      </motion.button>

      <p style={{ color: 'var(--fg-muted)', fontSize: '0.8rem', textAlign: 'center' }}>
        {phase === 'idle'    ? `First tap starts the clock. Second tap must land at exactly ${targetSec}s.` :
         phase === 'waiting' ? `Tap again at exactly ${targetSec}s — no clock shown` :
         result === 'success' ? `Off by ${diff}ms — within ±${tolerance}ms 🎯` :
         `Off by ${diff}ms — needed ±${tolerance}ms`}
      </p>
    </div>
  );
};
