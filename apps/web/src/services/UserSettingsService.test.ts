import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  fetchThemeSettingsFromServer,
  saveThemeSettingsToServer,
} from './UserSettingsService';

describe('UserSettingsService', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('token', 'test-token');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('returns null when token is missing', async () => {
    localStorage.removeItem('token');
    expect(await fetchThemeSettingsFromServer()).toBeNull();
  });

  it('fetches and sanitizes server theme settings', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            'app-theme': 'winter',
            'app-theme-by-scheme': '{"light":"winter","dark":"night"}',
            ignored: 1234,
          },
        }),
      }),
    );

    const result = await fetchThemeSettingsFromServer();

    expect(result).toEqual({
      'app-theme': 'winter',
      'app-theme-by-scheme': '{"light":"winter","dark":"night"}',
    });
  });

  it('saves sanitized settings to server', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);

    const success = await saveThemeSettingsToServer({
      'app-theme': 'night',
      'app-theme-by-scheme': '{"light":"winter","dark":"night"}',
    });

    expect(success).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/user-settings'),
      expect.objectContaining({
        method: 'PUT',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
        }),
      }),
    );
  });
});
