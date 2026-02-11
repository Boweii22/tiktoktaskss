import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { api } from '../lib/api';

const ProfileContext = createContext(null);

export function ProfileProvider({ children }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [onboardingComplete, setOnboardingComplete] = useState(() => {
    try {
      return !!localStorage.getItem('impossible_skipped_onboarding');
    } catch {
      return false;
    }
  });

  const fetchProfile = useCallback(async () => {
    try {
      const p = await api.getMyProfile();
      setProfile(p);
      setOnboardingComplete(!!p || !!localStorage.getItem('impossible_skipped_onboarding'));
      return p;
    } catch (e) {
      setProfile(null);
      setOnboardingComplete(!!localStorage.getItem('impossible_skipped_onboarding'));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const createProfile = useCallback(async (displayName, username, bio) => {
    const p = await api.createProfile(displayName, username, bio);
    if (p) {
      setProfile(p);
      setOnboardingComplete(true);
      return p;
    }
    throw new Error('Failed to create profile');
  }, []);

  const refreshProfile = useCallback(() => fetchProfile(), [fetchProfile]);

  const skipOnboarding = useCallback(() => {
    try {
      localStorage.setItem('impossible_skipped_onboarding', '1');
      setOnboardingComplete(true);
    } catch {}
  }, []);

  return (
    <ProfileContext.Provider
      value={{
        profile,
        loading,
        onboardingComplete,
        createProfile,
        refreshProfile,
        setProfile,
        skipOnboarding
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider');
  return ctx;
}
