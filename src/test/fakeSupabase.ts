type Row = Record<string, unknown>;
type Result = { data: unknown; error: { message: string } | null };

export type FakeDatabase = Record<string, Row[]>;

type SortKey = { column: string; ascending: boolean };

function compare(a: unknown, b: unknown): number {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  const left = String(a);
  const right = String(b);
  return left < right ? -1 : left > right ? 1 : 0;
}

// Answers the query chains the hooks build, against rows the test owns. It ignores
// row-level security, so it returns private rows to guests the way a broken policy would.
type Mode = 'many' | 'single' | 'maybeSingle';

class FakeQuery implements PromiseLike<Result> {
  constructor(
    private readonly rows: Row[],
    private readonly failure: string | null = null,
    private readonly mode: Mode = 'many',
    private readonly sortKeys: SortKey[] = []
  ) {}

  private with(rows: Row[], mode = this.mode, sortKeys = this.sortKeys) {
    return new FakeQuery(rows, this.failure, mode, sortKeys);
  }

  select() {
    return this;
  }

  eq(column: string, value: unknown) {
    return this.with(this.rows.filter((row) => row[column] === value));
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
    return this.with(sorted, this.mode, sortKeys);
  }

  limit(count: number) {
    return this.with(this.rows.slice(0, count));
  }

  single() {
    return this.with(this.rows, 'single');
  }

  maybeSingle() {
    return this.with(this.rows, 'maybeSingle');
  }

  private result(): Result {
    if (this.failure) return { data: null, error: { message: this.failure } };
    const first = this.rows[0] ?? null;
    if (this.mode === 'single') return { data: first, error: first ? null : { message: 'No rows' } };
    if (this.mode === 'maybeSingle') return { data: first, error: null };
    return { data: this.rows, error: null };
  }

  then<A = Result, B = never>(
    onFulfilled?: ((value: Result) => A | PromiseLike<A>) | null,
    onRejected?: ((reason: unknown) => B | PromiseLike<B>) | null
  ): PromiseLike<A | B> {
    return Promise.resolve(this.result()).then(onFulfilled, onRejected);
  }
}

// A table named in failingReads answers every select with an error, the way a dropped
// connection or a denying policy would.
export function fakeSupabase(db: FakeDatabase, failingReads: Set<string> = new Set()) {
  return {
    from: (table: string) => {
      const rows = (db[table] ??= []);
      return {
        select: () => new FakeQuery(rows, failingReads.has(table) ? `Could not read ${table}` : null),
        insert: (row: Row) => {
          const saved = { id: `new-${rows.length}`, ...row };
          rows.push(saved);
          return new FakeQuery([saved]);
        },
      };
    },
  };
}
