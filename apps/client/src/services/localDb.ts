import { openDB, type IDBPDatabase } from 'idb';
import type { Todo } from '@todo/shared';

const DB_NAME = 'todo-app';
const STORE_NAME = 'todos';
const DELETED_STORE = 'deletedIds';

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, 2, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('updatedAt', 'updatedAt');
        }
        if (!db.objectStoreNames.contains(DELETED_STORE)) {
          db.createObjectStore(DELETED_STORE, { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

export async function getAllTodos(): Promise<Todo[]> {
  const db = await getDb();
  return db.getAll(STORE_NAME);
}

export async function saveTodo(todo: Todo): Promise<void> {
  const db = await getDb();
  await db.put(STORE_NAME, todo);
}

export async function saveTodos(todos: Todo[]): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  for (const todo of todos) {
    await tx.store.put(todo);
  }
  await tx.done;
}

export async function deleteTodo(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(STORE_NAME, id);
  // Track deletion for sync
  await db.put(DELETED_STORE, { id, deletedAt: Date.now() });
}

export async function deleteTodos(ids: string[]): Promise<void> {
  const db = await getDb();
  const tx = db.transaction([STORE_NAME, DELETED_STORE], 'readwrite');
  for (const id of ids) {
    await tx.objectStore(STORE_NAME).delete(id);
    await tx.objectStore(DELETED_STORE).put({ id, deletedAt: Date.now() });
  }
  await tx.done;
}

export async function getDeletedIds(): Promise<string[]> {
  const db = await getDb();
  const all = await db.getAll(DELETED_STORE);
  return all.map((d: any) => d.id);
}

export async function clearDeletedIds(): Promise<void> {
  const db = await getDb();
  await db.clear(DELETED_STORE);
}

export async function clearAll(): Promise<void> {
  const db = await getDb();
  await db.clear(STORE_NAME);
  await db.clear(DELETED_STORE);
}
