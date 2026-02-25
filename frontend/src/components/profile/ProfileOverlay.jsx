import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Users, Layers, Heart, X, UserPlus, UserCheck, Bookmark, Plus, Camera, Check } from 'lucide-react';
import { api } from '../../lib/api';
import { useProfile } from '../../contexts/ProfileContext';
import { ProposeIdeaModal } from '../tasks/ProposeIdeaModal';
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
  const [proposeOpen, setProposeOpen] = useState(false);
  const [proposals, setProposals] = useState([]);
  const [proposalsLoading, setProposalsLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarSaving, setAvatarSaving] = useState(false);
  const fileInputRef = useRef(null);

  const fetchProposals = useCallback(async () => {
    if (!profile?.username) return;
    setProposalsLoading(true);
    const list = await api.getCommunityProposals(profile.username);
    setProposals(list || []);
    setProposalsLoading(false);
  }, [profile?.username]);

  useEffect(() => {
    if (activeTab === 'tasks' && profile?.username) {
      fetchProposals();
    }
  }, [activeTab, fetchProposals, profile?.username]);

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

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target.result);
    reader.readAsDataURL(file);
    // reset input so same file can be re-selected
    e.target.value = '';
  };

  const handleSaveAvatar = async () => {
    if (!avatarFile) return;
    setAvatarSaving(true);
    try {
      const result = await api.uploadAvatar(avatarFile);
      setProfile((p) => ({ ...p, avatar_url: result.avatar_url }));
      refreshProfile();
      toast.success('Avatar updated!');
      setAvatarPreview(null);
      setAvatarFile(null);
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'Failed to upload avatar');
    } finally {
      setAvatarSaving(false);
    }
  };

  const handleCancelAvatar = () => {
    setAvatarPreview(null);
    setAvatarFile(null);
  };

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

  const proposalsCount = proposals.length;
  const stats = [
    { label: 'Followers', value: followCount, icon: Users },
    { label: 'Following', value: profile.following_count ?? 0, icon: UserCheck },
    { label: 'Proposals', value: proposalsCount, icon: Layers },
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
          <div className="profile-overlay__avatar-wrap">
            <div className="profile-overlay__avatar">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Preview" />
              ) : profile.avatar_url ? (
                <img src={profile.avatar_url} alt="" />
              ) : (
                <div className="profile-overlay__avatar-placeholder">
                  <User size={52} strokeWidth={2} />
                </div>
              )}
            </div>
            {isOwnProfile && !avatarFile && (
              <button
                className="profile-overlay__avatar-edit"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Change avatar"
              >
                <Camera size={14} strokeWidth={2.5} />
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </div>
          {isOwnProfile && avatarFile && (
            <motion.div
              className="profile-overlay__avatar-editor"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <span className="profile-overlay__avatar-filename">{avatarFile.name}</span>
              <button className="profile-overlay__avatar-save" onClick={handleSaveAvatar} disabled={avatarSaving}>
                {avatarSaving ? <div className="profile-overlay__avatar-spinner" /> : <Check size={15} strokeWidth={2.5} />}
              </button>
              <button className="profile-overlay__avatar-cancel" onClick={handleCancelAvatar} disabled={avatarSaving}>
                <X size={15} strokeWidth={2.5} />
              </button>
            </motion.div>
          )}
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
                        {proposalsCount.toLocaleString()}
                      </span>
                      <span className="profile-overlay__games-label">proposals</span>
                    </div>
                    <p className="profile-overlay__tab-hint">
                      {isOwnProfile ? 'Propose ideas for community tasks' : `Proposals by @${profile.username}`}
                    </p>
                    {isOwnProfile && (
                      <div className="profile-overlay__create-buttons">
                        <motion.button
                          type="button"
                          className="profile-overlay__create-task"
                          onClick={() => setProposeOpen(true)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Plus size={18} />
                          Propose for community
                        </motion.button>
                      </div>
                    )}
                    {proposalsLoading ? (
                      <p className="profile-overlay__tab-hint">Loading proposals...</p>
                    ) : proposals.length > 0 ? (
                      <div className="profile-overlay__my-tasks">
                        <p className="profile-overlay__my-tasks-title">Your proposals</p>
                        {proposals.map((p) => (
                          <div key={p.id} className="profile-overlay__task-row">
                            <div className="profile-overlay__task-info">
                              <span className="profile-overlay__task-name">{p.title || 'Idea'}</span>
                              <span className="profile-overlay__task-instruction">{p.idea_text?.slice(0, 80)}{(p.idea_text?.length || 0) > 80 ? '…' : ''}</span>
                              <span className={`profile-overlay__task-status profile-overlay__task-status--${p.status}`}>
                                {p.status === 'pending' ? 'Pending' : p.status === 'reviewing' ? 'In review' : 'Implemented'}
                              </span>
                            </div>
                            {p.image_url && (
                              <div className="profile-overlay__proposal-img">
                                <img src={p.image_url} alt="" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : isOwnProfile ? (
                      <p className="profile-overlay__tab-hint">No proposals yet. Post an idea above!</p>
                    ) : (
                      <p className="profile-overlay__tab-hint">No proposals yet.</p>
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
        {proposeOpen && (
          <ProposeIdeaModal
            onClose={() => setProposeOpen(false)}
            onPosted={() => {
              fetchProposals();
              setProposeOpen(false);
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
