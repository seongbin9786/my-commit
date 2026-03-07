import {
  THEME_BY_SCHEME_STORAGE_KEY,
  THEME_STORAGE_KEY,
  ThemeSettingKey,
  ThemeSettingsPayload,
} from '../features/theme/config';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const THEME_SETTING_KEYS: readonly ThemeSettingKey[] = [
  THEME_STORAGE_KEY,
  THEME_BY_SCHEME_STORAGE_KEY,
];

const sanitizeThemeSettings = (value: unknown): ThemeSettingsPayload => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  const record = value as Record<string, unknown>;
  const sanitized: ThemeSettingsPayload = {};

  for (const key of THEME_SETTING_KEYS) {
    const rawValue = record[key];
    if (typeof rawValue === 'string') {
      sanitized[key] = rawValue;
    }
  }

  return sanitized;
};

export async function fetchThemeSettingsFromServer(): Promise<ThemeSettingsPayload | null> {
  const token = localStorage.getItem('token');
  if (!token) {
    return null;
  }

  try {
    const response = await fetch(`${API_URL}/user-settings`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
      }
      return null;
    }

    const result = (await response.json()) as unknown;
    const payload =
      result && typeof result === 'object' && 'data' in result
        ? (result as { data?: unknown }).data
        : result;

    return sanitizeThemeSettings(payload);
  } catch (error) {
    console.error('Failed to fetch user settings from server:', error);
    return null;
  }
}

export async function saveThemeSettingsToServer(
  settings: ThemeSettingsPayload,
): Promise<boolean> {
  const token = localStorage.getItem('token');
  if (!token) {
    return false;
  }

  const sanitized = sanitizeThemeSettings(settings);
  if (Object.keys(sanitized).length === 0) {
    return true;
  }

  try {
    const response = await fetch(`${API_URL}/user-settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ settings: sanitized }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
      }
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to save user settings to server:', error);
    return false;
  }
}
