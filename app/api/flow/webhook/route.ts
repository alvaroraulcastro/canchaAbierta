import { revalidateTag } from "next/cache";
import { z } from "zod";
import { confirmFlowPayment } from "@/lib/flow/confirm-payment";
import { verifyFlowSignature } from "@/lib/flow/signature";
import { markFlowWebhookProcessed } from "@/lib/redis/webhook-dedupe";
import { inscriptionsTag, matchTag, SHEET_TAGS } from "@/lib/sheets/tags";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const webhookSchema = z.object({
  token: z.string().min(1),
});

async function readParams(request: Request): Promise<Record<string, string>> {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const json: unknown = await request.json().catch(() => null);
    const record = z.record(z.string(), z.union([z.string(), z.number()])).safeParse(json);
    if (!record.success) return {};
    return Object.fromEntries(
      Object.entries(record.data).map(([key, value]) => [key, String(value)]),
    );
  }
  const params = new URLSearchParams(await request.text());
  return Object.fromEntries(params.entries());
}

export function GET() {
  return Response.json({ ok: true, endpoint: "/api/flow/webhook" });
}

export async function POST(request: Request) {
  const params = await readParams(request);
  const secret = process.env.FLOW_SECRET_KEY?.trim();
  if (params.s) {
    if (!secret || !verifyFlowSignature(params, secret)) {
      return Response.json({ ok: false, error: "Firma inválida" }, { status: 401 });
    }
  }

  const parsed = webhookSchema.safeParse(params);
  if (!parsed.success) {
    return Response.json({ ok: false, error: "Falta el token de Flow" }, { status: 400 });
  }

  try {
    const firstTime = await markFlowWebhookProcessed(parsed.data.token);
    if (!firstTime) {
      return Response.json({ ok: true, duplicate: true });
    }
    const result = await confirmFlowPayment(parsed.data.token);
    if ("missing" in result) {
      return Response.json({ ok: false, error: "Inscripción no encontrada" }, { status: 404 });
    }
    revalidateTag(SHEET_TAGS.Inscripciones);
    revalidateTag(SHEET_TAGS.Partidos);
    revalidateTag(inscriptionsTag(result.matchId));
    revalidateTag(matchTag(result.matchId));
    revalidateTag(SHEET_TAGS.Notificaciones);
    return Response.json({ ok: true, paymentStatus: result.paymentStatus });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo confirmar el pago";
    const status = message.startsWith("Faltan FLOW_") ? 500 : 502;
    return Response.json({ ok: false, error: message }, { status });
  }
}
