import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { soundManager } from '../../../lib/sounds';

const COLORS = [
  { id: 'r', bg: '#EF4444', label: 'Red',   flash: '#FCA5A5' },
  { id: 'b', bg: '#3B82F6', label: 'Blue',  flash: '#93C5FD' },
  { id: 'g', bg: '#10B981', label: 'Green', flash: '#6EE7B7' },
  { id: 'y', bg: '#F59E0B', label: 'Yellow',flash: '#FCD34D' },
];

export const SimonTask = ({ task, onSuccess, onFail }) => {
  const sequenceLen = task.config?.sequence_length ?? 4;
  const flashMs     = task.config?.flash_ms         ?? 420;
  const gapMs       = task.config?.gap_ms            ?? 160;

  const [phase, setPhase]         = useState('idle');
  const [sequence, setSequence]   = useState([]);
  const [lit, setLit]             = useState(null);
  const [inputIndex, setInputIndex] = useState(0);
  const [result, setResult]       = useState(null);
  const seqRef = useRef([]);

  const playSequence = useCallback((seq) => {
    setPhase('playing');
    seq.forEach((colorId, i) => {
      setTimeout(() => setLit(colorId), i * (flashMs + gapMs));
      setTimeout(() => setLit(null),    i * (flashMs + gapMs) + flashMs);
    });
    setTimeout(() => {
      setPhase('input');
      setInputIndex(0);
    }, seq.length * (flashMs + gapMs) + 200);
  }, [flashMs, gapMs]);

  const startGame = useCallback(() => {
    const seq = Array.from({ length: sequenceLen }, () =>
      COLORS[Math.floor(Math.random() * COLORS.length)].id
    );
    seqRef.current = seq;
    setSequence(seq);
    setResult(null);
    playSequence(seq);
  }, [sequenceLen, playSequence]);

  const handleTap = useCallback((colorId) => {
    if (phase !== 'input') return;
    soundManager.playClick();
    if (colorId === seqRef.current[inputIndex]) {
      const next = inputIndex + 1;
      if (next >= seqRef.current.length) {
        soundManager.playSuccess();
        setResult('success');
        setPhase('result');
        setTimeout(() => { onSuccess(); setPhase('idle'); setResult(null); }, 900);
      } else {
        setInputIndex(next);
      }
    } else {
      soundManager.playFail();
      setResult('fail');
      setPhase('result');
      setTimeout(() => { onFail(); setPhase('idle'); setResult(null); }, 700);
    }
  }, [phase, inputIndex, onSuccess, onFail]);

  return (
    <div className="flex flex-col items-center justify-center gap-5 w-full select-none" data-testid="simon-task">
      <p className="text-center" style={{ color: 'var(--fg-muted)', fontSize: '0.9rem' }}>
        {task.instruction}
      </p>

      {/* 2×2 color grid */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
        {COLORS.map(({ id, bg, flash, label }) => (
          <motion.button
            key={id}
            className="rounded-2xl flex items-center justify-center font-bold text-white"
            style={{
              height: 110,
              background: lit === id ? flash : bg,
              opacity: phase === 'input' ? 1 : (phase === 'playing' ? 0.7 : 0.5),
              boxShadow: lit === id ? `0 0 28px ${flash}` : 'none',
              transition: 'background 0.05s, box-shadow 0.05s',
              cursor: phase === 'input' ? 'pointer' : 'default',
            }}
            onClick={() => handleTap(id)}
            whileTap={phase === 'input' ? { scale: 0.94 } : {}}
            aria-label={label}
          >
            {label}
          </motion.button>
        ))}
      </div>

      {phase === 'idle' && (
        <motion.button
          className="px-8 py-3 rounded-full text-white font-bold"
          style={{ background: 'var(--brand-primary)' }}
          onClick={startGame}
          whileTap={{ scale: 0.94 }}
        >
          WATCH & REPEAT
        </motion.button>
      )}

      {phase === 'result' && (
        <p style={{
          color: result === 'success' ? '#10B981' : '#EF4444',
          fontWeight: 800,
          fontSize: '1.1rem',
        }}>
          {result === 'success' ? '🧠 Perfect memory!' : '✗ Wrong sequence'}
        </p>
      )}

      <p style={{ color: 'var(--fg-muted)', fontSize: '0.75rem' }}>
        {phase === 'idle'    ? `${sequenceLen} flashes. Reproduce the exact order.` :
         phase === 'playing' ? 'Watch carefully…' :
         phase === 'input'   ? `Tap ${inputIndex + 1} / ${sequenceLen}` : ''}
      </p>
    </div>
  );
};
