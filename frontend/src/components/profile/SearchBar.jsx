import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, User } from 'lucide-react';
import { api } from '../../lib/api';
import './SearchBar.css';

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function getInitials(username) {
  if (!username) return '?';
  const parts = username.replace(/[@]/g, '').split(/[._-]/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return username.slice(0, 2).toUpperCase();
}

export function SearchBar({ onProfileSelect }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const overlayRef = useRef(null);
  const debouncedQuery = useDebounce(query, 280);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => inputRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, [open]);

  const doSearch = useCallback(async (q) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    const list = await api.searchProfiles(q.trim());
    setResults(list || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    doSearch(debouncedQuery);
  }, [debouncedQuery, doSearch]);

  const handleOpen = () => {
    setOpen(true);
    setQuery('');
    setResults([]);
  };

  const handleClose = () => {
    setOpen(false);
    setQuery('');
    setResults([]);
  };

  const handleSelect = (result) => {
    handleClose();
    onProfileSelect?.(result.username);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') handleClose();
  };

  const overlay = (
    <AnimatePresence>
      {open && (
        <motion.div
          className="search-bar__overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={(e) => { if (e.target === overlayRef.current) handleClose(); }}
            ref={overlayRef}
          >
            <motion.div
              className="search-bar__panel"
              initial={{ opacity: 0, y: -24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            >
              <div className="search-bar__input-row">
                <Search size={18} strokeWidth={2} className="search-bar__input-icon" />
                <input
                  ref={inputRef}
                  className="search-bar__input"
                  type="text"
                  placeholder="Search by username…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoComplete="off"
                  spellCheck={false}
                />
                {query && (
                  <motion.button
                    className="search-bar__clear"
                    onClick={() => { setQuery(''); setResults([]); inputRef.current?.focus(); }}
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.7 }}
                    whileTap={{ scale: 0.85 }}
                  >
                    <X size={15} strokeWidth={2.5} />
                  </motion.button>
                )}
                <button className="search-bar__close-btn" onClick={handleClose} aria-label="Close search">
                  <X size={18} strokeWidth={2.2} />
                </button>
              </div>

              <AnimatePresence mode="wait">
                {loading && (
                  <motion.div
                    key="loading"
                    className="search-bar__state"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="search-bar__spinner" />
                    <span>Searching…</span>
                  </motion.div>
                )}

                {!loading && query && results.length === 0 && (
                  <motion.div
                    key="empty"
                    className="search-bar__state"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    <User size={28} strokeWidth={1.5} className="search-bar__empty-icon" />
                    <span>No users found for <strong>@{query}</strong></span>
                  </motion.div>
                )}

                {!loading && results.length > 0 && (
                  <motion.ul
                    key="results"
                    className="search-bar__results"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {results.map((r, i) => (
                      <motion.li
                        key={r.username}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04, type: 'spring', stiffness: 400, damping: 30 }}
                      >
                        <button
                          className="search-bar__result"
                          onClick={() => handleSelect(r)}
                        >
                          <div className="search-bar__avatar">
                            {r.avatar_url
                              ? <img src={r.avatar_url} alt="" className="search-bar__avatar-img" />
                              : getInitials(r.username)}
                          </div>
                          <div className="search-bar__result-info">
                            <span className="search-bar__result-name">{r.display_name || r.username}</span>
                            <span className="search-bar__result-username">@{r.username}</span>
                          </div>
                        </button>
                      </motion.li>
                    ))}
                  </motion.ul>
                )}

                {!loading && !query && (
                  <motion.div
                    key="hint"
                    className="search-bar__state search-bar__state--hint"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <Search size={24} strokeWidth={1.5} className="search-bar__empty-icon" />
                    <span>Type a username to find people</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
  );

  return (
    <>
      <motion.button
        className="search-bar__trigger"
        onClick={handleOpen}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.93 }}
        aria-label="Search users"
      >
        <Search size={20} strokeWidth={2.2} />
      </motion.button>

      {ReactDOM.createPortal(overlay, document.body)}
    </>
  );
}
