import { getEmailTransporter } from '../config/email';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

/**
 * Email service for sending notifications
 * Uses Nodemailer for SMTP email delivery
 */
export class EmailService {
  private static readonly DEFAULT_FROM = process.env.EMAIL_FROM || 'noreply@realtimecollaboration.com';

  /**
   * Send generic email
   */
  static async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const transporter = getEmailTransporter();

      await transporter.sendMail({
        from: options.from || this.DEFAULT_FROM,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });

      console.log(`✅ Email sent to ${options.to}: ${options.subject}`);
    } catch (error) {
      console.error(`❌ Failed to send email to ${options.to}:`, error);
      // Don't throw - email failure shouldn't break the app
    }
  }

  /**
   * Send document share notification email
   * Triggers when a document is shared with a user
   */
  static async sendDocumentSharedEmail(
    recipientEmail: string,
    recipientName: string,
    senderName: string,
    documentTitle: string,
    role: 'editor' | 'viewer',
    documentId: string
  ): Promise<void> {
    const roleDisplay = role === 'editor' ? 'Editor' : 'Viewer';
    const actionText = role === 'editor' 
      ? 'edit and view'
      : 'view only';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px;">
          <h2 style="color: #333; margin-top: 0;">Document Shared with You</h2>
          
          <p style="color: #666; font-size: 16px;">
            Hi <strong>${recipientName}</strong>,
          </p>
          
          <p style="color: #666; font-size: 16px;">
            <strong>${senderName}</strong> has shared a document with you as an <strong>${roleDisplay}</strong>.
          </p>
          
          <div style="background-color: white; padding: 20px; border-left: 4px solid #4CAF50; margin: 20px 0;">
            <p style="margin: 0; color: #333;">
              <strong>Document:</strong> ${documentTitle}
            </p>
            <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">
              You can ${actionText} this document.
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.APP_URL}/documents/${documentId}" 
               style="background-color: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Open Document
            </a>
          </div>
          
          <p style="color: #999; font-size: 12px; margin-top: 20px; border-top: 1px solid #ddd; padding-top: 10px;">
            If you don't have access to the link above, you can sign in to your account and find the document in your "Shared with me" folder.
          </p>
        </div>
      </div>
    `;

    await this.sendEmail({
      to: recipientEmail,
      subject: `${senderName} shared "${documentTitle}" with you`,
      html,
    });
  }

  /**
   * Send comment notification email
   * Triggers when a comment is added to a document
   */
  static async sendCommentNotificationEmail(
    recipientEmail: string,
    recipientName: string,
    commenterName: string,
    documentTitle: string,
    commentContent: string,
    documentId: string,
    isReply: boolean = false
  ): Promise<void> {
    const actionType = isReply ? 'replied to your comment' : 'commented on';
    const subject = isReply 
      ? `${commenterName} replied to your comment on "${documentTitle}"`
      : `${commenterName} commented on "${documentTitle}"`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px;">
          <h2 style="color: #333; margin-top: 0;">New Comment</h2>
          
          <p style="color: #666; font-size: 16px;">
            Hi <strong>${recipientName}</strong>,
          </p>
          
          <p style="color: #666; font-size: 16px;">
            <strong>${commenterName}</strong> ${actionType} "<strong>${documentTitle}</strong>".
          </p>
          
          <div style="background-color: white; padding: 20px; border-left: 4px solid #2196F3; margin: 20px 0;">
            <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">
              <strong>${commenterName}:</strong>
            </p>
            <p style="margin: 0; color: #333; font-size: 14px; line-height: 1.5;">
              ${escapeHtml(commentContent)}
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.APP_URL}/documents/${documentId}#comments" 
               style="background-color: #2196F3; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block;">
              View Comment
            </a>
          </div>
          
          <p style="color: #999; font-size: 12px; margin-top: 20px; border-top: 1px solid #ddd; padding-top: 10px;">
            You're receiving this email because you have access to this document. 
            If you no longer want to receive notifications, you can remove access to the document.
          </p>
        </div>
      </div>
    `;

    await this.sendEmail({
      to: recipientEmail,
      subject,
      html,
    });
  }

  /**
   * Send comment reply notification
   * Triggers when someone replies to a user's comment
   */
  static async sendCommentReplyNotificationEmail(
    recipientEmail: string,
    recipientName: string,
    replierName: string,
    documentTitle: string,
    replyContent: string,
    originalCommentContent: string,
    documentId: string
  ): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px;">
          <h2 style="color: #333; margin-top: 0;">Reply to Your Comment</h2>
          
          <p style="color: #666; font-size: 16px;">
            Hi <strong>${recipientName}</strong>,
          </p>
          
          <p style="color: #666; font-size: 16px;">
            <strong>${replierName}</strong> replied to your comment on "<strong>${documentTitle}</strong>".
          </p>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #FF9800; margin: 20px 0;">
            <p style="margin: 0 0 10px 0; color: #999; font-size: 12px;">
              Your comment:
            </p>
            <p style="margin: 0 0 15px 0; color: #666; font-size: 14px; line-height: 1.5; padding-left: 10px; border-left: 2px solid #ddd;">
              ${escapeHtml(originalCommentContent)}
            </p>
            
            <p style="margin: 10px 0 0 0; color: #999; font-size: 12px;">
              ${replierName}'s reply:
            </p>
            <p style="margin: 5px 0 0 0; color: #333; font-size: 14px; line-height: 1.5; padding-left: 10px; border-left: 2px solid #2196F3;">
              ${escapeHtml(replyContent)}
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.APP_URL}/documents/${documentId}#comments" 
               style="background-color: #2196F3; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block;">
              View Conversation
            </a>
          </div>
          
          <p style="color: #999; font-size: 12px; margin-top: 20px; border-top: 1px solid #ddd; padding-top: 10px;">
            You're receiving this email because someone replied to your comment.
          </p>
        </div>
      </div>
    `;

    await this.sendEmail({
      to: recipientEmail,
      subject: `${replierName} replied to your comment on "${documentTitle}"`,
      html,
    });
  }
}

/**
 * Escape HTML special characters for safety in email
 */
function escapeHtml(text: string): string {
  const htmlEscapes: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };

  return text.replace(/[&<>"']/g, (char) => htmlEscapes[char] || char);
}
