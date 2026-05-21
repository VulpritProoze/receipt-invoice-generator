const highlights = [
  'Invoice generation with multi-select billing items',
  'Receipt generation from existing invoices only',
  'CSV and XLSX import with schema validation',
  'Redis-backed storage and audit-friendly history'
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.08),_transparent_45%),linear-gradient(180deg,_#f8fafc_0%,_#ffffff_100%)] px-6 py-16 text-slate-900">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10">
        <section className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-500">
            BillGen
          </p>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">
            A focused workspace for invoices, receipts, and imported billing
            data.
          </h1>
          <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            This scaffold sets up the core app shell, typed data models, Redis
            integration points, and documentation structure for the full billing
            flow.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {highlights.map((item) => (
            <article
              key={item}
              className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur"
            >
              <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                Capability
              </h2>
              <p className="mt-3 text-lg text-slate-800">{item}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
