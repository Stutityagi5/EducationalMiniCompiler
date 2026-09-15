import express from "express";
import cors from "cors";
import { preprocess } from "./services/preprocessor.js";
import { lex } from "./services/lexer.js";
import { parse } from "./services/parser.js";
import { analyzeSemantics } from "./services/semanticAnalyzer.js";
import { detectLogicalErrors } from "./services/logicalErrorDetector.js";
import {
  applySyntaxSourceFixes,
  stabilizeLexicalSourceFixes,
  fixLexicalErrors,
} from "./services/sourceCorrector.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.post("/compile", (req, res) => {
  const source = typeof req.body?.source === "string" ? req.body.source : "";
  if (!source.trim()) {
    return res.status(400).json({
      correctedCode: "",
      preprocessErrors: [],
      tokens: [],
      lexicalErrors: ["Lexical Error: Source code is empty."],
      syntaxErrors: [],
      semanticErrors: [],
      logicalWarnings: [],
      ast: {},
      symbolTable: [],
    });
  }

  try {
    const { code: preprocessedCode, errors: rawPreprocessErrors } = preprocess(source);
    const preprocessErrors = Array.isArray(rawPreprocessErrors) ? rawPreprocessErrors : [];
    const correctionLog = [];
    const syntaxFixedCode = applySyntaxSourceFixes(preprocessedCode, correctionLog);
    let correctedCode = stabilizeLexicalSourceFixes(syntaxFixedCode, correctionLog);
    preprocessErrors.push(...correctionLog);

    const { errors: firstPassLexicalErrors } = lex(correctedCode);
    const firstPassErrors = Array.isArray(firstPassLexicalErrors) ? firstPassLexicalErrors : [];
    const { code: lexicallyFixedCode, removed } = fixLexicalErrors(correctedCode);

    if (lexicallyFixedCode !== correctedCode) {
      correctedCode = lexicallyFixedCode;
    }

    const { tokens: rawTokens, errors: secondPassLexicalErrors } = lex(correctedCode);
    const tokens = Array.isArray(rawTokens) ? rawTokens : [];
    const removedMessages = Array.isArray(removed) ? removed.map((entry) => entry.message) : [];
    const secondPassErrors = Array.isArray(secondPassLexicalErrors) ? secondPassLexicalErrors : [];
    const lexicalErrors =
      removedMessages.length > 0
        ? [
            ...firstPassErrors.filter(
              (msg) =>
                !msg.includes("Invalid token '@'") &&
                !msg.includes("Invalid token '#'") &&
                !msg.includes("Invalid token '$'")
            ),
            ...removedMessages,
            ...secondPassErrors,
          ]
        : secondPassErrors;

    const parseInputTokens = tokens.filter((t) => t && t.type !== "Invalid");
    const { ast, errors: parserErrors } = parse(parseInputTokens);
    const syntaxErrors = (Array.isArray(parserErrors) ? parserErrors : []).map((error) =>
      error.startsWith("Syntax Error:") ? error : `Syntax Error: ${error}`
    );

    const { semanticErrors: semanticRawErrors, symbolTable: rawSymbolTable } = analyzeSemantics(ast);
    const semanticErrors = (Array.isArray(semanticRawErrors) ? semanticRawErrors : []).map((error) =>
      error.startsWith("Semantic Error:")
        ? error
        : `Semantic Error: ${error.replace(/^Semantic error:\s*/i, "")}`
    );
    const symbolTable = Array.isArray(rawSymbolTable) ? rawSymbolTable : [];

    const { logicalWarnings: logicalRawWarnings } = detectLogicalErrors(ast);
    const logicalWarnings = (Array.isArray(logicalRawWarnings) ? logicalRawWarnings : []).map((warning) =>
      warning.startsWith("Logical Warning:") ? warning : `Logical Warning: ${warning}`
    );

    return res.json({
      correctedCode,
      preprocessErrors,
      tokens,
      lexicalErrors,
      syntaxErrors,
      semanticErrors,
      logicalWarnings,
      ast: ast || {},
      symbolTable,
    });
  } catch (error) {
    return res.status(500).json({
      correctedCode: "",
      preprocessErrors: [],
      tokens: [],
      lexicalErrors: [],
      syntaxErrors: [],
      semanticErrors: [],
      logicalWarnings: ["Logical Warning: Internal compiler pipeline error."],
      ast: {},
      symbolTable: [],
    });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`MiniCompiler backend running on http://localhost:${PORT}`);
});
