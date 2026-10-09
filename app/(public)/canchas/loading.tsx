export default function CourtsLoading() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10">
      <header className="flex flex-col gap-2">
        <div className="h-8 w-40 animate-pulse rounded-lg bg-line" />
        <div className="h-4 w-64 animate-pulse rounded-lg bg-line" />
      </header>
      <div className="h-10 w-full animate-pulse rounded-full bg-line" />
      <ul className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <li key={i} className="h-48 animate-pulse rounded-3xl bg-line" />
        ))}
      </ul>
    </main>
  );
}
