import type { Metadata } from "next";
import { listPlayers } from "@/lib/sheets/repos/players";

export const metadata: Metadata = {
  title: "Jugadores",
};

export default async function AdminPlayersPage() {
  const players = await listPlayers();

  return (
    <section className="flex flex-col gap-3">
      <p className="text-sm text-muted">Solo lectura. Los datos vienen del Google Sheets.</p>
      <ul className="flex flex-col gap-2">
        {players.map((player) => (
          <li key={player.email} className="rounded-2xl border border-line bg-card p-4">
            <p className="font-medium">{player.name || "Sin nombre"}</p>
            <p className="text-sm text-muted">{player.email}</p>
            <p className="text-sm">
              {player.phone || "Sin teléfono"}
              {player.level ? ` · ${player.level}` : ""}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
