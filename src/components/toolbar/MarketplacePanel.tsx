'use client';

import { useState, useRef } from 'react';
import { useStore } from '@/store/useStore';
import { Element, ElementType, FillStyle } from '@/types';
import { generateId } from '@/lib/utils';

type Tab = 'shapes' | 'images' | 'audio';

interface LibraryItem {
  name: string;
  type: ElementType;
  w: number;
  h: number;
  icon: React.ReactNode;
  fill?: FillStyle;
  bgColor?: string;
  category?: string;
}

const SHAPE_CATEGORIES: { label: string; items: LibraryItem[] }[] = [
  {
    label: 'Basic',
    items: [
      { name: 'Rectangle', type: ElementType.Rectangle, w: 60, h: 40,
        icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="1"/></svg> },
      { name: 'Square', type: ElementType.Rectangle, w: 50, h: 50,
        icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="4" y="4" width="16" height="16" rx="1"/></svg> },
      { name: 'Circle', type: ElementType.Ellipse, w: 50, h: 50,
        icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="9"/></svg> },
      { name: 'Diamond', type: ElementType.Diamond, w: 50, h: 50,
        icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2l10 10-10 10L2 12 12 2z"/></svg> },
      { name: 'Arrow', type: ElementType.Arrow, w: 60, h: 10,
        icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="5" y1="19" x2="19" y2="5"/><polyline points="12 5 19 5 19 12"/></svg> },
    ],
  },
  {
    label: 'Cards',
    items: [
      { name: 'Card', type: ElementType.Rectangle, w: 80, h: 100, bgColor: '#fff9db', fill: 'solid',
        icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="8" y1="9" x2="16" y2="9"/><line x1="8" y1="13" x2="14" y2="13"/></svg> },
      { name: 'Wide Card', type: ElementType.Rectangle, w: 120, h: 60, bgColor: '#e7f5ff', fill: 'solid',
        icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="6" y1="9" x2="18" y2="9"/><line x1="6" y1="13" x2="14" y2="13"/></svg> },
      { name: 'Note', type: ElementType.Rectangle, w: 80, h: 80, bgColor: '#fff3bf', fill: 'solid',
        icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2v4a2 2 0 002 2h4"/><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="14" y2="17"/></svg> },
      { name: 'Chip', type: ElementType.Rectangle, w: 40, h: 24, bgColor: '#d0bfff', fill: 'solid',
        icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="6" width="20" height="12" rx="6"/></svg> },
    ],
  },
  {
    label: 'Decorative',
    items: [
      { name: 'Star', type: ElementType.Diamond, w: 40, h: 40,
        icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> },
      { name: 'Cloud', type: ElementType.Ellipse, w: 70, h: 40, bgColor: '#e9ecef', fill: 'solid',
        icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z"/></svg> },
      { name: 'Flag', type: ElementType.Rectangle, w: 30, h: 50,
        icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg> },
    ],
  },
];

const ALL_SHAPES = SHAPE_CATEGORIES.flatMap(c => c.items);

export default function MarketplacePanel() {
  const [activeTab, setActiveTab] = useState<Tab>('shapes');
  const { addElement, pushUndoStack, strokeColor, backgroundColor, fillStyle, strokeWidth, roughness, opacity } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  // ---- Shape adding ----
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

  // ---- Image import ----
  const [importedImages, setImportedImages] = useState<Array<{ id: string; name: string; dataUrl: string }>>([]);

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('Image too large. Max 5MB allowed.');
        continue;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          const dataUrl = ev.target.result as string;
          const id = generateId();
          setImportedImages(prev => [...prev, { id, name: file.name, dataUrl }]);
        }
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function addImageToCanvas(img: { id: string; dataUrl: string }) {
    const el: Element = {
      id: generateId(), type: ElementType.Image,
      x: 100, y: 100,
      width: 200, height: 150, angle: 0,
      strokeColor: '#1e1e1e', backgroundColor: 'transparent',
      fillStyle: 'solid', strokeWidth: 1, roughness: 0, opacity: 100,
      points: [], text: img.dataUrl, // Store image data in text field
      fontFamily: 'Virgil', fontSize: 20, textAlign: 'left',
      containerId: null, boundElements: [],
      isDeleted: false, groupIds: [], frameId: null,
      updatedAt: Date.now(), version: 1,
    };
    pushUndoStack();
    addElement(el);
  }

  function removeImportedImage(id: string) {
    setImportedImages(prev => prev.filter(img => img.id !== id));
  }

  // ---- Audio import & transcription ----
  const [audioTranscriptions, setAudioTranscriptions] = useState<Array<{ id: string; name: string; text: string; status: 'processing' | 'done' | 'error' }>>([]);

  function handleAudioUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 10 * 1024 * 1024) { // 10MB limit for audio
        alert('Audio too large. Max 10MB allowed.');
        continue;
      }
      const id = generateId();
      setAudioTranscriptions(prev => [...prev, { id, name: file.name, text: '', status: 'processing' }]);
      transcribeAudio(file, id);
    }
    if (audioInputRef.current) audioInputRef.current.value = '';
  }

  function transcribeAudio(file: File, id: string) {
    // Use Web Speech API for local transcription (SpeechRecognition)
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setAudioTranscriptions(prev => prev.map(t =>
        t.id === id ? { ...t, text: 'Speech recognition not available in this browser. Try Chrome or Edge.', status: 'error' } : t
      ));
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    let fullTranscript = '';

    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        fullTranscript += event.results[i][0].transcript + ' ';
      }
    };

    recognition.onend = () => {
      setAudioTranscriptions(prev => prev.map(t =>
        t.id === id ? { ...t, text: fullTranscript.trim() || '(No speech detected)', status: 'done' } : t
      ));
    };

    recognition.onerror = () => {
      setAudioTranscriptions(prev => prev.map(t =>
        t.id === id ? { ...t, text: 'Transcription failed. Please try again.', status: 'error' } : t
      ));
    };

    try {
      recognition.start();
    } catch {
      setAudioTranscriptions(prev => prev.map(t =>
        t.id === id ? { ...t, text: 'Could not start transcription.', status: 'error' } : t
      ));
    }
  }

  function addTranscriptToCanvas(transcript: { text: string }) {
    if (!transcript.text) return;
    const store = useStore.getState();
    const textEl: Element = {
      id: generateId(), type: ElementType.Text,
      x: 100, y: 100,
      width: 300, height: 50, angle: 0,
      strokeColor: store.strokeColor, backgroundColor: 'transparent',
      fillStyle: 'solid', strokeWidth: 1, roughness: 0, opacity: store.opacity,
      points: [], text: transcript.text,
      fontFamily: store.fontFamily, fontSize: store.fontSize, textAlign: 'left',
      containerId: null, boundElements: [],
      isDeleted: false, groupIds: [], frameId: null,
      updatedAt: Date.now(), version: 1,
    };
    pushUndoStack();
    addElement(textEl);
  }

  return (
    <div className="glass border-r border-[var(--border-color)] w-56 flex flex-col shrink-0 animate-slide-left z-10">
      {/* Header */}
      <div className="px-3 py-2 border-b border-[var(--border-color)]">
        <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-300">Marketplace</h3>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--border-color)]">
        {([
          { id: 'shapes' as Tab, label: 'Shapes', icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg> },
          { id: 'images' as Tab, label: 'Images', icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg> },
          { id: 'audio' as Tab, label: 'Audio', icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg> },
        ]).map(tab => (
          <button key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1 py-2 text-[10px] font-medium transition-all ${
              activeTab === tab.id
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-500'
                : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Shapes Tab */}
      {activeTab === 'shapes' && (
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {SHAPE_CATEGORIES.map(cat => (
            <div key={cat.label}>
              <h4 className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider px-1 mb-1">{cat.label}</h4>
              <div className="grid grid-cols-3 gap-1">
                {cat.items.map(item => (
                  <button key={item.name}
                    onClick={() => addToCanvas(item)}
                    className="flex flex-col items-center gap-1 py-2 px-1 rounded-xl text-[10px] font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 active:bg-gray-200 dark:active:bg-gray-600/50 transition-all"
                  >
                    <span className="text-gray-500 dark:text-gray-400">{item.icon}</span>
                    <span className="truncate w-full text-center">{item.name}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Images Tab */}
      {activeTab === 'images' && (
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-4 text-center cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-1 text-gray-400">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <p className="text-xs text-gray-500 dark:text-gray-400">Upload Image</p>
            <p className="text-[9px] text-gray-400 dark:text-gray-500 mt-0.5">Max 5MB</p>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />

          {importedImages.length > 0 && (
            <div className="space-y-1.5">
              <h4 className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider px-1">Imported</h4>
              {importedImages.map(img => (
                <div key={img.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 group">
                  <img src={img.dataUrl} alt="" className="w-8 h-8 rounded object-cover" />
                  <span className="flex-1 text-[10px] text-gray-600 dark:text-gray-300 truncate">{img.name}</span>
                  <button onClick={() => addImageToCanvas(img)} className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 flex items-center justify-center text-blue-500 transition-all" title="Add to canvas">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  </button>
                  <button onClick={() => removeImportedImage(img.id)} className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 flex items-center justify-center text-red-500 transition-all" title="Remove">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Audio Tab */}
      {activeTab === 'audio' && (
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          <div
            onClick={() => audioInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-4 text-center cursor-pointer hover:border-purple-500 dark:hover:border-purple-400 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-1 text-gray-400">
              <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
            </svg>
            <p className="text-xs text-gray-500 dark:text-gray-400">Import Audio</p>
            <p className="text-[9px] text-gray-400 dark:text-gray-500 mt-0.5">Local transcription (max 10MB)</p>
          </div>
          <input ref={audioInputRef} type="file" accept="audio/*" multiple className="hidden" onChange={handleAudioUpload} />

          {audioTranscriptions.length > 0 && (
            <div className="space-y-1.5">
              <h4 className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider px-1">Transcriptions</h4>
              {audioTranscriptions.map(t => (
                <div key={t.id} className="px-2 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-medium text-gray-600 dark:text-gray-300 truncate flex-1">{t.name}</span>
                    <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-medium ${
                      t.status === 'done' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
                      t.status === 'error' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' :
                      'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
                    }`}>{t.status}</span>
                  </div>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 line-clamp-2 mb-1">{t.text || 'Processing...'}</p>
                  {t.text && t.status === 'done' && (
                    <button onClick={() => addTranscriptToCanvas(t)}
                      className="text-[9px] text-blue-500 hover:text-blue-600 font-medium"
                    >Add to canvas</button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
