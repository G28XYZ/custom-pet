export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
  updatedAt: number;
}

export type TodoCreate = { text: string; id?: string };
export type TodoUpdate = Partial<Pick<Todo, 'text' | 'completed'>>;
