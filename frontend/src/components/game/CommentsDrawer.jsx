import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Drawer, DrawerContent, DrawerClose } from '../ui/drawer';
import { api } from '../../lib/api';
import { useProfile } from '../../contexts/ProfileContext';
import { toast } from 'sonner';
import { MessageCircle, X, Send } from 'lucide-react';
import './CommentsDrawer.css';

function formatTime(isoStr) {
  if (!isoStr) return '';
  const date = new Date(isoStr);
  const now = new Date();
  const sec = Math.floor((now - date) / 1000);
  if (sec < 60) return 'just now';
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  if (sec < 604800) return `${Math.floor(sec / 86400)}d ago`;
  return date.toLocaleDateString();
}

function getInitials(username) {
  if (!username) return '?';
  const parts = username.replace(/[@]/g, '').split(/[._-]/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return username.slice(0, 2).toUpperCase();
}

export function CommentsDrawer({ taskId, open, onOpenChange }) {
  const { profile } = useProfile();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = useCallback(async () => {
    if (!taskId || !open) return;
    setLoading(true);
    const list = await api.getTaskComments(taskId);
    setComments(list || []);
    setLoading(false);
  }, [taskId, open]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const t = text.trim();
    if (!t || submitting) return;
    setSubmitting(true);
    try {
      await api.addTaskComment(taskId, t);
      setText('');
      fetchComments();
      toast.success('Comment posted!');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="comments-drawer__content border-0 p-0 comments-drawer">
        <div className="comments-drawer__handle" aria-hidden />
        <div className="comments-drawer__header">
          <div className="comments-drawer__title-wrap">
            <div className="comments-drawer__title-icon">
              <MessageCircle size={22} strokeWidth={2.5} />
            </div>
            <div>
              <span className="comments-drawer__title">Comments</span>
              <span className="comments-drawer__count">{comments.length > 0 ? ` · ${comments.length}` : ''}</span>
            </div>
          </div>
          <DrawerClose asChild>
            <button type="button" className="comments-drawer__close" aria-label="Close">
              <X size={20} strokeWidth={2.5} />
            </button>
          </DrawerClose>
        </div>

        <div className="comments-drawer__list">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                className="comments-drawer__loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="comments-drawer__spinner" />
                <span className="comments-drawer__loading-text">Loading comments...</span>
              </motion.div>
            ) : comments.length === 0 ? (
              <motion.div
                key="empty"
                className="comments-drawer__empty"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="comments-drawer__empty-icon">
                  <MessageCircle size={36} strokeWidth={1.5} />
                </div>
                <p className="comments-drawer__empty-title">No comments yet</p>
                <p className="comments-drawer__empty-hint">Be the first to share your thoughts or reactions.</p>
              </motion.div>
            ) : (
              <motion.ul
                key="list"
                className="space-y-0"
                initial="hidden"
                animate="visible"
                variants={{
                  visible: { transition: { staggerChildren: 0.04 } },
                  hidden: {},
                }}
              >
                {comments.map((c, i) => (
                  <motion.li
                    key={c.id}
                    className="comments-drawer__item"
                    variants={{
                      visible: { opacity: 1, y: 0 },
                      hidden: { opacity: 0, y: 10 },
                    }}
                    transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                  >
                    <div className="comments-drawer__avatar">
                      {c.avatar_url
                        ? <img src={c.avatar_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%' }} />
                        : getInitials(c.created_by_username)}
                    </div>
                    <div className="comments-drawer__body">
                      <div className="comments-drawer__meta">
                        <span className="comments-drawer__username">@{c.created_by_username || 'anon'}</span>
                        <span className="comments-drawer__time">{formatTime(c.created_at)}</span>
                      </div>
                      <p className="comments-drawer__text">{c.text}</p>
                    </div>
                  </motion.li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>

        <div className="comments-drawer__input-wrap">
          {!profile ? (
            <div className="comments-drawer__no-profile">
              Create a profile to leave a comment
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="comments-drawer__form">
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Add a comment..."
                maxLength={500}
                className="comments-drawer__input"
                autoComplete="off"
                aria-label="Comment text"
              />
              <button
                type="submit"
                disabled={!text.trim() || submitting}
                className="comments-drawer__submit"
                aria-label="Post comment"
              >
                <Send size={20} strokeWidth={2.5} />
              </button>
            </form>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
