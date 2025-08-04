import React, { useEffect, useState } from 'react';
import api from '../services/api';

const NotificationBell = ({ userId }) => {
  const [show, setShow] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (show && userId) {
      api.get(`/notifications/${userId}`)
        .then(res => setNotifications(res.data.notifications || []))
        .catch(() => setNotifications([]));
    }
  }, [show, userId]);

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setShow(!show)} style={{
        fontSize: '20px',
        background: 'none',
        border: 'none',
        color: '#fff',
        cursor: 'pointer'
      }}>
        🔔
      </button>

      {show && (
        <div style={{
          position: 'absolute',
          top: '30px',
          right: 0,
          background: '#fff',
          color: '#000',
          padding: '10px',
          borderRadius: '8px',
          width: '250px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          zIndex: 1000
        }}>
          <h4 style={{ marginTop: 0 }}>Notifications</h4>
          {notifications.length === 0 ? (
            <p>No notifications yet.</p>
          ) : (
            notifications.map((n, i) => (
              <div key={i} style={{ borderBottom: '1px solid #ccc', padding: '6px 0' }}>
                <strong>{n.type.toUpperCase()}</strong> of ₹{n.amount}<br />
                <small>{new Date(n.createdAt).toLocaleString()}</small>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
