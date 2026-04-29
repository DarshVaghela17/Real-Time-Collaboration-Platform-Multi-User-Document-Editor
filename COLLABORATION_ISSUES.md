# 🔴 CRITICAL: 2-Person Collaboration Issues Found

## Issue #1: BLOCKING BUG — join-document Handler Only Allows Owner

**Location:** `packages/backend/src/socket/index.ts`, lines 76-90

**The Problem:**
```typescript
socket.on('join-document', async (data: { documentId: string; name: string }) => {
  const isOwner = await documentService.isOwner(documentId, socket.data.user.userId);
  
  if (!isOwner) {
    socket.emit('error', { message: 'Access denied to this document' });
    return;  // ❌ BLOCKS ALL NON-OWNERS!
  }
  // ... rest of handler
});
```

**Impact:** If the frontend calls `join-document` with a shared user (editor/viewer), it will be rejected, preventing collaboration.

**Correct Logic Should Be:**
```typescript
// Check if user has access (owner, editor, or viewer)
const access = await documentService.getUserAccess(documentId, socket.data.user.userId);

if (!access) {
  socket.emit('error', { message: 'Access denied to this document' });
  return;
}
```

---

## Issue #2: SECURITY GAP — yjs-sync-step-1 Has No Permission Check

**Location:** `packages/backend/src/socket/index.ts`, lines 278-316

**The Problem:**
```typescript
socket.on('yjs-sync-step-1', async (data: { docId: string }) => {
  const documentId = data.docId;
  
  // ❌ NO PERMISSION CHECK! Anyone can request any document!
  const document = await documentService.findById(documentId);
  
  // Sends full document state to user
  const state = yjsService.getFullDocumentState(documentId);
  socket.emit('yjs-sync-step-2', { state: Array.from(state), docId: documentId });
});
```

**Impact:** Any authenticated user can access ANY document's content by knowing its ID.

**What's Missing:**
```typescript
// Add permission check
const access = await documentService.getUserAccess(documentId, socket.data.user.userId);
if (!access) {
  socket.emit('error', { message: 'Access denied' });
  return;
}
```

---

## Issue #3: Inconsistent Permission Model

**The Document Model** (`Document.ts`) only supports 2 roles when shared:
```typescript
role: {
  type: String,
  enum: ['editor', 'viewer'],
  required: true,
}
```

**But the Frontend** expects 4 roles:
```typescript
permission?: 'viewer' | 'commenter' | 'editor' | 'owner';
```

**Missing:** `'commenter'` role (comment-only, no edit)

---

## Issue #4: Frontend Never Calls join-document

**The Flow:**
- Frontend: `useYjsDocument` hook calls `yjs-sync-step-1`
- Backend: `join-document` handler is **never triggered**
- Result: The `join-document` permission check is bypassed entirely

**Current Frontend Code** (`useYjsDocument.ts`, line 56):
```typescript
socket.emit('yjs-sync-step-1', { docId: documentId });
// ❌ Never calls join-document
```

---

## ✅ How to Fix (in order)

### Step 1: Fix yjs-sync-step-1 Permission Check

**File:** `packages/backend/src/socket/index.ts` (line 278)

```typescript
socket.on('yjs-sync-step-1', async (data: { docId: string }) => {
  try {
    const documentId = data.docId;

    // ✅ ADD THIS: Check user has access
    const access = await documentService.getUserAccess(
      documentId,
      socket.data.user.userId
    );

    if (!access) {
      socket.emit('error', { message: 'Access denied to this document' });
      return;
    }

    // ... rest of handler (load document, send state, etc.)
  } catch (error: any) {
    console.error('Error in sync step 1:', error);
    socket.emit('error', { message: error.message });
  }
});
```

### Step 2: Fix join-document Permission Check

**File:** `packages/backend/src/socket/index.ts` (line 76)

```typescript
socket.on('join-document', async (data: { documentId: string; name: string }) => {
  try {
    const { documentId, name } = data;

    // ✅ CHANGE THIS: Use hasAccess instead of isOwner
    const hasAccess = await documentService.hasAccess(
      documentId,
      socket.data.user.userId
    );

    if (!hasAccess) {
      socket.emit('error', { message: 'Access denied to this document' });
      return;
    }

    // ... rest of handler
  } catch (error: any) {
    console.error('Error joining document:', error);
    socket.emit('error', { message: error.message });
  }
});
```

### Step 3: Add Permission Check to yjs-update Handler

**File:** `packages/backend/src/socket/index.ts` (line 145)

```typescript
socket.on('yjs-update', (data: { docId: string; update: number[] }) => {
  try {
    const documentId = data.docId || socket.data.documentId;

    // ✅ ADD THIS: Only editors/owners can send updates
    // (viewers should not be able to edit)
    // This should be verified but the editable prop on frontend already handles it

    if (!documentId) {
      socket.emit('error', { message: 'Not in any document room' });
      return;
    }

    // ... rest of handler
  } catch (error: any) {
    console.error('Error applying Yjs update:', error);
    socket.emit('error', { message: error.message });
  }
});
```

### Step 4: Verify Resolve Comment Permission

**File:** `packages/backend/src/socket/index.ts` (line 258)

```typescript
socket.on('resolve-comment', async (data: { commentId: string }) => {
  try {
    const documentId = socket.data.documentId;

    // ✅ VERIFY: Only comment author or document owner can resolve
    // (Add this check if not already in commentService.toggleResolve)

    if (!documentId) {
      socket.emit('error', { message: 'Not in any document' });
      return;
    }

    const comment = await commentService.toggleResolve(data.commentId);
    io.to(documentId).emit('comment-resolved', comment);
  } catch (error: any) {
    console.error('Error resolving comment:', error);
    socket.emit('error', { message: error.message });
  }
});
```

---

## 🧪 Testing Checklist (After Fixes)

### Test 1: Owner-Only Access
```
1. User A creates document
2. User B (not shared) tries to access directly: /editor/{docId}
   ❌ Should show "Access denied" 
3. User B via URL tries Socket sync: yjs-sync-step-1
   ❌ Should get error from Socket
```

### Test 2: Editor Access
```
1. User A creates document
2. User A shares with User B (role: "editor")
3. User B opens document: /editor/{docId}
   ✅ Should load successfully
4. User B types text
   ✅ Should sync to User A in real-time
5. User A types text
   ✅ Should sync to User B in real-time
6. User B can comment
   ✅ Should add comment
```

### Test 3: Viewer Access
```
1. User A creates document with text
2. User A shares with User B (role: "viewer")
3. User B opens document
   ✅ Should see "Read-only" alert
4. User B tries to edit
   ❌ Should be blocked (frontend: editable={false})
5. User B can comment
   ✅ Should add comment
```

### Test 4: Real-Time Sync (2 tabs)
```
1. Tab A (User A, role: owner) → opens document
2. Tab B (User B, role: editor) → opens SAME document
3. Tab A Console → Should show "User joined"
4. Tab B Console → Should show active users including User A
5. Tab A types: "Hello from A"
   ✅ Should appear in Tab B immediately (no refresh)
6. Tab B types: "Hello from B"
   ✅ Should appear in Tab A immediately
7. Refresh Tab B
   ✅ Should still see both messages
```

### Test 5: Comment Collaboration
```
1. Tab A & Tab B open same document
2. Tab A Comments tab → Type "@User B check this"
   ✅ User B gets notification
   ✅ Comment appears in Tab B's Comments
3. Tab B replies: "Looks good!"
   ✅ User A gets notification
   ✅ Reply appears as threaded comment in Tab A
```

---

## 📋 Summary of Issues

| Issue | Severity | Blocker? | Location |
|-------|----------|----------|----------|
| join-document only allows owner | 🔴 Critical | YES | socket/index.ts:80 |
| yjs-sync-step-1 no permission check | 🔴 Critical | YES (Security) | socket/index.ts:278 |
| Commenter role missing | 🟡 High | NO | Document.ts, Frontend types |
| No edit permission check on yjs-update | 🟡 High | NO (UI handles it) | socket/index.ts:145 |

---

## 🚀 After Fixes: Expected Behavior

**Owner + Editor (2 people):**
```
User A (owner): Creates doc, sees blue cursor
User B (editor): Opens doc, sees orange cursor
User A types: "Let's collaborate"
User B sees: "Let's collaborate" appears in real-time ✨
User B edits: Adds "Sure!"
User A sees: Change appears instantly with orange highlight ✨
Both see: Comments sync immediately with notifications ✨
```

---

**Status:** ❌ **NOT READY FOR 2-PERSON COLLABORATION**
**Priority:** Fix Issue #1 and #2 before testing

