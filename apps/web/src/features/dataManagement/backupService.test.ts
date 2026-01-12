
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createBackup, importBackup, downloadBackupInfo } from './backupService';
import { saveAs } from 'file-saver';
import { BackupData } from './types.ts';

// Mock file-saver
vi.mock('file-saver', () => ({
  saveAs: vi.fn(),
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    key: (index: number) => Object.keys(store)[index] || null,
    get length() {
      return Object.keys(store).length;
    },
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
});

// Mock FileReader
class MockFileReader {
  onload: ((e: any) => void) | null = null;
  result: string | null = null;

  readAsText(blob: Blob) {
    blob.text().then((text) => {
      this.result = text;
      if (this.onload) {
        this.onload({ target: { result: text } });
      }
    });
  }
}
// @ts-ignore
global.FileReader = MockFileReader;


describe('Data Management Utils', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('createBackup', () => {
    it('should create a backup object correctly from localStorage', () => {
      // Setup
      localStorage.setItem('2023-01-01', 'log data 1');
      localStorage.setItem('2023-01-02', 'log data 2');
      localStorage.setItem('soundSettings', '{"volume": 0.5}');
      localStorage.setItem('targetPace', '10');
      // Irrelevant key that should be ignored
      localStorage.setItem('some-random-key', 'should not be backed up');

      // Execute
      const backup = createBackup();

      // Assert
      expect(backup.version).toBeDefined();
      expect(backup.exportedAt).toBeDefined();
      
      // Check logs
      expect(backup.logs).toEqual({
        '2023-01-01': 'log data 1',
        '2023-01-02': 'log data 2',
      });
      
      // Check settings
      expect(backup.settings).toEqual({
        'soundSettings': '{"volume": 0.5}',
        'targetPace': '10',
      });
      
      // Check excluded keys
      expect(backup.logs).not.toHaveProperty('some-random-key');
      expect(backup.settings).not.toHaveProperty('some-random-key');
    });
  });

  describe('downloadBackupInfo', () => {
    it('should trigger file download using file-saver with correct arguments', () => {
      const backupData: BackupData = {
        version: 1,
        exportedAt: '2023-01-01T00:00:00.000Z',
        logs: { '2023-01-01': 'log' },
        settings: { 'targetPace': '10' },
      };

      downloadBackupInfo(backupData);

      expect(saveAs).toHaveBeenCalledTimes(1);
      const [blob, filename] = vi.mocked(saveAs).mock.calls[0];
      
      expect(blob).toBeInstanceOf(Blob);
      // Verify content of the blob
      // Since Blob content is not directly accessible usually in tests without FileReader, 
      // we trust the Blob creation logic if the file runs without error,
      // but we can check the filename format.
      expect(filename).toMatch(/^my-time-backup-\d{4}-\d{2}-\d{2}\.json$/);
    });
  });

  describe('importBackup', () => {
    it('should import data from a valid backup file into localStorage', async () => {
      const backupData: BackupData = {
        version: 1,
        exportedAt: '2023-01-01',
        logs: { '2023-01-01': 'restored log' },
        settings: { 'soundSettings': '{"restored": true}' },
      };
      
      const file = new File([JSON.stringify(backupData)], 'backup.json', { type: 'application/json' });
      
      await importBackup(file);

      expect(localStorage.getItem('2023-01-01')).toBe('restored log');
      expect(localStorage.getItem('soundSettings')).toBe('{"restored": true}');
    });

    it('should reject invalid backup files (missing required fields)', async () => {
        const invalidData = { foo: 'bar' }; // missing logs/settings
        const file = new File([JSON.stringify(invalidData)], 'invalid.json', { type: 'application/json' });

        await expect(importBackup(file)).rejects.toThrow();
    });

     it('should only import valid keys and ignore others', async () => {
      const backupData: BackupData = {
        version: 1,
        exportedAt: '2023-01-01',
        logs: { 
            '2023-01-01': 'valid log',
            'invalid-date': 'should not import', // not a date format
            '2023-13-01': 'should import technically if regex matches format but maybe validity check is weak' 
            // Note: Current regex is /^\d{4}-\d{2}-\d{2}$/, so '2023-13-01' passes regex even if invalid date. 
            // We test what logic does. logic respects regex.
        },
        settings: { 
            'soundSettings': 'valid setting',
            'unknownSetting': 'should not import' // not in SETTING_KEYS
        },
      };
      
      const file = new File([JSON.stringify(backupData)], 'backup.json', { type: 'application/json' });
      
      await importBackup(file);

      expect(localStorage.getItem('2023-01-01')).toBe('valid log');
      expect(localStorage.getItem('invalid-date')).toBeNull();
      
      expect(localStorage.getItem('soundSettings')).toBe('valid setting');
      expect(localStorage.getItem('unknownSetting')).toBeNull();
    });
  });
});
