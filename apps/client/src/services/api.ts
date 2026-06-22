import type { Todo, TodoCreate, TodoUpdate } from '@todo/shared';

const API_BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  getAll: () => request<Todo[]>('/todos'),

  create: (input: TodoCreate) =>
    request<Todo>('/todos', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  update: (id: string, input: TodoUpdate) =>
    request<Todo>(`/todos/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),

  remove: (id: string) =>
    request<void>(`/todos/${id}`, { method: 'DELETE' }),

  clearCompleted: () =>
    request<{ deleted: number }>('/todos/completed', { method: 'DELETE' }),

  sync: (todos: Todo[], deletedIds?: string[]) =>
    request<Todo[]>('/todos/sync', {
      method: 'POST',
      body: JSON.stringify({ todos, deletedIds: deletedIds || [] }),
    }),
};
