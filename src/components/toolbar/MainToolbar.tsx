'use client';

import { useStore } from '@/store/useStore';
import { ToolType, COLORS, FILL_COLORS, STROKE_WIDTHS, ROUGHNESS_LEVELS } from '@/types';
import { useState, useRef, useEffect } from 'react';

const TOOLS = [
  { id: ToolType.Selection, icon: (a: boolean) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={a ? '#fff' : 'currentColor'} strokeWidth="2"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="M13 13l6 6"/></svg>, label: 'Select', shortcut: 'V' },
  { id: ToolType.Freedraw, icon: (a: boolean) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={a ? '#fff' : 'currentColor'} strokeWidth="2"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>, label: 'Draw', shortcut: 'F' },
  { id: ToolType.Rectangle, icon: (a: boolean) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={a ? '#fff' : 'currentColor'} strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>, label: 'Rect', shortcut: 'R' },
  { id: ToolType.Ellipse, icon: (a: boolean) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={a ? '#fff' : 'currentColor'} strokeWidth="2"><circle cx="12" cy="12" r="10"/></svg>, label: 'Circle', shortcut: 'E' },
  { id: ToolType.Diamond, icon: (a: boolean) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={a ? '#fff' : 'currentColor'} strokeWidth="2"><path d="M12 2l10 10-10 10L2 12 12 2z"/></svg>, label: 'Diamond', shortcut: 'D' },
  { id: ToolType.Arrow, icon: (a: boolean) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={a ? '#fff' : 'currentColor'} strokeWidth="2"><line x1="5" y1="19" x2="19" y2="5"/><polyline points="12 5 19 5 19 12"/></svg>, label: 'Arrow', shortcut: 'A' },
  { id: ToolType.Line, icon: (a: boolean) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={a ? '#fff' : 'currentColor'} strokeWidth="2"><line x1="4" y1="20" x2="20" y2="4"/></svg>, label: 'Line', shortcut: 'L' },
  { id: ToolType.Text, icon: (a: boolean) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={a ? '#fff' : 'currentColor'} strokeWidth="2"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>, label: 'Text', shortcut: 'T' },
  { id: ToolType.Eraser, icon: (a: boolean) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={a ? '#fff' : 'currentColor'} strokeWidth="2"><path d="M20 20H7l-5-5 9-9 9 9-5 5z"/><line x1="18" y1="13" x2="11" y2="6"/></svg>, label: 'Eraser', shortcut: 'X' },
  { id: ToolType.Hand, icon: (a: boolean) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={a ? '#fff' : 'currentColor'} strokeWidth="2"><path d="M18 11V6a2 2 0 00-4 0v1M14 10V4a2 2 0 00-4 0v6M10 10.5V6a2 2 0 00-4 0v8"/><path d="M18 8a2 2 0 014 0v6a8 8 0 01-8 8h-2c-2.21 0-4.21-.9-5.66-2.34L4 16.5a2 2 0 012.83-2.83L8 15"/></svg>, label: 'Hand', shortcut: 'H' },
];

// Laser tool (not in ToolType enum — add as extended)
const LASER_TOOL = { id: 'laser', icon: (a: boolean) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={a ? '#fff' : '#ff4444'} strokeWidth="2"><circle cx="12" cy="12" r="1"/><line x1="12" y1="12" x2="12" y2="2"/><line x1="12" y1="12" x2="20" y2="12"/><line x1="12" y1="12" x2="12" y2="22"/><line x1="12" y1="12" x2="4" y2="12"/></svg>, label: 'Laser', shortcut: '' };

export default function MainToolbar() {
  const { currentTool, setCurrentTool, strokeColor, setStrokeColor,
    backgroundColor, setBackgroundColor, fillStyle, setFillStyle,
    strokeWidth, setStrokeWidth, roughness, setRoughness, opacity, setOpacity,
    undo, redo, undoStack, redoStack, isLaserActive, setLaserActive,
    laserDuration, setLaserDuration, laserWeight, setLaserWeight,
    fontFamily, setFontFamily, fontSize, setFontSize, textAlign, setTextAlign,
    editingElementId, elements, updateElement,
  } = useStore();

  const [showStyles, setShowStyles] = useState(false);

  function isActive(id: string) {
    if (isLaserActive && id === 'laser') return true;
    return currentTool === id;
  }

  function handleToolClick(id: string) {
    if (id === 'laser') {
      setLaserActive(!isLaserActive);
      return;
    }
    setLaserActive(false);
    setCurrentTool(id as ToolType);
  }

  return (
    <div className="fixed bottom-3 sm:bottom-6 left-1/2 -translate-x-1/2 z-30">
      {/* Liquid glass floating toolbar */}
      <div className="relative">
        {/* Glow effect */}
        <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-blue-500/20 blur-xl animate-pulse" />

        {/* Main toolbar body */}
        <div className="relative flex items-center gap-0.5 px-1.5 sm:px-2 py-1.5 rounded-full
          bg-white/70 dark:bg-gray-800/70
          backdrop-blur-2xl
          shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)]
          border border-white/50 dark:border-gray-700/50
          ring-1 ring-black/5 dark:ring-white/10">

          {/* Tool buttons */}
          {TOOLS.map(tool => (
            <button
              key={tool.id}
              onClick={() => handleToolClick(tool.id)}
              className={`w-8 sm:w-9 h-8 sm:h-9 rounded-full flex items-center justify-center transition-all duration-150 ${
                isActive(tool.id)
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30 scale-110 active:scale-90'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60 hover:scale-105 active:scale-90'
              }`}
              title={`${tool.label} (${tool.shortcut})`}
            >
              {tool.icon(isActive(tool.id))}
            </button>
          ))}

          {/* Laser button */}
          <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />
          <button
            onClick={() => handleToolClick('laser')}
            className={`w-8 sm:w-9 h-8 sm:h-9 rounded-full flex items-center justify-center transition-all duration-150 ${
              isLaserActive
                ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 scale-110 active:scale-90'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60 hover:scale-105 active:scale-90'
            }`}
            title="Laser Pointer"
          >
            {LASER_TOOL.icon(isLaserActive)}
          </button>

          {/* Divider */}
          <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

          {/* Undo/Redo */}
          <button
            onClick={undo}
            disabled={undoStack.length === 0}
            className="w-8 sm:w-9 h-8 sm:h-9 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60 hover:scale-105 active:scale-90 disabled:opacity-30 disabled:hover:scale-100"
            title="Undo (Ctrl+Z)"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="sm:w-4 sm:h-4">
              <path d="M3 7v6h6"/><path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13"/>
            </svg>
          </button>
          <button
            onClick={redo}
            disabled={redoStack.length === 0}
            className="w-8 sm:w-9 h-8 sm:h-9 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60 hover:scale-105 active:scale-90 disabled:opacity-30 disabled:hover:scale-100"
            title="Redo (Ctrl+Y)"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="sm:w-4 sm:h-4">
              <path d="M21 7v6h-6"/><path d="M3 17a9 9 0 019-9 9 9 0 016 2.3L21 13"/>
            </svg>
          </button>

          {/* Style toggle */}
          <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />
          <button
            onClick={() => setShowStyles(!showStyles)}
            className={`w-8 sm:w-9 h-8 sm:h-9 rounded-full flex items-center justify-center transition-all active:scale-90 ${
              showStyles
                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60 hover:scale-105'
            }`}
            title="Style settings"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="sm:w-4 sm:h-4">
              <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
            </svg>
          </button>
        </div>

        {/* Style dropdown panel (appears above the toolbar) */}
        {showStyles && (
          <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 max-w-screen overflow-x-auto">
            <div className="glass p-3 rounded-2xl shadow-xl min-w-[260px] sm:min-w-[280px]
              bg-white/80 dark:bg-gray-800/80 backdrop-blur-2xl
              border border-white/50 dark:border-gray-700/50">
              <div className="space-y-2">
                {/* Stroke color */}
                <div>
                  <label className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Stroke</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {COLORS.slice(0, 8).map(c => (
                      <button key={c} onClick={() => setStrokeColor(c)}
                        className={`w-5 h-5 rounded-full transition-transform ${strokeColor === c ? 'ring-2 ring-blue-500 scale-125' : 'hover:scale-110'}`}
                        style={{ background: c, border: c === '#ffffff' ? '1px solid #ddd' : 'none' }} />
                    ))}
                  </div>
                </div>

                {/* Fill color */}
                <div>
                  <label className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fill</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {FILL_COLORS.slice(0, 8).map(c => (
                      <button key={c} onClick={() => setBackgroundColor(c)}
                        className={`w-5 h-5 rounded transition-transform ${backgroundColor === c ? 'ring-2 ring-blue-500 scale-125' : 'hover:scale-110'}`}
                        style={{ background: c, border: c === 'transparent' ? '1px dashed #999' : 'none' }} />
                    ))}
                  </div>
                </div>

                {/* Thickness & Roughness (custom dropdowns) */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Thickness</label>
                    <div className="flex gap-0.5 mt-1">
                      {STROKE_WIDTHS.slice(0, 5).map(w => (
                        <button key={w} onClick={() => setStrokeWidth(w)}
                          className={`flex-1 h-6 rounded flex items-center justify-center text-[9px] font-medium transition-all ${
                            strokeWidth === w
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}>{w}px</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Roughness</label>
                    <div className="flex gap-0.5 mt-1">
                      {ROUGHNESS_LEVELS.map(r => (
                        <button key={r} onClick={() => setRoughness(r)}
                          className={`flex-1 h-6 rounded flex items-center justify-center text-[9px] font-medium transition-all ${
                            roughness === r
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}>
                          {r === 0 ? 'Perf' : r === 1 ? 'Sk' : r === 2 ? 'Rgh' : 'VR'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Fill style */}
                <div>
                  <label className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fill Pattern</label>
                  <div className="flex gap-0.5 mt-1">
                    {(['solid', 'hachure', 'cross-hatch', 'dotted', 'zigzag', 'none'] as const).map(fs => (
                      <button key={fs} onClick={() => setFillStyle(fs)}
                        className={`flex-1 h-7 rounded text-[9px] font-medium transition-all capitalize ${
                          fillStyle === fs
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}>{fs === 'cross-hatch' ? 'X-Hatch' : fs}</button>
                    ))}
                  </div>
                </div>

                {/* Opacity */}
                <div>
                  <label className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Opacity: {opacity}%</label>
                  <input type="range" min={10} max={100} value={opacity}
                    onChange={e => setOpacity(Number(e.target.value))}
                    className="w-full mt-1 accent-blue-500" />
                </div>

                {/* Text settings — shown always for style */}
                <div className="h-px bg-gray-200 dark:bg-gray-700 my-1" />
                <div className="text-[10px] font-medium text-purple-500 dark:text-purple-400 uppercase tracking-wider">Text Settings</div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Font</label>
                    <select value={fontFamily} onChange={e => setFontFamily(e.target.value)}
                      className="w-full mt-1 px-1.5 py-1 rounded-lg text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-0 outline-none focus:ring-1 focus:ring-blue-500">
                      <option value="Virgil">Virgil</option>
                      <option value="Helvetica">Helvetica</option>
                      <option value="Cascadia">Cascadia</option>
                      <option value="Comic Sans MS, cursive">Comic Sans</option>
                      <option value="Georgia, serif">Georgia</option>
                      <option value="monospace">Mono</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Size</label>
                    <div className="flex gap-0.5 mt-1">
                      {[12, 16, 20, 24, 32, 48].map(s => (
                        <button key={s} onClick={() => setFontSize(s)}
                          className={`flex-1 h-6 rounded text-[9px] font-medium transition-all ${
                            fontSize === s
                              ? 'bg-purple-500 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}>{s}</button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Laser settings — shown when laser is active */}
                {isLaserActive && (
                  <>
                    <div className="h-px bg-gray-200 dark:bg-gray-700 my-1" />
                    <div className="text-[10px] font-medium text-red-500 dark:text-red-400 uppercase tracking-wider">Laser Settings</div>
                    <div>
                      <label className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Duration: {laserDuration}ms</label>
                      <input type="range" min={100} max={2000} step={50} value={laserDuration}
                        onChange={e => setLaserDuration(Number(e.target.value))}
                        className="w-full mt-1 accent-red-500" />
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Weight: {laserWeight}px</label>
                      <input type="range" min={1} max={10} step={0.5} value={laserWeight}
                        onChange={e => setLaserWeight(Number(e.target.value))}
                        className="w-full mt-1 accent-red-500" />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
