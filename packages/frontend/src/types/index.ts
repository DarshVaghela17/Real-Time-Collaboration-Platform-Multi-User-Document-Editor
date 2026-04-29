/**
 * Centralized Type Definitions for Real-Time Collaboration Platform
 * All interfaces for User, Document, Comments, Notifications, and Collaboration
 */

// ============================================================================
// USER & AUTHENTICATION
// ============================================================================

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  theme?: 'light' | 'dark';
  color?: string; // Hex color for collaboration cursor
  createdAt?: string;
  updatedAt?: string;
}

// ============================================================================
// DOCUMENTS & CONTENT
// ============================================================================

export interface Document {
  _id: string;
  id?: string;
  title: string;
  content: string;
  ownerId: string;
  permission?: 'viewer' | 'commenter' | 'editor' | 'owner';
  sharedWith?: SharedAccess[];
  createdAt: string;
  updatedAt: string;
}

export interface SharedAccess {
  userId: string;
  email: string;
  role: 'viewer' | 'commenter' | 'editor';
  grantedAt: string;
  grantedBy?: string;
}

// ============================================================================
// COMMENTS & DISCUSSION
// ============================================================================

export interface Comment {
  id: string;
  _id?: string;
  documentId: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  content: string;
  position?: number; // Selection position in document
  resolved: boolean;
  createdAt: string;
  updatedAt?: string;
  replies?: CommentReply[];
}

export interface CommentReply {
  id: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  content: string;
  createdAt: string;
  updatedAt?: string;
}

// ============================================================================
// NOTIFICATIONS
// ============================================================================

export type NotificationType = 'share' | 'mention' | 'edit' | 'comment' | 'system';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  targetId?: string; // Document ID or Comment ID
  targetType?: 'document' | 'comment';
  link?: string; // Clickable link (e.g., /editor/docId)
  read: boolean;
  archived: boolean;
  createdAt: string;
  metadata?: Record<string, any>; // Additional context
}

// ============================================================================
// REAL-TIME COLLABORATION
// ============================================================================

export interface ActiveUser {
  id: string;
  userId: string;
  name: string;
  email?: string;
  color: string; // Hex color for cursor/presence indicator
  cursorPosition?: number;
  lastActivity: string; // ISO timestamp
  status?: 'editing' | 'viewing' | 'idle';
}

export interface DocumentVersion {
  id: string;
  versionNumber: number;
  documentId: string;
  title: string;
  content: string;
  author: {
    id: string;
    name: string;
  };
  description?: string;
  createdAt: string;
}

// ============================================================================
// API RESPONSES
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T | T[];
  error?: string;
  timestamp?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// ============================================================================
// FORM DATA
// ============================================================================

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  passwordConfirm: string;
  name: string;
}

export interface UpdateProfileData {
  name?: string;
  email?: string;
  avatar?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  newPasswordConfirm: string;
}

export interface CreateDocumentData {
  title: string;
  content?: string;
}

export interface UpdateDocumentData {
  title?: string;
  content?: string;
}

export interface CreateCommentData {
  content: string;
  position?: number;
}

export interface ShareDocumentData {
  email: string;
  role: 'viewer' | 'commenter' | 'editor';
}

// ============================================================================
// CONTEXT & STATE TYPES
// ============================================================================

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  updateUser: (user: Partial<User>) => void;
}

export interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  markAsArchived: (id: string) => void;
  clearNotifications: () => void;
  clearArchived: () => void;
}

export interface SocketContextType {
  socket: any; // Socket.io socket instance
  isConnected: boolean;
  activeUsers: ActiveUser[];
  error: string | null;
  emit: (event: string, data?: any) => void;
  on: (event: string, callback: (data: any) => void) => void;
  off: (event: string, callback?: (data: any) => void) => void;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type Permission = 'viewer' | 'commenter' | 'editor' | 'owner';

export interface EditorState {
  documentId: string;
  title: string;
  content: string;
  isSaving: boolean;
  lastSaved?: string;
  hasPendingChanges: boolean;
}

export interface SearchResult {
  id: string;
  title: string;
  content: string;
  highlight?: string; // Highlighted snippet
  score?: number; // Relevance score
}
