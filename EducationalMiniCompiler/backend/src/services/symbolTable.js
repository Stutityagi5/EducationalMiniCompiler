export function buildSymbolTable(tokens) {
  const table = {};

  for (let i = 0; i < tokens.length - 2; i += 1) {
    const current = tokens[i];
    const next = tokens[i + 1];
    const value = tokens[i + 2];

    if (
      current.type === "Identifier" &&
      next.type === "AssignmentOperator" &&
      value.type === "NumericConstant"
    ) {
      table[current.lexeme] = value.lexeme;
    }
  }

  return table;
}
