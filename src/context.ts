/**
 * Objects and methods used to keep track of positions in source files.
 */

/**
 * A context object that holds information about the current position in a SQL file.
 */
export class Context {
  readonly sqlfile: string;
  readonly line: number;
  readonly col: number;

  constructor(sqlfile: string, line: number = 0, col: number = 1) {
    this.sqlfile = sqlfile;
    this.line = line;
    this.col = col;
  }
}

/**
 *
 * Advances the provided context object to indicate a farther position in the
 * same file. Passing `lines` advances lines, and passing `cols` advances
 * columns. Returns a new Context object.
 *
 * @remarks
 * When advancing `lines`, the current `cols` is reset to zero.
 *
 * @example
 * ```typescript
 * const ctx = { sqlfile: "example.sql", line: 1, col: 5 };
 * const newCtx = advance(ctx, 1); // Advances to the next line, col resets to 1
 * ```
 *
 * @param context - The current context object.
 * @param lines - The number of lines to advance. Defaults to 0.
 * @param cols - The number of columns to advance. Only applies if `lines` is 0. Defaults to 0.
 * @returns A new {@link Context} object with the updated position.
 */

export function advance(
  context: Context,
  lines: number = 0,
  cols: number = 0
): Context {
  const c = 0 === lines ? context.col + cols : 1;
  return new Context(context.sqlfile, context.line + lines, c);
}
