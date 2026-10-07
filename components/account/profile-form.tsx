"use client";

import { useActionState } from "react";
import { updateProfile, type ProfileActionState } from "@/lib/actions/profile";
import { LEVEL_VALUES, type Player } from "@/lib/sheets/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initial: ProfileActionState | null = null;

const levelLabels: Record<(typeof LEVEL_VALUES)[number], string> = {
  principiante: "Principiante",
  intermedio: "Intermedio",
  avanzado: "Avanzado",
};

export function ProfileForm({ player }: { player: Player | null }) {
  const [state, action, pending] = useActionState(updateProfile, initial);

  return (
    <form action={action} className="flex max-w-md flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm">
        Nombre
        <Input name="name" required defaultValue={player?.name ?? ""} autoComplete="name" />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        Teléfono
        <Input
          name="phone"
          required
          defaultValue={player?.phone ?? ""}
          autoComplete="tel"
          placeholder="+56 9 ..."
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        Nivel
        <select
          name="level"
          defaultValue={player?.level ?? ""}
          className="h-10 rounded-full border border-line bg-card px-4 text-sm"
        >
          <option value="">Seleccionar</option>
          {LEVEL_VALUES.map((level) => (
            <option key={level} value={level}>
              {levelLabels[level]}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        Posición preferida
        <Input
          name="preferredPosition"
          defaultValue={player?.preferredPosition ?? ""}
          placeholder="Opcional"
        />
      </label>
      {state && !state.ok ? (
        <p className="text-sm text-red-700" role="alert">
          {state.error}
        </p>
      ) : null}
      {state?.ok ? <p className="text-sm text-brand-800">Perfil guardado.</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Guardando…" : "Guardar perfil"}
      </Button>
    </form>
  );
}
