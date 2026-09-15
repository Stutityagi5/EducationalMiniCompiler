function ErrorList({ items, emptyMessage, colorClass = "text-rose-300" }) {
  if (!items?.length) {
    return <span className="text-slate-500">{emptyMessage}</span>;
  }

  return (
    <ul className="space-y-2">
      {items.map((item, idx) => (
        <li key={`${item}-${idx}`} className={colorClass}>
          {item}
        </li>
      ))}
    </ul>
  );
}

export default function PreprocessErrors({ preprocessErrors }) {
  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900 p-4">
      <div className="mb-3 text-sm font-semibold text-slate-300">Preprocessing Issues</div>
      <div className="h-[180px] overflow-auto rounded-md border border-slate-800 bg-slate-950 p-4 text-xs text-slate-200">
        <ErrorList
          items={preprocessErrors}
          emptyMessage="No preprocessing issues."
          colorClass="text-amber-300"
        />
      </div>
    </section>
  );
}
