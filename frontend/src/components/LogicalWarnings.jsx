export default function LogicalWarnings({ logicalWarnings }) {
  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900 p-4">
      <div className="mb-3 text-sm font-semibold text-slate-300">Logical Warnings</div>
      <div className="h-[180px] overflow-auto rounded-md border border-slate-800 bg-slate-950 p-4 text-xs text-slate-200">
        {logicalWarnings.length === 0 ? (
          <span className="text-slate-500">No logical warnings.</span>
        ) : (
          <ul className="space-y-2">
            {logicalWarnings.map((warning, idx) => (
              <li key={`${warning}-${idx}`} className="text-amber-300">
                {warning}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
