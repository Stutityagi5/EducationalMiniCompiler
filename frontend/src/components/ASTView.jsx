import { useMemo } from "react";
import Tree from "react-d3-tree";

function astToTree(ast) {
  if (!ast || typeof ast !== "object" || !ast.type) {
    return null;
  }

  const label = ast.value ? `${ast.type}: ${ast.value}` : ast.type;

  const children = Array.isArray(ast.children)
    ? ast.children.map((child) => astToTree(child)).filter(Boolean)
    : [];

  return {
    name: label,
    children,
  };
}

export default function ASTView({ ast }) {
  const treeData = useMemo(() => astToTree(ast), [ast]);

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="5" r="2" />
                <circle cx="6" cy="19" r="2" />
                <circle cx="18" cy="19" r="2" />
                <path d="M12 7v5M12 12H6v5M12 12h6v5" />
              </svg>
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-800">
                Abstract Syntax Tree
              </h2>

              <p className="text-xs text-slate-500">
                Visual representation of your program structure
              </p>
            </div>
          </div>
        </div>

        {treeData && (
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-600">
              AST
            </span>

            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-medium text-slate-500">
              Tree View
            </span>
          </div>
        )}
      </div>

      {/* Tree Area */}
      <div className="relative h-[500px] overflow-hidden bg-white">
        {/* Subtle grid background */}
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "linear-gradient(#e2e8f0 1px, transparent 1px), linear-gradient(90deg, #e2e8f0 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        {treeData ? (
          <div className="relative z-10 h-full w-full">
            <Tree
              data={treeData}
              orientation="vertical"
              translate={{ x: 420, y: 70 }}
              nodeSize={{ x: 190, y: 105 }}
              separation={{
                siblings: 1.4,
                nonSiblings: 1.8,
              }}
              pathFunc="diagonal"
              transitionDuration={400}
              enableLegacyTransitions={true}
              renderCustomNodeElement={({ nodeDatum }) => (
                <g>
                  {/* Node shadow */}
                  <rect
                    width="174"
                    height="52"
                    x="-87"
                    y="-26"
                    rx="10"
                    fill="rgba(15, 23, 42, 0.08)"
                    transform="translate(0, 3)"
                  />

                  {/* Main node */}
                  <rect
                    width="174"
                    height="52"
                    x="-87"
                    y="-26"
                    rx="10"
                    fill="#ffffff"
                    stroke="#3b82f6"
                    strokeWidth="2"
                  />

                  {/* Top accent */}
                  <rect
                    width="174"
                    height="4"
                    x="-87"
                    y="-26"
                    rx="2"
                    fill="#3b82f6"
                  />

                  {/* Node text */}
                  <text
                    fill="#172033"
                    textAnchor="middle"
                    alignmentBaseline="central"
                    fontSize="12"
                    fontWeight="600"
                  >
                    {nodeDatum.name}
                  </text>
                </g>
              )}
            />
          </div>
        ) : (
          <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-500">
              <svg
                width="30"
                height="30"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
              >
                <circle cx="12" cy="5" r="2" />
                <circle cx="6" cy="19" r="2" />
                <circle cx="18" cy="19" r="2" />
                <path d="M12 7v5M12 12H6v5M12 12h6v5" />
              </svg>
            </div>

            <h3 className="text-sm font-semibold text-slate-700">
              No AST available yet
            </h3>

            <p className="mt-1 max-w-sm text-xs leading-5 text-slate-400">
              Compile your source code to generate and visualize the
              Abstract Syntax Tree.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex flex-col gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3 text-[11px] text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <span>
          Each node represents a syntactic element of the program.
        </span>

        {treeData && (
          <span className="font-medium text-blue-600">
            Parsed Structure
          </span>
        )}
      </div>
    </section>
  );
}