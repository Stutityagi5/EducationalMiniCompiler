/**
 * Mutates a plain JSON AST in place: truncates float literals in int contexts
 * (variable declarations and assignments to int symbols).
 */

function lookup(scopeChain, name) {
  for (let i = scopeChain.length - 1; i >= 0; i -= 1) {
    if (scopeChain[i].has(name)) {
      return scopeChain[i].get(name);
    }
  }
  return null;
}

function declareInnermost(scopeChain, name, type) {
  const inner = scopeChain[scopeChain.length - 1];
  inner.set(name, { type });
}

function truncateFloatLiteralsInExpr(node) {
  let changed = 0;
  function walk(n) {
    if (!n || typeof n !== "object") {
      return;
    }
    if (n.type === "NumericLiteral") {
      const s = String(n.value ?? "");
      if (s.includes(".")) {
        const t = Math.trunc(Number(s));
        if (!Number.isNaN(t)) {
          n.value = String(t);
          changed += 1;
        }
      }
      return;
    }
    for (const ch of n.children || []) {
      walk(ch);
    }
  }
  walk(node);
  return changed;
}

function processBlock(blockNode, scopeChain, log) {
  if (!blockNode || blockNode.type !== "Block") {
    return;
  }
  const inner = [...scopeChain, new Map()];
  for (const stmt of blockNode.children || []) {
    processStatement(stmt, inner, log);
  }
}

function processStatement(node, scopeChain, log) {
  if (!node) {
    return;
  }

  switch (node.type) {
    case "VariableDeclaration": {
      const idNode = node.children?.[0];
      const name = idNode?.value;
      const t = node.value;
      if (name && (t === "int" || t === "float")) {
        declareInnermost(scopeChain, name, t);
      }
      if (t === "int" && node.children?.[1]) {
        const n = truncateFloatLiteralsInExpr(node.children[1]);
        if (n > 0) {
          log.push(`Semantic fix: truncated ${n} float literal(s) to integer in int declaration of '${name}'.`);
        }
      }
      break;
    }
    case "Assignment": {
      const idNode = node.children?.[0];
      const rhs = node.children?.[1];
      const sym = lookup(scopeChain, idNode?.value);
      if (sym?.type === "int" && rhs) {
        const n = truncateFloatLiteralsInExpr(rhs);
        if (n > 0) {
          log.push(
            `Semantic fix: truncated ${n} float literal(s) to integer in assignment to int '${idNode?.value}'.`
          );
        }
      }
      break;
    }
    case "IfStatement": {
      const [, block] = node.children || [];
      processBlock(block, scopeChain, log);
      break;
    }
    case "WhileStatement": {
      const [, block] = node.children || [];
      processBlock(block, scopeChain, log);
      break;
    }
    case "Block":
      processBlock(node, scopeChain, log);
      break;
    default:
      break;
  }
}

/**
 * @param {object|null} ast
 * @param {string[]} log
 */
export function coerceFloatLiteralsForIntContexts(ast, log = []) {
  if (!ast || ast.type !== "Program") {
    return;
  }
  const scopeChain = [new Map()];
  for (const stmt of ast.children || []) {
    processStatement(stmt, scopeChain, log);
  }
}
