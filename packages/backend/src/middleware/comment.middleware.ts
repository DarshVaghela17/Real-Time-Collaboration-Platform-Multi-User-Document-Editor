import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import commentService from '../services/comment.service';

export const verifyCommentOwnership = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const commentId = req.params.commentId as string;

    if (!commentId.match(/^[0-9a-fA-F]{24}$/)) {
      res.status(400).json({
        success: false,
        message: 'Invalid comment ID',
      });
      return;
    }

    const isOwner = await commentService.isCommentOwner(
      commentId as string,
      req.user!.userId
    );

    if (!isOwner) {
      res.status(403).json({
        success: false,
        message: 'Access denied. You do not own this comment.',
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