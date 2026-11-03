export function AdminFormAlerts({ ok, error }: { ok?: string; error?: string }) {
  return (
    <>
      {error ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {ok && !error ? (
        <p className="rounded-xl bg-brand-100 px-3 py-2 text-sm text-brand-950">Cambios guardados.</p>
      ) : null}
    </>
  );
}
