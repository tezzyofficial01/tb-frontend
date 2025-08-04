// pages/UserDashboard.js
import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import Loader from '../components/Loader';
import SideMenu from '../components/SideMenu';
import NotificationBell from '../components/NotificationBell';
import '../styles/userdashboard.css';

const UserDashboard = () => {
  // 👇 Fix: _id instead of id
  const [user, setUser] = useState({ _id: '', email: '', balance: 0 });
  const [numbers, setNumbers] = useState({ depositWhatsapp: '', withdrawWhatsapp: '' });
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const resUser = await api.get('/users/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
         console.log("USER DATA:", resUser.data); // 👈👈👈 Add this
        setUser(resUser.data);

        const resSettings = await api.get('/settings');
        setNumbers(resSettings.data || {});
      } catch (err) {
        console.error('Failed to fetch user or settings:', err);
      }
      setLoading(false);
    };
    fetchAll();
  }, []);

  if (loading) return <Loader />;

  return (
    <div className="dashboard-mobile-bg">
      <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} user={user} numbers={numbers} />

      {/* 🔔 Bell Icon */}
      {user._id && (
        <div style={{ position: 'fixed', top: 10, right: 10, zIndex: 9999 }}>
          <NotificationBell userId={user._id} />
        </div>
      )}

      <div className="dashboard-mobile-main">
        {/* Top Header */}
        <div className="dashboard-header-row">
          <button
            className="menu-icon-btn"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <span className="menu-icon-bar"></span>
            <span className="menu-icon-bar"></span>
            <span className="menu-icon-bar"></span>
          </button>
          <div className="dashboard-logo">{/* Optional Logo */}</div>
        </div>

        {/* Welcome Message */}
        <div className="dashboard-welcome">
          <div className="welcome-title">Welcome,</div>
          <div className="user-email">{user.email}</div>
        </div>

        {/* Balance */}
        <div className="dashboard-balance">
          Balance: <span className="balance-amount">₹{user.balance || 0}</span>
        </div>

        {/* Game Buttons */}
        <div className="dashboard-play-buttons">
          <button onClick={() => navigate('/game/tb')}>Play Titali Bhavara</button>
          <button onClick={() => navigate('/game/spin')}>Play Spin to Win</button>
        </div>

        {/* Bet History */}
        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={() => navigate('/bet-history')}
            style={{
              background: '#4629e6',
              color: '#fff',
              padding: '10px 20px',
              border: 'none',
              borderRadius: 7,
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: 16,
              boxShadow: '0 2px 10px #0002'
            }}
          >
            📜 My Bet History
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
