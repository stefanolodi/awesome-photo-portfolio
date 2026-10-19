type Row = Record<string, unknown>;
type Result = { data: unknown; error: { message: string } | null };

export type FakeDatabase = Record<string, Row[]>;

// Answers the query chains the hooks build, against rows the test owns. It ignores
// row-level security, so it returns private rows to guests the way a broken policy would.
class FakeQuery implements PromiseLike<Result> {
  constructor(
    private readonly rows: Row[],
    private readonly one = false
  ) {}

  select() {
    return this;
  }

  eq(column: string, value: unknown) {
    return new FakeQuery(this.rows.filter((row) => row[column] === value), this.one);
  }

  order(column: string, { ascending = true }: { ascending?: boolean } = {}) {
    const sorted = [...this.rows].sort((a, b) => {
      const delta = Number(a[column]) - Number(b[column]);
      return ascending ? delta : -delta;
    });
    return new FakeQuery(sorted, this.one);
  }

  limit(count: number) {
    return new FakeQuery(this.rows.slice(0, count), this.one);
  }

  single() {
    return new FakeQuery(this.rows, true);
  }

  then<A = Result, B = never>(
    onFulfilled?: ((value: Result) => A | PromiseLike<A>) | null,
    onRejected?: ((reason: unknown) => B | PromiseLike<B>) | null
  ): PromiseLike<A | B> {
    const result: Result = this.one
      ? { data: this.rows[0] ?? null, error: this.rows[0] ? null : { message: 'No rows' } }
      : { data: this.rows, error: null };
    return Promise.resolve(result).then(onFulfilled, onRejected);
  }
}

export function fakeSupabase(db: FakeDatabase) {
  return {
    from: (table: string) => {
      const rows = (db[table] ??= []);
      return {
        select: () => new FakeQuery(rows),
        insert: (row: Row) => {
          const saved = { id: `new-${rows.length}`, ...row };
          rows.push(saved);
          return new FakeQuery([saved]);
        },
      };
    },
  };
}
