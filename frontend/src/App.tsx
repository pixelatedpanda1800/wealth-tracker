import { useState } from 'react';
import { Layout } from './components/Layout';
import type { PageId } from './components/Sidebar';
import { SummaryPage } from './components/SummaryPage';
import { AssetTracker } from './components/AssetTracker';
import { InvestmentsPage } from './components/InvestmentsPage';
import { LiabilitiesPage } from './components/LiabilitiesPage';
import { MonthlyBudgetPage } from './components/MonthlyBudgetPage';
import { BackupPage } from './components/BackupPage';

import type { UserType } from './components/TopBar';

function App() {
  const [activePage, setActivePage] = useState<PageId>('assets');
  const [userType, setUserType] = useState<UserType>('live');

  const renderPage = () => {
    switch (activePage) {
      case 'summary':
        return <SummaryPage />;
      case 'assets':
        return <AssetTracker />;
      case 'investments':
        return <InvestmentsPage />;
      case 'liabilities':
        return <LiabilitiesPage />;
      case 'budget':
        return <MonthlyBudgetPage />;
      case 'backup':
        return <BackupPage />;
      default:
        return <AssetTracker />;
    }
  };

  return (
    <Layout
      activePage={activePage}
      onPageChange={setActivePage}
      userType={userType}
      onUserTypeChange={setUserType}
    >
      {renderPage()}
    </Layout>
  );
}

export default App;
