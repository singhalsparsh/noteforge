'use client';

import { useEffect, useRef } from 'react';
import { useStore } from '@/store/useStore';
import { connectToRoom, disconnectFromRoom, setCallbacks } from '@/lib/peerClient';
import { Collaborator, CursorPosition } from '@/types';

export function usePeerCollaboration(boardId: string) {
  const mountedRef = useRef(false);
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!boardId) return;
    mountedRef.current = true;
    retryCountRef.current = 0;

    const store = useStore.getState();

    function setupCallbacks() {
      setCallbacks({
        onCursorMoved: (cursor: CursorPosition) => {
          if (!mountedRef.current) return;
          useStore.getState().updateCursor(cursor);
        },
        onChatMessage: (message) => {
          if (!mountedRef.current) return;
          useStore.getState().addChatMessage(message);
        },
        onUserJoined: (user: Collaborator) => {
          if (!mountedRef.current) return;
          useStore.getState().addCollaborator(user);
        },
        onUserLeft: (userId: string) => {
          if (!mountedRef.current) return;
          useStore.getState().removeCollaborator(userId);
          useStore.getState().removeCursor(userId);
        },
        onCollaboratorsUpdate: (users: Collaborator[]) => {
          if (!mountedRef.current) return;
          if (Array.isArray(users)) {
            useStore.getState().setCollaborators(users);
          }
        },
        onElementsUpdate: (incomingElements: any[]) => {
          if (!mountedRef.current) return;
          if (!incomingElements || incomingElements.length === 0) return;

          const s = useStore.getState();
          const currentElements = s.elements;

          // Merge incoming elements: keep the higher-version of each element
          const merged = new Map<string, any>();
          currentElements.forEach(el => merged.set(el.id, { ...el }));
          incomingElements.forEach((el: any) => {
            const existing = merged.get(el.id);
            if (!existing || (el.version || 0) > (existing.version || 0)) {
              merged.set(el.id, { ...el });
            }
          });

          s.setElements([...merged.values()]);
        },
        onConnected: () => {
          if (!mountedRef.current) return;
          retryCountRef.current = 0;
          useStore.getState().setCollaborating(true);
        },
      });
    }

    function connect() {
      setupCallbacks();
      connectToRoom(boardId, {
        id: store.userId,
        name: store.userName,
        color: store.userColor,
      }).then(() => {
        // Try reconnecting if still not collaborating after a delay
        if (mountedRef.current && retryCountRef.current < 3) {
          retryTimerRef.current = setTimeout(() => {
            if (mountedRef.current && !useStore.getState().isCollaborating) {
              retryCountRef.current++;
              disconnectFromRoom();
              connect();
            }
          }, 3000 * (retryCountRef.current + 1));
        }
      });
    }

    connect();

    return () => {
      mountedRef.current = false;
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      setCallbacks({});
      disconnectFromRoom();
      useStore.getState().setCollaborating(false);
    };
  }, [boardId]);
}
