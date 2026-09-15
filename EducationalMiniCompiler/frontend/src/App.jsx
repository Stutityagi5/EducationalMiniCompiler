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
      return { name, type: "unknown", initialized: Boolean(raw), value: raw ?? null, scope: "global" };
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

    if (lower.startsWith("lexical error:") || lower.includes("invalid token") || lower.includes("malformed number")) {
      groups.lexicalErrors.push(message);
    } else if (lower.startsWith("syntax error:") || lower.includes("expected ") || lower.includes("unexpected token")) {
      groups.syntaxErrors.push(message);
    } else if (lower.startsWith("semantic error:") || lower.includes("undeclared") || lower.includes("type mismatch")) {
      groups.semanticErrors.push(message);
    } else if (lower.startsWith("logical warning:") || lower.includes("unreachable") || lower.includes("infinite loop")) {
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
        preprocess.length || lexical.length || syntax.length || semantic.length || logical.length;
      const legacySplit = hasPhaseArrays ? null : splitLegacyErrors(body.errors);

      setCorrectedCode(body.correctedCode || "");
      setPreprocessErrors(legacySplit ? legacySplit.preprocessErrors : preprocess);
      setTokens(asArray(body.tokens));
      setLexicalErrors(legacySplit ? legacySplit.lexicalErrors : lexical);
      setSyntaxErrors(legacySplit ? legacySplit.syntaxErrors : syntax);
      setSemanticErrors(legacySplit ? legacySplit.semanticErrors : semantic);
      setLogicalWarnings(legacySplit ? legacySplit.logicalWarnings : logical);
      setAst(normalizeAst(body.ast));
      setSymbolTable(normalizeSymbolTable(body.symbolTable));
    };

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source })
      });

      if (!response.ok) {
        const body = await response.json();
        applyPayload(body);
        return;
      }

      const data = await response.json();
      applyPayload(data);
    } catch (err) {
      setLexicalErrors(["Lexical Error: Failed to reach backend. Is it running on port 4000?"]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">MiniCompiler</h1>
            <p className="text-sm text-slate-400">
              Web-based preprocessor + lexer for C-like syntax
            </p>
          </div>
          <button
            onClick={onCompile}
            disabled={loading}
            className="rounded bg-indigo-500 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-400 disabled:cursor-not-allowed disabled:bg-slate-600"
          >
            {loading ? "Compiling..." : "Compile"}
          </button>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <section className="rounded-lg border border-slate-800 bg-slate-900 p-4">
            <div className="mb-3 text-sm font-semibold text-slate-300">Source Code</div>
            <textarea
              className="h-[420px] w-full resize-none rounded-md border border-slate-800 bg-slate-950 p-4 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={source}
              onChange={(e) => setSource(e.target.value)}
            />
          </section>

          <div className="grid gap-6">
            <CorrectedCode correctedCode={correctedCode} />
            <PreprocessErrors preprocessErrors={preprocessErrors} />
            <LexicalErrors lexicalErrors={lexicalErrors} />
            <SyntaxErrors syntaxErrors={syntaxErrors} />
            <SemanticErrors semanticErrors={semanticErrors} />
            <LogicalWarnings logicalWarnings={logicalWarnings} />
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Tokens tokens={tokens} />
          <SymbolTable symbolTable={symbolTable} />
        </div>

        <div className="mt-8">
          <ASTView ast={ast} />
        </div>
      </div>
    </div>
  );
}
