import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CourtView } from "@/lib/catalog";
import { formatCLP, sportLabel } from "@/lib/format";
import { courtHref } from "@/lib/routes";

function safePhoto(url: string): string | undefined {
  if (!/^https?:\/\//.test(url)) return undefined;
  if (/["'()]/.test(url)) return undefined;
  return url;
}

export function CourtCard({ court }: { court: CourtView }) {
  const photo = safePhoto(court.photoUrl);
  return (
    <Card className="overflow-hidden">
      <div
        className="h-36 bg-brand-200 bg-cover bg-center"
        style={photo ? { backgroundImage: `url("${photo}")` } : undefined}
        role={photo ? "img" : undefined}
        aria-label={photo ? court.name : undefined}
        aria-hidden={photo ? undefined : true}
      />
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="min-w-0 flex-1">
            <Link
              href={courtHref(court.id)}
              className="rounded-sm hover:text-link focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            >
              {court.name}
            </Link>
          </CardTitle>
          <Badge>{sportLabel(court.sport)}</Badge>
        </div>
        <p className="text-sm text-muted">{court.venueName}</p>
      </CardHeader>
      <CardContent className="pt-3">
        <p className="text-sm">{formatCLP(court.priceCLP)} por jugador</p>
        <p className="mt-1 text-sm text-muted">
          {court.capacity} jugadores
        </p>
      </CardContent>
    </Card>
  );
}
