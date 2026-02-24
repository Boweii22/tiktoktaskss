import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { api } from '../../lib/api';
import { toast } from 'sonner';
import './ProposeIdeaModal.css';

export function ProposeIdeaModal({ onClose, onPosted }) {
  const [title, setTitle] = useState('');
  const [ideaText, setIdeaText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const text = (ideaText || '').trim();
    if (!text) {
      setError('Describe your idea');
      return;
    }
    setSubmitting(true);
    try {
      await api.createCommunityProposal({
        title: (title || '').trim() || undefined,
        idea_text: text,
        image_url: (imageUrl || '').trim() || undefined,
      });
      toast.success('Idea posted! It’ll show under your profile.');
      onPosted?.();
      onClose?.();
    } catch (err) {
      const status = err.response?.status;
      let msg = err.response?.data?.detail || err.message || 'Failed to post';
      if (status === 404) {
        msg = 'Proposals endpoint not found. Restart the backend server and ensure the community_proposals table exists in Supabase (run supabase_community_proposals.sql).';
      } else if (status === 403) {
        msg = msg || 'Create a profile first to post ideas.';
      } else if (status === 503) {
        msg = msg || 'Database unavailable or community_proposals table missing. Run supabase_community_proposals.sql in Supabase.';
      }
      setError(typeof msg === 'string' ? msg : 'Failed to post');
      toast.error(typeof msg === 'string' ? msg : 'Failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      className="propose-idea-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <motion.div
        className="propose-idea-modal"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="propose-idea-modal__header">
          <h2 className="propose-idea-modal__title">Propose for community</h2>
          <button type="button" className="propose-idea-modal__close" onClick={onClose} aria-label="Close">
            <X size={22} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="propose-idea-modal__form">
          <div className="propose-idea-field">
            <label htmlFor="propose-title">Title <span className="optional">(optional)</span></label>
            <input
              id="propose-title"
              type="text"
              placeholder="e.g. Double-tap challenge"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              className="propose-idea-input"
            />
          </div>
          <div className="propose-idea-field">
            <label htmlFor="propose-idea">Your idea *</label>
            <textarea
              id="propose-idea"
              placeholder="Describe your task idea... What should happen? How does the player win or fail?"
              value={ideaText}
              onChange={(e) => setIdeaText(e.target.value)}
              maxLength={2000}
              rows={5}
              required
              className="propose-idea-textarea"
            />
            <span className="propose-idea-hint">{ideaText.length}/2000</span>
          </div>
          <div className="propose-idea-field">
            <label htmlFor="propose-image">Image URL <span className="optional">(optional)</span></label>
            <input
              id="propose-image"
              type="url"
              placeholder="https://..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              maxLength={500}
              className="propose-idea-input"
            />
          </div>
          {error && <p className="propose-idea-error">{error}</p>}
          <div className="propose-idea-actions">
            <button type="button" className="propose-idea-cancel" onClick={onClose}>
              Cancel
            </button>
            <motion.button
              type="submit"
              className="propose-idea-submit"
              disabled={submitting}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {submitting ? 'Posting...' : 'Post'}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
