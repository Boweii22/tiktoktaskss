import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { soundManager } from '../../../lib/sounds';

const FRAME_MS = 80;

export const OddFrameTask = ({ task, onSuccess, onFail }) => {
  const [frame, setFrame] = useState(0);
  const [result, setResult] = useState(null);
  const [started, setStarted] = useState(false);
  const oddFrameRef = useRef(-1);
  const oddDurationRef = useRef(3);
  const intervalRef = useRef(null);

  const totalFrames = task.config?.total_frames ?? 80;
  const oddDurationFrames = task.config?.odd_duration_frames ?? 3;

  const startGame = useCallback(() => {
    setStarted(true);
    setResult(null);
    setFrame(0);
    oddFrameRef.current = Math.floor(Math.random() * (totalFrames - oddDurationFrames - 10)) + 5;
    oddDurationRef.current = oddDurationFrames;
    intervalRef.current = setInterval(() => {
      setFrame(f => {
        if (f >= totalFrames) {
          clearInterval(intervalRef.current);
          setResult('fail');
          soundManager.playFail();
          setTimeout(() => { onFail(); setStarted(false); setResult(null); }, 500);
          return f;
        }
        return f + 1;
      });
    }, FRAME_MS);
  }, [totalFrames, oddDurationFrames, onFail]);

  useEffect(() => () => clearInterval(intervalRef.current), []);

  const handleTap = useCallback(() => {
    if (!started) {
      soundManager.playClick();
      startGame();
      return;
    }
    soundManager.playClick();
    const oddStart = oddFrameRef.current;
    const oddEnd = oddStart + oddDurationRef.current;
    if (frame >= oddStart && frame <= oddEnd) {
      clearInterval(intervalRef.current);
      setResult('success');
      soundManager.playSuccess();
      setTimeout(() => { onSuccess(); setStarted(false); setResult(null); }, 800);
    } else {
      clearInterval(intervalRef.current);
      setResult('fail');
      soundManager.playFail();
      setTimeout(() => { onFail(); setStarted(false); setResult(null); }, 500);
    }
  }, [started, frame, startGame, onSuccess, onFail]);

  const isOdd = frame >= oddFrameRef.current && frame < oddFrameRef.current + oddDurationRef.current;

  return (
    <div className="flex flex-col items-center justify-center gap-8 w-full" data-testid="odd-frame-task">
      <p className="text-lg text-slate-600 text-center">{task.instruction}</p>
      <motion.div
        className="w-52 h-52 rounded-2xl touch-target cursor-pointer"
        style={{
          backgroundColor: result === 'success' ? '#10B981' : result === 'fail' ? '#EF4444' : isOdd ? '#1E293B' : '#F1F5F9'
        }}
        onClick={handleTap}
        data-testid="odd-frame-area"
      >
        {!started ? <span className="flex h-full items-center justify-center text-slate-500 font-medium">Start</span> : null}
      </motion.div>
      <p className="font-mono text-sm text-slate-400">One frame is different. Tap when you see it.</p>
    </div>
  );
};
