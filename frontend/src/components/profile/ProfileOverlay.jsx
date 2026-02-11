import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Users, Layers, Heart, X, UserPlus, UserCheck, Bookmark, Plus, Trash2, Play } from 'lucide-react';
import { api } from '../../lib/api';
import { useProfile } from '../../contexts/ProfileContext';
import { CreateTaskModal } from '../tasks/CreateTaskModal';
import { toast } from 'sonner';
import './ProfileOverlay.css';

const TABS = [
  { id: 'tasks', label: 'Tasks', icon: Layers },
  { id: 'liked', label: 'Liked', icon: Heart },
  { id: 'saved', label: 'Saved', icon: Bookmark },
];

export function ProfileOverlay({ profile: initialProfile, username, onClose, isOwnProfile, onTaskCreated, onPlayTask, onTasksRefresh }) {
  const { profile: myProfile, refreshProfile } = useProfile();
  const [profile, setProfile] = useState(initialProfile || null);
  const [loading, setLoading] = useState(!initialProfile);
  const [following, setFollowing] = useState(initialProfile?.is_following ?? false);
  const [followCount, setFollowCount] = useState(initialProfile?.followers_count ?? 0);
  const [activeTab, setActiveTab] = useState('tasks');
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [createTaskMode, setCreateTaskMode] = useState('create'); // 'create' | 'propose'
  const [userTasks, setUserTasks] = useState([]);
  const [userTasksLoading, setUserTasksLoading] = useState(false);
  const [mySubmissions, setMySubmissions] = useState([]);

  const fetchUserTasks = useCallback(async () => {
    setUserTasksLoading(true);
    const list = isOwnProfile
      ? await api.getUserTasks()
      : (profile?.username ? await api.getUserTasksByUsername(profile.username) : []);
    setUserTasks(list || []);
    setUserTasksLoading(false);
  }, [isOwnProfile, profile?.username]);

  const fetchMySubmissions = useCallback(async () => {
    if (!isOwnProfile) return;
    const list = await api.getMySubmissions();
    setMySubmissions(list || []);
  }, [isOwnProfile]);

  useEffect(() => {
    if (activeTab === 'tasks') {
      fetchUserTasks();
      if (isOwnProfile) fetchMySubmissions();
    }
  }, [activeTab, fetchUserTasks, fetchMySubmissions, isOwnProfile]);

  // Refresh profile stats (including likes_received) every 3s so likes update immediately
  const refreshProfileStats = useCallback(async () => {
    if (!profile?.username) return;
    const p = isOwnProfile ? await api.getMyProfile() : await api.getProfileByUsername(profile.username);
    if (p) {
      setProfile(prev => prev ? { ...prev, likes_received: p.likes_received, followers_count: p.followers_count, following_count: p.following_count, is_following: p.is_following } : p);
      setFollowCount(p.followers_count ?? 0);
      setFollowing(p.is_following ?? false);
    }
  }, [profile?.username, isOwnProfile]);

  useEffect(() => {
    const interval = setInterval(refreshProfileStats, 3000);
    return () => clearInterval(interval);
  }, [refreshProfileStats]);

  const handleDeleteTask = async (taskId) => {
    try {
      await api.deleteTask(taskId);
      toast.success('Task deleted');
      fetchUserTasks();
      onTasksRefresh?.();
    } catch (e) {
      toast.error('Failed to delete');
    }
  };

  useEffect(() => {
    if (username && !initialProfile) {
      setLoading(true);
      api.getProfileByUsername(username).then((p) => {
        setProfile(p);
        setFollowing(p?.is_following ?? false);
        setFollowCount(p?.followers_count ?? 0);
      }).finally(() => setLoading(false));
    } else if (initialProfile) {
      setFollowing(initialProfile.is_following ?? false);
      setFollowCount(initialProfile.followers_count ?? 0);
    }
  }, [username, initialProfile]);

  const handleFollow = async () => {
    if (!profile?.username || isOwnProfile) return;
    try {
      if (following) {
        await api.unfollowProfile(profile.username);
        setFollowing(false);
        setFollowCount((c) => Math.max(0, c - 1));
        refreshProfile();
      } else {
        await api.followProfile(profile.username);
        setFollowing(true);
        setFollowCount((c) => c + 1);
        refreshProfile();
      }
    } catch (e) {
      console.error('Follow error:', e);
    }
  };

  if (loading) {
    return (
      <motion.div
        className="profile-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="profile-overlay__loading">
          <motion.div
            className="profile-overlay__spinner"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
          <p>Loading profile...</p>
        </div>
      </motion.div>
    );
  }

  if (!profile) {
    return null;
  }

  const tasksCreatedCount = profile.tasks_created ?? userTasks.length;
  const stats = [
    { label: 'Followers', value: followCount, icon: Users },
    { label: 'Following', value: profile.following_count ?? 0, icon: UserCheck },
    { label: 'Tasks', value: tasksCreatedCount, icon: Layers },
    { label: 'Likes', value: profile.likes_received ?? 0, icon: Heart },
  ];

  return (
    <motion.div
      className="profile-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <motion.div
        className="profile-overlay__card"
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="profile-overlay__close"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={22} />
        </button>

        <div className="profile-overlay__header">
          <div className="profile-overlay__avatar">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" />
            ) : (
              <div className="profile-overlay__avatar-placeholder">
                <User size={52} strokeWidth={2} />
              </div>
            )}
          </div>
          <h1 className="profile-overlay__name">{profile.display_name}</h1>
          <p className="profile-overlay__username">@{profile.username}</p>
          {profile.bio && (
            <p className="profile-overlay__bio">{profile.bio}</p>
          )}
        </div>

        <div className="profile-overlay__stats">
          {stats.map(({ label, value, icon: Icon }, i) => (
            <motion.div
              key={label}
              className="profile-overlay__stat"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 + i * 0.04 }}
            >
              <Icon size={18} className="profile-overlay__stat-icon" />
              <span className="profile-overlay__stat-value">{value.toLocaleString()}</span>
              <span className="profile-overlay__stat-label">{label}</span>
            </motion.div>
          ))}
        </div>

        {!isOwnProfile && (
          <motion.button
            className={`profile-overlay__follow ${following ? 'profile-overlay__follow--active' : ''}`}
            onClick={handleFollow}
            whileTap={{ scale: 0.96 }}
          >
            {following ? <UserCheck size={18} /> : <UserPlus size={18} />}
            {following ? 'Following' : 'Follow'}
          </motion.button>
        )}

        <div className="profile-overlay__tabs">
          <div className="profile-overlay__tab-list">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                className={`profile-overlay__tab ${activeTab === id ? 'profile-overlay__tab--active' : ''}`}
                onClick={() => setActiveTab(id)}
              >
                <Icon size={20} />
                <span>{label}</span>
              </button>
            ))}
          </div>

          <div className="profile-overlay__tab-panel">
            <AnimatePresence mode="wait">
              {activeTab === 'tasks' && (
                <motion.div
                  key="tasks"
                  className="profile-overlay__tab-content"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="profile-overlay__games-summary">
                    <div className="profile-overlay__games-badge">
                      <Layers size={32} />
                      <span className="profile-overlay__games-count">
                        {tasksCreatedCount.toLocaleString()}
                      </span>
                      <span className="profile-overlay__games-label">tasks created</span>
                    </div>
                    <p className="profile-overlay__tab-hint">
                      {isOwnProfile ? 'Create tasks and share them with others' : `Tasks created by @${profile.username}`}
                    </p>
                    {isOwnProfile && (
                      <>
                        <div className="profile-overlay__create-buttons">
                          <motion.button
                            type="button"
                            className="profile-overlay__create-task"
                            onClick={() => { setCreateTaskMode('create'); setCreateTaskOpen(true); }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Plus size={18} />
                            Create task
                          </motion.button>
                          <motion.button
                            type="button"
                            className="profile-overlay__create-task profile-overlay__create-task--secondary"
                            onClick={() => { setCreateTaskMode('propose'); setCreateTaskOpen(true); }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            Propose for community
                          </motion.button>
                        </div>
                        {userTasksLoading ? (
                          <p className="profile-overlay__tab-hint">Loading your tasks...</p>
                        ) : userTasks.length > 0 ? (
                          <div className="profile-overlay__my-tasks">
                            <p className="profile-overlay__my-tasks-title">Your tasks</p>
                            {userTasks.map((t) => (
                              <div key={t.id} className="profile-overlay__task-row">
                                <div className="profile-overlay__task-info">
                                  <span className="profile-overlay__task-name">{t.name}</span>
                                  <span className="profile-overlay__task-instruction">{t.instruction?.slice(0, 50)}{(t.instruction?.length || 0) > 50 ? '…' : ''}</span>
                                </div>
                                <div className="profile-overlay__task-actions">
                                  <button
                                    type="button"
                                    className="profile-overlay__task-play"
                                    onClick={() => { onPlayTask?.(t); onClose?.(); }}
                                    aria-label="Play"
                                  >
                                    <Play size={18} />
                                  </button>
                                  {isOwnProfile && (
                                    <button
                                      type="button"
                                      className="profile-overlay__task-delete"
                                      onClick={() => handleDeleteTask(t.id)}
                                      aria-label="Delete"
                                    >
                                      <Trash2 size={18} />
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : null}
                        {mySubmissions.length > 0 && (
                          <div className="profile-overlay__my-tasks" style={{ marginTop: 16 }}>
                            <p className="profile-overlay__my-tasks-title">Community submissions</p>
                            {mySubmissions.map((s) => (
                              <div key={s.id} className="profile-overlay__task-row">
                                <div className="profile-overlay__task-info">
                                  <span className="profile-overlay__task-name">{s.name}</span>
                                  <span className={`profile-overlay__task-status profile-overlay__task-status--${s.status}`}>
                                    {s.status === 'pending' ? 'Pending review' : s.status === 'approved' ? 'Approved' : 'Rejected'}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </motion.div>
              )}
              {activeTab === 'liked' && (
                <motion.div
                  key="liked"
                  className="profile-overlay__tab-content"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="profile-overlay__empty-state">
                    <Heart size={48} className="profile-overlay__empty-icon" />
                    <p className="profile-overlay__empty-title">Liked tasks</p>
                    <p className="profile-overlay__tab-hint">
                      Tasks you've liked will appear here
                    </p>
                    <span className="profile-overlay__empty-count">
                      {(profile.likes_received ?? 0).toLocaleString()} likes received
                    </span>
                  </div>
                </motion.div>
              )}
              {activeTab === 'saved' && (
                <motion.div
                  key="saved"
                  className="profile-overlay__tab-content"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="profile-overlay__empty-state">
                    <Bookmark size={48} className="profile-overlay__empty-icon" />
                    <p className="profile-overlay__empty-title">Saved tasks</p>
                    <p className="profile-overlay__tab-hint">
                      Bookmarked tasks will appear here
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {createTaskOpen && (
          <CreateTaskModal
            mode={createTaskMode}
            onClose={() => setCreateTaskOpen(false)}
            onCreated={(task) => {
              if (createTaskMode === 'propose') fetchMySubmissions();
              else {
                onTaskCreated?.(task);
                fetchUserTasks();
              }
              setCreateTaskOpen(false);
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
