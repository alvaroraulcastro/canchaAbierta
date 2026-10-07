import { createHmac, timingSafeEqual } from "node:crypto";

export function signFlowParams(params: Record<string, string>, secret: string): string {
  const payload = Object.keys(params)
    .filter((key) => key !== "s")
    .sort()
    .map((key) => `${key}${params[key] ?? ""}`)
    .join("");
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function verifyFlowSignature(params: Record<string, string>, secret: string): boolean {
  const provided = params.s;
  if (!provided || !secret) return false;
  const expected = signFlowParams(params, secret);
  const providedBuffer = Buffer.from(provided.toLowerCase());
  const expectedBuffer = Buffer.from(expected.toLowerCase());
  if (providedBuffer.length !== expectedBuffer.length) return false;
  return timingSafeEqual(providedBuffer, expectedBuffer);
}
