export default function SymbolTable({ symbolTable }) {
  const rows = Array.isArray(symbolTable) ? symbolTable : [];
  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900 p-4">
      <div className="mb-3 text-sm font-semibold text-slate-300">Symbol Table</div>
      <div className="overflow-auto rounded-md border border-slate-800 bg-slate-950">
        <table className="w-full text-xs">
          <thead className="bg-slate-900 text-slate-300">
            <tr>
              <th className="px-3 py-2 text-left font-semibold">Identifier</th>
              <th className="px-3 py-2 text-left font-semibold">Type</th>
              <th className="px-3 py-2 text-left font-semibold">Value</th>
              <th className="px-3 py-2 text-left font-semibold">Initialized</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-4 text-center text-slate-500">
                  Symbol table entries will appear here.
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => (
                <tr key={`${row.name}-${idx}`} className="border-t border-slate-800">
                  <td className="px-3 py-2">{row.name}</td>
                  <td className="px-3 py-2 text-emerald-300">{row.type || "unknown"}</td>
                  <td className="px-3 py-2">{row.value ?? "null"}</td>
                  <td className="px-3 py-2">{row.initialized ? "yes" : "no"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
