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
      a.play().catch(() => {/* autoplay lock until user gesture */});
    },
    stop() {
      poolArr.forEach(a => { a.pause(); a.currentTime = 0; });
    },
    setVolume(v) { poolArr.forEach(a => (a.volume = v)); },
    _all() { return poolArr; }
  };
}

// players
const bg = createPooledPlayer(bgSrc, { volume: 0.35, loop: true, pool: 1 });
const coinPick = createPooledPlayer(coinPickSrc, { volume: 0.9, pool: 3 });
const coinDrop = createPooledPlayer(coinDropSrc, { volume: 0.9, pool: 3 });
const tick = createPooledPlayer(tickSrc, { volume: 0.75, pool: 4 });
const winner = createPooledPlayer(winnerSrc, { volume: 0.95, pool: 1 });

// states (default OFF if not set)
let musicEnabled = (typeof window !== 'undefined' && localStorage.getItem('musicEnabled') === 'true') || false;
let sfxEnabled   = (typeof window !== 'undefined' && localStorage.getItem('sfxEnabled') === 'true')   || false;

// helpers
function persist() {
  if (typeof window !== 'undefined') {
    localStorage.setItem('musicEnabled', String(musicEnabled));
    localStorage.setItem('sfxEnabled', String(sfxEnabled));
  }
}

function startBG() {
  if (!musicEnabled) return;
  bg.play();
}

function stopBG() {
  bg.stop();
}

// public API
export const SFX = {
  // ——— toggles ———
  setMusicEnabled(val) {
    musicEnabled = !!val; persist();
    if (musicEnabled) startBG(); else stopBG();
  },
  setSfxEnabled(val) {
    sfxEnabled = !!val; persist();
    if (!sfxEnabled) { coinPick.stop(); coinDrop.stop(); tick.stop(); winner.stop(); }
  },
  isMusicEnabled: () => musicEnabled,
  isSfxEnabled: () => sfxEnabled,

  // call on first user gesture to unlock audio
  unlockIfNeeded() { if (musicEnabled) startBG(); },

  // bg control if needed elsewhere
  startBG, stopBG,

  // SFX gated by sfxEnabled
  playCoinPickup: () => sfxEnabled && coinPick.play(),
  playCoinDrop:   () => sfxEnabled && coinDrop.play(),
  playTick:       () => sfxEnabled && tick.play(),
  playWinner:     () => sfxEnabled && winner.play(),
};
