import type { Todo } from '@todo/shared';
import { TodoItem } from './TodoItem';

interface Props {
  todos: Todo[];
  label: string;
  t: {
    markDone: string;
    markNotDone: string;
    edit: string;
    remove: string;
    save: string;
    cancel: string;
  };
  onToggle: (id: string) => void;
  onEdit: (id: string, text: string) => void;
  onRemove: (id: string) => void;
}

export function TodoList({ todos, label, t, onToggle, onEdit, onRemove }: Props) {
  return (
    <div className="todoBody">
      <ul className="todoList" aria-label={label}>
        {todos.map(todo => (
          <TodoItem
            key={todo.id}
            todo={todo}
            t={t}
            onToggle={onToggle}
            onEdit={onEdit}
            onRemove={onRemove}
          />
        ))}
      </ul>
    </div>
  );
}
