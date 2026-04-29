import Redis, { RedisOptions } from 'ioredis';

/**
 * Redis Configuration using ioredis
 * Provides a singleton Redis client with proper error handling and reconnection strategy
 */

const redisConfig: RedisOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  db: parseInt(process.env.REDIS_DB || '0'),
  password: process.env.REDIS_PASSWORD,
  
  // Connection and retry settings
  connectTimeout: 10000, // 10 seconds
  maxRetriesPerRequest: null, // Unlimited retries (handled by retry strategy)
  enableReadyCheck: false,
  enableOfflineQueue: true, // Queue commands while reconnecting
  
  // Reconnection strategy
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000); // Exponential backoff, max 2 seconds
    return delay;
  },
  
  // Cluster and sentinel settings (if needed)
  lazyConnect: false, // Connect immediately
};

/**
 * Create and export singleton Redis instance
 */
let redis: Redis;

export const getRedisClient = (): Redis => {
  if (!redis) {
    redis = new Redis(redisConfig);

    // Error handling
    redis.on('error', (error: Error) => {
      console.error('❌ Redis Client Error:', error.message);
    });

    redis.on('connect', () => {
      console.log('✅ Redis connected successfully');
    });

    redis.on('reconnecting', () => {
      console.log('🔄 Redis reconnecting...');
    });

    redis.on('ready', () => {
      console.log('✅ Redis ready for commands');
    });

    redis.on('close', () => {
      console.log('❌ Redis connection closed');
    });
  }

  return redis;
};

/**
 * Test Redis connection
 * Returns true if connected, false otherwise
 */
export const testRedisConnection = async (): Promise<boolean> => {
  try {
    const client = getRedisClient();
    await client.ping();
    return true;
  } catch (error) {
    console.error('Redis connection test failed:', error);
    return false;
  }
};

/**
 * Disconnect Redis client gracefully
 */
export const disconnectRedis = async (): Promise<void> => {
  if (redis) {
    try {
      await redis.quit();
      console.log('✅ Redis disconnected gracefully');
    } catch (error) {
      console.error('Error disconnecting Redis:', error);
    }
  }
};

/**
 * Export default client instance
 */
export default getRedisClient();
