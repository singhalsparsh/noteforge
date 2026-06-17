// ============================================================
// NoteForge - PeerJS Module for P2P Real-Time Collaboration
// Zero server dependencies — uses PeerJS Cloud Server for signaling
// Star topology: one "host" peer (boardId) relays to all others
// ============================================================

'use client';

import Peer from 'peerjs';
import { CursorPosition, ChatMessage, Collaborator } from '@/types';

// === Types ===

type PeerMessage =
  | { type: 'peer:info'; userId: string; userName: string; userColor: string }
  | { type: 'cursor:move'; cursor: CursorPosition }
  | { type: 'chat:message'; message: ChatMessage }
  | { type: 'elements:update'; payload: any[] }
  | { type: 'collaborators:update'; users: Collaborator[] };

interface ConnectionEntry {
  conn: any;
  userId: string;
  userName: string;
  color: string;
}

// === State ===

let peer: Peer | null = null;
let isHost = false;
let connections = new Map<string, ConnectionEntry>();
let hostConnection: any = null;
let peerInfo = { userId: '', userName: '', userColor: '' };

// === Callbacks (set by usePeerCollaboration hook) ===

let onCursorMoved: ((cursor: CursorPosition) => void) | null = null;
let onChatMessage: ((msg: ChatMessage) => void) | null = null;
let onUserJoined: ((user: Collaborator) => void) | null = null;
let onUserLeft: ((userId: string) => void) | null = null;
let onCollaboratorsUpdate: ((users: Collaborator[]) => void) | null = null;
let onElementsUpdate: ((elements: any[]) => void) | null = null;
let onConnected: (() => void) | null = null;

export function setCallbacks(cbs: {
  onCursorMoved?: (c: CursorPosition) => void;
  onChatMessage?: (m: ChatMessage) => void;
  onUserJoined?: (u: Collaborator) => void;
  onUserLeft?: (userId: string) => void;
  onCollaboratorsUpdate?: (users: Collaborator[]) => void;
  onElementsUpdate?: (elements: any[]) => void;
  onConnected?: () => void;
}) {
  onCursorMoved = cbs.onCursorMoved ?? null;
  onChatMessage = cbs.onChatMessage ?? null;
  onUserJoined = cbs.onUserJoined ?? null;
  onUserLeft = cbs.onUserLeft ?? null;
  onCollaboratorsUpdate = cbs.onCollaboratorsUpdate ?? null;
  onElementsUpdate = cbs.onElementsUpdate ?? null;
  onConnected = cbs.onConnected ?? null;
}

// === Helpers ===

function broadcastToAll(msg: PeerMessage, excludePeer?: string) {
  connections.forEach((entry, peerId) => {
    if (peerId !== excludePeer) {
      try { entry.conn.send(msg); } catch { /* ignore */ }
    }
  });
}

function getCollaboratorList(): Collaborator[] {
  const list: Collaborator[] = [];
  list.push({
    userId: peerInfo.userId,
    userName: peerInfo.userName,
    color: peerInfo.userColor,
    isOnline: true,
    lastActive: Date.now(),
  });
  connections.forEach(entry => {
    if (entry.userId) {
      list.push({
        userId: entry.userId,
        userName: entry.userName,
        color: entry.color,
        isOnline: true,
        lastActive: Date.now(),
      });
    }
  });
  return list;
}

function handleData(msg: PeerMessage, senderPeerId: string) {
  switch (msg.type) {
    case 'cursor:move':
      onCursorMoved?.(msg.cursor);
      if (isHost) broadcastToAll(msg, senderPeerId);
      break;

    case 'chat:message':
      onChatMessage?.(msg.message);
      if (isHost) broadcastToAll(msg, senderPeerId);
      break;

    case 'elements:update':
      onElementsUpdate?.(msg.payload || []);
      if (isHost) broadcastToAll(msg, senderPeerId);
      break;

    case 'peer:info': {
      const entry = connections.get(senderPeerId);
      if (entry) {
        entry.userId = msg.userId;
        entry.userName = msg.userName;
        entry.color = msg.userColor;
        onUserJoined?.({
          userId: msg.userId,
          userName: msg.userName,
          color: msg.userColor,
          isOnline: true,
          lastActive: Date.now(),
        });
        // Host broadcasts updated collaborator list to all
        if (isHost) {
          broadcastToAll({ type: 'collaborators:update', users: getCollaboratorList() });
        }
      }
      break;
    }

    case 'collaborators:update':
      onCollaboratorsUpdate?.(msg.users);
      break;
  }
}

function setupConnection(conn: any, peerId: string) {
  connections.set(peerId, { conn, userId: '', userName: '', color: '' });

  conn.on('data', (msg: PeerMessage) => handleData(msg, peerId));

  conn.on('error', () => {
    const entry = connections.get(peerId);
    connections.delete(peerId);
    if (entry?.userId) onUserLeft?.(entry.userId);
  });

  conn.on('close', () => {
    const entry = connections.get(peerId);
    if (entry?.userId) {
      onUserLeft?.(entry.userId);
    }
    connections.delete(peerId);
    if (isHost) {
      broadcastToAll({ type: 'collaborators:update', users: getCollaboratorList() });
    }
  });
}

// === Connect / Disconnect ===

export async function connectToRoom(boardId: string, user: { id: string; name: string; color: string }): Promise<void> {
  // Clean up any existing connection
  if (peer) disconnectFromRoom();

  peerInfo = { userId: user.id, userName: user.name, userColor: user.color };

  return new Promise<void>((resolve) => {
    // Try to become the host — claim the boardId as peer ID
    const trialPeer = new Peer(boardId, { debug: 0 });

    trialPeer.on('open', () => {
      // We are the host!
      peer = trialPeer;
      isHost = true;

      peer.on('connection', (conn) => {
        setupConnection(conn, conn.peer);
        // Tell the new peer who we are
        try { conn.send({ type: 'peer:info', ...peerInfo } as PeerMessage); } catch { /* */ }
      });

      onConnected?.();
      resolve();
    });

    trialPeer.on('error', (err: any) => {
      if (err.type === 'unavailable-id') {
        // Board ID already taken — someone else is host, connect to them
        trialPeer.destroy();

        const clientPeer = new Peer(`${boardId}-${user.id}`, { debug: 0 });

        clientPeer.on('open', () => {
          peer = clientPeer;
          isHost = false;

          const conn = clientPeer.connect(boardId, { reliable: true });

          conn.on('open', () => {
            hostConnection = conn;
            setupConnection(conn, 'host');
            // Announce ourselves to the host
            try { conn.send({ type: 'peer:info', ...peerInfo } as PeerMessage); } catch { /* */ }
            onConnected?.();
            resolve();
          });

          conn.on('error', () => {
            // Connection to host failed — collaborate silently fails
            resolve();
          });

          // Timeout: if connection doesn't open within 10s, give up
          setTimeout(() => {
            if (!hostConnection) {
              conn.close();
              resolve();
            }
          }, 10000);
        });

        clientPeer.on('error', () => { resolve(); });
      } else {
        // Non-fatal error (e.g. server unavailable) — silently skip
        trialPeer.destroy();
        resolve();
      }
    });

    // Timeout: if peer doesn't open within 10s, give up
    setTimeout(() => {
      if (!peer) {
        trialPeer.destroy();
        resolve();
      }
    }, 10000);
  });
}

export function disconnectFromRoom() {
  if (peer) {
    peer.destroy();
    peer = null;
  }
  connections.clear();
  hostConnection = null;
  isHost = false;
}

// === Emit (called from Canvas / Chat / etc.) ===

export function emitCursorMove(cursor: CursorPosition) {
  if (isHost) {
    broadcastToAll({ type: 'cursor:move', cursor });
  } else if (hostConnection) {
    try { hostConnection.send({ type: 'cursor:move', cursor }); } catch { /* */ }
  }
}

export function emitElementsUpdate(_boardId: string, elements: any[]) {
  // Send a clean serialized copy to avoid reference issues
  const payload = elements.map(el => ({
    ...el,
    updatedAt: Date.now(),
  }));

  if (isHost) {
    // Broadcast to all connected guests
    broadcastToAll({ type: 'elements:update', payload });
  } else if (hostConnection) {
    try {
      hostConnection.send({ type: 'elements:update', payload });
    } catch { /* */ }
  }
}

export function emitChatMessage(message: ChatMessage) {
  if (isHost) {
    broadcastToAll({ type: 'chat:message', message });
  } else if (hostConnection) {
    try { hostConnection.send({ type: 'chat:message', message }); } catch { /* */ }
  }
}

export function isCollaborating(): boolean {
  return peer !== null;
}
