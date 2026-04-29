import User from '../models/User';
import DocumentModel from '../models/Document';
import { EmailService } from './email.service';

/**
 * Notification service
 * Handles sending email notifications for document sharing and comments
 * Skips notification if EMAIL_USER not configured
 */
export class NotificationService {
  /**
   * Check if email notifications are enabled
   */
  private static isEmailEnabled(): boolean {
    return !!process.env.EMAIL_USER && !!process.env.EMAIL_PASSWORD;
  }

  /**
   * Notify user when document is shared
   * Sends email to recipient with document link
   */
  static async notifyDocumentShared(
    documentId: string,
    sharedWithUserId: string,
    sharingUserId: string,
    role: 'editor' | 'viewer'
  ): Promise<void> {
    if (!this.isEmailEnabled()) {
      console.log('⚠️  Email notifications disabled (EMAIL_USER not configured)');
      return;
    }

    try {
      // Fetch user info
      const [document, sharedWithUser, sharingUser] = await Promise.all([
        DocumentModel.findById(documentId),
        User.findById(sharedWithUserId),
        User.findById(sharingUserId),
      ]);

      if (!document || !sharedWithUser || !sharingUser) {
        console.warn('⚠️  Cannot send share notification - missing user or document data');
        return;
      }

      // Send email
      await EmailService.sendDocumentSharedEmail(
        sharedWithUser.email,
        sharedWithUser.name,
        sharingUser.name,
        document.title,
        role,
        documentId
      );
    } catch (error) {
      console.error('Error sending share notification:', error);
      // Don't throw - notification shouldn't break the app
    }
  }

  /**
   * Notify document owner when comment is added
   * Sends email to document owner and other collaborators
   */
  static async notifyCommentAdded(
    documentId: string,
    commenterUserId: string,
    commentContent: string,
    parentCommentAuthorId?: string
  ): Promise<void> {
    if (!this.isEmailEnabled()) {
      return;
    }

    try {
      // Fetch document, commenter, owner
      const document = await DocumentModel.findById(documentId);
      const commenter = await User.findById(commenterUserId);
      const owner = await User.findById(document?.owner);

      if (!document || !commenter || !owner) {
        console.warn('⚠️  Cannot send comment notification - missing data');
        return;
      }

      // Notify document owner (if not the commenter)
      if (owner._id.toString() !== commenterUserId) {
        await EmailService.sendCommentNotificationEmail(
          owner.email,
          owner.name,
          commenter.name,
          document.title,
          commentContent,
          documentId,
          false
        );
      }

      // If replying to a comment, notify the comment author
      if (parentCommentAuthorId && parentCommentAuthorId !== commenterUserId) {
        const parentAuthor = await User.findById(parentCommentAuthorId);
        if (parentAuthor && parentAuthor._id.toString() !== owner._id.toString()) {
          await EmailService.sendCommentNotificationEmail(
            parentAuthor.email,
            parentAuthor.name,
            commenter.name,
            document.title,
            commentContent,
            documentId,
            true
          );
        }
      }

      // Notify other collaborators (editors and viewers)
      const notifiedUserIds = new Set([
        owner._id.toString(),
        commenterUserId,
        parentCommentAuthorId,
      ]);

      for (const share of document.sharedWith) {
        const userId = share.userId.toString();
        if (!notifiedUserIds.has(userId)) {
          const collaborator = await User.findById(userId);
          if (collaborator) {
            await EmailService.sendCommentNotificationEmail(
              collaborator.email,
              collaborator.name,
              commenter.name,
              document.title,
              commentContent,
              documentId,
              false
            );
            notifiedUserIds.add(userId);
          }
        }
      }
    } catch (error) {
      console.error('Error sending comment notification:', error);
      // Don't throw - notification shouldn't break the app
    }
  }

  /**
   * Notify comment author when comment is replied to
   * Sends detailed email with both comments
   */
  static async notifyCommentReply(
    documentId: string,
    replierUserId: string,
    originalCommentContent: string,
    originalCommentAuthorId: string,
    replyContent: string
  ): Promise<void> {
    if (!this.isEmailEnabled()) {
      return;
    }

    // Don't notify if replying to own comment
    if (replierUserId === originalCommentAuthorId) {
      return;
    }

    try {
      const [document, replier, commentAuthor] = await Promise.all([
        DocumentModel.findById(documentId),
        User.findById(replierUserId),
        User.findById(originalCommentAuthorId),
      ]);

      if (!document || !replier || !commentAuthor) {
        console.warn('⚠️  Cannot send reply notification - missing data');
        return;
      }

      await EmailService.sendCommentReplyNotificationEmail(
        commentAuthor.email,
        commentAuthor.name,
        replier.name,
        document.title,
        replyContent,
        originalCommentContent,
        documentId
      );
    } catch (error) {
      console.error('Error sending reply notification:', error);
      // Don't throw - notification shouldn't break the app
    }
  }
}
