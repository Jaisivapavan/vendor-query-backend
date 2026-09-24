import Redis from 'ioredis';

let redisClient: Redis | null = null;

if (process.env.REDIS_URL && process.env.REDIS_URL.trim() !== '') {
  try {
    redisClient = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 2,
      retryStrategy(times) {
        if (times > 3) {
          console.warn('⚠️ [Redis] Reconnection limit reached. Fallback enabled.');
          return null;
        }
        return Math.min(times * 100, 2000);
      },
    });

    redisClient.on('connect', () => {
      console.log('✅ [Redis] Connected successfully');
    });

    redisClient.on('error', (err) => {
      console.warn('⚠️ [Redis Warning]', err.message);
    });
  } catch (error) {
    console.warn('⚠️ [Redis] Could not initialize client:', error);
  }
} else {
  console.log('ℹ️ [Redis] No REDIS_URL provided; using fast in-memory cache/rate-limiter');
}

// In-memory cache fallback store
const memoryCache = new Map<string, { value: string; expiresAt: number }>();

export const cacheService = {
  async get(key: string): Promise<string | null> {
    if (redisClient) {
      try {
        return await redisClient.get(key);
      } catch {
        // Fallback to memory
      }
    }
    const item = memoryCache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      memoryCache.delete(key);
      return null;
    }
    return item.value;
  },

  async set(key: string, value: string, ttlSeconds: number = 300): Promise<void> {
    if (redisClient) {
      try {
        await redisClient.set(key, value, 'EX', ttlSeconds);
        return;
      } catch {
        // Fallback to memory
      }
    }
    memoryCache.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  },

  async del(key: string): Promise<void> {
    if (redisClient) {
      try {
        await redisClient.del(key);
      } catch {}
    }
    memoryCache.delete(key);
  },
};

export default redisClient;
