import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import '../styles/leaderboard.css'; // Create this next

export default function LeaderboardMini() {
  const [topFive, setTopFive] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/leaderboard/weekly').then(res => {
      const all = res.data.leaderboard || [];
      setTopFive(all.slice(0, 5));
    });
  }, []);

  return (
    <div className="leaderboard-mini">
      <h4>🏆 Weekly Leaderboard</h4>
      <ul>
        {topFive.map((user, i) => (
          <li key={i} className={`rank rank-${i + 1}`}>
            <span>#{i + 1}</span>
            <span>{user.email}</span>
            <span>₹{user.totalWin}</span>
          </li>
        ))}
      </ul>
      <button onClick={() => navigate('/leaderboard')} className="view-full-btn">
        View Full Leaderboard →
      </button>
    </div>
  );
}
