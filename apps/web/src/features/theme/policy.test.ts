import { describe, expect, it } from 'vitest';

import { Theme } from './config';
import {
  buildThemeBySchemeForManualSelection,
  parseThemeBySchemePreference,
  resolveThemeForColorSchemePolicy,
} from './policy';

const isValidTheme = (theme: string | null): theme is Theme => {
  return (
    theme === 'cupcake' ||
    theme === 'winter' ||
    theme === 'forest' ||
    theme === 'night'
  );
};

describe('theme policy', () => {
  describe('parseThemeBySchemePreference', () => {
    it('returns empty when raw preference is null', () => {
      expect(parseThemeBySchemePreference(null, isValidTheme)).toEqual({});
    });

    it('returns empty when raw preference is invalid json', () => {
      expect(parseThemeBySchemePreference('{oops', isValidTheme)).toEqual({});
    });

    it('filters invalid theme values', () => {
      expect(
        parseThemeBySchemePreference(
          JSON.stringify({
            light: 'winter',
            dark: 'invalid-theme',
          }),
          isValidTheme,
        ),
      ).toEqual({
        light: 'winter',
      });
    });
  });

  describe('buildThemeBySchemeForManualSelection', () => {
    it('updates only selected color scheme while keeping defaults', () => {
      expect(buildThemeBySchemeForManualSelection({}, 'night')).toEqual({
        light: 'cupcake',
        dark: 'night',
      });
    });

    it('keeps existing counterpart scheme', () => {
      expect(
        buildThemeBySchemeForManualSelection({ dark: 'night' }, 'winter'),
      ).toEqual({
        light: 'winter',
        dark: 'night',
      });
    });
  });

  describe('resolveThemeForColorSchemePolicy', () => {
    it('returns preferred theme when scheme preference exists', () => {
      const result = resolveThemeForColorSchemePolicy({
        colorScheme: 'light',
        themeBySchemePreference: {
          light: 'winter',
          dark: 'night',
        },
        legacyThemePreference: 'forest',
      });

      expect(result).toEqual({
        theme: 'winter',
        migratedThemeBySchemePreference: null,
      });
    });

    it('migrates matching legacy theme when scheme preference is missing', () => {
      const result = resolveThemeForColorSchemePolicy({
        colorScheme: 'dark',
        themeBySchemePreference: {},
        legacyThemePreference: 'night',
      });

      expect(result).toEqual({
        theme: 'night',
        migratedThemeBySchemePreference: {
          light: 'cupcake',
          dark: 'night',
        },
      });
    });

    it('falls back to defaults when no preference can be resolved', () => {
      const result = resolveThemeForColorSchemePolicy({
        colorScheme: 'light',
        themeBySchemePreference: {},
        legacyThemePreference: 'night',
      });

      expect(result).toEqual({
        theme: 'cupcake',
        migratedThemeBySchemePreference: null,
      });
    });
  });
});
