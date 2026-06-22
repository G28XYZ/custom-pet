import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createAppWithDb } from '../src/app';
import { createTestDb } from '../src/db';
import type { Express } from 'express';

let app: Express;

beforeAll(async () => {
  app = await createAppWithDb(createTestDb());
});

afterAll(() => {});

import supertest from 'supertest';

describe('Server API', () => {
  // Health
  describe('GET /api/health', () => {
    it('should return ok', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: 'ok' });
    });
  });

  // CRUD
  describe('POST /api/todos', () => {
    it('should create a new todo', async () => {
      const res = await request(app)
        .post('/api/todos')
        .send({ text: 'Test todo' });
      expect(res.status).toBe(201);
      expect(res.body.text).toBe('Test todo');
      expect(res.body.completed).toBe(false);
      expect(res.body.id).toBeDefined();
    });

    it('should reject empty text', async () => {
      const res = await request(app)
        .post('/api/todos')
        .send({ text: '' });
      expect(res.status).toBe(400);
    });

    it('should reject whitespace-only text', async () => {
      const res = await request(app)
        .post('/api/todos')
        .send({ text: '   ' });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/todos', () => {
    it('should return all todos', async () => {
      await request(app).post('/api/todos').send({ text: 'One' });
      await request(app).post('/api/todos').send({ text: 'Two' });

      const res = await request(app).get('/api/todos');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(2);
    });

    it('should return empty array when no todos', async () => {
      const freshApp = await createAppWithDb(createTestDb());
      const res = await request(freshApp).get('/api/todos');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  describe('PATCH /api/todos/:id', () => {
    it('should update todo text', async () => {
      const create = await request(app)
        .post('/api/todos')
        .send({ text: 'Original' });

      const res = await request(app)
        .patch(`/api/todos/${create.body.id}`)
        .send({ text: 'Updated' });

      expect(res.status).toBe(200);
      expect(res.body.text).toBe('Updated');
    });

    it('should update todo completed status', async () => {
      const create = await request(app)
        .post('/api/todos')
        .send({ text: 'To complete' });

      const res = await request(app)
        .patch(`/api/todos/${create.body.id}`)
        .send({ completed: true });

      expect(res.status).toBe(200);
      expect(res.body.completed).toBe(true);
    });

    it('should return 404 for non-existent todo', async () => {
      const res = await request(app)
        .patch('/api/todos/nonexistent')
        .send({ text: 'Nope' });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/todos/:id', () => {
    it('should delete a todo', async () => {
      const create = await request(app)
        .post('/api/todos')
        .send({ text: 'To delete' });

      const res = await request(app).delete(`/api/todos/${create.body.id}`);
      expect(res.status).toBe(204);

      // Verify it's gone
      const getRes = await request(app).get('/api/todos');
      const found = getRes.body.find((t: any) => t.id === create.body.id);
      expect(found).toBeUndefined();
    });

    it('should return 404 for non-existent todo', async () => {
      const res = await request(app).delete('/api/todos/nonexistent');
      expect(res.status).toBe(404);
    });
  });

  // Sync
  describe('POST /api/todos/sync', () => {
    it('should sync local todos to server', async () => {
      const res = await request(app)
        .post('/api/todos/sync')
        .send({
          todos: [
            { id: 'local-1', text: 'Local todo', completed: false, createdAt: 1000, updatedAt: 1000 },
          ],
        });

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      const synced = res.body.find((t: any) => t.id === 'local-1');
      expect(synced).toBeDefined();
    });

    it('should delete items from deletedIds', async () => {
      // Create on server first
      await request(app)
        .post('/api/todos')
        .send({ text: 'To be deleted', id: 'del-me' });

      // Sync with deletedIds
      const res = await request(app)
        .post('/api/todos/sync')
        .send({ todos: [], deletedIds: ['del-me'] });

      expect(res.status).toBe(200);
      // Item should be gone
      const getAll = await request(app).get('/api/todos');
      expect(getAll.body.find((t: any) => t.id === 'del-me')).toBeUndefined();
    });

    it('should reject non-object body', async () => {
      const res = await request(app)
        .post('/api/todos/sync')
        .send({ not: 'array' });
      expect(res.status).toBe(400);
    });
  });

  // Clear completed
  describe('DELETE /api/todos/completed', () => {
    it('should clear completed todos', async () => {
      // Create a completed todo
      const create = await request(app)
        .post('/api/todos')
        .send({ text: 'Completed one' });
      await request(app)
        .patch(`/api/todos/${create.body.id}`)
        .send({ completed: true });

      const res = await request(app).delete('/api/todos/completed');
      expect(res.status).toBe(200);
      expect(res.body.deleted).toBeGreaterThanOrEqual(1);
    });
  });
});
