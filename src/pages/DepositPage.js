import React, { useState, useEffect } from 'react';
import api from '../services/api';

const DepositPage = () => {
  const [upiId, setUpiId] = useState('');
  const [amount, setAmount] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  // Logged-in user ka data
  const userData = JSON.parse(localStorage.getItem('user')) || {};
  const userId = userData.id || '';
  const email = userData.email || '';

  // Page load pe backend se UPI ID fetch
  useEffect(() => {
    api.get('/settings/upi')
      .then(res => setUpiId(res.data.upiId))
      .catch(() => setUpiId(""));
  }, []);

  // UPI link + QR
  const upiLink = `upi://pay?pa=${upiId}&am=${amount}&tn=${userId}|${email}&cu=INR`;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiLink)}`;

  // Confirm deposit
  const handleConfirm = async () => {
    try {
      await api.post('/deposits/request', { amount });
      alert("Deposit request submitted!");
      setConfirmed(false);
      setAmount('');
    } catch (err) {
      alert("Error submitting deposit request");
    }
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <h2>Deposit</h2>
      <p><b>Current UPI ID:</b> {upiId}</p>

      <input
        type="number"
        value={amount}
        onChange={e => setAmount(e.target.value)}
        placeholder="Enter amount"
        style={{ padding: '10px', fontSize: '16px', marginBottom: '10px' }}
      />
      <br />

      <button
        onClick={() => setConfirmed(true)}
        disabled={!amount || !upiId}
        style={{ padding: '10px 20px', fontSize: '16px', margin: '10px' }}
      >
        Generate QR
      </button>

      {confirmed && (
        <div>
          <img src={qrSrc} alt="QR Code" style={{ marginTop: '20px' }} />
          <br />
          <a href={upiLink}>
            <button style={{ marginTop: '10px', padding: '10px 20px', fontSize: '16px' }}>
              Pay via UPI App
            </button>
          </a>
          <br /><br />
          <button
            onClick={handleConfirm}
            style={{ background: 'green', color: 'white', padding: '10px 20px', fontSize: '16px' }}
          >
            I Have Paid
          </button>
        </div>
      )}
    </div>
  );
};

export default DepositPage;
