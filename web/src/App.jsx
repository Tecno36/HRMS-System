import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';


import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import ForgotPassword from './pages/Auth/ForgotPassword';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Menu/Dashboard';
import HRManagement from './pages/Menu/HRManagement';
import Employees from './pages/Menu/Employees';
import Attendance from './pages/Menu/Attendance';
import Leaves from './pages/Menu/Leaves';
import Payslips from './pages/Menu/Payslips';
import Recruitment from './pages/Menu/Recruitment';
import Performance from './pages/Menu/Performance';
import Reports from './pages/Menu/Reports';
import Settings from './pages/Menu/Settings';
import Profile from './pages/Navbar/Profile';

const ProtectedRoute = () => {
  const isAuthenticated = !!localStorage.getItem('token');
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

const PublicRoute = () => {
  const isAuthenticated = !!localStorage.getItem('token');
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Outlet />;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="hrs" element={<HRManagement />} />
            <Route path="employees" element={<Employees />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="leaves" element={<Leaves />} />
            <Route path="payslips" element={<Payslips />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
            <Route path="performance" element={<Performance />} />
            <Route path="recruitment" element={<Recruitment />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Route>
        
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}