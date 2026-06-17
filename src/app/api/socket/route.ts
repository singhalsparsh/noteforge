import { NextRequest, NextResponse } from 'next/server';
import { globalBroker, roomManager } from '@/lib/websocket-server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const since = parseInt(searchParams.get('since') || '0');
  const roomId = searchParams.get('roomId') || '';
  const meta = searchParams.get('meta');

  // If no roomId, return status info
  if (!roomId) {
    const rooms = roomManager.getAllRooms();
    let totalUsers = 0;
    rooms.forEach(room => { totalUsers += room.users.size; });
    return NextResponse.json({
      status: 'ok',
      rooms: rooms.size,
      users: totalUsers,
    });
  }

  // Meta request — return current room state without events
  if (meta === 'collaborators') {
    return NextResponse.json({ collaborators: roomManager.getRoomUsers(roomId) });
  }

  // Get events for this room since timestamp
  const allEvents = globalBroker.getMessages(since);
  const roomEvents = allEvents.filter((ev: any) => {
    const d = ev.data;
    return d?.boardId === roomId || d?.notebookId === roomId || d?.roomId === roomId;
  });

  return NextResponse.json(roomEvents);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, notebookId, user, cursor, message, elements } = body;

    switch (action) {
      case 'join':
        roomManager.joinRoom(notebookId, user);
        globalBroker.publish('user:joined', {
          boardId: notebookId,
          notebookId,
          user,
          userId: user.id,
          userName: user.name,
          color: user.color,
        });
        // Also send current collaborators list (properly wrapped as array)
        globalBroker.publish('collaborators:update', {
          boardId: notebookId,
          users: roomManager.getRoomUsers(notebookId),
        });
        break;

      case 'leave':
        roomManager.leaveRoom(notebookId, user?.id);
        globalBroker.publish('user:left', {
          boardId: notebookId,
          notebookId,
          userId: user?.id,
        });
        break;

      case 'cursor':
        globalBroker.publish('cursor:move', {
          boardId: notebookId,
          notebookId,
          ...cursor,
        });
        break;

      case 'chat':
        globalBroker.publish('chat:message', {
          ...message,
          boardId: notebookId,
        });
        break;

      case 'elements':
        globalBroker.publish('elements:update', {
          boardId: notebookId,
          notebookId,
          elements,
        });
        break;

      default:
        return NextResponse.json({ status: 'error', message: 'Unknown action' });
    }

    return NextResponse.json({ status: 'ok' });
  } catch {
    return NextResponse.json({ status: 'error', message: 'Invalid request' });
  }
}
