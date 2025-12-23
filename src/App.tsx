import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import IntroPage from './pages/IntroPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import LeadsPage from './pages/LeadsPage';
import AutomationPage from './pages/AutomationPage';
import QuickAnalyticsPage from './pages/QuickAnalyticsPage';
import InboundLeadsPage from './pages/InboundLeadsPage';
import DashboardLayout from './components/DashboardLayout';

type Page = 'intro' | 'login' | 'signup' | 'dashboard' | 'leads' | 'automation' | 'quick-analytics' | 'inbound-leads';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('intro');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    if (currentPage === 'intro') {
      return <IntroPage onGetStarted={() => setCurrentPage('login')} />;
    }
    if (currentPage === 'signup') {
      return <SignupPage onBackToLogin={() => setCurrentPage('login')} onBackToIntro={() => setCurrentPage('intro')} />;
    }
    return <LoginPage onCreateAccount={() => setCurrentPage('signup')} onBackToIntro={() => setCurrentPage('intro')} />;
  }

  const handleNavigate = (page: 'dashboard' | 'leads' | 'automation' | 'quick-analytics' | 'inbound-leads') => {
    setCurrentPage(page);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage onNavigate={handleNavigate} />;
      case 'leads':
        return <LeadsPage />;
      case 'automation':
        return <AutomationPage />;
      case 'quick-analytics':
        return <QuickAnalyticsPage />;
      case 'inbound-leads':
        return <InboundLeadsPage />;
      default:
        return <DashboardPage onNavigate={handleNavigate} />;
    }
  };

  return (
    <DashboardLayout
      currentPage={currentPage as 'dashboard' | 'leads' | 'automation' | 'quick-analytics' | 'inbound-leads'}
      onNavigate={handleNavigate}
    >
      {renderPage()}
    </DashboardLayout>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
