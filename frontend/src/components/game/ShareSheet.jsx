import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Link2, Copy, Share2, Check, Twitter, MessageCircle } from 'lucide-react';
import { generateShareUrl } from '../../lib/api';
import { toast } from 'sonner';
import './ShareSheet.css';

function Particle({ x, y, color, delay }) {
  return (
    <motion.div
      className="share-sheet__particle"
      style={{ left: x, top: y, background: color }}
      initial={{ scale: 0, opacity: 1 }}
      animate={{ scale: [0, 1.2, 0.8], opacity: [1, 1, 0], x: (Math.random() - 0.5) * 80, y: -60 - Math.random() * 40 }}
      transition={{ duration: 0.7, delay, ease: 'easeOut' }}
    />
  );
}

const PARTICLE_COLORS = ['#f59e0b', '#ef4444', '#8b5cf6', '#10b981', '#3b82f6', '#ec4899'];

export function ShareSheet({ task, open, onClose }) {
  const [copied, setCopied] = useState(null); // 'link' | 'text' | null
  const [burst, setBurst] = useState(false);

  const rate = task?.stats?.completion_rate?.toFixed(1) ?? '0.0';
  const shareUrl = task ? generateShareUrl(task.id) : '';
  const shareText = task ? `Only ${rate}% pass "${task.name}" — can you beat it? 🎯` : '';

  const triggerBurst = useCallback(() => {
    setBurst(true);
    setTimeout(() => setBurst(false), 800);
  }, []);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied('link');
      triggerBurst();
      toast.success('Link copied!', { duration: 1800 });
      setTimeout(() => setCopied(null), 2200);
    } catch { toast.error('Could not copy'); }
  }, [shareUrl, triggerBurst]);

  const handleCopyText = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      setCopied('text');
      triggerBurst();
      toast.success('Challenge text copied!', { duration: 1800 });
      setTimeout(() => setCopied(null), 2200);
    } catch { toast.error('Could not copy'); }
  }, [shareText, shareUrl, triggerBurst]);

  const handleNativeShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: task?.name, text: shareText, url: shareUrl });
        triggerBurst();
        onClose();
      } catch (e) {
        if (e.name !== 'AbortError') toast.error('Share failed');
      }
    } else {
      handleCopyLink();
    }
  }, [task, shareText, shareUrl, handleCopyLink, triggerBurst, onClose]);

  const handleTwitter = useCallback(() => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`;
    window.open(url, '_blank', 'noopener');
    triggerBurst();
  }, [shareText, shareUrl, triggerBurst]);

  if (!task) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="share-sheet__backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            className="share-sheet"
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 340, damping: 32 }}
          >
            {/* Drag handle */}
            <div className="share-sheet__handle" />

            {/* Close */}
            <button className="share-sheet__close" onClick={onClose} aria-label="Close">
              <X size={18} strokeWidth={2.5} />
            </button>

            {/* Task preview card */}
            <motion.div
              className="share-sheet__preview"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
            >
              <div className="share-sheet__preview-rate">
                <span className="share-sheet__preview-pct">{rate}%</span>
                <span className="share-sheet__preview-label">pass rate</span>
              </div>
              <div className="share-sheet__preview-info">
                <span className="share-sheet__preview-name">{task.name}</span>
                <span className="share-sheet__preview-sub">Can your friends beat this?</span>
              </div>
            </motion.div>

            {/* URL bar */}
            <motion.div
              className="share-sheet__url-row"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.13 }}
            >
              <Link2 size={14} className="share-sheet__url-icon" />
              <span className="share-sheet__url-text">{shareUrl.replace(/^https?:\/\//, '')}</span>
            </motion.div>

            {/* Action buttons */}
            <motion.div
              className="share-sheet__actions"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 }}
            >
              {/* Copy link */}
              <button className="share-sheet__action" onClick={handleCopyLink}>
                <div className="share-sheet__action-icon share-sheet__action-icon--blue">
                  {copied === 'link' ? <Check size={22} strokeWidth={2.5} /> : <Link2 size={22} strokeWidth={2} />}
                </div>
                <span className="share-sheet__action-label">{copied === 'link' ? 'Copied!' : 'Copy link'}</span>
              </button>

              {/* Copy challenge text */}
              <button className="share-sheet__action" onClick={handleCopyText}>
                <div className="share-sheet__action-icon share-sheet__action-icon--purple">
                  {copied === 'text' ? <Check size={22} strokeWidth={2.5} /> : <Copy size={22} strokeWidth={2} />}
                </div>
                <span className="share-sheet__action-label">{copied === 'text' ? 'Copied!' : 'Copy text'}</span>
              </button>

              {/* Twitter / X */}
              <button className="share-sheet__action" onClick={handleTwitter}>
                <div className="share-sheet__action-icon share-sheet__action-icon--dark">
                  <Twitter size={22} strokeWidth={2} />
                </div>
                <span className="share-sheet__action-label">X / Twitter</span>
              </button>

              {/* Native share / more */}
              <button className="share-sheet__action" onClick={handleNativeShare}>
                <div className="share-sheet__action-icon share-sheet__action-icon--green">
                  <Share2 size={22} strokeWidth={2} />
                </div>
                <span className="share-sheet__action-label">More</span>
              </button>
            </motion.div>

            {/* Particle burst */}
            <AnimatePresence>
              {burst && Array.from({ length: 14 }).map((_, i) => (
                <Particle
                  key={i}
                  x={`${20 + Math.random() * 60}%`}
                  y="40%"
                  color={PARTICLE_COLORS[i % PARTICLE_COLORS.length]}
                  delay={i * 0.03}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
