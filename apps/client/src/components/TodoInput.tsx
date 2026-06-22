import { useState } from 'react';

interface Props {
  t: {
    newTask: string;
    placeholder: string;
    addTodo: string;
  };
  onAdd: (text: string) => void;
}

export function TodoInput({ t, onAdd }: Props) {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onAdd(text.trim());
      setText('');
    }
  };

  return (
    <form className="todoInputWrap" onSubmit={handleSubmit}>
      <div className="todoInputRow">
        <input
          className="todoInput"
          type="text"
          placeholder={t.placeholder}
          aria-label={t.newTask}
          value={text}
          onChange={e => setText(e.target.value)}
        />
        <button
          type="submit"
          className="todoAddBtn"
          aria-label={t.addTodo}
          disabled={!text.trim()}
        >
          ➕
        </button>
      </div>
    </form>
  );
}
