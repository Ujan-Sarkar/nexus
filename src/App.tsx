import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './store/AuthContext';
import LoginPage from './pages/auth/LoginPage';
import DashboardLayout from './layouts/DashboardLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import DoctorManagement from './pages/admin/DoctorManagement';
import RevenueManagement from './pages/admin/RevenueManagement';
import LabTestManagement from './pages/admin/LabTestManagement';
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import PatientArchive from './pages/doctor/PatientArchive';
import DoctorProfile from './pages/doctor/DoctorProfile';
import LabDashboard from './pages/lab/LabDashboard';
import RevenueDashboard from './pages/revenue/RevenueDashboard';

function ProtectedRoute({ children, role }: { children: React.ReactNode, role: string }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-900">Loading...</div>;
  if (!user) return <Navigate to="/" />;
  if (user.role !== role) return <Navigate to={`/${user.role}`} />;

  return <DashboardLayout role={role}>{children}</DashboardLayout>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={
            <ProtectedRoute role="admin">
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/patients" element={
            <ProtectedRoute role="admin">
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/doctors" element={
            <ProtectedRoute role="admin">
              <DoctorManagement />
            </ProtectedRoute>
          } />
          <Route path="/admin/revenue" element={
            <ProtectedRoute role="admin">
              <RevenueManagement />
            </ProtectedRoute>
          } />
          <Route path="/admin/lab-tests" element={
            <ProtectedRoute role="admin">
              <LabTestManagement />
            </ProtectedRoute>
          } />

          {/* Doctor Routes */}
          <Route path="/doctor" element={
            <ProtectedRoute role="doctor">
              <DoctorDashboard />
            </ProtectedRoute>
          } />
          <Route path="/doctor/archive" element={
            <ProtectedRoute role="doctor">
              <PatientArchive />
            </ProtectedRoute>
          } />
          <Route path="/doctor/profile" element={
            <ProtectedRoute role="doctor">
              <DoctorProfile />
            </ProtectedRoute>
          } />

          {/* Lab Routes */}
          <Route path="/lab" element={
            <ProtectedRoute role="lab">
              <LabDashboard />
            </ProtectedRoute>
          } />
          <Route path="/lab/archive" element={
            <ProtectedRoute role="lab">
              <LabDashboard />
            </ProtectedRoute>
          } />

          {/* Revenue Routes */}
          <Route path="/revenue" element={
            <ProtectedRoute role="revenue">
              <RevenueDashboard />
            </ProtectedRoute>
          } />
          <Route path="/revenue/payments" element={
            <ProtectedRoute role="revenue">
              <RevenueDashboard />
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
