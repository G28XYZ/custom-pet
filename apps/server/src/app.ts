import express from 'express';
import cors from 'cors';
import { join } from 'path';
import { createDb } from './db';
import { migrate } from './db/migrate';
import { TodoRepository } from './db/repository';
import { createRouter } from './api/routes';
import type { Db } from './db';

export async function createApp(dbPath: string, staticDir?: string) {
  const db = createDb(dbPath);
  return createAppWithDb(db, staticDir);
}

export async function createAppWithDb(db: Db, staticDir?: string) {
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
