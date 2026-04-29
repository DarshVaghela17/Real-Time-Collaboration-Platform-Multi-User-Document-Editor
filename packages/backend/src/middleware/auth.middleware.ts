import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { verifyToken } from '../utils/jwt';
import authService from '../services/auth.service';
import tokenBlacklistService from '../services/token.service';

/**
 * Middleware to authenticate JWT token
 * Extracts token from Authorization header, verifies it, and attaches user to request
 * Optimized: Checks blacklist before expensive token verification
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Step 1: Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        success: false,
        message: 'No authorization header. Access denied.',
      });
      return;
    }

    if (!authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Invalid authorization format. Use: Bearer <token>',
      });
      return;
    }

    // Step 2: Extract token (remove 'Bearer ' prefix)
    const token = authHeader.substring(7);

    if (!token || token.trim() === '') {
      res.status(401).json({
        success: false,
        message: 'No token provided. Access denied.',
      });
      return;
    }

    // Step 3: Check if token is blacklisted BEFORE verification (optimization)
    // Redis lookup is faster than JWT verification, so fail fast if revoked
    const isBlacklisted = await tokenBlacklistService.isTokenBlacklisted(token);
    if (isBlacklisted) {
      res.status(401).json({
        success: false,
        message: 'Token has been revoked. Please login again.',
      });
      return;
    }

    // Step 4: Verify and decode token
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (error: any) {
      // Handle specific JWT errors
      if (error.message.includes('expired')) {
        res.status(401).json({
          success: false,
          message: 'Token has expired. Please login again.',
        });
        return;
      }
      
      res.status(401).json({
        success: false,
        message: 'Invalid token. Access denied.',
      });
      return;
    }

    // Step 5: Verify user still exists in database (optional but recommended)
    const userExists = await authService.verifyUser(decoded.userId);
    if (!userExists) {
      res.status(401).json({
        success: false,
        message: 'User no longer exists. Access denied.',
      });
      return;
    }

    // Step 6: Attach user info to request object
    req.user = decoded;

    // Step 7: Continue to next middleware/controller
    next();
  } catch (error: any) {
    console.error('Authentication middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during authentication',
    });
  }
};

/**
 * Optional: Middleware to authenticate but don't fail if no token
 * Useful for routes that have optional authentication
 * Also checks blacklist before verification for optimization
 */
export const optionalAuthenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without user
      next();
      return;
    }

    const token = authHeader.substring(7);
    
    // Check if token is blacklisted first (optimization)
    const isBlacklisted = await tokenBlacklistService.isTokenBlacklisted(token);
    if (isBlacklisted) {
      // Token is revoked, continue without user
      console.log('Optional auth: Token blacklisted, continuing without user');
      next();
      return;
    }
    
    try {
      const decoded = verifyToken(token);
      const userExists = await authService.verifyUser(decoded.userId);
      
      if (userExists) {
        req.user = decoded;
      }
    } catch (error) {
      // Invalid token, but continue anyway
      console.log('Optional auth: Invalid token, continuing without user');
    }

    next();
  } catch (error) {
    // Don't fail, just continue without user
    next();
  }
};