import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { PendingPropertiesPage } from './pages/PendingPropertiesPage';
import { PropertiesPage } from './pages/PropertiesPage';
import { UsersPage } from './pages/UsersPage';
import { AgentsPage } from './pages/AgentsPage';
import { BuildersPage } from './pages/BuildersPage';
import { LeadsPage } from './pages/LeadsPage';
import { ReportsPage } from './pages/ReportsPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="pending" element={<PendingPropertiesPage />} />
          <Route path="properties" element={<PropertiesPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="agents" element={<AgentsPage />} />
          <Route path="builders" element={<BuildersPage />} />
          <Route path="leads" element={<LeadsPage />} />
          <Route path="reports" element={<ReportsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
