# 🤝 Real-Time Collaboration Platform — Collaboration Specification

## Project Overview

This is a **real-time document collaboration platform** with multi-user editing, comments, sharing, and notifications. It's built with:

- **Backend:** Node.js + Express + TypeScript + MongoDB + Socket.io
- **Frontend:** React + TypeScript + Material-UI (MUI)
- **Architecture:** Monorepo (packages/backend, packages/frontend)

---

## ✅ Collaboration Features (Currently Implemented)

### 1. **Document Sharing with Role-Based Access** ✅
- **Status:** Production-ready
- **Roles:**
  - `owner` → Full edit, share, delete access
  - `editor` → Edit documents, cannot share/delete
  - `commenter` → Comment-only, cannot edit
  - `viewer` → Read-only access
- **Files:**
  - Backend: `src/controllers/document.controller.ts`
  - Frontend: Share modal in `EditorPage.tsx`
- **Endpoint:** `PUT /api/documents/{id}/share`

### 2. **Threaded Comments with @Mentions** ✅
- **Status:** Production-ready
- **Features:**
  - Comments on documents
  - Threaded replies (nested comments)
  - Mark comments as resolved
  - Delete comments (by author)
- **Files:**
  - Backend: `src/services/comment.service.ts`, `src/controllers/comment.controller.ts`
  - Frontend: `src/components/CommentSection.tsx`, `src/components/CommentsPanel.tsx`
- **Socket Events:** `new-comment`, `comment-added`, `comment-resolved`

### 3. **Notifications** ✅
- **Status:** Production-ready
- **Triggers:**
  - Document shared with user
  - Comment added to shared document
  - User mentioned in comments
  - Comment replied to
- **Files:**
  - Backend: `src/services/notification.service.ts`, `src/services/email.service.ts`
  - Frontend: `src/contexts/NotificationContext.tsx`, `src/pages/NotificationsPage.tsx`
- **Email Integration:** Optional (requires EMAIL_USER, EMAIL_PASSWORD env vars)

### 4. **Active Users / Presence Awareness** ✅
- **Status:** Production-ready
- **Features:**
  - See who's currently viewing/editing
  - Color-coded user indicators
  - Last activity timestamp
  - Real-time updates via Socket.io
- **Files:**
  - Backend: `src/socket/index.ts` (handles `user:online`, `user:offline` events)
  - Frontend: Active users panel in sidebar

### 5. **Auto-Save** ✅
- **Status:** Production-ready
- **Features:**
  - Debounced save (2 seconds)
  - Changes persist through refresh
  - "Saving..." indicator
- **Files:**
  - Frontend: `EditorPage.tsx` (uses `debounce` utility)
  - Backend: `PUT /api/documents/{id}`

### 6. **Real-Time Sync (via Socket.io)** ✅
- **Status:** Partial (event-driven, not live CRDT-based)
- **Current:** Comments, notifications, presence sync instantly
- **Limitation:** Document content edits require refresh
- **Files:**
  - Backend: `src/socket/index.ts`
  - Frontend: `src/contexts/SocketContext.tsx`

---

## 📁 Project Structure

```
realtime-collab-platform/
├── packages/
│   ├── backend/
│   │   └── src/
│   │       ├── config/          # DB, env config
│   │       ├── controllers/     # Route handlers
│   │       ├── middleware/      # Auth, errors, rate limiting
│   │       ├── models/          # MongoDB schemas
│   │       ├── routes/          # Express routes
│   │       ├── services/        # Business logic (comment, notification, email)
│   │       ├── socket/          # Socket.io event handlers
│   │       ├── types/           # TypeScript interfaces
│   │       ├── utils/           # Helpers (email, JWT, etc.)
│   │       └── index.ts         # Entry point
│   │
│   └── frontend/
│       └── src/
│           ├── components/      # Reusable UI (Comments, Editor, etc.)
│           ├── contexts/        # React contexts (Auth, Socket, Notification)
│           ├── pages/           # Full pages (Dashboard, Editor, etc.)
│           ├── services/        # API calls, utilities
│           ├── types/           # TypeScript interfaces
│           └── App.tsx          # Root component
│
├── COLLABORATION_*.md           # Feature documentation
├── REALTIME_IMPLEMENTATION_GUIDE.md
└── CLAUDE.md                    # This file
```

---

## 🔑 Key Collaboration APIs

### Backend Endpoints

**Comments:**
```
POST   /api/documents/{id}/comments          # Add comment
GET    /api/documents/{id}/comments          # Get all comments
PUT    /api/comments/{id}/resolve            # Mark resolved
DELETE /api/comments/{id}                    # Delete comment
```

**Sharing:**
```
PUT /api/documents/{id}/share                # Share document
PUT /api/documents/{id}/revoke-access        # Remove access
GET /api/documents/{id}/shared-with          # List collaborators
```

**Notifications:**
```
GET  /api/notifications                      # Get user's notifications
PUT  /api/notifications/{id}/read            # Mark as read
DELETE /api/notifications/{id}               # Delete notification
```

### Socket.io Events

**Comments:**
- `new-comment` → Server processes and broadcasts
- `comment-added` → Broadcast to all document users
- `comment-resolved` → Broadcast resolved state

**Presence:**
- `user:online` → Broadcast when user joins
- `user:offline` → Broadcast when user leaves
- `active-users` → Fetch current active users

**Notifications:**
- `notification:new` → Push to specific user's socket

---

## 🧪 How to Test Collaboration Features

### 1. Test Sharing & Permissions
```bash
# As User A:
1. Create document
2. Share with User B (role: "editor")
3. Get notification: User B joins

# As User B:
4. Open shared document
5. Edit content → Should be allowed
6. Click Share button → Should be disabled (not owner)
7. Try to delete → Should be disabled

# Back to User A:
8. Change User B's role to "viewer"
9. As User B: Refresh → Editor disabled, see read-only banner
```

### 2. Test Comments
```bash
# As User A:
1. Open document
2. Click Comments tab
3. Type: "@User B please review"
4. User B gets notification: "@mentioned"

# As User B:
5. Opens notification → Goes to document
6. Sees comment with @mention
7. Clicks Reply → Types response
8. Submits

# As User A:
9. Gets notification: "replied to your comment"
10. Sees threaded reply in Comments panel
```

### 3. Test Active Users
```bash
1. Open document in Tab A (logged in as User A)
2. Open same document in Tab B (logged in as User B)
3. Tab A: Sidebar → Active Users
   Should see:
   - ✓ You (marked as "You")
   - ✓ User B (with color, timestamp)
4. Tab B: Make edits → Tab A shows updated timestamp
5. Tab B: Close browser tab → Tab A's active users list updates
```

### 4. Test Notifications
```bash
1. User A shares document with User B
2. User B gets notification immediately (Bell icon)
3. Click notification → Navigate to document
4. Mark as read → Unread count decreases
5. Archive notification → Moves to archived
```

---

## 🔧 Development Guidelines

### When Adding/Modifying Collaboration Features

1. **Backend Changes**
   - Update model in `src/models/`
   - Add service logic in `src/services/`
   - Add controller handler in `src/controllers/`
   - Add/update route in `src/routes/`
   - If real-time: Add Socket.io event in `src/socket/index.ts`

2. **Frontend Changes**
   - Update context in `src/contexts/` if needed
   - Create/update component in `src/components/`
   - Integrate into page (`src/pages/`)
   - Use Socket.io events via `useSocket()` hook

3. **Testing Requirements**
   - Test with multiple users (2+ browser tabs/browsers)
   - Verify Socket.io events fire correctly
   - Check database updates persist
   - Validate permissions are enforced

4. **Common Patterns**

   **Fetch data:**
   ```typescript
   // Frontend
   const [data, setData] = useState([]);
   useEffect(() => {
     axios.get(`/api/endpoint`, { headers: { Authorization: `Bearer ${token}` } })
       .then(res => setData(res.data.data))
       .catch(err => console.error(err));
   }, [dependency]);
   ```

   **Real-time update via Socket:**
   ```typescript
   // Listen for events
   useEffect(() => {
     socket?.on('event-name', (data) => {
       setData(prev => [...prev, data]);
     });
     return () => socket?.off('event-name');
   }, [socket]);

   // Emit event
   socket?.emit('event-name', { payload });
   ```

   **Backend Socket handler:**
   ```typescript
   // src/socket/index.ts
   socket.on('event-name', async (data) => {
     // Process data
     io.emit('event-response', result); // Broadcast
   });
   ```

---

## 🚀 Next Phase: Full Real-Time Editing (Yjs)

**Currently:** Comments/presence sync in real-time, but document content requires refresh.

**Goal:** Enable true collaborative editing (like Google Docs) using **Yjs** CRDT.

**Setup steps** (in `LIVE_COLLAB_IMPLEMENTATION.md`):
1. Install: `yjs`, `y-websocket`, `@tiptap/extension-collaboration`
2. Create CollaborationContext with Y.Doc
3. Wrap TiptapEditor with Collaboration extensions
4. Run `y-websocket-server`

**After setup:**
- ✅ Type in one browser → see instantly in other
- ✅ No refresh needed
- ✅ Multi-cursor support
- ✅ Automatic conflict resolution

---

## 📝 Environment Variables

Create `.env` files for both packages:

**Backend** (`packages/backend/.env`):
```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/collab-db
JWT_SECRET=your-secret-key
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
CORS_ORIGIN=http://localhost:5173
```

**Frontend** (`packages/frontend/.env`):
```
VITE_API_URL=http://localhost:5000
```

**Important:** Email vars are optional—notifications work without them.

---

## ⚠️ Known Limitations

1. **Document Content Sync** — Edits require page refresh (waiting for Yjs setup)
2. **@Mentions** — Currently text-based, not linked to user profiles
3. **Offline Mode** — Not supported; requires active connection
4. **Conflict Resolution** — Manual (no automatic merge); first-save wins

---

## ✨ Quality Standards

- ✅ **Type Safety:** Strict TypeScript, interfaces for all data
- ✅ **Error Handling:** Try-catch with user-friendly messages
- ✅ **Permissions:** Role-based access enforced server-side
- ✅ **Rate Limiting:** 100 req/15min global, 5 attempts/15min auth
- ✅ **Real-Time Updates:** Socket.io for presence, comments, notifications
- ✅ **Code Organization:** Clear separation of concerns (models, services, controllers)

---

## 🆘 Troubleshooting

### Socket.io Not Connecting
- Check backend is running: `http://localhost:5000`
- Check CORS config in `packages/backend/src/index.ts`
- Check browser console for WebSocket errors

### Comments Not Appearing
- Verify Socket.io connection (see above)
- Check backend logs for errors
- Hard refresh browser (Ctrl+Shift+R)

### Notifications Not Sending
- Check if EMAIL_USER/PASSWORD are set
- Look at backend logs for email errors
- Email service gracefully handles missing config (logs warning)

### Permission Not Enforced
- Verify document.sharedWith is updated in DB
- Check `EditorPage.tsx` reads correct permission
- Ensure JWT token is valid and sent in requests

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `COLLABORATION_SUMMARY.md` | Overview of all 5 features |
| `COLLABORATION_USER_GUIDE.md` | How to use each feature |
| `COLLABORATION_SETUP.md` | Setup instructions |
| `REALTIME_IMPLEMENTATION_GUIDE.md` | Technical deep-dive |
| `LIVE_COLLAB_IMPLEMENTATION.md` | How to enable Yjs |
| `CLAUDE.md` | This collaboration spec |

---

## 🎯 Collaboration Philosophy

This platform prioritizes:
1. **User Experience** — Smooth, intuitive collaboration
2. **Real-Time Feedback** — See changes, comments, presence instantly
3. **Permission Safety** — Server-side enforcement, no client-side bypasses
4. **Developer Simplicity** — Clear patterns, well-organized code

---

**Last Updated:** April 26, 2026
**Status:** ✅ Production-Ready (Core Features) | ⏳ Yjs Phase (Next)
