/**
 * 
Functions that take strings and yield streams or dicts of `tugsql.lexer.Token`
objects, keeping track of source location.
 */

import * as context from "./context";

export class Token {
  tag: string;
  value: string | null;
  context: context.Context;

  /**
   *
   * @param tag A character indicating the meaning of the `value`.
   * @param value The string value of the `Token`.
   * @param context A `tugsql.context.Context` for tracking source code information.
   */
  constructor(tag: string, value: string | null, context: context.Context) {
    this.tag = tag;
    this.value = value;
    this.context = context;
  }
}

/**
 * Splits the provided multiline TugSQL string into Tokens.
 */
export function lex(tugsql: string, ctx: context.Context): Token[] {
  function* generate(tugsql: string, ctx: context.Context) {
    for (const line of tugsql.split("\n")) {
      ctx = context.advance(ctx, 1);
      yield _categorize(line, ctx);
    }
  }
  return [...generate(tugsql, ctx)];
}

function _whitespace_advance(
  line: string,
  ctx: context.Context
): [string, context.Context] {
  ctx = context.advance(ctx, 0, line.length - line.trimStart().length);
  return [line.trim(), ctx];
}

function _categorize(line: string, ctx: context.Context): Token {
  [line, ctx] = _whitespace_advance(line, ctx);

  if (line.startsWith("--")) {
    return new Token("C", line, ctx);
  }
  return new Token("Q", line, ctx);
}

export function lex_comment(
  token: Token
): Record<"keyword" | "rest", Token> | null {
  const re = /(?<lead>--\s*)(?<keyword>\:[^ ]+)(?<internalws>\s+)?(?<rest>.*)?/;
  const m = token.value.match(re);

  if (!m) {
    return null;
  }

  const d = m.groups || {};
  const restbegin = Object.keys(d).reduce((sum, k) => {
    if ("rest" === k) {
      return sum;
    }
    return sum + (d[k] || "").length;
  }, 0);

  return {
    keyword: new Token(
      "K",
      d["keyword"],
      context.advance(token.context, 0, d["lead"].length)
    ),

    rest: new Token(
      "S",
      d["rest"] || "",
      context.advance(token.context, 0, restbegin)
    ),
  };
}

export function lex_name(
  token: Token
): Record<"name" | "keyword" | "rest", Token> | null {
  const [line, ctx] = _whitespace_advance(token.value, token.context);

  const re =
    /(?<name>[^ ]+)(?<internalws>\s+)?(?<keyword>\:[^ ]+)?(?<internalws2>\s+)?(?<rest>.+)?/;
  const m = line.match(re);

  if (!m) {
    return null;
  }

  const d = m.groups || {};

  const kwbegin = d["name"].length + (d["internalws"] || "").length;
  const kwctx = context.advance(ctx, 0, kwbegin);
  const restbegin = Object.keys(d).reduce((sum, k) => {
    if ("rest" === k) {
      return sum;
    }
    return sum + (d[k] || "").length;
  }, 0);
  const restctx = context.advance(ctx, 0, restbegin);
  return {
    name: new Token("N", d["name"], ctx),
    keyword: new Token("K", d["keyword"] || null, kwctx),
    rest: new Token("S", d["rest"] || null, restctx),
  };
}

export function lex_result(
  token: Token
): Record<"keyword" | "rest", Token> | null {
  const [line, ctx] = _whitespace_advance(token.value, token.context);
  const re = /(?<keyword>\:[^ ]+)(?<rest>.+)?/;
  const m = line.match(re);

  if (!m) {
    return null;
  }

  const d = m.groups || {};
  const restctx = context.advance(ctx, undefined, d["keyword"].length);

  return {
    keyword: new Token("K", d["keyword"], ctx),
    rest: new Token("S", d["rest"] || null, restctx),
  };
}
