import { useEffect, useRef, useState } from 'react';
import * as Y from 'yjs';
import { Socket } from 'socket.io-client';

/**
 * useYjsDocument - Hook for managing Yjs documents
 * Handles Yjs CRDT synchronization with Socket.io
 */

interface UseYjsDocumentProps {
  documentId: string;
  socket: Socket | null;
  onStateLoaded?: () => void;
}

export const useYjsDocument = ({
  documentId,
  socket,
  onStateLoaded,
}: UseYjsDocumentProps) => {
  const ydocRef = useRef<Y.Doc | null>(null);
  const ytextRef = useRef<Y.Text | null>(null);
  const syncStateRef = useRef<boolean>(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isSynced, setIsSynced] = useState(false);

  // Initialize Yjs document
  useEffect(() => {
    if (!documentId) return;

    // Create new Yjs document
    const ydoc = new Y.Doc();
    const ytext = ydoc.getText('shared-content');

    ydocRef.current = ydoc;
    ytextRef.current = ytext;

    console.log(`📄 Created Yjs document for ${documentId}`);

    return () => {
      // Cleanup on unmount
      ydoc.destroy();
    };
  }, [documentId]);

  // Setup Socket.io listeners
  useEffect(() => {
    if (!socket || !ydocRef.current) return;

    const ydoc = ydocRef.current;

    // Request initial state from server
    const requestInitialState = () => {
      if (socket.connected) {
        console.log('🔄 Requesting initial Yjs state from server...');
        socket.emit('yjs-sync-step-1', { docId: documentId });
      }
    };

    // Receive initial state
    const handleSyncStep2 = (data: { state: number[]; docId: string }) => {
      try {
        console.log(`📥 Received sync state with ${data.state.length} bytes for doc ${data.docId}`);
        const state = new Uint8Array(data.state);
        Y.applyUpdate(ydoc, state);
        setIsSynced(true);
        syncStateRef.current = true;

        const content = ytextRef.current?.toString() || '';
        console.log(`✅ Yjs document synced with server. Content length: ${content.length}`);

        if (onStateLoaded) {
          onStateLoaded();
        }
      } catch (error) {
        console.error('Error applying initial state:', error);
      }
    };

    // Receive updates from other users
    const handleRemoteUpdate = (data: { update: number[]; userId: string }) => {
      try {
        const update = new Uint8Array(data.update);
        Y.applyUpdate(ydoc, update);
        console.log(`📨 Received update from ${data.userId}`);
      } catch (error) {
        console.error('Error applying remote update:', error);
      }
    };

    // Setup local change handler
    const handleLocalChange = (update: Uint8Array, origin: any) => {
      // Only send if update came from local changes (not from remote sync)
      if (origin !== 'remote' && socket.connected) {
        // Send update to server
        socket.emit('yjs-update', {
          docId: documentId,
          update: Array.from(update),
        });

        console.log(`📤 Sent update (${update.length} bytes)`);
      }
    };

    // Listen to socket events
    socket.on('yjs-sync-step-2', handleSyncStep2);
    socket.on('yjs-update', handleRemoteUpdate);

    // Listen to Yjs updates
    ydoc.on('update', handleLocalChange);

    // Monitor connection status
    const handleConnect = () => {
      console.log('✅ Socket connected');
      setIsConnected(true);
      setIsSynced(false);
      requestInitialState();
    };

    const handleDisconnect = () => {
      console.log('❌ Socket disconnected');
      setIsConnected(false);
      setIsSynced(false);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    // Request initial state if already connected
    if (socket.connected) {
      requestInitialState();
    }

    // Cleanup
    return () => {
      socket.off('yjs-sync-step-2', handleSyncStep2);
      socket.off('yjs-update', handleRemoteUpdate);
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      ydoc.off('update', handleLocalChange);
    };
  }, [socket, documentId, onStateLoaded]);

  return {
    ydoc: ydocRef.current,
    ytext: ytextRef.current,
    isConnected,
    isSynced,
  };
};

export default useYjsDocument;
