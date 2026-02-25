import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { soundManager } from '../../../lib/sounds';

const DIRECTIONS = ['left', 'right', 'up', 'down'];
const ARROWS = { left: '←', right: '→', up: '↑', down: '↓' };
const OPPOSITES = { left: 'right', right: 'left', up: 'down', down: 'up' };

function randomDir() { return DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)]; }

export const MirrorTask = ({ task, onSuccess, onFail }) => {
  const rounds = task.config?.rounds ?? 4;
  const timePerRound = task.config?.time_per_round ?? 1800;

  const [phase, setPhase] = useState('idle'); // idle | showing | result
  const [currentRound, setCurrentRound] = useState(0);
  const [arrows, setArrows] = useState([]);
  const [result, setResult] = useState(null);
  const [flash, setFlash] = useState(null);

  const touchStart = useRef(null);
  const timerRef = useRef(null);

  const startGame = useCallback(() => {
    const generated = Array.from({ length: rounds }, randomDir);
    setArrows(generated);
    setCurrentRound(0);
    setPhase('showing');
    setResult(null);
    setFlash(null);
  }, [rounds]);

  // Auto-fail if no swipe within timePerRound
  useEffect(() => {
    if (phase !== 'showing') return;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      soundManager.playFail();
      setResult('fail');
      setPhase('result');
      setTimeout(() => { onFail(); setPhase('idle'); setResult(null); }, 700);
    }, timePerRound);
    return () => clearTimeout(timerRef.current);
  }, [phase, currentRound, timePerRound, onFail]);

  const handleSwipe = useCallback((dir) => {
    if (phase !== 'showing') return;
    clearTimeout(timerRef.current);
    const expected = OPPOSITES[arrows[currentRound]];
    if (dir === expected) {
      soundManager.playClick();
      setFlash('success');
      setTimeout(() => setFlash(null), 180);
      const next = currentRound + 1;
      if (next >= rounds) {
        soundManager.playSuccess();
        setResult('success');
        setPhase('result');
        setTimeout(() => { onSuccess(); setPhase('idle'); setResult(null); }, 900);
      } else {
        setCurrentRound(next);
      }
    } else {
      soundManager.playFail();
      setFlash('fail');
      setResult('fail');
      setPhase('result');
      setTimeout(() => { onFail(); setPhase('idle'); setResult(null); setFlash(null); }, 700);
    }
  }, [phase, arrows, currentRound, rounds, onSuccess, onFail]);

  const onTouchStart = useCallback((e) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  }, []);

  const onTouchEnd = useCallback((e) => {
    if (!touchStart.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    touchStart.current = null;
    const absDx = Math.abs(dx), absDy = Math.abs(dy);
    if (absDx < 20 && absDy < 20) return;
    let dir;
    if (absDx > absDy) dir = dx > 0 ? 'right' : 'left';
    else dir = dy > 0 ? 'down' : 'up';
    handleSwipe(dir);
  }, [handleSwipe]);

  // Keyboard/mouse fallback for desktop
  const handleKeyDown = useCallback((e) => {
    const map = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' };
    if (map[e.key]) handleSwipe(map[e.key]);
  }, [handleSwipe]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const current = arrows[currentRound];

  return (
    <div
      className="flex flex-col items-center justify-center gap-6 w-full select-none"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      data-testid="mirror-task"
    >
      <p className="text-center" style={{ color: 'var(--fg-muted)', fontSize: '0.9rem' }}>
        {task.instruction}
      </p>

      {phase === 'idle' && (
        <motion.button
          className="w-44 h-44 rounded-full flex items-center justify-center text-xl font-bold text-white"
          style={{ background: 'var(--brand-primary)' }}
          onClick={startGame}
          whileTap={{ scale: 0.94 }}
        >
          START
        </motion.button>
      )}

      {phase === 'showing' && current && (
        <AnimatePresence mode="wait">
          <motion.div
            key={currentRound}
            className="flex flex-col items-center gap-4"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.4, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
          >
            <div
              className="w-48 h-48 rounded-3xl flex items-center justify-center"
              style={{
                background: flash === 'success' ? '#10B981' : flash === 'fail' ? '#EF4444' : 'var(--bg-subtle)',
                border: '2px solid rgba(128,128,128,0.2)',
                fontSize: '5rem',
                lineHeight: 1,
                transition: 'background 0.1s',
              }}
            >
              {ARROWS[current]}
            </div>
            <p style={{ color: 'var(--fg-muted)', fontSize: '0.8rem', fontWeight: 600 }}>
              Round {currentRound + 1} / {rounds}
            </p>
          </motion.div>
        </AnimatePresence>
      )}

      {phase === 'result' && (
        <motion.div
          className="w-48 h-48 rounded-3xl flex items-center justify-center text-white text-2xl font-bold"
          style={{ background: result === 'success' ? '#10B981' : '#EF4444' }}
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
        >
          {result === 'success' ? '🎉 PERFECT' : '✗ WRONG'}
        </motion.div>
      )}

      <p style={{ color: 'var(--fg-muted)', fontSize: '0.75rem' }}>
        {phase === 'idle' ? 'Swipe the OPPOSITE direction to the arrow' :
         phase === 'showing' ? 'Swipe opposite ↔ (keyboard arrows work too)' :
         result === 'fail' ? 'Your instincts betrayed you' : 'Brain mastery!'}
      </p>
    </div>
  );
};
