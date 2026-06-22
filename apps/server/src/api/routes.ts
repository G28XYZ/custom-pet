import { Router, Request, Response } from 'express';
import { TodoRepository } from '../db/repository';
import type { TodoCreate, TodoUpdate } from '@todo/shared';

export function createRouter(repo: TodoRepository): Router {
  const router = Router();

  // GET /todos
  router.get('/todos', async (_req: Request, res: Response) => {
    try {
      const todos = await repo.findAll();
      res.json(todos);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch todos' });
    }
  });

  // POST /todos
  router.post('/todos', async (req: Request, res: Response) => {
    try {
      const input = req.body as TodoCreate;
      if (!input.text || typeof input.text !== 'string' || input.text.trim().length === 0) {
        res.status(400).json({ error: 'Text is required' });
        return;
      }
      const todo = await repo.create({ text: input.text.trim(), id: input.id });
      res.status(201).json(todo);
    } catch (err) {
      res.status(500).json({ error: 'Failed to create todo' });
    }
  });

  // PATCH /todos/:id
  router.patch('/todos/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const input = req.body as TodoUpdate;
      const todo = await repo.update(id, input);
      if (!todo) {
        res.status(404).json({ error: 'Todo not found' });
        return;
      }
      res.json(todo);
    } catch (err) {
      res.status(500).json({ error: 'Failed to update todo' });
    }
  });

  // DELETE /todos/completed (must be before /:id)
  router.delete('/todos/completed', async (_req: Request, res: Response) => {
    try {
      const count = await repo.clearCompleted();
      res.json({ deleted: count });
    } catch (err) {
      res.status(500).json({ error: 'Failed to clear completed todos' });
    }
  });

  // DELETE /todos/:id
  router.delete('/todos/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const deleted = await repo.remove(id);
      if (!deleted) {
        res.status(404).json({ error: 'Todo not found' });
        return;
      }
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete todo' });
    }
  });

  // POST /todos/sync
  router.post('/todos/sync', async (req: Request, res: Response) => {
    try {
      const { todos: localTodos, deletedIds } = req.body as { todos: any[]; deletedIds?: string[] };
      if (!Array.isArray(localTodos)) {
        res.status(400).json({ error: 'todos must be an array' });
        return;
      }
      const result = await repo.sync(localTodos, deletedIds || []);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: 'Failed to sync todos' });
    }
  });

  // POST /reset (test helper)
  router.post('/reset', async (_req: Request, res: Response) => {
    try {
      await repo.reset();
      res.json({ status: 'ok' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to reset' });
    }
  });

  // GET /health
  router.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok' });
  });

  return router;
}
