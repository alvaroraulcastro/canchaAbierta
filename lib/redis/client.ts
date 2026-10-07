import { createClient, type RedisClientType } from "redis";

let client: RedisClientType | undefined;
let connectPromise: Promise<RedisClientType | null> | undefined;

export function redisConfigured(): boolean {
  return Boolean(process.env.KV_REDIS_URL?.trim());
}

export async function getRedisClient(): Promise<RedisClientType | null> {
  const url = process.env.KV_REDIS_URL?.trim();
  if (!url) return null;
  if (client?.isOpen) return client;
  if (connectPromise) return connectPromise;

  connectPromise = (async () => {
    const next = createClient({ url });
    next.on("error", (error) => {
      console.error("Redis error", error);
    });
    await next.connect();
    client = next as RedisClientType;
    return client;
  })().catch((error) => {
    connectPromise = undefined;
    console.error("No se pudo conectar a Redis", error);
    return null;
  });

  return connectPromise;
}
