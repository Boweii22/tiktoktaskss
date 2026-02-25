import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProfile } from '../../contexts/ProfileContext';
import { api } from '../../lib/api';
import { toast } from 'sonner';
import './OnboardingModal.css';

export function OnboardingModal() {
  const { createProfile, refreshProfile, onboardingComplete, skipOnboarding, setProfile, setOnboardingComplete, loading } = useProfile();
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showRecover, setShowRecover] = useState(false);
  const [recoverUsername, setRecoverUsername] = useState('');
  const [recoverSubmitting, setRecoverSubmitting] = useState(false);
  const [recoverError, setRecoverError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const un = username.trim().toLowerCase().replace(/\s/g, '_');
    if (!displayName.trim()) {
      setError('Name is required');
      return;
    }
    if (!un || un.length < 2) {
      setError('Username must be at least 2 characters');
      return;
    }
    if (!/^[a-z0-9_]+$/.test(un)) {
      setError('Username can only have letters, numbers, and underscores');
      return;
    }
    setSubmitting(true);
    try {
      await createProfile(displayName.trim(), un, bio.trim());
      toast.success('Profile created! Welcome.');
    } catch (err) {
      let msg = err.response?.data?.detail;
      if (Array.isArray(msg)) msg = msg.map((m) => m?.msg || m?.loc?.join?.('.')).join(', ') || 'Invalid input';
      if (!msg) msg = err.message || 'Failed to create profile';
      setError(typeof msg === 'string' ? msg : 'Failed to create profile');
      toast.error(typeof msg === 'string' ? msg : 'Failed');
    } finally {
      setSubmitting(false);
    }
  };

  const suggestedUsername = displayName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');

  const handleRecover = async (e) => {
    e.preventDefault();
    setRecoverError('');
    const un = (recoverUsername || '').trim().toLowerCase().replace(/\s/g, '_');
    if (!un || un.length < 2) {
      setRecoverError('Enter your username (at least 2 characters)');
      return;
    }
    setRecoverSubmitting(true);
    try {
      const p = await api.claimProfile(un);
      if (p) {
        await refreshProfile();
        toast.success('Profile recovered! Welcome back.');
        setShowRecover(false);
        setRecoverUsername('');
      }
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Profile not found or backend unavailable';
      setRecoverError(typeof msg === 'string' ? msg : 'Recover failed');
      toast.error(typeof msg === 'string' ? msg : 'Recover failed');
    } finally {
      setRecoverSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {!loading && !onboardingComplete && (
        <motion.div
          className="onboarding-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="onboarding-modal"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <div className="onboarding-header">
              <h1 className="onboarding-title">Create your profile</h1>
              <p className="onboarding-subtitle">Join the impossible tasks community</p>
            </div>
            <form onSubmit={handleSubmit} className="onboarding-form">
              <div className="onboarding-field">
                <label htmlFor="displayName">Name</label>
                <input
                  id="displayName"
                  type="text"
                  placeholder="Your name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  maxLength={50}
                  autoFocus
                />
              </div>
              <div className="onboarding-field">
                <label htmlFor="username">Username</label>
                <input
                  id="username"
                  type="text"
                  placeholder={suggestedUsername || 'cool_player'}
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, '_'))}
                  maxLength={30}
                />
                <span className="onboarding-hint">Letters, numbers, underscores only</span>
              </div>
              <div className="onboarding-field">
                <label htmlFor="bio">Bio <span className="optional">(optional)</span></label>
                <textarea
                  id="bio"
                  placeholder="Tell us something..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={200}
                  rows={3}
                />
              </div>
              {error && <p className="onboarding-error">{error}</p>}
              <motion.button
                type="submit"
                className="onboarding-submit"
                disabled={submitting}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {submitting ? 'Creating...' : 'Let\'s go'}
              </motion.button>
              <button
                type="button"
                className="onboarding-skip"
                onClick={skipOnboarding}
              >
                Skip for now
              </button>
              <div className="onboarding-recover">
                <button
                  type="button"
                  className="onboarding-recover-toggle"
                  onClick={() => { setShowRecover(!showRecover); setRecoverError(''); setRecoverUsername(''); }}
                >
                  {showRecover ? 'Hide' : 'Already have a profile? Recover by username'}
                </button>
                {showRecover && (
                  <form onSubmit={handleRecover} className="onboarding-recover-form">
                    <input
                      type="text"
                      placeholder="Your username"
                      value={recoverUsername}
                      onChange={(e) => setRecoverUsername(e.target.value.toLowerCase().replace(/\s/g, '_'))}
                      maxLength={30}
                      className="onboarding-recover-input"
                    />
                    {recoverError && <p className="onboarding-error">{recoverError}</p>}
                    <button type="submit" className="onboarding-submit" disabled={recoverSubmitting}>
                      {recoverSubmitting ? 'Recovering...' : 'Recover profile'}
                    </button>
                  </form>
                )}
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
