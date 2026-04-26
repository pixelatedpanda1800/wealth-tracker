import React, { useState } from 'react';
import {
  Menu,
  LayoutDashboard,
  PieChart,
  CreditCard,
  Database,
  X,
  Banknote,
  Gem,
  Receipt,
} from 'lucide-react';
import { clsx } from 'clsx';

export type PageId =
  | 'summary'
  | 'assets'
  | 'investments'
  | 'liabilities'
  | 'budget'
  | 'spending'
  | 'backup';

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
  { id: 'spending', label: 'Spending', icon: Receipt },
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
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm transition-opacity"
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={clsx(
          'fixed top-0 left-0 z-[60] flex h-full flex-col items-center bg-[#0f172a] text-slate-300 transition-all duration-300 ease-in-out',
          isExpanded ? 'w-64' : 'w-16',
        )}
      >
        {/* Burger / Close Menu */}
        <div className="flex h-16 w-full items-center justify-center border-b border-slate-700/50">
          <button
            onClick={toggleSidebar}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
            title={isExpanded ? 'Collapse Menu' : 'Expand Menu'}
          >
            {isExpanded ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Separator line (not full width) */}
        <div className="my-4 w-10 border-b border-slate-700" />

        {/* Navigation Items */}
        <nav className="w-full flex-1 space-y-2 px-2">
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
                  'group relative flex w-full items-center gap-4 rounded-lg p-3 transition-all',
                  isActive
                    ? 'bg-slate-800/50 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.1)_inset] ring-1 ring-slate-700'
                    : 'hover:bg-slate-800/30 hover:text-white',
                )}
                title={!isExpanded ? item.label : undefined}
              >
                <div
                  className={clsx(
                    'flex min-w-[24px] items-center justify-center',
                    isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300',
                  )}
                >
                  <Icon size={24} strokeWidth={1.5} />
                </div>

                <span
                  className={clsx(
                    'font-medium whitespace-nowrap transition-opacity duration-200',
                    isExpanded ? 'opacity-100' : 'w-0 overflow-hidden opacity-0',
                  )}
                >
                  {item.label}
                </span>

                {/* Grid box indicator (active state) */}
                {isActive && (
                  <div className="pointer-events-none absolute inset-0 rounded-lg border border-slate-600/50" />
                )}
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
};
