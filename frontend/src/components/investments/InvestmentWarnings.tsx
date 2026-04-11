import React, { useState } from 'react';
import { AlertTriangle, AlertCircle, Info, X, ChevronDown, ChevronUp } from 'lucide-react';
import { clsx } from 'clsx';
import type { InvestmentWarning, WarningSeverity } from '../../utils/investmentUtils';

interface InvestmentWarningsProps {
    warnings: InvestmentWarning[];
    onScrollToHolding?: (holdingId: string) => void;
}

const severityConfig: Record<WarningSeverity, {
    bg: string;
    border: string;
    text: string;
    iconColor: string;
    badgeBg: string;
    badgeText: string;
    icon: React.ReactNode;
    label: string;
}> = {
    critical: {
        bg: 'bg-rose-50',
        border: 'border-rose-200',
        text: 'text-rose-800',
        iconColor: 'text-rose-500',
        badgeBg: 'bg-rose-100',
        badgeText: 'text-rose-700',
        icon: <AlertCircle size={16} />,
        label: 'Critical',
    },
    warning: {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        text: 'text-amber-800',
        iconColor: 'text-amber-500',
        badgeBg: 'bg-amber-100',
        badgeText: 'text-amber-700',
        icon: <AlertTriangle size={16} />,
        label: 'Warning',
    },
    info: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-800',
        iconColor: 'text-blue-500',
        badgeBg: 'bg-blue-100',
        badgeText: 'text-blue-700',
        icon: <Info size={16} />,
        label: 'Info',
    },
};

export const InvestmentWarnings: React.FC<InvestmentWarningsProps> = ({
    warnings,
    onScrollToHolding,
}) => {
    const [dismissed, setDismissed] = useState<Set<string>>(new Set());
    const [collapsed, setCollapsed] = useState(false);

    const visible = warnings.filter(w => !dismissed.has(`${w.holdingId}-${w.type}`));
    if (visible.length === 0) return null;

    const criticalCount = visible.filter(w => w.severity === 'critical').length;
    const warningCount = visible.filter(w => w.severity === 'warning').length;
    const infoCount = visible.filter(w => w.severity === 'info').length;

    const dismiss = (w: InvestmentWarning) => {
        setDismissed(prev => new Set(prev).add(`${w.holdingId}-${w.type}`));
    };

    const dismissAll = () => {
        setDismissed(new Set(visible.map(w => `${w.holdingId}-${w.type}`)));
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Header */}
            <button
                onClick={() => setCollapsed(c => !c)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors text-left"
            >
                <div className="flex items-center gap-3">
                    <AlertTriangle size={18} className="text-amber-500 flex-shrink-0" />
                    <span className="font-semibold text-slate-800">Performance Alerts</span>
                    <div className="flex items-center gap-2">
                        {criticalCount > 0 && (
                            <span className="text-xs font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">
                                {criticalCount} Critical
                            </span>
                        )}
                        {warningCount > 0 && (
                            <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                                {warningCount} Warning
                            </span>
                        )}
                        {infoCount > 0 && (
                            <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                {infoCount} Info
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={e => { e.stopPropagation(); dismissAll(); }}
                        className="text-xs text-slate-400 hover:text-slate-600 transition-colors px-2 py-1 rounded-lg hover:bg-slate-100"
                    >
                        Dismiss all
                    </button>
                    {collapsed ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronUp size={16} className="text-slate-400" />}
                </div>
            </button>

            {/* Warning list */}
            {!collapsed && (
                <div className="divide-y divide-slate-100 border-t border-slate-100">
                    {visible.map(w => {
                        const cfg = severityConfig[w.severity];
                        return (
                            <div
                                key={`${w.holdingId}-${w.type}`}
                                className={clsx('flex items-start gap-3 px-5 py-4', cfg.bg)}
                            >
                                <span className={clsx('mt-0.5 flex-shrink-0', cfg.iconColor)}>
                                    {cfg.icon}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={clsx('text-xs font-bold px-2 py-0.5 rounded-full', cfg.badgeBg, cfg.badgeText)}>
                                            {cfg.label}
                                        </span>
                                    </div>
                                    <p className={clsx('text-sm', cfg.text)}>{w.message}</p>
                                    {onScrollToHolding && (
                                        <button
                                            onClick={() => onScrollToHolding(w.holdingId)}
                                            className={clsx('text-xs mt-1.5 underline underline-offset-2 opacity-70 hover:opacity-100 transition-opacity', cfg.text)}
                                        >
                                            View holding ↓
                                        </button>
                                    )}
                                </div>
                                <button
                                    onClick={() => dismiss(w)}
                                    className={clsx('flex-shrink-0 p-1 rounded-lg transition-colors hover:bg-white/60', cfg.iconColor)}
                                    title="Dismiss"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
