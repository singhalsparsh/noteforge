'use client';

import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';

export default function DocsPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useStore();

  const shortcuts = [
    { keys: ['V'], desc: 'Select tool' },
    { keys: ['F'], desc: 'Freedraw / Pen tool' },
    { keys: ['R'], desc: 'Rectangle tool' },
    { keys: ['E'], desc: 'Ellipse / Circle tool' },
    { keys: ['D'], desc: 'Diamond tool' },
    { keys: ['A'], desc: 'Arrow tool' },
    { keys: ['L'], desc: 'Line tool' },
    { keys: ['T'], desc: 'Text tool' },
    { keys: ['X'], desc: 'Eraser tool' },
    { keys: ['H', 'Space'], desc: 'Hand / Pan tool' },
    { keys: ['Ctrl', 'Z'], desc: 'Undo' },
    { keys: ['Ctrl', 'Shift', 'Z'], desc: 'Redo' },
    { keys: ['Ctrl', 'Y'], desc: 'Redo (alternative)' },
    { keys: ['Ctrl', 'A'], desc: 'Select all elements' },
    { keys: ['Ctrl', '+'], desc: 'Zoom in' },
    { keys: ['Ctrl', '-'], desc: 'Zoom out' },
    { keys: ['Ctrl', '0'], desc: 'Reset zoom & pan' },
    { keys: ['Ctrl', 'D'], desc: 'Duplicate selected' },
    { keys: ['Delete'], desc: 'Delete selected elements' },
    { keys: ['Backspace'], desc: 'Delete selected elements' },
    { keys: ['Escape'], desc: 'Clear selection' },
  ];

  const features = [
    {
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>,
      title: 'Drawing Tools',
      desc: '10 tools including freedraw, shapes (rectangle, ellipse, diamond), arrows, lines, text, and eraser.',
    },
    {
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>,
      title: 'Custom Rendering',
      desc: 'Hand-drawn / sketchy style with configurable roughness. 6 fill patterns: solid, hachure, cross-hatch, dotted, zigzag, and none.',
    },
    {
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1"/><line x1="12" y1="12" x2="12" y2="2"/><line x1="12" y1="12" x2="20" y2="12"/><line x1="12" y1="12" x2="12" y2="22"/><line x1="12" y1="12" x2="4" y2="12"/></svg>,
      title: 'Laser Pointer',
      desc: 'Toggle laser mode for presentations. Configurable duration (100-2000ms) and weight (1-10px) in style panel.',
    },
    {
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
      title: 'Export',
      desc: 'Export your boards as PNG, JPG, SVG, PDF, or JSON. Adjust quality from Low to Extreme for raster formats.',
    },
    {
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
      title: 'Infinite Canvas',
      desc: 'Scroll to pan, Ctrl+Scroll to zoom (at mouse position). Zoom range: 10% to 500%. Zoom increment: 35% per tick.',
    },
    {
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>,
      title: 'Collaboration',
      desc: 'Real-time collaboration with live cursors, chat with image sharing, and shared element editing.',
    },
    {
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>,
      title: 'Library',
      desc: 'Pre-built shape templates (cards, notes, chips, stars, clouds, flags) for quick diagramming.',
    },
    {
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
      title: 'Persistence',
      desc: 'Automatic local save to IndexedDB every 3 seconds. No account required — everything stays on your device.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 overflow-y-auto" style={{ overflowY: 'auto', height: 'auto', minHeight: '100vh' }}>
      {/* Header */}
      <header className="sticky top-0 z-20">
        <div className="relative flex items-center justify-between h-14 px-4 lg:px-8 mx-2 mt-2 rounded-2xl
          bg-white/70 dark:bg-gray-800/70 backdrop-blur-2xl
          shadow-[0_4px_16px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.2)]
          border border-white/50 dark:border-gray-700/50 ring-1 ring-black/5 dark:ring-white/10">
          <button onClick={() => router.push('/')} className="flex items-center gap-3 hover:opacity-80 transition-all hover:scale-105">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-sm">
              <svg viewBox="0 0 16 16" className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 2h10a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z"/>
                <path d="M5 5h6M5 8h4M5 11h5"/>
              </svg>
            </div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">NoteForge Docs</h1>
          </button>
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 flex items-center justify-center text-gray-500 dark:text-gray-400 transition-all hover:scale-105" title="Toggle theme">
              {theme === 'light' ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
              )}
            </button>
            <button onClick={() => router.push('/')} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500 text-white hover:bg-blue-600 transition-all hover:scale-105 shadow-md">
              Back to App
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 lg:px-8 py-8 space-y-8">
        {/* Introduction */}
        <section className="glass-card p-6 lg:p-8">
          <h2 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">What is NoteForge?</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            NoteForge is an infinite-canvas whiteboard app with a hand-drawn, sketchy rendering style.
            It&apos;s designed for diagrams, drawings, presentations, and real-time collaboration — no account required.
            Everything is saved locally to your browser via IndexedDB.
          </p>
        </section>

        {/* Features */}
        <section>
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Features</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {features.map((f, i) => (
              <div key={i} className="glass-card p-4 flex gap-3 items-start hover:shadow-lg transition-all">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  {f.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-0.5 text-gray-900 dark:text-white">{f.title}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Keyboard Shortcuts */}
        <section className="glass-card p-6 lg:p-8">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Keyboard Shortcuts</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
            {shortcuts.map((s, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-gray-700/50 last:border-0">
                <span className="text-xs text-gray-500 dark:text-gray-400">{s.desc}</span>
                <div className="flex gap-1">
                  {s.keys.map((k, j) => (
                    <span key={j} className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold
                      bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600">
                      {k}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Tips */}
        <section className="glass-card p-6 lg:p-8">
          <h2 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Tips & Tricks</h2>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
            <li className="flex gap-2">
              <span className="text-blue-500 mt-0.5 shrink-0">•</span>
              <span><strong>Space + Drag</strong> — Temporarily pan the canvas, then release to return to your previous tool.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-500 mt-0.5 shrink-0">•</span>
              <span><strong>Ctrl+Scroll</strong> — Zoom in/out at the mouse pointer position.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-500 mt-0.5 shrink-0">•</span>
              <span><strong>Right-click</strong> — Context menu with Duplicate, Delete, Share, and Export options.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-500 mt-0.5 shrink-0">•</span>
              <span><strong>Laser Mode</strong> — Toggle the laser pointer and adjust duration/weight in the style panel for presentations.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-500 mt-0.5 shrink-0">•</span>
              <span><strong>Export Quality</strong> — Use Extreme quality (0.98) for pixel-perfect exports, Low (0.3) for quick previews.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-500 mt-0.5 shrink-0">•</span>
              <span><strong>No account needed</strong> — Everything is stored locally. Your name is saved in your browser for collaboration.</span>
            </li>
          </ul>
        </section>
      </main>
    </div>
  );
}
