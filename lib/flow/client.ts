import { z } from "zod";
import { signFlowParams } from "@/lib/flow/signature";

const paymentStatusSchema = z.object({
  flowOrder: z.union([z.number(), z.string()]),
  commerceOrder: z.string().min(1),
  status: z.coerce.number().int(),
  payer: z.string().optional(),
  amount: z.coerce.number().optional(),
});

const flowErrorSchema = z.object({
  code: z.coerce.number(),
  message: z.string(),
});

const paymentCreateSchema = z.object({
  flowOrder: z.union([z.number(), z.string()]),
  url: z.string().url(),
  token: z.string().min(1),
});

export type FlowPaymentStatus = z.infer<typeof paymentStatusSchema>;
export type FlowPaymentCreate = z.infer<typeof paymentCreateSchema>;

function flowBaseUrl(): string {
  const base = process.env.FLOW_BASE_URL?.trim() || "https://sandbox.flow.cl/api";
  return base.replace(/\/$/, "");
}

function flowCredentials(): { apiKey: string; secret: string } {
  const apiKey = process.env.FLOW_API_KEY?.trim();
  const secret = process.env.FLOW_SECRET_KEY?.trim();
  if (!apiKey || !secret) {
    throw new Error("Faltan FLOW_API_KEY o FLOW_SECRET_KEY");
  }
  return { apiKey, secret };
}

export async function getFlowPaymentStatus(token: string): Promise<FlowPaymentStatus> {
  const { apiKey, secret } = flowCredentials();
  const params = { apiKey, token };
  const body = new URLSearchParams({ ...params, s: signFlowParams(params, secret) });
  const response = await fetch(`${flowBaseUrl()}/payment/getStatus`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });
  const json: unknown = await response.json().catch(() => null);
  const error = flowErrorSchema.safeParse(json);
  if (!response.ok || error.success) {
    const detail = error.success ? error.data.message : `HTTP ${response.status}`;
    throw new Error(`Flow rechazó la consulta del pago: ${detail}`);
  }
  const parsed = paymentStatusSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error("Flow respondió un estado de pago inválido");
  }
  return parsed.data;
}

export async function createFlowPayment(input: {
  commerceOrder: string;
  subject: string;
  amountCLP: number;
  email: string;
  urlReturn: string;
  urlConfirmation: string;
  optional?: Record<string, string>;
}): Promise<FlowPaymentCreate> {
  const { apiKey, secret } = flowCredentials();
  const confirmation = input.urlConfirmation.trim() || process.env.FLOW_WEBHOOK_URL?.trim();
  if (!confirmation) {
    throw new Error("Falta FLOW_WEBHOOK_URL");
  }
  const params: Record<string, string> = {
    apiKey,
    commerceOrder: input.commerceOrder,
    subject: input.subject,
    amount: String(Math.round(input.amountCLP)),
    email: input.email,
    paymentMethod: "9",
    urlConfirmation: confirmation,
    urlReturn: input.urlReturn,
  };
  if (input.optional && Object.keys(input.optional).length > 0) {
    params.optional = JSON.stringify(input.optional);
  }
  params.s = signFlowParams(params, secret);
  const response = await fetch(`${flowBaseUrl()}/payment/create`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params),
    cache: "no-store",
  });
  const json: unknown = await response.json().catch(() => null);
  const error = flowErrorSchema.safeParse(json);
  if (!response.ok || error.success) {
    const detail = error.success ? error.data.message : `HTTP ${response.status}`;
    throw new Error(`Flow rechazó crear el pago: ${detail}`);
  }
  const parsed = paymentCreateSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error("Flow respondió una intención de pago inválida");
  }
  return parsed.data;
}
