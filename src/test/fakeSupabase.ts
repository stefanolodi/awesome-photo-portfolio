type Row = Record<string, unknown>;
type Result = { data: unknown; error: { message: string } | null };

export type FakeDatabase = Record<string, Row[]>;

// Answers the query chains the hooks build, against rows the test owns. It ignores
// row-level security, so it returns private rows to guests the way a broken policy would.
type SortKey = { column: string; ascending: boolean };

function compare(a: unknown, b: unknown): number {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  const left = String(a);
  const right = String(b);
  return left < right ? -1 : left > right ? 1 : 0;
}

// Answers the query chains the hooks build, against rows the test owns. It ignores
// row-level security, so it returns private rows to guests the way a broken policy would.
class FakeQuery implements PromiseLike<Result> {
  constructor(
    private readonly rows: Row[],
    private readonly one = false,
    private readonly sortKeys: SortKey[] = []
  ) {}

  select() {
    return this;
  }

  eq(column: string, value: unknown) {
    return new FakeQuery(this.rows.filter((row) => row[column] === value), this.one, this.sortKeys);
  }

  // Like Postgres, each later order call only breaks the ties the earlier ones left.
  order(column: string, { ascending = true }: { ascending?: boolean } = {}) {
    const sortKeys = [...this.sortKeys, { column, ascending }];
    const sorted = [...this.rows].sort((a, b) => {
      for (const key of sortKeys) {
        const delta = compare(a[key.column], b[key.column]);
        if (delta !== 0) return key.ascending ? delta : -delta;
      }
      return 0;
    });
    return new FakeQuery(sorted, this.one, sortKeys);
  }

  limit(count: number) {
    return new FakeQuery(this.rows.slice(0, count), this.one, this.sortKeys);
  }

  single() {
    return new FakeQuery(this.rows, true, this.sortKeys);
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
