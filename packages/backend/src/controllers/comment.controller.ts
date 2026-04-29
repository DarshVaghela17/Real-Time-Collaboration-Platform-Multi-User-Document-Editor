import { Response } from 'express';
import { AuthRequest } from '../types';
import commentService from '../services/comment.service';
import documentService from '../services/document.service';
import { NotificationService } from '../services/notification.service';

export class CommentController {
  /**
   * @route   POST /api/documents/:documentId/comments
   * @desc    Create a new comment on a document
   * @access  Private
   */
  async createComment(req: AuthRequest, res: Response): Promise<void> {
    try {
      const documentId = req.params.documentId as string;
      const { content } = req.body;

      // Validate input
      if (!content || content.trim().length === 0) {
        res.status(400).json({
          success: false,
          message: 'Comment content is required',
        });
        return;
      }

      const comment = await commentService.createComment(
        req.user!.userId,
        documentId,
        content
      );

      // Send email notification asynchronously (don't wait)
      NotificationService.notifyCommentAdded(
        documentId,
        req.user!.userId,
        content
      ).catch((error) => {
        console.error('Failed to send comment notification:', error);
      });

      res.status(201).json({
        success: true,
        message: 'Comment created successfully',
        data: { comment },
      });
    } catch (error: any) {
      // Handle permission or document not found errors
      if (error.message.includes('access')) {
        res.status(403).json({
          success: false,
          message: error.message,
        });
      } else if (error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(400).json({
          success: false,
          message: error.message,
        });
      }
    }
  }

  /**
   * @route   POST /api/comments/:commentId/replies
   * @desc    Reply to an existing comment
   * @access  Private
   */
  async replyToComment(req: AuthRequest, res: Response): Promise<void> {
    try {
      const commentId = req.params.commentId as string;
      const { content } = req.body;

      // Validate input
      if (!content || content.trim().length === 0) {
        res.status(400).json({
          success: false,
          message: 'Reply content is required',
        });
        return;
      }

      const reply = await commentService.replyToComment(
        req.user!.userId,
        commentId,
        content
      );

      // Get parent comment to notify the original author
      const parentComment = await commentService.getCommentById(commentId as string);
      if (parentComment) {
        NotificationService.notifyCommentReply(
          reply.documentId,
          req.user!.userId,
          parentComment.content,
          parentComment.userId,
          content
        ).catch((error) => {
          console.error('Failed to send reply notification:', error);
        });
      }

      res.status(201).json({
        success: true,
        message: 'Reply added successfully',
        data: { comment: reply },
      });
    } catch (error: any) {
      // Handle various error types
      if (error.message.includes('access')) {
        res.status(403).json({
          success: false,
          message: error.message,
        });
      } else if (error.message.includes('not found') || error.message.includes('deleted')) {
        res.status(404).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(400).json({
          success: false,
          message: error.message,
        });
      }
    }
  }

  /**
   * @route   GET /api/documents/:documentId/comments
   * @desc    Get all comments for a document (hierarchical)
   * @access  Private
   */
  async getCommentsByDocument(req: AuthRequest, res: Response): Promise<void> {
    try {
      const documentId = req.params.documentId as string;

      // Verify user has access to document
      const access = await documentService.getUserAccess(
        documentId,
        req.user!.userId
      );

      if (!access) {
        res.status(403).json({
          success: false,
          message: 'You do not have access to this document',
        });
        return;
      }

      const comments = await commentService.getCommentsByDocument(documentId);

      res.json({
        success: true,
        data: {
          comments,
          count: comments.length,
        },
      });
    } catch (error: any) {
      if (error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: error.message,
        });
      }
    }
  }

  /**
   * @route   PATCH /api/comments/:commentId/resolve
   * @desc    Toggle comment resolved status (owner only)
   * @access  Private (document owner only)
   */
  async resolveComment(req: AuthRequest, res: Response): Promise<void> {
    try {
      const commentId = req.params.commentId as string;

      const comment = await commentService.resolveComment(
        req.user!.userId,
        commentId as string
      );

      res.json({
        success: true,
        message: comment.isResolved ? 'Comment resolved' : 'Comment reopened',
        data: { comment },
      });
    } catch (error: any) {
      // Check for permission errors
      if (error.message.includes('owner')) {
        res.status(403).json({
          success: false,
          message: error.message,
        });
      } else if (error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(400).json({
          success: false,
          message: error.message,
        });
      }
    }
  }

  /**
   * @route   PUT /api/comments/:commentId
   * @desc    Update comment content (author only)
   * @access  Private (comment author only)
   */
  async updateComment(req: AuthRequest, res: Response): Promise<void> {
    try {
      const commentId = req.params.commentId as string;
      const { content } = req.body;

      // Validate input
      if (!content || content.trim().length === 0) {
        res.status(400).json({
          success: false,
          message: 'Comment content is required',
        });
        return;
      }

      const comment = await commentService.updateComment(
        req.user!.userId,
        commentId as string,
        content
      );

      res.json({
        success: true,
        message: 'Comment updated successfully',
        data: { comment },
      });
    } catch (error: any) {
      // Check for permission errors
      if (error.message.includes('author')) {
        res.status(403).json({
          success: false,
          message: error.message,
        });
      } else if (error.message.includes('not found') || error.message.includes('deleted')) {
        res.status(404).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(400).json({
          success: false,
          message: error.message,
        });
      }
    }
  }

  /**
   * @route   DELETE /api/comments/:commentId
   * @desc    Delete a comment (author only)
   * @access  Private (comment author only)
   */
  async deleteComment(req: AuthRequest, res: Response): Promise<void> {
    try {
      const commentId = req.params.commentId as string;

      await commentService.deleteComment(req.user!.userId, commentId as string);

      res.json({
        success: true,
        message: 'Comment deleted successfully',
      });
    } catch (error: any) {
      // Check for permission errors
      if (error.message.includes('author')) {
        res.status(403).json({
          success: false,
          message: error.message,
        });
      } else if (error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(400).json({
          success: false,
          message: error.message,
        });
      }
    }
  }
}

export default new CommentController();