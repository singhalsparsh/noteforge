'use client';

import { useState } from 'react';

interface Props {
  title: string;
  description?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteConfirmModal({ title, description, onConfirm, onCancel }: Props) {
  const [input, setInput] = useState('');

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content w-[380px] max-w-[90vw] p-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-500 shrink-0">
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
            </svg>
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">{title}</h3>
            {description && <p className="text-xs text-[var(--text-secondary)] mt-0.5">{description}</p>}
          </div>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
          Type <strong className="text-red-500">DELETE</strong> to confirm:
        </p>

        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && input === 'DELETE') onConfirm(); if (e.key === 'Escape') onCancel(); }}
          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm outline-none focus:ring-2 focus:ring-red-500 mb-4"
          placeholder="Type DELETE here"
          autoFocus
        />

        <div className="flex justify-end gap-2">
          <button onClick={onCancel}
            className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            Cancel
          </button>
          <button onClick={() => { if (input === 'DELETE') onConfirm(); }}
            disabled={input !== 'DELETE'}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              input === 'DELETE'
                ? 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/30'
                : 'bg-gray-200 dark:bg-gray-600 text-gray-400 dark:text-gray-500 cursor-not-allowed'
            }`}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
