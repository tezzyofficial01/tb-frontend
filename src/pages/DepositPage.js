import React, { useState, useEffect } from 'react';
import api from '../services/api';

const DepositPage = () => {
  const [upiId, setUpiId] = useState('');
  const [amount, setAmount] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  // Logged-in user data
  const userData = JSON.parse(localStorage.getItem('user')) || {};
  const userId = userData.id || '';
  const email = userData.email || '';

  // Page load pe backend se UPI ID fetch
  useEffect(() => {
    api.get('/settings/upi')
      .then(res => setUpiId(res.data?.upiId || ''))
      .catch(() => setUpiId(''));
  }, []);

  // UPI link (QR nahi, sirf link)
  const amt = Number(amount || 0).toFixed(2);
  const tn  = `${(userId || '').slice(0,12)} ${(email || '').split('@')[0].slice(0,12)}`;
  const tr  = `TB${Date.now()}`; // unique ref

  const params = new URLSearchParams({
    pa: upiId,
    pn: 'Titali Bhavara',
    am: amt,
    cu: 'INR',
    tn,
    tr
  });

  const upiLink = `upi://pay?${params.toString()}`;

  // Confirm deposit
  const handleConfirm = async () => {
    try {
      await api.post('/deposits', { amount: Number(amount) });
      alert('Deposit request submitted!');
      setConfirmed(false);
      setAmount('');
    } catch (err) {
      alert('Error submitting deposit request');
    }
  };

  return (
    <div style={{ textAlign: 'center', padding: 16 }}>
      <h2>Deposit</h2>
      <p><b>UPI ID:</b> {upiId || '—'}</p>

      <input
        type="number"
        value={amount}
        onChange={e => setAmount(e.target.value)}
        placeholder="Enter amount"
        style={{ padding: '10px', fontSize: 16, marginBottom: 10 }}
      />
      <br />

      <button
        onClick={() => setConfirmed(true)}
        disabled={!amount || !upiId}
        style={{ padding: '10px 20px', fontSize: 16, margin: 10 }}
      >
        Generate Payment Link
      </button>

      {confirmed && (
        <div style={{ marginTop: 20 }}>
          <a href={upiLink}>
            <button style={{ padding: '10px 20px', fontSize: 16 }}>
              Pay via UPI App
            </button>
          </a>
          <br /><br />
          <button
            onClick={handleConfirm}
            style={{ background: 'green', color: 'white', padding: '10px 20px', fontSize: 16 }}
          >
            I Have Paid
          </button>
        </div>
      )}
    </div>
  );
};

export default DepositPage;
