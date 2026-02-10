import React from 'react';

export const StatsOverlay = ({ task, localAttempts = 0 }) => {
  const stats = task?.stats || {};
  const completionRate = stats.completion_rate ?? 0;
  const globalAttempts = stats.attempts ?? 0;

  return (
    <div className="stats-overlay" data-testid="stats-overlay">
      <div 
        className="font-mono text-xs bg-slate-900/80 text-white px-3 py-1.5 rounded-full backdrop-blur-sm"
        data-testid="completion-rate"
      >
        <span className="opacity-60">Pass rate:</span>{' '}
        <span className="font-bold text-emerald-400">{completionRate.toFixed(1)}%</span>
      </div>
      <div 
        className="font-mono text-xs bg-slate-900/80 text-white px-3 py-1.5 rounded-full backdrop-blur-sm"
        data-testid="attempt-counter"
      >
        <span className="opacity-60">Your tries:</span>{' '}
        <span className="font-bold">{localAttempts}</span>
      </div>
      <div 
        className="font-mono text-xs text-slate-500"
        data-testid="global-attempts"
      >
        {globalAttempts.toLocaleString()} global attempts
      </div>
    </div>
  );
};
