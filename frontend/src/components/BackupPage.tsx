import React, { useState, useRef, useEffect } from 'react';
import { Download, Upload, AlertTriangle, CheckCircle, Database, FileJson, Loader2, Undo2 } from 'lucide-react';
import { exportFullBackup, importFullBackup, canRevertBackup, revertBackup, type BackupData } from '../api';
import { clsx } from 'clsx';

export const BackupPage: React.FC = () => {
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [isReverting, setIsReverting] = useState(false);
    const [canRevert, setCanRevert] = useState(false);
    const [importData, setImportData] = useState<BackupData | null>(null);
    const [importStatus, setImportStatus] = useState<{ success: boolean; message: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        checkRevertStatus();
    }, []);

    const checkRevertStatus = async () => {
        try {
            const hasRevert = await canRevertBackup();
            setCanRevert(hasRevert);
        } catch (error) {
            console.error('Failed to check revert status', error);
        }
    };

    const handleRevert = async () => {
        if (!confirm('Are you sure you want to revert to the previous data? The current data will be completely deleted.')) return;
        try {
            setIsReverting(true);
            const result = await revertBackup();
            setImportStatus(result);
            checkRevertStatus();
        } catch (error: any) {
            console.error('Revert failed', error);
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
            console.error('Export failed', error);
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
                console.error('Invalid JSON', error);
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
            console.error('Import failed', error);
            const message = error.response?.data?.message || error.message || 'Failed to import backup.';
            alert(`Failed to import backup: ${message}`);
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <header>
                <h1 className="text-3xl font-bold text-slate-900">Backup & Restore</h1>
                <p className="text-slate-500 mt-2">Manage your data with full-site backup and restore capabilities.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* EXPORT SECTION */}
                <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center space-y-6">
                    <div className="p-4 bg-indigo-50 rounded-full text-indigo-600">
                        <Download size={32} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Export Data</h2>
                        <p className="text-slate-500 mt-2 text-sm leading-relaxed">
                            Download a full copy of your data including wealth sources, snapshots, income, and outgoings.
                            <br />The file will be in <strong>JSON</strong> format.
                        </p>
                    </div>
                    <button
                        onClick={handleExport}
                        disabled={isExporting}
                        className="w-full py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-70"
                    >
                        {isExporting ? <Loader2 className="animate-spin" /> : <FileJson size={20} />}
                        {isExporting ? 'Generating Backup...' : 'Download Backup'}
                    </button>
                </section>

                {/* IMPORT SECTION */}
                <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center space-y-6">
                    <div className="p-4 bg-amber-50 rounded-full text-amber-600">
                        <Upload size={32} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Restore Data</h2>
                        <p className="text-slate-500 mt-2 text-sm leading-relaxed">
                            Restore your data from a previous backup file.
                            <br />
                            <span className="text-amber-600 font-medium">Warning:</span> This will completely overwrite existing data.
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
                        className="w-full py-3 px-6 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-70"
                    >
                        <Database size={20} />
                        Select Backup File
                    </button>
                </section>
            </div>

            {/* SYSTEM INFORMATION SECTION */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">System Information</h2>
                        <p className="text-slate-500 text-sm">Details about your current Wealth Tracker instance.</p>
                    </div>
                </div>
                <div className="bg-slate-50 px-4 py-2 rounded-lg border border-slate-200">
                    <p className="text-sm font-medium text-slate-600">
                        Version <span className="text-slate-900 font-bold ml-1">0.2</span>
                    </p>
                </div>
            </div>

            {/* REVERT SECTION */}
            {canRevert && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-indigo-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">Undo Last Restore</h2>
                        <p className="text-slate-500 text-sm">You have a saved version of your data before the last restore. You can revert back to it.</p>
                    </div>
                    <button
                        onClick={handleRevert}
                        disabled={isReverting}
                        className="px-5 py-2.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg font-medium transition-colors shadow-sm flex items-center gap-2"
                    >
                        {isReverting ? <Loader2 className="animate-spin" size={18} /> : <Undo2 size={18} />}
                        Revert Data
                    </button>
                </div>
            )}

            {/* IMPORT CONFIRMATION */}
            {importData && (
                <div className="bg-white border-l-4 border-amber-500 p-6 rounded-xl shadow-sm animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex items-start gap-4">
                        <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                            <AlertTriangle size={24} />
                        </div>
                        <div className="flex-1 space-y-2">
                            <h3 className="font-bold text-slate-900 text-lg">Confirm Restore</h3>
                            <p className="text-slate-600">
                                You are about to restore a backup from <strong>{importData.timestamp}</strong> (Version {importData.version}).
                                <br />
                                This contains:
                            </p>
                            <ul className="list-disc list-inside text-sm text-slate-500 ml-2 space-y-1">
                                <li>{importData.data.wealth.sources.length} Wealth Sources</li>
                                <li>{importData.data.wealth.snapshots.length} Wealth Snapshots</li>
                                <li>{importData.data.budget.incomes.length} Income Sources</li>
                                <li>{importData.data.budget.outgoings.length} Outgoing Sources</li>
                            </ul>
                            <div className="pt-4 flex gap-3">
                                <button
                                    onClick={handleImportConfirm}
                                    disabled={isImporting}
                                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-colors shadow-sm flex items-center gap-2"
                                >
                                    {isImporting ? <Loader2 className="animate-spin" size={18} /> : null}
                                    Yes, Restore Data
                                </button>
                                <button
                                    onClick={() => setImportData(null)}
                                    className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg font-medium transition-colors"
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
                <div className={clsx(
                    "p-6 rounded-xl shadow-sm flex items-center gap-4 animate-in fade-in slide-in-from-bottom-2",
                    importStatus.success ? "bg-emerald-50 border border-emerald-100 text-emerald-800" : "bg-rose-50 border border-rose-100 text-rose-800"
                )}>
                    <div className={clsx("p-2 rounded-lg", importStatus.success ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600")}>
                        {importStatus.success ? <CheckCircle size={24} /> : <AlertTriangle size={24} />}
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">{importStatus.success ? "Restore Successful" : "Restore Failed"}</h3>
                        <p>{importStatus.message}</p>
                    </div>
                    <button onClick={() => setImportStatus(null)} className="ml-auto p-2 opacity-50 hover:opacity-100">
                        <CheckCircle size={18} />
                    </button>
                </div>
            )}
        </div>
    );
};
