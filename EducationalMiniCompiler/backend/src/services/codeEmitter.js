/**
 * Pretty-print a plain JSON AST back to C-like source (used after parse + semantic pass).
 */

function emitExpr(node) {
  if (!node || typeof node !== "object") {
    return "";
  }
  switch (node.type) {
    case "NumericLiteral":
      return String(node.value ?? "");
    case "Identifier":
      return String(node.value ?? "");
    case "BinaryExpression": {
      const [l, r] = node.children || [];
      return `(${emitExpr(l)} ${node.value} ${emitExpr(r)})`;
    }
    default:
      return "";
  }
}

function emitBlock(node, depth) {
  if (!node || node.type !== "Block") {
    return "{}";
  }
  const ind = "  ".repeat(depth);
  const inner = (node.children || []).map((s) => emitStmt(s, depth + 1)).filter(Boolean).join("\n");
  return `{\n${inner}\n${ind}}`;
}

function emitStmt(node, depth) {
  if (!node || typeof node !== "object") {
    return "";
  }
  const ind = "  ".repeat(depth);
  switch (node.type) {
    case "VariableDeclaration": {
      const id = node.children?.[0]?.value ?? "?";
      const init = node.children?.[1] ? ` = ${emitExpr(node.children[1])}` : "";
      return `${ind}${node.value} ${id}${init};`;
    }
    case "Assignment": {
      const id = node.children?.[0]?.value ?? "?";
      return `${ind}${id} = ${emitExpr(node.children?.[1])};`;
    }
    case "ReturnStatement": {
      const e = node.children?.[0] ? ` ${emitExpr(node.children[0])}` : "";
      return `${ind}return${e};`;
    }
    case "IfStatement": {
      const [c, b] = node.children || [];
      return `${ind}if (${emitExpr(c)}) ${emitBlock(b, depth)}`;
    }
    case "WhileStatement": {
      const [c, b] = node.children || [];
      return `${ind}while (${emitExpr(c)}) ${emitBlock(b, depth)}`;
    }
    case "Block":
      return emitBlock(node, depth);
    default:
      return "";
  }
}

/**
 * @param {object|null} ast plain JSON AST
 * @returns {string}
 */
export function generateCorrectedSource(ast) {
  if (!ast || ast.type !== "Program") {
    return "";
  }
  return (ast.children || []).map((s) => emitStmt(s, 0)).filter(Boolean).join("\n");
}
