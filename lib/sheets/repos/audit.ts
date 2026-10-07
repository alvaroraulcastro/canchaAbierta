import { cache } from "react";
import { unstable_cache } from "next/cache";
import {
  auditSchema,
  parseRows,
  type AuditEntry,
  AUDIT_ACTION_VALUES,
  AUDIT_ENTITY_VALUES,
} from "@/lib/sheets/schemas";
import { appendSheetRow } from "@/lib/sheets/mutate";
import { readSheet } from "@/lib/sheets/read";
import { CACHE_REVALIDATE_SECONDS, SHEET_TAGS } from "@/lib/sheets/tags";

export type AuditAction = (typeof AUDIT_ACTION_VALUES)[number];
export type AuditEntity = (typeof AUDIT_ENTITY_VALUES)[number];

async function loadAudit(): Promise<AuditEntry[]> {
  const rows = await readSheet("AdminAudit");
  return parseRows("AdminAudit", rows, auditSchema);
}

const readAudit = unstable_cache(loadAudit, ["sheet:audit"], {
  tags: [SHEET_TAGS.AdminAudit],
  revalidate: CACHE_REVALIDATE_SECONDS,
});

export const listAudit = cache(async (): Promise<AuditEntry[]> => readAudit());

export async function appendAuditEntry(input: {
  adminEmail: string;
  action: AuditAction;
  entity: AuditEntity;
  entityId: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
}): Promise<void> {
  const now = new Date().toISOString();
  await appendSheetRow("AdminAudit", [
    now,
    input.adminEmail.trim().toLowerCase(),
    input.action,
    input.entity,
    input.entityId,
    input.before ? JSON.stringify(input.before) : "",
    input.after ? JSON.stringify(input.after) : "",
  ]);
}
