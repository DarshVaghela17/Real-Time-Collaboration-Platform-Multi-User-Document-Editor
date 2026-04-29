import { getRedisClient } from '../config/redis';
import { decodeToken } from '../utils/jwt';

/**
 * Token Blacklist Service
 * Manages invalidated JWT tokens using Redis
 * Tokens are stored with their expiration time to auto-clean
 */
class TokenBlacklistService {
  private isConnected = false;
  private readonly prefix = 'blacklist:';
  private connectionAttempted = false;

  /**
   * Initialize Redis connection
   */
  async initialize(): Promise<void> {
    if (this.connectionAttempted) return;
    this.connectionAttempted = true;

    try {
      const client = getRedisClient();
      
      // Test connection with timeout
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Redis connection timeout')), 3000)
      );

      try {
        await Promise.race([client.ping(), timeoutPromise]);
        this.isConnected = true;
        console.log('✅ Token blacklist service ready');
      } catch (timeoutError) {
        console.warn('⚠️  Redis connection timeout. Token blacklist disabled.');
        this.isConnected = false;
      }
    } catch (error: any) {
      console.warn('⚠️  Redis unavailable. Token blacklist disabled.');
      this.isConnected = false;
    }
  }

  /**
   * Add a token to the blacklist
   * @param token - JWT token to blacklist
   * @returns true if successful, false if failed
   */
  async blacklistToken(token: string): Promise<boolean> {
    try {
      if (!this.isConnected) {
        return false;
      }

      // Decode token to get expiration
      const decoded = decodeToken(token);
      if (!decoded || !decoded.exp) {
        console.warn('Cannot blacklist token: invalid or missing expiration');
        return false;
      }

      // Calculate TTL in seconds
      const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);
      
      // Don't blacklist if already expired
      if (expiresIn <= 0) {
        return true;
      }

      const client = getRedisClient();
      const key = `${this.prefix}${token}`;
      
      // Store in Redis with automatic expiration
      await client.setex(key, expiresIn, 'true');
      console.log(`✅ Token blacklisted (expires in ${expiresIn}s)`);
      return true;
    } catch (error) {
      console.error('Error blacklisting token:', error);
      return false;
    }
  }

  /**
   * Check if a token is blacklisted
   * @param token - JWT token to check
   * @returns true if blacklisted, false otherwise
   */
  async isTokenBlacklisted(token: string): Promise<boolean> {
    try {
      if (!this.isConnected) {
        return false;
      }

      const client = getRedisClient();
      const key = `${this.prefix}${token}`;
      const exists = await client.exists(key);
      return exists === 1;
    } catch (error) {
      console.error('Error checking token blacklist:', error);
      return false;
    }
  }

  /**
   * Get all blacklisted tokens count (debugging)
   * @returns Number of blacklisted tokens
   */
  async getBlacklistCount(): Promise<number> {
    try {
      if (!this.isConnected) {
        return 0;
      }

      const client = getRedisClient();
      const keys = await client.keys(`${this.prefix}*`);
      return keys.length;
    } catch (error) {
      console.error('Error getting blacklist count:', error);
      return 0;
    }
  }

  /**
   * Clear all blacklisted tokens
   * WARNING: Use with caution, only for testing/debugging
   */
  async clearBlacklist(): Promise<boolean> {
    try {
      if (!this.isConnected) {
        return false;
      }

      const client = getRedisClient();
      const keys = await client.keys(`${this.prefix}*`);
      if (keys.length > 0) {
        await client.del(...keys);
        console.log(`🗑️ Cleared ${keys.length} blacklisted tokens`);
      }
      return true;
    } catch (error) {
      console.error('Error clearing blacklist:', error);
      return false;
    }
  }

  /**
   * Get connection status
   */
  getStatus(): boolean {
    return this.isConnected;
  }
}

// Export singleton instance
export default new TokenBlacklistService();
