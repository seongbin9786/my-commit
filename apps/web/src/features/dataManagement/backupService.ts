import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

import { BACKUP_VERSION, BackupData } from './types';

const LOG_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const SETTING_KEYS = ['soundSettings', 'targetPace'];

export const createBackup = (): BackupData => {
  const logs: Record<string, string> = {};
  const settings: Record<string, string> = {};

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;

    if (LOG_DATE_REGEX.test(key)) {
      logs[key] = localStorage.getItem(key) || '';
    } else if (SETTING_KEYS.includes(key)) {
      settings[key] = localStorage.getItem(key) || '';
    }
  }

  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    logs,
    settings,
  };
};

export const downloadBackupInfo = (backup: BackupData) => {
  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
  saveAs(blob, `my-time-backup-${new Date().toISOString().slice(0, 10)}.json`);
};

/**
 * Migrates legacy backup format to the new BackupData format.
 * Legacy format: flat object with date keys and settings mixed at the same level
 * New format: { version, exportedAt, logs: {...}, settings: {...} }
 */
const migrateLegacyBackup = (
  data: Record<string, unknown>,
): BackupData | null => {
  // If it already has version field, it's the new format
  if ('version' in data && 'logs' in data) {
    return data as unknown as BackupData;
  }

  // Check if this looks like a legacy format (has date keys at root level)
  const hasDateKeys = Object.keys(data).some((key) => LOG_DATE_REGEX.test(key));
  if (!hasDateKeys) {
    return null; // Neither new nor legacy format
  }

  // Migrate legacy format
  const logs: Record<string, string> = {};
  const settings: Record<string, string> = {};

  Object.entries(data).forEach(([key, value]) => {
    if (typeof value !== 'string') return;

    if (LOG_DATE_REGEX.test(key)) {
      logs[key] = value;
    } else if (SETTING_KEYS.includes(key)) {
      settings[key] = value;
    }
  });

  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    logs,
    settings,
  };
};

export const importBackup = async (file: File): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const rawData = JSON.parse(content) as Record<string, unknown>;

        // Try to migrate if it's a legacy format
        const backup = migrateLegacyBackup(rawData);

        if (!backup || !backup.logs) {
          throw new Error('Invalid backup format');
        }

        // Apply logs
        Object.entries(backup.logs).forEach(([key, value]) => {
          if (LOG_DATE_REGEX.test(key)) {
            localStorage.setItem(key, value);
          }
        });

        // Apply settings
        Object.entries(backup.settings).forEach(([key, value]) => {
          if (value && SETTING_KEYS.includes(key)) {
            localStorage.setItem(key, value);
          }
        });

        resolve(true);
      } catch (err) {
        console.error(err);
        reject(err);
      }
    };
    reader.readAsText(file);
  });
};

interface LogExportRow {
  Date: string;
  Content: string;
}

export const exportLogsToExcel = () => {
  const allLogs: LogExportRow[] = [];

  // Collect all data
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && LOG_DATE_REGEX.test(key)) {
      const rawLog = localStorage.getItem(key) || '';
      // Simple parsing or raw dump? Let's parse simple line based if possible, or just raw.
      // Requirements say "Excel (Spreadsheet)". Better to have readable format.
      // But currently raw log is just text. Parsing logic is in `logs.ts`.
      // For now, let's dump date and raw text content, and maybe simple line split.

      allLogs.push({
        Date: key,
        Content: rawLog,
      });
    }
  }

  // Sort by date
  allLogs.sort((a, b) => a.Date.localeCompare(b.Date));

  const ws = XLSX.utils.json_to_sheet(allLogs);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Logs');

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
  saveAs(data, `my-time-logs-${new Date().toISOString().slice(0, 10)}.xlsx`);
};

export const fetchAndDownloadServerBackup = async (token: string) => {
  const response = await fetch(`${import.meta.env.VITE_API_URL}/raw-logs`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch server logs');
  }

  const result = await response.json();
  const serverLogs = result.data;

  const backupData: BackupData = {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    logs: serverLogs.reduce(
      (acc: Record<string, string>, log: { date: string; content: string }) => {
        acc[log.date] = log.content;
        return acc;
      },
      {},
    ),
    settings: {}, // Server backup currently only includes logs
  };

  const blob = new Blob([JSON.stringify(backupData, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
  saveAs(
    blob,
    `my-time-server-backup-${new Date().toISOString().slice(0, 10)}.json`,
  );
};
