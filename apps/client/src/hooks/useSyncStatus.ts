import { useState, useEffect, useCallback } from 'react';

export type SyncStatus = 'online' | 'offline' | 'syncing' | 'error';

export function useSyncStatus() {
  const [status, setStatus] = useState<SyncStatus>(
    typeof navigator !== 'undefined' && navigator.onLine ? 'online' : 'offline'
  );
  const [lastSync, setLastSync] = useState<number | null>(null);

  useEffect(() => {
    const handleOnline = () => setStatus(prev => prev === 'error' ? 'online' : 'online');
    const handleOffline = () => setStatus('offline');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const startSync = useCallback(() => {
    setStatus('syncing');
  }, []);

  const endSync = useCallback((success: boolean) => {
    setStatus(success ? 'online' : 'error');
    setLastSync(Date.now());
  }, []);

  return { status, lastSync, startSync, endSync };
}
