import clsx from 'clsx';
import {
  AlertCircle,
  Database,
  DatabaseBackup,
  DatabaseZap,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import { RootState } from '../../store';
import { formatSyncDuration } from '../../utils/syncTime';

export const SyncStatusIndicator = () => {
  const { syncStatus, lastSyncedAt } = useSelector(
    (state: RootState) => state.logs,
  );
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated,
  );

  const [showToast, setShowToast] = useState(false);
  const [justSynced, setJustSynced] = useState(false);
  const [lastSyncDurationMs, setLastSyncDurationMs] = useState<number | null>(
    null,
  );
  const prevSyncStatusRef = useRef(syncStatus);
  const syncAttemptStartedAtRef = useRef<number | null>(null);

  const formattedDuration = useMemo(
    () => formatSyncDuration(lastSyncDurationMs),
    [lastSyncDurationMs],
  );

  const statusText = useMemo(() => {
    switch (syncStatus) {
      case 'idle':
        return '대기';
      case 'pending':
        return '저장 대기 중...';
      case 'syncing':
        return '서버에 저장 중...';
      case 'synced':
        return `저장됨 (${lastSyncedAt ? new Date(lastSyncedAt).toLocaleTimeString() : '방금'}${formattedDuration ? `, ${formattedDuration}` : ''})`;
      case 'error':
        return '저장 실패';
      default:
        return '';
    }
  }, [syncStatus, lastSyncedAt, formattedDuration]);

  useEffect(() => {
    const wasSyncAttempting =
      prevSyncStatusRef.current === 'pending' ||
      prevSyncStatusRef.current === 'syncing';
    const isSyncAttempting =
      syncStatus === 'pending' || syncStatus === 'syncing';

    if (isAuthenticated && isSyncAttempting && !wasSyncAttempting) {
      syncAttemptStartedAtRef.current = Date.now();
    }

    if (isAuthenticated && wasSyncAttempting && syncStatus === 'synced') {
      if (syncAttemptStartedAtRef.current) {
        const durationMs = Date.now() - syncAttemptStartedAtRef.current;
        setTimeout(() => {
          setLastSyncDurationMs(durationMs);
        }, 0);
      }
      syncAttemptStartedAtRef.current = null;
      prevSyncStatusRef.current = syncStatus;
      setTimeout(() => {
        setShowToast(true);
        setJustSynced(true);
      }, 0);
      const toastTimer = setTimeout(() => {
        setShowToast(false);
      }, 2000);
      const syncTimer = setTimeout(() => {
        setJustSynced(false);
      }, 3000);
      return () => {
        clearTimeout(toastTimer);
        clearTimeout(syncTimer);
      };
    }

    if (!isAuthenticated || syncStatus === 'error' || syncStatus === 'idle') {
      syncAttemptStartedAtRef.current = null;
    }

    prevSyncStatusRef.current = syncStatus;
  }, [syncStatus, isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div
        className="tooltip tooltip-bottom"
        data-tip="로그인하여 데이터를 서버에 안전하게 보관하세요"
      >
        <button className="btn btn-circle btn-ghost btn-sm opacity-50">
          <DatabaseZap size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="tooltip tooltip-bottom" data-tip={statusText}>
        <button
          className={clsx('btn btn-circle btn-ghost btn-sm transition-colors', {
            'opacity-60': syncStatus === 'pending',
            'text-info': syncStatus === 'syncing',
            'text-success': justSynced,
            'text-error': syncStatus === 'error',
          })}
        >
          {(syncStatus === 'idle' ||
            (syncStatus === 'synced' && !justSynced)) && <Database size={16} />}
          {syncStatus === 'pending' && <Database size={16} />}
          {syncStatus === 'syncing' && <DatabaseBackup size={16} />}
          {syncStatus === 'synced' && justSynced && (
            <DatabaseBackup size={16} />
          )}
          {syncStatus === 'error' && <AlertCircle size={16} />}
        </button>
      </div>
      {showToast && (
        <div className="animate-in fade-in slide-in-from-top-1 absolute right-0 top-full z-50 mt-2 duration-200">
          <div className="whitespace-nowrap rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-xs font-medium text-success shadow-lg">
            동기화 완료{formattedDuration ? ` (${formattedDuration})` : ''}
          </div>
        </div>
      )}
    </div>
  );
};
