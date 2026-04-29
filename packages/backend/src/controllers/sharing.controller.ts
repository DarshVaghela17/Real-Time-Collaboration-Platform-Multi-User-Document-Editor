import { Response } from 'express';
import { AuthRequest } from '../types';
import documentService from '../services/document.service';
import { NotificationService } from '../services/notification.service';

export class SharingController {
  /**
   * @route   POST /api/documents/:documentId/share
   * @desc    Share document with a user
   * @access  Private (owner only)
   */
  async shareDocument(req: AuthRequest, res: Response): Promise<void> {
    try {
      const documentId = req.params.documentId as string;
      const { email, role } = req.body;

      if (!email || !role) {
        res.status(400).json({
          success: false,
          message: 'Email and role are required',
        });
        return;
      }

      if (!['editor', 'viewer'].includes(role)) {
        res.status(400).json({
          success: false,
          message: 'Role must be either "editor" or "viewer"',
        });
        return;
      }

      const sharedUser = await documentService.shareDocument(
        documentId as string,
        email,
        role
      );

      // Send email notification asynchronously (don't wait)
      NotificationService.notifyDocumentShared(
        documentId,
        sharedUser.userId,
        req.user!.userId,
        role
      ).catch((error) => {
        console.error('Failed to send share notification:', error);
      });

      res.status(200).json({
        success: true,
        message: `Document shared with ${email} as ${role}`,
        data: { sharedUser },
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * @route   DELETE /api/documents/:documentId/share/:userId
   * @desc    Remove user from shared list
   * @access  Private (owner only)
   */
  async unshareDocument(req: AuthRequest, res: Response): Promise<void> {
    try {
      const documentId = req.params.documentId as string;
      const userId = req.params.userId as string;

      await documentService.unshareDocument(documentId as string, userId as string);

      res.json({
        success: true,
        message: 'User removed from shared list',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * @route   GET /api/documents/:documentId/shared-users
   * @desc    Get all users document is shared with
   * @access  Private (owner only)
   */
  async getSharedUsers(req: AuthRequest, res: Response): Promise<void> {
    try {
      const documentId = req.params.documentId as string;

      const sharedUsers = await documentService.getSharedUsers(documentId as string);

      res.json({
        success: true,
        data: {
          sharedUsers,
          count: sharedUsers.length,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * @route   GET /api/documents/accessible
   * @desc    Get all documents user has access to
   * @access  Private
   */
  async getAccessibleDocuments(req: AuthRequest, res: Response): Promise<void> {
    try {
      const documents = await documentService.getUserAccessibleDocuments(
        req.user!.userId
      );

      res.json({
        success: true,
        data: documents,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

export default new SharingController();