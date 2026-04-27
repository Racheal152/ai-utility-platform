import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import BillTracking from './pages/BillTracking';
import Household from './pages/Household';
import Settings from './pages/Settings';
import VerifyOTP from './pages/VerifyOTP';
import ForgotPassword from './pages/ForgotPassword';
import AdminDashboard from './pages/AdminDashboard';
import Reports from './pages/Reports';
import Landing from './pages/Landing';
import AboutUs from './pages/AboutUs';
import Terms from './pages/Terms';
import UserGuide from './pages/UserGuide';
import Contact from './pages/Contact';
import Careers from './pages/Careers';

// Protects routes — redirects to login if no token
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
};

// Protects admin routes
const AdminRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const user = (() => { try { return JSON.parse(localStorage.getItem('user')) || {}; } catch { return {}; } })();
  return token && user.role === 'admin' ? children : <Navigate to="/dashboard" replace />;
};

function App() {
  return (
    <Router>
      <div className="min-h-screen font-sans text-slate-900">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/guide" element={<UserGuide />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/careers" element={<Careers />} />

          <Route path="/dashboard" element={
            <PrivateRoute><Dashboard /></PrivateRoute>
          } />
          <Route path="/bills" element={
            <PrivateRoute><BillTracking /></PrivateRoute>
          } />
          <Route path="/household" element={
            <PrivateRoute><Household /></PrivateRoute>
          } />
          <Route path="/settings" element={
            <PrivateRoute><Settings /></PrivateRoute>
          } />
          <Route path="/admin" element={
            <AdminRoute><AdminDashboard /></AdminRoute>
          } />
          <Route path="/reports" element={
            <PrivateRoute><Reports /></PrivateRoute>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;