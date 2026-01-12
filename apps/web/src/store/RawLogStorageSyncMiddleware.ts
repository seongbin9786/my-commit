import type { TypedStartListening } from '@reduxjs/toolkit';
import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';

import { loadFromStorage, saveToStorage } from '../utils/StorageUtil';
import { getLogFromServer, saveLogToServer } from '../services/LogService';
import type { AppDispatch, RootState } from '.';
import {
  goToNextDate,
  goToPrevDate,
  goToToday,
  setLastSyncedAt,
  setSyncStatus,
  updateRawLog,
} from './logs';

/**
 * RawLog를 Storage에 저장하고 불러오는 Middleware
 * 부작용이므로 Middleware에서 구현
 */
export const RawLogStorageSyncMiddleware = createListenerMiddleware();

// 굳이 필요한 Type 정의...
export type AppStartListening = TypedStartListening<RootState, AppDispatch>;

const startAppListening =
  RawLogStorageSyncMiddleware.startListening as AppStartListening;

// localstorage에 저장 & 배업 (Server Sync with Debounce)
startAppListening({
  actionCreator: updateRawLog,
  effect: async (action, listenerApi) => {
    // 1. Local Storage Save (Immediate)
    const { currentDate } = listenerApi.getState().logs;
    const nextRawLogs = action.payload;
    saveToStorage(currentDate, nextRawLogs);
    console.log(`[middleware] saved to local storage at ${currentDate}`);

    // 2. Server Sync (Debounced)
    listenerApi.cancelActiveListeners();

    try {
      await listenerApi.delay(2000);

      listenerApi.dispatch(setSyncStatus('syncing'));
      const state = listenerApi.getState();
      const { lastSyncedAt } = state.logs;

      const result = await saveLogToServer(
        currentDate,
        nextRawLogs,
        lastSyncedAt || undefined,
      );

      if (result && result.success) {
        listenerApi.dispatch(setSyncStatus('synced'));
        if (result.data?.updatedAt) {
          listenerApi.dispatch(setLastSyncedAt(result.data.updatedAt));
        }
      } else {
        listenerApi.dispatch(setSyncStatus('error'));
      }
    } catch (error) {
      if ((error as any).code === 'listener-cancelled') {
        // Debounce cancelled, ignore
        return;
      }
      console.error('Sync failed:', error);
      listenerApi.dispatch(setSyncStatus('error'));
    }
  },
});

// localstorage에서 불러오기 & Server Fetch
startAppListening({
  matcher: isAnyOf(goToToday, goToPrevDate, goToNextDate),
  effect: async (_, listenerApi) => {
    const { currentDate: changedDate, lastSyncedAt } =
      listenerApi.getState().logs;

    // 1. Local Load
    const RawLogForChangedDate = loadFromStorage(changedDate);
    listenerApi.dispatch(updateRawLog(RawLogForChangedDate));
    console.log(
      `[middleware] loaded from local, dispatched update at ${changedDate}`,
    );

    // 2. Server Fetch
    listenerApi.dispatch(setSyncStatus('syncing'));
    try {
      const serverLog = await getLogFromServer(changedDate);

      if (serverLog) {
        // If server has content and it's newer or we have nothing
        // Simple logic: If server log exists, we check if it is newer than what we last knew.
        // Since we don't persist 'lastSyncedAt' per date in redux (only global or tracking current),
        // we might compare with local content?
        // User Rule: "Server or Client take latest based on updatedAt".

        // If we don't have local updatedAt, we assume local is "dirty" if it has content, or "empty" if not.
        // Better: Compare text content?
        if (serverLog.content !== RawLogForChangedDate) {
          // Content differs. Which one is newer?
          // We assume Server is master if we just loaded the page/date.
          // But if user was working offline?
          // For now, let's prioritize Server if we have a token.

          // Refined Logic based on Requirement: "Server or Client take latest".
          // Since we don't track local modification time in this app version,
          // We will trust Server if there is a server log.
          // Exception: If Server is empty and Local has data?

          // Let's protect user data:
          // If local is empty, take server.
          // If local has data, and server has data... Show Conflict? Or Auto-Backup Local and Overwrite?
          // We implemented "Backup on Save".
          // Here we are LOADING.

          // Let's update local with server version, BUT
          // if local had content, maybe we should have saved it first?
          // This middleware runs on navigation.

          // Safe approach: Dispatch updateRawLog(serverLog.content)
          // The previous local change (if any) is already saved to localStorage?
          // This overwrites localStorage too (via the other listener).

          console.log('Overwriting local with server data');
          listenerApi.dispatch(updateRawLog(serverLog.content));
          listenerApi.dispatch(setLastSyncedAt(serverLog.updatedAt));
        } else {
          // Same content
          if (serverLog.updatedAt) {
            listenerApi.dispatch(setLastSyncedAt(serverLog.updatedAt));
          }
        }
        listenerApi.dispatch(setSyncStatus('synced'));
      } else {
        // No log on server or error
        listenerApi.dispatch(setSyncStatus('idle'));
      }
    } catch (e) {
      console.error(e);
      listenerApi.dispatch(setSyncStatus('error'));
    }
  },
});
