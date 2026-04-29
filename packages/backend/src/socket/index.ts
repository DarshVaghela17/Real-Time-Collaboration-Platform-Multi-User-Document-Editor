import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { verifyToken } from '../utils/jwt';
import documentService from '../services/document.service';
import commentService from '../services/comment.service';
import versionService from '../services/version.service';
import yjsService from '../services/yjs.service';

export interface SocketUser {
  userId: string;
  email: string;
  name: string;
  color: string;
}

export interface DocumentChange {
  content: string;
  userId: string;
  timestamp: number;
}

export interface CursorPosition {
  userId: string;
  name: string;
  color: string;
  position: number;
}

const generateColor = (): string => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
    '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

export const initializeSocket = (httpServer: HTTPServer) => {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
      credentials: true,
    },
    maxHttpBufferSize: 1e8, // 100 MB for large documents
  });

  // Store update handlers per document
  const docUpdateHandlers: Map<string, (update: Uint8Array) => void> = new Map();

  // 🔐 Auth middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = verifyToken(token);

      socket.data.user = {
        userId: decoded.userId,
        email: decoded.email,
      };

      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  // 🚀 Connection
  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.data.user.userId}`);

    // 📄 JOIN DOCUMENT WITH YRICS
    socket.on('join-document', async (data: { documentId: string; name: string }) => {
      try {
        const { documentId, name } = data;

        // ✅ FIX: Check if user has ANY access (owner, editor, or viewer)
        const access = await documentService.getUserAccess(
          documentId,
          socket.data.user.userId
        );

        if (!access) {
          socket.emit('error', { message: 'Access denied to this document' });
          return;
        }

        socket.join(documentId);

        const userColor = generateColor();
        socket.data.documentId = documentId;
        socket.data.name = name;
        socket.data.color = userColor;

        // Load document from DB into Yjs
        const document = await documentService.findById(documentId);
        yjsService.loadDocumentContent(documentId, document.content);

        // Get Yjs document instance
        const yjsDoc = yjsService.getOrCreateDocument(documentId);

        // Send full document state to connecting user
        const fullState = yjsService.getFullDocumentState(documentId);
        socket.emit('yjs-state-init', {
          state: Array.from(fullState),
          title: document.title,
          version: document.version || 1,
        });

        // Set user awareness (presence)
        yjsService.setUserAwareness(documentId, socket.data.user.userId, {
          name,
          color: userColor,
        });

        // Broadcast user joined to others
        socket.to(documentId).emit('user-joined', {
          userId: socket.data.user.userId,
          name,
          color: userColor,
        });

        // Send active users
        const socketsInRoom = await io.in(documentId).fetchSockets();
        const activeUsers: SocketUser[] = socketsInRoom.map((s) => ({
          userId: s.data.user.userId,
          email: s.data.user.email,
          name: s.data.name,
          color: s.data.color,
        }));

        socket.emit('active-users', activeUsers);

        console.log(`📝 User ${socket.data.user.userId} joined document ${documentId}`);

      } catch (error: any) {
        console.error('Error joining document:', error);
        socket.emit('error', { message: error.message });
      }
    });

    // ⚡ YRICS UPDATE (Binary sync protocol)
    socket.on('yjs-update', (data: { docId: string; update: number[] }) => {
      try {
        const documentId = data.docId || socket.data.documentId;

        if (!documentId) {
          socket.emit('error', { message: 'Not in any document room' });
          return;
        }

        // Convert array back to Uint8Array
        const update = new Uint8Array(data.update);

        // Apply update to Yjs document
        yjsService.applyChange(documentId, update);

        // Broadcast update to all OTHER users in the room
        socket.to(documentId).emit('yjs-update', {
          update: Array.from(update),
          userId: socket.data.user.userId,
        });

        console.log(`✏️  Update from ${socket.data.user.userId} in doc ${documentId}`);

      } catch (error: any) {
        console.error('Error applying Yjs update:', error);
        socket.emit('error', { message: error.message });
      }
    });

    // 🖱️ CURSOR (still support for UI)
    socket.on('cursor-position', (data: { position: number }) => {
      const documentId = socket.data.documentId;

      if (documentId) {
        socket.to(documentId).emit('cursor-update', {
          userId: socket.data.user.userId,
          name: socket.data.name,
          color: socket.data.color,
          position: data.position,
        });
      }
    });

    // 💾 SAVE DOCUMENT + VERSIONING
    socket.on('save-document', async (data: { docId?: string }) => {
      try {
        const documentId = data.docId || socket.data.documentId;

        if (!documentId) {
          socket.emit('error', { message: 'Not in any document room' });
          return;
        }

        // Get current Yjs content
        const content = yjsService.getDocumentContent(documentId);

        // Save to database
        await documentService.update(documentId, undefined, content);

        // Create version snapshot
        const version = await versionService.createVersion(
          documentId,
          socket.data.user.userId
        );

        // Mark as saved in Yjs service
        yjsService.markDocumentSaved(documentId, version.versionNumber);

        // Notify all users
        io.to(documentId).emit('document-saved', {
          timestamp: Date.now(),
          versionNumber: version.versionNumber,
          userId: socket.data.user.userId,
        });

        console.log(`💾 Document ${documentId} saved (v${version.versionNumber})`);

      } catch (error: any) {
        console.error('Error saving document:', error);
        socket.emit('error', { message: error.message });
      }
    });

    // 💬 NEW COMMENT
    socket.on('new-comment', async (data: {
      documentId: string;
      content: string;
      parentId?: string;
    }) => {
      try {
        const documentId = socket.data.documentId;

        if (documentId !== data.documentId) {
          socket.emit('error', { message: 'Document mismatch' });
          return;
        }

        let comment;
        if (data.parentId) {
          // Reply to existing comment
          comment = await commentService.replyToComment(
            socket.data.user.userId,
            data.parentId,
            data.content
          );
        } else {
          // New top-level comment
          comment = await commentService.createComment(
            socket.data.user.userId,
            documentId,
            data.content
          );
        }

        io.to(documentId).emit('comment-added', comment);

      } catch (error: any) {
        console.error('Error creating comment:', error);
        socket.emit('error', { message: error.message });
      }
    });

    // ✅ RESOLVE COMMENT
    socket.on('resolve-comment', async (data: { commentId: string }) => {
      try {
        const documentId = socket.data.documentId;

        if (!documentId) {
          socket.emit('error', { message: 'Not in any document' });
          return;
        }

        const comment = await commentService.resolveComment(socket.data.user.userId, data.commentId);

        io.to(documentId).emit('comment-resolved', comment);

      } catch (error: any) {
        console.error('Error resolving comment:', error);
        socket.emit('error', { message: error.message });
      }
    });

    // 🌐 REQUEST SYNC STATE (new client wants full state)
    socket.on('yjs-sync-step-1', async (data: { docId: string }) => {
      try {
        const documentId = data.docId;

        if (!documentId) {
          socket.emit('error', { message: 'Document ID required' });
          return;
        }

        // ✅ FIX: Check permission before sending document state
        const access = await documentService.getUserAccess(
          documentId,
          socket.data.user.userId
        );

        if (!access) {
          socket.emit('error', { message: 'Access denied to this document' });
          return;
        }

         console.log(`📄 Loading document ${documentId} into Yjs...`);

        // Ensure document is loaded into Yjs (in case user didn't join-document explicitly)
        const document = await documentService.findById(documentId);
        const contentLength = document.content ? document.content.length : 0;
        console.log(`📝 Document found: ${document.title}, Content length: ${contentLength}`);

        if (!document.content || document.content.trim().length === 0) {
          console.warn(`⚠️  Document ${documentId} has empty content. This may be a scanned PDF or extraction error.`);
        }

        yjsService.loadDocumentContent(documentId, document.content || '');
        console.log(`✅ Loaded document content into Yjs for ${documentId}`);

        // Send full state to new client
        const state = yjsService.getFullDocumentState(documentId);
        console.log(`🔄 Sending state (${state.length} bytes) to client`);

        socket.emit('yjs-sync-step-2', {
          state: Array.from(state),
          docId: documentId,
        });

        console.log(`🔄 Sent sync state for ${documentId} to user ${socket.data.user.userId}`);

      } catch (error: any) {
        console.error('Error in sync step 1:', error);
        socket.emit('error', { message: error.message });
      }
    });

    // ❌ DISCONNECT
    socket.on('disconnect', () => {
      const documentId = socket.data.documentId;

      if (documentId) {
        socket.to(documentId).emit('user-left', {
          userId: socket.data.user.userId,
          name: socket.data.name,
        });

        console.log(`👋 User ${socket.data.user.userId} disconnected from ${documentId}`);
      }

      console.log(`❌ User disconnected: ${socket.data.user.userId}`);
    });
  });

  console.log('🔌 Socket.io server initialized ⚡ WITH YRICS SUPPORT');
  return io;
};