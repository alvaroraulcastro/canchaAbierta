"use server";

import { randomUUID } from "node:crypto";
import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth/config";
import { createFlowPayment } from "@/lib/flow/client";
import { withMatchLock } from "@/lib/locks/match-lock";
import { getMatchView } from "@/lib/catalog";
import {
  countPaidInscriptionsForMatch,
  createPendingInscription,
  findActiveInscription,
} from "@/lib/sheets/repos/inscriptions";
import { getPlayer } from "@/lib/sheets/repos/players";
import { inscriptionsTag, matchTag, SHEET_TAGS } from "@/lib/sheets/tags";

const matchIdSchema = z.string().trim().min(1);

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
}

export async function inscribirse(formData: FormData): Promise<void> {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) {
    redirect("/auth/signin?callbackUrl=/partidos");
  }

  const parsedId = matchIdSchema.safeParse(formData.get("matchId"));
  if (!parsedId.success) {
    redirect("/partidos?error=inscripcion");
  }
  const matchId = parsedId.data;

  const player = await getPlayer(email);
  if (!player?.phone?.trim() || !player.name?.trim()) {
    redirect(`/cuenta/perfil?callbackUrl=${encodeURIComponent(`/partidos/${matchId}`)}`);
  }

  const match = await getMatchView(matchId);
  if (!match || match.status !== "open") {
    redirect(`/partidos/${matchId}?error=partido`);
  }

  await withMatchLock(matchId, async () => {
    const existing = await findActiveInscription(matchId, email);
    if (existing?.paymentStatus === "paid") {
      redirect("/cuenta/mis-inscripciones");
    }
    if (existing?.paymentStatus === "pending") {
      redirect("/cuenta/mis-inscripciones?estado=pending");
    }

    const paidCount = await countPaidInscriptionsForMatch(matchId);
    const full = paidCount >= match.maxPlayers;
    if (full && !match.allowOverbook) {
      redirect(`/partidos/${matchId}?error=cupo`);
    }
    const overbookRequested = full && match.allowOverbook;

    const subject = `Inscripción ${match.courtName} · canchaAbierta`;
    const inscriptionId = randomUUID();
    const payment = await createFlowPayment({
      commerceOrder: inscriptionId,
      subject,
      amountCLP: match.priceCLP,
      email,
      urlReturn: `${siteUrl()}/cuenta/mis-inscripciones?inscripcion=${inscriptionId}`,
      urlConfirmation: process.env.FLOW_WEBHOOK_URL ?? "",
      optional: { matchId, inscriptionId },
    });

    await createPendingInscription({
      id: inscriptionId,
      matchId,
      playerEmail: email,
      amountCLP: match.priceCLP,
      flowToken: payment.token,
      flowOrderId: String(payment.flowOrder),
      overbookRequested,
    });

    revalidateTag(SHEET_TAGS.Inscripciones);
    revalidateTag(inscriptionsTag(matchId));
    revalidateTag(matchTag(matchId));

    redirect(payment.url);
  });
}
