import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { soundManager } from '../../../lib/sounds';

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

export const CountFlashTask = ({ task, onSuccess, onFail }) => {
  const flashMs  = task.config?.flash_ms ?? 110;
  const gapMs    = task.config?.gap_ms   ?? 85;
  const minCount = task.config?.min_count ?? 5;
  const maxCount = task.config?.max_count ?? 13;

  const [phase, setPhase]       = useState('idle');
  const [visible, setVisible]   = useState(false);
  const [answer, setAnswer]     = useState(null);
  const [typed, setTyped]       = useState('');
  const [result, setResult]     = useState(null);
  const countRef = useRef(0);

  const startGame = useCallback(() => {
    const count = rand(minCount, maxCount);
    countRef.current = count;
    setAnswer(count);
    setTyped('');
    setResult(null);
    setPhase('flashing');

    let shown = 0;
    const flash = () => {
      if (shown >= count) { setTimeout(() => setPhase('guess'), gapMs + 200); return; }
      setVisible(true);
      setTimeout(() => {
        setVisible(false);
        shown++;
        setTimeout(flash, gapMs);
      }, flashMs);
    };
    setTimeout(flash, 400);
  }, [minCount, maxCount, flashMs, gapMs]);

  const handleKey = useCallback((key) => {
    if (phase !== 'guess') return;
    if (key === 'Backspace') { setTyped(t => t.slice(0, -1)); return; }
    if (key === 'Enter') {
      if (!typed) return;
      const guess = parseInt(typed, 10);
      if (guess === answer) {
        soundManager.playSuccess();
        setResult('success');
        setPhase('result');
        setTimeout(() => { onSuccess(); setPhase('idle'); setResult(null); setTyped(''); }, 900);
      } else {
        soundManager.playFail();
        setResult('fail');
        setPhase('result');
        setTimeout(() => { onFail(); setPhase('idle'); setResult(null); setTyped(''); }, 700);
      }
      return;
    }
    if (/^\d$/.test(key) && typed.length < 2) setTyped(t => t + key);
  }, [phase, typed, answer, onSuccess, onFail]);

  useEffect(() => {
    const handler = (e) => handleKey(e.key);
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleKey]);

  return (
    <div className="flex flex-col items-center justify-center gap-5 w-full select-none" data-testid="count-flash-task">
      <p className="text-center" style={{ color: 'var(--fg-muted)', fontSize: '0.9rem' }}>
        {task.instruction}
      </p>

      {/* Flash arena */}
      <div
        className="relative w-full rounded-2xl flex items-center justify-center"
        style={{ height: 180, background: 'var(--bg-subtle)', border: '1px solid rgba(128,128,128,0.15)' }}
      >
        <AnimatePresence>
          {visible && (
            <motion.div
              key={Math.random()}
              className="w-16 h-16 rounded-full"
              style={{ background: 'var(--brand-accent)', boxShadow: '0 0 32px var(--brand-accent)' }}
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
              transition={{ duration: 0.06 }}
            />
          )}
        </AnimatePresence>
        {phase === 'idle' && (
          <motion.button
            className="px-8 py-3 rounded-full text-white font-bold"
            style={{ background: 'var(--brand-primary)' }}
            onClick={startGame}
            whileTap={{ scale: 0.94 }}
          >
            START
          </motion.button>
        )}
        {phase === 'flashing' && !visible && (
          <p style={{ color: 'var(--fg-muted)', fontSize: '0.8rem', position: 'absolute' }}>counting…</p>
        )}
      </div>

      {/* Number input */}
      {phase === 'guess' && (
        <motion.div
          className="flex flex-col items-center gap-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p style={{ color: 'var(--fg-default)', fontWeight: 700 }}>How many flashes?</p>
          <div
            className="w-28 h-16 rounded-xl flex items-center justify-center text-3xl font-mono font-bold"
            style={{ background: 'var(--bg-subtle)', color: 'var(--fg-default)', border: '2px solid var(--brand-accent)' }}
          >
            {typed || '?'}
          </div>
          {/* Number pad */}
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: 15 }, (_, i) => i + 1).map(n => (
              <motion.button
                key={n}
                className="w-11 h-11 rounded-xl font-bold text-sm flex items-center justify-center"
                style={{ background: 'var(--bg-subtle)', color: 'var(--fg-default)', border: '1px solid rgba(128,128,128,0.2)' }}
                onClick={() => handleKey(String(n))}
                whileTap={{ scale: 0.88 }}
              >
                {n}
              </motion.button>
            ))}
          </div>
          <motion.button
            className="px-8 py-2.5 rounded-full text-white font-bold"
            style={{ background: typed ? 'var(--brand-primary)' : 'rgba(128,128,128,0.3)', opacity: typed ? 1 : 0.5 }}
            onClick={() => handleKey('Enter')}
            whileTap={{ scale: 0.94 }}
          >
            CONFIRM {typed}
          </motion.button>
        </motion.div>
      )}

      {phase === 'result' && (
        <p style={{
          color: result === 'success' ? '#10B981' : '#EF4444',
          fontWeight: 800,
          fontSize: '1.1rem',
        }}>
          {result === 'success' ? `✓ Exactly ${answer}!` : `✗ It was ${answer}`}
        </p>
      )}
    </div>
  );
};
