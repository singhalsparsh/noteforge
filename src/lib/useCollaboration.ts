'use client';

import { useEffect, useRef } from 'react';
import { useStore } from '@/store/useStore';
import { connectSocket, disconnectSocket, startPolling, stopPolling, fetchCollaborators } from '@/lib/socket';
import { Collaborator, CursorPosition, ChatMessage } from '@/types';

export function useCollaboration(boardId: string) {
  const mountedRef = useRef(false);

  useEffect(() => {
    if (!boardId) return;
    mountedRef.current = true;

    const store = useStore.getState();

    // Connect to room
    connectSocket(boardId, {
      id: store.userId,
      name: store.userName,
      color: store.userColor,
    });

    store.setCollaborating(true);

    // Fetch current collaborators list immediately
    fetchCollaborators(boardId).then(users => {
      if (mountedRef.current && Array.isArray(users) && users.length > 0) {
        useStore.getState().setCollaborators(users);
      }
    });

    // Start polling for events
    startPolling(
      // onCursorMoved
      (cursor: CursorPosition) => {
        if (!mountedRef.current) return;
        useStore.getState().updateCursor(cursor);
      },
      // onChatMessage
      (message: ChatMessage) => {
        if (!mountedRef.current) return;
        useStore.getState().addChatMessage(message);
      },
      // onUserJoined
      (user: Collaborator) => {
        if (!mountedRef.current) return;
        useStore.getState().addCollaborator(user);
      },
      // onUserLeft
      (userId: string) => {
        if (!mountedRef.current) return;
        useStore.getState().removeCollaborator(userId);
        useStore.getState().removeCursor(userId);
      },
      // onCollaboratorsUpdate
      (users: Collaborator[]) => {
        if (!mountedRef.current) return;
        if (Array.isArray(users)) {
          useStore.getState().setCollaborators(users);
        }
      },
      // onElementsUpdate
      (elements: any[]) => {
        if (!mountedRef.current) return;
        if (elements && elements.length > 0) {
          const currentState = useStore.getState();
          // Only replace if the incoming elements are different
          if (currentState.elements.length !== elements.length) {
            currentState.setElements(elements);
          }
        }
      },
    );

    return () => {
      mountedRef.current = false;
      stopPolling();
      disconnectSocket();
      useStore.getState().setCollaborating(false);
    };
  }, [boardId]);
}
