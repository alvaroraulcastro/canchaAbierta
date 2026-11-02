import { createHmac, timingSafeEqual } from "node:crypto";

function signingSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET no configurado");
  return secret;
}

export function createCheckInToken(input: { inscriptionId: string; expMs: number }): string {
  const payload = JSON.stringify({ inscriptionId: input.inscriptionId, exp: input.expMs });
  const payloadB64 = Buffer.from(payload, "utf8").toString("base64url");
  const sig = createHmac("sha256", signingSecret()).update(payloadB64).digest("base64url");
  return `${payloadB64}.${sig}`;
}

export function verifyCheckInToken(token: string): { inscriptionId: string } | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const payloadB64 = parts[0];
  const sig = parts[1];
  if (!payloadB64 || !sig) return null;
  const expected = createHmac("sha256", signingSecret()).update(payloadB64).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8")) as {
      inscriptionId?: string;
      exp?: number;
    };
    if (!payload.inscriptionId || typeof payload.exp !== "number") return null;
    if (Date.now() > payload.exp) return null;
    return { inscriptionId: payload.inscriptionId };
  } catch {
    return null;
  }
}

export function checkInTokenExpiryMs(dateTimeIso: string, durationMin: number): number {
  const start = Date.parse(dateTimeIso);
  const end = start + durationMin * 60_000;
  const hoursAfter = 3;
  return end + hoursAfter * 60 * 60 * 1000;
}
