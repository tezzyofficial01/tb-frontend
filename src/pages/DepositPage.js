import React, { useState, useEffect } from 'react';
import api from '../services/api';

const DepositPage = () => {
  const [upiId, setUpiId] = useState('');
  const [amount, setAmount] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  // Logged-in user
  const userData = JSON.parse(localStorage.getItem('user')) || {};
  const userId = userData.id || '';
  const email = userData.email || '';

  // Fetch UPI ID
  useEffect(() => {
    api.get('/settings/upi')
      .then(res => setUpiId(res.data?.upiId || ''))
      .catch(() => setUpiId(''));
  }, []);

  // Build UPI params safely
  const amt = Number(amount || 0).toFixed(2);               // "200.00"
  const tn  = `${(userId||'').slice(0,12)} ${(email||'').split('@')[0].slice(0,12)}`; // short ASCII
  const tr  = `TB${Date.now()}`;                            // optional unique ref (some apps like it)

  const params = new URLSearchParams({
    pa: upiId,          // your real UPI ID
    pn: 'Titali Bhavara',
    am: amt,
    cu: 'INR',
    tn,
    tr
  });

  // Generic UPI link (any app)
  const upiLink = `upi://pay?${params.toString()}`;

  // App-specific intents (Android)
  const gpayIntent    = `intent://upi/pay?${params.toString()}#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;end`;
  const phonepeIntent = `intent://upi/pay?${params.toString()}#Intent;scheme=upi;package=com.phonepe.app;end`;
  const paytmIntent   = `intent://upi/pay?${params.toString()}#Intent;scheme=upi;package=net.one97.paytm;end`;

  // QR using encoded generic link
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiLink)}`;

  const openGeneric  = () => window.location.href = upiLink;
  const openGPay     = () => window.location.href = gpayIntent;
  const openPhonePe  = () => window.location.href = phonepeIntent;
  const openPaytm    = () => window.location.href = paytmIntent;

  // Confirm deposit -> create pending request (MATCH backend route!)
  const handleConfirm = async () => {
    try {
      await api.post('/deposits', { amount: Number(amount) }); // ✅ not /deposits/request
      alert('Deposit request submitted!');
      setConfirmed(false);
      setAmount('');
    } catch (err) {
      alert('Error submitting deposit request');
    }
  };

  const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);

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
        Generate QR
      </button>

      {confirmed && (
        <div>
          <img src={qrSrc} alt="QR Code" style={{ marginTop: 20 }} />

          {/* Primary generic button (mobile) */}
          <div style={{ marginTop: 12 }}>
            <button onClick={openGeneric} style={{ padding: '10px 20px', fontSize: 16 }}>
              Pay via UPI App
            </button>
          </div>

          {/* App-specific intents (Android) */}
          <div style={{ marginTop: 8 }}>
            <button onClick={openGPay} style={{ marginRight: 8 }}>Google Pay</button>
            <button onClick={openPhonePe} style={{ marginRight: 8 }}>PhonePe</button>
            <button onClick={openPaytm}>Paytm</button>
          </div>

          {/* Fallbacks & tips */}
          <div style={{ marginTop: 12, fontSize: 12, opacity: 0.8 }}>
            {isMobile
              ? 'If any app blocks the link, try a different UPI app or scan the QR.'
              : 'Open this page on your phone or scan the QR using your UPI app.'}
          </div>

          <div style={{ marginTop: 8 }}>
            <button
              onClick={() => { navigator.clipboard.writeText(upiId); alert('UPI ID copied'); }}
              style={{ marginRight: 8 }}
            >
              Copy UPI ID
            </button>
            <button
              onClick={() => { navigator.clipboard.writeText(amt); alert('Amount copied'); }}
            >
              Copy Amount
            </button>
          </div>

          <br />
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
