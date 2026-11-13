import { useCallback, useEffect, useState } from 'react';
import { apiRequest, getStoredTokens } from '../services/api.ts';
import { getPendingSyncItems, removePendingSyncItem } from '../services/offlineDb.ts';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  const refreshPending = useCallback(async () => {
    try {
      const items = await getPendingSyncItems();
      setPendingCount(items.length);
    } catch {
      setPendingCount(0);
    }
  }, []);

  const syncNow = useCallback(async () => {
    const { accessToken } = getStoredTokens();
    if (!navigator.onLine || !accessToken) return 0;
    setSyncing(true);
    let synced = 0;
    try {
      const items = await getPendingSyncItems();
      for (const item of items) {
        if (!item.id) continue;
        try {
          await apiRequest(item.endpoint, {
            method: item.method,
            body: item.body,
          });
          await removePendingSyncItem(item.id);
          synced++;
        } catch {
          // Leave in queue if still failing
        }
      }
      await refreshPending();
    } finally {
      setSyncing(false);
    }
    return synced;
  }, [refreshPending]);

  useEffect(() => {
    refreshPending();

    const handleOnline = () => {
      setIsOnline(true);
      syncNow();
    };
    const handleOffline = () => {
      setIsOnline(false);
      refreshPending();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    const interval = setInterval(refreshPending, 15000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [refreshPending, syncNow]);

  return { isOnline, pendingCount, syncing, syncNow, refreshPending };
}
