import { randomUUID } from "node:crypto";
import { getRedisClient } from "@/lib/redis/client";

const LOCK_TTL_SECONDS = 30;

export async function withMatchLock<T>(matchId: string, fn: () => Promise<T>): Promise<T> {
  const redis = await getRedisClient();
  if (!redis) return fn();

  const key = `lock:match:${matchId}`;
  const token = randomUUID();
  const acquired = await redis.set(key, token, { NX: true, EX: LOCK_TTL_SECONDS });
  if (acquired !== "OK") {
    throw new Error("El partido está ocupado. Intenta de nuevo en unos segundos.");
  }

  try {
    return await fn();
  } finally {
    const current = await redis.get(key);
    if (current === token) {
      await redis.del(key);
    }
  }
}
