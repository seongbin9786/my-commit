import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  resolveThemeForColorScheme,
  resolveThemeForCurrentSystemColorScheme,
  saveManualThemePreference,
  subscribeToSystemColorSchemeChange,
} from './util';

type MatchMediaChangeHandler = (event: MediaQueryListEvent) => void;

describe('theme util', () => {
  let isDarkMode = false;
  let changeHandler: MatchMediaChangeHandler | null = null;

  beforeEach(() => {
    localStorage.clear();
    isDarkMode = false;
    changeHandler = null;

    vi.stubGlobal('window', {
      matchMedia: vi.fn().mockImplementation(() => {
        return {
          matches: isDarkMode,
          addEventListener: (
            _event: string,
            listener: MatchMediaChangeHandler,
          ) => {
            changeHandler = listener;
          },
          removeEventListener: (
            _event: string,
            listener: MatchMediaChangeHandler,
          ) => {
            if (changeHandler === listener) {
              changeHandler = null;
            }
          },
        } as MediaQueryList;
      }),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns fallback themes when no saved preference exists', () => {
    expect(resolveThemeForColorScheme('light')).toBe('cupcake');
    expect(resolveThemeForColorScheme('dark')).toBe('forest');
  });

  it('restores last manual theme by light/dark scheme', () => {
    saveManualThemePreference('winter');
    saveManualThemePreference('night');

    expect(resolveThemeForColorScheme('light')).toBe('winter');
    expect(resolveThemeForColorScheme('dark')).toBe('night');
  });

  it('migrates legacy app-theme to matching scheme slot', () => {
    localStorage.setItem('app-theme', 'night');

    expect(resolveThemeForColorScheme('dark')).toBe('night');
    expect(resolveThemeForColorScheme('light')).toBe('cupcake');
    expect(localStorage.getItem('app-theme-by-scheme')).toBe(
      '{"light":"cupcake","dark":"night"}',
    );
  });

  it('resolves current theme from system color scheme', () => {
    isDarkMode = true;
    expect(resolveThemeForCurrentSystemColorScheme()).toBe('forest');

    isDarkMode = false;
    expect(resolveThemeForCurrentSystemColorScheme()).toBe('cupcake');
  });

  it('subscribes to system color scheme change events', () => {
    const callback = vi.fn();
    const unsubscribe = subscribeToSystemColorSchemeChange(callback);

    changeHandler?.({ matches: true } as MediaQueryListEvent);
    expect(callback).toHaveBeenCalledWith('dark');

    unsubscribe();
    expect(changeHandler).toBeNull();
  });
});
