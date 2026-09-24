import { Request, Response, NextFunction } from 'express';
import redisClient from '../config/redis';

// Sliding-window in-memory fallback store
const inMemoryHits = new Map<string, number[]>();

export const rateLimiter = (maxRequests: number = 10, windowSeconds: number = 60) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const key = `ratelimit:${req.vendorId || req.ip}`;
    const now = Date.now();
    const windowMs = windowSeconds * 1000;

    if (redisClient) {
      try {
        const windowStart = now - windowMs;
        const pipeline = redisClient.pipeline();
        
        // Remove timestamps older than the window
        pipeline.zremrangebyscore(key, 0, windowStart);
        // Add current timestamp
        pipeline.zadd(key, now, `${now}-${Math.random()}`);
        // Count requests in current window
        pipeline.zcard(key);
        // Set expiry on key
        pipeline.expire(key, windowSeconds);

        const results = await pipeline.exec();
        const count = (results?.[2]?.[1] as number) || 0;

        if (count > maxRequests) {
          res.status(429).json({
            success: false,
            error: `Rate limit exceeded. Maximum ${maxRequests} requests per ${windowSeconds}s.`,
          });
          return;
        }

        return next();
      } catch {
        // Fallback to in-memory if Redis error occurs
      }
    }

    // In-Memory sliding-window rate limiter
    const timestamps = inMemoryHits.get(key) || [];
    const validTimestamps = timestamps.filter((t) => now - t < windowMs);

    if (validTimestamps.length >= maxRequests) {
      res.status(429).json({
        success: false,
        error: `Rate limit exceeded. Maximum ${maxRequests} requests per ${windowSeconds}s.`,
      });
      return;
    }

    validTimestamps.push(now);
    inMemoryHits.set(key, validTimestamps);
    next();
  };
};
