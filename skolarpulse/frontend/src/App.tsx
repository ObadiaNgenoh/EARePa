import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import Header from './components/Header';
import AuthForms from './components/AuthForms';
import Chat from './components/Chat';
import PapersPage from './components/PapersPage';
import HistoryPage from './components/HistoryPage';
import { useAuth } from './hooks/useAuth';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center">Loading…</div>;
  return user ? <>{children}</> : <Navigate to="/login" />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center">Loading…</div>;
  return user ? <Navigate to="/" /> : <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <PublicRoute>
            <Route path="/login" element={<AuthForms />} />
          </PublicRoute>
          <ProtectedRoute>
            <Header />
            <main className="max-w-4xl mx-auto px-4 py-8">
              <Routes>
                <Route path="/" element={<Chat />} />
                <Route path="/papers" element={<PapersPage />} />
                <Route path="/history" element={<HistoryPage />} />
              </Routes>
            </main>
          </ProtectedRoute>
        </div>
      </Router>
    </AuthProvider>
  );
}