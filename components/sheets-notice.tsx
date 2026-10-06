export function SheetsNotice() {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-950 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-50">
      <h2 className="text-lg font-semibold">Falta conectar Google Sheets</h2>
      <p className="mt-2 text-sm">
        Completa el service account en <code>.env</code> para leer canchas y partidos. Hace falta{" "}
        <code>GOOGLE_SERVICE_ACCOUNT_EMAIL</code> y <code>GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY</code>,
        y compartir el Sheets con ese email como Editor.
      </p>
    </div>
  );
}
