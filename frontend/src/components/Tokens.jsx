export default function Tokens({ tokens }) {
  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900 p-4">
      <div className="mb-3 text-sm font-semibold text-slate-300">Tokens</div>
      <div className="overflow-auto rounded-md border border-slate-800 bg-slate-950">
        <table className="w-full text-xs">
          <thead className="bg-slate-900 text-slate-300">
            <tr>
              <th className="px-3 py-2 text-left font-semibold">Line</th>
              <th className="px-3 py-2 text-left font-semibold">Type</th>
              <th className="px-3 py-2 text-left font-semibold">Lexeme</th>
            </tr>
          </thead>
          <tbody>
            {tokens.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-3 py-4 text-center text-slate-500">
                  Tokens will appear here after compilation.
                </td>
              </tr>
            ) : (
              tokens.map((token, idx) => (
                <tr key={`${token.lexeme}-${idx}`} className="border-t border-slate-800">
                  <td className="px-3 py-2">{token.line}</td>
                  <td className="px-3 py-2">{token.type}</td>
                  <td className="px-3 py-2 text-indigo-200">{token.lexeme}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
