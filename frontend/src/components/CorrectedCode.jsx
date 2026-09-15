export default function CorrectedCode({ correctedCode }) {
  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900 p-4">
      <div className="mb-3 text-sm font-semibold text-slate-300">Corrected Code</div>
      <pre className="h-[180px] overflow-auto rounded-md border border-slate-800 bg-slate-950 p-4 text-xs text-slate-100">
        {correctedCode || "Run compile to see corrected output."}
      </pre>
    </section>
  );
}
