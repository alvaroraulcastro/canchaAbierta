import { getAllowedAdminEmails } from "@/lib/auth/admins";
import { renderInscriptionConfirmedEmail } from "@/emails/inscription-confirmed";
import { sendEmail } from "@/lib/email/client";
import { getMatchView } from "@/lib/catalog";
import { getFlowPaymentStatus } from "@/lib/flow/client";
import { createLogger } from "@/lib/logger";
import { getPlayer } from "@/lib/sheets/repos/players";
import { syncInscriptionPayment } from "@/lib/sheets/repos/inscriptions";
import { incrementMatchPlayers } from "@/lib/sheets/repos/matches";
import { createNotification } from "@/lib/sheets/repos/notifications";
import type { PaymentStatus } from "@/lib/sheets/schemas";
import { formatMatchDateTime } from "@/lib/time";

const logger = createLogger("flow/confirm-payment");

const FLOW_TO_PAYMENT: Record<number, PaymentStatus> = {
  1: "pending",
  2: "paid",
  3: "failed",
  4: "cancelled",
};

export type ConfirmedPayment = {
  paymentStatus: PaymentStatus;
  matchId: string;
  changed: boolean;
};

export async function confirmFlowPayment(token: string): Promise<ConfirmedPayment | { missing: true }> {
  const payment = await getFlowPaymentStatus(token);
  const paymentStatus = FLOW_TO_PAYMENT[payment.status];
  if (!paymentStatus) {
    throw new Error(`Estado de Flow no soportado: ${payment.status}`);
  }

  const synced = await syncInscriptionPayment({
    token,
    commerceOrder: payment.commerceOrder,
    flowOrderId: String(payment.flowOrder),
    paymentStatus,
  });
  if (!synced.found) return { missing: true };

  const becamePaid = synced.previousStatus !== "paid" && paymentStatus === "paid";
  if (becamePaid) {
    try {
      await incrementMatchPlayers(synced.matchId);
    } catch (error) {
      await syncInscriptionPayment({
        token,
        commerceOrder: payment.commerceOrder,
        flowOrderId: String(payment.flowOrder),
        paymentStatus: synced.previousStatus,
      });
      throw error;
    }
    await notifyPaid(synced.playerEmail, synced.matchId);
    if (synced.overbookRequested) {
      await notifyOverbookAdmins(synced.matchId, synced.playerEmail);
    }
  }

  return { paymentStatus, matchId: synced.matchId, changed: synced.changed || becamePaid };
}

async function notifyOverbookAdmins(matchId: string, playerEmail: string): Promise<void> {
  const link = `/admin/partidos/${encodeURIComponent(matchId)}/inscripciones`;
  const title = "Sobrecupo pendiente de aprobación";
  const body = `El jugador ${playerEmail} pagó un cupo extra en el partido ${matchId}.`;
  for (const adminEmail of getAllowedAdminEmails()) {
    try {
      await createNotification({
        recipientEmail: adminEmail,
        type: "overbook_pending",
        title,
        body,
        link,
      });
    } catch (error) {
      logger.error("No se pudo notificar al admin", error, { adminEmail, matchId });
    }
  }
}

async function notifyPaid(email: string, matchId: string): Promise<void> {
  const link = `/partidos/${encodeURIComponent(matchId)}`;
  const title = "Inscripción confirmada";
  const body = "Tu inscripción quedó pagada.";
  try {
    await createNotification({
      recipientEmail: email,
      type: "inscription_confirmed",
      title,
      body,
      link,
    });
  } catch (error) {
    logger.error("No se pudo crear la notificación in-app", error, { email, matchId });
  }
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() ?? "";
  const match = await getMatchView(matchId);
  const player = await getPlayer(email);
  const playerName = player?.name?.trim() || email;
  const matchTitle = match
    ? `${match.courtName} · ${match.venueName}`
    : `Partido ${matchId}`;
  const matchWhen = match ? formatMatchDateTime(match.dateTime) : "";
  const text = `${body} ${siteUrl ? `${siteUrl.replace(/\/$/, "")}${link}` : link}`;
  let html: string | undefined;
  if (siteUrl) {
    try {
      html = await renderInscriptionConfirmedEmail({
        playerName,
        matchTitle,
        matchWhen,
        siteUrl,
        matchPath: link,
      });
    } catch (error) {
      logger.error("No se pudo renderizar el email", error, { email, matchId });
    }
  }
  try {
    await sendEmail({ to: email, subject: title, text, html });
  } catch (error) {
    logger.error("No se pudo enviar el email de pago", error, { email, matchId });
  }
}
