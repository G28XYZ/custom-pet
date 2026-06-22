import { useState, useRef, useEffect } from 'react';
import type { Todo } from '@todo/shared';

interface Props {
  todo: Todo;
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

export function TodoItem({ todo, t, onToggle, onEdit, onRemove }: Props) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(todo.text);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const handleSave = () => {
    const trimmed = editText.trim();
    if (!trimmed) {
      setError('Cannot be empty');
      return;
    }
    onEdit(todo.id, trimmed);
    setEditing(false);
    setError('');
  };

  const handleCancel = () => {
    setEditText(todo.text);
    setEditing(false);
    setError('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <li
      className={`todoItem ${todo.completed ? 'isDone' : ''} ${editing ? 'isEditing' : ''}`}
    >
      <div className="todoItem__left">
        <button
          type="button"
          className={`check ${todo.completed ? 'check--done' : ''}`}
          aria-label={todo.completed ? t.markNotDone : t.markDone}
          title={todo.completed ? t.markNotDone : t.markDone}
          disabled={editing}
          onClick={() => onToggle(todo.id)}
        >
          {todo.completed ? '✓' : ''}
        </button>
      </div>

      {editing ? (
        <div className="todoItem__content">
          <div className="todoEditWrap">
            <input
              ref={inputRef}
              className={`todoEditInput ${error ? 'hasError' : ''}`}
              aria-label={t.edit}
              value={editText}
              onChange={e => { setEditText(e.target.value); setError(''); }}
              onKeyDown={handleKeyDown}
            />
            {error && <span className="todoEditError">{error}</span>}
          </div>
        </div>
      ) : (
        <div className="todoItem__content">
          <button
            type="button"
            className="todoTextBtn"
            aria-label={t.edit}
            title={t.edit}
            onClick={() => { setEditText(todo.text); setEditing(true); }}
          >
            <span className="todoItem__text">{todo.text}</span>
          </button>
        </div>
      )}

      <div className="todoItem__actions">
        {editing ? (
          <>
            <button
              type="button"
              className="todoIconBtn"
              aria-label={t.save}
              title={t.save}
              onClick={handleSave}
            >
              ✓
            </button>
            <button
              type="button"
              className="todoIconBtn"
              aria-label={t.cancel}
              title={t.cancel}
              onClick={handleCancel}
            >
              ↩
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className="todoIconBtn"
              aria-label={t.edit}
              title={t.edit}
              onClick={() => { setEditText(todo.text); setEditing(true); }}
            >
              ✎
            </button>
            <button
              type="button"
              className="todoIconBtn"
              aria-label={t.remove}
              title={t.remove}
              onClick={() => onRemove(todo.id)}
            >
              ×
            </button>
          </>
        )}
      </div>
    </li>
  );
}
