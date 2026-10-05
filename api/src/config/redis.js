import Ioredis from 'ioredis';
import logger from './logger.js';

let redisClient = null;
let isRedisConnected = false;

export const initRedis = async () => {
  try {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    redisClient = new Ioredis(redisUrl);

    redisClient.on('connect', () => {
      isRedisConnected = true;
      logger.info('✅ Redis connected successfully');
    });

    redisClient.on('error', (err) => {
      isRedisConnected = false;
      logger.error('❌ Redis connection error', { error: err.message });
    });

    redisClient.on('close', () => {
      isRedisConnected = false;
      logger.warn('🔌 Redis connection closed');
    });

    await redisClient.ping();
    isRedisConnected = true;

    return redisClient;
  } catch (error) {
    logger.error('❌ Failed to connect to Redis', { error: error.message });
    throw error;
  }
};

export const getRedisClient = () => redisClient;

export const isRedisOnline = () => isRedisConnected;

export const disconnectRedis = async () => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    isRedisConnected = false;
    logger.info('🔌 Redis disconnected successfully');
  }
};

export default {
  initRedis,
  getRedisClient,
  isRedisOnline,
  disconnectRedis,
};