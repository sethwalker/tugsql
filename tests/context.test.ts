import { Context, advance } from "../src/context";

import { describe, expect, test } from "bun:test";

describe("Context", () => {
  test("default line and col", () => {
    expect(new Context("<literal>").line).toEqual(0);
    expect(new Context("<literal>").col).toEqual(1);
  });
  test("advance col", () => {
    expect(advance(new Context("<literal>"), 0, 4).col).toEqual(5);
  });
  test("advance lines", () => {
    expect(advance(new Context("<literal>"), 2).line).toEqual(2);
  });
  test("advance lines from indents", () => {
    expect(advance(new Context("<literal>", 0, 3), 2).col).toEqual(1);
  });
});
