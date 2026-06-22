import type { Filter } from '../hooks/useTodos';

interface Props {
  filter: Filter;
  filtersLabel: string;
  t: {
    showAll: string;
    showActive: string;
    showCompleted: string;
    clearCompleted: string;
    all: string;
    active: string;
    completed: string;
  };
  onFilterChange: (filter: Filter) => void;
  onClearCompleted: () => void;
}

export function TodoFilters({ filter, filtersLabel, t, onFilterChange, onClearCompleted }: Props) {
  return (
    <div className="todoFilters" role="tablist" aria-label={filtersLabel}>
      <button
        type="button"
        className={`todoFilterBtn ${filter === 'all' ? 'isActive' : ''}`}
        aria-label={t.showAll}
        title={t.all}
        onClick={() => onFilterChange('all')}
      >
        {t.all}
      </button>
      <button
        type="button"
        className={`todoFilterBtn ${filter === 'active' ? 'isActive' : ''}`}
        aria-label={t.showActive}
        title={t.active}
        onClick={() => onFilterChange('active')}
      >
        ⬜️
      </button>
      <button
        type="button"
        className={`todoFilterBtn ${filter === 'completed' ? 'isActive' : ''}`}
        aria-label={t.showCompleted}
        title={t.completed}
        onClick={() => onFilterChange('completed')}
      >
        ✅
      </button>
      <button
        type="button"
        className="todoFilterBtn"
        aria-label={t.clearCompleted}
        title={t.clearCompleted}
        onClick={onClearCompleted}
      >
        🆑
      </button>
    </div>
  );
}
