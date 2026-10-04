import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Layout from './components/layout/Layout';
import PinGate from './components/PinGate';

// Code-split pages by route
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const StudentsList = lazy(() => import('./pages/StudentsList'));
const StudentDetail = lazy(() => import('./pages/StudentDetail'));
const DataQuality = lazy(() => import('./pages/DataQuality'));
const PrintReport = lazy(() => import('./pages/PrintReport'));
const NotFound = lazy(() => import('./pages/NotFound'));

const RouteLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh] p-8">
    <div className="w-8 h-8 rounded-full border-3 border-indigo-600/30 border-t-indigo-600 animate-spin" />
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 60 * 1000,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <PinGate>
          <AuthProvider>
            <BrowserRouter>
            <Suspense fallback={<RouteLoader />}>
              <Routes>
                {/* Public Route: Login */}
                <Route path="/login" element={<Login />} />

                {/* Dedicated Print Route (No Sidebar/Header) */}
                <Route
                  path="/students/:rollNo/print"
                  element={
                    <ProtectedRoute>
                      <PrintReport />
                    </ProtectedRoute>
                  }
                />

                {/* Protected Routes inside Institutional Workspace Layout */}
                <Route
                  element={
                    <ProtectedRoute>
                      <Layout />
                    </ProtectedRoute>
                  }
                >
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/students" element={<StudentsList />} />
                  <Route path="/students/:rollNo" element={<StudentDetail />} />
                  <Route path="/data-quality" element={<DataQuality />} />
                </Route>

                {/* 404 Route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </AuthProvider>
      </PinGate>
    </ThemeProvider>
  </QueryClientProvider>
  );
}

export default App;
