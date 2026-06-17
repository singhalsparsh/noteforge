'use client';

import { useState } from 'react';
import { useStore } from '@/store/useStore';

interface Props {
  boardId: string;
  onClose: () => void;
}

export default function ShareDialog({ boardId, onClose }: Props) {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [expiry, setExpiry] = useState<number>(0); // 0 = never, in ms
  const [showExpiry, setShowExpiry] = useState(false);
  const { boardName, collaborators, addCollaborator, userName } = useStore();

  const EXPIRY_OPTIONS = [
    { label: '1 hour', value: 60 * 60 * 1000 },
    { label: '24 hours', value: 24 * 60 * 60 * 1000 },
    { label: '7 days', value: 7 * 24 * 60 * 60 * 1000 },
    { label: '30 days', value: 30 * 24 * 60 * 60 * 1000 },
    { label: 'Never', value: 0 },
  ];

  function getExpiryLabel(): string {
    if (!expiry) return 'Never';
    const opt = EXPIRY_OPTIONS.find(o => o.value === expiry);
    return opt ? opt.label : 'Custom';
  }

  function getExpiryTime(): number | null {
    if (!expiry) return null;
    return Date.now() + expiry;
  }

  function isExpired(): boolean {
    const stored = localStorage.getItem(`nf_share_expiry_${boardId}`);
    if (!stored) return false;
    return Date.now() > parseInt(stored);
  }

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/board/${boardId}`
    : '';

  function copyLink() {
    // Store expiry info
    if (expiry) {
      localStorage.setItem(`nf_share_expiry_${boardId}`, String(Date.now() + expiry));
    } else {
      localStorage.removeItem(`nf_share_expiry_${boardId}`);
    }
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content w-[400px] max-w-[95vw] p-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold">Share</h2>
            <p className="text-xs text-[var(--text-secondary)]">{boardName}</p>
          </div>
          <button onClick={onClose} className="glass-button p-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className="space-y-3">
          {/* Share link */}
          <div>
            <label className="text-xs font-medium mb-1 block">Share link</label>
            <div className="flex gap-2">
              <input value={shareUrl} readOnly className="glass-input flex-1 text-xs" />
              <button onClick={copyLink} className={`glass-button shrink-0 text-xs ${copied ? 'bg-green-500 text-white border-green-500' : ''}`}>
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Link expiry */}
          <div>
            <label className="text-xs font-medium mb-1 block">Link expiry</label>
            <div className="flex gap-1 flex-wrap">
              {EXPIRY_OPTIONS.map(opt => (
                <button key={opt.value}
                  onClick={() => setExpiry(opt.value)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all ${
                    expiry === opt.value
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >{opt.label}</button>
              ))}
            </div>
            {expiry > 0 && (
              <p className="text-[10px] text-gray-400 mt-1">
                Link will expire {getExpiryLabel()} from when you copy it
              </p>
            )}
          </div>

          {/* QR Code */}
          <button onClick={() => setShowQR(!showQR)} className="glass-button w-full justify-center text-xs">
            {showQR ? 'Hide QR' : 'Show QR Code'}
          </button>

          {showQR && (
            <div className="flex justify-center p-3">
              <div className="w-36 h-36 bg-white rounded-xl p-2 shadow">
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(shareUrl)}`} alt="QR" className="w-full h-full" />
              </div>
            </div>
          )}

          {/* Expired warning */}
          {isExpired() && (
            <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-[11px] text-red-600 dark:text-red-400 flex items-center gap-2">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              This share link has expired. Set a new expiry and copy the link again.
            </div>
          )}

          {/* People online */}
          <div className="border-t border-[var(--border-color)] pt-3">
            <h3 className="text-xs font-medium mb-2">People on this board</h3>
            <div className="space-y-1.5">
              {[useStore.getState().userId, ...collaborators.map(c => c.userId)].map((id, i) => (
                <div key={id} className="flex items-center gap-2 text-xs">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[8px] font-bold"
                    style={{ background: i === 0 ? '#6965db' : collaborators[i - 1]?.color || '#6965db' }}>
                    {(i === 0 ? userName : collaborators[i - 1]?.userName || '?').charAt(0).toUpperCase()}
                  </div>
                  <span className="flex-1 truncate">{i === 0 ? userName + ' (you)' : collaborators[i - 1]?.userName}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                </div>
              ))}
              {collaborators.length === 0 && (
                <p className="text-xs text-[var(--text-secondary)]">No one else is on this board yet. Share the link to collaborate!</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
