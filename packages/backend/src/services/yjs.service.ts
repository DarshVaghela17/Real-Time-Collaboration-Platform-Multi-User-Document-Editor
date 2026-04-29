import * as Y from 'yjs';
import { Awareness } from 'y-protocols/awareness';
import { WebsocketProvider } from 'y-websocket';

/**
 * Yjs Document Manager
 * Manages real-time collaborative documents using CRDT (Conflict-free Replicated Data Type)
 * One Yjs document per database document
 */

interface DocumentInstance {
  ydoc: Y.Doc;
  awareness: Awareness;
  ytext: Y.Text;
  ymetadata: Y.Map<any>;
  lastSaved: number;
  version: number;
}

class YjsDocumentManager {
  private documents: Map<string, DocumentInstance> = new Map();
  private updateHandlers: Map<string, Set<Function>> = new Map();

  /**
   * Create or get a Yjs document for collaborative editing
   */
  getOrCreateDocument(docId: string): DocumentInstance {
    if (this.documents.has(docId)) {
      return this.documents.get(docId)!;
    }

    // Create new Yjs document
    const ydoc = new Y.Doc();
    const ytext = ydoc.getText('shared-content');
    const ymetadata = ydoc.getMap('metadata');

    // Create awareness for presence
    const awareness = new Awareness(ydoc);

    const docInstance: DocumentInstance = {
      ydoc,
      awareness,
      ytext,
      ymetadata,
      lastSaved: Date.now(),
      version: 1,
    };

    this.documents.set(docId, docInstance);

    // Setup automatic update handler
    this.setupUpdateHandler(docId, ydoc);

    return docInstance;
  }

  /**
   * Load document content from database into Yjs
   */
  loadDocumentContent(docId: string, content: string): void {
    const doc = this.getOrCreateDocument(docId);
    const ytext = doc.ytext;

    // Apply content to Yjs document
    doc.ydoc.transact(() => {
      ytext.delete(0, ytext.length);
      ytext.insert(0, content);
    });
  }

  /**
   * Get current document content as string
   */
  getDocumentContent(docId: string): string {
    const doc = this.documents.get(docId);
    if (!doc) return '';
    return doc.ytext.toString();
  }

  /**
   * Apply a remote change to the document
   */
  applyChange(docId: string, update: Uint8Array): void {
    const doc = this.documents.get(docId);
    if (!doc) return;

    try {
      Y.applyUpdate(doc.ydoc, update);
    } catch (error) {
      console.error(`Error applying update to document ${docId}:`, error);
    }
  }

  /**
   * Get Yjs document state as binary update
   */
  getDocumentUpdate(docId: string, clientID?: number): Uint8Array {
    const doc = this.documents.get(docId);
    if (!doc) return new Uint8Array();

    return Y.encodeStateAsUpdate(doc.ydoc, clientID ? new Uint8Array([clientID]) : undefined);
  }

  /**
   * Get full document state as update
   */
  getFullDocumentState(docId: string): Uint8Array {
    const doc = this.documents.get(docId);
    if (!doc) return new Uint8Array();

    return Y.encodeStateAsUpdate(doc.ydoc);
  }

  /**
   * Setup update handler for document changes
   */
  private setupUpdateHandler(docId: string, ydoc: Y.Doc): void {
    const updateFunc = (update: Uint8Array, origin: any) => {
      // Only broadcast if update came from local changes (not remote)
      if (origin !== 'remote') {
        // Broadcast to other clients
        const handlers = this.updateHandlers.get(docId);
        if (handlers) {
          handlers.forEach(handler => handler(update));
        }
      }
    };

    ydoc.on('update', updateFunc);

    // Store handler for potential cleanup
    if (!this.updateHandlers.has(docId)) {
      this.updateHandlers.set(docId, new Set());
    }
  }

  /**
   * Subscribe to document updates
   */
  onUpdate(docId: string, handler: (update: Uint8Array) => void): () => void {
    if (!this.updateHandlers.has(docId)) {
      this.updateHandlers.set(docId, new Set());
    }

    const handlers = this.updateHandlers.get(docId)!;
    handlers.add(handler);

    // Return unsubscribe function
    return () => {
      handlers.delete(handler);
    };
  }

  /**
   * Set user awareness state (for presence)
   */
  setUserAwareness(docId: string, userId: string, state: any): void {
    const doc = this.documents.get(docId);
    if (!doc) return;

    doc.awareness.setLocalState({
      user: {
        id: userId,
        ...state,
      },
      clock: Date.now(),
    });
  }

  /**
   * Get all user states in document (presence data)
   */
  getUserAwareness(docId: string): Map<number, any> {
    const doc = this.documents.get(docId);
    if (!doc) return new Map();

    return doc.awareness.getStates();
  }

  /**
   * Mark document as saved
   */
  markDocumentSaved(docId: string, version: number): void {
    const doc = this.documents.get(docId);
    if (doc) {
      doc.lastSaved = Date.now();
      doc.version = version;
    }
  }

  /**
   * Clean up document instance (remove from memory)
   */
  destroyDocument(docId: string): void {
    const doc = this.documents.get(docId);
    if (doc) {
      doc.ydoc.destroy();
      this.documents.delete(docId);
      this.updateHandlers.delete(docId);
    }
  }

  /**
   * Get document info for debugging
   */
  getDocumentInfo(docId: string) {
    const doc = this.documents.get(docId);
    if (!doc) return null;

    return {
      docId,
      contentLength: doc.ytext.length,
      version: doc.version,
      lastSaved: new Date(doc.lastSaved),
      activeUsers: doc.awareness.getStates().size,
    };
  }
}

// Export singleton instance
export default new YjsDocumentManager();
