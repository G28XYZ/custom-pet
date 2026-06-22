import { eq } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';
import type { Todo, TodoCreate, TodoUpdate } from '@todo/shared';
import type { Db } from './index';
import { todos } from './schema';

export class TodoRepository {
  constructor(private db: Db) {}

  async findAll(): Promise<Todo[]> {
    return this.db.select().from(todos).all();
  }

  async findById(id: string): Promise<Todo | undefined> {
    return this.db.select().from(todos).where(eq(todos.id, id)).get();
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
    this.db.insert(todos).values(todo).run();
    return todo;
  }

  async update(id: string, input: TodoUpdate): Promise<Todo | undefined> {
    const existing = await this.findById(id);
    if (!existing) return undefined;

    const updated: Partial<Todo> = { updatedAt: Date.now() };
    if (input.text !== undefined) updated.text = input.text;
    if (input.completed !== undefined) updated.completed = input.completed;

    this.db.update(todos).set(updated).where(eq(todos.id, id)).run();
    return this.findById(id);
  }

  async remove(id: string): Promise<boolean> {
    const result = this.db.delete(todos).where(eq(todos.id, id)).run();
    return result.changes > 0;
  }

  async clearCompleted(): Promise<number> {
    const result = this.db.delete(todos).where(eq(todos.completed, true)).run();
    return result.changes;
  }

  async reset(): Promise<void> {
    this.db.delete(todos).run();
  }

  async sync(localTodos: Todo[], deletedIds: string[] = []): Promise<Todo[]> {
    // Process deletions first
    for (const id of deletedIds) {
      this.db.delete(todos).where(eq(todos.id, id)).run();
    }

    const serverTodos = await this.findAll();
    const serverMap = new Map(serverTodos.map(t => [t.id, t]));

    for (const local of localTodos) {
      const server = serverMap.get(local.id);
      if (!server) {
        // New local item - create on server
        this.db.insert(todos).values({
          id: local.id,
          text: local.text,
          completed: local.completed,
          createdAt: local.createdAt,
          updatedAt: local.updatedAt,
        }).run();
        serverMap.set(local.id, local);
      } else if (local.updatedAt > server.updatedAt) {
        // Local is newer - update server
        this.db.update(todos)
          .set({ text: local.text, completed: local.completed, updatedAt: local.updatedAt })
          .where(eq(todos.id, local.id))
          .run();
        serverMap.set(local.id, { ...server, ...local, updatedAt: local.updatedAt });
      }
    }

    return Array.from(serverMap.values());
  }
}
