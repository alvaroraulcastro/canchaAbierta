"use server";

import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth/require-admin";
import { rethrowNavigationError } from "@/lib/rethrow-navigation";
import { sendEmail } from "@/lib/email/client";
import { createLogger } from "@/lib/logger";
import { appendAuditEntry } from "@/lib/sheets/repos/audit";
import { getInscription, setInscriptionAdminApproved } from "@/lib/sheets/repos/inscriptions";
import { createNotification } from "@/lib/sheets/repos/notifications";
import { parseAttendanceFormData } from "@/lib/search-params";
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
        createLogger("admin/inscriptions").error("No se pudo enviar email de sobrecupo", error, {
          playerEmail: before.playerEmail,
          inscriptionId: parsed.data.inscriptionId,
        });
      }
    }
    revalidateTag(SHEET_TAGS.Inscripciones);
    revalidateTag(SHEET_TAGS.AdminAudit);
    revalidateTag(inscriptionsTag(parsed.data.matchId));
  } catch (error) {
    rethrowNavigationError(error);
    const message = error instanceof Error ? error.message : "No se pudo actualizar la inscripción";
    throw new Error(message);
  }
  redirect(`/admin/partidos/${encodeURIComponent(parsed.data.matchId)}/inscripciones?ok=1`);
}

export async function markAttendance(formData: FormData): Promise<void> {
  const admin = await getAdminSession();
  if (!admin) throw new Error("No autorizado");

  const data = parseAttendanceFormData(formData);
  if (!data) throw new Error("Datos incompletos");

  const inscription = await getInscription(data.inscriptionId);
  if (!inscription || inscription.matchId !== data.matchId) {
    throw new Error("Inscripción no encontrada");
  }
  if (inscription.paymentStatus !== "paid") {
    throw new Error("Solo inscripciones pagadas");
  }

  await appendAuditEntry({
    adminEmail: admin.email,
    action: "update",
    entity: "inscription",
    entityId: data.inscriptionId,
    before: null,
    after: { attendanceMarked: true, at: new Date().toISOString() },
  });
  revalidateTag(SHEET_TAGS.AdminAudit);
  redirect(`/admin/partidos/${encodeURIComponent(data.matchId)}/inscripciones?ok=1`);
}
