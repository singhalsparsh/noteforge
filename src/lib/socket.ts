// ============================================================
// NoteForge - Polling-Based Collaboration Client
// Vercel-compatible: uses HTTP fetch instead of persistent WebSocket
// ============================================================

import { CursorPosition, ChatMessage, Collaborator } from '@/types';

const API_URL = '/api/socket';
let pollingInterval: ReturnType<typeof setInterval> | null = null;
let lastPollTime = Date.now();
let currentBoardId = '';
let currentUserId = '';

// === Event types ===
interface RoomEvent {
  event: string;
  data: any;
  timestamp: number;
}

// === CONNECT / DISCONNECT ===

export async function connectSocket(boardId: string, user: { id: string; name: string; color: string }): Promise<void> {
  currentBoardId = boardId;
  currentUserId = user.id;
  lastPollTime = Date.now();

  // Join the room via POST
  try {
    await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'join',
        notebookId: boardId,
        user,
      }),
    });
  } catch (e) {
    console.error('[Collab] Join failed:', e);
  }
}

export async function disconnectSocket() {
  if (currentBoardId && currentUserId) {
    try {
      await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'leave',
          notebookId: currentBoardId,
          user: { id: currentUserId },
        }),
      });
    } catch { /* ignore */ }
  }
  stopPolling();
  currentBoardId = '';
  currentUserId = '';
}

// === EMIT ===

export function emitCursorMove(cursor: CursorPosition) {
  fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'cursor',
      notebookId: cursor.boardId,
      cursor,
    }),
  }).catch(() => {});
}

export function emitChatMessage(message: ChatMessage) {
  fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'chat',
      notebookId: message.boardId,
      message,
    }),
  }).catch(() => {});
}

export function emitElementsUpdate(boardId: string, elements: any[]) {
  fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'elements',
      notebookId: boardId,
      elements,
    }),
  }).catch(() => {});
}

// === POLLING ===

// === FETCH CURRENT COLLABORATORS ===

export async function fetchCollaborators(boardId: string): Promise<any[]> {
  try {
    const res = await fetch(`${API_URL}?roomId=${boardId}&meta=collaborators`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.collaborators || [];
  } catch { return []; }
}

export function startPolling(
  onCursorMoved: (cursor: CursorPosition) => void,
  onChatMessage: (message: ChatMessage) => void,
  onUserJoined: (user: Collaborator) => void,
  onUserLeft: (userId: string) => void,
  onCollaboratorsUpdate: (users: Collaborator[]) => void,
  onElementsUpdate?: (elements: any[]) => void,
  intervalMs = 300,
) {
  stopPolling();

  pollingInterval = setInterval(async () => {
    try {
      const since = lastPollTime;
      lastPollTime = Date.now();

      const res = await fetch(`${API_URL}?since=${since}&roomId=${currentBoardId}`);
      if (!res.ok) return;
      const events: RoomEvent[] = await res.json();
      if (!events || events.length === 0) return;

      for (const ev of events) {
        // Filter out events from self
        if (ev.data?.userId === currentUserId || ev.data?.user?.id === currentUserId) continue;

        switch (ev.event) {
          case 'cursor:move':
            onCursorMoved(ev.data);
            break;
          case 'chat:message':
            onChatMessage(ev.data);
            break;
          case 'user:joined':
            onUserJoined(ev.data.user || ev.data);
            break;
          case 'user:left':
            onUserLeft(ev.data.userId);
            break;
          case 'collaborators:update':
            onCollaboratorsUpdate(ev.data.users || ev.data);
            break;
          case 'elements:update':
            onElementsUpdate?.(ev.data.elements);
            break;
        }
      }
    } catch { /* polling error — ignore */ }
  }, intervalMs);
}

export function stopPolling() {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
}
