/**
 * Best-effort source fixes before lexing (common lexical mistakes and keyword typos).
 * Mutates nothing; returns updated source and appends human-readable messages to `log`.
 */

export function applySyntaxSourceFixes(code, log = []) {
  let out = code;

  let n = 0;
  out = out.replace(/\bretrun\b/g, () => {
    n += 1;
    return "return";
  });
  if (n) {
    log.push(`Syntax fix: replaced ${n} occurrence(s) of misspelled 'retrun' with 'return'.`);
  }

  n = 0;
  out = out.replace(/\bretur\s+n(?=\s*[\d(;])/g, () => {
    n += 1;
    return "return";
  });
  if (n) {
    log.push(`Syntax fix: merged ${n} split keyword(s) 'retur' + 'n' into 'return'.`);
  }

  n = 0;
  out = out.replace(/=\s*;/g, () => {
    n += 1;
    return "= 0;";
  });
  if (n) {
    log.push(`Syntax fix: inserted default expression '0' for ${n} incomplete assignment(s).`);
  }

  n = 0;
  out = out.replace(/\b(int|float)\s+([A-Za-z_][A-Za-z0-9_]*)\s*=\s*;/g, (_m, type, name) => {
    n += 1;
    const defaultValue = type === "float" ? "0.0" : "0";
    return `${type} ${name} = ${defaultValue};`;
  });
  if (n) {
    log.push(`Syntax fix: inserted default initializer for ${n} incomplete declaration(s).`);
  }

  return out;
}

/**
 * One pass of lexical-oriented edits on source text.
 * @returns {string}
 */
function applyLexicalSourceFixesOnce(code, log) {
  let out = code;

  let n = 0;
  out = out.replace(/(\d+)\.(?![0-9])/g, (m, digits) => {
    n += 1;
    return `${digits}.0`;
  });
  if (n) {
    log.push(`Lexical fix: completed ${n} numeric constant(s) ending with '.' (e.g. '3.' → '3.0').`);
  }

  n = 0;
  out = out.replace(/(\d+)([A-Za-z_])/g, (m, digits, letter) => {
    n += 1;
    return `${digits} ${letter}`;
  });
  if (n) {
    log.push(
      `Lexical fix: inserted ${n} space(s) between number and following letter (invalid numeric suffix).`
    );
  }

  return out;
}

/**
 * Reapply lexical fixes until stable (fixes can expose new patterns in rare cases).
 */
export function stabilizeLexicalSourceFixes(code, log = []) {
  let cur = code;
  for (let i = 0; i < 12; i += 1) {
    const next = applyLexicalSourceFixesOnce(cur, log);
    if (next === cur) {
      break;
    }
    cur = next;
  }
  return cur;
}

/**
 * Remove known invalid standalone symbols from source while preserving line structure.
 * This is intentionally conservative: only strips characters that are never valid tokens
 * in this mini compiler grammar.
 */
export function fixLexicalErrors(code) {
  let line = 1;
  let out = "";
  const removed = [];

  for (let i = 0; i < code.length; i += 1) {
    const ch = code[i];
    if (ch === "\n") {
      line += 1;
      out += ch;
      continue;
    }

    if (ch === "@" || ch === "#" || ch === "$") {
      removed.push({
        char: ch,
        line,
        message: `Lexical Error: Invalid token '${ch}' removed automatically at line ${line}.`,
      });
      continue;
    }

    out += ch;
  }

  return { code: out, removed };
}
