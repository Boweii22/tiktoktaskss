import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { soundManager } from '../../../lib/sounds';

const COLORS = [
  { name: 'RED',    hex: '#EF4444' },
  { name: 'BLUE',   hex: '#3B82F6' },
  { name: 'GREEN',  hex: '#10B981' },
  { name: 'YELLOW', hex: '#F59E0B' },
];

function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

function genRound() {
  // Word says one color, is displayed in a DIFFERENT color
  const word  = COLORS[Math.floor(Math.random() * COLORS.length)];
  let ink;
  do { ink = COLORS[Math.floor(Math.random() * COLORS.length)]; } while (ink.name === word.name);
  // Shuffle the 4 button options
  const buttons = shuffle(COLORS);
  return { word, ink, buttons, correct: ink.name }; // tap the INK color
}

export const StroopTask = ({ task, onSuccess, onFail }) => {
  const rounds = task.config?.rounds ?? 4;

  const [phase, setPhase]    = useState('idle');
  const [round, setRound]    = useState(null);
  const [current, setCurrent] = useState(0);
  const [result, setResult]  = useState(null);
  const [flash, setFlash]    = useState(null);

  const nextRound = useCallback((idx) => {
    setRound(genRound());
    setCurrent(idx);
    setFlash(null);
  }, []);

  const startGame = useCallback(() => {
    setResult(null);
    setPhase('playing');
    nextRound(0);
  }, [nextRound]);

  const handleTap = useCallback((colorName) => {
    if (phase !== 'playing' || !round) return;
    if (colorName === round.correct) {
      soundManager.playClick();
      setFlash('success');
      setTimeout(() => {
        const next = current + 1;
        if (next >= rounds) {
          soundManager.playSuccess();
          setResult('success');
          setPhase('result');
          setTimeout(() => { onSuccess(); setPhase('idle'); setResult(null); }, 900);
        } else {
          nextRound(next);
        }
      }, 140);
    } else {
      soundManager.playFail();
      setFlash('fail');
      setResult('fail');
      setPhase('result');
      setTimeout(() => { onFail(); setPhase('idle'); setResult(null); setFlash(null); }, 700);
    }
  }, [phase, round, current, rounds, nextRound, onSuccess, onFail]);

  return (
    <div className="flex flex-col items-center justify-center gap-6 w-full select-none" data-testid="stroop-task">
      <p className="text-center" style={{ color: 'var(--fg-muted)', fontSize: '0.9rem' }}>
        {task.instruction}
      </p>

      {phase === 'idle' && (
        <motion.button
          className="px-8 py-3 rounded-full text-white font-bold"
          style={{ background: 'var(--brand-primary)' }}
          onClick={startGame}
          whileTap={{ scale: 0.94 }}
        >
          BEGIN
        </motion.button>
      )}

      {phase === 'playing' && round && (
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            className="flex flex-col items-center gap-5"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.15 }}
          >
            {/* The word displayed in a misleading ink color */}
            <div
              className="px-8 py-4 rounded-2xl"
              style={{
                background: flash === 'success' ? 'rgba(16,185,129,0.15)' : flash === 'fail' ? 'rgba(239,68,68,0.15)' : 'var(--bg-subtle)',
                border: '1px solid rgba(128,128,128,0.15)',
                transition: 'background 0.1s',
              }}
            >
              <span style={{ fontSize: '2.8rem', fontWeight: 900, color: round.ink.hex, letterSpacing: 2 }}>
                {round.word.name}
              </span>
            </div>

            {/* Color buttons */}
            <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
              {round.buttons.map(({ name, hex }) => (
                <motion.button
                  key={name}
                  className="py-3 rounded-xl font-bold text-white text-sm"
                  style={{ background: hex }}
                  onClick={() => handleTap(name)}
                  whileTap={{ scale: 0.92 }}
                >
                  {name}
                </motion.button>
              ))}
            </div>

            <p style={{ color: 'var(--fg-muted)', fontSize: '0.72rem' }}>
              Round {current + 1} / {rounds}
            </p>
          </motion.div>
        </AnimatePresence>
      )}

      {phase === 'result' && (
        <p style={{
          color: result === 'success' ? '#10B981' : '#EF4444',
          fontWeight: 800,
          fontSize: '1.1rem',
        }}>
          {result === 'success' ? '🧠 Brain beaten!' : '✗ Your brain lied to you'}
        </p>
      )}

      {phase === 'idle' && (
        <p style={{ color: 'var(--fg-muted)', fontSize: '0.75rem', textAlign: 'center' }}>
          Tap the color the word is WRITTEN IN — not what it says
        </p>
      )}
    </div>
  );
};
