// src/utils/sounds.js
import bgSrc from '../assets/sounds/bg.mp3';
import coinPickSrc from '../assets/sounds/coin_pick.mp3';
import coinDropSrc from '../assets/sounds/coin_drop.mp3';
import tickSrc from '../assets/sounds/tick.mp3';
import winnerSrc from '../assets/sounds/winner.mp3';

function createPooledPlayer(src, { volume = 1, loop = false, pool = 1 } = {}) {
  const poolArr = Array.from({ length: pool }).map(() => {
    const a = new Audio(src);
    a.preload = 'auto';
    a.loop = loop;
    a.volume = volume;
    return a;
  });
  let idx = 0;

  return {
    play() {
      const a = poolArr[idx];
      idx = (idx + 1) % poolArr.length;
      try { a.currentTime = 0; } catch {}
      a.play().catch(() => {});
    },
    stop() { poolArr.forEach(a => { a.pause(); a.currentTime = 0; }); },
    setVolume(v) { poolArr.forEach(a => (a.volume = v)); },
    _all() { return poolArr; }
  };
}

const bg = createPooledPlayer(bgSrc, { volume: 0.35, loop: true, pool: 1 });
const coinPick = createPooledPlayer(coinPickSrc, { volume: 0.9, pool: 3 });
const coinDrop = createPooledPlayer(coinDropSrc, { volume: 0.9, pool: 3 });
const tick = createPooledPlayer(tickSrc, { volume: 0.75, pool: 4 });
const winner = createPooledPlayer(winnerSrc, { volume: 0.95, pool: 1 });

let musicEnabled = (typeof window !== 'undefined' && localStorage.getItem('musicEnabled') === 'true') || false;
let sfxEnabled   = (typeof window !== 'undefined' && localStorage.getItem('sfxEnabled') === 'true')   || false;

function persist() {
  if (typeof window !== 'undefined') {
    localStorage.setItem('musicEnabled', String(musicEnabled));
    localStorage.setItem('sfxEnabled', String(sfxEnabled));
  }
}
function startBG() { if (musicEnabled) bg.play(); }
function stopBG()  { bg.stop(); }

// ⬇️ NEW: unlock all players on first user gesture
let unlockedOnce = false;
async function unlockAll() {
  if (unlockedOnce) return;
  unlockedOnce = true;

  const all = [
    ...bg._all(), ...coinPick._all(), ...coinDrop._all(),
    ...tick._all(), ...winner._all()
  ];
  for (const a of all) {
    try {
      const oldVol = a.volume;
      a.muted = true;
      a.volume = 0;
      await a.play();
      a.pause();
      a.currentTime = 0;
      a.muted = false;
      a.volume = oldVol;
    } catch {}
  }
  // after unlock, if music ON, start bg
  startBG();
}

export const SFX = {
  setMusicEnabled(val) { musicEnabled = !!val; persist(); musicEnabled ? startBG() : stopBG(); },
  setSfxEnabled(val)   { sfxEnabled = !!val; persist(); if (!sfxEnabled) { coinPick.stop(); coinDrop.stop(); tick.stop(); winner.stop(); } },
  isMusicEnabled: () => musicEnabled,
  isSfxEnabled: () => sfxEnabled,
  unlockAll,

  startBG, stopBG,
  playCoinPickup: () => sfxEnabled && coinPick.play(),
  playCoinDrop:   () => sfxEnabled && coinDrop.play(),
  playTick:       () => sfxEnabled && tick.play(),
  playWinner:     () => sfxEnabled && winner.play(),
};
