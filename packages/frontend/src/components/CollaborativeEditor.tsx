import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import { Box, CircularProgress, Alert, Chip } from '@mui/material';
import { useYjsDocument } from '../hooks/useYjsDocument';
import { Socket } from 'socket.io-client';

interface CollaborativeEditorProps {
  documentId: string;
  socket: Socket | null;
  editable?: boolean;
  onReady?: () => void;
  onStateLoaded?: () => void;
}

/**
 * CollaborativeEditor - Tiptap editor with Yjs + Socket.io for real-time collaboration
 *
 * Features:
 * - Live text synchronization using Yjs CRDT
 * - Automatic conflict resolution
 * - No page refresh needed
 */
export const CollaborativeEditor: React.FC<CollaborativeEditorProps> = ({
  documentId,
  socket,
  editable = true,
  onReady,
  onStateLoaded,
}) => {
  // Get Yjs document
  const { ydoc, ytext, isConnected, isSynced } = useYjsDocument({
    documentId,
    socket,
    onStateLoaded: () => {
      if (onStateLoaded) onStateLoaded();
      editor?.setEditable(true);
    },
  });

  // Initialize Tiptap editor with Yjs collaboration
  // Only add Collaboration extension when ydoc is ready
  const editor = useEditor(
    {
      extensions: ydoc
        ? [
            StarterKit.configure({
              history: false, // Yjs manages history
            }),
            // Enable real-time collaborative editing
            Collaboration.configure({
              document: ydoc,
            }),
          ]
        : [
            StarterKit.configure({
              history: false,
            }),
          ],
      content: '',
      editable: editable && isSynced && !!ydoc,
      onUpdate: () => {
        // Changes are automatically synced via Yjs
      },
    },
    [ydoc, isSynced, editable]
  );

  // Set editor editable state when synced
  useEffect(() => {
    if (editor) {
      editor.setEditable(isSynced && editable && !!ydoc);
    }
  }, [editor, isSynced, editable, ydoc]);

  // Callback when editor is ready
  useEffect(() => {
    if (editor && isSynced && onReady && ydoc) {
      const contentText = ytext.toString();
      console.log(`✅ Editor synced. Yjs content length: ${contentText.length}`);
      console.log(`📝 First 100 chars of content: ${contentText.substring(0, 100)}`);
      onReady();
    }
  }, [editor, isSynced, onReady, ydoc]);

  // Show loading state until Yjs document is ready
  if (!ydoc || !ytext) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      {/* Connection Status Indicator */}
      {!isConnected && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          🔄 Connecting to collaboration server...
        </Alert>
      )}

      {isConnected && !isSynced && (
        <Alert severity="info" sx={{ mb: 2 }}>
          📡 Syncing document with other editors...
        </Alert>
      )}

      {isConnected && isSynced && (
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            icon={
              <span
                style={{
                  display: 'inline-block',
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: '#4caf50',
                }}
              />
            }
            label="Live Collaboration Active"
            size="small"
            color="success"
            variant="outlined"
          />
        </Box>
      )}

      {/* Editor Container */}
      <Box
        sx={{
          border: '1px solid #e0e0e0',
          borderRadius: 1,
          overflow: 'hidden',
          '& .ProseMirror': {
            minHeight: '500px',
            padding: '20px',
            outline: 'none',
            fontSize: '16px',
            lineHeight: 1.6,

            // Collaborative cursor styles
            '& .collaboration-cursor__caret': {
              position: 'relative',
              pointerEvents: 'none',

              // Blinking animation
              animation: 'blink 1s infinite',
              '@keyframes blink': {
                '0%, 49%': { opacity: 1 },
                '50%, 100%': { opacity: 0 },
              },
            },

            '& .collaboration-cursor__label': {
              fontSize: '12px',
              fontWeight: 'bold',
              padding: '2px 6px',
              borderRadius: '3px 3px 3px 0',
              color: 'white',
              whiteSpace: 'nowrap',
              userSelect: 'none',
              pointerEvents: 'none',
            },
          },
        }}
      >
        <EditorContent editor={editor} />
      </Box>

      {/* Debug Info (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <Box sx={{ mt: 2, p: 1, backgroundColor: '#f5f5f5', fontSize: '12px' }}>
          <div>📊 Collaboration Status:</div>
          <div>├─ Connected: {isConnected ? '✅' : '❌'}</div>
          <div>├─ Synced: {isSynced ? '✅' : '⏳'}</div>
          <div>├─ Doc ID: {documentId}</div>
          <div>└─ Content Length: {ytext?.length || 0} characters</div>
        </Box>
      )}
    </Box>
  );
};

export default CollaborativeEditor;
