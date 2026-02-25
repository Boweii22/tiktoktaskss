import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Trophy, Search, User, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../../lib/api';
import { useProfile } from '../../contexts/ProfileContext';
import './BottomNav.css';

// ── Inline search overlay (mobile-optimised) ──────────────────────────────────
function MobileSearch({ onClose, onProfileSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 80); }, []);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const t = setTimeout(async () => {
      setLoading(true);
      const r = await api.searchProfiles(query.trim());
      setResults(r || []);
      setLoading(false);
    }, 280);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <motion.div
      className="bn-search-overlay"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ type: 'spring', stiffness: 360, damping: 30 }}
    >
      <div className="bn-search-bar">
        <Search size={17} className="bn-search-icon" />
        <input
          ref={inputRef}
          className="bn-search-input"
          placeholder="Search people…"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        {query && (
          <button className="bn-search-clear" onClick={() => setQuery('')}>
            <X size={15} />
          </button>
        )}
        <button className="bn-search-cancel" onClick={onClose}>Cancel</button>
      </div>

      <div className="bn-search-results">
        {loading && (
          <div className="bn-search-skeleton">
            {[1,2,3].map(i => <div key={i} className="bn-search-skeleton__row" style={{ animationDelay: `${i*0.07}s` }} />)}
          </div>
        )}
        {!loading && query && results.length === 0 && (
          <p className="bn-search-empty">No users found for "{query}"</p>
        )}
        {!loading && results.map((u, i) => (
          <motion.button
            key={u.username}
            className="bn-search-result"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            onClick={() => { onProfileSelect(u.username); onClose(); }}
          >
            <div className="bn-search-result__avatar">
              {u.avatar_url
                ? <img src={u.avatar_url} alt="" className="bn-search-result__avatar-img" />
                : <span>{(u.username || '?').slice(0, 2).toUpperCase()}</span>}
            </div>
            <div className="bn-search-result__info">
              <span className="bn-search-result__name">{u.display_name || u.username}</span>
              <span className="bn-search-result__username">@{u.username}</span>
            </div>
            {u.followers_count > 0 && (
              <span className="bn-search-result__followers">{u.followers_count} followers</span>
            )}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

// ── Bottom Nav ────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'home',        label: 'Home',        Icon: Home   },
  { id: 'leaderboard', label: 'Leaderboard', Icon: Trophy },
  { id: 'search',      label: 'Search',      Icon: Search },
  { id: 'profile',     label: 'Profile',     Icon: User   },
];

export function BottomNav({ onProfileOpen }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useProfile();
  const [searchOpen, setSearchOpen] = useState(false);

  // Derive active tab from current route
  const activeTab = location.pathname.startsWith('/leaderboard')
    ? 'leaderboard'
    : location.pathname.startsWith('/u/')
    ? 'profile'
    : 'home';

  const handleTab = useCallback((id) => {
    if (id === 'search') { setSearchOpen(true); return; }
    if (id === 'home') { navigate('/'); return; }
    if (id === 'leaderboard') { navigate('/leaderboard'); return; }
    if (id === 'profile') {
      if (profile?.username) {
        // On main feed — use overlay callback; on other pages — navigate to profile page
        if (location.pathname === '/') {
          onProfileOpen?.();
        } else {
          navigate(`/u/${profile.username}`);
        }
      }
    }
  }, [navigate, location.pathname, profile, onProfileOpen]);

  const handleProfileSelect = useCallback((username) => {
    navigate(`/u/${username}`);
  }, [navigate]);

  return (
    <>
      <nav className="bottom-nav" role="navigation" aria-label="Main navigation">
        {TABS.map(({ id, label, Icon }) => {
          const isActive = activeTab === id;
          return (
            <motion.button
              key={id}
              className={`bottom-nav__item ${isActive ? 'bottom-nav__item--active' : ''}`}
              onClick={() => handleTab(id)}
              whileTap={{ scale: 0.88 }}
            >
              <div className="bottom-nav__icon-wrap">
                <motion.div
                  animate={isActive ? { scale: 1.1 } : { scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                >
                  <Icon
                    size={22}
                    strokeWidth={isActive ? 2.5 : 1.8}
                    fill={isActive && id === 'home' ? 'currentColor' : 'none'}
                  />
                </motion.div>
                {isActive && (
                  <motion.div
                    className="bottom-nav__dot"
                    layoutId="bn-dot"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </div>
              <span className="bottom-nav__label">{label}</span>
            </motion.button>
          );
        })}
      </nav>

      {/* Search overlay */}
      <AnimatePresence>
        {searchOpen && (
          <MobileSearch
            onClose={() => setSearchOpen(false)}
            onProfileSelect={handleProfileSelect}
          />
        )}
      </AnimatePresence>
    </>
  );
}
