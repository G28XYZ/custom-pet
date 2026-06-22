import { useState, useEffect, useCallback, useRef } from 'react';
import type { Todo } from '@todo/shared';
import * as localDb from '../services/localDb';
import { api } from '../services/api';

export type Filter = 'all' | 'active' | 'completed';

interface UseTodosOptions {
  startSync: () => void;
  endSync: (success: boolean) => void;
}

export function useTodos({ startSync, endSync }: UseTodosOptions) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [loading, setLoading] = useState(true);
  const loadedRef = useRef(false);

  // Load from local DB first, then sync with server
  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    async function load() {
      try {
        // Load local first
        const local = await localDb.getAllTodos();
        setTodos(local);
        setLoading(false);

        // Try syncing with server in background
        if (navigator.onLine) {
          try {
            startSync();
            const deletedIds = await localDb.getDeletedIds();
            const synced = await api.sync(local, deletedIds);
            // Clear deleted IDs after successful sync
            await localDb.clearDeletedIds();
            // Conflict resolution: server wins for items modified on server
            const merged = mergeTodos(local, synced);
            setTodos(merged);
            await localDb.saveTodos(merged);
            endSync(true);
          } catch {
            endSync(false);
            // Server unavailable - keep local data and deletedIds for next sync
          }
        }
      } catch {
        setLoading(false);
        endSync(false);
      }
    }
    load();
  }, [startSync, endSync]);

  const addTodo = useCallback(async (text: string) => {
    const now = Date.now();
    const todo: Todo = {
      id: crypto.randomUUID(),
      text: text.trim(),
      completed: false,
      createdAt: now,
      updatedAt: now,
    };

    // Save locally first
    await localDb.saveTodo(todo);
    setTodos(prev => [...prev, todo]);

    // Try syncing with server
    if (navigator.onLine) {
      try {
        const serverTodo = await api.create({ text: todo.text, id: todo.id });
        const merged = { ...todo, ...serverTodo, id: todo.id };
        await localDb.saveTodo(merged);
        setTodos(prev => prev.map(t => t.id === todo.id ? merged : t));
      } catch {
        // Will sync later
      }
    }
  }, []);

  const toggleTodo = useCallback(async (id: string) => {
    setTodos(prev => {
      const todo = prev.find(t => t.id === id);
      if (!todo) return prev;
      const updated = { ...todo, completed: !todo.completed, updatedAt: Date.now() };
      localDb.saveTodo(updated);
      // Try server
      if (navigator.onLine) {
        api.update(id, { completed: updated.completed }).catch(() => {});
      }
      return prev.map(t => t.id === id ? updated : t);
    });
  }, []);

  const editTodo = useCallback(async (id: string, text: string) => {
    setTodos(prev => {
      const todo = prev.find(t => t.id === id);
      if (!todo) return prev;
      const updated = { ...todo, text: text.trim(), updatedAt: Date.now() };
      localDb.saveTodo(updated);
      // Try server
      if (navigator.onLine) {
        api.update(id, { text: updated.text }).catch(() => {});
      }
      return prev.map(t => t.id === id ? updated : t);
    });
  }, []);

  const removeTodo = useCallback(async (id: string) => {
    await localDb.deleteTodo(id);
    setTodos(prev => prev.filter(t => t.id !== id));
    // Try server
    if (navigator.onLine) {
      api.remove(id).catch(() => {});
    }
  }, []);

  const clearCompleted = useCallback(async () => {
    setTodos(prev => {
      const completedIds = prev.filter(t => t.completed).map(t => t.id);
      if (completedIds.length > 0) {
        localDb.deleteTodos(completedIds);
      }
      // Try server
      if (navigator.onLine) {
        api.clearCompleted().catch(() => {});
      }
      return prev.filter(t => !t.completed);
    });
  }, []);

  const filteredTodos = todos.filter(t => {
    if (filter === 'active') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  return {
    todos: filteredTodos,
    allTodos: todos,
    filter,
    setFilter,
    loading,
    addTodo,
    toggleTodo,
    editTodo,
    removeTodo,
    clearCompleted,
  };
}

/**
 * Conflict resolution strategy: last-write-wins based on updatedAt.
 * For items present in both local and server, keep the newer one.
 * For items only on server, add them (another client added them).
 * For items only locally, keep them (they'll sync on next round).
 */
function mergeTodos(local: Todo[], server: Todo[]): Todo[] {
  const result = new Map<string, Todo>();

  // Add all local items
  for (const t of local) {
    result.set(t.id, t);
  }

  // Merge server items
  for (const st of server) {
    const localItem = result.get(st.id);
    if (!localItem) {
      // Server has item that local doesn't (from another client) - add it
      result.set(st.id, st);
    } else if (st.updatedAt > localItem.updatedAt) {
      // Server version is newer - use it
      result.set(st.id, { ...localItem, ...st, updatedAt: st.updatedAt });
    }
    // else: local is newer or same - keep local
  }

  return Array.from(result.values());
}
