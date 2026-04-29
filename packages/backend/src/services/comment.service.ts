import CommentModel from '../models/Comment';
import User from '../models/User';
import DocumentModel from '../models/Document';

export interface CommentWithUser {
  id: string;
  documentId: string;
  userId: string;
  userName: string;
  content: string;
  parentId: string | null;
  isResolved: boolean;
  deletedAt: Date | null;
  replies?: CommentWithUser[];
  createdAt: Date;
  updatedAt: Date;
}

export class CommentService {
  /**
   * Create a new comment on a document
   * @throws Error if document doesn't exist or user doesn't have access
   */
  async createComment(
    userId: string,
    documentId: string,
    content: string
  ): Promise<CommentWithUser> {
    // Validate document exists
    const document = await DocumentModel.findById(documentId);
    if (!document) {
      throw new Error('Document not found');
    }

    // Check if user has access to document
    const hasAccess =
      document.owner.toString() === userId ||
      document.sharedWith.some((share) => share.userId.toString() === userId);

    if (!hasAccess) {
      throw new Error('You do not have access to this document');
    }

    // Create comment
    const comment = await CommentModel.create({
      documentId,
      userId,
      content,
      parentId: null,
    });

    // Get user info
    const user = await User.findById(userId);

    return {
      id: comment._id.toString(),
      documentId: comment.documentId.toString(),
      userId: comment.userId.toString(),
      userName: user?.name || 'Unknown User',
      content: comment.content,
      parentId: comment.parentId?.toString() || null,
      isResolved: comment.isResolved,
      deletedAt: comment.deletedAt,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    };
  }

  /**
   * Reply to an existing comment
   * @throws Error if parent comment doesn't exist or user doesn't have access
   */
  async replyToComment(
    userId: string,
    parentCommentId: string,
    content: string
  ): Promise<CommentWithUser> {
    // Verify parent comment exists and is not deleted
    const parentComment = await CommentModel.findById(parentCommentId);
    if (!parentComment) {
      throw new Error('Parent comment not found');
    }

    if (parentComment.deletedAt) {
      throw new Error('Cannot reply to a deleted comment');
    }

    // Verify user has access to the document
    const document = await DocumentModel.findById(
      parentComment.documentId.toString()
    );
    if (!document) {
      throw new Error('Document not found');
    }

    const hasAccess =
      document.owner.toString() === userId ||
      document.sharedWith.some((share) => share.userId.toString() === userId);

    if (!hasAccess) {
      throw new Error('You do not have access to this document');
    }

    // Create reply comment
    const reply = await CommentModel.create({
      documentId: parentComment.documentId,
      userId,
      content,
      parentId: parentCommentId,
    });

    const user = await User.findById(userId);

    return {
      id: reply._id.toString(),
      documentId: reply.documentId.toString(),
      userId: reply.userId.toString(),
      userName: user?.name || 'Unknown User',
      content: reply.content,
      parentId: reply.parentId?.toString() || null,
      isResolved: reply.isResolved,
      deletedAt: reply.deletedAt,
      createdAt: reply.createdAt,
      updatedAt: reply.updatedAt,
    };
  }

  /**
   * Get all comments for a document (flat list)
   * Excludes deleted comments
   */
  async getCommentsByDocument(documentId: string): Promise<CommentWithUser[]> {
    // Get all non-deleted comments for this document
    const comments = await CommentModel.find({
      documentId,
      deletedAt: null,
    })
      .sort({ createdAt: 1 })
      .lean();

    // Get all unique user IDs
    const userIds = [...new Set(comments.map((c) => c.userId.toString()))];

    // Fetch all users at once
    const users = await User.find({ _id: { $in: userIds } });
    const userMap = new Map(users.map((u) => [u._id.toString(), u.name]));

    // Format comments with user info
    const formattedComments: CommentWithUser[] = comments.map((c) => ({
      id: c._id.toString(),
      documentId: c.documentId.toString(),
      userId: c.userId.toString(),
      userName: userMap.get(c.userId.toString()) || 'Unknown User',
      content: c.content,
      parentId: c.parentId?.toString() || null,
      isResolved: c.isResolved,
      deletedAt: c.deletedAt,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));

    // Build hierarchical structure
    return this.buildCommentTree(formattedComments);
  }

  /**
   * Build tree structure from flat comments
   */
  private buildCommentTree(comments: CommentWithUser[]): CommentWithUser[] {
    const commentMap = new Map<string, CommentWithUser>();
    const rootComments: CommentWithUser[] = [];

    // First pass: create map
    comments.forEach((comment) => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    // Second pass: build tree
    comments.forEach((comment) => {
      const node = commentMap.get(comment.id)!;
      
      if (comment.parentId) {
        const parent = commentMap.get(comment.parentId);
        if (parent) {
          parent.replies!.push(node);
        }
      } else {
        rootComments.push(node);
      }
    });

    return rootComments;
  }

  /**
   * Get a single comment by ID
   */
  async getCommentById(commentId: string): Promise<CommentWithUser> {
    const comment = await CommentModel.findById(commentId);

    if (!comment) {
      throw new Error('Comment not found');
    }

    const user = await User.findById(comment.userId);

    return {
      id: comment._id.toString(),
      documentId: comment.documentId.toString(),
      userId: comment.userId.toString(),
      userName: user?.name || 'Unknown User',
      content: comment.content,
      parentId: comment.parentId?.toString() || null,
      isResolved: comment.isResolved,
      deletedAt: comment.deletedAt,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    };
  }

  /**
   * Resolve a comment (only document owner can resolve)
   * @throws Error if user is not document owner
   */
  async resolveComment(userId: string, commentId: string): Promise<CommentWithUser> {
    // Get comment
    const comment = await CommentModel.findById(commentId);
    if (!comment) {
      throw new Error('Comment not found');
    }

    // Get document to check ownership
    const document = await DocumentModel.findById(comment.documentId);
    if (!document) {
      throw new Error('Document not found');
    }

    // Only document owner can resolve
    if (document.owner.toString() !== userId) {
      throw new Error('Only document owner can resolve comments');
    }

    // Toggle resolved status
    comment.isResolved = !comment.isResolved;
    await comment.save();

    return this.getCommentById(commentId);
  }

  /**
   * Delete a comment (soft delete) - only author can delete
   * @throws Error if user is not comment author
   */
  async deleteComment(userId: string, commentId: string): Promise<void> {
    const comment = await CommentModel.findById(commentId);

    if (!comment) {
      throw new Error('Comment not found');
    }

    // Only comment author can delete
    if (comment.userId.toString() !== userId) {
      throw new Error('Only comment author can delete this comment');
    }

    // Soft delete - mark with deletedAt timestamp
    comment.deletedAt = new Date();
    await comment.save();
  }

  /**
   * Check if user owns a comment
   */
  async isCommentOwner(commentId: string, userId: string): Promise<boolean> {
    const comment = await CommentModel.findById(commentId);
    return comment ? comment.userId.toString() === userId : false;
  }

  /**
   * Update comment content (only author can update)
   * @throws Error if user is not comment author
   */
  async updateComment(
    userId: string,
    commentId: string,
    content: string
  ): Promise<CommentWithUser> {
    const comment = await CommentModel.findById(commentId);

    if (!comment) {
      throw new Error('Comment not found');
    }

    // Only comment author can update
    if (comment.userId.toString() !== userId) {
      throw new Error('Only comment author can update this comment');
    }

    if (comment.deletedAt) {
      throw new Error('Cannot update a deleted comment');
    }

    comment.content = content;
    await comment.save();

    return this.getCommentById(commentId);
  }
}

export default new CommentService();