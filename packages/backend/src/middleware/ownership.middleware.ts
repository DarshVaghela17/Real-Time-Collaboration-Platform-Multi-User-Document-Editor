import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import documentService from '../services/document.service';

export const verifyOwnership = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const documentId = req.params.id;

    // Validate ObjectId format
    if (!documentId.match(/^[0-9a-fA-F]{24}$/)) {
      res.status(400).json({
        success: false,
        message: 'Invalid document ID',
      });
      return;
    }

    // Check ownership
    const isOwner = await documentService.isOwner(documentId, req.user!.userId);

    if (!isOwner) {
      res.status(403).json({
        success: false,
        message: 'Access denied. You do not own this document.',
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