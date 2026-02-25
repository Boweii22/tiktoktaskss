import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, CheckCheck, Clock, Eye, CheckCircle } from 'lucide-react';
import { api } from '../../lib/api';
import { useProfile } from '../../contexts/ProfileContext';
import './NotificationBell.css';

const STATUS_ICONS = {
  reviewing: Eye,
  implemented: CheckCircle,
  pending: Clock,
};

function timeAgo(iso) {
  if (!iso) return '';
  const sec = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (sec < 60) return 'just now';
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  return `${Math.floor(sec / 86400)}d ago`;
}

export function NotificationBell() {
  const { profile } = useProfile();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const fetchNotifications = useCallback(async () => {
    if (!profile) return;
    const list = await api.getNotifications();
    setNotifications(list || []);
  }, [profile]);

  // Poll every 15 seconds
  useEffect(() => {
    if (!profile) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [fetchNotifications, profile]);

  const handleOpen = async () => {
    setOpen(true);
    setLoading(true);
    const list = await api.getNotifications();
    setNotifications(list || []);
    setLoading(false);
    // Mark all read after a short delay
    if (list?.some((n) => !n.read)) {
      setTimeout(async () => {
        await api.markAllNotificationsRead();
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      }, 1200);
    }
  };

  const handleClose = () => setOpen(false);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) handleClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  if (!profile) return null;

  return (
    <div className="notif-bell__wrap" ref={panelRef}>
      <motion.button
        className="notif-bell__trigger"
        onClick={open ? handleClose : handleOpen}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.93 }}
        aria-label="Notifications"
      >
        <Bell size={20} strokeWidth={2.2} />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              className="notif-bell__badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 20 }}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="notif-bell__panel"
            initial={{ opacity: 0, y: -10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          >
            <div className="notif-bell__header">
              <span className="notif-bell__title">Notifications</span>
              <button className="notif-bell__close" onClick={handleClose} aria-label="Close">
                <X size={16} strokeWidth={2.5} />
              </button>
            </div>

            <div className="notif-bell__list">
              {loading ? (
                <div className="notif-bell__state">
                  <div className="notif-bell__spinner" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="notif-bell__state">
                  <Bell size={28} strokeWidth={1.5} className="notif-bell__empty-icon" />
                  <span>No notifications yet</span>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {notifications.map((n, i) => {
                    const statusMatch = n.data?.status;
                    const Icon = STATUS_ICONS[statusMatch] || Bell;
                    return (
                      <motion.div
                        key={n.id}
                        className={`notif-bell__item ${!n.read ? 'notif-bell__item--unread' : ''}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                      >
                        <div className={`notif-bell__item-icon notif-bell__item-icon--${statusMatch || 'default'}`}>
                          <Icon size={15} strokeWidth={2} />
                        </div>
                        <div className="notif-bell__item-body">
                          <p className="notif-bell__item-msg">{n.message}</p>
                          <span className="notif-bell__item-time">{timeAgo(n.created_at)}</span>
                        </div>
                        {!n.read && <div className="notif-bell__dot" />}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>

            {notifications.length > 0 && (
              <div className="notif-bell__footer">
                <button
                  className="notif-bell__mark-all"
                  onClick={async () => {
                    await api.markAllNotificationsRead();
                    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
                  }}
                >
                  <CheckCheck size={14} strokeWidth={2} />
                  Mark all as read
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
