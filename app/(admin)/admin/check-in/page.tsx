import { CheckInScanner } from "@/components/admin/check-in-scanner";
import { requireAdminPermission } from "@/lib/auth/require-admin";

export default async function AdminCheckInPage() {
  await requireAdminPermission("check_in");

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-semibold">Check-in por QR</h2>
        <p className="text-sm text-muted">
          Escanea el código que muestra el jugador en Mis inscripciones.
        </p>
      </div>
      <CheckInScanner />
    </div>
  );
}
