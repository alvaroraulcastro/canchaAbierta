export default function AdminLoading() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-10">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-line" />
      <div className="h-10 w-full animate-pulse rounded-full bg-line" />
      <ul className="grid gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <li key={i} className="h-20 animate-pulse rounded-2xl bg-line" />
        ))}
      </ul>
    </main>
  );
}
