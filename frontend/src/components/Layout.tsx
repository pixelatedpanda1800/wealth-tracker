import React from 'react';
import { Sidebar, type PageId } from './Sidebar';
import { TopBar, type UserType } from './TopBar';

interface LayoutProps {
    children: React.ReactNode;
    activePage: PageId;
    onPageChange: (page: PageId) => void;
    userType: UserType;
    onUserTypeChange: (type: UserType) => void;
}

export const Layout: React.FC<LayoutProps> = ({
    children,
    activePage,
    onPageChange,
    userType,
    onUserTypeChange
}) => {
    return (
        <div className="min-h-screen bg-slate-50">
            <TopBar userType={userType} onUserTypeChange={onUserTypeChange} />

            <div className="flex pt-16">
                <Sidebar activePage={activePage} onPageChange={onPageChange} />

                {/* Main Content Area */}
                <main className="flex-1 ml-16 p-8 transition-all duration-300">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};
