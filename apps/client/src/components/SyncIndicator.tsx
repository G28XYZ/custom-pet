import type { SyncStatus } from '../hooks/useSyncStatus';

interface Props {
  status: SyncStatus;
}

const labels: Record<SyncStatus, string> = {
  online: 'Online',
  offline: 'Offline',
  syncing: 'Syncing...',
  error: 'Sync error',
};

const colors: Record<SyncStatus, string> = {
  online: '#4caf50',
  offline: '#f44336',
  syncing: '#ff9800',
  error: '#f44336',
};

export function SyncIndicator({ status }: Props) {
  return (
    <div
      className="syncIndicator"
      title={labels[status]}
      aria-label={labels[status]}
      role="status"
    >
      <span
        className="syncDot"
        style={{
          backgroundColor: colors[status],
          animation: status === 'syncing' ? 'pulse 1s ease-in-out infinite' : 'none',
        }}
      />
      <span className="syncLabel">{labels[status]}</span>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
