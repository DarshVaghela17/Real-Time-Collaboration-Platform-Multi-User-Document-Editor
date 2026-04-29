import { useState, useEffect, useRef } from 'react';
import { Box, Typography, Chip, Paper, Alert } from '@mui/material';
import { useSocket } from '../contexts/SocketContext';
import { TiptapEditor } from './TiptapEditor';
import axios from 'axios';

interface User {
  userId: string;
  name: string;
  color: string;
}

interface DocumentEditorProps {
  documentId: string;
  userName: string;
}

export const DocumentEditor = ({ documentId, userName }: DocumentEditorProps) => {
  const { socket, isConnected } = useSocket();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [version, setVersion] = useState(1);
  const [activeUsers, setActiveUsers] = useState<User[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const contentRef = useRef<string>(content);

  // Update content ref when content changes
  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  useEffect(() => {
    if (!socket || !isConnected) return;

    // Join document room
    socket.emit('join-document', { documentId, name: userName });

    // Listen for document loaded
    socket.on('document-loaded', (data: { content: string; title: string; version: number }) => {
      setTitle(data.title);
      setContent(data.content);
      setVersion(data.version || 1);
      console.log('📄 Document loaded (v' + (data.version || 1) + ')');
    });

    // Listen for changes from other users (real-time broadcast)
    socket.on('receive-changes', (data: { content: string; userId: string }) => {
      setContent(data.content);
      console.log('📝 Received changes from:', data.userId);
    });

    // Listen for active users
    socket.on('active-users', (users: User[]) => {
      setActiveUsers(users);
      console.log('👥 Active users:', users.length);
    });

    // User joined
    socket.on('user-joined', (user: User) => {
      setActiveUsers((prev) => [...prev, user]);
      console.log('👋 User joined:', user.name);
    });

    // User left
    socket.on('user-left', (data: { userId: string }) => {
      setActiveUsers((prev) => prev.filter((u) => u.userId !== data.userId));
      console.log('👋 User left');
    });

    // Document saved successfully
    socket.on('document-saved', (data: { version: number }) => {
      setVersion(data.version || version);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
      console.log('💾 Document saved (v' + (data.version || version) + ')');
    });

    // Version conflict detected
    socket.on('version-conflict', (data: { serverVersion: number; clientVersion: number }) => {
      setSaveStatus('error');
      setErrorMessage(
        `Version conflict: server is v${data.serverVersion}, you're on v${data.clientVersion}. Please refresh to get latest version.`
      );
      console.error('⚠️ Version conflict:', data);
      setTimeout(() => setSaveStatus('idle'), 5000);
    });

    // Error handling
    socket.on('error', (error: { message: string }) => {
      setSaveStatus('error');
      setErrorMessage(error.message);
      console.error('Socket error:', error.message);
      setTimeout(() => setSaveStatus('idle'), 5000);
    });

    // Cleanup
    return () => {
      socket.off('document-loaded');
      socket.off('receive-changes');
      socket.off('active-users');
      socket.off('user-joined');
      socket.off('user-left');
      socket.off('document-saved');
      socket.off('version-conflict');
      socket.off('error');
    };
  }, [socket, isConnected, documentId, userName, version]);

  // Handle content change from TiptapEditor
  const handleContentChange = (html: string) => {
    setContent(html);

    // Send changes to other users in real-time
    if (socket && isConnected) {
      socket.emit('send-changes', { content: html });
    }

    // Auto-save after 2 seconds of inactivity
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setSaveStatus('saving');
    saveTimeoutRef.current = setTimeout(() => {
      saveDocument(html);
    }, 2000);
  };

  // Save document to backend via API
  const saveDocument = async (contentToSave: string) => {
    try {
      setIsSaving(true);
      setSaveStatus('saving');

      const token = localStorage.getItem('token');
      if (!token) {
        setErrorMessage('Not authenticated');
        setSaveStatus('error');
        setIsSaving(false);
        return;
      }

      // Save via HTTP (for persistence)
      const response = await axios.put(
        `http://localhost:3000/api/documents/${documentId}`,
        {
          title,
          content: contentToSave,
          version, // Include current version for optimistic locking
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.success) {
        const newVersion = response.data.data.document.version;
        setVersion(newVersion);
        setSaveStatus('saved');
        console.log('✅ Document saved to database (v' + newVersion + ')');

        // Also notify via Socket.io for real-time sync
        if (socket && isConnected) {
          socket.emit('save-document', { content: contentToSave, version: newVersion });
        }

        // Clear success message after 2 seconds
        setTimeout(() => setSaveStatus('idle'), 2000);
      }
    } catch (error: any) {
      console.error('Save error:', error);

      // Handle version conflict (409)
      if (error.response?.status === 409) {
        const serverVersion = error.response.data.data?.document?.version || version + 1;
        setSaveStatus('error');
        setErrorMessage(
          `Version conflict: server is v${serverVersion}, you're on v${version}. Please refresh to sync.`
        );
        setVersion(serverVersion);
      } else {
        setSaveStatus('error');
        setErrorMessage(error.response?.data?.message || 'Failed to save document');
      }

      setTimeout(() => setSaveStatus('idle'), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      {/* Header with title and connection status */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h5">{title || 'Untitled Document'}</Typography>
            <Typography variant="caption" color="textSecondary">
              Version {version}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Box sx={{ textAlign: 'right' }}>
              {isSaving && (
                <Typography variant="caption" sx={{ color: '#f59e0b' }}>
                  ⏳ Saving...
                </Typography>
              )}
              {saveStatus === 'saved' && (
                <Typography variant="caption" sx={{ color: '#10b981' }}>
                  ✓ Saved
                </Typography>
              )}
              {saveStatus === 'error' && (
                <Typography variant="caption" sx={{ color: '#ef4444' }}>
                  ✗ Error
                </Typography>
              )}
            </Box>
            <Typography variant="caption">
              {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
            </Typography>
          </Box>
        </Box>

        {/* Active Users */}
        <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          <Typography variant="caption" sx={{ fontWeight: 600 }}>
            Editing:
          </Typography>
          {activeUsers.length === 0 ? (
            <Typography variant="caption" color="textSecondary">
              Just you
            </Typography>
          ) : (
            activeUsers.map((user) => (
              <Chip
                key={user.userId}
                label={user.name}
                size="small"
                sx={{
                  backgroundColor: user.color,
                  color: 'white',
                  fontWeight: 500,
                }}
              />
            ))
          )}
        </Box>
      </Paper>

      {/* Error Alert */}
      {errorMessage && (
        <Alert severity="error" onClose={() => setErrorMessage('')} sx={{ mb: 2 }}>
          {errorMessage}
        </Alert>
      )}

      {/* Tiptap Editor */}
      <TiptapEditor
        initialContent={content}
        onChange={handleContentChange}
        placeholder="Start typing... Format your document with bold, italic, headings, lists, and more."
        editable={isConnected}
      />

      {/* Editor Info */}
      <Typography variant="caption" sx={{ display: 'block', mt: 2, color: 'textSecondary' }}>
        💡 Tip: Your changes are saved automatically. Use the toolbar above to format your text.
        Collaborate with others in real-time!
      </Typography>
    </Box>
  );
};