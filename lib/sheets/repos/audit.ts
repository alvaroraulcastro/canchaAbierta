import { cache } from "react";
import { unstable_cache } from "next/cache";
import { auditSchema, parseRows, type AuditEntry } from "@/lib/sheets/schemas";
import { readSheet } from "@/lib/sheets/read";
import { CACHE_REVALIDATE_SECONDS, SHEET_TAGS } from "@/lib/sheets/tags";

async function loadAudit(): Promise<AuditEntry[]> {
  const rows = await readSheet("AdminAudit");
  return parseRows("AdminAudit", rows, auditSchema);
}

const readAudit = unstable_cache(loadAudit, ["sheet:audit"], {
  tags: [SHEET_TAGS.AdminAudit],
  revalidate: CACHE_REVALIDATE_SECONDS,
});

export const listAudit = cache(async (): Promise<AuditEntry[]> => readAudit());
