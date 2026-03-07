import {
  ColorScheme,
  DEFAULT_DARK_THEME,
  DEFAULT_LIGHT_THEME,
  LIGHT_THEMES,
  Theme,
  ThemeByScheme,
} from './config';

type ThemeResolverInput = {
  colorScheme: ColorScheme;
  themeBySchemePreference: Partial<ThemeByScheme>;
  legacyThemePreference: Theme | null;
};

type ThemeResolverResult = {
  theme: Theme;
  migratedThemeBySchemePreference: ThemeByScheme | null;
};

export function parseThemeBySchemePreference(
  rawPreference: string | null,
  checkIsValidTheme: (theme: string | null) => theme is Theme,
): Partial<ThemeByScheme> {
  if (!rawPreference) {
    return {};
  }

  try {
    const parsed = JSON.parse(rawPreference) as unknown;
    if (!parsed || typeof parsed !== 'object') {
      return {};
    }

    const record = parsed as Record<string, unknown>;
    const nextPreference: Partial<ThemeByScheme> = {};

    const lightTheme = toStringOrNull(record.light);
    if (checkIsValidTheme(lightTheme)) {
      nextPreference.light = lightTheme;
    }
    const darkTheme = toStringOrNull(record.dark);
    if (checkIsValidTheme(darkTheme)) {
      nextPreference.dark = darkTheme;
    }

    return nextPreference;
  } catch {
    return {};
  }
}

export function buildThemeBySchemeForManualSelection(
  currentPreference: Partial<ThemeByScheme>,
  selectedTheme: Theme,
): ThemeByScheme {
  const selectedColorScheme = getColorSchemeFromTheme(selectedTheme);

  return {
    light: currentPreference.light ?? DEFAULT_LIGHT_THEME,
    dark: currentPreference.dark ?? DEFAULT_DARK_THEME,
    [selectedColorScheme]: selectedTheme,
  };
}

export function resolveThemeForColorSchemePolicy({
  colorScheme,
  themeBySchemePreference,
  legacyThemePreference,
}: ThemeResolverInput): ThemeResolverResult {
  const preferredTheme = themeBySchemePreference[colorScheme];
  if (preferredTheme) {
    return {
      theme: preferredTheme,
      migratedThemeBySchemePreference: null,
    };
  }

  if (
    legacyThemePreference &&
    getColorSchemeFromTheme(legacyThemePreference) === colorScheme
  ) {
    return {
      theme: legacyThemePreference,
      migratedThemeBySchemePreference: {
        light: themeBySchemePreference.light ?? DEFAULT_LIGHT_THEME,
        dark: themeBySchemePreference.dark ?? DEFAULT_DARK_THEME,
        [colorScheme]: legacyThemePreference,
      },
    };
  }

  return {
    theme: getFallbackThemeByColorScheme(colorScheme),
    migratedThemeBySchemePreference: null,
  };
}

export function getColorSchemeFromTheme(theme: Theme): ColorScheme {
  return LIGHT_THEMES.includes(theme) ? 'light' : 'dark';
}

function getFallbackThemeByColorScheme(colorScheme: ColorScheme): Theme {
  return colorScheme === 'dark' ? DEFAULT_DARK_THEME : DEFAULT_LIGHT_THEME;
}

function toStringOrNull(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}
