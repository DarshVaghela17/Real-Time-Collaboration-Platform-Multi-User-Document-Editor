import { useCallback, useRef, useState } from 'react';
import axios from 'axios';

interface UseDocumentSaveOptions {
  onSaveStart?: () => void;
  onSaveSuccess?: (data: any) => void;
  onSaveError?: (error: any) => void;
  autoSaveDelay?: number;
}

/**
 * Hook for managing document save operations
 * Handles both API persistence and socket.io real-time sync
 *
 * Used by DocumentEditor to save changes to backend
 * Supports version control and conflict detection
 */
export const useDocumentSave = (token: string | null, options: UseDocumentSaveOptions = {}) => {
  const { onSaveStart, onSaveSuccess, onSaveError, autoSaveDelay = 2000 } = options;

  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [version, setVersion] = useState(1);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Save document via API
  const saveDocument = useCallback(
    async (documentId: string, content: string, title: string, currentVersion: number) => {
      if (!token) {
        onSaveError?.({ message: 'Not authenticated' });
        return;
      }

      try {
        onSaveStart?.();
        setIsSaving(true);

        const response = await axios.put(
          `http://localhost:3000/api/documents/${documentId}`,
          {
            title,
            content,
            version: currentVersion,
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
          setLastSavedAt(new Date());
          onSaveSuccess?.({ version: newVersion, ...response.data.data });
          return response.data.data;
        }
      } catch (error: any) {
        console.error('Save error:', error);
        onSaveError?.(error.response?.data || error);
        throw error;
      } finally {
        setIsSaving(false);
      }
    },
    [token, onSaveStart, onSaveSuccess, onSaveError]
  );

  // Schedule auto-save
  const scheduleAutoSave = useCallback(
    (documentId: string, content: string, title: string, currentVersion: number) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        saveDocument(documentId, content, title, currentVersion);
      }, autoSaveDelay);
    },
    [autoSaveDelay, saveDocument]
  );

  // Cancel pending save
  const cancelAutoSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
  }, []);

  // Cleanup
  const cleanup = useCallback(() => {
    cancelAutoSave();
  }, [cancelAutoSave]);

  return {
    isSaving,
    lastSavedAt,
    version,
    saveDocument,
    scheduleAutoSave,
    cancelAutoSave,
    cleanup,
  };
};
