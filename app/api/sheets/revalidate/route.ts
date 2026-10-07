import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import {
  SHEET_NAMES,
  SHEET_TAG_VALUES,
  tagForSheet,
  type SheetName,
  type SheetTag,
} from "@/lib/sheets/tags";

const bodySchema = z
  .object({
    sheet: z.enum(SHEET_NAMES).optional(),
    tag: z.enum(SHEET_TAG_VALUES).optional(),
  })
  .refine((value) => value.sheet !== undefined || value.tag !== undefined, {
    message: "Falta sheet o tag",
  });

function authorized(request: Request): boolean {
  const expected = process.env.SHEETS_REVALIDATE_SECRET;
  const provided = request.headers.get("x-secret");
  if (!expected || !provided) return false;
  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(provided);
  if (expectedBuffer.length !== providedBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, providedBuffer);
}

function resolveTag(sheet: SheetName | undefined, tag: SheetTag | undefined): SheetTag | null {
  if (sheet && tag && tagForSheet(sheet) !== tag) return null;
  if (tag) return tag;
  if (sheet) return tagForSheet(sheet);
  return null;
}

export async function POST(request: Request) {
  if (!authorized(request)) {
    return Response.json({ ok: false, error: "No autorizado" }, { status: 401 });
  }

  const json: unknown = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ ok: false, error: "Body inválido" }, { status: 400 });
  }

  const tag = resolveTag(parsed.data.sheet, parsed.data.tag);
  if (!tag) {
    return Response.json({ ok: false, error: "sheet y tag no coinciden" }, { status: 400 });
  }

  revalidateTag(tag);
  return Response.json({ ok: true, revalidated: tag });
}
