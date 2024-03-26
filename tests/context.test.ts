import { Context, advance } from "../src/context";

import { expect, test } from "bun:test";

test("Context", () => {
  test("default line and col", () => {
    expect(new Context("<literal>")).toEqual({
      line: 0,
      col: 1,
      sqlfile: "<literal>",
    });
  });
  test("advance col", () => {
    expect(advance(new Context("<literal>"), 4)).toEqual({
      line: 0,
      col: 5,
      sqlfile: "<literal>",
    });
  });
  test("advance lines", () => {
    expect(advance(new Context("<literal>", 2, 3), 2)).toEqual({
      line: 2,
      col: 5,
      sqlfile: "<literal>",
    });
  });
  test("advance lines from indents", () => {
    expect(advance(new Context("<literal>", 2, 3), 2, 1)).toEqual({
      line: 3,
      col: 1,
      sqlfile: "<literal>",
    });
  });
});
