'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useStore } from '@/store/useStore';
import { ChatMessage } from '@/types';
import { generateId } from '@/lib/utils';
import { moderateText } from '@/lib/moderation';
import { emitChatMessage } from '@/lib/peerClient';

interface Props { boardId: string; }

export default function ChatPanel({ boardId }: Props) {
  const [text, setText] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [modWarning, setModWarning] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { chatMessages, addChatMessage, userName } = useStore();

  useEffect(() => { ref.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);

  function send() {
    const raw = text.trim();
    if (!raw && images.length === 0) return;

    let displayText = raw;
    let moderated = false;

    if (raw) {
      const result = moderateText(raw);
      if (result.blocked) {
        displayText = result.clean;
        moderated = true;
        setModWarning('Message contained inappropriate content and was moderated.');
        setTimeout(() => setModWarning(null), 3000);
      }
    }

    // Send each image as a separate message
    if (images.length > 0) {
      images.forEach(imgData => {
        const chatMsg: ChatMessage = {
          id: generateId(), boardId, userId: useStore.getState().userId,
          userName, text: moderated ? displayText : (raw || '[Image]'), timestamp: Date.now(),
          imageUrl: imgData,
        };
        addChatMessage(chatMsg);
        emitChatMessage(chatMsg);
      });
      setImages([]);
    }

    if (raw) {
      const chatMsg: ChatMessage = {
        id: generateId(), boardId, userId: useStore.getState().userId,
        userName, text: displayText, timestamp: Date.now(),
      };
      addChatMessage(chatMsg);
      emitChatMessage(chatMsg);
    }
    setText('');
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    setFileError(null);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 5 * 1024 * 1024) {
        setFileError(`Image too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max 5MB allowed.`);
        setTimeout(() => setFileError(null), 3000);
        continue;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setImages(prev => [...prev, ev.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    }
    if (fileRef.current) fileRef.current.value = '';
  }

  function removeImage(idx: number) {
    setImages(prev => prev.filter((_, i) => i !== idx));
  }

  return (
    <div className="glass border-l border-[var(--border-color)] w-72 flex flex-col shrink-0 animate-slide-right z-10">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border-color)]">
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">Chat</span>
        <button onClick={() => useStore.getState().setShowChat(false)} className="w-6 h-6 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center text-gray-400">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2 text-xs">
        {chatMessages.map(m => (
          <div key={m.id} className={`flex gap-1.5 ${m.userId === useStore.getState().userId ? 'flex-row-reverse' : ''}`}>
            <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-[8px] font-bold shrink-0">
              {m.userName.charAt(0).toUpperCase()}
            </div>
            <div className={`max-w-[80%] px-2.5 py-1.5 rounded-xl ${
              m.userId === useStore.getState().userId
                ? 'bg-blue-500 text-white rounded-tr-sm'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-tl-sm'
            }`}>
              <p className="text-[10px] font-medium mb-0.5 opacity-70">{m.userName}</p>
              {(m as any).imageUrl ? (
                <div>
                  <img src={(m as any).imageUrl} alt="Shared" className="max-w-full rounded-lg mb-1 max-h-32 object-cover" />
                  {m.text !== '[Image]' && <p>{m.text}</p>}
                </div>
              ) : (
                <p className="break-words">{m.text}</p>
              )}
            </div>
          </div>
        ))}
        <div ref={ref} />
      </div>

      {/* Image previews before sending */}
      {images.length > 0 && (
        <div className="px-2 py-1 border-t border-[var(--border-color)] flex gap-1 flex-wrap">
          {images.map((img, i) => (
            <div key={i} className="relative">
              <img src={img} alt="" className="h-10 w-10 object-cover rounded-lg" />
              <button onClick={() => removeImage(i)}
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center text-[8px]">
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Moderation warning */}
      {modWarning && (
        <div className="px-2 pt-1">
          <div className="px-2 py-1 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-[10px] text-amber-700 dark:text-amber-300 text-center">
            {modWarning}
          </div>
        </div>
      )}

      {/* File error */}
      {fileError && (
        <div className="px-2 pt-1">
          <div className="px-2 py-1 rounded-lg bg-red-100 dark:bg-red-900/40 text-[10px] text-red-600 dark:text-red-300 text-center">
            {fileError}
          </div>
        </div>
      )}

      <div className="p-2 border-t border-[var(--border-color)] space-y-1.5">
        <div className="flex gap-1.5">
          <input value={text} onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="Type a message..."
            className="flex-1 px-2.5 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-xs outline-none focus:ring-1 focus:ring-blue-500 text-gray-800 dark:text-gray-200 placeholder-gray-400" />
          <button onClick={() => fileRef.current?.click()} className="w-7 h-7 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center text-gray-400" title="Attach image">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>
          </button>
          <button onClick={send} className="w-7 h-7 rounded-lg bg-blue-500 hover:bg-blue-600 flex items-center justify-center text-white">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
      </div>

      <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
    </div>
  );
}
