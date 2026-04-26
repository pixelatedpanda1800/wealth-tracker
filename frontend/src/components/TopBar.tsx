import React, { useState } from 'react';
import { UserCircle, ChevronDown, Check } from 'lucide-react';
import { clsx } from 'clsx';

export type UserType = 'live' | 'demo';

interface TopBarProps {
  userType: UserType;
  onUserTypeChange: (type: UserType) => void;
}

export const TopBar: React.FC<TopBarProps> = ({ userType, onUserTypeChange }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 right-0 left-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white pr-8 pl-20">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          FinancialHealth <span className="text-indigo-600">Tracker</span>
        </h1>
      </div>

      <div className="relative">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="flex items-center gap-3 rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
        >
          <span className="hidden text-sm font-medium capitalize sm:block">{userType} User</span>
          <div className="relative">
            <UserCircle
              size={28}
              className={clsx(
                'transition-colors',
                userType === 'live' ? 'text-slate-400' : 'text-indigo-500',
              )}
            />
            {userType === 'demo' && (
              <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full border-2 border-white bg-indigo-600" />
            )}
          </div>
          <ChevronDown
            size={16}
            className={clsx('transition-transform', isMenuOpen && 'rotate-180')}
          />
        </button>

        {isMenuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)} />
            <div className="absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
              <button
                onClick={() => {
                  onUserTypeChange('live');
                  setIsMenuOpen(false);
                }}
                className="flex w-full items-center justify-between px-4 py-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-50"
              >
                <span className="font-medium">Live User</span>
                {userType === 'live' && <Check size={16} className="text-indigo-600" />}
              </button>
              <button
                onClick={() => {
                  onUserTypeChange('demo');
                  setIsMenuOpen(false);
                }}
                className="flex w-full items-center justify-between px-4 py-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-50"
              >
                <div className="flex flex-col items-start">
                  <span className="font-medium">Demo User</span>
                  <span className="text-[10px] text-slate-400">Demo data (coming soon)</span>
                </div>
                {userType === 'demo' && <Check size={16} className="text-indigo-600" />}
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
};
