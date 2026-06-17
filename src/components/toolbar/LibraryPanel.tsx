'use client';

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { ElementType, Element, FillStyle } from '@/types';
import { generateId } from '@/lib/utils';

interface LibraryItem {
  name: string;
  type: ElementType;
  w: number;
  h: number;
  icon: React.ReactNode;
  fill?: FillStyle;
  bgColor?: string;
}

const LIBRARY_ITEMS: LibraryItem[] = [
  { name: 'Rectangle', type: ElementType.Rectangle, w: 60, h: 40,
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="1"/></svg> },
  { name: 'Circle', type: ElementType.Ellipse, w: 50, h: 50,
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="9"/></svg> },
  { name: 'Diamond', type: ElementType.Diamond, w: 50, h: 50,
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2l10 10-10 10L2 12 12 2z"/></svg> },
  { name: 'Arrow', type: ElementType.Arrow, w: 60, h: 10,
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="5" y1="19" x2="19" y2="5"/><polyline points="12 5 19 5 19 12"/></svg> },
  { name: 'Card', type: ElementType.Rectangle, w: 80, h: 100, bgColor: '#fff9db', fill: 'solid',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="8" y1="9" x2="16" y2="9"/><line x1="8" y1="13" x2="14" y2="13"/></svg> },
  { name: 'Wide Card', type: ElementType.Rectangle, w: 120, h: 60, bgColor: '#e7f5ff', fill: 'solid',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="6" y1="9" x2="18" y2="9"/><line x1="6" y1="13" x2="14" y2="13"/></svg> },
  { name: 'Square', type: ElementType.Rectangle, w: 50, h: 50,
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="4" y="4" width="16" height="16" rx="1"/></svg> },
  { name: 'Note', type: ElementType.Rectangle, w: 80, h: 80, bgColor: '#fff3bf', fill: 'solid',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2v4a2 2 0 002 2h4"/><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="14" y2="17"/></svg> },
  { name: 'Chip', type: ElementType.Rectangle, w: 40, h: 24, bgColor: '#d0bfff', fill: 'solid',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="6" width="20" height="12" rx="6"/></svg> },
  { name: 'Star', type: ElementType.Diamond, w: 40, h: 40,
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> },
  { name: 'Cloud', type: ElementType.Ellipse, w: 70, h: 40, bgColor: '#e9ecef', fill: 'solid',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z"/></svg> },
  { name: 'Flag', type: ElementType.Rectangle, w: 30, h: 50,
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg> },
];

export default function LibraryPanel() {
  const { addElement, pushUndoStack, strokeColor, backgroundColor, fillStyle, strokeWidth, roughness, opacity } = useStore();

  function addToCanvas(item: LibraryItem) {
    const id = generateId();
    const el: Element = {
      id, type: item.type,
      x: 100, y: 100,
      width: item.w, height: item.h,
      angle: 0, strokeColor, backgroundColor: item.bgColor || backgroundColor,
      fillStyle: item.fill || fillStyle,
      strokeWidth, roughness, opacity,
      points: item.type === ElementType.Arrow ? [{ x: 0, y: 0 }, { x: item.w, y: 0 }] : [],
      text: '', fontFamily: 'Virgil', fontSize: 20, textAlign: 'left',
      containerId: null, boundElements: [],
      isDeleted: false, groupIds: [], frameId: null,
      updatedAt: Date.now(), version: 1,
    };
    pushUndoStack();
    addElement(el);
  }

  return (
    <div className="glass border-r border-[var(--border-color)] w-44 flex flex-col shrink-0 animate-slide-left z-10">
      <div className="px-3 py-2 border-b border-[var(--border-color)]">
        <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-300">Library</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {LIBRARY_ITEMS.map(item => (
          <button
            key={item.name}
            onClick={() => addToCanvas(item)}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl
              text-xs font-medium text-gray-700 dark:text-gray-200
              hover:bg-gray-100 dark:hover:bg-gray-700/50
              active:bg-gray-200 dark:active:bg-gray-600/50
              transition-all duration-100"
          >
            <span className="w-5 h-5 flex items-center justify-center text-gray-500 dark:text-gray-400 shrink-0">
              {item.icon}
            </span>
            {item.name}
          </button>
        ))}
      </div>
    </div>
  );
}
