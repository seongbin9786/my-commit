import { describe, expect, it } from 'vitest';

import { formatSyncDuration } from './syncTime';

describe('formatSyncDuration', () => {
  it('null은 빈 문자열을 반환해야 함', () => {
    expect(formatSyncDuration(null)).toBe('');
  });

  it('1초 미만은 ms로 표시해야 함', () => {
    expect(formatSyncDuration(999)).toBe('999 ms');
  });

  it('1초 이상은 s로 표시해야 함', () => {
    expect(formatSyncDuration(1234)).toBe('1.23 s');
  });

  it('음수는 빈 문자열을 반환해야 함', () => {
    expect(formatSyncDuration(-1)).toBe('');
  });
});
