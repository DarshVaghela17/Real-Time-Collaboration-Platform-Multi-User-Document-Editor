import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { Awareness } from 'y-protocols/awareness';

/**
 * Yjs Document Manager for Collaborative Editing
 * Manages WebSocket provider and document synchronization
 */

interface YjsConfig {
  documentId: string;
  userId: string;
  userName: string;
  userColor: string;
  wsUrl?: string; // WebSocket server URL
}

class YjsManager {
  private doc: Y.Doc | null = null;
  private provider: WebsocketProvider | null = null;
  private awareness: Awareness | null = null;

  /**
   * Initialize Yjs document with WebSocket provider
   * @param config - Configuration with document ID and user info
   */
  initialize(config: YjsConfig) {
    const { documentId, userId, userName, userColor, wsUrl = 'ws://localhost:1234' } = config;

    // Create shared document
    this.doc = new Y.Doc();

    // Create shared text type for document content
    this.createTextType('sharedText');

    // Create WebSocket provider for synchronization
    this.provider = new WebsocketProvider(
      wsUrl,
      `doc-${documentId}`, // Room name
      this.doc,
      {
        connect: true,
        resyncInterval: 5000, // Resync every 5 seconds if disconnected
      }
    );

    // Get awareness instance for user presence
    this.awareness = this.provider.awareness;

    // Set local user state for presence
    this.awareness.setLocalState({
      user: {
        name: userName,
        color: userColor,
        id: userId,
      },
      cursor: null,
    });

    // Listen for provider connection changes
    this.provider.on('status', ({ status }: { status: 'connecting' | 'connected' | 'disconnected' }) => {
      console.log(`📡 Yjs provider status: ${status}`);
    });

    // Listen for sync errors
    this.provider.on('sync', (synced: boolean) => {
      console.log(`🔄 Yjs sync: ${synced ? 'synced' : 'syncing'}`);
    });

    return this.doc;
  }

  /**
   * Get or create a shared text type
   * Used for document content
   */
  createTextType(name: string) {
    if (!this.doc) throw new Error('Document not initialized');
    return this.doc.getText(name);
  }

  /**
   * Get or create a shared map type
   * Used for metadata, cursors, etc.
   */
  createMapType(name: string) {
    if (!this.doc) throw new Error('Document not initialized');
    return this.doc.getMap(name);
  }

  /**
   * Get or create a shared array type
   */
  createArrayType(name: string) {
    if (!this.doc) throw new Error('Document not initialized');
    return this.doc.getArray(name);
  }

  /**
   * Get the shared text document
   */
  getSharedText(name: string = 'sharedText'): Y.Text {
    if (!this.doc) throw new Error('Document not initialized');
    return this.doc.getText(name);
  }

  /**
   * Update user cursor position in awareness
   * @param position - Cursor position (0-based character offset)
   */
  updateCursorPosition(position: number) {
    if (!this.awareness) return;

    const currentState = this.awareness.getLocalState();
    this.awareness.setLocalState({
      ...currentState,
      cursor: {
        position,
        timestamp: Date.now(),
      },
    });
  }

  /**
   * Get all connected users from awareness
   */
  getAwarenesUsers() {
    if (!this.awareness) return [];

    const users: any[] = [];
    this.awareness.getStates().forEach((state: any) => {
      if (state.user) {
        users.push({
          id: state.user.id,
          name: state.user.name,
          color: state.user.color,
          cursor: state.cursor,
        });
      }
    });

    return users;
  }

  /**
   * Listen to awareness changes (user join/leave)
   */
  onAwarenessChange(callback: (changes: any[]) => void) {
    if (!this.awareness) return;

    this.awareness.on('change', (changes: any[]) => {
      callback(changes);
    });
  }

  /**
   * Listen to local changes (document edits)
   */
  onLocalChange(callback: (update: Uint8Array, origin: any) => void) {
    if (!this.doc) return;

    // Update event fires on any change to the document
    this.doc.on('update', (update: Uint8Array, origin: any) => {
      // Don't trigger callback for remote updates
      if (origin !== this.provider) {
        callback(update, origin);
      }
    });
  }

  /**
   * Listen to remote changes
   */
  onRemoteChange(callback: (ytext: Y.Text) => void) {
    const sharedText = this.getSharedText();

    sharedText.observe((_event: Y.YTextEvent) => {
      callback(sharedText);
    });
  }

  /**
   * Get the current document content as string
   */
  getContent(): string {
    const sharedText = this.getSharedText();
    return sharedText.toString();
  }

  /**
   * Set the document content
   */
  setContent(content: string) {
    const sharedText = this.getSharedText();

    // Clear existing content
    if (sharedText.length > 0) {
      sharedText.delete(0, sharedText.length);
    }

    // Insert new content
    sharedText.insert(0, content);
  }

  /**
   * Disconnect from provider
   */
  disconnect() {
    if (this.provider) {
      this.provider.disconnect();
    }
  }

  /**
   * Destroy and cleanup
   */
  destroy() {
    if (this.provider) {
      this.provider.destroy();
    }
    if (this.doc) {
      this.doc.destroy();
    }
  }

  /**
   * Check if provider is connected
   */
  isConnected(): boolean {
    if (!this.provider) return false;
    return this.provider.shouldConnect;
  }

  /**
   * Get provider instance for advanced usage
   */
  getProvider(): WebsocketProvider | null {
    return this.provider;
  }

  /**
   * Get document instance for advanced usage
   */
  getDoc(): Y.Doc | null {
    return this.doc;
  }
}

// Export singleton instance
export const yjsManager = new YjsManager();
