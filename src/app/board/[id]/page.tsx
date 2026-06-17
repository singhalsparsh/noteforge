'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { getNotebooks, saveNotebook } from '@/lib/database';
import Canvas from '@/components/canvas/Canvas';
import MainToolbar from '@/components/toolbar/MainToolbar';
import TopBar from '@/components/toolbar/TopBar';
import ShareDialog from '@/components/collaboration/ShareDialog';
import ChatPanel from '@/components/collaboration/ChatPanel';
import ExportDialog from '@/components/editor/ExportDialog';
import MarketplacePanel from '@/components/toolbar/MarketplacePanel';
import DeleteConfirmModal from '@/components/ui/DeleteConfirmModal';
import { usePeerCollaboration } from '@/lib/usePeerCollaboration';
import { emitElementsUpdate } from '@/lib/peerClient';

export default function BoardPage() {
  const params = useParams();
  const router = useRouter();
  const boardId = params.id as string;

  const { setBoardId, setElements, setBoardName, setTheme, theme, elements,
    showShareDialog, showExportDialog, showChat, showLibrary, setShowLibrary,
    zoom, setZoom, scrollX, scrollY, setScroll, undo, redo, undoStack, redoStack,
  } = useStore();

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    // Check if the link has expired
    const expiryStr = localStorage.getItem(`nf_share_expiry_${boardId}`);
    if (expiryStr && Date.now() > parseInt(expiryStr)) {
      // Link expired — still allow loading, but show a warning
      console.warn('Share link has expired for board:', boardId);
    }
    loadBoard();
  }, [boardId]);

  async function loadBoard() {
    try {
      const data = await getNotebooks();
      const board = data.find((b: any) => b.id === boardId);
      if (board) {
        setBoardId(board.id);
        setBoardName(board.name || 'Untitled');
        setElements(board.elements || []);
      } else {
        setBoardId(boardId);
        setBoardName('Untitled');
        setElements([]);
        const newBoard = {
          id: boardId,
          name: 'Untitled',
          elements: [],
          background: '#ffffff',
          gridMode: 'dots' as const,
          created: Date.now(),
          updated: Date.now(),
          version: 1,
        };
        await saveNotebook(newBoard);
      }
    } catch (e) {
      console.error('Failed to load board:', e);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }

  // Auto-save
  useEffect(() => {
    if (loading) return;
    const timer = setInterval(async () => {
      const state = useStore.getState();
      const data = {
        id: boardId,
        name: state.boardName,
        elements: state.elements,
        background: state.background,
        gridMode: state.gridMode,
        updated: Date.now(),
        version: (state.elements.reduce((max, e) => Math.max(max, e.version), 0)),
      };
      await saveNotebook(data);
    }, 3000);
    return () => clearInterval(timer);
  }, [boardId, loading]);

  // Broadcast elements changes to collaborators (poll + subscribe for immediate propagation)
  useEffect(() => {
    if (loading) return;
    let lastJson = '';

    // Subscribe to element changes and emit immediately when changed
    const unsub = useStore.subscribe((s) => {
      if (s.isCollaborating && s.elements.length > 0) {
        const currentJson = JSON.stringify(s.elements.map(e => ({ id: e.id, version: e.version })));
        if (currentJson !== lastJson) {
          lastJson = currentJson;
          emitElementsUpdate(boardId, s.elements);
        }
      }
    });

    // Also keep the fallback interval
    const timer = setInterval(() => {
      const state = useStore.getState();
      if (state.isCollaborating && state.elements.length > 0) {
        const currentJson = JSON.stringify(state.elements.map(e => ({ id: e.id, version: e.version })));
        if (currentJson !== lastJson) {
          lastJson = currentJson;
          emitElementsUpdate(boardId, state.elements);
        }
      }
    }, 1000);

    return () => { clearInterval(timer); unsub(); };
  }, [boardId, loading]);

  // Real-time collaboration (P2P via PeerJS)
  usePeerCollaboration(boardId);

  // Right-click context menu
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; elementId?: string } | null>(null);

  useEffect(() => {
    function handleClick() { setContextMenu(null); }
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  function handleCanvasContext(e: React.MouseEvent) {
    e.preventDefault();
    const canvas = document.querySelector('.canvas-container');
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setContextMenu({ x, y });
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="flex flex-col items-center gap-2">
          <div className="spinner w-6 h-6" />
          <span className="text-sm text-[var(--text-secondary)]">Loading...</span>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[var(--bg-primary)]">
        <div className="mb-4">
          <svg className="w-16 h-16 text-gray-300 dark:text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </div>
        <h2 className="text-lg font-bold mb-1">Board not found</h2>
        <button onClick={() => router.push('/')} className="glass-button-primary mt-3 px-4">Back home</button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[var(--bg-primary)]">
      <TopBar />

      <div className="flex-1 flex overflow-hidden relative">
        {/* Marketplace panel (replaces Library) */}
        {showLibrary && <MarketplacePanel />}

        {/* Canvas area */}
        <div className="flex-1 relative overflow-hidden" onContextMenu={handleCanvasContext}>
          <Canvas />

          {/* Zoom controls — floating bottom-right above toolbar */}
          <div className="absolute bottom-20 sm:bottom-24 right-2 sm:right-4 z-20 flex items-center gap-0.5
            bg-white/70 dark:bg-gray-800/70 backdrop-blur-2xl
            rounded-full px-1 py-1
            shadow-[0_4px_16px_rgba(0,0,0,0.1)]
            border border-white/50 dark:border-gray-700/50">
            <button onClick={() => { const z = Math.max(10, zoom - 35); setZoom(z); setScroll(scrollX - (window.innerWidth / 2) * ((z / 100) / (zoom / 100) - 1), scrollY - (window.innerHeight / 2) * ((z / 100) / (zoom / 100) - 1)); }} className="w-7 h-7 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-300">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </button>
            <span className="min-w-[36px] text-center text-[10px] font-medium text-gray-500 dark:text-gray-400 select-none">{Math.round(zoom)}%</span>
            <button onClick={() => { const z = Math.min(500, zoom + 35); setZoom(z); setScroll(scrollX - (window.innerWidth / 2) * ((z / 100) / (zoom / 100) - 1), scrollY - (window.innerHeight / 2) * ((z / 100) / (zoom / 100) - 1)); }} className="w-7 h-7 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-300">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </button>
            <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-0.5" />
            <button onClick={() => { setZoom(100); setScroll(0, 0); }} className="w-7 h-7 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400" title="Reset zoom">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>
            </button>
          </div>

          {/* Right-click context menu */}
          {contextMenu && (
            <div
              className="context-menu"
              style={{ left: contextMenu.x, top: contextMenu.y }}
            >
              <button className="w-full px-3 py-1.5 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-700 dark:text-gray-200"
                onClick={() => { useStore.getState().pushUndoStack(); useStore.getState().duplicateElements([...useStore.getState().selectedElementIds]); setContextMenu(null); }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                Duplicate
              </button>
              <button className="w-full px-3 py-1.5 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-red-500 font-medium"
                onClick={() => { setShowDeleteModal(true); setContextMenu(null); }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                Delete
              </button>
              <div className="h-px bg-gray-200 dark:bg-gray-700 my-1 mx-2" />
              <button className="w-full px-3 py-1.5 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-700 dark:text-gray-200"
                onClick={() => { useStore.getState().setShowShareDialog(true); setContextMenu(null); }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                Share link...
              </button>
              <button className="w-full px-3 py-1.5 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-700 dark:text-gray-200"
                onClick={() => { useStore.getState().setShowExportDialog(true); setContextMenu(null); }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Export...
              </button>
            </div>
          )}
        </div>

        {/* Chat panel */}
        {showChat && <ChatPanel boardId={boardId} />}
      </div>

      {/* Floating bottom toolbar */}
      <MainToolbar />

      {/* Modals */}
      {showShareDialog && (
        <ShareDialog boardId={boardId} onClose={() => useStore.getState().setShowShareDialog(false)} />
      )}
      {showExportDialog && (
        <ExportDialog boardId={boardId} onClose={() => useStore.getState().setShowExportDialog(false)} />
      )}
      {showDeleteModal && (
        <DeleteConfirmModal
          title="Delete Elements"
          description={`Delete ${useStore.getState().selectedElementIds.size} selected element(s).`}
          onConfirm={() => { useStore.getState().pushUndoStack(); useStore.getState().deleteElements([...useStore.getState().selectedElementIds]); setShowDeleteModal(false); }}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );
}
