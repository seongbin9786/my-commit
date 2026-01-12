import { Download, FileSpreadsheet, Upload, RefreshCw } from 'lucide-react';
import { useRef, useState } from 'react';

import { createBackup, downloadBackupInfo, exportLogsToExcel, importBackup } from './backupService';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export const DataManagementDialog = ({ isOpen, onClose }: Props) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'backup' | 'sync'>('backup');
  const [importStatus, setImportStatus] = useState<string>('');

  if (!isOpen) return null;

  const handleExportJson = () => {
    const backup = createBackup();
    downloadBackupInfo(backup);
  };

  const handleExportExcel = () => {
    exportLogsToExcel();
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await importBackup(file);
      setImportStatus('복구 성공! 페이지를 새로고침합니다...');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      setImportStatus('복구 실패: 올바르지 않은 파일 형식이거나 오류가 발생했습니다.');
    }
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <h3 className="text-lg font-bold">데이터 관리</h3>
        
        <div className="tabs tabs-boxed my-4">
          <a 
            className={`tab ${activeTab === 'backup' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('backup')}
          >
            백업/복구
          </a>
          <a 
            className={`tab ${activeTab === 'sync' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('sync')}
          >
            서버 동기화
          </a>
        </div>

        {activeTab === 'backup' && (
          <div className="flex flex-col gap-4">
            <div className="alert alert-info text-xs">
              <span>
                브라우저 저장소(LocalStorage)에 있는 데이터를 파일로 저장하거나 복구합니다.<br/>
                데이터가 사라질 위험에 대비해 주기적으로 백업하세요.
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <button className="btn btn-outline gap-2" onClick={handleExportJson}>
                <Download size={16} />
                JSON 파일로 내보내기 (전체 백업)
              </button>
              
              <button className="btn btn-outline gap-2" onClick={handleExportExcel}>
                <FileSpreadsheet size={16} />
                Excel 파일로 내보내기 (기록만)
              </button>

              <div className="divider"></div>

              <button className="btn btn-warning gap-2" onClick={handleImportClick}>
                <Upload size={16} />
                JSON 파일에서 복구하기
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".json" 
                onChange={handleFileChange}
              />
              {importStatus && <p className="text-sm font-bold text-secondary">{importStatus}</p>}
            </div>
          </div>
        )}

        {activeTab === 'sync' && (
          <div className="flex flex-col gap-4 py-8 text-center text-gray-500">
            <RefreshCw size={48} className="mx-auto mb-2 opacity-50" />
            <p>서버 동기화 기능은 준비 중입니다.</p>
            <p className="text-xs">계정을 생성하고 데이터를 클라우드에 안전하게 보관하세요.</p>
          </div>
        )}

        <div className="modal-action">
          <button className="btn" onClick={onClose}>닫기</button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
};
