# Real-Time Collaboration Platform - Frontend

A production-ready React + TypeScript frontend for a real-time collaborative document editor, built with Material-UI, Tiptap, and Socket.io.

## Features

✨ **Core Features Implemented:**
- 🔐 User Authentication (Login/Register with JWT)
- 📝 Document Management (Create, Read, Update, Delete)
- ✏️ Rich Text Editor (Tiptap with formatting toolbar)
- 💬 Inline Comments System (Add, edit, delete comments)
- 👥 Document Sharing & RBAC (Owner, Editor, Commenter, Viewer roles)
- 📜 Version History (View and restore previous versions)
- 🔄 Auto-save functionality (saves after 2s of inactivity)
- 📱 Responsive Design (Mobile & Desktop)
- 🎨 Material-UI theme integration

## Project Structure

```
src/
├── pages/
│   ├── LoginPage.tsx           # Login form with validation
│   ├── RegisterPage.tsx        # Registration form
│   ├── Dashboard.tsx           # Document list and management
│   └── EditorPage.tsx          # Main editor interface
├── components/
│   ├── TiptapEditor.tsx        # Rich text editor with toolbar
│   ├── CommentsPanel.tsx       # Comments sidebar
│   ├── SharingModal.tsx        # Share and permissions modal
│   └── VersionHistory.tsx      # Version history viewer
├── contexts/
│   ├── AuthContext.tsx         # Auth state management
│   └── SocketContext.tsx       # Socket.io context (existing)
├── utils/
│   ├── api.ts                  # API client with interceptors
│   └── yjsManager.ts           # YJS collaboration (existing)
├── App.tsx                     # Router configuration
├── main.tsx                    # Entry point
└── index.css                   # Global styles
```

## Setup & Installation

### Prerequisites
- Node.js 18+ and pnpm
- Backend running on `http://localhost:5000`

### Installation Steps

```bash
# Navigate to frontend directory
cd packages/frontend

# Install dependencies
pnpm install

# Start development server
pnpm run dev
```

The frontend will be available at `http://localhost:5173`

## API Integration

### Authentication API
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user (returns JWT token)
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/logout` - Logout user

### Documents API
- `GET /api/documents` - List all user documents
- `POST /api/documents` - Create new document
- `GET /api/documents/:id` - Get document details
- `PUT /api/documents/:id` - Update document
- `DELETE /api/documents/:id` - Delete document

### Comments API
- `GET /api/documents/:id/comments` - Get all comments
- `POST /api/documents/:id/comments` - Add comment
- `PUT /api/documents/:id/comments/:commentId` - Edit comment
- `DELETE /api/documents/:id/comments/:commentId` - Delete comment
- `POST /api/documents/:id/comments/:commentId/replies` - Reply to comment

### Sharing & Permissions API
- `GET /api/documents/:id/shared` - Get shared users
- `POST /api/documents/:id/share` - Share document with user
- `DELETE /api/documents/:id/share/:userId` - Remove access

### Versions API
- `GET /api/documents/:id/versions` - Get version history
- `GET /api/documents/:id/versions/:versionId` - Get specific version
- `POST /api/documents/:id/versions/:versionId/restore` - Restore version

## Authentication Flow

1. User registers/login → JWT token stored in localStorage
2. API interceptor automatically adds token to all requests
3. Protected routes check for token validity
4. Token refresh handled by backend
5. Logout clears token and user data

## Collaboration Features

### Real-Time Editing
- Uses existing Yjs + WebSocket setup
- Tiptap collaboration extension for CRDT support
- Socket.io for presence awareness and cursor tracking

### Comments
- Range-based comment anchors (character positions)
- Threaded replies with edit/delete support
- Comment resolution tracking

### Version Control
- Automatic snapshots every 30 seconds
- Manual save points
- Diff view for comparing versions
- One-click restore to any previous version

## State Management

### AuthContext
- Manages user authentication state
- Handles login/register/logout flows
- Persists tokens in localStorage
- Provides error handling and loading states

### TanStack Query (Optional Enhancement)
For caching and background fetching of documents and comments

## Environment Variables

Create a `.env.local` file:
```
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

## Build & Deployment

```bash
# Build for production
pnpm run build

# Preview production build
pnpm run preview

# Linting
pnpm run lint
```

### Deployment Targets
- **Vercel** (recommended for Vite projects)
- **Netlify**
- **GitHub Pages**
- **Railway/Render** (with backend)

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance Optimizations

- Code splitting via React Router
- Lazy loading of editor component
- Image optimization
- CSS minimization
- Gzip compression

## Security Considerations

- JWT tokens stored securely in localStorage
- API calls include CSRF protection headers
- Content sanitization (future: DOMPurify integration)
- CORS properly configured

## Known Limitations & Future Enhancements

### Current Limitations
- Single-user cursors (multi-cursor in progress)
- Basic comment system (nested threads coming)
- Manual role assignment (invitations coming)

### Roadmap
- [ ] Real-time multi-cursor presence
- [ ] Advanced version diff view
- [ ] Email notifications for shared documents
- [ ] Dark mode theme
- [ ] Offline support with service workers
- [ ] Advanced permission delegation
- [ ] Team workspace management

## Testing

```bash
# Unit tests (when tests are added)
pnpm run test

# E2E tests
pnpm run test:e2e
```

## Troubleshooting

### API Connection Issues
- Ensure backend is running on port 5000
- Check CORS settings in backend
- Verify API base URL in `utils/api.ts`

### Socket.io Connection
- Check WebSocket connectivity
- Verify Socket.io namespace in backend
- Check browser console for connection errors

### Auth Token Issues
- Clear localStorage and login again
- Check token expiration in backend
- Verify JWT secret matches between frontend and backend

## Contributing

1. Create feature branch: `git checkout -b feature/my-feature`
2. Follow existing code patterns and TypeScript types
3. Keep components modular and testable
4. Submit PR with description of changes

## Tech Stack

- **Framework:** React 18.3
- **Language:** TypeScript 5.4
- **UI Library:** Material-UI 5.15
- **Editor:** Tiptap 2.1 (ProseMirror)
- **Real-time:** Socket.io 4.7, Yjs 13.6
- **Routing:** React Router 6.22
- **HTTP Client:** Axios 1.6
- **State:** Zustand 4.5
- **Build Tool:** Vite 5.2

## License

Part of Real-Time Collaboration Platform - LogicVeda Project
