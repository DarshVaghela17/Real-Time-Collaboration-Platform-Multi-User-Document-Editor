# Real-Time Collaboration Setup Guide

## Overview

Real-time collaboration allows multiple users to edit the same document simultaneously with:
- ✅ Live content synchronization
- ✅ See other users' cursors
- ✅ Automatic conflict resolution
- ✅ Presence awareness (who's editing)

---

## Current Implementation Status

### ✅ Already Implemented
1. **Presence Awareness** - Active Users Panel shows who's online
2. **Socket.io Infrastructure** - Real-time communication set up
3. **Notifications** - Get alerts when document is shared
4. **Comments** - Asynchronous collaboration via comments
5. **Auto-save** - Changes saved to backend every 2 seconds

### ❌ Not Yet Implemented
1. **Real-time content sync** - Changes don't appear to other users yet
2. **Cursor positions** - Can't see where others are typing
3. **Yjs integration** - CRDT not wired into editor
4. **Conflict resolution** - No automatic merge of edits

---

## How Current Collaboration Works

### Right Now (Without Live Sync)
```
User A                          User B
   |                               |
   |-- Edit doc                    |-- Edit doc
   |-- Save (2s debounce)          |-- Save (2s debounce)
   |                    Backend     |
   |              (Database)        |
   |-- Refresh page <-- Latest -->-- Refresh page
```

**Problem:** Users don't see each other's edits unless they refresh!

---

## Solution: Real-Time Collaboration with Yjs

### How Yjs Works (CRDT Algorithm)
```
User A                 Yjs Sync               User B
   |                      |                      |
   |-- Type "Hello" ----> | <---- Sync "Hello" --|
   |-- Type "World" ----> | <---- Sync "World" --|
   |                      |                      |
   | (Automatic conflict  | (Uses CRDT to       |
   |  resolution)         |  merge edits)       |
```

**Benefit:** Changes sync instantly, any order of edits produces same result!

---

## Step-by-Step: Enable Live Collaboration

### Step 1: Install Required Packages

```bash
cd packages/frontend
npm install yjs y-websocket y-protocols
npm install @tiptap/extension-collaboration @tiptap/extension-collaboration-cursor
```

### Step 2: Create Collaboration Hook

Create `src/hooks/useDocumentSync.ts`:

```typescript
import { useEffect, useRef, useState } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

interface UseDocumentSyncProps {
  documentId: string;
  userName: string;
  userColor: string;
}

export const useDocumentSync = ({
  documentId,
  userName,
  userColor,
}: UseDocumentSyncProps) => {
  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!documentId) return;

    // Create Yjs document
    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;

    // Get or create shared text
    const ytext = ydoc.getText('shared-content');

    // Connect to WebSocket provider
    // NOTE: Backend must run Yjs server on ws://localhost:1234
    const provider = new WebsocketProvider(
      'ws://localhost:1234',
      `doc-${documentId}`,
      ydoc
    );

    providerRef.current = provider;

    // Handle connection status
    provider.on('status', (event: any) => {
      console.log('Collaboration status:', event.status);
      setIsConnected(event.status === 'connected');
    });

    // Broadcast awareness (who's editing)
    const awareness = provider.awareness;
    awareness.setLocalState({
      user: {
        name: userName,
        color: userColor,
      },
      cursor: {
        anchor: null,
        head: null,
      },
    });

    // Listen for remote changes
    ytext.observe((event: any) => {
      console.log('Remote change detected:', event);
    });

    return () => {
      provider.disconnect();
      ydoc.destroy();
    };
  }, [documentId, userName, userColor]);

  return {
    ydoc: ydocRef.current,
    provider: providerRef.current,
    isConnected,
    getSharedText: () => ydocRef.current?.getText('shared-content'),
  };
};
```

### Step 3: Update TiptapEditor to Use Yjs

Modify `src/components/TiptapEditor.tsx`:

```typescript
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import { useDocumentSync } from '../hooks/useDocumentSync';

interface TiptapEditorProps {
  initialContent: string;
  onSave?: (content: string) => void;
  documentId: string;
  userName: string;
  userColor?: string;
  editable?: boolean;
}

export const TiptapEditor: React.FC<TiptapEditorProps> = ({
  initialContent,
  onSave,
  documentId,
  userName,
  userColor = '#' + Math.floor(Math.random() * 16777215).toString(16),
  editable = true,
}) => {
  const { ydoc, isConnected } = useDocumentSync({
    documentId,
    userName,
    userColor,
  });

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: false, // Yjs manages history
      }),
      // Real-time collaboration
      Collaboration.configure({
        document: ydoc,
      }),
      // Show other users' cursors
      CollaborationCursor.configure({
        provider: window.provider, // Set globally
        user: {
          name: userName,
          color: userColor,
        },
      }),
    ],
    content: initialContent,
    editable,
    onUpdate: ({ editor }) => {
      if (onSave) {
        const html = editor.getHTML();
        onSave(html);
      }
    },
  });

  return (
    <div>
      {!isConnected && (
        <div style={{ padding: '10px', backgroundColor: '#fff3cd', color: '#856404' }}>
          🔄 Connecting to collaboration server...
        </div>
      )}
      <EditorContent editor={editor} />
    </div>
  );
};
```

### Step 4: Update EditorPage

```typescript
useEffect(() => {
  // Emit to server that user joined
  if (socket) {
    socket.emit('document:join', {
      documentId: id,
      userName: user?.name || 'Anonymous',
    });

    return () => {
      socket.emit('document:leave', { documentId: id });
    };
  }
}, [socket, id, user]);
```

---

## How to Test Real-Time Collaboration

### Setup for Testing
1. **Open document in 2 browser windows** (or 2 users/devices)
2. **Go to same editor page** with same document ID
3. **Enable developer console** to see sync messages

### Test Steps
```
Window 1                           Window 2
   |                                  |
1. "Open /editor/abc123"       "Open /editor/abc123"
   |-- See "Active Users: 2"    |-- See "Active Users: 2"
   |                            |
2. Type "Hello"                 See "Hello" appear instantly
   |<-- Change syncs -->|       |
   |                            |
3. Select & bold text           See bold applied instantly
   |<-- Formatting syncs -->|   |
   |                            |
4. Go away, come back           Document restored from Yjs
   |<-- History preserved -->|  |
```

---

## Troubleshooting Collaboration

### Issue: "Active Users Panel shows users but edits don't sync"
**Cause:** Yjs server not running  
**Solution:** Start Yjs WebSocket server on `ws://localhost:1234`

### Issue: "Changes only appear after refresh"
**Cause:** Yjs not integrated into TiptapEditor  
**Solution:** Follow Step 3 above to add Collaboration extensions

### Issue: "Can't see other users' cursors"
**Cause:** CollaborationCursor extension not configured  
**Solution:** Add both Collaboration and CollaborationCursor extensions

### Issue: "Getting sync conflicts"
**Cause:** Yjs designed to handle this - it's a feature, not a bug!  
**Solution:** Trust CRDT algorithm - edits will merge correctly

---

## Alternative: Socket.io Approach (Simpler but Less Robust)

If you want simpler real-time sync without Yjs:

### Backend Emits
```typescript
// When user sends update
socket.on('document:update', (data) => {
  // Broadcast to all users viewing this doc
  io.to(`doc-${data.documentId}`).emit('document:changed', {
    content: data.content,
    updatedBy: data.userId,
    timestamp: Date.now(),
  });
});
```

### Frontend Listens
```typescript
useEffect(() => {
  if (!socket) return;

  socket.on('document:changed', (data) => {
    // Update local state with remote changes
    setDocument(prev => ({
      ...prev,
      content: data.content,
    }));
  });

  return () => socket.off('document:changed');
}, [socket]);
```

**Pros:** Simple, no complex CRDT  
**Cons:** Can lose edits if users edit simultaneously, no automatic conflict resolution

---

## Architecture Comparison

| Feature | Yjs (CRDT) | Socket.io (OT) | Current |
|---------|-----------|---------------|---------|
| **Live Sync** | ✅ Yes | ✅ Yes | ❌ No |
| **Conflict Resolution** | ✅ Automatic | ✅ Server decides | ❌ Last write wins |
| **Offline Support** | ✅ Works | ❌ No | ❌ No |
| **Cursor Sharing** | ✅ Yes | ❌ No | ❌ No |
| **Complexity** | Medium | Low | Very Low |
| **Backend Required** | Yjs server | Socket.io | Node.js REST API |

---

## Quick Start: Enable Basic Live Collaboration

### 1. Start Yjs Server (Backend)

```bash
# Install globally or in backend
npm install -g yjs-server

# Or run this Node.js server
npx degit yjs/yjs-server yjs-server && cd yjs-server && npm install && npm start
```

### 2. Update Environment Variables

```bash
# Create .env.local in frontend
VITE_COLLAB_SERVER=ws://localhost:1234
```

### 3. Test in Browser

```bash
# Terminal 1: Start Yjs server
npx y-websocket-server

# Terminal 2: Start frontend
npm run dev

# Open http://localhost:5173
# Open same doc in 2 browser windows
# Type in one window, see changes in other instantly!
```

---

## Production Deployment

### Using Hocuspocus (Recommended)
Professional Yjs server with authentication, persistence, awareness:

```bash
npm install -D @hocuspocus/server
npm install @hocuspocus/provider
```

```typescript
// Backend: hocuspocus.config.ts
import { Server } from '@hocuspocus/server';

const server = Server.create({
  port: 1234,
  providers: [
    new RocksDB({
      path: './data',
    }),
  ],
});

server.listen();
```

---

## Summary: Getting Real-Time Collaboration

### Right Now
You have: ✅ Presence awareness, ✅ Comments, ✅ Notifications  
You're missing: ❌ Live content sync, ❌ Cursor sharing

### To Add Live Collaboration
**Best Option:** Implement Yjs (follow Steps 1-4 above)
- Start: `npm install yjs y-websocket`
- Setup: Create WebSocket provider in hook
- Integrate: Add Collaboration extensions to Tiptap
- Test: Open doc in 2 windows

**Time Required:** ~2-3 hours for full setup

### Without Backend Changes
If you can't set up Yjs server, you can still have:
- Presence indicators (already done!)
- Threaded comments (already done!)
- Share notifications (already done!)
- Just refresh page to see others' changes

---

## Next Level Features

Once basic collaboration works:
- 🎨 See other users' cursor colors in real-time
- 👀 Show "User is typing..." indicators
- 📍 Track cursor position not just presence
- 💬 Mention notifications
- 🔄 Show edit history
- ⏱️ Track who made which changes

---

## Questions?

- **Q: Will edits conflict if two users edit same line?**
  - A: No! Yjs CRDT automatically merges any order of edits

- **Q: What if internet drops mid-edit?**
  - A: Yjs queues changes and syncs when reconnected

- **Q: Can I use this without Yjs?**
  - A: Yes, but you need simpler OT (Operational Transform) approach

- **Q: How many users can edit same doc?**
  - A: Unlimited! Yjs scales to thousands

