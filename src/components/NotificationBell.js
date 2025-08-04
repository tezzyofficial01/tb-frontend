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
        console.log('🔔 NOTIFICATIONS:', res.data.notifications);
        setNotifications(res.data.notifications || []);
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
      }
    };

    fetchNotifications();
  }, [userId]);

  // ✅ Close dropdown when clicked outside
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
    <div ref={dropdownRef} style={{ position: 'relative', zIndex: 10000 }}>
      <div onClick={() => setShowDropdown(!showDropdown)} style={{ cursor: 'pointer' }}>
        <span role="img" aria-label="bell" style={{ fontSize: 26 }}>🔔</span>
      </div>

      {showDropdown && (
        <div style={{
          position: 'absolute',
          top: 35,
          right: 0,
          background: '#fff',
          border: '1px solid #ccc',
          borderRadius: 8,
          width: 320,
          padding: 12,
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <strong style={{ fontSize: 16 }}>Notifications</strong>
          {notifications.length === 0 ? (
            <div style={{ marginTop: 10, fontSize: 14 }}>No notifications yet.</div>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, marginTop: 10, maxHeight: 300, overflowY: 'auto' }}>
              {notifications.map((n, idx) => (
                <li key={idx} style={{ padding: '8px 0', borderBottom: '1px solid #eee' }}>
                  <div style={{ fontSize: 14 }}>{n.message}</div>
                  <small style={{ color: '#666' }}>
                    {new Date(n.createdAt).toLocaleString('en-IN', {
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    })}
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
