import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import {
  fetchThemeSettingsFromServer,
  saveThemeSettingsToServer,
} from '../../services/UserSettingsService';
import { RootState } from '../../store';
import { AVAILABLE_THEMES, Theme, THEME_STORAGE_KEY } from './config';
import {
  applyThemeSettingsFromServer,
  getThemeSettingsSnapshot,
  persistCurrentTheme,
  resolveThemeForColorScheme,
  resolveThemeForCurrentSystemColorScheme,
  saveManualThemePreference,
  setDaisyUiThemeCssVariable,
  subscribeToSystemColorSchemeChange,
} from './util';

// WARNING: Context로 구현되지 않았음에 주의 - 추후 한 페이지를 벗어나면 Context로 이관 예정
export const useTheme = () => {
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated,
  );
  const [theme, setThemeState] = useState<Theme>(
    resolveThemeForCurrentSystemColorScheme,
  );

  const syncThemeSettingsToServer = useCallback(
    (nextTheme: Theme) => {
      if (!isAuthenticated) {
        return;
      }

      const snapshot = getThemeSettingsSnapshot();
      void saveThemeSettingsToServer({
        ...snapshot,
        [THEME_STORAGE_KEY]: nextTheme,
      });
    },
    [isAuthenticated],
  );

  const setTheme = useCallback(
    (nextTheme: Theme) => {
      saveManualThemePreference(nextTheme);
      setThemeState(nextTheme);
      syncThemeSettingsToServer(nextTheme);
    },
    [syncThemeSettingsToServer],
  );

  useEffect(() => {
    setDaisyUiThemeCssVariable(theme);
    persistCurrentTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    let isCancelled = false;

    const syncThemeFromServer = async () => {
      const serverSettings = await fetchThemeSettingsFromServer();
      if (!serverSettings || isCancelled) {
        return;
      }

      applyThemeSettingsFromServer(serverSettings);
      const resolvedTheme = resolveThemeForCurrentSystemColorScheme();
      if (!isCancelled) {
        setThemeState(resolvedTheme);
      }
    };

    void syncThemeFromServer();

    return () => {
      isCancelled = true;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    const unsubscribe = subscribeToSystemColorSchemeChange((colorScheme) => {
      setThemeState(resolveThemeForColorScheme(colorScheme));
    });

    return unsubscribe;
  }, []);

  return { theme, setTheme, availableThemes: AVAILABLE_THEMES };
};
