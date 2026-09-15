class ASTNode {
  constructor(type, value = null, children = [], line = null, extras = {}) {
    this.type = type;
    this.value = value;
    this.children = children;
    this.line = line;
    Object.assign(this, extras);
  }

  toJSON() {
    const base = {
      type: this.type,
      value: this.value,
      children: this.children,
      line: this.line
    };
    if (this.varType !== undefined) {
      base.varType = this.varType;
    }
    if (this.identifier !== undefined) {
      base.identifier = this.identifier;
    }
    return base;
  }
}

function isKeyword(token, keyword) {
  return token && token.type === "Keyword" && token.lexeme === keyword;
}

function isDelimiter(token, delimiter) {
  return token && token.type === "Delimiter" && token.lexeme === delimiter;
}

function isOperator(token, lexeme) {
  return (
    token &&
    (token.type === "ArithmeticOperator" ||
      token.type === "RelationalOperator" ||
      token.type === "LogicalOperator") &&
    token.lexeme === lexeme
  );
}

class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.currentIndex = 0;
    this.errors = [];
  }

  current() {
    return this.tokens[this.currentIndex] || null;
  }

  advance() {
    if (this.currentIndex < this.tokens.length) {
      this.currentIndex += 1;
    }
    return this.current();
  }

  match(type, lexeme = null) {
    const token = this.current();
    if (!token) {
      return false;
    }
    if (token.type !== type) {
      return false;
    }
    if (lexeme && token.lexeme !== lexeme) {
      return false;
    }
    this.advance();
    return true;
  }

  expect(type, lexeme, message) {
    const token = this.current();
    if (this.match(type, lexeme)) {
      return true;
    }
    const lineInfo = token ? `line ${token.line}` : "end of input";
    this.errors.push(`${message} at ${lineInfo}.`);
    return false;
  }

  synchronize() {
    while (this.current()) {
      if (this.current().type === "Delimiter" && this.current().lexeme === ";") {
        this.advance();
        return;
      }
      if (this.current().type === "Delimiter" && this.current().lexeme === "}") {
        return;
      }
      this.advance();
    }
  }

  parseProgram() {
    const statements = [];
    while (this.current()) {
      const startIndex = this.currentIndex;
      const stmt = this.parseStatement();
      if (stmt) {
        statements.push(stmt);
      } else {
        if (this.currentIndex === startIndex) {
          this.synchronize();
        }
      }
    }
    return new ASTNode("Program", null, statements, statements[0]?.line ?? null);
  }

  parseStatement() {
    const token = this.current();
    if (!token) {
      return null;
    }

    if (isKeyword(token, "int") || isKeyword(token, "float")) {
      if (this.looksLikeFunctionDefinition()) {
        return this.parseFunctionDefinition();
      }
      return this.parseVarDecl();
    }
    if (isKeyword(token, "if")) {
      return this.parseIfStatement();
    }
    if (isKeyword(token, "while")) {
      return this.parseWhileStatement();
    }
    if (isKeyword(token, "return")) {
      return this.parseReturnStatement();
    }
    if (token.type === "Identifier") {
      return this.parseAssignment();
    }
    if (token.type === "Invalid") {
      this.errors.push(`Invalid token '${token.lexeme}' at line ${token.line}.`);
      this.advance();
      return null;
    }

    this.errors.push(`Unexpected token '${token.lexeme}' at line ${token.line}.`);
    this.advance();
    return null;
  }

  parseVarDecl() {
    const typeToken = this.current();
    this.advance();

    const idToken = this.current();
    if (!idToken || idToken.type !== "Identifier") {
      const lineInfo = idToken ? `line ${idToken.line}` : "end of input";
      this.errors.push(`Expected identifier after type at ${lineInfo}.`);
      return null;
    }
    this.advance();

    let initExpr = null;
    if (this.current()?.type === "AssignmentOperator" && this.current()?.lexeme === "=") {
      this.advance();
      initExpr = this.parseExpression();
      if (!initExpr) {
        this.errors.push(`Missing initializer expression in declaration at line ${idToken.line}.`);
      }
    }

    this.expect("Delimiter", ";", "Expected ';' after variable declaration");

    const children = [new ASTNode("Identifier", idToken.lexeme, [], idToken.line)];
    if (initExpr) {
      children.push(initExpr);
    }
    return new ASTNode("Declaration", null, children, typeToken.line, {
      varType: typeToken.lexeme,
      identifier: idToken.lexeme,
    });
  }

  looksLikeFunctionDefinition() {
    const t0 = this.tokens[this.currentIndex];
    const t1 = this.tokens[this.currentIndex + 1];
    const t2 = this.tokens[this.currentIndex + 2];
    const t3 = this.tokens[this.currentIndex + 3];
    const t4 = this.tokens[this.currentIndex + 4];
    return (
      !!t0 &&
      !!t1 &&
      !!t2 &&
      !!t3 &&
      !!t4 &&
      t0.type === "Keyword" &&
      (t0.lexeme === "int" || t0.lexeme === "float") &&
      t1.type === "Identifier" &&
      t2.type === "Delimiter" &&
      t2.lexeme === "(" &&
      t3.type === "Delimiter" &&
      t3.lexeme === ")" &&
      t4.type === "Delimiter" &&
      t4.lexeme === "{"
    );
  }

  parseFunctionDefinition() {
    const returnTypeToken = this.current();
    this.advance(); // type
    const nameToken = this.current();
    this.advance(); // identifier

    this.expect("Delimiter", "(", "Expected '(' after function name");
    this.expect("Delimiter", ")", "Expected ')' after function parameters");
    const body = this.parseBlock();
    if (!body) {
      return null;
    }

    return new ASTNode("FunctionDefinition", null, [body], returnTypeToken.line, {
      varType: returnTypeToken.lexeme,
      identifier: nameToken?.lexeme,
    });
  }

  parseAssignment() {
    const idToken = this.current();
    this.advance();

    if (!this.expect("AssignmentOperator", "=", "Expected '=' in assignment")) {
      return null;
    }

    if (this.current() && isDelimiter(this.current(), ";")) {
      this.errors.push(`Syntax Error: Missing expression after '=' at line ${this.current().line}.`);
      this.advance();
      return new ASTNode(
        "Assignment",
        null,
        [new ASTNode("Identifier", idToken.lexeme, [], idToken.line), new ASTNode("NumericLiteral", "0", [], idToken.line)],
        idToken.line
      );
    }

    const expr = this.parseExpression();
    if (!expr) {
      return null;
    }
    this.expect("Delimiter", ";", "Expected ';' after assignment");

    return new ASTNode(
      "Assignment",
      null,
      [new ASTNode("Identifier", idToken.lexeme, [], idToken.line), expr],
      idToken.line
    );
  }

  parseIfStatement() {
    const ifToken = this.current();
    this.advance();

    this.expect("Delimiter", "(", "Expected '(' after 'if'");
    const condition = this.parseExpression();
    this.expect("Delimiter", ")", "Expected ')' after if condition");
    const block = this.parseBlockOrSingleStatement("if");
    if (!condition) {
      return null;
    }
    return new ASTNode("IfStatement", null, [condition, block], ifToken.line);
  }

  parseWhileStatement() {
    const whileToken = this.current();
    this.advance();

    this.expect("Delimiter", "(", "Expected '(' after 'while'");
    const condition = this.parseExpression();
    this.expect("Delimiter", ")", "Expected ')' after while condition");
    const block = this.parseBlockOrSingleStatement("while");
    if (!condition) {
      return null;
    }
    return new ASTNode("WhileStatement", null, [condition, block], whileToken.line);
  }

  parseReturnStatement() {
    const returnToken = this.current();
    this.advance();
    let expr = null;
    if (!(this.current() && isDelimiter(this.current(), ";"))) {
      expr = this.parseExpression();
    }
    this.expect("Delimiter", ";", "Expected ';' after return");
    return new ASTNode("ReturnStatement", null, expr ? [expr] : [], returnToken?.line ?? null);
  }

  parseBlock() {
    if (!this.expect("Delimiter", "{", "Expected '{' to start block")) {
      return null;
    }
    const statements = [];
    while (this.current() && !(this.current().type === "Delimiter" && this.current().lexeme === "}")) {
      const startIndex = this.currentIndex;
      const stmt = this.parseStatement();
      if (stmt) {
        statements.push(stmt);
      } else {
        if (this.currentIndex === startIndex) {
          this.synchronize();
        }
      }
    }
    this.expect("Delimiter", "}", "Expected '}' to close block");
    return new ASTNode("Block", null, statements, statements[0]?.line ?? null);
  }

  parseBlockOrSingleStatement(contextName) {
    if (this.current() && isDelimiter(this.current(), "{")) {
      return this.parseBlock();
    }

    this.errors.push(`Expected '{' to start ${contextName} block at line ${this.current()?.line ?? "end of input"}.`);
    const single = this.parseStatement();
    if (single) {
      return new ASTNode("Block", null, [single], single.line ?? this.current()?.line ?? null);
    }
    return new ASTNode("Block", null, [], this.current()?.line ?? null);
  }

  parseExpression() {
    return this.parseLogicalOr();
  }

  parseLogicalOr() {
    let left = this.parseLogicalAnd();
    while (this.current() && isOperator(this.current(), "||")) {
      const opToken = this.current();
      this.advance();
      const right = this.parseLogicalAnd();
      if (!right) {
        return left;
      }
      left = new ASTNode("BinaryExpression", opToken.lexeme, [left, right], opToken.line);
    }
    return left;
  }

  parseLogicalAnd() {
    let left = this.parseRelational();
    while (this.current() && isOperator(this.current(), "&&")) {
      const opToken = this.current();
      this.advance();
      const right = this.parseRelational();
      if (!right) {
        return left;
      }
      left = new ASTNode("BinaryExpression", opToken.lexeme, [left, right], opToken.line);
    }
    return left;
  }

  parseRelational() {
    let left = this.parseAdditive();
    while (this.current() && this.current().type === "RelationalOperator") {
      const opToken = this.current();
      this.advance();
      const right = this.parseAdditive();
      if (!right) {
        return left;
      }
      left = new ASTNode("BinaryExpression", opToken.lexeme, [left, right], opToken.line);
    }
    return left;
  }

  parseAdditive() {
    let left = this.parseMultiplicative();
    while (this.current() && (isOperator(this.current(), "+") || isOperator(this.current(), "-"))) {
      const opToken = this.current();
      this.advance();
      const right = this.parseMultiplicative();
      left = new ASTNode("BinaryExpression", opToken.lexeme, [left, right], opToken.line);
    }
    return left;
  }

  parseMultiplicative() {
    let left = this.parsePrimary();
    while (this.current() && (isOperator(this.current(), "*") || isOperator(this.current(), "/"))) {
      const opToken = this.current();
      this.advance();
      const right = this.parsePrimary();
      left = new ASTNode("BinaryExpression", opToken.lexeme, [left, right], opToken.line);
    }
    return left;
  }

  parsePrimary() {
    const token = this.current();
    if (!token) {
      return null;
    }

    if (token.type === "NumericConstant") {
      this.advance();
      return new ASTNode("NumericLiteral", token.lexeme, [], token.line);
    }

    if (token.type === "Identifier") {
      this.advance();
      return new ASTNode("Identifier", token.lexeme, [], token.line);
    }

    if (isDelimiter(token, "(")) {
      this.advance();
      const expr = this.parseExpression();
      this.expect("Delimiter", ")", "Expected ')' after expression");
      return expr;
    }

    this.errors.push(`Unexpected token '${token.lexeme}' at line ${token.line}.`);
    this.advance();
    return null;
  }
}

export function parse(tokens) {
  const parser = new Parser(tokens);
  const ast = parser.parseProgram();
  return { ast: ast ? ast.toJSON() : null, errors: parser.errors };
}
