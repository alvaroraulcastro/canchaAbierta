import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { isE2eMockEnabled } from "@/lib/e2e/env";
import { confirmFlowPayment } from "@/lib/flow/confirm-payment";
import { e2eMockMarkPaid } from "@/lib/flow/e2e-mock";
import { inscriptionsTag, matchTag, SHEET_TAGS } from "@/lib/sheets/tags";

export async function GET(request: Request) {
  if (!isE2eMockEnabled()) {
    return new Response(null, { status: 404 });
  }

  const url = new URL(request.url);
  const token = url.searchParams.get("token")?.trim();
  const returnUrl = url.searchParams.get("return")?.trim() ?? "/cuenta/mis-inscripciones";

  if (!token) {
    return new Response("token requerido", { status: 400 });
  }

  e2eMockMarkPaid(token);
  const result = await confirmFlowPayment(token);
  if ("missing" in result) {
    return new Response("Inscripción no encontrada", { status: 404 });
  }

  revalidateTag(SHEET_TAGS.Inscripciones);
  revalidateTag(inscriptionsTag(result.matchId));
  revalidateTag(matchTag(result.matchId));

  redirect(returnUrl);
}
