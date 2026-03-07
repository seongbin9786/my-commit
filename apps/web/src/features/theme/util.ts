import {
  AVAILABLE_THEMES,
  ColorScheme,
  Theme,
  THEME_BY_SCHEME_STORAGE_KEY,
  THEME_STORAGE_KEY,
  ThemeByScheme,
  ThemeSettingsPayload,
} from './config';
import {
  buildThemeBySchemeForManualSelection,
  parseThemeBySchemePreference,
  resolveThemeForColorSchemePolicy,
} from './policy';

const DARK_MODE_MEDIA_QUERY = '(prefers-color-scheme: dark)';

export function makeThemeNameReadable(themeName: string) {
  return themeName
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function checkIsValidTheme(theme: string | null): theme is Theme {
  return theme !== null && AVAILABLE_THEMES.includes(theme as Theme);
}

// NOTE: daisy-ui 방식
export function setDaisyUiThemeCssVariable(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme);
}

export function persistCurrentTheme(theme: Theme) {
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

export function getThemeSettingsSnapshot(): ThemeSettingsPayload {
  const snapshot: ThemeSettingsPayload = {};
  const currentTheme = localStorage.getItem(THEME_STORAGE_KEY);
  if (checkIsValidTheme(currentTheme)) {
    snapshot[THEME_STORAGE_KEY] = currentTheme;
  }

  const themeByScheme = loadThemeBySchemePreference();
  if (themeByScheme.light || themeByScheme.dark) {
    snapshot[THEME_BY_SCHEME_STORAGE_KEY] = JSON.stringify(themeByScheme);
  }

  return snapshot;
}

export function applyThemeSettingsFromServer(payload: ThemeSettingsPayload) {
  const theme = payload[THEME_STORAGE_KEY] ?? null;
  if (checkIsValidTheme(theme)) {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }

  const rawThemeByScheme = payload[THEME_BY_SCHEME_STORAGE_KEY];
  if (typeof rawThemeByScheme === 'string') {
    const parsed = parseThemeBySchemePreference(
      rawThemeByScheme,
      checkIsValidTheme,
    );
    if (parsed.light || parsed.dark) {
      localStorage.setItem(THEME_BY_SCHEME_STORAGE_KEY, JSON.stringify(parsed));
    }
  }
}

export function getSystemColorScheme(): ColorScheme {
  return getIsDarkMode() ? 'dark' : 'light';
}

export function resolveThemeForColorScheme(colorScheme: ColorScheme): Theme {
  const themeByScheme = loadThemeBySchemePreference();
  const legacyTheme = loadLegacyThemePreference();
  const { theme, migratedThemeBySchemePreference } =
    resolveThemeForColorSchemePolicy({
      colorScheme,
      themeBySchemePreference: themeByScheme,
      legacyThemePreference: legacyTheme,
    });

  if (migratedThemeBySchemePreference) {
    persistThemeBySchemePreference(migratedThemeBySchemePreference);
  }

  return theme;
}

export function resolveThemeForCurrentSystemColorScheme(): Theme {
  return resolveThemeForColorScheme(getSystemColorScheme());
}

export function saveManualThemePreference(theme: Theme) {
  const currentPreference = loadThemeBySchemePreference();
  const nextPreference = buildThemeBySchemeForManualSelection(
    currentPreference,
    theme,
  );
  persistThemeBySchemePreference(nextPreference);
}

export function loadSavedTheme(): Theme {
  const theme = resolveThemeForCurrentSystemColorScheme();

  setDaisyUiThemeCssVariable(theme);
  persistCurrentTheme(theme);

  return theme;
}

export function subscribeToSystemColorSchemeChange(
  onChange: (colorScheme: ColorScheme) => void,
) {
  const mediaQueryList = window.matchMedia(DARK_MODE_MEDIA_QUERY);
  const handleChange = (event: MediaQueryListEvent) => {
    onChange(event.matches ? 'dark' : 'light');
  };

  mediaQueryList.addEventListener('change', handleChange);

  return () => {
    mediaQueryList.removeEventListener('change', handleChange);
  };
}

function loadThemeBySchemePreference(): Partial<ThemeByScheme> {
  const rawPreference = localStorage.getItem(THEME_BY_SCHEME_STORAGE_KEY);
  return parseThemeBySchemePreference(rawPreference, checkIsValidTheme);
}

function persistThemeBySchemePreference(themeByScheme: ThemeByScheme) {
  localStorage.setItem(
    THEME_BY_SCHEME_STORAGE_KEY,
    JSON.stringify(themeByScheme),
  );
}

function loadLegacyThemePreference(): Theme | null {
  const legacyTheme = localStorage.getItem(THEME_STORAGE_KEY);
  if (!checkIsValidTheme(legacyTheme)) {
    return null;
  }

  return legacyTheme;
}

function getIsDarkMode(): boolean {
  return window.matchMedia(DARK_MODE_MEDIA_QUERY).matches;
}
