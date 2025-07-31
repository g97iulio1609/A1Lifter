import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { QueryProvider } from '@/providers/QueryProvider';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { MainLayout } from '@/components/layout/MainLayout';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { AthletesPage } from '@/pages/athletes/AthletesPage';
import { CompetitionsPage } from '@/pages/competitions/CompetitionsPage';
import { ResultsPage } from '@/pages/results/ResultsPage';
import { OrganizerPage } from '@/pages/organizer/OrganizerPage';
import { RegistrationsPage } from '@/pages/registrations/RegistrationsPage';
import { PublicCompetitionsPage } from '@/pages/public/PublicCompetitionsPage';
import { CompetitionRegistrationPage } from '@/pages/public/CompetitionRegistrationPage';
import { LoginPage } from '@/pages/LoginPage';
import JudgesPage from '@/pages/judges/JudgesPage';
import WeighInPage from '@/pages/weigh-in/WeighInPage';
import LivePage from '@/pages/live/LivePage';
import RecordsPage from '@/pages/records/RecordsPage';
import BackupPage from '@/pages/backup/BackupPage';
import NotificationsPage from '@/pages/notifications/NotificationsPage';
import SettingsPage from '@/pages/settings/SettingsPage';
import JudgeInterfacePage from '@/pages/judge/JudgeInterfacePage';

function App() {
  return (
    <QueryProvider>
      <AuthProvider>
        <Router>
        <Routes>
          {/* Rotte pubbliche */}
          <Route path="/public/competitions" element={<PublicCompetitionsPage />} />
          <Route path="/register/:competitionId" element={<CompetitionRegistrationPage />} />
          
          {/* Autenticazione */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin" element={<Navigate to="/dashboard" replace />} />
          <Route path="/" element={<Navigate to="/public/competitions" replace />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <DashboardPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/athletes"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <AthletesPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/competitions"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <CompetitionsPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/results"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <ResultsPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/organizer"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <OrganizerPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/registrations"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <RegistrationsPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/judges"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <JudgesPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/weigh-in"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <WeighInPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/live"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <LivePage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/live/:competitionId"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <LivePage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/records"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <RecordsPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/backup"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <BackupPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <NotificationsPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <SettingsPage />
                </MainLayout>
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
        </Router>
      </AuthProvider>
      <Toaster />
    </QueryProvider>
  );
}

export default App;