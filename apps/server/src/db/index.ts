import postgres from 'postgres';
import type { Todo, TodoUpdate } from '@todo/shared';

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
  if (!isPostgresUrl(databaseUrl)) {
    throw new Error('DATABASE_URL must be a Postgres connection string');
  }

  return createPostgresDb(databaseUrl);
}

export function createTestDb(): Db {
  const todos = new Map<string, Todo>();

  return {
    async migrate() {},
    async findAll() {
      return Array.from(todos.values()).sort((a, b) => a.createdAt - b.createdAt);
    },
    async findById(id: string) {
      return todos.get(id);
    },
    async create(todo: Todo) {
      todos.set(todo.id, todo);
    },
    async update(id: string, input: TodoUpdate & { updatedAt: number }) {
      const todo = todos.get(id);
      if (!todo) return;
      todos.set(id, {
        ...todo,
        text: input.text ?? todo.text,
        completed: input.completed ?? todo.completed,
        updatedAt: input.updatedAt,
      });
    },
    async remove(id: string) {
      return todos.delete(id);
    },
    async clearCompleted() {
      let count = 0;
      for (const todo of todos.values()) {
        if (todo.completed) {
          todos.delete(todo.id);
          count += 1;
        }
      }
      return count;
    },
    async reset() {
      todos.clear();
    },
  };
}

function isPostgresUrl(value: string): boolean {
  return value.startsWith('postgres://') || value.startsWith('postgresql://');
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
