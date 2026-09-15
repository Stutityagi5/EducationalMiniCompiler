const controlStatementRegex = /^\s*(if|else|for|while)\b/;
const keywordFixes = [
  { pattern: /\bre\s+turn\b/g, corrected: "return", original: "re turn" },
  { pattern: /\bretrun\b/g, corrected: "return", original: "retrun" },
];

function removeComments(code) {
  let result = "";
  let i = 0;
  let inLine = false;
  let inBlock = false;

  while (i < code.length) {
    const ch = code[i];
    const next = i + 1 < code.length ? code[i + 1] : "";

    if (!inBlock && !inLine && ch === "/" && next === "/") {
      inLine = true;
      i += 2;
      continue;
    }
    if (!inBlock && !inLine && ch === "/" && next === "*") {
      inBlock = true;
      i += 2;
      continue;
    }
    if (inLine && ch === "\n") {
      inLine = false;
      result += ch;
      i += 1;
      continue;
    }
    if (inBlock && ch === "*" && next === "/") {
      inBlock = false;
      i += 2;
      continue;
    }
    if (!inLine && !inBlock) {
      result += ch;
    }
    i += 1;
  }

  return result;
}

function autoSemicolons(lines, errors) {
  return lines.map((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) {
      return line;
    }

    if (
      trimmed.endsWith(";") ||
      trimmed.endsWith("{") ||
      trimmed.endsWith("}") ||
      trimmed.startsWith("#")
    ) {
      return line;
    }

    if (controlStatementRegex.test(trimmed) && trimmed.endsWith(")")) {
      return line;
    }

    errors.push(`Missing semicolon fixed at line ${idx + 1}.`);
    return `${line};`;
  });
}

function autoBraces(code, errors) {
  let balance = 0;
  let result = "";

  for (let i = 0; i < code.length; i += 1) {
    const ch = code[i];
    if (ch === "{") {
      balance += 1;
    } else if (ch === "}") {
      balance -= 1;
      if (balance < 0) {
        errors.push("Bracket mismatch corrected: extra closing brace removed.");
        balance = 0;
        continue;
      }
    }
    result += ch;
  }

  while (balance > 0) {
    result += "\n}";
    errors.push("Bracket mismatch corrected: missing closing brace added.");
    balance -= 1;
  }

  return result;
}

function autoParentheses(code, errors) {
  const lines = code.split("\n");
  const fixed = lines.map((line, idx) => {
    if (!controlStatementRegex.test(line)) {
      return line;
    }

    const open = (line.match(/\(/g) || []).length;
    const close = (line.match(/\)/g) || []).length;
    if (open > close) {
      errors.push(`Bracket mismatch corrected at line ${idx + 1}.`);
      const missing = ")".repeat(open - close);
      const braceIndex = line.lastIndexOf("{");
      if (braceIndex !== -1) {
        return `${line.slice(0, braceIndex).trimEnd()}${missing} ${line.slice(braceIndex)}`;
      }
      return `${line}${missing}`;
    }
    return line;
  });
  return fixed.join("\n");
}

function fixKeywordTypos(code, errors) {
  let out = code;
  for (const fix of keywordFixes) {
    out = out.replace(fix.pattern, () => {
      errors.push(`Keyword typo corrected: '${fix.original}' -> '${fix.corrected}'.`);
      return fix.corrected;
    });
  }
  return out;
}

export function preprocess(source) {
  const errors = [];
  const normalized = source.replace(/\r\n/g, "\n");
  const withoutComments = removeComments(normalized);
  const typoFixed = fixKeywordTypos(withoutComments, errors);
  const lines = typoFixed.split("\n");
  const withSemicolons = autoSemicolons(lines, errors).join("\n");
  const parenFixed = autoParentheses(withSemicolons, errors);
  const fixedBraces = autoBraces(parenFixed, errors);

  return { code: fixedBraces, errors };
}
