import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { QueryProvider } from '@/providers/QueryProvider';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AppleStyleLayout } from '@/components/layout/AppleStyleLayout';
import { LoginPage } from '@/pages/LoginPage';

// Lazy load delle pagine principali
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage').then(module => ({ default: module.DashboardPage })));
const AthletesPage = lazy(() => import('@/pages/athletes/AthletesPage').then(module => ({ default: module.AthletesPage })));
const CompetitionsPage = lazy(() => import('@/pages/competitions/CompetitionsPage').then(module => ({ default: module.CompetitionsPage })));
const CreateCompetitionPage = lazy(() => import('@/pages/competitions/CreateCompetitionPage').then(module => ({ default: module.CreateCompetitionPage })));
const EditCompetitionPage = lazy(() => import('@/pages/competitions/EditCompetitionPage'));
const ResultsPage = lazy(() => import('@/pages/results/ResultsPage').then(module => ({ default: module.ResultsPage })));
const OrganizerPage = lazy(() => import('@/pages/organizer/OrganizerPage').then(module => ({ default: module.OrganizerPage })));
const RegistrationsPage = lazy(() => import('@/pages/registrations/RegistrationsPage').then(module => ({ default: module.RegistrationsPage })));
const PublicCompetitionsPage = lazy(() => import('@/pages/public/PublicCompetitionsPage').then(module => ({ default: module.PublicCompetitionsPage })));
const CompetitionRegistrationPage = lazy(() => import('@/pages/public/CompetitionRegistrationPage').then(module => ({ default: module.CompetitionRegistrationPage })));
const EnhancedHomePage = lazy(() => import('@/pages/public/EnhancedHomePage').then(module => ({ default: module.EnhancedHomePage })));
const JudgesPage = lazy(() => import('@/pages/judges/JudgesPage'));
const WeighInPage = lazy(() => import('@/pages/weigh-in/WeighInPage'));
const OptimizedLivePage = lazy(() => import('@/pages/live/OptimizedLivePage').then(module => ({ default: module.OptimizedLivePage })));
const RecordsPage = lazy(() => import('@/pages/records/RecordsPage'));
const BackupPage = lazy(() => import('@/pages/backup/BackupPage'));
const NotificationsPage = lazy(() => import('@/pages/notifications/NotificationsPage'));
const SettingsPage = lazy(() => import('@/pages/settings/SettingsPage'));
const JudgeInterfacePage = lazy(() => import('@/pages/judge/JudgeInterfacePage'));

// Componente di loading
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
);

function App() {
  return (
    <QueryProvider>
      <AuthProvider>
        <Router>
        <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Rotte pubbliche */}
          <Route path="/" element={<EnhancedHomePage />} />
          <Route path="/public/competitions" element={<PublicCompetitionsPage />} />
          <Route path="/public/competitions/:id/register" element={<CompetitionRegistrationPage />} />
          <Route path="/public/live/:competitionId" element={<OptimizedLivePage isPublicView={true} />} />
          
          {/* Autenticazione */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin" element={<Navigate to="/dashboard" replace />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <AppleStyleLayout>
                  <DashboardPage />
                </AppleStyleLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/athletes"
            element={
              <ProtectedRoute>
                <AppleStyleLayout>
                  <AthletesPage />
                </AppleStyleLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/competitions"
            element={
              <ProtectedRoute>
                <AppleStyleLayout>
                  <CompetitionsPage />
                </AppleStyleLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/competitions/create"
            element={
              <ProtectedRoute>
                <CreateCompetitionPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/competitions/:id/edit"
            element={
              <ProtectedRoute>
                <EditCompetitionPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/results"
            element={
              <ProtectedRoute>
                <AppleStyleLayout>
                  <ResultsPage />
                </AppleStyleLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/organizer"
            element={
              <ProtectedRoute>
                <AppleStyleLayout>
                  <OrganizerPage />
                </AppleStyleLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/registrations"
            element={
              <ProtectedRoute>
                <AppleStyleLayout>
                  <RegistrationsPage />
                </AppleStyleLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/judges"
            element={
              <ProtectedRoute>
                <AppleStyleLayout>
                  <JudgesPage />
                </AppleStyleLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/weigh-in"
            element={
              <ProtectedRoute>
                <AppleStyleLayout>
                  <WeighInPage />
                </AppleStyleLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/live"
            element={
              <ProtectedRoute>
                <AppleStyleLayout>
                  <OptimizedLivePage />
                </AppleStyleLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/records"
            element={
              <ProtectedRoute>
                <AppleStyleLayout>
                  <RecordsPage />
                </AppleStyleLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/backup"
            element={
              <ProtectedRoute>
                <AppleStyleLayout>
                  <BackupPage />
                </AppleStyleLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <AppleStyleLayout>
                  <NotificationsPage />
                </AppleStyleLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <AppleStyleLayout>
                  <SettingsPage />
                </AppleStyleLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/judge-interface"
            element={
              <ProtectedRoute>
                <JudgeInterfacePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/judge-interface/:judgeId/:competitionId"
            element={
              <ProtectedRoute>
                <JudgeInterfacePage />
              </ProtectedRoute>
            }
          />
        </Routes>
        </Suspense>
        </Router>
      </AuthProvider>
      <Toaster />
    </QueryProvider>
  );
}

export default App;