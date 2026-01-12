import {
  Cloud,
  CloudOff,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import clsx from 'clsx';
import { useMemo } from 'react';

export const SyncStatusIndicator = () => {
  const { syncStatus, lastSyncedAt } = useSelector(
    (state: RootState) => state.logs,
  );
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated,
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
        return `저장됨 (${lastSyncedAt ? new Date(lastSyncedAt).toLocaleTimeString() : '방금'})`;
      case 'error':
        return '저장 실패';
      default:
        return '';
    }
  }, [syncStatus, lastSyncedAt]);

  if (!isAuthenticated) {
    return (
      <div
        className="tooltip tooltip-bottom"
        data-tip="로그인하여 데이터를 서버에 안전하게 보관하세요"
      >
        <button className="btn btn-circle btn-ghost btn-sm opacity-50">
          <CloudOff size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="tooltip tooltip-bottom" data-tip={statusText}>
      <button
        className={clsx('btn btn-circle btn-ghost btn-sm', {
          'text-warning': syncStatus === 'pending',
          'text-info': syncStatus === 'syncing',
          'text-success': syncStatus === 'synced',
          'text-error': syncStatus === 'error',
        })}
      >
        {syncStatus === 'idle' && <Cloud size={16} />}
        {syncStatus === 'pending' && <Cloud size={16} className="opacity-50" />}
        {syncStatus === 'syncing' && (
          <Loader2 size={16} className="animate-spin" />
        )}
        {syncStatus === 'synced' && <CheckCircle2 size={16} />}
        {syncStatus === 'error' && <AlertCircle size={16} />}
      </button>
    </div>
  );
};
