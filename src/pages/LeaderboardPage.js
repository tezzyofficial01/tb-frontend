import React, { useEffect, useState } from 'react';
import api from '../services/api';
import '../styles/leaderboard.css';

export default function LeaderboardPage() {
  const [data, setData] = useState([]);

  useEffect(() => {
    api.get('/leaderboard/weekly').then(res => {
      setData(res.data.leaderboard || []);
    });
  }, []);

  return (
    <div className="leaderboard-page">
      <h2>🏆 Full Weekly Leaderboard</h2>
      <div className="leaderboard-table">
        <div className="leaderboard-header">
          <span>Rank</span>
          <span>Email</span>
          <span>Total Bet</span>
          <span>Total Win</span>
        </div>
        <div className="leaderboard-body">
          {data.map((user, i) => (
            <div key={i} className={`leaderboard-row rank-${i + 1}`}>
              <span>#{i + 1}</span>
              <span>{user.email}</span>
              <span>₹{user.totalBet}</span>
              <span>₹{user.totalWin}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
