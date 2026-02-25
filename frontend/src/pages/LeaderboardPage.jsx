import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Trophy, Flame, Users, ArrowLeft, RefreshCw, User } from 'lucide-react';
import { api } from '../lib/api';
import './LeaderboardPage.css';

const TABS = [
  { id: 'completions', label: 'Completions', icon: Trophy, unit: 'tasks', color: '#f59e0b' },
  { id: 'streak',      label: 'Streak',      icon: Flame,  unit: 'days',  color: '#ef4444' },
  { id: 'followers',   label: 'Followers',   icon: Users,  unit: '',      color: '#8b5cf6' },
];

const MEDALS = ['🥇', '🥈', '🥉'];

function Avatar({ url, username, size = 44 }) {
  const initials = (username || '?').slice(0, 2).toUpperCase();
  return (
    <div className="lb-avatar" style={{ width: size, height: size, fontSize: size * 0.34 }}>
      {url
        ? <img src={url} alt="" className="lb-avatar__img" />
        : <span>{initials}</span>}
    </div>
  );
}

function PlayerRow({ player, tab, onProfileClick, delay }) {
  const isMedal = player.rank <= 3;
  const tabInfo = TABS.find(t => t.id === tab);
  return (
    <motion.div
      className={`lb-row ${isMedal ? `lb-row--medal lb-row--rank${player.rank}` : ''}`}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, type: 'spring', stiffness: 300, damping: 28 }}
      onClick={() => onProfileClick(player.username)}
    >
      <div className="lb-row__rank">
        {isMedal ? (
          <span className="lb-row__medal">{MEDALS[player.rank - 1]}</span>
        ) : (
          <span className="lb-row__num">{player.rank}</span>
        )}
      </div>
      <Avatar url={player.avatar_url} username={player.username} />
      <div className="lb-row__info">
        <span className="lb-row__name">{player.display_name}</span>
        <span className="lb-row__username">@{player.username}</span>
      </div>
      <div className="lb-row__stat">
        <span className="lb-row__value" style={{ color: tabInfo?.color }}>
          {(player.value || 0).toLocaleString()}
        </span>
        <span className="lb-row__unit">{tabInfo?.unit}</span>
        {player.sub_value > 0 && (
          <span className="lb-row__sub">{player.sub_value} {player.sub_label}</span>
        )}
      </div>
    </motion.div>
  );
}

function Skeleton() {
  return (
    <div className="lb-skeleton">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="lb-skeleton__row" style={{ animationDelay: `${i * 0.07}s` }}>
          <div className="lb-skeleton__rank" />
          <div className="lb-skeleton__avatar" />
          <div className="lb-skeleton__text">
            <div className="lb-skeleton__line lb-skeleton__line--name" />
            <div className="lb-skeleton__line lb-skeleton__line--sub" />
          </div>
          <div className="lb-skeleton__value" />
        </div>
      ))}
    </div>
  );
}

export function LeaderboardPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('completions');
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewProfile, setViewProfile] = useState(null);

  const load = useCallback(async (t, isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    const list = await api.getPlayerLeaderboard(t);
    setData(prev => ({ ...prev, [t]: list }));
    if (isRefresh) setRefreshing(false); else setLoading(false);
  }, []);

  useEffect(() => {
    if (!data[tab]) load(tab);
    else setLoading(false);
  }, [tab, data, load]);

  const players = data[tab] || [];
  const showSkeleton = loading && !data[tab];

  return (
    <div className="lb-page">
      {/* Header */}
      <div className="lb-header">
        <button className="lb-back" onClick={() => navigate('/')} aria-label="Back">
          <ArrowLeft size={20} strokeWidth={2.5} />
        </button>
        <div className="lb-header__title-wrap">
          <Trophy size={22} strokeWidth={2} className="lb-header__trophy" />
          <h1 className="lb-header__title">Leaderboard</h1>
        </div>
        <motion.button
          className="lb-refresh"
          onClick={() => load(tab, true)}
          animate={refreshing ? { rotate: 360 } : { rotate: 0 }}
          transition={refreshing ? { duration: 0.7, repeat: Infinity, ease: 'linear' } : {}}
          aria-label="Refresh"
        >
          <RefreshCw size={18} strokeWidth={2.2} />
        </motion.button>
      </div>

      {/* Tab pills */}
      <div className="lb-tabs">
        {TABS.map(({ id, label, icon: Icon }) => (
          <motion.button
            key={id}
            className={`lb-tab ${tab === id ? 'lb-tab--active' : ''}`}
            onClick={() => { setTab(id); setLoading(!data[id]); }}
            whileTap={{ scale: 0.95 }}
          >
            <Icon size={15} strokeWidth={2.2} />
            {label}
          </motion.button>
        ))}
      </div>

      {/* List */}
      <div className="lb-list-wrap">
        <AnimatePresence mode="wait">
          {showSkeleton ? (
            <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Skeleton />
            </motion.div>
          ) : players.length === 0 ? (
            <motion.div
              key="empty"
              className="lb-empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <Trophy size={48} strokeWidth={1.2} className="lb-empty__icon" />
              <p className="lb-empty__title">No players yet</p>
              <p className="lb-empty__sub">Play some tasks to appear here!</p>
            </motion.div>
          ) : (
            <motion.div
              key={tab}
              className="lb-list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {players.map((p, i) => (
                <PlayerRow
                  key={p.username}
                  player={p}
                  tab={tab}
                  onProfileClick={(un) => navigate(`/u/${un}`)}
                  delay={i * 0.035}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
