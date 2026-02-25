import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Link2, Check } from 'lucide-react';
import { ProfileOverlay } from '../components/profile/ProfileOverlay';
import { BottomNav } from '../components/nav/BottomNav';
import { toast } from 'sonner';
import './UserProfilePage.css';

export function UserProfilePage() {
  const { username } = useParams();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      toast.success('Profile link copied!');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="upp-page">
      {/* Top bar */}
      <div className="upp-topbar">
        <button className="upp-back" onClick={() => navigate(-1)} aria-label="Back">
          <ArrowLeft size={20} strokeWidth={2.5} />
        </button>
        <span className="upp-topbar__label">@{username}</span>
        <motion.button
          className="upp-share"
          onClick={handleCopy}
          whileTap={{ scale: 0.88 }}
          aria-label="Copy link"
        >
          {copied ? <Check size={18} strokeWidth={2.5} /> : <Link2 size={18} strokeWidth={2.5} />}
        </motion.button>
      </div>

      <BottomNav />

      {/* Profile overlay rendered as a full page card */}
      <div className="upp-content">
        <ProfileOverlay
          username={username}
          onClose={() => navigate(-1)}
          isPage
        />
      </div>
    </div>
  );
}
