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
        <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-40 flex items-center justify-between pl-20 pr-8">
            <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                    FinancialHealth <span className="text-indigo-600">Tracker</span>
                </h1>
            </div>

            <div className="relative">
                <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="flex items-center gap-3 text-slate-600 hover:text-slate-900 transition-colors p-2 rounded-lg hover:bg-slate-50"
                >
                    <span className="text-sm font-medium hidden sm:block capitalize">
                        {userType} User
                    </span>
                    <div className="relative">
                        <UserCircle size={28} className={clsx(
                            "transition-colors",
                            userType === 'live' ? "text-slate-400" : "text-indigo-500"
                        )} />
                        {userType === 'demo' && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-600 border-2 border-white rounded-full" />
                        )}
                    </div>
                    <ChevronDown size={16} className={clsx("transition-transform", isMenuOpen && "rotate-180")} />
                </button>

                {isMenuOpen && (
                    <>
                        <div
                            className="fixed inset-0 z-10"
                            onClick={() => setIsMenuOpen(false)}
                        />
                        <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-20 overflow-hidden py-1">
                            <button
                                onClick={() => {
                                    onUserTypeChange('live');
                                    setIsMenuOpen(false);
                                }}
                                className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                            >
                                <span className="font-medium">Live User</span>
                                {userType === 'live' && <Check size={16} className="text-indigo-600" />}
                            </button>
                            <button
                                onClick={() => {
                                    onUserTypeChange('demo');
                                    setIsMenuOpen(false);
                                }}
                                className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
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
