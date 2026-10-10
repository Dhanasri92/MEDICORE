import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { AppShell } from '../components/common/AppShell.js';
import { LoadingSpinner } from '../components/common/EmptyState.js';

// Public Pages
import { LoginPage } from '../pages/public/LoginPage.js';
import { RegisterPage } from '../pages/public/RegisterPage.js';

// Admin Pages
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage.js';
import { DoctorsManagementPage } from '../pages/admin/DoctorsManagementPage.js';
import { PatientsManagementPage } from '../pages/admin/PatientsManagementPage.js';
import { DepartmentsPage } from '../pages/admin/DepartmentsPage.js';
import { AppointmentsManagementPage } from '../pages/admin/AppointmentsManagementPage.js';
import { BillingManagementPage } from '../pages/admin/BillingManagementPage.js';
import { LabReportsAdminPage } from '../pages/admin/LabReportsAdminPage.js';
import { NoticesPage } from '../pages/admin/NoticesPage.js';
import { AuditLogsPage } from '../pages/admin/AuditLogsPage.js';

// Doctor Pages
import { DoctorDashboardPage } from '../pages/doctor/DoctorDashboardPage.js';
import { DoctorAppointmentsPage } from '../pages/doctor/DoctorAppointmentsPage.js';
import { DoctorPatientsPage } from '../pages/doctor/DoctorPatientsPage.js';
import { DoctorPrescriptionsPage } from '../pages/doctor/DoctorPrescriptionsPage.js';

// Patient Pages
import { PatientDashboardPage } from '../pages/patient/PatientDashboardPage.js';
import { PatientDoctorsPage } from '../pages/patient/PatientDoctorsPage.js';
import { PatientAppointmentsPage } from '../pages/patient/PatientAppointmentsPage.js';
import { PatientRecordsPage } from '../pages/patient/PatientRecordsPage.js';
import { PatientPrescriptionsPage } from '../pages/patient/PatientPrescriptionsPage.js';
import { PatientLabReportsPage } from '../pages/patient/PatientLabReportsPage.js';
import { PatientBillingPage } from '../pages/patient/PatientBillingPage.js';
import { PatientProfilePage } from '../pages/patient/PatientProfilePage.js';

interface ProtectedRouteProps {
  children: React.ReactElement;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F6F8] flex items-center justify-center">
        <LoadingSpinner message="Verifying session credentials..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to their role default dashboard
    if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'DOCTOR') return <Navigate to="/doctor/dashboard" replace />;
    return <Navigate to="/patient/dashboard" replace />;
  }

  return children;
};

export const AppRoutes: React.FC = () => {
  const { user, isLoading } = useAuth();

  return (
    <Routes>
      {/* Root redirect */}
      <Route
        path="/"
        element={
          isLoading ? (
            <div className="min-h-screen bg-[#F5F6F8] flex items-center justify-center">
              <LoadingSpinner message="Starting MediCore..." />
            </div>
          ) : !user ? (
            <Navigate to="/login" replace />
          ) : user.role === 'ADMIN' ? (
            <Navigate to="/admin/dashboard" replace />
          ) : user.role === 'DOCTOR' ? (
            <Navigate to="/doctor/dashboard" replace />
          ) : (
            <Navigate to="/patient/dashboard" replace />
          )
        }
      />

      {/* Public Routes */}
      <Route
        path="/login"
        element={
          user ? (
            <Navigate
              to={
                user.role === 'ADMIN'
                  ? '/admin/dashboard'
                  : user.role === 'DOCTOR'
                  ? '/doctor/dashboard'
                  : '/patient/dashboard'
              }
              replace
            />
          ) : (
            <LoginPage />
          )
        }
      />
      <Route
        path="/register"
        element={
          user ? (
            <Navigate to="/patient/dashboard" replace />
          ) : (
            <RegisterPage />
          )
        }
      />

      {/* Admin Protected Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="doctors" element={<DoctorsManagementPage />} />
        <Route path="patients" element={<PatientsManagementPage />} />
        <Route path="departments" element={<DepartmentsPage />} />
        <Route path="appointments" element={<AppointmentsManagementPage />} />
        <Route path="billing" element={<BillingManagementPage />} />
        <Route path="lab-reports" element={<LabReportsAdminPage />} />
        <Route path="notices" element={<NoticesPage />} />
        <Route path="audit-logs" element={<AuditLogsPage />} />
      </Route>

      {/* Doctor Protected Routes */}
      <Route
        path="/doctor"
        element={
          <ProtectedRoute allowedRoles={['DOCTOR']}>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/doctor/dashboard" replace />} />
        <Route path="dashboard" element={<DoctorDashboardPage />} />
        <Route path="appointments" element={<DoctorAppointmentsPage />} />
        <Route path="patients" element={<DoctorPatientsPage />} />
        <Route path="prescriptions" element={<DoctorPrescriptionsPage />} />
        <Route path="lab-reports" element={<LabReportsAdminPage />} />
      </Route>

      {/* Patient Protected Routes */}
      <Route
        path="/patient"
        element={
          <ProtectedRoute allowedRoles={['PATIENT']}>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/patient/dashboard" replace />} />
        <Route path="dashboard" element={<PatientDashboardPage />} />
        <Route path="doctors" element={<PatientDoctorsPage />} />
        <Route path="appointments" element={<PatientAppointmentsPage />} />
        <Route path="medical-records" element={<PatientRecordsPage />} />
        <Route path="prescriptions" element={<PatientPrescriptionsPage />} />
        <Route path="lab-reports" element={<PatientLabReportsPage />} />
        <Route path="billing" element={<PatientBillingPage />} />
        <Route path="profile" element={<PatientProfilePage />} />
      </Route>

      {/* 404 Catch-All */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
