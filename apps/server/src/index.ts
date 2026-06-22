import { dirname, resolve } from 'path';
import { createApp } from './app';

const PORT = parseInt(process.env.PORT || '3001', 10);
const DATABASE_URL = process.env.DATABASE_URL;
const STATIC_DIR =
  process.env.STATIC_DIR ||
  (process.argv[1]?.endsWith('server.cjs') ? dirname(resolve(process.argv[1])) : undefined);

async function main() {
  if (!DATABASE_URL) {
    throw new Error('DATABASE_URL is required');
  }

  const app = await createApp(DATABASE_URL, STATIC_DIR);

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

main().catch((error) => {
  console.error('Failed to start server', error);
  process.exit(1);
});
