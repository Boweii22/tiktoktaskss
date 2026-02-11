import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Share2, Copy, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Button } from '../ui/button';
import { generateShareUrl, shareTask } from '../../lib/api';

export const ShareDialog = ({ task, variant = 'default' }) => {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  
  if (!task) return null;
  
  const isIcon = variant === 'icon';
  
  const rate = task.stats?.completion_rate?.toFixed(1) || '0.0';
  const shareUrl = generateShareUrl(task.id);
  
  const handleNativeShare = async () => {
    const result = await shareTask(task);
    if (result === 'copied') {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
    if (result === true) {
      setOpen(false);
    }
  };
  
  const handleCopy = async () => {
    const text = `Only ${rate}% passed "${task.name}" - Can you beat this impossible task?\n${shareUrl}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isIcon ? (
          <motion.button
            type="button"
            className="action-bar__btn"
            data-testid="share-button"
            whileTap={{ scale: 0.88 }}
            whileHover={{ scale: 1.05 }}
          >
            <div className="action-bar__icon-wrap">
              <Share2 size={28} strokeWidth={2} />
            </div>
            <span className="action-bar__count">Share</span>
          </motion.button>
        ) : (
          <button 
            className="fixed bottom-24 right-4 touch-target p-3 bg-slate-900/80 text-white rounded-full backdrop-blur-sm hover:bg-slate-800 transition-colors z-[100]"
            data-testid="share-button"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0)' }}
          >
            <Share2 size={20} strokeWidth={2} />
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-[var(--bg-default)] text-[var(--fg-default)] border-[var(--bg-subtle)]" data-testid="share-dialog">
        <DialogHeader>
          <DialogTitle className="font-semibold" style={{ color: 'var(--fg-default)' }}>Share this challenge</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="rounded-lg p-4 text-center" style={{ background: 'var(--bg-subtle)' }}>
            <p className="text-2xl font-bold mb-1" style={{ color: 'var(--fg-default)' }}>Only {rate}%</p>
            <p className="text-sm" style={{ color: 'var(--fg-muted)' }}>passed "{task.name}"</p>
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 text-sm border-0 rounded-lg px-3 py-2 font-mono"
              style={{ background: 'var(--bg-subtle)', color: 'var(--fg-default)' }}
              data-testid="share-url-input"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopy}
              className="shrink-0"
              data-testid="copy-link-button"
            >
              {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
            </Button>
          </div>
          
          <Button 
            onClick={handleNativeShare}
            className="w-full"
            style={{ background: 'var(--brand-primary)', color: 'var(--fg-inverse)' }}
            data-testid="native-share-button"
          >
            <Share2 size={16} className="mr-2" />
            Share Challenge
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
