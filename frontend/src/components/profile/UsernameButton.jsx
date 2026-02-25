import React from 'react';
import { User } from 'lucide-react';
import { motion } from 'framer-motion';
import './UsernameButton.css';

export function UsernameButton({ username, displayName, avatarUrl, onClick }) {
  if (!username) return null;

  return (
    <motion.button
      className="username-button"
      onClick={onClick}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      aria-label={`View ${displayName || username}'s profile`}
    >
      <span className="username-button__avatar">
        {avatarUrl
          ? <img src={avatarUrl} alt="" className="username-button__avatar-img" />
          : <User size={14} strokeWidth={2.5} />}
      </span>
      <span className="username-button__text">@{username}</span>
    </motion.button>
  );
}
