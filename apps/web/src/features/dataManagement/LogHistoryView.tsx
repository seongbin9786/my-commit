import { format } from 'date-fns';
import { AlertCircle, Archive, Loader2, RotateCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { BackupItem, getLogBackupsFromServer } from '../../services/LogService';
import { RootState } from '../../store';
import { updateRawLog } from '../../store/logs';

interface Props {
  onClose: () => void;
}

export const LogHistoryView = ({ onClose }: Props) => {
  const { currentDate } = useSelector((state: RootState) => state.logs);
  const dispatch = useDispatch();
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBackups = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getLogBackupsFromServer(currentDate);
        // Sort by backedUpAt desc
        const sorted = data.sort(
          (a, b) =>
            new Date(b.backedUpAt).getTime() - new Date(a.backedUpAt).getTime(),
        );
        setBackups(sorted);
      } catch (err) {
        setError('백업 목록을 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBackups();
  }, [currentDate]);

  const handleRestore = (content: string) => {
    if (
      confirm(
        '이 버전으로 복구하시겠습니까? 현재 내용은 새로운 백업 버전으로 저장됩니다.',
      )
    ) {
      dispatch(updateRawLog(content));
      onClose();
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-base-content/50">
        <Loader2 className="mb-2 animate-spin" size={24} />
        <p className="text-sm">백업 기록을 불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error text-sm">
        <AlertCircle size={16} />
        <span>{error}</span>
      </div>
    );
  }

  if (backups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-base-content/50">
        <Archive className="mb-2 opacity-50" size={32} />
        <p>저장된 백업 기록이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="flex max-h-[400px] flex-col gap-2 overflow-y-auto">
      <div className="alert alert-warning mb-2 text-xs">
        <span>
          백업을 선택하여 내용을 복구할 수 있습니다.
          <br />
          복구 시 현재 내용은 사라지지 않고 새로운 백업으로 저장됩니다.
        </span>
      </div>

      {backups.map((backup) => (
        <div
          key={backup.backupId}
          className="card card-bordered border-base-200 bg-base-100 shadow-sm transition-colors hover:bg-base-200/50"
        >
          <div className="card-body p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-sm font-bold">
                  {format(new Date(backup.backedUpAt), 'a h:mm:ss')}
                </span>
                <span className="text-xs text-base-content/60">
                  version {backup.originalVersion || '?'}
                </span>
              </div>
              <button
                className="btn btn-ghost btn-sm gap-2 text-primary"
                onClick={() => handleRestore(backup.content)}
              >
                <RotateCcw size={14} />
                복구
              </button>
            </div>
            <div className="line-clamp-3 rounded bg-base-200 p-2 font-mono text-xs opacity-80">
              {backup.content || '(내용 없음)'}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
