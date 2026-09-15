const keywords = new Set(["int", "float", "if", "else", "while", "for", "return"]);

function isIdentifierStart(ch) {
  return /[A-Za-z_]/.test(ch);
}

function isIdentifierPart(ch) {
  return /[A-Za-z0-9_]/.test(ch);
}

export function lex(code) {
  const tokens = [];
  const errors = [];
  let line = 1;
  let i = 0;

  while (i < code.length) {
    const ch = code[i];

    if (ch === "\n") {
      line += 1;
      i += 1;
      continue;
    }
    if (/\s/.test(ch)) {
      i += 1;
      continue;
    }

    if (isIdentifierStart(ch)) {
      let lexeme = ch;
      i += 1;
      while (i < code.length && isIdentifierPart(code[i])) {
        lexeme += code[i];
        i += 1;
      }
      tokens.push({
        type: keywords.has(lexeme) ? "Keyword" : "Identifier",
        lexeme,
        line,
      });
      continue;
    }

    if (/[0-9]/.test(ch)) {
      let lexeme = ch;
      let hasDot = false;
      i += 1;
      while (i < code.length) {
        const next = code[i];
        if (/[0-9]/.test(next)) {
          lexeme += next;
          i += 1;
        } else if (next === "." && !hasDot) {
          hasDot = true;
          lexeme += next;
          i += 1;
          if (i >= code.length || !/[0-9]/.test(code[i])) {
            tokens.push({ type: "Invalid", lexeme, line });
            errors.push(`Lexical Error: Malformed number '${lexeme}' at line ${line}.`);
            lexeme = "";
            break;
          }
        } else {
          break;
        }
      }
      if (i < code.length && isIdentifierStart(code[i])) {
        while (i < code.length && isIdentifierPart(code[i])) {
          lexeme += code[i];
          i += 1;
        }
        tokens.push({ type: "Invalid", lexeme, line });
        errors.push(`Lexical Error: Malformed number '${lexeme}' at line ${line}.`);
        continue;
      }
      if (lexeme) {
        tokens.push({ type: "NumericConstant", lexeme, line });
      }
      continue;
    }

    if ("+-*/%".includes(ch)) {
      tokens.push({ type: "ArithmeticOperator", lexeme: ch, line });
      i += 1;
      continue;
    }

    if (ch === "&" || ch === "|") {
      if (i + 1 < code.length && code[i + 1] === ch) {
        tokens.push({ type: "LogicalOperator", lexeme: ch + ch, line });
        i += 2;
        continue;
      }
      tokens.push({ type: "Invalid", lexeme: ch, line });
      errors.push(`Lexical Error: Invalid token '${ch}' at line ${line}.`);
      i += 1;
      continue;
    }

    if ("<>=!".includes(ch)) {
      let lexeme = ch;
      if (i + 1 < code.length && code[i + 1] === "=") {
        lexeme += "=";
        tokens.push({ type: "RelationalOperator", lexeme, line });
        i += 2;
        continue;
      }
      if (ch === "=") {
        tokens.push({ type: "AssignmentOperator", lexeme, line });
      } else if (ch === "<" || ch === ">") {
        tokens.push({ type: "RelationalOperator", lexeme, line });
      } else {
        tokens.push({ type: "Invalid", lexeme, line });
        errors.push(`Lexical Error: Invalid token '${lexeme}' at line ${line}.`);
      }
      i += 1;
      continue;
    }

    if (";,(){}".includes(ch)) {
      tokens.push({ type: "Delimiter", lexeme: ch, line });
      i += 1;
      continue;
    }

    tokens.push({ type: "Invalid", lexeme: ch, line });
    errors.push(`Lexical Error: Invalid token '${ch}' at line ${line}.`);
    i += 1;
  }

  return { tokens, errors };
}
