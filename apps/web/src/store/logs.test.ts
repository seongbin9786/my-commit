import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('logs initial state', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  it('저장된 현재 날짜가 없으면 오늘 날짜로 초기화해야 함', async () => {
    const { getTodayString } = await import('../utils/DateUtil');
    const { LogsReducer } = await import('./logs');

    const state = LogsReducer(undefined, { type: '@@INIT' });

    expect(state.currentDate).toBe(getTodayString());
  });

  it('저장된 현재 날짜가 있으면 그 날짜로 초기화해야 함', async () => {
    localStorage.setItem('my-commit:current-date', '2026-03-10');
    localStorage.setItem(
      '2026-03-10',
      JSON.stringify({
        content: 'Persisted log',
        contentHash: 'hash',
        parentHash: null,
        localUpdatedAt: '2026-03-10T10:00:00.000Z',
      }),
    );

    const { LogsReducer } = await import('./logs');

    const state = LogsReducer(undefined, { type: '@@INIT' });

    expect(state.currentDate).toBe('2026-03-10');
    expect(state.rawLogs).toBe('Persisted log');
  });

  it('저장된 현재 날짜 형식이 잘못되면 오늘 날짜로 폴백해야 함', async () => {
    localStorage.setItem('my-commit:current-date', 'invalid-date');

    const { getTodayString } = await import('../utils/DateUtil');
    const { LogsReducer } = await import('./logs');

    const state = LogsReducer(undefined, { type: '@@INIT' });

    expect(state.currentDate).toBe(getTodayString());
  });
});
