import React, { useEffect, useState, useRef } from 'react';
import api from '../services/api';

const NotificationBell = ({ userId }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!userId) return;

    const fetchNotifications = async () => {
      try {
        const res = await api.get(`/notifications/${userId}`);
        
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
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} style={{ position: 'relative', zIndex: 9999 }}>
      <div onClick={() => setShowDropdown(!showDropdown)} style={{ cursor: 'pointer' }}>
        <span role="img" aria-label="bell" style={{ fontSize: 26 }}>🔔</span>
      </div>

      {showDropdown && (
        <div style={{
          position: 'absolute',
          top: 35,
          right: 0,
          backgroundColor: '#fff',
          border: '1px solid #ccc',
          borderRadius: 8,
          width: 280,
          padding: 10,
          boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
          zIndex: 9999
        }}>
          <strong>Notifications</strong>
          <div style={{ marginTop: 10, maxHeight: 200, overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div>No notifications yet.</div>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0 }}>
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
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
