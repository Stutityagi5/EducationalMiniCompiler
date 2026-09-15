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
  return { name: label, children };
}

export default function ASTView({ ast }) {
  const treeData = useMemo(() => astToTree(ast), [ast]);

  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900 p-4">
      <div className="mb-3 text-sm font-semibold text-slate-300">AST Visualization</div>
      <div className="h-[420px] rounded-md border border-slate-800 bg-slate-950">
        {treeData ? (
          <Tree
            data={treeData}
            orientation="vertical"
            translate={{ x: 260, y: 60 }}
            nodeSize={{ x: 160, y: 90 }}
            separation={{ siblings: 1.2, nonSiblings: 1.6 }}
            pathFunc="diagonal"
            renderCustomNodeElement={({ nodeDatum }) => (
              <g>
                <rect
                  width="140"
                  height="36"
                  x="-70"
                  y="-18"
                  rx="6"
                  fill="#1f2937"
                  stroke="#6366f1"
                  strokeWidth="1.2"
                />
                <text
                  fill="#e2e8f0"
                  textAnchor="middle"
                  alignmentBaseline="central"
                  fontSize="12"
                >
                  {nodeDatum.name}
                </text>
              </g>
            )}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-slate-500">
            AST will appear here after compilation.
          </div>
        )}
      </div>
    </section>
  );
}
