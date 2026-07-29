import { createClient } from "redis";

let redisClient = null;

export const connectRedis = async () => {
  if (!process.env.REDIS_URL) {
    console.warn("[redis] REDIS_URL is not configured; caching is disabled.");
    return null;
  }

  if (redisClient?.isReady) return redisClient;

  try {
    redisClient ??= createClient({
      url: process.env.REDIS_URL,
      // This local Redis-compatible server does not implement Redis 6's HELLO
      // command. RESP2 uses the older handshake and remains fully sufficient
      // for this application's string-key cache operations.
      RESP: 2,
      socket: {
        connectTimeout: 2000,
        reconnectStrategy: (retries) =>
          retries > 3
            ? new Error("Redis reconnection limit reached")
            : Math.min(retries * 100, 1000),
      },
    });

    redisClient.on("error", (error) => {
      console.error("[redis] client error:", error.message);
    });

    if (!redisClient.isOpen) await redisClient.connect();

    // console.log("Redis connected.");
    return redisClient;
  } catch (error) {
    // console.error("[redis] connection failed; caching is disabled:", error.message);
    return null;
  }
};

export const getRedisClient = () => redisClient?.isReady ? redisClient : null;

export const closeRedis = async () => {
  if (redisClient?.isOpen) await redisClient.close();
};
