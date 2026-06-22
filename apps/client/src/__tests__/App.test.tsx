import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';

const { openDBMock } = vi.hoisted(() => {
  return {
    openDBMock: vi.fn().mockResolvedValue({
      getAll: vi.fn().mockResolvedValue([]),
      get: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      clear: vi.fn(),
      transaction: vi.fn().mockReturnValue({
        store: {
          put: vi.fn(),
          delete: vi.fn(),
        },
        done: Promise.resolve(),
      }),
    }),
  };
});

vi.mock('idb', () => ({
  openDB: openDBMock,
}));

// Mock ResizeObserver
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = ResizeObserverMock as any;

// Mock navigator.onLine
Object.defineProperty(global.navigator, 'onLine', {
  value: true,
  writable: true,
});

// Mock fetch for API calls
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  status: 200,
  json: () => Promise.resolve([]),
});

// Mock crypto.randomUUID
if (!global.crypto) {
  (global as any).crypto = {};
}
(global.crypto as any).randomUUID = vi.fn(() => `test-${Math.random().toString(36).slice(2)}`);

describe('App Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    openDBMock.mockResolvedValue({
      getAll: vi.fn().mockResolvedValue([]),
      get: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      clear: vi.fn(),
      transaction: vi.fn().mockReturnValue({
        store: {
          put: vi.fn(),
          delete: vi.fn(),
        },
        done: Promise.resolve(),
      }),
    });
  });

  it('renders the app title', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('ToDo List')).toBeDefined();
    });
  });

  it('renders input and disabled add button', async () => {
    render(<App />);
    await waitFor(() => {
      const input = screen.getByPlaceholderText('Type your task...');
      expect(input).toBeDefined();
      const addBtn = screen.getByRole('button', { name: 'Add todo' });
      expect(addBtn).toBeDefined();
      expect((addBtn as HTMLButtonElement).disabled).toBe(true);
    });
  });

  it('enables add button when typing', async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Type your task...')).toBeDefined();
    });

    const input = screen.getByPlaceholderText('Type your task...');
    await user.type(input, 'New task');

    const addBtn = screen.getByRole('button', { name: 'Add todo' });
    expect((addBtn as HTMLButtonElement).disabled).toBe(false);
  });

  it('renders filter buttons', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Show all' })).toBeDefined();
      expect(screen.getByRole('button', { name: 'Show active' })).toBeDefined();
      expect(screen.getByRole('button', { name: 'Show completed' })).toBeDefined();
      expect(screen.getByRole('button', { name: 'Clear completed' })).toBeDefined();
    });
  });
});
