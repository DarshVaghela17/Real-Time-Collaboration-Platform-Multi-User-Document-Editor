import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import documentService from '../services/document.service';

/**
 * Check if user has any access to document (read)
 */
export const requireDocumentAccess = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const documentId = req.params.documentId || req.params.id;

    if (!documentId || !documentId.match(/^[0-9a-fA-F]{24}$/)) {
      res.status(400).json({
        success: false,
        message: 'Invalid document ID',
      });
      return;
    }

    const hasAccess = await documentService.hasAccess(
      documentId,
      req.user!.userId
    );

    if (!hasAccess) {
      res.status(403).json({
        success: false,
        message: 'Access denied to this document',
      });
      return;
    }

    // Attach access level to request
    const accessLevel = await documentService.getUserAccess(
      documentId,
      req.user!.userId
    );
    req.documentAccess = accessLevel;

    next();
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/**
 * Require edit permission (owner or editor)
 */
export const requireEditPermission = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const documentId = req.params.documentId || req.params.id;

    const canEdit = await documentService.canEdit(
      documentId,
      req.user!.userId
    );

    if (!canEdit) {
      res.status(403).json({
        success: false,
        message: 'You do not have edit permission for this document',
      });
      return;
    }

    next();
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/**
 * Require owner permission
 */
export const requireOwnership = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const documentId = req.params.documentId || req.params.id;

    const isOwner = await documentService.isOwner(
      documentId,
      req.user!.userId
    );

    if (!isOwner) {
      res.status(403).json({
        success: false,
        message: 'Only the document owner can perform this action',
      });
      return;
    }

    next();
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};