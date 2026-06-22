import { type Db } from './index';

export async function migrate(db: Db) {
  await db.migrate();
}
