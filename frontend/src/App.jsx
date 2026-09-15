import { useState } from "react";
import CorrectedCode from "./components/CorrectedCode";
import PreprocessErrors from "./components/PreprocessErrors";
import Tokens from "./components/Tokens";
import LexicalErrors from "./components/LexicalErrors";
import SyntaxErrors from "./components/SyntaxErrors";
import SemanticErrors from "./components/SemanticErrors";
import LogicalWarnings from "./components/LogicalWarnings";
import ASTView from "./components/ASTView";
import SymbolTable from "./components/SymbolTable";

const API_URL = "http://localhost:4000/compile";

const sampleCode = `int main() {
  int a = 10
  float b = 2.5
  if (a > 5) {
    a = a + 1
  }
  return a
}`;

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeSymbolTable(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (value && typeof value === "object") {
    return Object.entries(value).map(([name, raw]) => {
      if (raw && typeof raw === "object") {
        return {
          name,
          type: raw.type || "unknown",
          initialized: Boolean(raw.initialized),
          value: raw.value ?? null,
          scope: raw.scope || "global",
        };
      }

      return {
        name,
        type: "unknown",
        initialized: Boolean(raw),
        value: raw ?? null,
        scope: "global",
      };
    });
  }

  return [];
}

function normalizeAst(value) {
  if (!value || typeof value !== "object") {
    return null;
  }

  if (!value.type) {
    return null;
  }

  return value;
}

function splitLegacyErrors(legacyErrors) {
  const groups = {
    preprocessErrors: [],
    lexicalErrors: [],
    syntaxErrors: [],
    semanticErrors: [],
    logicalWarnings: [],
  };

  for (const raw of asArray(legacyErrors)) {
    const message = String(raw || "");
    const lower = message.toLowerCase();

    if (
      lower.startsWith("lexical error:") ||
      lower.includes("invalid token") ||
      lower.includes("malformed number")
    ) {
      groups.lexicalErrors.push(message);
    } else if (
      lower.startsWith("syntax error:") ||
      lower.includes("expected ") ||
      lower.includes("unexpected token")
    ) {
      groups.syntaxErrors.push(message);
    } else if (
      lower.startsWith("semantic error:") ||
      lower.includes("undeclared") ||
      lower.includes("type mismatch")
    ) {
      groups.semanticErrors.push(message);
    } else if (
      lower.startsWith("logical warning:") ||
      lower.includes("unreachable") ||
      lower.includes("infinite loop")
    ) {
      groups.logicalWarnings.push(message);
    } else {
      groups.preprocessErrors.push(message);
    }
  }

  return groups;
}

export default function App() {
  const [source, setSource] = useState(sampleCode);
  const [correctedCode, setCorrectedCode] = useState("");
  const [preprocessErrors, setPreprocessErrors] = useState([]);
  const [tokens, setTokens] = useState([]);
  const [lexicalErrors, setLexicalErrors] = useState([]);
  const [syntaxErrors, setSyntaxErrors] = useState([]);
  const [semanticErrors, setSemanticErrors] = useState([]);
  const [logicalWarnings, setLogicalWarnings] = useState([]);
  const [symbolTable, setSymbolTable] = useState([]);
  const [ast, setAst] = useState(null);
  const [loading, setLoading] = useState(false);

  const onCompile = async () => {
    setLoading(true);

    setPreprocessErrors([]);
    setLexicalErrors([]);
    setSyntaxErrors([]);
    setSemanticErrors([]);
    setLogicalWarnings([]);

    const applyPayload = (body) => {
      const preprocess = asArray(body.preprocessErrors);
      const lexical = asArray(body.lexicalErrors);
      const syntax = asArray(body.syntaxErrors);
      const semantic = asArray(body.semanticErrors);
      const logical = asArray(body.logicalWarnings);

      const hasPhaseArrays =
        preprocess.length ||
        lexical.length ||
        syntax.length ||
        semantic.length ||
        logical.length;

      const legacySplit = hasPhaseArrays
        ? null
        : splitLegacyErrors(body.errors);

      setCorrectedCode(body.correctedCode || "");

      setPreprocessErrors(
        legacySplit ? legacySplit.preprocessErrors : preprocess
      );

      setTokens(asArray(body.tokens));

      setLexicalErrors(
        legacySplit ? legacySplit.lexicalErrors : lexical
      );

      setSyntaxErrors(
        legacySplit ? legacySplit.syntaxErrors : syntax
      );

      setSemanticErrors(
        legacySplit ? legacySplit.semanticErrors : semantic
      );

      setLogicalWarnings(
        legacySplit ? legacySplit.logicalWarnings : logical
      );

      setAst(normalizeAst(body.ast));

      setSymbolTable(
        normalizeSymbolTable(body.symbolTable)
      );
    };

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ source }),
      });

      const body = await response.json();

      applyPayload(body);
    } catch (err) {
      setLexicalErrors([
        "Lexical Error: Failed to reach backend. Is it running on port 4000?",
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0d14] text-slate-100">

      {/* Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-violet-600/10 blur-3xl" />
        <div className="absolute -right-40 top-40 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative border-b border-white/10 bg-[#0d111b]">
        <div className="mx-auto max-w-7xl px-5 py-6 sm:px-8">

          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex items-center gap-4">

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-600/20">
                <span className="font-mono text-lg font-bold">
                  {"</>"}
                </span>
              </div>

              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold tracking-tight text-white">
                    MiniCompiler
                  </h1>

                  <span className="rounded-full border border-violet-400/20 bg-violet-400/10 px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-violet-300">
                    EDU
                  </span>
                </div>

                <p className="mt-1 text-sm text-slate-400">
                  Interactive compiler analysis and visualization
                </p>
              </div>

            </div>

            <button
              onClick={onCompile}
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-violet-600/20 transition hover:-translate-y-0.5 hover:shadow-violet-600/30 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Compiling...
                </>
              ) : (
                <>
                  <span className="text-xs">▶</span>
                  Compile Code
                </>
              )}
            </button>

          </div>

        </div>
      </header>

      {/* Main */}
      <main className="relative mx-auto max-w-7xl px-5 py-8 sm:px-8">

        {/* Intro */}
        <div className="mb-7">

          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.25em] text-violet-400">
            Compiler Workspace
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">

            <div>
              <h2 className="text-xl font-bold text-white">
                Analyze your source code
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Compile your program and inspect every stage of analysis.
              </p>
            </div>

            <div className="flex items-center gap-2 text-[10px] text-slate-500">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Backend running on port 4000
            </div>

          </div>
        </div>

        {/* Source Code Editor */}
        <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#11151f] shadow-2xl shadow-black/20">

          <div className="flex items-center justify-between border-b border-white/10 bg-[#151a25] px-5 py-3">

            <div className="flex items-center gap-3">

              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
              </div>

              <div className="h-4 w-px bg-white/10" />

              <span className="font-mono text-xs text-slate-300">
                main.c
              </span>

            </div>

            <span className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-[9px] uppercase tracking-wider text-slate-500">
              Source
            </span>

          </div>

          <div className="p-4 sm:p-5">

            <div className="flex overflow-hidden rounded-xl border border-white/10 bg-[#080b11]">

              <div className="select-none border-r border-white/5 bg-[#0c1017] px-3 py-4 text-right font-mono text-xs leading-6 text-slate-700">
                {source.split("\n").map((_, index) => (
                  <div key={index}>
                    {String(index + 1).padStart(2, "0")}
                  </div>
                ))}
              </div>

              <textarea
                value={source}
                onChange={(e) => setSource(e.target.value)}
                spellCheck={false}
                className="h-[300px] min-h-[300px] w-full resize-none bg-[#080b11] p-4 font-mono text-[13px] leading-6 text-slate-200 outline-none placeholder:text-slate-700"
                placeholder="Write your C-like source code here..."
              />

            </div>

          </div>

          <div className="flex items-center justify-between border-t border-white/5 bg-[#0d1118] px-5 py-2.5 text-[10px] text-slate-600">

            <span>
              Editable source
            </span>

            <span>
              {source.split("\n").length} lines
              {" • "}
              {source.length} characters
            </span>

          </div>

        </section>

        {/* Compilation Results */}
        <div className="mb-5 mt-9">

          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-cyan-400">
            Analysis
          </p>

          <div className="mt-1 flex items-center justify-between">

            <h2 className="text-lg font-bold text-white">
              Compilation Results
            </h2>

            <span className="text-[10px] text-slate-600">
              6 analysis modules
            </span>

          </div>

        </div>

        {/* Result Cards */}
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">

          <CorrectedCode
            correctedCode={correctedCode}
          />

          <PreprocessErrors
            preprocessErrors={preprocessErrors}
          />

          <LexicalErrors
            lexicalErrors={lexicalErrors}
          />

          <SyntaxErrors
            syntaxErrors={syntaxErrors}
          />

          <SemanticErrors
            semanticErrors={semanticErrors}
          />

          <LogicalWarnings
            logicalWarnings={logicalWarnings}
          />

        </div>

        {/* Tokens + Symbol Table */}
        <div className="mt-8 grid gap-5 lg:grid-cols-2">

          <Tokens
            tokens={tokens}
          />

          <SymbolTable
            symbolTable={symbolTable}
          />

        </div>

        {/* AST */}
        <div className="mt-8">
          <ASTView ast={ast} />
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#080b11]">

        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-5 text-center text-[10px] text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:text-left">

          <span>
            MiniCompiler • Educational Compiler Analysis Tool
          </span>

          <span>
            Preprocessor · Lexer · Parser · Semantic Analysis
          </span>

        </div>

      </footer>

    </div>
  );
}