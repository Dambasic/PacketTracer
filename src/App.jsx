import React, { useState, useEffect } from 'react';
import { NetworkProvider } from './context/NetworkContext.jsx';
import Sidebar, { NAV_ITEMS } from './components/layout/Sidebar.jsx';
import Header from './components/layout/Header.jsx';
import GuidedDemoModal from './components/pbl/GuidedDemoModal.jsx';

// Pages
import DashboardPage from './pages/DashboardPage.jsx';
import NetworkPage from './pages/NetworkPage.jsx';
import RoutingPage from './pages/RoutingPage.jsx';
import PacketsPage from './pages/PacketsPage.jsx';
import EventsPage from './pages/EventsPage.jsx';
import AnalyticsPage from './pages/AnalyticsPage.jsx';
import HistoryPage from './pages/HistoryPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';

export default function App() {
  // Sync tab state with browser URL path and hash for Vercel SPA routing
  const getInitialTab = () => {
    const path = window.location.pathname.replace(/^\//, '').toLowerCase();
    const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
    const candidate = path || hash;
    const match = NAV_ITEMS.find(item => item.id === candidate);
    return match ? match.id : 'dashboard';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);
  const [isGuidedDemoOpen, setIsGuidedDemoOpen] = useState(false);

  // Keep browser URL and browser history in sync
  useEffect(() => {
    const handlePopState = () => {
      setActiveTab(getInitialTab());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleSelectTab = (tabId) => {
    setActiveTab(tabId);
    window.history.pushState(null, '', `/${tabId === 'dashboard' ? '' : tabId}`);
  };

  const renderActivePage = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardPage
            onNavigate={handleSelectTab}
            onOpenGuidedDemo={() => setIsGuidedDemoOpen(true)}
          />
        );
      case 'network':
        return <NetworkPage />;
      case 'routing':
        return <RoutingPage />;
      case 'packets':
        return <PacketsPage />;
      case 'events':
        return <EventsPage />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'history':
        return <HistoryPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return (
          <DashboardPage
            onNavigate={handleSelectTab}
            onOpenGuidedDemo={() => setIsGuidedDemoOpen(true)}
          />
        );
    }
  };

  return (
    <NetworkProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans text-slate-900 antialiased">
        {/* Left Sidebar */}
        <Sidebar activeTab={activeTab} onSelectTab={handleSelectTab} />

        {/* Right Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          {/* Top Header */}
          <Header onOpenGuidedDemo={() => setIsGuidedDemoOpen(true)} />

          {/* Scrollable Viewport */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto pb-12">
              {renderActivePage()}
            </div>
          </main>
        </div>

        {/* Guided Demonstration Modal */}
        <GuidedDemoModal
          isOpen={isGuidedDemoOpen}
          onClose={() => setIsGuidedDemoOpen(false)}
        />
      </div>
    </NetworkProvider>
  );
}
