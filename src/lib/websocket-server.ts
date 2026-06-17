// ============================================================
// NoteForge - WebSocket Server (Vercel-compatible)
// Uses a polling-based approach for Vercel serverless
// In production, use a persistent WebSocket server (e.g. Railway)
// ============================================================

// In-memory message broker
type MessageHandler = (data: any) => void;

class MessageBroker {
  private subscribers = new Map<string, Set<MessageHandler>>();
  private messageQueue: Array<{ event: string; data: any; timestamp: number }> = [];
  private maxQueueLength = 1000;

  subscribe(event: string, handler: MessageHandler): () => void {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, new Set());
    }
    this.subscribers.get(event)!.add(handler);
    return () => this.subscribers.get(event)?.delete(handler);
  }

  publish(event: string, data: any) {
    // Add to queue
    this.messageQueue.push({ event, data, timestamp: Date.now() });
    if (this.messageQueue.length > this.maxQueueLength) {
      this.messageQueue = this.messageQueue.slice(-500);
    }

    // Notify subscribers
    this.subscribers.get(event)?.forEach(handler => {
      try { handler(data); } catch (e) { console.error('Handler error:', e); }
    });
  }

  getMessages(since: number): Array<{ event: string; data: any; timestamp: number }> {
    return this.messageQueue.filter(m => m.timestamp > since);
  }

  clear() {
    this.messageQueue = [];
  }
}

// Global message broker singleton
const globalBroker = new MessageBroker();

// Room management
interface RoomInfo {
  id: string;
  notebookId: string;
  users: Map<string, {
    id: string;
    name: string;
    color: string;
    joinedAt: number;
    lastActive: number;
  }>;
  createdAt: number;
}

class RoomManager {
  private rooms = new Map<string, RoomInfo>();

  getOrCreateRoom(notebookId: string): RoomInfo {
    const existing = Array.from(this.rooms.values()).find(r => r.notebookId === notebookId);
    if (existing) return existing;

    const room: RoomInfo = {
      id: `room_${notebookId}`,
      notebookId,
      users: new Map(),
      createdAt: Date.now(),
    };
    this.rooms.set(room.id, room);
    return room;
  }

  joinRoom(notebookId: string, user: { id: string; name: string; color: string }): RoomInfo {
    const room = this.getOrCreateRoom(notebookId);
    room.users.set(user.id, {
      ...user,
      joinedAt: Date.now(),
      lastActive: Date.now(),
    });
    return room;
  }

  leaveRoom(notebookId: string, userId: string) {
    const room = Array.from(this.rooms.values()).find(r => r.notebookId === notebookId);
    if (room) {
      room.users.delete(userId);
      if (room.users.size === 0) {
        this.rooms.delete(room.id);
      }
    }
  }

  getRoomUsers(notebookId: string): any[] {
    const room = Array.from(this.rooms.values()).find(r => r.notebookId === notebookId);
    if (!room) return [];
    return Array.from(room.users.values()).map(u => ({
      userId: u.id,
      userName: u.name,
      color: u.color,
      isOnline: true,
      lastActive: new Date(u.lastActive).toISOString(),
    }));
  }

  isUserInRoom(notebookId: string, userId: string): boolean {
    const room = Array.from(this.rooms.values()).find(r => r.notebookId === notebookId);
    return room?.users.has(userId) ?? false;
  }

  getAllRooms(): Map<string, RoomInfo> {
    return this.rooms;
  }
}

const roomManager = new RoomManager();

export { globalBroker, roomManager, MessageBroker };
