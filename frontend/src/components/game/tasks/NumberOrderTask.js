import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { soundManager } from '../../../lib/sounds';

function seeded(n) {
  const positions = [];
  const taken = new Set();
  while (positions.length < n) {
    const x = 5 + Math.random() * 85;
    const y = 5 + Math.random() * 85;
    const key = `${Math.round(x / 12)},${Math.round(y / 12)}`;
    if (!taken.has(key)) { taken.add(key); positions.push({ x, y }); }
  }
  return positions;
}

export const NumberOrderTask = ({ task, onSuccess, onFail }) => {
  const count     = task.config?.count       ?? 7;
  const tinyIndex = task.config?.tiny_index  ?? -1; // -1 = random

  const [phase, setPhase]   = useState('idle');
  const [next, setNext]     = useState(1);
  const [tapped, setTapped] = useState([]);
  const [result, setResult] = useState(null);
  const [numbers, setNumbers] = useState([]);

  const generate = useCallback(() => {
    const pos = seeded(count);
    const tiny = tinyIndex >= 0 ? tinyIndex : Math.floor(Math.random() * count);
    const nums = pos.map((p, i) => ({
      value: i + 1,
      x: p.x,
      y: p.y,
      tiny: i === tiny,
    }));
    setNumbers(nums);
    setNext(1);
    setTapped([]);
    setResult(null);
    setPhase('playing');
  }, [count, tinyIndex]);

  const handleTap = useCallback((value) => {
    if (phase !== 'playing') return;
    if (value !== next) {
      soundManager.playFail();
      setResult('fail');
      setPhase('result');
      setTimeout(() => { onFail(); setPhase('idle'); setResult(null); }, 800);
      return;
    }
    soundManager.playClick();
    setTapped(t => [...t, value]);
    const nextVal = next + 1;
    if (nextVal > count) {
      soundManager.playSuccess();
      setResult('success');
      setPhase('result');
      setTimeout(() => { onSuccess(); setPhase('idle'); setResult(null); }, 900);
    } else {
      setNext(nextVal);
    }
  }, [phase, next, count, onSuccess, onFail]);

  return (
    <div className="flex flex-col items-center justify-center gap-4 w-full select-none" data-testid="number-order-task">
      <p className="text-center" style={{ color: 'var(--fg-muted)', fontSize: '0.9rem' }}>
        {task.instruction}
      </p>

      <div
        className="relative w-full rounded-2xl overflow-hidden"
        style={{ height: 260, background: 'var(--bg-subtle)', border: '1px solid rgba(128,128,128,0.15)' }}
      >
        {phase === 'idle' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.button
              className="px-8 py-3 rounded-full text-white font-bold"
              style={{ background: 'var(--brand-primary)' }}
              onClick={generate}
              whileTap={{ scale: 0.94 }}
            >
              SHOW NUMBERS
            </motion.button>
          </div>
        )}

        {(phase === 'playing' || phase === 'result') && numbers.map((n) => {
          const done = tapped.includes(n.value);
          return (
            <motion.button
              key={n.value}
              className="absolute rounded-full flex items-center justify-center font-bold text-white"
              style={{
                left: `${n.x}%`,
                top:  `${n.y}%`,
                width:  n.tiny ? 18 : 40,
                height: n.tiny ? 18 : 40,
                fontSize: n.tiny ? '0.5rem' : '0.95rem',
                transform: 'translate(-50%, -50%)',
                background: done
                  ? 'rgba(16,185,129,0.6)'
                  : phase === 'result' && !done
                  ? 'rgba(239,68,68,0.5)'
                  : 'var(--brand-primary)',
                opacity: done ? 0.5 : 1,
                cursor: phase === 'playing' && !done ? 'pointer' : 'default',
                transition: 'background 0.15s',
              }}
              onClick={() => handleTap(n.value)}
              whileTap={phase === 'playing' ? { scale: 0.85 } : {}}
            >
              {n.value}
            </motion.button>
          );
        })}

        {phase === 'result' && (
          <div className="absolute bottom-2 inset-x-0 flex justify-center">
            <p style={{
              color: result === 'success' ? '#10B981' : '#EF4444',
              fontWeight: 800,
              fontSize: '1rem',
            }}>
              {result === 'success' ? '🔢 Perfect order!' : `✗ Tapped ${next} — needed ${next}`}
            </p>
          </div>
        )}
      </div>

      <p style={{ color: 'var(--fg-muted)', fontSize: '0.75rem' }}>
        {phase === 'idle'    ? `${count} numbers scattered. One is tiny. Tap 1 → ${count} in order.` :
         phase === 'playing' ? `Tap next: ${next}` : ''}
      </p>
    </div>
  );
};
