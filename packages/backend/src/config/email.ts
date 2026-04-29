import nodemailer from 'nodemailer';

// Email configuration
const emailConfig = {
  service: process.env.EMAIL_SERVICE || 'gmail',
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
};

// Create reusable transporter
let transporter: nodemailer.Transporter | null = null;

/**
 * Get or create email transporter
 * Validates that email configuration is set
 */
export const getEmailTransporter = (): nodemailer.Transporter => {
  if (transporter) {
    return transporter;
  }

  // Validate required environment variables
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    throw new Error(
      'Email configuration missing: EMAIL_USER and EMAIL_PASSWORD required'
    );
  }

  transporter = nodemailer.createTransport(emailConfig);

  return transporter;
};

/**
 * Verify email transporter connection
 * Useful for testing email configuration
 */
export const verifyEmailTransporter = async (): Promise<void> => {
  try {
    const transporter = getEmailTransporter();
    await transporter.verify();
    console.log('✅ Email transporter verified successfully');
  } catch (error) {
    console.error('❌ Email transporter verification failed:', error);
    throw error;
  }
};

export default emailConfig;
