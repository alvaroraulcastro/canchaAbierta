"use server";

import { randomUUID } from "node:crypto";
import { fromZonedTime } from "date-fns-tz";
import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth/require-admin";
import { sendEmail } from "@/lib/email/client";
import { createLogger } from "@/lib/logger";
import { appendAuditEntry } from "@/lib/sheets/repos/audit";
import { getCourt } from "@/lib/sheets/repos/courts";
import { listInscriptionsByMatch } from "@/lib/sheets/repos/inscriptions";
import { createMatchRow, updateMatchFields } from "@/lib/sheets/repos/matches";
import { createNotification } from "@/lib/sheets/repos/notifications";
import { MATCH_STATUS_VALUES } from "@/lib/sheets/schemas";
import { matchTag, SHEET_TAGS } from "@/lib/sheets/tags";
import { APP_TZ, formatMatchDateTime, isoFromSantiago } from "@/lib/time";

const matchFormSchema = z.object({
  courtId: z.string().trim().min(1),
  dateTimeLocal: z.string().trim().min(1),
  durationMin: z.coerce.number().int().min(30).max(240),
  maxPlayers: z.coerce.number().int().min(2).max(30),
  allowOverbook: z.union([z.literal("on"), z.literal("")]).optional(),
  requiresExtraConfirmation: z.union([z.literal("on"), z.literal("")]).optional(),
});

function parseSantiagoLocal(value: string): string {
  const normalized = value.length === 16 ? `${value}:00` : value;
  const asUtc = fromZonedTime(normalized, APP_TZ);
  return isoFromSantiago(asUtc);
}

function boolFromForm(value: string | undefined): boolean {
  return value === "on";
}

export async function createMatch(formData: FormData): Promise<void> {
  const admin = await getAdminSession();
  if (!admin) throw new Error("No autorizado");

  const parsed = matchFormSchema.safeParse({
    courtId: formData.get("courtId"),
    dateTimeLocal: formData.get("dateTimeLocal"),
    durationMin: formData.get("durationMin"),
    maxPlayers: formData.get("maxPlayers"),
    allowOverbook: formData.get("allowOverbook"),
    requiresExtraConfirmation: formData.get("requiresExtraConfirmation"),
  });
  if (!parsed.success) {
    throw new Error(parsed.error.errors[0]?.message ?? "Datos inválidos");
  }

  const court = await getCourt(parsed.data.courtId);
  if (!court || !court.active) throw new Error("Cancha no disponible");

  const id = randomUUID();
  const now = new Date().toISOString();
  const input = {
    id,
    courtId: parsed.data.courtId,
    dateTime: parseSantiagoLocal(parsed.data.dateTimeLocal),
    durationMin: parsed.data.durationMin,
    maxPlayers: parsed.data.maxPlayers,
    currentPlayers: 0,
    allowOverbook: boolFromForm(parsed.data.allowOverbook),
    requiresExtraConfirmation: boolFromForm(parsed.data.requiresExtraConfirmation),
    status: "open" as const,
    createdBy: admin.email,
    createdAt: now,
  };

  try {
    await createMatchRow(input);
    await appendAuditEntry({
      adminEmail: admin.email,
      action: "create",
      entity: "match",
      entityId: id,
      before: null,
      after: { ...input },
    });
    revalidateTag(SHEET_TAGS.Partidos);
    revalidateTag(SHEET_TAGS.AdminAudit);
    revalidateTag(matchTag(id));
    redirect("/admin/partidos?ok=1");
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo crear el partido";
    throw new Error(message);
  }
}

const statusSchema = z.object({
  matchId: z.string().trim().min(1),
  status: z.enum(MATCH_STATUS_VALUES),
});

export async function setMatchStatus(formData: FormData): Promise<void> {
  const admin = await getAdminSession();
  if (!admin) throw new Error("No autorizado");

  const parsed = statusSchema.safeParse({
    matchId: formData.get("matchId"),
    status: formData.get("status"),
  });
  if (!parsed.success) {
    throw new Error(parsed.error.errors[0]?.message ?? "Datos inválidos");
  }

  try {
    const before = await updateMatchFields(parsed.data.matchId, { status: parsed.data.status });
    if (!before) throw new Error("Partido no encontrado");
    await appendAuditEntry({
      adminEmail: admin.email,
      action: "update",
      entity: "match",
      entityId: parsed.data.matchId,
      before: { status: before.status },
      after: { status: parsed.data.status },
    });
    if (parsed.data.status === "cancelled") {
      await notifyMatchCancelled(parsed.data.matchId, before.dateTime);
    }
    revalidateTag(SHEET_TAGS.Partidos);
    revalidateTag(SHEET_TAGS.AdminAudit);
    revalidateTag(matchTag(parsed.data.matchId));
    redirect(`/admin/partidos?ok=1`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo actualizar el partido";
    throw new Error(message);
  }
}

async function notifyMatchCancelled(matchId: string, dateTimeIso: string): Promise<void> {
  const when = formatMatchDateTime(dateTimeIso);
  const link = `/partidos/${encodeURIComponent(matchId)}`;
  const title = "Partido cancelado";
  const body = `El partido del ${when} fue cancelado.`;
  const inscriptions = await listInscriptionsByMatch(matchId);
  const emails = new Set(
    inscriptions
      .filter((row) => row.paymentStatus === "paid")
      .map((row) => row.playerEmail.toLowerCase()),
  );
  for (const email of emails) {
    try {
      await createNotification({
        recipientEmail: email,
        type: "match_cancelled",
        title,
        body,
        link,
      });
    } catch (error) {
      createLogger("admin/matches").error("No se pudo notificar cancelación in-app", error, { matchId });
    }
    try {
      await sendEmail({ to: email, subject: title, text: `${body} ${link}` });
    } catch (error) {
      createLogger("admin/matches").error("No se pudo enviar email de cancelación", error, { matchId, email });
    }
  }
}
