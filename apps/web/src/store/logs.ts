import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import {
  getDateStringDayAfter,
  getDateStringDayBefore,
  getTodayString,
} from '../utils/DateUtil';
import { createLogsFromString } from '../utils/LogConverter';
import { Log } from '../utils/PaceUtil';
import { loadFromStorage } from '../utils/StorageUtil';

export type LogState = {
  currentDate: string;
  rawLogs: string;
  logsForCharts: Log[];
  syncStatus: 'idle' | 'pending' | 'syncing' | 'synced' | 'error';
  lastSyncedAt: string | null;
};

// reducer 바깥이어서 초기값 설정 구문이 순수하지 않아도 괜찮을 듯
const initialDate = getTodayString();
const initialRawLogs = loadFromStorage(initialDate);

const initialState: LogState = {
  currentDate: initialDate,
  rawLogs: initialRawLogs,
  logsForCharts: createLogsFromString(initialRawLogs, initialDate),
  syncStatus: 'idle',
  lastSyncedAt: null,
};

export const LogSlice = createSlice({
  name: 'logs',
  initialState,
  reducers: {
    goToToday: (state) => {
      state.currentDate = getTodayString();
    },
    goToPrevDate: (state) => {
      state.currentDate = getDateStringDayBefore(state.currentDate);
    },
    goToNextDate: (state) => {
      state.currentDate = getDateStringDayAfter(state.currentDate);
    },
    // 단순 string 공유
    updateRawLog: (state, action: PayloadAction<string>) => {
      const newRawLogs = action.payload;
      const currentDate = state.currentDate;
      console.log(`[reducer] updateRawLog at ${currentDate}`);
      state.rawLogs = newRawLogs;
      state.logsForCharts = createLogsFromString(newRawLogs, currentDate);
      // If user types, we are pending sync
      if (state.syncStatus !== 'syncing') {
        state.syncStatus = 'pending';
      }
    },
    setSyncStatus: (state, action: PayloadAction<LogState['syncStatus']>) => {
      state.syncStatus = action.payload;
    },
    setLastSyncedAt: (state, action: PayloadAction<string>) => {
      state.lastSyncedAt = action.payload;
    },
  },
});

export const {
  actions: {
    goToToday,
    goToPrevDate,
    goToNextDate,
    updateRawLog,
    setSyncStatus,
    setLastSyncedAt,
  },
  reducer: LogsReducer,
} = LogSlice;
