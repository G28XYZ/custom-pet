import { bigint, boolean, pgTable, text } from 'drizzle-orm/pg-core';

export const todos = pgTable('todos', {
  id: text('id').primaryKey(),
  text: text('text').notNull(),
  completed: boolean('completed').notNull().default(false),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
  updatedAt: bigint('updated_at', { mode: 'number' }).notNull(),
});
