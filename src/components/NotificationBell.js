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
        console.log('🔔 NOTIFICATIONS:', res.data.notifications);
        setNotifications(res.data.notifications || []);
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
      }
    };
    fetchNotifications();
  }, [userId]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <div onClick={() => setShowDropdown(!showDropdown)} style={{ cursor: 'pointer' }}>
        <span role="img" aria-label="bell" style={{ fontSize: 24 }}>🔔</span>
      </div>

      {showDropdown && (
        <div style={{
          position: 'absolute',
          top: 30,
          right: 0,
          background: '#fff',
          border: '1px solid #ccc',
          borderRadius: 8,
          width: 300,
          padding: 10,
          zIndex: 1000
        }}>
          <strong>Notifications</strong>
          {notifications.length === 0 ? (
            <div style={{ marginTop: 10 }}>No notifications yet.</div>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, marginTop: 10 }}>
              {notifications.map((n, idx) => (
                <li key={idx} style={{ padding: '8px 0', borderBottom: '1px solid #eee' }}>
                  <div>{n.message}</div>
                  <small style={{ color: '#666' }}>
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
