import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Clock, Eye, RefreshCw, Loader } from 'lucide-react';
import { api, getSessionId } from '../lib/api';
import { toast } from 'sonner';
import './AdminPage.css';

const STATUS_CONFIG = {
  pending:    { label: 'Pending',    color: 'status-pending',    icon: Clock },
  reviewing:  { label: 'Reviewing',  color: 'status-reviewing',  icon: Eye },
  implemented:{ label: 'Implemented',color: 'status-implemented',icon: CheckCircle },
};

const NEXT_STATUSES = {
  pending:    ['reviewing', 'implemented'],
  reviewing:  ['implemented', 'pending'],
  implemented:['pending'],
};

export function AdminPage() {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [filter, setFilter] = useState('all');
  const [isAdmin, setIsAdmin] = useState(null);

  const loadProposals = useCallback(async () => {
    setLoading(true);
    try {
      const list = await api.getAllProposals();
      setIsAdmin(true);
      setProposals(list);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 403) {
        setIsAdmin(false);
      } else {
        toast.error('Failed to load proposals: ' + (err?.response?.data?.detail || err.message));
        setIsAdmin(true);
        setProposals([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadProposals(); }, [loadProposals]);

  const handleStatus = async (proposal, newStatus) => {
    setUpdatingId(proposal.id);
    try {
      await api.updateProposalStatus(proposal.id, newStatus);
      setProposals(prev => prev.map(p => p.id === proposal.id ? { ...p, status: newStatus } : p));
      toast.success(`Marked as ${STATUS_CONFIG[newStatus]?.label}`);
    } catch (e) {
      const detail = e?.response?.data?.detail || e.message || '';
      toast.error('Failed to update status' + (detail ? `: ${detail}` : ''));
    } finally {
      setUpdatingId(null);
    }
  };

  const displayed = filter === 'all' ? proposals : proposals.filter(p => p.status === filter);

  const counts = proposals.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="admin-page admin-page--center">
        <Loader size={32} className="admin-spinner" />
        <p>Loading proposals...</p>
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="admin-page admin-page--center">
        <h1>403 — Admin access required</h1>
        <p>Your session is not in the admin list. Set <code>ADMIN_SESSION_IDS</code> in the backend <code>.env</code> to your session ID.</p>
        <code className="admin-session-id">Your session: {getSessionId()}</code>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <h1 className="admin-title">Community Proposals</h1>
          <p className="admin-subtitle">{proposals.length} total · {counts.pending || 0} pending · {counts.reviewing || 0} reviewing · {counts.implemented || 0} implemented</p>
        </div>
        <button className="admin-refresh" onClick={loadProposals} aria-label="Refresh">
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>

      <div className="admin-filters">
        {['all', 'pending', 'reviewing', 'implemented'].map(f => (
          <button
            key={f}
            className={`admin-filter ${filter === f ? 'admin-filter--active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? `All (${proposals.length})` : `${STATUS_CONFIG[f]?.label} (${counts[f] || 0})`}
          </button>
        ))}
      </div>

      {displayed.length === 0 ? (
        <div className="admin-empty">No proposals here yet.</div>
      ) : (
        <div className="admin-list">
          <AnimatePresence>
            {displayed.map(proposal => {
              const cfg = STATUS_CONFIG[proposal.status] || STATUS_CONFIG.pending;
              const StatusIcon = cfg.icon;
              const nextStatuses = NEXT_STATUSES[proposal.status] || [];
              const date = proposal.created_at ? new Date(proposal.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
              return (
                <motion.div
                  key={proposal.id}
                  className="admin-card"
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                >
                  <div className="admin-card__top">
                    <div className="admin-card__meta">
                      <span className="admin-card__user">@{proposal.created_by_username}</span>
                      <span className="admin-card__date">{date}</span>
                      <span className={`admin-card__badge admin-card__badge--${proposal.status}`}>
                        <StatusIcon size={12} />
                        {cfg.label}
                      </span>
                    </div>
                    <div className="admin-card__actions">
                      {nextStatuses.map(next => {
                        const NextIcon = STATUS_CONFIG[next]?.icon;
                        return (
                          <motion.button
                            key={next}
                            className={`admin-action admin-action--${next}`}
                            onClick={() => handleStatus(proposal, next)}
                            disabled={updatingId === proposal.id}
                            whileTap={{ scale: 0.96 }}
                          >
                            {updatingId === proposal.id
                              ? <Loader size={14} className="admin-spinner--sm" />
                              : NextIcon && <NextIcon size={14} />}
                            {STATUS_CONFIG[next]?.label}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>

                  {proposal.title && (
                    <h3 className="admin-card__title">{proposal.title}</h3>
                  )}
                  <p className="admin-card__idea">{proposal.idea_text}</p>
                  {proposal.image_url && (
                    <div className="admin-card__img">
                      <img src={proposal.image_url} alt="" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
