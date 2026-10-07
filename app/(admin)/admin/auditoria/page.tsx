import type { Metadata } from "next";
import { listAudit } from "@/lib/sheets/repos/audit";
import { formatShortDate } from "@/lib/time";

export const metadata: Metadata = {
  title: "Auditoría",
};

export default async function AdminAuditPage() {
  const entries = await listAudit();
  const sorted = [...entries].sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));

  return (
    <section className="flex flex-col gap-3">
      <p className="text-sm text-muted">Últimos cambios registrados desde el panel admin.</p>
      <ul className="flex flex-col gap-2">
        {sorted.length === 0 ? (
          <li className="text-sm text-muted">Aún no hay registros.</li>
        ) : (
          sorted.slice(0, 100).map((entry, index) => (
            <li key={`${entry.timestamp}-${entry.entityId}-${index}`} className="rounded-2xl border border-line bg-card p-4 text-sm">
              <p className="font-medium">
                {entry.action} · {entry.entity} · {entry.entityId}
              </p>
              <p className="text-muted">
                {formatShortDate(entry.timestamp)} · {entry.adminEmail}
              </p>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
