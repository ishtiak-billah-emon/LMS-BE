import { getRedisClient } from "../config/redis.js";

const safely = async (operation, fallback = null) => {
  try {
    const client = getRedisClient();
    return client ? await operation(client) : fallback;
  } catch (error) {
    // Cache failures must never make the API unavailable.
    console.error("[redis] cache operation failed:", error.message);
    return fallback;
  }
};

export const getCachedJson = async (key) => {
  const value = await safely((client) => client.get(key));
  if (!value) return null;

  try {
    return JSON.parse(value);
  } catch {
    await deleteCache(key);
    return null;
  }
};

export const setCachedJson = (key, value, ttlSeconds) =>
  safely((client) =>
    client.set(key, JSON.stringify(value), {
      expiration: { type: "EX", value: ttlSeconds },
    })
  );

export const deleteCache = (...keys) => {
  const validKeys = keys.flat().filter(Boolean);
  if (!validKeys.length) return Promise.resolve(0);
  return safely((client) => client.del(validKeys), 0);
};

export const getCacheVersion = async (namespace) =>
  (await safely((client) => client.get(`lms:${namespace}:version`), "0")) || "0";

export const bumpCacheVersion = (namespace) =>
  safely((client) => client.incr(`lms:${namespace}:version`), 0);
