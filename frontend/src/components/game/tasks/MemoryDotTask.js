import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { soundManager } from '../../../lib/sounds';

export const MemoryDotTask = ({ task, onSuccess, onFail }) => {
  const showMs   = task.config?.show_ms   ?? 900;
  const tolerancePx = task.config?.tolerance_px ?? 18;

  const [phase, setPhase] = useState('idle');   // idle | memorize | blank | result
  const [dotPos, setDotPos] = useState(null);   // {x,y} in %
  const [result, setResult] = useState(null);
  const [tapCircle, setTapCircle] = useState(null);
  const arenaRef = useRef(null);

  const startGame = useCallback(() => {
    const pad = 15;
    const x = pad + Math.random() * (100 - pad * 2);
    const y = pad + Math.random() * (100 - pad * 2);
    setDotPos({ x, y });
    setTapCircle(null);
    setResult(null);
    setPhase('memorize');

    setTimeout(() => setPhase('blank'), showMs);
  }, [showMs]);

  const handleTap = useCallback((e) => {
    if (phase !== 'blank') return;
    const rect = arenaRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const tapXpct = ((clientX - rect.left) / rect.width)  * 100;
    const tapYpct = ((clientY - rect.top)  / rect.height) * 100;

    // Convert tolerance from px to %
    const tolX = (tolerancePx / rect.width)  * 100;
    const tolY = (tolerancePx / rect.height) * 100;

    setTapCircle({ x: tapXpct, y: tapYpct });

    const dx = Math.abs(tapXpct - dotPos.x);
    const dy = Math.abs(tapYpct - dotPos.y);

    if (dx <= tolX && dy <= tolY) {
      soundManager.playSuccess();
      setResult('success');
      setPhase('result');
      setTimeout(() => { onSuccess(); setPhase('idle'); setResult(null); setTapCircle(null); }, 900);
    } else {
      soundManager.playFail();
      setResult('fail');
      setPhase('result');
      setTimeout(() => { onFail(); setPhase('idle'); setResult(null); setTapCircle(null); }, 700);
    }
  }, [phase, dotPos, tolerancePx, onSuccess, onFail]);

  return (
    <div className="flex flex-col items-center justify-center gap-4 w-full select-none" data-testid="memory-dot-task">
      <p className="text-center" style={{ color: 'var(--fg-muted)', fontSize: '0.9rem' }}>
        {task.instruction}
      </p>

      <div
        ref={arenaRef}
        className="relative w-full rounded-2xl overflow-hidden"
        style={{
          height: 280,
          background: 'var(--bg-subtle)',
          border: '1px solid rgba(128,128,128,0.15)',
          cursor: phase === 'blank' ? 'crosshair' : 'default',
        }}
        onClick={handleTap}
        onTouchEnd={handleTap}
      >
        {/* The memorise dot */}
        <AnimatePresence>
          {phase === 'memorize' && dotPos && (
            <motion.div
              key="dot"
              className="absolute rounded-full"
              style={{
                width: 24,
                height: 24,
                left: `calc(${dotPos.x}% - 12px)`,
                top:  `calc(${dotPos.y}% - 12px)`,
                background: '#f59e0b',
                boxShadow: '0 0 18px rgba(245,158,11,0.6)',
              }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            />
          )}
        </AnimatePresence>

        {/* Show correct position + tap circle on result */}
        {phase === 'result' && dotPos && (
          <>
            <div
              className="absolute rounded-full border-2"
              style={{
                width: tolerancePx * 2,
                height: tolerancePx * 2,
                left: `calc(${dotPos.x}% - ${tolerancePx}px)`,
                top:  `calc(${dotPos.y}% - ${tolerancePx}px)`,
                borderColor: '#10B981',
                opacity: 0.6,
              }}
            />
            <div
              className="absolute w-5 h-5 rounded-full"
              style={{
                left: `calc(${dotPos.x}% - 10px)`,
                top:  `calc(${dotPos.y}% - 10px)`,
                background: result === 'success' ? '#10B981' : '#EF4444',
              }}
            />
            {tapCircle && (
              <div
                className="absolute w-4 h-4 rounded-full border-2 border-white"
                style={{
                  left: `calc(${tapCircle.x}% - 8px)`,
                  top:  `calc(${tapCircle.y}% - 8px)`,
                  background: 'rgba(255,255,255,0.3)',
                }}
              />
            )}
          </>
        )}

        {/* Phase labels */}
        {phase === 'idle' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.button
              className="px-6 py-3 rounded-full text-white font-bold"
              style={{ background: 'var(--brand-primary)' }}
              onClick={startGame}
              whileTap={{ scale: 0.94 }}
            >
              TAP TO BEGIN
            </motion.button>
          </div>
        )}
        {phase === 'blank' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p style={{ color: 'var(--fg-muted)', fontSize: '0.85rem', fontWeight: 600 }}>
              Tap where the dot was
            </p>
          </div>
        )}
        {phase === 'result' && (
          <div
            className="absolute inset-0 flex items-center justify-end flex-col pb-4"
          >
            <p style={{
              color: result === 'success' ? '#10B981' : '#EF4444',
              fontWeight: 800,
              fontSize: '1.1rem',
            }}>
              {result === 'success' ? '🎯 Spot on!' : '✗ Off target'}
            </p>
          </div>
        )}
      </div>

      <p style={{ color: 'var(--fg-muted)', fontSize: '0.75rem' }}>
        {phase === 'idle' ? `Dot shows for ${showMs}ms then vanishes — remember it` :
         phase === 'memorize' ? 'Memorising…' :
         phase === 'blank' ? 'Now tap it!' : ''}
      </p>
    </div>
  );
};
