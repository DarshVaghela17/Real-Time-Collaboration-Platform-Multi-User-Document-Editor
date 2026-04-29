import { Request } from 'express';
import { IUser } from '../models/User';


// JWT Payload structure
export interface JWTPayload {
  userId: string;
  email: string;
}

// Extended Request with user info
export interface AuthRequest extends Request {
  user?: JWTPayload;
  documentAccess?: 'owner' | 'editor' | 'viewer' | null;
}

// ========================
// AUTH DTOs
// ========================

export interface RegisterDTO {
  name: string;
  email: string;
  password: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: {
      id: string;
      name: string;
      email: string;
    };
    token: string;
  };
}

// ========================
// DOCUMENT DTOs
// ========================

export interface CreateDocumentDTO {
  title: string;
  content?: string;
}

export interface UpdateDocumentDTO {
  title?: string;
  content?: string;
}

export interface DocumentResponse {
  id: string;
  title: string;
  content: string;
  owner: string;
  createdAt: Date;
  updatedAt: Date;
}

// Export model interfaces
export type { IUser } from '../models/User';
export type { IDocument } from '../models/Document';


export interface CreateDocumentDTO {
  title: string;
  content?: string;
}

export interface UpdateDocumentDTO {
  title?: string;
  content?: string;
}

export interface ShareDocumentDTO {
  email: string;
  role: 'editor' | 'viewer';
}