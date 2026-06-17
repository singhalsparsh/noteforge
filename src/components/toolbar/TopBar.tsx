'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { moderateName } from '@/lib/moderation';

export default function TopBar() {
  const router = useRouter();
  const { boardName, setBoardName, theme, toggleTheme, setShowShareDialog, setShowExportDialog,
    setShowChat, showChat, collaborators, userName, setUserName, setShowLibrary, showLibrary } = useStore();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(boardName);
  const [nameWarn, setNameWarn] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  useEffect(() => {
    setName(boardName);
  }, [boardName]);

  function commitName() {
    setBoardName(name.trim() || 'Untitled');
    setEditing(false);
  }

  return (
    <header className="relative shrink-0 z-20 select-none flex justify-center">
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10 blur-xl pointer-events-none" />

      {/* Liquid glass bar — compact, centered like bottom toolbar */}
      <div className="relative flex items-center justify-between h-9 sm:h-10 px-1.5 sm:px-2.5 mx-auto mt-1 sm:mt-1.5 max-w-5xl w-[98vw] sm:w-[96vw] rounded-full
        bg-white/70 dark:bg-gray-800/70
        backdrop-blur-2xl
        shadow-[0_4px_16px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.2)]
        border border-white/50 dark:border-gray-700/50
        ring-1 ring-black/5 dark:ring-white/10">

        {/* Left */}
        <div className="flex items-center gap-2">
          {/* Logo — clickable to home */}
          <button onClick={() => router.push('/')} className="flex items-center gap-1.5 hover:opacity-80 transition-all hover:scale-105">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-sm">
              <svg viewBox="0 0 16 16" className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 2h10a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z"/>
                <path d="M5 5h6M5 8h4M5 11h5"/>
              </svg>
            </div>
            <span className="text-sm font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hidden sm:inline">NoteForge</span>
          </button>

          <div className="w-px h-5 bg-gray-200 dark:bg-gray-700" />

          {/* Board name */}
          {editing ? (
            <input
              ref={inputRef}
              value={name}
              onChange={e => setName(e.target.value)}
              onBlur={commitName}
              onKeyDown={e => { if (e.key === 'Enter') commitName(); if (e.key === 'Escape') { setName(boardName); setEditing(false); } }}
              className="bg-transparent border-b border-blue-500 outline-none text-sm font-medium px-1 py-0.5 w-32"
            />
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700/50 px-2 py-0.5 rounded-lg transition-all hover:scale-105"
            >
              {boardName}
            </button>
          )}

          {/* Library toggle */}
          <button
            onClick={() => setShowLibrary(!showLibrary)}
            className={`hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all ${
              showLibrary
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:scale-105'
            }`}
            title="Library"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
            </svg>
          </button>
        </div>

        {/* Center */}
        <div className="hidden md:flex items-center gap-1 text-[11px] text-gray-400 dark:text-gray-500">
          <span>{useStore.getState().elements.filter(e => !e.isDeleted).length} elements</span>
        </div>

        {/* Right */}
        <div className="flex items-center gap-1">
          {/* User name */}
          <div className="relative">
            <input
              value={userName}
              onChange={e => {
                const val = e.target.value;
                const result = moderateName(val);
                if (result.blocked) {
                  setNameWarn('Name contained inappropriate content.');
                  setTimeout(() => setNameWarn(null), 3000);
                  return;
                }
                setUserName(val);
                setNameWarn(null);
              }}
              className="w-12 sm:w-20 h-6 sm:h-7 px-1 sm:px-2 rounded-lg text-[10px] sm:text-xs text-center bg-gray-100/50 dark:bg-gray-700/50 border border-gray-200/50 dark:border-gray-600/50 outline-none focus:ring-1 focus:ring-blue-500 text-gray-700 dark:text-gray-200 placeholder-gray-400"
              placeholder="Name"
            />
            {nameWarn && (
              <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/80 text-[9px] text-amber-700 dark:text-amber-200 shadow-sm">
                {nameWarn}
              </div>
            )}
          </div>

          {/* Collaborator avatars */}
          <div className="flex -space-x-1.5 items-center ml-1">
            <div className="w-5 h-5 rounded-full bg-blue-500 border-2 border-white dark:border-gray-800 flex items-center justify-center shadow-sm">
              <span className="text-[7px] text-white font-bold">{userName.charAt(0).toUpperCase()}</span>
            </div>
            {collaborators.slice(0, 3).map(c => (
              <div key={c.userId} className="w-5 h-5 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center shadow-sm" style={{ background: c.color }}>
                <span className="text-[7px] text-white font-bold">{c.userName.charAt(0).toUpperCase()}</span>
              </div>
            ))}
          </div>

          {/* Share */}
          <button onClick={() => setShowShareDialog(true)} className="w-5 sm:w-6 h-5 sm:h-6 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700/50 flex items-center justify-center text-gray-500 dark:text-gray-400 transition-all hover:scale-105 active:scale-90" title="Share">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="sm:w-[11px] sm:h-[11px]">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
          </button>

          {/* Export */}
          <button onClick={() => setShowExportDialog(true)} className="w-5 sm:w-6 h-5 sm:h-6 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700/50 flex items-center justify-center text-gray-500 dark:text-gray-400 transition-all hover:scale-105 active:scale-90" title="Export">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="sm:w-[11px] sm:h-[11px]">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </button>

          {/* Chat */}
          <button onClick={() => setShowChat(!showChat)} className={`w-5 sm:w-6 h-5 sm:h-6 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-90 ${
            showChat
              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50'
          }`} title="Chat">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="sm:w-[11px] sm:h-[11px]">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
            </svg>
          </button>

          {/* Theme */}
          <button onClick={toggleTheme} className="w-5 sm:w-6 h-5 sm:h-6 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700/50 flex items-center justify-center text-gray-500 dark:text-gray-400 transition-all hover:scale-105 active:scale-90" title={theme === 'light' ? 'Dark mode' : 'Light mode'}>
            {theme === 'light' ? (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="sm:w-[11px] sm:h-[11px]">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
              </svg>
            ) : (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="sm:w-[11px] sm:h-[11px]">
                <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            )}
          </button>

          {/* Home */}
          <button onClick={() => router.push('/')} className="w-5 sm:w-6 h-5 sm:h-6 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700/50 flex items-center justify-center text-gray-500 dark:text-gray-400 transition-all hover:scale-105 active:scale-90" title="Home">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="sm:w-[11px] sm:h-[11px]">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
