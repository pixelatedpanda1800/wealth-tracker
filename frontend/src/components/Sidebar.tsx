import React, { useState } from 'react';
import {
    Menu,
    LayoutDashboard,
    PieChart,
    CreditCard,
    Database,
    X,
    Banknote,
    Gem
} from 'lucide-react';
import { clsx } from 'clsx';

export type PageId = 'summary' | 'assets' | 'investments' | 'liabilities' | 'budget' | 'backup';

interface SidebarProps {
    activePage: PageId;
    onPageChange: (page: PageId) => void;
}

interface NavItem {
    id: PageId;
    label: string;
    icon: React.ElementType;
}

const navItems: NavItem[] = [
    { id: 'summary', label: 'Summary', icon: LayoutDashboard },
    { id: 'budget', label: 'Monthly Budget', icon: Banknote },
    { id: 'assets', label: 'Asset Tracker', icon: Gem },
    { id: 'investments', label: 'Investments', icon: PieChart },
    { id: 'liabilities', label: 'Liabilities', icon: CreditCard },
    { id: 'backup', label: 'Backup & Restore', icon: Database },
];

export const Sidebar: React.FC<SidebarProps> = ({ activePage, onPageChange }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const toggleSidebar = () => setIsExpanded(!isExpanded);

    return (
        <>
            {/* Dimmed Background Overlay */}
            {isExpanded && (
                <div
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 transition-opacity"
                    onClick={() => setIsExpanded(false)}
                />
            )}

            {/* Sidebar Container */}
            <aside
                className={clsx(
                    "fixed top-0 left-0 h-full bg-[#0f172a] text-slate-300 transition-all duration-300 ease-in-out z-[60] flex flex-col items-center",
                    isExpanded ? "w-64" : "w-16"
                )}
            >
                {/* Burger / Close Menu */}
                <div className="w-full h-16 flex items-center justify-center border-b border-slate-700/50">
                    <button
                        onClick={toggleSidebar}
                        className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
                        title={isExpanded ? "Collapse Menu" : "Expand Menu"}
                    >
                        {isExpanded ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>

                {/* Separator line (not full width) */}
                <div className="w-10 border-b border-slate-700 my-4" />

                {/* Navigation Items */}
                <nav className="flex-1 w-full px-2 space-y-2">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activePage === item.id;

                        return (
                            <button
                                key={item.id}
                                onClick={() => {
                                    onPageChange(item.id);
                                    if (isExpanded) setIsExpanded(false);
                                }}
                                className={clsx(
                                    "w-full flex items-center gap-4 p-3 rounded-lg transition-all relative group",
                                    isActive
                                        ? "bg-slate-800/50 text-white ring-1 ring-slate-700 shadow-[0_0_0_1px_rgba(255,255,255,0.1)_inset]"
                                        : "hover:bg-slate-800/30 hover:text-white"
                                )}
                                title={!isExpanded ? item.label : undefined}
                            >
                                <div className={clsx(
                                    "flex items-center justify-center min-w-[24px]",
                                    isActive ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300"
                                )}>
                                    <Icon size={24} strokeWidth={1.5} />
                                </div>

                                <span className={clsx(
                                    "font-medium whitespace-nowrap transition-opacity duration-200",
                                    isExpanded ? "opacity-100" : "opacity-0 w-0 overflow-hidden"
                                )}>
                                    {item.label}
                                </span>

                                {/* Grid box indicator (active state) */}
                                {isActive && (
                                    <div className="absolute inset-0 border border-slate-600/50 rounded-lg pointer-events-none" />
                                )}
                            </button>
                        );
                    })}
                </nav>
            </aside>
        </>
    );
};
