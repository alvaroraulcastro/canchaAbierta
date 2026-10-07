import { cache } from "react";
import { unstable_cache } from "next/cache";
import { PAYMENT_STATUS_VALUES, inscriptionSchema, parseRows, type Inscription, type PaymentStatus } from "@/lib/sheets/schemas";
import { appendSheetRow, findSheetRowByColumn, updateSheetRow, type SheetLocatedRow } from "@/lib/sheets/mutate";
import { readSheet } from "@/lib/sheets/read";
import { CACHE_REVALIDATE_SECONDS, inscriptionsTag, SHEET_TAGS } from "@/lib/sheets/tags";

async function loadInscriptions(): Promise<Inscription[]> {
  const rows = await readSheet("Inscripciones");
  return parseRows("Inscripciones", rows, inscriptionSchema);
}

const readInscriptions = unstable_cache(loadInscriptions, ["sheet:inscriptions"], {
  tags: [SHEET_TAGS.Inscripciones],
  revalidate: CACHE_REVALIDATE_SECONDS,
});

export const listInscriptions = cache(async (): Promise<Inscription[]> => readInscriptions());

export const listInscriptionsByMatch = cache(async (matchId: string): Promise<Inscription[]> => {
  return unstable_cache(
    async () => {
      const inscriptions = await listInscriptions();
      return inscriptions.filter((inscription) => inscription.matchId === matchId);
    },
    ["sheet:inscriptions:match", matchId],
    {
      tags: [SHEET_TAGS.Inscripciones, inscriptionsTag(matchId)],
      revalidate: CACHE_REVALIDATE_SECONDS,
    },
  )();
});

export const getInscription = cache(async (id: string): Promise<Inscription | null> => {
  const inscriptions = await listInscriptions();
  return inscriptions.find((inscription) => inscription.id === id) ?? null;
});

export const listInscriptionsByPlayer = cache(async (email: string): Promise<Inscription[]> => {
  const inscriptions = await listInscriptions();
  const normalized = email.trim().toLowerCase();
  return inscriptions.filter(
    (inscription) => inscription.playerEmail.toLowerCase() === normalized,
  );
});

export async function countPaidInscriptionsForMatch(matchId: string): Promise<number> {
  const rows = await readSheet("Inscripciones");
  const inscriptions = parseRows("Inscripciones", rows, inscriptionSchema);
  return inscriptions.filter(
    (inscription) => inscription.matchId === matchId && inscription.paymentStatus === "paid",
  ).length;
}

export async function findActiveInscription(
  matchId: string,
  playerEmail: string,
): Promise<Inscription | null> {
  const rows = await readSheet("Inscripciones");
  const inscriptions = parseRows("Inscripciones", rows, inscriptionSchema);
  const normalized = playerEmail.trim().toLowerCase();
  return (
    inscriptions.find(
      (inscription) =>
        inscription.matchId === matchId &&
        inscription.playerEmail.toLowerCase() === normalized &&
        (inscription.paymentStatus === "pending" || inscription.paymentStatus === "paid"),
    ) ?? null
  );
}

export async function createPendingInscription(input: {
  id: string;
  matchId: string;
  playerEmail: string;
  amountCLP: number;
  flowToken: string;
  flowOrderId: string;
  overbookRequested: boolean;
}): Promise<string> {
  const id = input.id;
  const now = new Date().toISOString();
  await appendSheetRow("Inscripciones", [
    id,
    input.matchId,
    input.playerEmail.trim().toLowerCase(),
    input.amountCLP,
    "pending",
    input.flowToken,
    input.flowOrderId,
    input.overbookRequested ? "TRUE" : "FALSE",
    "",
    now,
    now,
  ]);
  return id;
}

function cellText(row: SheetLocatedRow, column: string): string {
  const index = row.headers.indexOf(column);
  if (index < 0) return "";
  const value = row.values[index];
  if (value === undefined || value === null) return "";
  return String(value).trim();
}

function paymentStatusFromCell(value: string): PaymentStatus | null {
  return PAYMENT_STATUS_VALUES.find((status) => status === value) ?? null;
}

export type InscriptionPaymentSync = {
  found: true;
  changed: boolean;
  previousStatus: PaymentStatus;
  paymentStatus: PaymentStatus;
  matchId: string;
  playerEmail: string;
  overbookRequested: boolean;
};

export async function syncInscriptionPayment(input: {
  token: string;
  commerceOrder: string;
  flowOrderId: string;
  paymentStatus: PaymentStatus;
}): Promise<InscriptionPaymentSync | { found: false }> {
  const byToken = input.token
    ? await findSheetRowByColumn("Inscripciones", "flowToken", input.token)
    : null;
  const row =
    byToken ??
    (input.commerceOrder
      ? await findSheetRowByColumn("Inscripciones", "id", input.commerceOrder)
      : null);
  if (!row) return { found: false };

  const previousStatus = paymentStatusFromCell(cellText(row, "paymentStatus"));
  if (!previousStatus) {
    throw new Error("La inscripción tiene un paymentStatus inválido");
  }
  const matchId = cellText(row, "matchId");
  const playerEmail = cellText(row, "playerEmail");
  const overbookCell = cellText(row, "overbookRequested");
  const overbookRequested =
    overbookCell === "TRUE" || overbookCell === "true" || overbookCell === "1";
  if (!matchId || !playerEmail) {
    throw new Error("La inscripción no tiene partido o jugador");
  }

  const currentOrder = cellText(row, "flowOrderId");
  const changed = previousStatus !== input.paymentStatus || currentOrder !== input.flowOrderId;
  if (changed) {
    await updateSheetRow("Inscripciones", row.rowNumber, row.headers, {
      paymentStatus: input.paymentStatus,
      flowToken: input.token,
      flowOrderId: input.flowOrderId,
      updatedAt: new Date().toISOString(),
    });
  }

  return {
    found: true,
    changed,
    previousStatus,
    paymentStatus: input.paymentStatus,
    matchId,
    playerEmail,
    overbookRequested,
  };
}

export async function setInscriptionAdminApproved(
  inscriptionId: string,
  approved: boolean,
): Promise<Inscription | null> {
  const row = await findSheetRowByColumn("Inscripciones", "id", inscriptionId);
  if (!row) return null;
  const before = await getInscription(inscriptionId);
  await updateSheetRow("Inscripciones", row.rowNumber, row.headers, {
    adminApproved: approved ? "TRUE" : "FALSE",
    updatedAt: new Date().toISOString(),
  });
  return before;
}
