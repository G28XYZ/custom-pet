import { v4 as uuid } from 'uuid';
import type { Todo, TodoCreate, TodoUpdate } from '@todo/shared';
import type { Db } from './index';

export class TodoRepository {
  constructor(private db: Db) {}

  async findAll(): Promise<Todo[]> {
    return this.db.findAll();
  }

  async findById(id: string): Promise<Todo | undefined> {
    return this.db.findById(id);
  }

  async create(input: TodoCreate): Promise<Todo> {
    const now = Date.now();
    const todo: Todo = {
      id: input.id || uuid(),
      text: input.text,
      completed: false,
      createdAt: now,
      updatedAt: now,
    };
    await this.db.create(todo);
    return todo;
  }

  async update(id: string, input: TodoUpdate): Promise<Todo | undefined> {
    const existing = await this.findById(id);
    if (!existing) return undefined;

    const updated: Partial<Todo> = { updatedAt: Date.now() };
    if (input.text !== undefined) updated.text = input.text;
    if (input.completed !== undefined) updated.completed = input.completed;

    await this.db.update(id, updated as TodoUpdate & { updatedAt: number });
    return this.findById(id);
  }

  async remove(id: string): Promise<boolean> {
    return this.db.remove(id);
  }

  async clearCompleted(): Promise<number> {
    return this.db.clearCompleted();
  }

  async reset(): Promise<void> {
    await this.db.reset();
  }

  async sync(localTodos: Todo[], deletedIds: string[] = []): Promise<Todo[]> {
    // Process deletions first
    for (const id of deletedIds) {
      await this.db.remove(id);
    }

    const serverTodos = await this.findAll();
    const serverMap = new Map(serverTodos.map(t => [t.id, t]));

    for (const local of localTodos) {
      const server = serverMap.get(local.id);
      if (!server) {
        // New local item - create on server
        await this.db.create({
          id: local.id,
          text: local.text,
          completed: local.completed,
          createdAt: local.createdAt,
          updatedAt: local.updatedAt,
        });
        serverMap.set(local.id, local);
      } else if (local.updatedAt > server.updatedAt) {
        // Local is newer - update server
        await this.db.update(local.id, {
          text: local.text,
          completed: local.completed,
          updatedAt: local.updatedAt,
        });
        serverMap.set(local.id, { ...server, ...local, updatedAt: local.updatedAt });
      }
    }

    return Array.from(serverMap.values());
  }
}
