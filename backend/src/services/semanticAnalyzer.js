/**
 * Semantic analysis: scopes, duplicate declarations, undefined references.
 * Produces a symbol map for later phases (logical error detector).
 */

function expressionContainsFloatLiteral(node) {
  if (!node || typeof node !== "object") {
    return false;
  }
  if (node.type === "NumericLiteral" && String(node.value).includes(".")) {
    return true;
  }
  if (Array.isArray(node.children)) {
    return node.children.some(expressionContainsFloatLiteral);
  }
  return false;
}

function collectIdentifiersInExpr(node, out = []) {
  if (!node || typeof node !== "object") {
    return out;
  }
  if (node.type === "Identifier") {
    out.push(node);
  }
  if (Array.isArray(node.children)) {
    for (const ch of node.children) {
      collectIdentifiersInExpr(ch, out);
    }
  }
  return out;
}

function evaluateSimpleExpr(node, scopeChain) {
  if (!node || typeof node !== "object") {
    return null;
  }
  if (node.type === "NumericLiteral") {
    const n = Number(node.value);
    return Number.isNaN(n) ? null : n;
  }
  if (node.type === "Identifier") {
    const sym = lookup(scopeChain, node.value);
    return sym?.value ?? null;
  }
  return null;
}

function declareInInnermost(scopeChain, name, info) {
  const inner = scopeChain[scopeChain.length - 1];
  inner.set(name, info);
}

function lookup(scopeChain, name) {
  for (let i = scopeChain.length - 1; i >= 0; i -= 1) {
    if (scopeChain[i].has(name)) {
      return scopeChain[i].get(name);
    }
  }
  return null;
}

function analyzeBlock(blockNode, scopeChain, semanticErrors, symbolTableFlat) {
  if (!blockNode || blockNode.type !== "Block") {
    return;
  }
  const inner = [...scopeChain, new Map()];
  for (const stmt of blockNode.children || []) {
    analyzeStatement(stmt, inner, semanticErrors, symbolTableFlat);
  }
}

function analyzeStatement(node, scopeChain, semanticErrors, symbolTableFlat) {
  if (!node) {
    return;
  }

  switch (node.type) {
    case "Declaration":
    case "VariableDeclaration": {
      const idNode = node.children?.[0];
      const name = node.identifier || idNode?.value;
      const declaredType = node.varType || node.value || "unknown";
      if (!name) {
        return;
      }
      const innermost = scopeChain[scopeChain.length - 1];
      if (innermost.has(name)) {
        semanticErrors.push(
          `Semantic error: Variable '${name}' is already declared in this scope${idNode.line ? ` (line ${idNode.line})` : ""}.`
        );
        return;
      }
      if (node.children?.length > 1) {
        const initExpr = node.children[1];
        if (declaredType === "int" && expressionContainsFloatLiteral(initExpr)) {
          semanticErrors.push(
            `Semantic error: type mismatch — floating-point value assigned to 'int' variable '${name}'${idNode.line ? ` (line ${idNode.line})` : ""}.`
          );
        }
        for (const id of collectIdentifiersInExpr(initExpr)) {
          const sym = lookup(scopeChain, id.value);
          if (!sym) {
            semanticErrors.push(
              `Semantic error: Use of undeclared identifier '${id.value}'${id.line ? ` at line ${id.line}` : ""}.`
            );
          }
        }
      }
      const initialValue = node.children?.length > 1 ? evaluateSimpleExpr(node.children[1], scopeChain) : null;
      declareInInnermost(scopeChain, name, {
        type: declaredType,
        line: idNode.line,
        initialized: (node.children?.length || 0) > 1,
        value: initialValue,
      });
      symbolTableFlat[name] = {
        type: declaredType,
        initialized: (node.children?.length || 0) > 1,
        value: initialValue,
        scope: "global",
      };
      break;
    }
    case "Assignment": {
      const idNode = node.children?.[0];
      const rhs = node.children?.[1];
      const name = idNode?.value;
      for (const id of collectIdentifiersInExpr(rhs)) {
        const sym = lookup(scopeChain, id.value);
        if (!sym) {
          semanticErrors.push(
            `Semantic error: Use of undeclared identifier '${id.value}'${id.line ? ` at line ${id.line}` : ""}.`
          );
        }
      }
      const sym = lookup(scopeChain, name);
      if (!sym) {
        semanticErrors.push(
          `Semantic error: Assignment to undeclared variable '${name}'${idNode?.line ? ` at line ${idNode.line}` : ""}.`
        );
      } else {
        if (sym.type === "int" && expressionContainsFloatLiteral(rhs)) {
          semanticErrors.push(
            `Semantic error: type mismatch — floating-point value assigned to 'int' variable '${name}'${idNode?.line ? ` at line ${idNode.line}` : ""}.`
          );
        }
        sym.initialized = true;
        sym.value = evaluateSimpleExpr(rhs, scopeChain);
        if (symbolTableFlat[name]) {
          symbolTableFlat[name].initialized = true;
          symbolTableFlat[name].value = sym.value;
        }
      }
      break;
    }
    case "IfStatement": {
      const [cond, block] = node.children || [];
      for (const id of collectIdentifiersInExpr(cond)) {
        const sym = lookup(scopeChain, id.value);
        if (!sym) {
          semanticErrors.push(
            `Semantic error: Use of undeclared identifier '${id.value}'${id.line ? ` at line ${id.line}` : ""}.`
          );
        }
      }
      analyzeBlock(block, scopeChain, semanticErrors, symbolTableFlat);
      break;
    }
    case "FunctionDefinition": {
      const body = node.children?.[0];
      analyzeBlock(body, scopeChain, semanticErrors, symbolTableFlat);
      break;
    }
    case "WhileStatement": {
      const [cond, block] = node.children || [];
      for (const id of collectIdentifiersInExpr(cond)) {
        const sym = lookup(scopeChain, id.value);
        if (!sym) {
          semanticErrors.push(
            `Semantic error: Use of undeclared identifier '${id.value}'${id.line ? ` at line ${id.line}` : ""}.`
          );
        }
      }
      analyzeBlock(block, scopeChain, semanticErrors, symbolTableFlat);
      break;
    }
    case "ReturnStatement": {
      const expr = node.children?.[0];
      if (expr) {
        for (const id of collectIdentifiersInExpr(expr)) {
          const sym = lookup(scopeChain, id.value);
          if (!sym) {
            semanticErrors.push(
              `Semantic error: Use of undeclared identifier '${id.value}'${id.line ? ` at line ${id.line}` : ""}.`
            );
          }
        }
      }
      break;
    }
    case "Block":
      analyzeBlock(node, scopeChain, semanticErrors, symbolTableFlat);
      break;
    default:
      break;
  }
}

/**
 * @param {object|null} ast plain JSON AST from parser
 * @returns {{ semanticErrors: string[], symbolTable: Array<{ name: string, type: string, initialized: boolean, value: number|null, scope: string }> }}
 */
export function analyzeSemantics(ast) {
  const semanticErrors = [];
  const symbolTableFlat = {};

  if (!ast || ast.type !== "Program") {
    return { semanticErrors, symbolTable: [] };
  }

  const scopeChain = [new Map()];
  for (const stmt of ast.children || []) {
    analyzeStatement(stmt, scopeChain, semanticErrors, symbolTableFlat);
  }

  const symbolTable = Object.entries(symbolTableFlat).map(([name, info]) => ({
    name,
    type: info.type,
    initialized: info.initialized,
    value: info.value ?? null,
    scope: info.scope || "global",
  }));

  return { semanticErrors, symbolTable };
}
