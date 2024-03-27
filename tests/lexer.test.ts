import { lexer, context } from "../src";

import { describe, expect, test } from "bun:test";

const ctx = new context.Context("<literal>");

function at(line: number, col: number) {
  return new context.Context(ctx.sqlfile, line, col);
}

describe("Lex", () => {
  test("basic", async () => {
    const l1 = new lexer.Token("C", "-- :name username_for_id :1", at(1, 1));
    const l2 = new lexer.Token(
      "Q",
      "select username from users where user_id = :user_id",
      at(2, 1)
    );
    expect([l1, l2]).toEqual(
      lexer.lex((await Bun.file("tests/sql/basic.sql").text()).trim(), ctx)
    );
  });

  test("leading comment whitespace", () => {
    const l1 = new lexer.Token("C", "-- :name username_for_id :1", at(1, 4));
    const l2 = new lexer.Token(
      "Q",
      "select username from users where user_id = :user_id",
      at(2, 1)
    );
    expect([l1, l2]).toEqual(
      lexer.lex(
        "   -- :name username_for_id :1\n" +
          "select username from users where user_id = :user_id",
        ctx
      )
    );
  });

  test("whitespace", () => {
    const l1 = new lexer.Token("C", "-- :name username_for_id :1", at(1, 2));
    const l2 = new lexer.Token(
      "Q",
      "select username from users where user_id = :user_id",
      at(2, 2)
    );
    expect([l1, l2]).toEqual(
      lexer.lex(
        " -- :name username_for_id :1  \n" +
          " select username from users where user_id = :user_id  ",
        ctx
      )
    );
  });

  test("blank lines", () => {
    const l1 = new lexer.Token("C", "-- :name username_for_id :1", at(1, 1));
    const l2 = new lexer.Token("Q", "", at(2, 1));
    const l3 = new lexer.Token(
      "Q",
      "select username from users where user_id = :user_id",
      at(3, 1)
    );
    expect([l1, l2, l3]).toEqual(
      lexer.lex(
        "-- :name username_for_id :1  \n" +
          "\n" +
          "select username from users where user_id = :user_id  ",
        ctx
      )
    );
  });
});

describe("Comment", () => {
  function tok(comment: string): lexer.Token {
    return new lexer.Token("C", comment, at(1, 1));
  }

  test("no_keywords", () => {
    expect(lexer.lex_comment(tok("-- foobar baz"))).toBeNull();
  });

  test("not a comment", () => {
    expect(lexer.lex_comment(tok("select 1"))).toBeNull();
  });

  test("internal keyword", () => {
    expect(lexer.lex_comment(tok("-- stuff :foo bar"))).toBeNull();
  });

  test("works", () => {
    expect(lexer.lex_comment(tok("-- :foo bar baz"))).toEqual({
      keyword: new lexer.Token("K", ":foo", at(1, 4)),
      rest: new lexer.Token("S", "bar baz", at(1, 9)),
    });
  });

  test("multiple keywords", () => {
    expect(lexer.lex_comment(tok("-- :foo bar :baz"))).toEqual({
      keyword: new lexer.Token("K", ":foo", at(1, 4)),
      rest: new lexer.Token("S", "bar :baz", at(1, 9)),
    });
  });

  test("leading whitespace", () => {
    expect(lexer.lex_comment(tok("--      :foo bar :baz"))).toEqual({
      keyword: new lexer.Token("K", ":foo", at(1, 9)),
      rest: new lexer.Token("S", "bar :baz", at(1, 14)),
    });
  });

  test("internal whitespace", () => {
    expect(lexer.lex_comment(tok("--  :foo   bar :baz"))).toEqual({
      keyword: new lexer.Token("K", ":foo", at(1, 5)),
      rest: new lexer.Token("S", "bar :baz", at(1, 12)),
    });
  });

  test("keyword only", () => {
    expect(lexer.lex_comment(tok("-- :foo"))).toEqual({
      keyword: new lexer.Token("K", ":foo", at(1, 4)),
      rest: new lexer.Token("S", "", at(1, 8)),
    });
  });

  test("no space", () => {
    expect(lexer.lex_comment(tok("--:foo"))).toEqual({
      keyword: new lexer.Token("K", ":foo", at(1, 3)),
      rest: new lexer.Token("S", "", at(1, 7)),
    });
  });
});

describe("Name", () => {
  function tok(rest: string) {
    return new lexer.Token("S", rest, at(1, 1));
  }

  test("name only", () => {
    expect(lexer.lex_name(tok("foo"))).toEqual({
      name: new lexer.Token("N", "foo", at(1, 1)),
      keyword: new lexer.Token("K", null, at(1, 4)),
      rest: new lexer.Token("S", null, at(1, 4)),
    });
  });

  test("name rest no keyword", () => {
    expect(lexer.lex_name(tok("foo other stuff"))).toEqual({
      name: new lexer.Token("N", "foo", at(1, 1)),
      keyword: new lexer.Token("K", null, at(1, 5)),
      rest: new lexer.Token("S", "other stuff", at(1, 5)),
    });
  });

  test("with_keyword", () => {
    expect(lexer.lex_name(tok("foo :bar"))).toEqual({
      name: new lexer.Token("N", "foo", at(1, 1)),
      keyword: new lexer.Token("K", ":bar", at(1, 5)),
      rest: new lexer.Token("S", null, at(1, 9)),
    });
  });

  test("with_rest", () => {
    expect(lexer.lex_name(tok("foo :bar other stuff"))).toEqual({
      name: new lexer.Token("N", "foo", at(1, 1)),
      keyword: new lexer.Token("K", ":bar", at(1, 5)),
      rest: new lexer.Token("S", "other stuff", at(1, 10)),
    });
  });

  test("leading_whitespace", () => {
    expect(lexer.lex_name(tok("   foo :bar other stuff"))).toEqual({
      name: new lexer.Token("N", "foo", at(1, 4)),
      keyword: new lexer.Token("K", ":bar", at(1, 8)),
      rest: new lexer.Token("S", "other stuff", at(1, 13)),
    });
  });

  test("trailing_whitespace", () => {
    expect(lexer.lex_name(tok("   foo :bar other stuff   "))).toEqual({
      name: new lexer.Token("N", "foo", at(1, 4)),
      keyword: new lexer.Token("K", ":bar", at(1, 8)),
      rest: new lexer.Token("S", "other stuff", at(1, 13)),
    });
  });

  test("name_only_trailing_whitespace", () => {
    expect(lexer.lex_name(tok("foo    "))).toEqual({
      name: new lexer.Token("N", "foo", at(1, 1)),
      keyword: new lexer.Token("K", null, at(1, 4)),
      rest: new lexer.Token("S", null, at(1, 4)),
    });
  });

  test("with_keyword_trailing_whitespace", () => {
    expect(lexer.lex_name(tok("foo :bar    "))).toEqual({
      name: new lexer.Token("N", "foo", at(1, 1)),
      keyword: new lexer.Token("K", ":bar", at(1, 5)),
      rest: new lexer.Token("S", null, at(1, 9)),
    });
  });

  test("no_name", () => {
    expect(lexer.lex_name(tok("   "))).toBeNull();
  });

  test("empty", () => {
    expect(lexer.lex_name(tok(""))).toBeNull();
  });
});

describe("Result", () => {
  function tok(s: string) {
    return new lexer.Token("S", s, at(1, 1));
  }

  test("works", () => {
    expect(lexer.lex_result(tok(":raw"))).toEqual({
      keyword: new lexer.Token("K", ":raw", at(1, 1)),
      rest: new lexer.Token("S", null, at(1, 5)),
    });
  });

  test("rest", () => {
    expect(lexer.lex_result(tok(":raw stuff"))).toEqual({
      keyword: new lexer.Token("K", ":raw", at(1, 1)),
      rest: new lexer.Token("S", " stuff", at(1, 5)),
    });
  });

  test("no_keyword", () => {
    expect(lexer.lex_result(tok("thing"))).toBeNull();
  });
});
