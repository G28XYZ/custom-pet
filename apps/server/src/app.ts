import express from 'express';
import cors from 'cors';
import { join } from 'path';
import { createDb } from './db';
import { migrate } from './db/migrate';
import { TodoRepository } from './db/repository';
import { createRouter } from './api/routes';

export async function createApp(dbPath: string, staticDir?: string) {
  const db = createDb(dbPath);
  await migrate(db);

  const repo = new TodoRepository(db);
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use('/api', createRouter(repo));

  if (staticDir) {
    app.use(express.static(staticDir));
    app.get('*', (_req, res) => {
      res.sendFile(join(staticDir, 'index.html'));
    });
  }

  return app;
}
