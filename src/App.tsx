import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import DashboardLayout from './components/DashboardLayout';

const IntroPage = lazy(() => import('./pages/IntroPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const LeadsPage = lazy(() => import('./pages/LeadsPage'));
const AutomationPage = lazy(() => import('./pages/AutomationPage'));
const QuickAnalyticsPage = lazy(() => import('./pages/QuickAnalyticsPage'));
const InboundLeadsPage = lazy(() => import('./pages/InboundLeadsPage'));

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-600 dark:text-slate-400">Loading...</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

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
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

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

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function DashboardRoutes() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigate = (page: 'dashboard' | 'leads' | 'automation' | 'quick-analytics' | 'inbound-leads') => {
    navigate(`/${page}`);
  };

  const currentPage = location.pathname.slice(1) as 'dashboard' | 'leads' | 'automation' | 'quick-analytics' | 'inbound-leads';

  return (
    <DashboardLayout currentPage={currentPage} onNavigate={handleNavigate}>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/dashboard" element={<DashboardPage onNavigate={handleNavigate} />} />
          <Route path="/leads" element={<LeadsPage />} />
          <Route path="/automation" element={<AutomationPage />} />
          <Route path="/quick-analytics" element={<QuickAnalyticsPage />} />
          <Route path="/inbound-leads" element={<InboundLeadsPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </DashboardLayout>
  );
}

function AppContent() {
  const navigate = useNavigate();

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route
          path="/"
          element={
            <PublicRoute>
              <IntroPage onGetStarted={() => navigate('/login')} />
            </PublicRoute>
          }
        />
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage onCreateAccount={() => navigate('/signup')} onBackToIntro={() => navigate('/')} />
            </PublicRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicRoute>
              <SignupPage onBackToLogin={() => navigate('/login')} onBackToIntro={() => navigate('/')} />
            </PublicRoute>
          }
        />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <DashboardRoutes />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
