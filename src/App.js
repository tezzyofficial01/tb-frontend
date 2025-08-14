// src/App.js
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import OtpVerify from './pages/OtpVerify';
import Signup from './pages/Signup';
import Login from './pages/Login';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/DashboardPage';
import TBGamePage from './pages/TBGamePage';
import SpinGamePage from './pages/SpinGamePage';
import WhatsappSettingsPage from './pages/WhatsappSettingsPage';
import ManageUserPage from './pages/ManageUserPage';
import AdminRoundsSummary from './pages/AdminRoundsSummary';
import SpinWinnerAdmin from './pages/SpinWinnerAdmin';
import ReferralPage from './pages/ReferralPage';
import AdminRoute from './components/AdminRoute';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import BetHistoryPage from './pages/BetHistoryPage';
import LeaderboardPage from './pages/LeaderboardPage';
import DepositPage from './pages/DepositPage';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [role, setRole] = useState(localStorage.getItem('role'));

  useEffect(() => {
    const interval = setInterval(() => {
      const newToken = localStorage.getItem('token');
      const newRole = localStorage.getItem('role');
      if (newToken !== token) setToken(newToken);
      if (newRole !== role) setRole(newRole);
    }, 500);
    return () => clearInterval(interval);
  }, [token, role]);

  return (
    <Router>
      <Routes>
        {/* ---------- Public Auth/Utility Routes ---------- */}
        <Route path="/verify-otp" element={<OtpVerify />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* ---------- NEW: Root shows TB game in public "view-only" mode ---------- */}
        <Route path="/" element={<TBGamePage />} />

        {/* ---------- User Protected Routes ---------- */}
        <Route path="/dashboard" element={token ? <UserDashboard /> : <Navigate to="/login" replace />} />
        <Route path="/leaderboard" element={token ? <LeaderboardPage /> : <Navigate to="/login" replace />} />
        <Route path="/deposit" element={<DepositPage />} />

        <Route path="/bet-history" element={token ? <BetHistoryPage /> : <Navigate to="/login" replace />} />
        <Route path="/referral" element={token ? <ReferralPage /> : <Navigate to="/login" replace />} />

        {/* ---------- TB is public now (view-only if not logged in) ---------- */}
        <Route path="/game/tb" element={<TBGamePage />} />

        {/* Spin game as before (kept protected) */}
        <Route path="/game/spin" element={token ? <SpinGamePage /> : <Navigate to="/login" replace />} />

        {/* ---------- Admin Panel Protected Routes ---------- */}
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/whatsapp" element={<AdminRoute><WhatsappSettingsPage /></AdminRoute>} />
        <Route path="/admin/manage-user" element={<AdminRoute><ManageUserPage /></AdminRoute>} />
        <Route path="/admin/summary" element={<AdminRoute><AdminRoundsSummary /></AdminRoute>} />
        <Route path="/admin/spin-winner" element={<AdminRoute><SpinWinnerAdmin /></AdminRoute>} />
      </Routes>
    </Router>
  );
}

export default App;
