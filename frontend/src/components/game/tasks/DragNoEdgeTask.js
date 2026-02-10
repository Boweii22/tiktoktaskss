import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { soundManager } from '../../../lib/sounds';

export const DragNoEdgeTask = ({ task, onSuccess, onFail }) => {
  const [pos, setPos] = useState({ x: 80, y: 80 });
  const [dragging, setDragging] = useState(false);
  const [result, setResult] = useState(null);
  const startRef = useRef(null);
  const containerRef = useRef(null);

  const marginPx = task.config?.margin_px ?? 18;
  const goal = { x: 252, y: 80 };

  const getPos = (e) => {
    if (e.touches?.length) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    return { x: e.clientX, y: e.clientY };
  };

  const checkInMargin = useCallback((clientX, clientY) => {
    const cont = containerRef.current;
    if (!cont) return false;
    const rect = cont.getBoundingClientRect();
    if (clientX <= rect.left + marginPx || clientX >= rect.right - marginPx) return true;
    if (clientY <= rect.top + marginPx || clientY >= rect.bottom - marginPx) return true;
    return false;
  }, [marginPx]);

  const handleStart = useCallback((e) => {
    const p = getPos(e);
    const cont = containerRef.current;
    if (!cont) return;
    const rect = cont.getBoundingClientRect();
    const x = p.x - rect.left;
    const y = p.y - rect.top;
    if (checkInMargin(p.x, p.y)) {
      setResult('fail');
      soundManager.playFail();
      setTimeout(() => { onFail(); setResult(null); }, 500);
      return;
    }
    startRef.current = p;
    setPos({ x, y });
    setDragging(true);
  }, [checkInMargin, onFail]);

  const handleMove = useCallback((e) => {
    if (!dragging || result) return;
    const p = getPos(e);
    if (checkInMargin(p.x, p.y)) {
      setResult('fail');
      soundManager.playFail();
      setTimeout(() => { onFail(); setDragging(false); setResult(null); }, 500);
      return;
    }
    const cont = containerRef.current;
    if (!cont) return;
    const rect = cont.getBoundingClientRect();
    setPos({
      x: Math.max(marginPx, Math.min(rect.width - marginPx, p.x - rect.left)),
      y: Math.max(marginPx, Math.min(rect.height - marginPx, p.y - rect.top))
    });
  }, [dragging, result, checkInMargin, marginPx, onFail]);

  const handleEnd = useCallback((e) => {
    if (!dragging) return;
    const p = getPos(e.changedTouches ? e.changedTouches[0] : e);
    if (checkInMargin(p.x, p.y)) {
      setResult('fail');
      soundManager.playFail();
      setTimeout(() => { onFail(); setDragging(false); setResult(null); }, 500);
      setDragging(false);
      return;
    }
    const cont = containerRef.current;
    if (!cont) { setDragging(false); return; }
    const rect = cont.getBoundingClientRect();
    const x = p.x - rect.left;
    const y = p.y - rect.top;
    const dist = Math.hypot(x - goal.x, y - goal.y);
    if (dist < 35) {
      setResult('success');
      soundManager.playSuccess();
      setTimeout(() => { onSuccess(); setDragging(false); setResult(null); setPos({ x: 80, y: 80 }); }, 800);
    }
    setDragging(false);
  }, [dragging, checkInMargin, goal, onSuccess, onFail]);

  return (
    <div className="flex flex-col items-center justify-center gap-6 w-full" data-testid="drag-no-edge-task">
      <p className="text-lg text-slate-600 text-center">{task.instruction}</p>
      <div
        ref={containerRef}
        className="relative w-72 h-40 rounded-xl bg-slate-100 touch-none select-none"
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
        onMouseDown={handleStart}
        onMouseMove={handleMove}
        onMouseUp={handleEnd}
        onMouseLeave={() => setDragging(false)}
        style={{ border: result === 'fail' ? '2px solid #EF4444' : '2px solid #E2E8F0' }}
      >
        <motion.div
          className="absolute w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center"
          style={{ left: pos.x - 20, top: pos.y - 20 }}
          drag={false}
        />
        <div className="absolute w-8 h-8 rounded-full border-2 border-dashed border-slate-400 right-4 top-1/2 -translate-y-1/2" />
      </div>
      <p className="font-mono text-sm text-slate-400">Drag to the circle. Don’t touch the edges.</p>
    </div>
  );
};
