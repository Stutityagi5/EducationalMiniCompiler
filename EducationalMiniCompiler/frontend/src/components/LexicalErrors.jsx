export default function LexicalErrors({ lexicalErrors }) {
  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900 p-4">
      <div className="mb-3 text-sm font-semibold text-slate-300">Lexical Errors</div>
      <div className="h-[180px] overflow-auto rounded-md border border-slate-800 bg-slate-950 p-4 text-xs text-slate-200">
        {lexicalErrors.length === 0 ? (
          <span className="text-slate-500">No lexical errors.</span>
        ) : (
          <ul className="space-y-2">
            {lexicalErrors.map((error, idx) => (
              <li key={`${error}-${idx}`} className="text-rose-300">
                {error}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
