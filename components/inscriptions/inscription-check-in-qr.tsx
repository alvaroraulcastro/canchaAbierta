import QRCode from "qrcode";
import { auth } from "@/lib/auth/config";
import {
  canShowPlayerCheckInQr,
} from "@/lib/check-in/policy";
import { checkInTokenExpiryMs, createCheckInToken } from "@/lib/check-in/sign-token";
import { getMatchView } from "@/lib/catalog";
import { getInscription } from "@/lib/sheets/repos/inscriptions";

export async function InscriptionCheckInQr({ inscriptionId }: { inscriptionId: string }) {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase();
  if (!email) return null;

  const inscription = await getInscription(inscriptionId);
  if (!inscription || inscription.playerEmail.toLowerCase() !== email) return null;

  const match = await getMatchView(inscription.matchId);
  if (!match) return null;

  if (
    !canShowPlayerCheckInQr(
      inscription.paymentStatus,
      inscription.checkedInAt,
      match.dateTime,
      match.durationMin,
    )
  ) {
    return null;
  }

  const token = createCheckInToken({
    inscriptionId: inscription.id,
    expMs: checkInTokenExpiryMs(match.dateTime, match.durationMin),
  });
  const dataUrl = await QRCode.toDataURL(token, { margin: 1, width: 220 });

  return (
    <div className="mt-4 rounded-2xl border border-line bg-brand-50 p-4">
      <p className="text-sm font-medium">QR de ingreso</p>
      <p className="mt-1 text-xs text-muted">Muéstralo en la entrada del complejo.</p>
      <img src={dataUrl} width={220} height={220} alt="Código QR de check-in" className="mt-3" />
    </div>
  );
}
