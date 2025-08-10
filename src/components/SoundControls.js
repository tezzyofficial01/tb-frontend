import React, { useEffect, useState } from 'react';
import { SFX } from '../utils/sounds';

export default function SoundControls() {
  const [musicOn, setMusicOn] = useState(SFX.isMusicEnabled());
  const [sfxOn, setSfxOn] = useState(SFX.isSfxEnabled());

  // first user tap/click par audio unlock
  useEffect(() => {
    const unlock = () => SFX.unlockIfNeeded();
    window.addEventListener('pointerdown', unlock, { once: true });
    return () => window.removeEventListener('pointerdown', unlock);
  }, []);

  const toggleMusic = () => {
    const v = !musicOn;
    setMusicOn(v);
    SFX.setMusicEnabled(v);
  };

  const toggleSfx = () => {
    const v = !sfxOn;
    setSfxOn(v);
    SFX.setSfxEnabled(v);
  };

  const btn = (active) => ({
    flex: 1,
    padding: '10px 12px',
    borderRadius: 10,
    border: '1px solid #e6e6e6',
    background: active ? '#e8fff0' : '#fff5f5',
    fontWeight: 600,
    cursor: 'pointer'
  });

  return (
    <div className="sound-controls">
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={toggleMusic} style={btn(musicOn)} title={musicOn ? 'Music ON' : 'Music OFF'}>
          {musicOn ? '🎵 Music ON' : '🎵 Music OFF'}
        </button>
        <button onClick={toggleSfx} style={btn(sfxOn)} title={sfxOn ? 'SFX ON' : 'SFX OFF'}>
          {sfxOn ? '🔔 SFX ON' : '🔕 SFX OFF'}
        </button>
      </div>
      <small style={{ display: 'block', marginTop: 6, color: '#666' }}>
        Tip: First tap ke baad music auto start hoga.
      </small>
    </div>
  );
}
