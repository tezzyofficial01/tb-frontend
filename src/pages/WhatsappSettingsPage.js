// client/src/pages/WhatsappSettingsPage.js
import React, { useEffect, useState } from 'react';
import api from '../services/api'; // ensure this is the ONLY axios instance used

const WhatsappSettingsPage = () => {
  // WhatsApp numbers
  const [deposit, setDeposit] = useState('');
  const [withdraw, setWithdraw] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  // UPI ID
  const [upiId, setUpiId] = useState('');
  const [upiSaving, setUpiSaving] = useState(false);
  const [upiMsg, setUpiMsg] = useState('');

  // Pending deposits
  const [pendingDeposits, setPendingDeposits] = useState([]);
  const [busyId, setBusyId] = useState(null); // row-level loading for approve/reject

  useEffect(() => {
    // Fetch all settings (whatsapp + upiId)
    api.get('/settings')
      .then(res => {
        setDeposit(res.data?.depositWhatsapp || '');
        setWithdraw(res.data?.withdrawWhatsapp || '');
        setUpiId(res.data?.upiId || '');
      })
      .catch(err => {
        console.error('GET /settings failed:', err?.response?.data || err.message);
      });

    fetchPendingDeposits();
  }, []);

  const fetchPendingDeposits = () => {
    api.get('/deposits/pending') // expects { deposits: [...] }
      .then(res => setPendingDeposits(res.data?.deposits || res.data || []))
      .catch(err => {
        console.error('GET /deposits/pending failed:', err?.response?.data || err.message);
        setPendingDeposits([]);
      });
  };

  // Save WhatsApp numbers
  const handleSave = async () => {
    setLoading(true);
    try {
      await api.put('/settings', {
        depositWhatsapp: deposit,
        withdrawWhatsapp: withdraw
      });
      setMsg('Updated!');
    } catch (err) {
      console.error('PUT /settings failed:', err?.response?.data || err.message);
      setMsg('Failed');
    } finally {
      setLoading(false);
      setTimeout(() => setMsg(''), 2000);
    }
  };

  // Save UPI ID
  const saveUpi = async () => {
    if (!upiId?.trim()) {
      setUpiMsg('UPI ID required');
      setTimeout(() => setUpiMsg(''), 2000);
      return;
    }
    setUpiSaving(true);
    try {
      await api.post('/settings/upi', { upiId }); // admin-only route
      setUpiMsg('UPI ID updated!');
    } catch (err) {
      console.error('POST /settings/upi failed:', err?.response?.data || err.message);
      setUpiMsg('Failed to update');
    } finally {
      setUpiSaving(false);
      setTimeout(() => setUpiMsg(''), 2000);
    }
  };

  // Approve / Reject deposit
  const changeDepositStatus = async (id, status) => {
    try {
      setBusyId(id);
      await api.patch(`/deposits/${id}`, { status }); // { status: 'approved' | 'rejected' }
      alert(status === 'approved'
        ? 'Deposit approved & balance updated!'
        : 'Deposit rejected!');
      fetchPendingDeposits();
    } catch (err) {
      console.error('PATCH /deposits/:id failed:', err?.response?.data || err.message);
      alert('Error updating deposit status');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      {/* WhatsApp Settings */}
      <h2 style={{ color: '#fff' }}>WhatsApp Number Settings</h2>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ color: '#fff' }}>Deposit WhatsApp: </label>
        <input
          value={deposit}
          onChange={e => setDeposit(e.target.value)}
          placeholder="Deposit Number"
          style={{ marginRight: 8 }}
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ color: '#fff' }}>Withdraw WhatsApp: </label>
        <input
          value={withdraw}
          onChange={e => setWithdraw(e.target.value)}
          placeholder="Withdraw Number"
          style={{ marginRight: 8 }}
        />
      </div>

      <button onClick={handleSave} disabled={loading}>
        {loading ? 'Saving...' : 'Save'}
      </button>
      <span style={{ marginLeft: 10, color: msg === 'Updated!' ? 'green' : 'red' }}>
        {msg}
      </span>

      <hr style={{ margin: '2rem 0', borderColor: '#444' }} />

      {/* UPI ID Settings */}
      <h2 style={{ color: '#fff' }}>Deposit UPI ID</h2>
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ color: '#fff' }}>Current UPI ID: </label>
        <input
          value={upiId}
          onChange={e => setUpiId(e.target.value)}
          placeholder="titali@ybl"
          style={{ marginRight: 8 }}
        />
      </div>
      <button onClick={saveUpi} disabled={upiSaving}>
        {upiSaving ? 'Saving...' : 'Save UPI ID'}
      </button>
      <span style={{ marginLeft: 10, color: upiMsg === 'UPI ID updated!' ? 'green' : 'red' }}>
        {upiMsg}
      </span>

      <hr style={{ margin: '2rem 0', borderColor: '#444' }} />

      {/* Pending Deposits */}
      <h2 style={{ color: '#fff' }}>Pending Deposit Requests</h2>
      {pendingDeposits.length === 0 ? (
        <p style={{ color: '#ccc' }}>No pending deposits</p>
      ) : (
        <table style={{ width: '100%', color: '#fff', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #555' }}>
              <th style={{ textAlign: 'left', padding: '8px' }}>User</th>
              <th style={{ textAlign: 'left', padding: '8px' }}>Amount</th>
              <th style={{ textAlign: 'left', padding: '8px' }}>Date</th>
              <th style={{ textAlign: 'left', padding: '8px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pendingDeposits.map(dep => (
              <tr key={dep._id} style={{ borderBottom: '1px solid #333' }}>
                <td style={{ padding: '8px' }}>
                  {dep.user?.email} ({dep.user?._id || dep.user?.id})
                </td>
                <td style={{ padding: '8px' }}>₹{dep.amount}</td>
                <td style={{ padding: '8px' }}>{new Date(dep.createdAt).toLocaleString()}</td>
                <td style={{ padding: '8px' }}>
                  <button
                    onClick={() => changeDepositStatus(dep._id, 'approved')}
                    disabled={busyId === dep._id}
                    style={{ marginRight: 8, background: 'green', color: 'white', padding: '5px 10px' }}
                  >
                    {busyId === dep._id ? 'Approving...' : 'Approve'}
                  </button>
                  <button
                    onClick={() => changeDepositStatus(dep._id, 'rejected')}
                    disabled={busyId === dep._id}
                    style={{ background: 'red', color: 'white', padding: '5px 10px' }}
                  >
                    {busyId === dep._id ? 'Rejecting...' : 'Reject'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default WhatsappSettingsPage;
