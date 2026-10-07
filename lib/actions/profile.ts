"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth/config";
import { LEVEL_VALUES } from "@/lib/sheets/schemas";
import { upsertPlayerProfile } from "@/lib/sheets/repos/players";
import { SHEET_TAGS } from "@/lib/sheets/tags";

const profileSchema = z.object({
  name: z.string().trim().min(2, "Indica tu nombre"),
  phone: z.string().trim().min(8, "Indica un teléfono válido"),
  level: z.enum(LEVEL_VALUES).optional(),
  preferredPosition: z.string().trim().max(80).optional(),
});

export type ProfileActionState = { ok: true } | { ok: false; error: string };

export async function updateProfile(
  _prev: ProfileActionState | null,
  formData: FormData,
): Promise<ProfileActionState> {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) {
    return { ok: false, error: "Debes iniciar sesión" };
  }

  const levelRaw = formData.get("level");
  const parsed = profileSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    level: typeof levelRaw === "string" && levelRaw.length > 0 ? levelRaw : undefined,
    preferredPosition: formData.get("preferredPosition"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Datos inválidos" };
  }

  try {
    await upsertPlayerProfile({
      email,
      name: parsed.data.name,
      phone: parsed.data.phone,
      level: parsed.data.level ?? null,
      preferredPosition: parsed.data.preferredPosition ?? "",
    });
    revalidateTag(SHEET_TAGS.Jugadores);
    revalidatePath("/cuenta/perfil");
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo guardar el perfil";
    return { ok: false, error: message };
  }
}
