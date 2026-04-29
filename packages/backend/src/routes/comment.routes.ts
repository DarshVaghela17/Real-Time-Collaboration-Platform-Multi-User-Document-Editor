import { Router } from 'express';
import commentController from '../controllers/comment.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/documents/:documentId/comments
 * @desc    Create a new comment on a document
 * @access  Private
 */
router.post(
  '/documents/:documentId/comments',
  commentController.createComment.bind(commentController)
);

/**
 * @route   POST /api/comments/:commentId/replies
 * @desc    Reply to an existing comment
 * @access  Private
 */
router.post(
  '/comments/:commentId/replies',
  commentController.replyToComment.bind(commentController)
);

/**
 * @route   GET /api/documents/:documentId/comments
 * @desc    Get all comments for a document (hierarchical)
 * @access  Private
 */
router.get(
  '/documents/:documentId/comments',
  commentController.getCommentsByDocument.bind(commentController)
);

/**
 * @route   PATCH /api/comments/:commentId/resolve
 * @desc    Toggle comment resolved status (owner only)
 * @access  Private (document owner only)
 */
router.patch(
  '/comments/:commentId/resolve',
  commentController.resolveComment.bind(commentController)
);

/**
 * @route   PUT /api/comments/:commentId
 * @desc    Update comment content (author only)
 * @access  Private (comment author only)
 */
router.put(
  '/comments/:commentId',
  commentController.updateComment.bind(commentController)
);

/**
 * @route   DELETE /api/comments/:commentId
 * @desc    Delete a comment (author only)
 * @access  Private (comment author only)
 */
router.delete(
  '/comments/:commentId',
  commentController.deleteComment.bind(commentController)
);

export default router;