import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { soundManager } from '../../../lib/sounds';

export const DontReactTask = ({ task, onSuccess, onFail }) => {
  const [phase, setPhase] = useState('waiting');
  const [result, setResult] = useState(null);
  const realGoTimeRef = useRef(null);
  const timeoutRef = useRef(null);
  const startedRef = useRef(false);

  const fakeGoAt = task.config?.fake_go_at_ms ?? 2500;
  const realGoAt = task.config?.real_go_at_ms ?? 5500;
  const windowMs = task.config?.window_ms ?? 200;

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    const t1 = setTimeout(() => setPhase('fake'), fakeGoAt);
    const t1b = setTimeout(() => setPhase('waiting'), fakeGoAt + 600);
    const t2 = setTimeout(() => {
      setPhase('ready');
      realGoTimeRef.current = Date.now();
      timeoutRef.current = setTimeout(() => {
        setPhase('result');
        setResult('fail');
        soundManager.playFail();
        setTimeout(() => { onFail(); setPhase('waiting'); setResult(null); startedRef.current = false; }, 500);
      }, windowMs + 300);
    }, realGoAt);
    return () => { clearTimeout(t1); clearTimeout(t1b); clearTimeout(t2); clearTimeout(timeoutRef.current); };
  }, [fakeGoAt, realGoAt, windowMs, onFail]);

  const handleTap = useCallback(() => {
    soundManager.playClick();
    if (phase === 'waiting') return;
    if (phase === 'fake') {
      setResult('fail');
      soundManager.playFail();
      setTimeout(() => { onFail(); setPhase('waiting'); setResult(null); }, 500);
      return;
    }
    if (phase === 'ready') {
      clearTimeout(timeoutRef.current);
      const elapsed = Date.now() - realGoTimeRef.current;
      if (elapsed <= windowMs) {
        setResult('success');
        soundManager.playSuccess();
        setTimeout(() => { onSuccess(); setPhase('waiting'); setResult(null); startedRef.current = false; }, 800);
      } else {
        setResult('fail');
        soundManager.playFail();
        setTimeout(() => { onFail(); setPhase('waiting'); setResult(null); }, 500);
      }
    }
  }, [phase, windowMs, onSuccess, onFail]);

  const text = phase === 'fake' ? 'GO!' : phase === 'ready' ? 'GO!' : 'Wait…';
  const bg = result === 'success' ? '#10B981' : result === 'fail' ? '#EF4444' : phase === 'fake' || phase === 'ready' ? '#F59E0B' : '#0F172A';

  return (
    <div className="flex flex-col items-center justify-center gap-8 w-full" data-testid="dont-react-task">
      <p className="text-lg text-slate-600 text-center">{task.instruction}</p>
      <motion.button
        className="w-52 h-52 rounded-full touch-target font-bold text-2xl text-white"
        style={{ backgroundColor: bg }}
        onClick={handleTap}
        data-testid="dont-react-button"
      >
        {text}
      </motion.button>
      <p className="font-mono text-sm text-slate-400">{phase === 'fake' ? 'That was fake' : phase === 'ready' ? 'Now!' : 'Don’t tap the first GO'}</p>
    </div>
  );
};
