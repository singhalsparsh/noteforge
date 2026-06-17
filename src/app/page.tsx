'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { generateId, formatDate } from '@/lib/utils';
import { getNotebooks, saveNotebook } from '@/lib/database';
import { renderElement } from '@/lib/renderer';
import { moderateName } from '@/lib/moderation';
import { Element } from '@/types';
import DeleteConfirmModal from '@/components/ui/DeleteConfirmModal';

export default function HomePage() {
  const router = useRouter();
  const { theme, toggleTheme, userName, setUserName } = useStore();
  const [boards, setBoards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [newName, setNewName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [selectedBoards, setSelectedBoards] = useState<Set<string>>(new Set());
  const [showBulkDelete, setShowBulkDelete] = useState(false);

  useEffect(() => {
    loadBoards();
    // Check if first visit
    if (!localStorage.getItem('nf_userName') || localStorage.getItem('nf_userName') === 'Anonymous') {
      setShowNamePrompt(true);
    }
  }, []);

  async function loadBoards() {
    try {
      const data = await getNotebooks();
      setBoards(data || []);
    } catch { /* ignore */ }
    setLoading(false);
  }

  function handleNameSubmit() {
    let name = newName.trim() || 'Anonymous';
    const result = moderateName(name);
    if (result.blocked) name = result.clean;
    setUserName(name);
    setShowNamePrompt(false);
  }

  function createBoard() {
    const id = generateId();
    const board = {
      id,
      name: 'Untitled',
      elements: [],
      background: '#ffffff',
      gridMode: 'dots',
      created: Date.now(),
      updated: Date.now(),
      version: 1,
    };
    saveNotebook(board);
    router.push(`/board/${id}`);
  }

  function confirmDeleteBoard(id: string) {
    const filtered = boards.filter(b => b.id !== id);
    setBoards(filtered);
    getNotebooks().then(all => {
      saveNotebook(all.filter((b: any) => b.id !== id));
    });
    setDeleteTarget(null);
  }

  function toggleBoardSelection(id: string) {
    setSelectedBoards(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function confirmBulkDelete() {
    const ids = [...selectedBoards];
    if (ids.length === 0) return;
    const filtered = boards.filter(b => !ids.includes(b.id));
    setBoards(filtered);
    setSelectedBoards(new Set());
    setShowBulkDelete(false);
    getNotebooks().then(all => {
      saveNotebook(all.filter((b: any) => !ids.includes(b.id)));
    });
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="glass border-b border-[var(--border-color)] px-4 lg:px-8 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
            <svg viewBox="0 0 16 16" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 2h10a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z"/>
              <path d="M5 5h6M5 8h4M5 11h5"/>
            </svg>
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">NoteForge</h1>
        </div>

        <div className="flex items-center gap-3">
          <input
            value={userName}
            onChange={e => {
              const val = e.target.value;
              const result = moderateName(val);
              if (!result.blocked) setUserName(val);
            }}
            className="glass-input w-28 text-sm text-center"
            placeholder="Your name"
          />
          <button onClick={() => router.push('/docs')} className="glass-button px-2.5 py-1.5 text-xs" title="Documentation">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            Docs
          </button>
          <button onClick={toggleTheme} className="glass-button p-2.5" title={theme === 'light' ? 'Dark mode' : 'Light mode'}>
            {theme === 'light' ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Name prompt modal */}
      {showNamePrompt && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-2xl max-w-sm w-[90vw] border border-white/50">
            <h2 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">Welcome to NoteForge</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">What should we call you?</p>
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleNameSubmit()}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm mb-3 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Your name"
              autoFocus
            />
            <button onClick={handleNameSubmit} className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium hover:opacity-90 transition-opacity">
              Get Started
            </button>
          </div>
        </div>
      )}

      {/* Main */}
      <main className="flex-1 overflow-y-auto p-4 lg:p-8">
        {boards.length === 0 && !loading && (
          <div className="glass-card p-8 mb-8 text-center max-w-lg mx-auto mt-16">
            <div className="mb-4 flex justify-center">
              <svg viewBox="0 0 24 24" className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Welcome to NoteForge</h2>
            <p className="text-[var(--text-secondary)] mb-6">A sketchy whiteboard for diagrams, drawings, and ideas.</p>
            <button onClick={createBoard} className="glass-button-primary px-6 py-3 text-base">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              New Board
            </button>
          </div>
        )}

        {boards.length > 0 && (
          <>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Boards</h2>
                <button
                  onClick={() => { setSelectedBoards(new Set()); }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    selectedBoards.size > 0
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                  }`}
                  title="Toggle selection mode"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2"/><polyline points="9 11 12 14 22 4"/>
                  </svg>
                </button>
              </div>
              <div className="flex items-center gap-2">
                {selectedBoards.size > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <span className="text-xs font-medium text-red-600 dark:text-red-400">{selectedBoards.size} selected</span>
                    <button onClick={() => setSelectedBoards(new Set())}
                      className="text-[10px] text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 underline">Clear</button>
                    <button onClick={() => setShowBulkDelete(true)}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-red-500 text-white hover:bg-red-600 transition-colors">
                      Delete Selected
                    </button>
                  </div>
                )}
                <button onClick={createBoard} className="glass-button-primary flex items-center gap-1.5">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  New Board
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {/* ✅ FIXED: Added index as fallback key */}
              {boards.map((board, index) => (
                <BoardCard
                  key={board?.id || `board-${index}`}
                  board={board}
                  selected={selectedBoards.has(board?.id)}
                  onSelect={(id) => { toggleBoardSelection(id); }}
                  onDelete={(id, e) => { e.stopPropagation(); setDeleteTarget(id); }}
                />
              ))}
            </div>
          </>
        )}

        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="spinner w-8 h-8" />
          </div>
        )}
      </main>

      {deleteTarget && (
        <DeleteConfirmModal
          title="Delete Board"
          description="This action cannot be undone."
          onConfirm={() => confirmDeleteBoard(deleteTarget)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {showBulkDelete && (
        <DeleteConfirmModal
          title={`Delete ${selectedBoards.size} Boards`}
          description={`This will permanently delete ${selectedBoards.size} board(s). This action cannot be undone.`}
          onConfirm={confirmBulkDelete}
          onCancel={() => setShowBulkDelete(false)}
        />
      )}
    </div>
  );
}

function BoardCard({ board, selected, onSelect, onDelete }: {
  board: any;
  selected?: boolean;
  onSelect?: (id: string) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
}) {
  const router = useRouter();
  const previewRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = previewRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    // Always white background so strokes are visible regardless of theme
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);

    // Draw a miniature preview
    const elements: Element[] = board.elements || [];
    if (elements.length === 0) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Empty board', w / 2, h / 2);
      return;
    }

    // Find bounds
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const el of elements) {
      if (el.isDeleted) continue;
      if (el.x < minX) minX = el.x;
      if (el.y < minY) minY = el.y;
      if (el.x + el.width > maxX) maxX = el.x + el.width;
      if (el.y + el.height > maxY) maxY = el.y + el.height;
    }
    if (!isFinite(minX)) return;

    const padding = 20;
    const bw = maxX - minX + padding * 2;
    const bh = maxY - minY + padding * 2;
    const scale = Math.min(w / bw, h / bh, 0.4);

    ctx.save();
    ctx.translate(w / 2 - ((minX + maxX) / 2) * scale, h / 2 - ((minY + maxY) / 2) * scale);
    ctx.scale(scale, scale);

    for (const el of elements) {
      if (el.isDeleted) continue;
      renderElement(ctx, el, false);
    }

    ctx.restore();
  }, [board.elements]);

  return (
    <div
      onClick={() => router.push(`/board/${board.id}`)}
      className={`glass-card overflow-hidden cursor-pointer group relative transition-all ${
        selected ? 'ring-2 ring-blue-500 shadow-lg shadow-blue-500/20' : ''
      }`}
    >
      {/* Selection checkbox overlay */}
      <div className="absolute top-2 left-2 z-10"
        onClick={e => { e.stopPropagation(); onSelect?.(board.id); }}>
        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
          selected
            ? 'bg-blue-500 border-blue-500'
            : 'bg-white/80 dark:bg-gray-800/80 border-gray-300 dark:border-gray-600 opacity-0 group-hover:opacity-100'
        }`}>
          {selected && (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          )}
        </div>
      </div>

      {/* Preview thumbnail — always light background so strokes are visible */}
      <div className="h-32 bg-white border-b border-[var(--border-color)] overflow-hidden">
        <canvas ref={previewRef} width={280} height={128} className="w-full h-full" />
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm mb-0.5 truncate text-gray-900 dark:text-white">{board.name || 'Untitled'}</h3>
            <p className="text-[11px] text-[var(--text-secondary)]">
              {(board.elements?.filter((e: Element) => !e.isDeleted).length || 0)} elements · {formatDate(new Date(board.updated))}
            </p>
          </div>
          <button onClick={e => onDelete(board.id, e)}
            className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 flex items-center justify-center text-red-500 transition-all shrink-0 ml-2"
            title="Delete">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}