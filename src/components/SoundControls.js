// src/components/SoundControls.js
import React, { useEffect, useState } from 'react';
import { SFX } from '../utils/sounds';

export default function SoundControls() {
  const [musicOn, setMusicOn] = useState(SFX.isMusicEnabled());
  const [sfxOn, setSfxOn] = useState(SFX.isSfxEnabled());

  useEffect(() => {
    const unlock = () => SFX.unlockAll();
    window.addEventListener('pointerdown', unlock, { once: true });
    return () => window.removeEventListener('pointerdown', unlock);
  }, []);

  const toggleMusic = () => { const v = !musicOn; setMusicOn(v); SFX.setMusicEnabled(v); };
  const toggleSfx   = () => { const v = !sfxOn;   setSfxOn(v);   SFX.setSfxEnabled(v); };

  // ... (baaki UI same as before)
  return (
    <div className="sound-controls">
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={toggleMusic} style={btn(musicOn)}>{musicOn ? '🎵 Music ON' : '🎵 Music OFF'}</button>
        <button onClick={toggleSfx}   style={btn(sfxOn)}  >{sfxOn ? '🔔 SFX ON'   : '🔕 SFX OFF'}</button>
      </div>
      <small style={{ display: 'block', marginTop: 6, color: '#666' }}>Tip: First tap par sab sounds unlock ho jayenge.</small>
    </div>
  );
}
const btn = (active) => ({
  flex: 1, padding: '10px 12px', borderRadius: 10, border: '1px solid #e6e6e6',
  background: active ? '#e8fff0' : '#fff5f5', fontWeight: 600, cursor: 'pointer'
});
