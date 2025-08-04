// components/NotificationBell.js
import React, { useEffect, useState, useRef } from 'react';
import api from '../services/api';

const NotificationBell = ({ userId }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!userId) return;
      try {
        const res = await api.get(`/notifications/${userId}`);
        console.log('🔔 Notifications:', res.data.notifications);
        setNotifications(res.data.notifications || []);
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
      }
    };
    fetchNotifications();
  }, [userId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div ref={dropdownRef} style={{ position: 'relative', zIndex: 1000 }}>
      <div onClick={() => setShowDropdown(!showDropdown)} style={{ cursor: 'pointer' }}>
        <span style={{ fontSize: 26 }} role="img" aria-label="bell">🔔</span>
      </div>

      {showDropdown && (
        <div style={{
          position: 'absolute',
          top: 30,
          right: 0,
          backgroundColor: '#fff',
          border: '1px solid #ccc',
          borderRadius: 8,
          width: 300,
          padding: 10,
          boxShadow: '0px 4px 8px rgba(0,0,0,0.2)'
        }}>
          <strong>Notifications</strong>
          {notifications.length === 0 ? (
            <div style={{ marginTop: 10 }}>No notifications yet.</div>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, marginTop: 10 }}>
              {notifications.map((n, idx) => (
                <li key={idx} style={{ padding: '8px 0', borderBottom: '1px solid #eee' }}>
                  <div>{n.message}</div>
                  <small style={{ color: '#888' }}>
                    {new Date(n.createdAt).toLocaleString()}
                  </small>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
