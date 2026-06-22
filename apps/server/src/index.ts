import { dirname, resolve } from 'path';
import { createApp } from './app';

const PORT = parseInt(process.env.PORT || '3001', 10);
const DB_PATH = process.env.DATABASE_URL || './data/todos.db';
const STATIC_DIR =
  process.env.STATIC_DIR ||
  (process.argv[1]?.endsWith('server.cjs') ? dirname(resolve(process.argv[1])) : undefined);

const app = createApp(DB_PATH, STATIC_DIR);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
