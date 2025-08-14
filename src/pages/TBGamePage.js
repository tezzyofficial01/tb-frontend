// src/pages/TBGamePage.js
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import api from '../services/api';
import Loader from '../components/Loader';
import '../styles/game.css';
import { SFX } from '../utils/sounds';

const EN_TO_HI = {
  umbrella: 'छतरी', football: 'फुटबॉल', sun: 'सूरज', diya: 'दीया', cow: 'गाय', bucket: 'बाल्टी',
  kite: 'पतंग', spinningtop: 'भंवरा', rose: 'गुलाब', butterfly: 'तितली', pigeon: 'कबूतर', rabbit: 'खरगोश'
};

const socket = io('/', {
  transports: ['websocket'],
  reconnectionAttempts: 5,
  timeout: 20000,
});

const IMAGE_LIST = [
  { name: 'umbrella', src: '/images/umbrella.png' },
  { name: 'football', src: '/images/football.png' },
  { name: 'sun', src: '/images/sun.png' },
  { name: 'diya', src: '/images/diya.png' },
  { name: 'cow', src: '/images/cow.png' },
  { name: 'bucket', src: '/images/bucket.png' },
  { name: 'kite', src: '/images/kite.png' },
  { name: 'spinningtop', src: '/images/spinningtop.png' },
  { name: 'rose', src: '/images/rose.png' },
  { name: 'butterfly', src: '/images/butterfly.png' },
  { name: 'pigeon', src: '/images/pigeon.png' },
  { name: 'rabbit', src: '/images/rabbit.png' }
];

const COINS = [10, 20, 30, 40, 50, 100];

export default function TBGamePage() {
  const navigate = useNavigate();
  const isAuthed = !!localStorage.getItem('token');

  const [selectedCoin, setSelectedCoin] = useState(null);
  const [highlighted, setHighlighted] = useState([]);
  const [lastWins, setLastWins] = useState([]);
  const [currentRound, setCurrentRound] = useState(1);
  const [timer, setTimer] = useState(40);
  const [bets, setBets] = useState({});
  const [winnerChoice, setWinnerChoice] = useState(null);
  const [showWinner, setShowWinner] = useState(false);
  const [balance, setBalance] = useState(0);
  const [userBets, setUserBets] = useState({});
  const winnerTimeoutRef = useRef(null);
  const [loadingGame, setLoadingGame] = useState(true);
  const [loadingWins, setLoadingWins] = useState(true);
  const [winPopup, setWinPopup] = useState({ show: false, image: '', amount: 0 });

  const prevSecRef = useRef(null);
  const winnerSoundRoundRef = useRef(null);

  // 🔊 Robust audio unlock (guest + authed)
  const [needsUnlock, setNeedsUnlock] = useState(false);
  useEffect(() => {
    // attach retry-able unlock hooks (pointer/touch/keydown, visibility)
    SFX.ensureUnlockHooks?.();

    // initial banner state
    const updateNeeds = () => {
      if (SFX.isSfxEnabled?.()) {
        setNeedsUnlock(!SFX.isUnlocked?.());
      } else {
        setNeedsUnlock(false);
      }
    };
    updateNeeds();

    // also attempt immediate unlock on first gesture
    const tryUnlock = async () => {
      const ok = await SFX.unlockAll?.();
      if (ok) setNeedsUnlock(false);
    };
    window.addEventListener('pointerdown', tryUnlock, { once: true });
    window.addEventListener('touchstart', tryUnlock, { once: true });
    window.addEventListener('keydown', tryUnlock, { once: true });

    const onVis = async () => {
      if (document.visibilityState === 'visible' && SFX.isSfxEnabled?.()) {
        const ok = await SFX.unlockAll?.();
        if (ok) setNeedsUnlock(false);
      }
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  const guard = (action) => {
    if (!isAuthed) {
      navigate('/signup');
      return;
    }
    if (typeof action === 'function') action();
  };

  useEffect(() => {
    let prevRound = -1;

    const fetchLiveState = async () => {
      try {
        let res;
        if (isAuthed) {
          const token = localStorage.getItem('token');
          res = await api.get('/bets/live-state', {
            headers: { Authorization: `Bearer ${token}` }
          });
        } else {
          res = await api.get('/bets/public-state'); // ✅ guest = public
        }

        setCurrentRound(res.data.round);
        setTimer(res.data.timer);
        setBets(res.data.totals || {});
        setWinnerChoice(res.data.winnerChoice || null);
        setBalance(isAuthed && typeof res.data.balance === "number" ? res.data.balance : 0);
        setUserBets(isAuthed ? (res.data.userBets || {}) : {});
        setLoadingGame(false);

        if (prevRound !== -1 && prevRound !== res.data.round) {
          setUserBets({});
          setBets({});
          setWinnerChoice(null);
          setShowWinner(false);
          setHighlighted([]);
          setSelectedCoin(null);
          prevSecRef.current = null;
          winnerSoundRoundRef.current = null;
          SFX.stopTick?.();
        }
        prevRound = res.data.round;
      } catch {
        try {
          const res = await api.get('/bets/public-state'); // ✅ fallback to public
          setCurrentRound(res.data.round);
          setTimer(res.data.timer);
          setBets(res.data.totals || {});
          setWinnerChoice(res.data.winnerChoice || null);
        } catch {}
        setUserBets({});
        setBalance(0);
        setLoadingGame(false);
      }
    };

    fetchLiveState();
    const interval = setInterval(fetchLiveState, 1000);
    return () => {
      clearInterval(interval);
      SFX.stopTick?.();
    };
  }, [isAuthed]);

  useEffect(() => {
    const fetchLastWins = async () => {
      try {
        const res = await api.get('/bets/last-wins');
        setLastWins(Array.isArray(res.data.wins) ? res.data.wins : []);
      } catch {
        setLastWins([]);
      }
      setLoadingWins(false);
    };
    fetchLastWins();
    socket.on('payouts-distributed', fetchLastWins);
    return () => socket.off('payouts-distributed', fetchLastWins);
  }, []);

  useEffect(() => {
    if (!isAuthed) return;
    if (timer === 10 && currentRound) {
      const token = localStorage.getItem('token');
      api.post('/bets/lock-winner', { round: currentRound }, {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => {});
    }
  }, [timer, currentRound, isAuthed]);

  useEffect(() => {
    if (!isAuthed) return;
    if (timer === 5 && currentRound) {
      const token = localStorage.getItem('token');
      api.post('/bets/announce-winner', { round: currentRound }, {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => {});
      if (winnerChoice && userBets[winnerChoice]) {
        const payoutAmount = userBets[winnerChoice] * 10;
        setWinPopup({ show: true, image: winnerChoice, amount: payoutAmount });
        setTimeout(() => setWinPopup({ show: false, image: '', amount: 0 }), 5000);
      }
    }
  }, [timer, currentRound, winnerChoice, userBets, isAuthed]);

  useEffect(() => {
    const handler = ({ choice }) => setWinnerChoice(choice || null);
    socket.on('winner-announced', handler);
    return () => socket.off('winner-announced', handler);
  }, []);

  useEffect(() => {
    if (timer === 5 && winnerChoice) {
      setShowWinner(true);
      if (winnerTimeoutRef.current) clearTimeout(winnerTimeoutRef.current);
      winnerTimeoutRef.current = setTimeout(() => setShowWinner(false), 5000);
    }
  }, [timer, winnerChoice]);

  // strict tick window (15..6)
  useEffect(() => {
    if (!SFX.isSfxEnabled?.() || typeof timer !== 'number') return;
    if (timer <= 5 || timer > 15) {
      SFX.stopTick?.();
      prevSecRef.current = timer;
      return;
    }
    if (timer <= 15 && timer >= 6 && prevSecRef.current !== timer) {
      SFX.playTick?.();
      prevSecRef.current = timer;
    }
  }, [timer]);

  // winner sound once per round @5s
  useEffect(() => {
    if (!SFX.isSfxEnabled?.()) return;
    if (timer === 5 && currentRound && winnerSoundRoundRef.current !== currentRound) {
      SFX.stopTick?.();
      SFX.playWinner?.();
      winnerSoundRoundRef.current = currentRound;
    }
  }, [timer, currentRound]);

  const handleCoinSelect = (val) => guard(() => {
    setSelectedCoin(val);
    if (SFX.isSfxEnabled?.()) SFX.playCoinPickup?.();
  });

  const handleImageBet = async (name) => {
    if (!isAuthed) return navigate('/signup');
    if (!selectedCoin) return alert("Select a coin first!");
    if (timer <= 15) return alert('Betting closed');
    if (balance < selectedCoin) return alert('Insufficient balance');
    if (SFX.isSfxEnabled?.()) SFX.playCoinDrop?.();
    setUserBets(p => ({ ...p, [name]: (p[name] || 0) + selectedCoin }));
    setBalance(p => p - selectedCoin);
    setHighlighted(h => h.includes(name) ? h : [...h, name]);
    try {
      const token = localStorage.getItem('token');
      await api.post('/bets/place-bet', { choice: name, amount: selectedCoin, round: currentRound }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (e) {
      alert(e.response?.data?.message || 'Bet failed');
      setUserBets(p => ({ ...p, [name]: (p[name] || 0) - selectedCoin }));
      setBalance(p => p + selectedCoin);
    }
  };

  const userTotalBet = Object.values(userBets || {}).reduce((s, v) => s + v, 0);

  if (loadingGame || loadingWins) return <Loader />;

  return (
    <div className="tb-game-root">


      {/* Guest banner */}
      {!isAuthed && (
        <div style={{
          background: '#2d2d2d',
          color: '#ffd54f',
          padding: '10px 14px',
          borderRadius: 10,
          margin: '10px auto 6px',
          width: 'fit-content',
          fontWeight: 700
        }}>
          Login/Signup to play.
        </div>
      )}

      {/* Header */}
      <div className="tb-header-row">
        <button
          className="tb-history-btn"
          style={{ background: 'none', border: 'none', fontSize: 30, cursor: 'pointer', marginRight: 6, color: '#ffe082', lineHeight: 1 }}
          onClick={() => guard(() => navigate('/bet-history'))}
          aria-label="Show Bet History"
        >
          📜
        </button>
        <div className="tb-balance-row" onClick={() => !isAuthed && navigate('/signup')} style={{ cursor: !isAuthed ? 'pointer' : 'default' }}>
          <img src="/images/coin.png" alt="coin" className="tb-coin-icon" />
          <span>₹{isAuthed ? balance : 0}</span>
        </div>
        <button className="tb-last-win-btn" onClick={() => document.getElementById('tb-lastwin-modal').showModal()}>
          <img src="/images/trophy.png" alt="last win" />
        </button>
      </div>

      {/* Round + Timer */}
      <div className="tb-round-timer-row">
        <div className="tb-round">Round: #{currentRound}</div>
        <div className="tb-timer">⏱ {timer}s</div>
      </div>

      {/* Grid */}
      <div className="tb-image-flex">
        {IMAGE_LIST.map((item) => (
          <div
            key={item.name}
            className={`tb-card ${highlighted.includes(item.name) ? 'selected' : ''} ${winnerChoice === item.name && showWinner ? 'winner' : ''}`}
            onClick={() => (isAuthed ? handleImageBet(item.name) : navigate('/signup'))}
            style={{ cursor: (!isAuthed || timer <= 15) ? 'not-allowed' : 'pointer' }}
          >
            <img src={item.src} alt={EN_TO_HI[item.name] || item.name} />
            {!!userBets[item.name] && (
              <div className="tb-card-coin">
                <img src="/images/coin.png" alt="coin" />
                <span>{userBets[item.name]}</span>
              </div>
            )}
            <div className="tb-card-label">{EN_TO_HI[item.name]}</div>
          </div>
        ))}
      </div>

      {/* Winner area */}
      <div className="tb-winner-popup-block">
        {!winnerChoice && timer <= 5 && <div className="tb-winner-pending">Status: Pending...</div>}
        {showWinner && winnerChoice && (
          <div className="tb-winner-popup">
            <img src={`/images/${winnerChoice}.png`} alt={winnerChoice} />
            <div className="tb-winner-label">🎉 {(EN_TO_HI[winnerChoice] || winnerChoice).toUpperCase()} 🎉</div>
          </div>
        )}
      </div>

      {/* Win popup (only authed users) */}
      {isAuthed && winPopup.show && (
        <div className="tb-user-win-popup">
          <div>
            <img
              src={`/images/${winPopup.image}.png`}
              alt="winner"
              style={{ width: 42, height: 42, borderRadius: 9, border: '2px solid #ffd700' }}
            />
          </div>
          <div>You won <span>₹{winPopup.amount}</span></div>
          <div>on <span>{EN_TO_HI[winPopup.image] || winPopup.image}</span>!</div>
        </div>
      )}

      {/* Totals */}
      <div className="tb-total-bet-row">
        <span>Your Bet This Round: </span>
        <b>₹{isAuthed ? userTotalBet : 0}</b>
      </div>

      {/* Coin select */}
      <div className="tb-coin-row">
        {COINS.map(val => (
          <button
            key={val}
            className={`tb-coin-btn ${selectedCoin === val ? 'selected' : ''}`}
            onClick={() => handleCoinSelect(val)}
            disabled={!isAuthed || timer <= 15}
          >
            <img src="/images/coin.png" alt="coin" />
            <span>{val}</span>
          </button>
        ))}
      </div>

      {selectedCoin && (
        <button
          className="tb-coin-cancel-btn"
          onClick={() => guard(() => setSelectedCoin(null))}
        >
          Cancel Coin
        </button>
      )}

      {/* Last wins modal */}
      <dialog id="tb-lastwin-modal" className="tb-lastwin-modal">
        <div className="tb-lastwin-modal-content">
          <h2>🏆 Last 10 Wins</h2>
          <ul>
            {lastWins.map((w, i) => {
              const name = (EN_TO_HI[w.choice] || w.choice || "-").toUpperCase();
              return <li key={i}>Round {w.round || "-"}: {name}</li>;
            })}
          </ul>
          <button onClick={() => document.getElementById('tb-lastwin-modal').close()}>
            Close
          </button>
        </div>
      </dialog>
    </div>
  );
}
