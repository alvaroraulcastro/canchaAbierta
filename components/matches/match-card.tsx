import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MatchView } from "@/lib/catalog";
import { formatCLP, matchStatusLabel, spotsLabel, sportLabel } from "@/lib/format";
import { matchHref } from "@/lib/routes";
import { formatShortDate } from "@/lib/time";

export function MatchCard({ match }: { match: MatchView }) {
  const full = match.currentPlayers >= match.maxPlayers;
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>
              <Link href={matchHref(match.id)} className="hover:text-link">
                {match.courtName}
              </Link>
            </CardTitle>
            <p className="text-sm text-muted">{match.venueName}</p>
          </div>
          <div className="flex gap-2">
            <Badge>{sportLabel(match.sport)}</Badge>
            <Badge variant={match.status === "open" ? "outline" : "muted"}>
              {matchStatusLabel(match.status)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-1 pt-3 text-sm">
        <p>{formatShortDate(match.dateTime)}</p>
        <p>{spotsLabel(match.currentPlayers, match.maxPlayers)}</p>
        <p className="font-medium">{formatCLP(match.priceCLP)} por jugador</p>
        {full && match.allowOverbook ? <Badge variant="warning">Sobrecupo</Badge> : null}
        {full && !match.allowOverbook ? <Badge variant="muted">Completo</Badge> : null}
      </CardContent>
    </Card>
  );
}
