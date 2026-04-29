# Real-Time Collaboration Setup Guide

## What You Can Do Now

### 1. **Read-Only Mode** ✅ (Just Implemented)
Users with "Viewer" role:
- Cannot edit documents
- Can view content
- Can add comments
- See a read-only banner

### 2. **Real-Time Collaboration** (Using Yjs)

## How to Enable Real-Time Collaboration

### Step 1: Check Backend Socket.io Setup
Your backend needs to have Socket.io configured for real-time updates. Verify in `packages/backend/src/index.ts`:

```typescript
// Check these are enabled:
import { Server } from 'socket.io';
const io = new Server(app, { cors: { origin: '*' } });

io.on('connection', (socket) => {
  socket.on('document:update', (data) => {
    // Broadcast to other users
    socket.broadcast.emit('document:changed', data);
  });
});
```

### Step 2: Frontend - Create Yjs Context

Create new file: `src/contexts/CollaborationContext.tsx`

```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

interface CollaborationContextType {
  ydoc: Y.Doc | null;
  ytext: Y.Text | null;
  awareness: any;
  isConnected: boolean;
}

const CollaborationContext = createContext<CollaborationContextType | undefined>(undefined);

export const CollaborationProvider: React.FC<{ 
  children: React.ReactNode;
  documentId: string;
}> = ({ children, documentId }) => {
  const [ydoc, setYdoc] = useState<Y.Doc | null>(null);
  const [ytext, setYtext] = useState<Y.Text | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const doc = new Y.Doc();
    const text = doc.getText('shared');

    // Connect to backend WebSocket
    const provider = new WebsocketProvider(
      'ws://localhost:5000',
      `doc-${documentId}`,
      doc
    );

    provider.on('status', (event: any) => {
      setIsConnected(event.status === 'connected');
      console.log('Collaboration status:', event.status);
    });

    setYdoc(doc);
    setYtext(text);

    return () => {
      provider.disconnect();
      doc.destroy();
    };
  }, [documentId]);

  return (
    <CollaborationContext.Provider value={{ ydoc, ytext, awareness: null, isConnected }}>
      {children}
    </CollaborationContext.Provider>
  );
};

export const useCollaboration = () => {
  const context = useContext(CollaborationContext);
  if (!context) {
    throw new Error('useCollaboration must be used within CollaborationProvider');
  }
  return context;
};
```

### Step 3: Update TiptapEditor for Collaboration

```typescript
import { Collaboration } from '@tiptap/extension-collaboration';
import { CollaborationCursor } from '@tiptap/extension-collaboration-cursor';

const editor = useEditor({
  extensions: [
    StarterKit,
    Collaboration.configure({
      document: ydoc,
    }),
    CollaborationCursor.configure({
      provider,
      user: {
        name: userName,
        color: '#' + Math.floor(Math.random()*16777215).toString(16),
      },
    }),
  ],
});
```

### Step 4: Install Required Packages

```bash
cd packages/frontend
pnpm add yjs y-websocket @tiptap/extension-collaboration @tiptap/extension-collaboration-cursor
```

### Step 5: Wrap EditorPage with CollaborationProvider

```typescript
<CollaborationProvider documentId={id}>
  <TiptapEditor ... />
</CollaborationProvider>
```

---

## Features After Setup

### Real-Time Editing
- ✅ Multiple users edit simultaneously
- ✅ Changes sync instantly
- ✅ Conflict resolution automatic (CRDT)

### Presence Awareness
- ✅ See other users' cursors
- ✅ See who's typing
- ✅ User colors for identification

### Auto-Save
- ✅ Already implemented (2-second debounce)
- ✅ Works with real-time sync

---

## Permission Levels

| Role | Can Edit | Can Comment | Can Share | Can Delete |
|------|----------|-------------|-----------|-----------|
| Owner | ✅ | ✅ | ✅ | ✅ |
| Editor | ✅ | ✅ | ❌ | ❌ |
| Commenter | ❌ | ✅ | ❌ | ❌ |
| Viewer | ❌ | ❌ | ❌ | ❌ |

---

## Testing Collaboration

### Test 1: Multiple Users
1. Open editor in 2 browser tabs
2. Login with different users
3. Open same document
4. Type in one tab → see changes in other tab

### Test 2: Cursor Position
1. Click in editor on Tab 1
2. Look at Tab 2 → see cursor position from Tab 1

### Test 3: Read-Only Mode
1. Share document with "Viewer" role
2. Login as viewer
3. Try to edit → should be disabled
4. Check comments work → should work

---

## Troubleshooting

### Issue: Real-time sync not working
**Solution:**
1. Check backend is running
2. Check WebSocket connection: `ws://localhost:5000`
3. Check browser console for errors
4. Check backend logs

### Issue: Seeing other user's edits but not your own
**Solution:**
1. Check `editable` prop is true
2. Check editor state is updating
3. Check localStorage token is valid

### Issue: Read-only mode not working
**Solution:**
1. Check `ownerId` field in document response
2. Check permission is being set correctly
3. Check `isReadOnly` state in EditorPage

---

## What's Ready Now

✅ Read-only permissions implemented  
✅ TiptapEditor with toolbar  
✅ Comments system  
✅ Document sharing with roles  
✅ Version history  

## What Needs Setup

⏳ Yjs integration  
⏳ WebSocket provider  
⏳ Multi-cursor support  
⏳ Presence awareness  

---

## Quick Commands

```bash
# Install collaboration packages
pnpm add yjs y-websocket @tiptap/extension-collaboration @tiptap/extension-collaboration-cursor

# Check backend WebSocket
curl -i http://localhost:5000

# Test editor
1. Login
2. Create document
3. Try editing (should work)
4. Try commenting (should work)
```

---

## Next Steps

1. **Set up Yjs** if you want real-time collaboration
2. **Test read-only** by sharing with different roles
3. **Configure WebSocket** on backend
4. **Add presence** for multi-user cursors

Want me to implement the Yjs collaboration? Just ask! 🚀
