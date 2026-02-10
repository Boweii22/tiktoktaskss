import React, { useState } from 'react';
import { Share2, Copy, Check, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Button } from '../ui/button';
import { generateShareUrl, shareTask } from '../../lib/api';

export const ShareDialog = ({ task }) => {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  
  if (!task) return null;
  
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
        <button 
          className="fixed bottom-24 right-4 touch-target p-3 bg-slate-900/80 text-white rounded-full backdrop-blur-sm hover:bg-slate-800 transition-colors z-[100]"
          data-testid="share-button"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0)' }}
        >
          <Share2 size={20} />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-white" data-testid="share-dialog">
        <DialogHeader>
          <DialogTitle className="font-semibold text-slate-900">Share this challenge</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="bg-slate-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-slate-900 mb-1">Only {rate}%</p>
            <p className="text-sm text-slate-600">passed "{task.name}"</p>
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 text-sm bg-slate-100 border-0 rounded-lg px-3 py-2 text-slate-700 font-mono"
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
            className="w-full bg-slate-900 hover:bg-slate-800 text-white"
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
