import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { soundManager } from '../../../lib/sounds';

/**
 * A rhythm pulses visually (dot grows/shrinks) at an irregular BPM for 3 beats.
 * Then the pulse stops and you must tap the 4th beat at the right moment.
 * Tolerance: ±120ms
 */
export const SilentBeatTask = ({ task, onSuccess, onFail }) => {
  const beatMs    = task.config?.beat_ms    ?? 620;
  const beats     = task.config?.beats      ?? 3;
  const tolerance = task.config?.tolerance  ?? 110;

  const [phase, setPhase]    = useState('idle'); // idle | pulsing | silent | result
  const [pulse, setPulse]    = useState(false);
  const [result, setResult]  = useState(null);
  const nextBeatRef = useRef(null);
  const timeoutRef  = useRef(null);

  const startGame = useCallback(() => {
    setResult(null);
    setPhase('pulsing');
    let count = 0;

    const tick = () => {
      setPulse(true);
      soundManager.playClick();
      setTimeout(() => setPulse(false), beatMs * 0.4);
      count++;
      if (count < beats) {
        timeoutRef.current = setTimeout(tick, beatMs);
      } else {
        // After last pulse, record expected next beat time
        nextBeatRef.current = Date.now() + beatMs;
        timeoutRef.current = setTimeout(() => {
          setPhase('silent');
          // Auto-fail if they tap too late (2× window past beat)
          timeoutRef.current = setTimeout(() => {
            soundManager.playFail();
            setResult('fail');
            setPhase('result');
            setTimeout(() => { onFail(); setPhase('idle'); setResult(null); }, 700);
          }, beatMs + tolerance);
        }, beatMs * 0.45);
      }
    };
    timeoutRef.current = setTimeout(tick, 400);
  }, [beatMs, beats, tolerance, onFail]);

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  const handleTap = useCallback(() => {
    if (phase !== 'silent') return;
    clearTimeout(timeoutRef.current);
    const diff = Math.abs(Date.now() - nextBeatRef.current);
    if (diff <= tolerance) {
      soundManager.playSuccess();
      setResult('success');
      setPhase('result');
      setTimeout(() => { onSuccess(); setPhase('idle'); setResult(null); }, 900);
    } else {
      soundManager.playFail();
      setResult('fail');
      setPhase('result');
      setTimeout(() => { onFail(); setPhase('idle'); setResult(null); }, 700);
    }
  }, [phase, tolerance, onSuccess, onFail]);

  const dotScale = pulse ? 1.55 : 1;

  return (
    <div className="flex flex-col items-center justify-center gap-8 w-full select-none" data-testid="silent-beat-task">
      <p className="text-center" style={{ color: 'var(--fg-muted)', fontSize: '0.9rem' }}>
        {task.instruction}
      </p>

      <motion.div
        className="flex items-center justify-center"
        style={{
          width: 180,
          height: 180,
          borderRadius: '50%',
          background: phase === 'result'
            ? result === 'success' ? '#10B981' : '#EF4444'
            : phase === 'silent' ? 'rgba(245,158,11,0.15)' : 'var(--bg-subtle)',
          border: `2px solid ${phase === 'silent' ? '#F59E0B' : 'rgba(128,128,128,0.2)'}`,
          cursor: phase === 'silent' ? 'pointer' : 'default',
          transition: 'background 0.2s, border-color 0.2s',
        }}
        animate={{ scale: phase === 'pulsing' ? dotScale : 1 }}
        transition={{ type: 'spring', stiffness: 500, damping: 18 }}
        onClick={phase === 'idle' ? startGame : handleTap}
      >
        <span style={{
          fontSize: phase === 'idle' ? '1rem' : '2.5rem',
          fontWeight: 800,
          color: phase === 'silent' ? '#F59E0B' : 'var(--fg-default)',
        }}>
          {phase === 'idle'    ? 'START'   :
           phase === 'pulsing' ? '●'       :
           phase === 'silent'  ? 'TAP'     :
           result === 'success'? '✓'       : '✗'}
        </span>
      </motion.div>

      <p style={{ color: 'var(--fg-muted)', fontSize: '0.8rem', textAlign: 'center' }}>
        {phase === 'idle'    ? `Watch ${beats} pulses. Tap the ${beats + 1}th beat.` :
         phase === 'pulsing' ? 'Feel the rhythm…'                    :
         phase === 'silent'  ? `Tap on the beat! (±${tolerance}ms)`  :
         result === 'success'? 'You felt it! 🎵'                      :
         'Off beat — feel it more next time'}
      </p>
    </div>
  );
};
