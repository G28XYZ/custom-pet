import { mkdirSync } from 'fs';
import { createRequire } from 'module';
import { dirname, resolve } from 'path';
import postgres from 'postgres';
import type { Todo, TodoUpdate } from '@todo/shared';

const runtimeRequire =
  typeof require === 'function' ? require : createRequire(resolve(process.cwd(), 'package.json'));

export interface Db {
  migrate(): Promise<void>;
  findAll(): Promise<Todo[]>;
  findById(id: string): Promise<Todo | undefined>;
  create(todo: Todo): Promise<void>;
  update(id: string, input: TodoUpdate & { updatedAt: number }): Promise<void>;
  remove(id: string): Promise<boolean>;
  clearCompleted(): Promise<number>;
  reset(): Promise<void>;
}

export function createDb(databaseUrl: string): Db {
  if (isPostgresUrl(databaseUrl)) {
    return createPostgresDb(databaseUrl);
  }

  if ('Bun' in globalThis) {
    throw new Error('DATABASE_URL must be a Postgres connection string in the Onreza/Bun runtime');
  }

  return createSqliteDb(databaseUrl);
}

function isPostgresUrl(value: string): boolean {
  return value.startsWith('postgres://') || value.startsWith('postgresql://');
}

function createSqliteDb(dbPath: string): Db {
  mkdirSync(dirname(dbPath), { recursive: true });

  const Database = runtimeRequire('better-sqlite3');
  const sqlite = new Database(dbPath);
  sqlite.pragma('journal_mode = WAL');

  const normalize = (row: any): Todo => ({
    id: row.id,
    text: row.text,
    completed: Boolean(row.completed),
    createdAt: Number(row.createdAt),
    updatedAt: Number(row.updatedAt),
  });

  return {
    async migrate() {
      sqlite.exec(`
        CREATE TABLE IF NOT EXISTS todos (
          id TEXT PRIMARY KEY,
          text TEXT NOT NULL,
          completed INTEGER NOT NULL DEFAULT 0,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        )
      `);
    },

    async findAll() {
      return sqlite
        .prepare(
          'SELECT id, text, completed, created_at AS createdAt, updated_at AS updatedAt FROM todos ORDER BY created_at ASC'
        )
        .all()
        .map(normalize);
    },

    async findById(id: string) {
      const row = sqlite
        .prepare(
          'SELECT id, text, completed, created_at AS createdAt, updated_at AS updatedAt FROM todos WHERE id = ?'
        )
        .get(id);
      return row ? normalize(row) : undefined;
    },

    async create(todo: Todo) {
      sqlite
        .prepare(
          'INSERT INTO todos (id, text, completed, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
        )
        .run(todo.id, todo.text, todo.completed ? 1 : 0, todo.createdAt, todo.updatedAt);
    },

    async update(id: string, input: TodoUpdate & { updatedAt: number }) {
      const fields: string[] = ['updated_at = @updatedAt'];
      const values: Record<string, unknown> = { id, updatedAt: input.updatedAt };

      if (input.text !== undefined) {
        fields.push('text = @text');
        values.text = input.text;
      }
      if (input.completed !== undefined) {
        fields.push('completed = @completed');
        values.completed = input.completed ? 1 : 0;
      }

      sqlite.prepare(`UPDATE todos SET ${fields.join(', ')} WHERE id = @id`).run(values);
    },

    async remove(id: string) {
      return sqlite.prepare('DELETE FROM todos WHERE id = ?').run(id).changes > 0;
    },

    async clearCompleted() {
      return sqlite.prepare('DELETE FROM todos WHERE completed = 1').run().changes;
    },

    async reset() {
      sqlite.prepare('DELETE FROM todos').run();
    },
  };
}

function createPostgresDb(databaseUrl: string): Db {
  const needsSsl =
    databaseUrl.includes('supabase.co') ||
    databaseUrl.includes('pooler.supabase.com') ||
    databaseUrl.includes('sslmode=require');
  const sql = postgres(databaseUrl, {
    prepare: false,
    ssl: needsSsl ? 'require' : undefined,
  });
  const normalize = (row: any): Todo => ({
    id: row.id,
    text: row.text,
    completed: Boolean(row.completed),
    createdAt: Number(row.createdAt),
    updatedAt: Number(row.updatedAt),
  });

  return {
    async migrate() {
      await sql`
        CREATE TABLE IF NOT EXISTS todos (
          id TEXT PRIMARY KEY,
          text TEXT NOT NULL,
          completed BOOLEAN NOT NULL DEFAULT FALSE,
          created_at BIGINT NOT NULL,
          updated_at BIGINT NOT NULL
        )
      `;
    },

    async findAll() {
      const rows = await sql`
        SELECT
          id,
          text,
          completed,
          created_at::bigint AS "createdAt",
          updated_at::bigint AS "updatedAt"
        FROM todos
        ORDER BY created_at ASC
      `;
      return rows.map(normalize);
    },

    async findById(id: string) {
      const rows = await sql`
        SELECT
          id,
          text,
          completed,
          created_at::bigint AS "createdAt",
          updated_at::bigint AS "updatedAt"
        FROM todos
        WHERE id = ${id}
      `;
      return rows[0] ? normalize(rows[0]) : undefined;
    },

    async create(todo: Todo) {
      await sql`
        INSERT INTO todos (id, text, completed, created_at, updated_at)
        VALUES (${todo.id}, ${todo.text}, ${todo.completed}, ${todo.createdAt}, ${todo.updatedAt})
      `;
    },

    async update(id: string, input: TodoUpdate & { updatedAt: number }) {
      if (input.text !== undefined && input.completed !== undefined) {
        await sql`
          UPDATE todos
          SET text = ${input.text}, completed = ${input.completed}, updated_at = ${input.updatedAt}
          WHERE id = ${id}
        `;
        return;
      }

      if (input.text !== undefined) {
        await sql`
          UPDATE todos
          SET text = ${input.text}, updated_at = ${input.updatedAt}
          WHERE id = ${id}
        `;
        return;
      }

      if (input.completed !== undefined) {
        await sql`
          UPDATE todos
          SET completed = ${input.completed}, updated_at = ${input.updatedAt}
          WHERE id = ${id}
        `;
        return;
      }

      await sql`
        UPDATE todos
        SET updated_at = ${input.updatedAt}
        WHERE id = ${id}
      `;
    },

    async remove(id: string) {
      const rows = await sql<{ id: string }[]>`
        DELETE FROM todos
        WHERE id = ${id}
        RETURNING id
      `;
      return rows.length > 0;
    },

    async clearCompleted() {
      const rows = await sql<{ id: string }[]>`
        DELETE FROM todos
        WHERE completed = TRUE
        RETURNING id
      `;
      return rows.length;
    },

    async reset() {
      await sql`DELETE FROM todos`;
    },
  };
}
