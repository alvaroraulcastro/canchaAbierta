"use server";

import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth/require-admin";
import { sendEmail } from "@/lib/email/client";
import { appendAuditEntry } from "@/lib/sheets/repos/audit";
import { getInscription, setInscriptionAdminApproved } from "@/lib/sheets/repos/inscriptions";
import { createNotification } from "@/lib/sheets/repos/notifications";
import { inscriptionsTag, SHEET_TAGS } from "@/lib/sheets/tags";

const overbookSchema = z.object({
  inscriptionId: z.string().trim().min(1),
  matchId: z.string().trim().min(1),
  approved: z.enum(["true", "false"]),
});

export async function decideOverbook(formData: FormData): Promise<void> {
  const admin = await getAdminSession();
  if (!admin) throw new Error("No autorizado");

  const parsed = overbookSchema.safeParse({
    inscriptionId: formData.get("inscriptionId"),
    matchId: formData.get("matchId"),
    approved: formData.get("approved"),
  });
  if (!parsed.success) {
    throw new Error(parsed.error.errors[0]?.message ?? "Datos inválidos");
  }

  const approved = parsed.data.approved === "true";
  try {
    const before = await setInscriptionAdminApproved(parsed.data.inscriptionId, approved);
    if (!before) throw new Error("Inscripción no encontrada");
    if (!before.overbookRequested) {
      throw new Error("Esta inscripción no es un sobrecupo");
    }
    await appendAuditEntry({
      adminEmail: admin.email,
      action: "update",
      entity: "inscription",
      entityId: parsed.data.inscriptionId,
      before: { adminApproved: before.adminApproved },
      after: { adminApproved: approved },
    });
    const link = `/partidos/${encodeURIComponent(parsed.data.matchId)}`;
    if (approved) {
      const title = "Sobrecupo aprobado";
      const body = "El administrador confirmó tu cupo extra en el partido.";
      await createNotification({
        recipientEmail: before.playerEmail,
        type: "overbook_approved",
        title,
        body,
        link,
      });
      try {
        await sendEmail({ to: before.playerEmail, subject: title, text: `${body} ${link}` });
      } catch (error) {
        console.error("No se pudo enviar email de sobrecupo", error);
      }
    }
    revalidateTag(SHEET_TAGS.Inscripciones);
    revalidateTag(SHEET_TAGS.AdminAudit);
    revalidateTag(inscriptionsTag(parsed.data.matchId));
    redirect(
      `/admin/partidos/${encodeURIComponent(parsed.data.matchId)}/inscripciones?ok=1`,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo actualizar la inscripción";
    throw new Error(message);
  }
}

export async function markAttendance(formData: FormData): Promise<void> {
  const admin = await getAdminSession();
  if (!admin) throw new Error("No autorizado");

  const inscriptionId = String(formData.get("inscriptionId") ?? "").trim();
  const matchId = String(formData.get("matchId") ?? "").trim();
  if (!inscriptionId || !matchId) throw new Error("Datos incompletos");

  const inscription = await getInscription(inscriptionId);
  if (!inscription || inscription.matchId !== matchId) {
    throw new Error("Inscripción no encontrada");
  }
  if (inscription.paymentStatus !== "paid") {
    throw new Error("Solo inscripciones pagadas");
  }

  await appendAuditEntry({
    adminEmail: admin.email,
    action: "update",
    entity: "inscription",
    entityId: inscriptionId,
    before: null,
    after: { attendanceMarked: true, at: new Date().toISOString() },
  });
  revalidateTag(SHEET_TAGS.AdminAudit);
  redirect(`/admin/partidos/${encodeURIComponent(matchId)}/inscripciones?ok=1`);
}
