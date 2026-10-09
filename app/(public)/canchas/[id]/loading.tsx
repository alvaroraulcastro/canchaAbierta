export default function CourtDetailLoading() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10">
      <div className="h-4 w-20 animate-pulse rounded-lg bg-line" />
      <header className="flex flex-col gap-3">
        <div className="h-8 w-64 animate-pulse rounded-lg bg-line" />
        <div className="h-5 w-48 animate-pulse rounded-lg bg-line" />
      </header>
      <section className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-3xl bg-line" />
        ))}
      </section>
    </main>
  );
}
