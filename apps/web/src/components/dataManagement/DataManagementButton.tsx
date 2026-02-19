import clsx from 'clsx';
import { AlertCircle, Database, DatabaseBackup } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import { RootState } from '../../store';
import { formatSyncDuration } from '../../utils/syncTime';

interface Props {
  onClick: () => void;
}

export const DataManagementButton = ({ onClick }: Props) => {
  const { syncStatus } = useSelector((state: RootState) => state.logs);
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated,
  );
  const isSyncAttempting =
    isAuthenticated && (syncStatus === 'pending' || syncStatus === 'syncing');

  const [showToast, setShowToast] = useState(false);
  const [justSynced, setJustSynced] = useState(false);
  const [lastSyncDurationMs, setLastSyncDurationMs] = useState<number | null>(
    null,
  );
  const prevSyncStatusRef = useRef(syncStatus);
  const syncAttemptStartedAtRef = useRef<number | null>(null);
  const formattedDuration = formatSyncDuration(lastSyncDurationMs);

  useEffect(() => {
    const wasSyncAttempting =
      prevSyncStatusRef.current === 'pending' ||
      prevSyncStatusRef.current === 'syncing';
    const isSyncAttempting =
      syncStatus === 'pending' || syncStatus === 'syncing';

    if (isAuthenticated && isSyncAttempting && !wasSyncAttempting) {
      syncAttemptStartedAtRef.current = Date.now();
      setTimeout(() => {
        setShowToast(false);
        setJustSynced(false);
      }, 0);
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
      if (!isAuthenticated) {
        setTimeout(() => {
          setShowToast(false);
          setJustSynced(false);
        }, 0);
      }
    }

    prevSyncStatusRef.current = syncStatus;
  }, [syncStatus, isAuthenticated]);

  const getIcon = () => {
    if (!isAuthenticated) {
      return <Database size={16} />;
    }

    if (syncStatus === 'error') {
      return <AlertCircle size={16} />;
    }

    if (
      syncStatus === 'pending' ||
      syncStatus === 'syncing' ||
      (justSynced && !isSyncAttempting)
    ) {
      return <DatabaseBackup size={16} />;
    }

    return <Database size={16} />;
  };

  const syncAttemptLabel = '동기화 시도 중...';
  const buttonTitle =
    isAuthenticated && isSyncAttempting ? syncAttemptLabel : '데이터 관리';
  const shouldShowSyncAttemptToast = isAuthenticated && isSyncAttempting;
  const shouldShowSuccessToast =
    isAuthenticated && showToast && !isSyncAttempting;
  const shouldShowUnauthenticatedToast =
    !isAuthenticated && !shouldShowSyncAttemptToast && !shouldShowSuccessToast;

  return (
    <div className="relative">
      <button
        type="button"
        className={clsx('btn btn-circle btn-ghost transition-colors', {
          'text-info': isAuthenticated && isSyncAttempting,
          'text-success': isAuthenticated && justSynced && !isSyncAttempting,
          'text-error':
            (isAuthenticated && syncStatus === 'error') || !isAuthenticated,
        })}
        onClick={onClick}
        title={buttonTitle}
      >
        {getIcon()}
      </button>
      {shouldShowSyncAttemptToast && (
        <div className="animate-in fade-in slide-in-from-top-1 absolute left-1/2 top-full z-50 mt-2 -translate-x-1/2 duration-200">
          <div className="relative">
            <div className="whitespace-nowrap rounded-lg border border-info/40 bg-info/10 px-3 py-2 text-xs font-medium text-info shadow-lg">
              {syncAttemptLabel}
            </div>
            <div className="absolute -top-[5px] left-1/2 h-2.5 w-2.5 -translate-x-1/2 rotate-45 border-l border-t border-info/40 bg-info/10"></div>
          </div>
        </div>
      )}
      {shouldShowSuccessToast && (
        <div className="animate-in fade-in slide-in-from-top-1 absolute left-1/2 top-full z-50 mt-2 -translate-x-1/2 duration-200">
          <div className="whitespace-nowrap rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-xs font-medium text-success shadow-lg">
            동기화 완료{formattedDuration ? ` (${formattedDuration})` : ''}
          </div>
        </div>
      )}
      {shouldShowUnauthenticatedToast && (
        <div className="animate-in fade-in slide-in-from-top-1 absolute left-1/2 top-full z-50 mt-2 -translate-x-1/2 duration-200">
          <div className="relative">
            <div className="whitespace-nowrap rounded-lg border border-error bg-base-100 px-3 py-2 text-xs font-medium text-error shadow-lg">
              동기화가 되고 있지 않습니다.
            </div>
            <div className="absolute -top-[5px] left-1/2 h-2.5 w-2.5 -translate-x-1/2 rotate-45 border-l border-t border-error bg-base-100"></div>
          </div>
        </div>
      )}
    </div>
  );
};
