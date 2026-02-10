import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { soundManager } from '../../../lib/sounds';

export const MatchRhythmTask = ({ task, onSuccess, onFail }) => {
  const [phase, setPhase] = useState('idle'); // idle, playing, input
  const [flashIndex, setFlashIndex] = useState(-1);
  const [inputTimes, setInputTimes] = useState([]);
  const [result, setResult] = useState(null);
  const patternRef = useRef([]);
  const startTimeRef = useRef(null);
  const timeoutsRef = useRef([]);

  const patternMs = task.config?.pattern_ms ?? [400, 400, 800, 400];
  const toleranceMs = task.config?.tolerance_ms ?? 120;

  const playPattern = useCallback(() => {
    patternRef.current = patternMs;
    setPhase('playing');
    setFlashIndex(-1);
    let t = 0;
    patternMs.forEach((dur, i) => {
      timeoutsRef.current.push(setTimeout(() => {
        setFlashIndex(i);
        timeoutsRef.current.push(setTimeout(() => setFlashIndex(-1), 80));
      }, t));
      t += dur;
    });
    timeoutsRef.current.push(setTimeout(() => {
      setPhase('input');
      setFlashIndex(-1);
      startTimeRef.current = Date.now();
      setInputTimes([]);
    }, t));
  }, [patternMs]);

  useEffect(() => () => timeoutsRef.current.forEach(clearTimeout), []);

  const handleTap = useCallback(() => {
    if (phase === 'idle') {
      soundManager.playClick();
      playPattern();
      return;
    }
    if (phase !== 'input' || result) return;
    soundManager.playClick();
    const elapsed = Date.now() - startTimeRef.current;
    const times = [...inputTimes, elapsed];
    setInputTimes(times);
    if (times.length === patternMs.length) {
      let ok = true;
      for (let i = 0; i < patternMs.length; i++) {
        const expected = patternMs.slice(0, i + 1).reduce((a, b) => a + b, 0);
        const diff = Math.abs(times[i] - expected);
        if (diff > toleranceMs) { ok = false; break; }
      }
      if (ok) {
        setResult('success');
        soundManager.playSuccess();
        setTimeout(() => { onSuccess(); setPhase('idle'); setResult(null); }, 800);
      } else {
        setResult('fail');
        soundManager.playFail();
        setTimeout(() => { onFail(); setPhase('idle'); setResult(null); }, 500);
      }
    }
  }, [phase, inputTimes, patternMs, toleranceMs, result, playPattern, onSuccess, onFail]);

  return (
    <div className="flex flex-col items-center justify-center gap-8 w-full" data-testid="match-rhythm-task">
      <p className="text-lg text-slate-600 text-center">{task.instruction}</p>
      <motion.div
        className="w-48 h-48 rounded-full touch-target cursor-pointer flex items-center justify-center font-bold text-white"
        style={{
          backgroundColor: result === 'success' ? '#10B981' : result === 'fail' ? '#EF4444' : flashIndex >= 0 ? '#F59E0B' : '#0F172A'
        }}
        onClick={handleTap}
        animate={flashIndex >= 0 ? { scale: [1, 1.15, 1] } : {}}
        transition={{ duration: 0.08 }}
        data-testid="rhythm-area"
      >
        {phase === 'idle' ? 'Play' : phase === 'playing' ? (flashIndex >= 0 ? '' : '…') : `Tap ${inputTimes.length + 1}/${patternMs.length}`}
      </motion.div>
      <p className="font-mono text-sm text-slate-400">Watch the rhythm, then tap it back</p>
    </div>
  );
};
