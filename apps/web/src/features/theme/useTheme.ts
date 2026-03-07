import { useCallback, useEffect, useState } from 'react';

import { AVAILABLE_THEMES, Theme } from './config';
import {
  persistCurrentTheme,
  resolveThemeForColorScheme,
  resolveThemeForCurrentSystemColorScheme,
  saveManualThemePreference,
  setDaisyUiThemeCssVariable,
  subscribeToSystemColorSchemeChange,
} from './util';

// WARNING: Context로 구현되지 않았음에 주의 - 추후 한 페이지를 벗어나면 Context로 이관 예정
export const useTheme = () => {
  const [theme, setThemeState] = useState<Theme>(
    resolveThemeForCurrentSystemColorScheme,
  );

  const setTheme = useCallback((nextTheme: Theme) => {
    saveManualThemePreference(nextTheme);
    setThemeState(nextTheme);
  }, []);

  useEffect(() => {
    setDaisyUiThemeCssVariable(theme);
    persistCurrentTheme(theme);
  }, [theme]);

  useEffect(() => {
    const unsubscribe = subscribeToSystemColorSchemeChange((colorScheme) => {
      setThemeState(resolveThemeForColorScheme(colorScheme));
    });

    return unsubscribe;
  }, []);

  return { theme, setTheme, availableThemes: AVAILABLE_THEMES };
};
