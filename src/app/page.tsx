export default function Home() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-slate-600">
        Development foundation
      </p>
      <h1 className="text-4xl font-bold tracking-tight">GhostRoute</h1>
      <p className="mt-4 text-xl">
        Navigate to safety when ordinary routes become unsafe.
      </p>
      <p className="mt-6">
        The local road dataset and routing engine are ready. The interactive map
        and flood simulation are not implemented yet.
      </p>
      <p className="mt-8 rounded-lg border border-amber-700 bg-amber-50 p-4 text-amber-950">
        Simulation only. Hazards and destinations are demonstration data. Routes
        are not verified safe. Follow local authorities.
      </p>
    </main>
  );
}
