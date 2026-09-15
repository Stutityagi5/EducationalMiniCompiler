/**
 * Logical phase only: detect warnings not covered by lexical/syntax/semantic passes.
 */

function addOnce(out, seen, message) {
  if (seen.has(message)) {
    return;
  }
  seen.add(message);
  out.push(message);
}

function isInfiniteLoopCondition(expr) {
  return expr?.type === "NumericLiteral" && String(expr.value) === "1";
}

function isAlwaysTrueCondition(expr) {
  if (!expr || expr.type !== "BinaryExpression" || expr.value !== "||") {
    return false;
  }
  const [left, right] = expr.children || [];
  if (
    left?.type !== "BinaryExpression" ||
    right?.type !== "BinaryExpression" ||
    left.children?.[0]?.type !== "Identifier" ||
    right.children?.[0]?.type !== "Identifier" ||
    left.children?.[1]?.type !== "NumericLiteral" ||
    right.children?.[1]?.type !== "NumericLiteral"
  ) {
    return false;
  }
  const leftName = left.children[0].value;
  const rightName = right.children[0].value;
  const leftValue = left.children[1].value;
  const rightValue = right.children[1].value;
  const pairA = left.value === ">" && right.value === "<=";
  const pairB = left.value === "<=" && right.value === ">";
  return (pairA || pairB) && leftName === rightName && leftValue === rightValue;
}

function scanStatements(statements, warnings, seen) {
  let returned = false;
  for (const stmt of statements || []) {
    if (!stmt) {
      continue;
    }
    if (returned) {
      addOnce(warnings, seen, "Logical Warning: Unreachable code detected after return statement.");
    }

    if (stmt.type === "ReturnStatement") {
      returned = true;
      continue;
    }

    if (stmt.type === "WhileStatement") {
      const [condition, block] = stmt.children || [];
      if (isInfiniteLoopCondition(condition)) {
        addOnce(warnings, seen, "Logical Warning: Possible infinite loop detected (while(1)).");
      }
      scanStatements(block?.children || [], warnings, seen);
      continue;
    }

    if (stmt.type === "FunctionDefinition") {
      const body = stmt.children?.[0];
      scanStatements(body?.children || [], warnings, seen);
      continue;
    }

    if (stmt.type === "IfStatement") {
      const [condition, block] = stmt.children || [];
      if (isAlwaysTrueCondition(condition)) {
        addOnce(warnings, seen, "Logical Warning: Condition is always true.");
      }
      scanStatements(block?.children || [], warnings, seen);
      continue;
    }

    if (stmt.type === "Block") {
      scanStatements(stmt.children || [], warnings, seen);
    }
  }
}

export function detectLogicalErrors(ast) {
  const logicalWarnings = [];
  const seen = new Set();
  if (!ast || ast.type !== "Program") {
    return { logicalWarnings };
  }

  scanStatements(ast.children || [], logicalWarnings, seen);
  return { logicalWarnings };
}
