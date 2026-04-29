import jwt, { SignOptions, SignCallback } from 'jsonwebtoken';
import { config } from '../config/environment';
import { JWTPayload } from '../types';

/**
 * Generate a JWT token
 * @param payload - User data to encode in token
 * @returns JWT token string
 */
export const generateToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn as unknown as number,
    issuer: 'realtime-collab-platform',
    audience: 'realtime-collab-users',
  });
};

/**
 * Verify and decode a JWT token
 * @param token - JWT token to verify
 * @returns Decoded token payload
 * @throws Error if token is invalid or expired
 */
export const verifyToken = (token: string): JWTPayload => {
  try {
    const decoded = jwt.verify(token, config.jwt.secret, {
      issuer: 'realtime-collab-platform',
      audience: 'realtime-collab-users',
    }) as JWTPayload;

    return decoded;
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    }
    if (error.name === 'NotBeforeError') {
      throw new Error('Token not yet valid');
    }
    throw new Error('Token verification failed');
  }
};

/**
 * Decode token without verification (for debugging)
 * @param token - JWT token to decode
 * @returns Decoded payload or null
 */
export const decodeToken = (token: string): JWTPayload | null => {
  try {
    return jwt.decode(token) as JWTPayload;
  } catch (error) {
    return null;
  }
};

/**
 * Check if token is expired without throwing error
 * @param token - JWT token to check
 * @returns true if expired, false otherwise
 */
export const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = jwt.decode(token) as any;
    if (!decoded || !decoded.exp) return true;
    
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  } catch (error) {
    return true;
  }
};