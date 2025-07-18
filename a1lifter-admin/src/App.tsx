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

function App() {
  return (
    <QueryProvider>
      <AuthProvider>
        <Router>
        <Routes>
          <Route path="/login" element={<div>Login page placeholder</div>} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
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
            path="/settings"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <div>Settings page placeholder</div>
                </MainLayout>
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