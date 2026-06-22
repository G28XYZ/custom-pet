import { sql } from 'drizzle-orm';
import { type Db } from './index';
import { todos } from './schema';

export async function migrate(db: Db) {
  db.run(sql`
    CREATE TABLE IF NOT EXISTS todos (
      id TEXT PRIMARY KEY,
      text TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);
}
