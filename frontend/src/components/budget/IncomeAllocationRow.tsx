import React from 'react';
import { ArrowRight, Pencil, Trash2 } from 'lucide-react';
import { type IncomeTransfer } from '../../api';

interface IncomeAllocationRowProps {
    transfer: IncomeTransfer;
    onEdit: (transfer: IncomeTransfer) => void;
    onDelete: (id: string) => void;
}

export const IncomeAllocationRow: React.FC<IncomeAllocationRowProps> = ({ transfer, onEdit, onDelete }) => {
    return (
        <div className="group flex items-center justify-between p-3 bg-indigo-50/50 rounded-xl border border-indigo-100/50 hover:bg-indigo-50 hover:border-indigo-200 transition-all mb-4">
            <div className="flex items-center gap-4">
                <div className="flex flex-col">
                    <p className="text-sm font-semibold text-indigo-900">{transfer.description}</p>
                    <div className="flex items-center gap-2 text-xs text-indigo-700/70">
                        <span className="font-medium bg-white px-1.5 py-0.5 rounded border border-indigo-100">
                            {transfer.sourceAccount?.name || 'Unknown'}
                        </span>
                        <ArrowRight size={12} />
                        <span className="font-medium bg-white px-1.5 py-0.5 rounded border border-indigo-100">
                            {transfer.targetAccount?.name || 'Unknown'}
                        </span>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <span className="text-lg font-bold text-indigo-600">
                    £{Number(transfer.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => onEdit(transfer)}
                        className="p-1.5 text-indigo-400 hover:text-indigo-600 hover:bg-white rounded-md transition-colors"
                    >
                        <Pencil size={14} />
                    </button>
                    <button
                        onClick={() => onDelete(transfer.id)}
                        className="p-1.5 text-indigo-400 hover:text-rose-600 hover:bg-white rounded-md transition-colors"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
};
