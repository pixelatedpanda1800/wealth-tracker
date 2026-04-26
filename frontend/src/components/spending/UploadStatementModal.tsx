import React, { useState } from 'react';
import { X, Upload, Info } from 'lucide-react';
import type { MockAccount } from './types';

interface Props {
  isOpen: boolean;
  accounts: MockAccount[];
  defaultAccountId: string;
  defaultMonthKey: string;
  onClose: () => void;
  onSimulate: (accountId: string, monthKey: string) => number;
}

export const UploadStatementModal: React.FC<Props> = ({
  isOpen,
  accounts,
  defaultAccountId,
  defaultMonthKey,
  onClose,
  onSimulate,
}) => {
  const [accountId, setAccountId] = useState(defaultAccountId);
  const [monthKey, setMonthKey] = useState(defaultMonthKey);
  const [result, setResult] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFileName(f.name);
  };

  const handleSimulate = () => {
    const count = onSimulate(accountId, monthKey);
    setResult(
      `Simulated import: added ${count} transactions to ${accounts.find((a) => a.id === accountId)?.name}.`,
    );
  };

  const handleClose = () => {
    setResult(null);
    setFileName(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h3 className="font-semibold text-slate-800">Upload bank statement</h3>
          <button
            onClick={handleClose}
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>
        <div className="space-y-4 px-6 py-5">
          <div className="flex items-start gap-2 rounded-lg border border-indigo-100 bg-indigo-50 p-3 text-xs text-indigo-800">
            <Info size={16} className="mt-0.5 flex-shrink-0" />
            <p>
              Phase 1 preview — real CSV parsing and AI categorisation arrive in later phases. Use
              "Simulate import" to add a few sample transactions to this month so you can try the
              UI.
            </p>
          </div>

          <label className="block">
            <span className="text-xs font-medium tracking-wider text-slate-500 uppercase">
              Account
            </span>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-medium tracking-wider text-slate-500 uppercase">
              Statement month
            </span>
            <input
              type="month"
              value={monthKey}
              onChange={(e) => setMonthKey(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </label>

          <label className="block">
            <span className="text-xs font-medium tracking-wider text-slate-500 uppercase">
              CSV file
            </span>
            <div className="mt-1 rounded-lg border-2 border-dashed border-slate-200 px-4 py-6 text-center">
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={handleFile}
                className="hidden"
                id="statement-file"
              />
              <label
                htmlFor="statement-file"
                className="inline-flex cursor-pointer items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700"
              >
                <Upload size={16} /> Choose a CSV file
              </label>
              {fileName && (
                <p className="mt-2 text-xs text-slate-500">
                  Selected: {fileName} (parsing not yet implemented)
                </p>
              )}
            </div>
          </label>

          {result && (
            <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-800">
              {result}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-3">
          <button
            onClick={handleClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            Close
          </button>
          <button
            onClick={handleSimulate}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700"
          >
            Simulate import
          </button>
        </div>
      </div>
    </div>
  );
};
