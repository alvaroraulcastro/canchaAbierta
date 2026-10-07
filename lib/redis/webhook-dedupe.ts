import { getRedisClient } from "@/lib/redis/client";

const TTL_SECONDS = 86_400;

export async function markFlowWebhookProcessed(token: string): Promise<boolean> {
  const redis = await getRedisClient();
  if (!redis) return true;
  const key = `flow:webhook:${token}`;
  const result = await redis.set(key, "1", { NX: true, EX: TTL_SECONDS });
  return result === "OK";
}
