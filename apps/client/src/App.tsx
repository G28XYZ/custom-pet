import { useState } from 'react';
import { Header } from './components/Header';
import { TodoList } from './components/TodoList';
import { TodoInput } from './components/TodoInput';
import { TodoFilters } from './components/TodoFilters';
import { SyncIndicator } from './components/SyncIndicator';
import { useTodos } from './hooks/useTodos';
import { useSyncStatus } from './hooks/useSyncStatus';
import { translations, type Lang } from './i18n/translations';

export default function App() {
  const [lang, setLang] = useState<Lang>('en');
  const t = translations[lang];
  const sync = useSyncStatus();
  const {
    todos,
    filter,
    setFilter,
    loading,
    addTodo,
    toggleTodo,
    editTodo,
    removeTodo,
    clearCompleted,
  } = useTodos({ startSync: sync.startSync, endSync: sync.endSync });

  if (loading) {
    return (
      <div className="page">
        <div className="paperStack" role="application" aria-label={t.todoApp}>
          <div className="paper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="spinner" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="paperStack" role="application" aria-label={t.todoApp}>
        <div className="paper">
          <Header
            title={t.title}
            languageLabel={t.language}
            lang={lang}
            onLangChange={setLang}
            syncIndicator={<SyncIndicator status={sync.status} />}
          />
          <TodoList
            todos={todos}
            label={t.todoList}
            t={t}
            onToggle={toggleTodo}
            onEdit={editTodo}
            onRemove={removeTodo}
          />
          <TodoInput t={t} onAdd={addTodo} />
          <TodoFilters
            filter={filter}
            filtersLabel={t.filters}
            t={t}
            onFilterChange={setFilter}
            onClearCompleted={clearCompleted}
          />
        </div>
      </div>
    </div>
  );
}
