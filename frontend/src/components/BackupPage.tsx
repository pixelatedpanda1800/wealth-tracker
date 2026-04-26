import { logger } from '../utils/logger';
import React, { useState, useRef, useEffect } from 'react';
import {
  Download,
  Upload,
  AlertTriangle,
  CheckCircle,
  Database,
  FileJson,
  Loader2,
  Undo2,
} from 'lucide-react';
import {
  exportFullBackup,
  importFullBackup,
  canRevertBackup,
  revertBackup,
  type BackupData,
} from '../api';
import { clsx } from 'clsx';

export const BackupPage: React.FC = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isReverting, setIsReverting] = useState(false);
  const [canRevert, setCanRevert] = useState(false);
  const [importData, setImportData] = useState<BackupData | null>(null);
  const [importStatus, setImportStatus] = useState<{ success: boolean; message: string } | null>(
    null,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const confirmationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkRevertStatus();
  }, []);

  useEffect(() => {
    if (importData && confirmationRef.current) {
      confirmationRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [importData]);

  const checkRevertStatus = async () => {
    try {
      const hasRevert = await canRevertBackup();
      setCanRevert(hasRevert);
    } catch (error) {
      logger.error('Failed to check revert status', error);
    }
  };

  const handleRevert = async () => {
    if (
      !confirm(
        'Are you sure you want to revert to the previous data? The current data will be completely deleted.',
      )
    )
      return;
    try {
      setIsReverting(true);
      const result = await revertBackup();
      setImportStatus(result);
      checkRevertStatus();
    } catch (error: any) {
      logger.error('Revert failed', error);
      const message = error.response?.data?.message || error.message || 'Failed to revert backup.';
      alert(`Failed to revert backup: ${message}`);
    } finally {
      setIsReverting(false);
    }
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const data = await exportFullBackup();

      // Create JSON blob and download
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wealth-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      logger.error('Export failed', error);
      alert('Failed to export backup.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        // Basic validation
        if (!json.version || !json.data) {
          throw new Error('Invalid backup file format');
        }
        setImportData(json);
        setImportStatus(null);
      } catch (error) {
        logger.error('Invalid JSON', error);
        alert('Invalid backup file. Please select a valid JSON backup.');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset
  };

  const handleImportConfirm = async () => {
    if (!importData) return;

    try {
      setIsImporting(true);
      const result = await importFullBackup(importData);
      setImportStatus(result);
      setImportData(null);
      checkRevertStatus();
    } catch (error: any) {
      logger.error('Import failed', error);
      const message = error.response?.data?.message || error.message || 'Failed to import backup.';
      alert(`Failed to import backup: ${message}`);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">Backup & Restore</h1>
        <p className="mt-2 text-slate-500">
          Manage your data with full-site backup and restore capabilities.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* EXPORT SECTION */}
        <section className="flex flex-col items-center space-y-6 rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-sm">
          <div className="rounded-full bg-indigo-50 p-4 text-indigo-600">
            <Download size={32} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Export Data</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              Download a full copy of your data including wealth sources, snapshots, income, and
              outgoings.
              <br />
              The file will be in <strong>JSON</strong> format.
            </p>
          </div>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:opacity-70"
          >
            {isExporting ? <Loader2 className="animate-spin" /> : <FileJson size={20} />}
            {isExporting ? 'Generating Backup...' : 'Download Backup'}
          </button>
        </section>

        {/* IMPORT SECTION */}
        <section className="flex flex-col items-center space-y-6 rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-sm">
          <div className="rounded-full bg-amber-50 p-4 text-amber-600">
            <Upload size={32} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Restore Data</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              Restore your data from a previous backup file.
              <br />
              <span className="font-medium text-amber-600">Warning:</span> This will completely
              overwrite existing data.
            </p>
          </div>

          <input
            type="file"
            accept=".json"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-70"
          >
            <Database size={20} />
            Select Backup File
          </button>
        </section>
      </div>

      {/* SYSTEM INFORMATION SECTION */}
      <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">System Information</h2>
            <p className="text-sm text-slate-500">
              Details about your current Wealth Tracker instance.
            </p>
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2">
          <p className="text-sm font-medium text-slate-600">
            Version <span className="ml-1 font-bold text-slate-900">0.4</span>
          </p>
        </div>
      </div>

      {/* REVERT SECTION */}
      {canRevert && (
        <div className="flex items-center justify-between rounded-2xl border border-indigo-100 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Undo Last Restore</h2>
            <p className="text-sm text-slate-500">
              You have a saved version of your data before the last restore. You can revert back to
              it.
            </p>
          </div>
          <button
            onClick={handleRevert}
            disabled={isReverting}
            className="flex items-center gap-2 rounded-lg bg-indigo-50 px-5 py-2.5 font-medium text-indigo-700 shadow-sm transition-colors hover:bg-indigo-100"
          >
            {isReverting ? <Loader2 className="animate-spin" size={18} /> : <Undo2 size={18} />}
            Revert Data
          </button>
        </div>
      )}

      {/* IMPORT CONFIRMATION */}
      {importData && (
        <div
          ref={confirmationRef}
          className="animate-in fade-in slide-in-from-bottom-2 rounded-xl border-l-4 border-amber-500 bg-white p-6 shadow-sm"
        >
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-amber-100 p-2 text-amber-600">
              <AlertTriangle size={24} />
            </div>
            <div className="flex-1 space-y-2">
              <h3 className="text-lg font-bold text-slate-900">Confirm Restore</h3>
              <p className="text-slate-600">
                You are about to restore a backup from <strong>{importData.timestamp}</strong>{' '}
                (Version {importData.version}).
                <br />
                This contains:
              </p>
              <ul className="ml-2 list-inside list-disc space-y-1 text-sm text-slate-500">
                <li>{importData.data.wealth.sources.length} Wealth Sources</li>
                <li>{importData.data.wealth.snapshots.length} Wealth Snapshots</li>
                <li>{importData.data.budget.incomes.length} Income Sources</li>
                <li>{importData.data.budget.outgoings.length} Outgoing Sources</li>
                <li>{importData.data.investments?.holdings?.length ?? 0} Investment Holdings</li>
                <li>{importData.data.investments?.snapshots?.length ?? 0} Investment Snapshots</li>
              </ul>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleImportConfirm}
                  disabled={isImporting}
                  className="flex items-center gap-2 rounded-lg bg-amber-500 px-5 py-2.5 font-medium text-white shadow-sm transition-colors hover:bg-amber-600"
                >
                  {isImporting ? <Loader2 className="animate-spin" size={18} /> : null}
                  Yes, Restore Data
                </button>
                <button
                  onClick={() => setImportData(null)}
                  className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 font-medium text-slate-600 transition-colors hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS MESSAGE */}
      {importStatus && (
        <div
          className={clsx(
            'animate-in fade-in slide-in-from-bottom-2 flex items-center gap-4 rounded-xl p-6 shadow-sm',
            importStatus.success
              ? 'border border-emerald-100 bg-emerald-50 text-emerald-800'
              : 'border border-rose-100 bg-rose-50 text-rose-800',
          )}
        >
          <div
            className={clsx(
              'rounded-lg p-2',
              importStatus.success
                ? 'bg-emerald-100 text-emerald-600'
                : 'bg-rose-100 text-rose-600',
            )}
          >
            {importStatus.success ? <CheckCircle size={24} /> : <AlertTriangle size={24} />}
          </div>
          <div>
            <h3 className="text-lg font-bold">
              {importStatus.success ? 'Restore Successful' : 'Restore Failed'}
            </h3>
            <p>{importStatus.message}</p>
          </div>
          <button
            onClick={() => setImportStatus(null)}
            className="ml-auto p-2 opacity-50 hover:opacity-100"
          >
            <CheckCircle size={18} />
          </button>
        </div>
      )}
    </div>
  );
};
