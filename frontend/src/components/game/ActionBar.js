import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Bookmark, Share2 } from 'lucide-react';
import { ThemeToggle } from '../ThemeToggle';
import { ShareSheet } from './ShareSheet';
import { CommentsDrawer } from './CommentsDrawer';
import { api } from '../../lib/api';
import { useProfile } from '../../contexts/ProfileContext';
import { toast } from 'sonner';
import './ActionBar.css';

const ActionButton = ({ icon: Icon, label, count, onClick, isActive, activeColor, children }) => (
  <motion.button
    type="button"
    className="action-bar__btn"
    onClick={onClick}
    whileTap={{ scale: 0.88 }}
    whileHover={{ scale: 1.05 }}
  >
    <div className="action-bar__icon-wrap" style={isActive && activeColor ? { color: activeColor } : undefined}>
      {children || <Icon size={28} strokeWidth={2} />}
    </div>
    {(count !== undefined && count > 0) || label ? (
      <span className="action-bar__count">{count ?? label ?? ''}</span>
    ) : null}
  </motion.button>
);

export const ActionBar = ({ task, isCreator, onTaskUpdated, onLikeUpdate }) => {
  const { profile } = useProfile();
  const [liked, setLiked] = useState(task?.liked ?? false);
  const [likeCount, setLikeCount] = useState(task?.likeCount ?? 0);
  const [bookmarked, setBookmarked] = useState(false);
  const [bookmarkPop, setBookmarkPop] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const lastTapRef = useRef(0);

  // Load bookmark state when task changes
  useEffect(() => {
    if (!task?.id) return;
    api.getBookmarkStatus(task.id).then(d => setBookmarked(d?.bookmarked ?? false));
  }, [task?.id]);

  const fetchLikes = useCallback(async () => {
    if (!task?.id) return;
    const data = await api.getTaskLikes(task.id);
    const newLiked = data?.liked ?? false;
    const newCount = data?.count ?? 0;
    setLiked(newLiked);
    setLikeCount(newCount);
    onLikeUpdate?.(task.id, { liked: newLiked, count: newCount });
  }, [task?.id, onLikeUpdate]);

  useEffect(() => {
    if (task?.likeCount !== undefined && task?.liked !== undefined) {
      setLiked(task.liked);
      setLikeCount(task.likeCount);
    } else {
      fetchLikes();
    }
  }, [task?.id, task?.likeCount, task?.liked, fetchLikes]);

  // Refresh likes every 3s so changes propagate without reload
  useEffect(() => {
    if (!task?.id) return;
    const interval = setInterval(fetchLikes, 3000);
    return () => clearInterval(interval);
  }, [task?.id, fetchLikes]);

  const handleLike = useCallback(async () => {
    if (!profile) {
      toast.error('Create a profile to like tasks', { description: 'Tap your name area to set up a profile first.' });
      return;
    }
    const now = Date.now();
    const isDoubleTap = now - lastTapRef.current < 400;
    lastTapRef.current = now;

    const willLike = !liked;
    const prevLiked = liked;
    const prevCount = likeCount;
    const newCount = willLike ? likeCount + 1 : Math.max(0, likeCount - 1);

    // Optimistic: update UI immediately
    setLiked(willLike);
    setLikeCount(newCount);
    onLikeUpdate?.(task?.id, { liked: willLike, count: newCount });
    if (willLike && isDoubleTap) {
      setShowHeartBurst(true);
      setTimeout(() => setShowHeartBurst(false), 600);
    }

    const data = willLike ? await api.likeTask(task?.id) : await api.unlikeTask(task?.id);
    if (data) {
      setLiked(data.liked ?? willLike);
      setLikeCount(data.count ?? newCount);
      onLikeUpdate?.(task?.id, { liked: data.liked ?? willLike, count: data.count ?? newCount });
    } else {
      setLiked(prevLiked);
      setLikeCount(prevCount);
      onLikeUpdate?.(task?.id, { liked: prevLiked, count: prevCount });
    }
  }, [task?.id, liked, likeCount, onLikeUpdate]);

  const handleBookmark = useCallback(async () => {
    if (!profile) {
      toast.error('Create a profile to save tasks', { description: 'Tap your name area to set up a profile first.' });
      return;
    }
    const willBookmark = !bookmarked;
    setBookmarked(willBookmark);
    if (willBookmark) {
      setBookmarkPop(true);
      setTimeout(() => setBookmarkPop(false), 600);
      toast.success('Saved!', { duration: 1500 });
    }
    const fn = willBookmark ? api.bookmarkTask : api.unbookmarkTask;
    const result = await fn(task?.id);
    if (result?.bookmarked !== undefined) setBookmarked(result.bookmarked);
  }, [bookmarked, task?.id, profile]);

  const handleComment = useCallback(() => {
    if (!profile) {
      toast.error('Create a profile to comment', { description: 'Tap your name area to set up a profile first.' });
      return;
    }
    setCommentsOpen(true);
  }, [profile]);

  const handleCommentsClose = useCallback(() => {
    setCommentsOpen(false);
    api.getTaskComments(task?.id).then(list => setCommentCount(list?.length ?? 0));
  }, [task?.id]);

  useEffect(() => {
    if (task?.id) {
      api.getTaskComments(task.id).then(list => setCommentCount(list?.length ?? 0));
    }
  }, [task?.id]);

  return (
    <div className="action-bar" data-testid="action-bar">
      <ActionButton
        icon={Heart}
        label="Like"
        count={likeCount || undefined}
        onClick={handleLike}
        isActive={liked}
        activeColor="#FF2D55"
      >
        <Heart
          size={28}
          strokeWidth={2}
          fill={liked ? 'currentColor' : 'none'}
        />
      </ActionButton>

      <ActionButton
        icon={MessageCircle}
        label="Comment"
        count={commentCount || undefined}
        onClick={handleComment}
      />

      <motion.button
        type="button"
        className="action-bar__btn"
        onClick={handleBookmark}
        whileTap={{ scale: 0.88 }}
        whileHover={{ scale: 1.05 }}
      >
        <div className="action-bar__icon-wrap" style={bookmarked ? { color: '#f59e0b' } : undefined}>
          <motion.div
            animate={bookmarkPop ? { scale: [1, 1.5, 0.9, 1.15, 1], rotate: [0, -12, 8, -4, 0] } : { scale: 1 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
          >
            <Bookmark size={28} strokeWidth={2} fill={bookmarked ? 'currentColor' : 'none'} />
          </motion.div>
        </div>
        <span className="action-bar__count">{bookmarked ? 'Saved' : 'Save'}</span>
      </motion.button>

      <motion.button
        type="button"
        className="action-bar__btn"
        onClick={() => setShareOpen(true)}
        whileTap={{ scale: 0.88 }}
        whileHover={{ scale: 1.05 }}
      >
        <div className="action-bar__icon-wrap">
          <Share2 size={28} strokeWidth={2} />
        </div>
        <span className="action-bar__count">Share</span>
      </motion.button>

      <div className="action-bar__divider" />

      <div className="action-bar__theme">
        <ThemeToggle />
      </div>

      <CommentsDrawer
        taskId={task?.id}
        open={commentsOpen}
        onOpenChange={(o) => { if (!o) handleCommentsClose(); setCommentsOpen(o); }}
      />

      <ShareSheet task={task} open={shareOpen} onClose={() => setShareOpen(false)} />

      <AnimatePresence>
        {showHeartBurst && (
          <motion.div
            className="heart-burst"
            initial={{ scale: 0.3, opacity: 1 }}
            animate={{ scale: 1.2, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.33, 1, 0.68, 1] }}
          >
            <Heart size={80} fill="#FF2D55" stroke="#FF2D55" strokeWidth={1} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
