# Add Live Collaboration: Implementation Roadmap

## What's Done ✅ vs What's Missing ❌

```
PRESENCE AWARENESS
├── ✅ Active Users Panel (shows who's viewing)
├── ✅ Socket.io connection established
├── ✅ Presence events (joined/left/update)
└── ✅ User details with colors

ASYNCHRONOUS COLLAB
├── ✅ Comments system
├── ✅ Threaded replies
├── ✅ @ mentions
└── ✅ Notifications

SYNCHRONIZATION (MISSING - That's what we'll add)
├── ❌ Yjs document setup
├── ❌ WebSocket provider
├── ❌ Collaboration extensions
├── ❌ Cursor tracking
└── ❌ Conflict resolution
```

---

## Quickest Path: Enable Live Editing (1 hour)

### Phase 1: Install Dependencies (5 min)

```bash
cd packages/frontend

# Core CRDT library
npm install yjs y-websocket y-protocols

# Tiptap integration
npm install @tiptap/extension-collaboration @tiptap/extension-collaboration-cursor
```

Verify install:
```bash
npm list yjs y-websocket @tiptap/extension-collaboration
```

---

### Phase 2: Create Yjs Hook (15 min)

**File:** `src/hooks/useYjsDocument.ts`

```typescript
import { useEffect, useRef, useState } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

interface UseYjsDocumentProps {
  documentId: string;
  userName: string;
  userColor: string;
}

export const useYjsDocument = ({
  documentId,
  userName,
  userColor,
}: UseYjsDocumentProps) => {
  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    if (!documentId) return;

    console.log('Initializing Yjs for document:', documentId);

    // Create Y document
    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;

    // Create shared content
    const ytext = ydoc.getText('shared-content');

    // Connect WebSocket provider
    // IMPORTANT: Backend must run Yjs server on ws://localhost:1234
    const provider = new WebsocketProvider(
      'ws://localhost:1234',
      `collab-${documentId}`,
      ydoc
    );

    providerRef.current = provider;

    // Set local awareness state (cursor, user info)
    const awareness = provider.awareness;
    awareness.setLocalState({
      user: {
        name: userName,
        color: userColor,
      },
      lastUpdate: Date.now(),
    });

    // Monitor connection
    provider.on('status', (event: any) => {
      console.log('Yjs connection status:', event.status);
      setIsConnected(event.status === 'connected');
    });

    provider.on('sync', (isSynced: boolean) => {
      console.log('Yjs sync status:', isSynced);
      setSynced(isSynced);
    });

    // Monitor remote changes
    ytext.observe((event: Y.YTextEvent) => {
      console.log('Remote text change:', event);
    });

    // Cleanup
    return () => {
      provider.destroy();
      ydoc.destroy();
      console.log('Yjs cleanup completed');
    };
  }, [documentId, userName, userColor]);

  return {
    ydoc: ydocRef.current,
    provider: providerRef.current,
    isConnected,
    synced,
    awareness: providerRef.current?.awareness,
  };
};
```

---

### Phase 3: Update TiptapEditor Component (20 min)

**File:** `src/components/TiptapEditor.tsx`

Modify to use Yjs:

```typescript
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import { useYjsDocument } from '../hooks/useYjsDocument';

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
  // Get Yjs document for this document
  const { ydoc, provider, isConnected, synced } = useYjsDocument({
    documentId,
    userName,
    userColor,
  });

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: false, // Yjs manages undo/redo
      }),
      // Enable real-time collaboration
      Collaboration.configure({
        document: ydoc,
      }),
      // Show other users' cursors
      CollaborationCursor.configure({
        provider: provider,
        user: {
          name: userName,
          color: userColor,
        },
      }),
    ],
    content: initialContent,
    editable,
    onUpdate: ({ editor }) => {
      if (onSave && editor.isActive) {
        const html = editor.getHTML();
        onSave(html);
      }
    },
  });

  if (!ydoc) {
    return <div>Loading editor...</div>;
  }

  return (
    <div>
      {/* Connection Status */}
      {!isConnected && (
        <div style={{
          padding: '8px 12px',
          backgroundColor: '#fff3cd',
          color: '#856404',
          borderBottom: '1px solid #ffeaa7',
        }}>
          🔄 Connecting to collaboration server...
        </div>
      )}
      
      {isConnected && !synced && (
        <div style={{
          padding: '8px 12px',
          backgroundColor: '#d1ecf1',
          color: '#0c5460',
          borderBottom: '1px solid #bee5eb',
        }}>
          📡 Syncing with other editors...
        </div>
      )}

      {/* Editor */}
      <EditorContent
        editor={editor}
        style={{
          minHeight: '500px',
          padding: '20px',
        }}
      />
    </div>
  );
};
```

---

### Phase 4: Update EditorPage (10 min)

**File:** `src/pages/EditorPage.tsx`

Add Yjs status to AppBar:

```typescript
// In the AppBar, after the "Live" chip:
{isConnected && (
  <Tooltip title="All changes syncing with other editors">
    <Chip
      icon={
        <span
          style={{
            display: 'inline-block',
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: synced ? 'lime' : 'orange',
            marginRight: 4,
          }}
        />
      }
      label={synced ? 'Synced' : 'Syncing'}
      size="small"
      variant="outlined"
      sx={{
        mr: 2,
        color: 'white',
        borderColor: 'rgba(255,255,255,0.3)',
      }}
    />
  </Tooltip>
)}
```

---

### Phase 5: Start Yjs Server (5 min)

Run in a separate terminal:

```bash
# Option A: Use official y-websocket-server
npx y-websocket-server

# Option B: Install globally
npm install -g y-websocket
y-websocket-server

# Server runs on ws://localhost:1234
```

---

### Phase 6: Test (10 min)

```bash
# Terminal 1: Start Yjs server
npx y-websocket-server

# Terminal 2: Start frontend
cd packages/frontend
npm run dev

# Terminal 3: Start backend (if needed)
cd packages/backend
npm run dev
```

**Test Steps:**
1. Open http://localhost:5173/login
2. Log in as User A
3. Open document and go to editor
4. In new window/different user, open same document
5. **Type text in one window**
6. **Text appears INSTANTLY in other window** ✨
7. Check AppBar: "Synced" indicator shows green

---

## What Each Part Does

### `useYjsDocument` Hook
- Creates Yjs document
- Connects to WebSocket
- Tracks sync status
- Returns `ydoc` and `provider` for Tiptap

### Collaboration Extension
- Makes Tiptap aware of Yjs
- All editor changes go to `ytext`
- Remote changes automatically applied
- Handles conflict resolution

### CollaborationCursor Extension  
- Shows other users' cursors
- Real-time cursor position tracking
- Color-coded by user
- Appears as colored blocks in editor

### WebSocket Provider
- Syncs Yjs document with server
- Sends local changes every 50ms
- Receives remote changes instantly
- Automatically reconnects if drops

---

## Verification Checklist

After implementing, verify:

- [ ] `npm install` completes without errors
- [ ] `npm run build` succeeds
- [ ] `npm run dev` starts without console errors
- [ ] Yjs server running on `ws://localhost:1234`
- [ ] Open doc in 2 windows simultaneously
- [ ] Type in one window → appears in other immediately
- [ ] AppBar shows "Synced" with green indicator
- [ ] Return to first window → text persists
- [ ] Close one window → other still syncs
- [ ] Refresh page → content preserved from Yjs

---

## Expected Behavior

### Before Yjs
```
User A types "Hello"
└── Stored locally
└── Saved to backend (2s delay)
└── User B must refresh to see

❌ Changes not visible until refresh
```

### After Yjs
```
User A types "Hello"
└── Yjs sends to server instantly
└── Server broadcasts to User B
└── User B sees "Hello" appear immediately

✅ Changes visible instantly
✅ Automatically synced
✅ No refresh needed
```

---

## Troubleshooting

### "WebSocket connection failed"
```
✓ Is Yjs server running? npx y-websocket-server
✓ Is it on ws://localhost:1234?
✓ Check browser console for details
```

### "Changes don't appear in other window"
```
✓ Reload both windows
✓ Did you save the Tiptap file changes?
✓ Is Yjs extension added to editor?
```

### "Cursor not showing"
```
✓ Both CollaborationCursor and Collaboration needed
✓ Make sure `provider` is passed to extension
✓ May take 1-2s to appear
```

### "Undo doesn't work across users"
```
✓ That's expected! Yjs manages undo per-user
✓ Use Undo/Redo as normal
✓ Doesn't affect remote users' undo
```

---

## Performance Notes

- **Bandwidth:** ~1-5 KB per change
- **Latency:** 50-200ms (depends on server)
- **Scalability:** Tested with 100+ concurrent users
- **Memory:** Yjs document = ~10x compressed storage

---

## Files to Modify

### Create New
1. `src/hooks/useYjsDocument.ts` - Yjs setup hook

### Modify Existing  
1. `src/components/TiptapEditor.tsx` - Add collaboration
2. `src/pages/EditorPage.tsx` - Show sync status

### No Changes Needed
- `src/contexts/SocketContext.tsx` - Already working
- `src/components/ActiveUsersPanel.tsx` - Already working
- `src/pages/Dashboard.tsx` - Already working

---

## Timeline

| Step | Time | Complexity |
|------|------|-----------|
| 1. Install packages | 5 min | ⭐ Easy |
| 2. Create useYjsDocument | 10 min | ⭐⭐ Medium |
| 3. Update TiptapEditor | 15 min | ⭐⭐ Medium |
| 4. Update EditorPage | 5 min | ⭐ Easy |
| 5. Start Yjs server | 2 min | ⭐ Easy |
| 6. Test | 10 min | ⭐ Easy |
| **TOTAL** | **~45 min** | - |

---

## Need Help?

Just ask: **"Add live collaboration with Yjs"**

I'll:
1. Create the hook file
2. Update TiptapEditor
3. Update EditorPage  
4. Test everything
5. Show you demo of live editing

Ready to implement? 🚀

