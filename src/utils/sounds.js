// src/utils/sounds.js
import bgSrc from '../assets/sounds/bg.mp3';
import coinPickSrc from '../assets/sounds/coin_pick.mp3';
import coinDropSrc from '../assets/sounds/coin_drop.mp3';
import tickSrc from '../assets/sounds/tick.mp3';
import winnerSrc from '../assets/sounds/winner.mp3';

/* -------------------------------------------------------
   Small pooled <audio> player (no WebAudio needed)
------------------------------------------------------- */
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
      a.play().catch(() => {}); // policy blocks without gesture -> safe no-op
    },
    stop() {
      poolArr.forEach(a => { a.pause(); try { a.currentTime = 0; } catch {} });
    },
    setVolume(v) { poolArr.forEach(a => (a.volume = v)); },
    _all() { return poolArr; }
  };
}

/* -------------------------------------------------------
   Players
------------------------------------------------------- */
const bg       = createPooledPlayer(bgSrc,       { volume: 0.35, loop: true, pool: 1 });
const coinPick = createPooledPlayer(coinPickSrc, { volume: 0.90, pool: 3 });
const coinDrop = createPooledPlayer(coinDropSrc, { volume: 0.90, pool: 3 });
const tick     = createPooledPlayer(tickSrc,     { volume: 0.75, pool: 1 }); // single instance (no overlap)
const winner   = createPooledPlayer(winnerSrc,   { volume: 0.95, pool: 1 });

/* -------------------------------------------------------
   State (persisted across refresh)
------------------------------------------------------- */
let musicEnabled = (typeof window !== 'undefined' && localStorage.getItem('musicEnabled') === 'true') || false;
let sfxEnabled   = (typeof window !== 'undefined' && localStorage.getItem('sfxEnabled')   === 'true') || false;

// *True* only after we succeed at least once in a user gesture
let unlocked = false;

function persist() {
  if (typeof window !== 'undefined') {
    localStorage.setItem('musicEnabled', String(musicEnabled));
    localStorage.setItem('sfxEnabled',   String(sfxEnabled));
  }
}

/* -------------------------------------------------------
   Control helpers
------------------------------------------------------- */
function startBG() {
  if (musicEnabled && unlocked) bg.play();
}
function stopBG()  { bg.stop(); }
function stopTick(){ tick.stop(); }

/* -------------------------------------------------------
   Robust unlock: try on gesture; mark unlocked only on success
------------------------------------------------------- */
async function unlockAll() {
  // try to "prime" each element by playing muted then pausing
  const all = [
    ...bg._all(), ...coinPick._all(), ...coinDrop._all(),
    ...tick._all(), ...winner._all()
  ];

  let anySucceeded = false;
  for (const a of all) {
    try {
      const oldVol = a.volume;
      const oldMuted = a.muted;
      a.muted = true;
      a.volume = 0;
      // calling play in a gesture resolves the promise; if policy blocks it, catch below
      await a.play();
      a.pause();
      try { a.currentTime = 0; } catch {}
      a.muted = oldMuted;
      a.volume = oldVol;
      anySucceeded = true; // at least one succeeded -> audio is unlocked
    } catch {
      // ignore; we'll keep trying on next gesture
    }
  }

  if (anySucceeded) {
    unlocked = true;
    // if user prefers BG music, start it now
    startBG();
  }

  return anySucceeded;
}

/* -------------------------------------------------------
   Ensure unlock hooks (keeps trying until success)
------------------------------------------------------- */
function ensureUnlockHooks() {
  if (typeof window === 'undefined') return;

  const tryUnlock = async () => {
    const ok = await unlockAll();
    if (ok) {
      window.removeEventListener('pointerdown', tryUnlock);
      window.removeEventListener('touchstart', tryUnlock);
      window.removeEventListener('keydown', tryUnlock);
    }
  };

  // attach listeners (NOT once) so we can retry if first attempt fails
  window.addEventListener('pointerdown', tryUnlock);
  window.addEventListener('touchstart', tryUnlock);
  window.addEventListener('keydown', tryUnlock);

  // When tab becomes visible again, try resume if user wants sound
  const onVis = async () => {
    if (document.visibilityState === 'visible' && (musicEnabled || sfxEnabled) && !unlocked) {
      await unlockAll();
    }
  };
  document.addEventListener('visibilitychange', onVis);

  // small cleanup helper if ever needed
  return () => {
    window.removeEventListener('pointerdown', tryUnlock);
    window.removeEventListener('touchstart', tryUnlock);
    window.removeEventListener('keydown', tryUnlock);
    document.removeEventListener('visibilitychange', onVis);
  };
}

/* -------------------------------------------------------
   Public API
------------------------------------------------------- */
export const SFX = {
  // prefs
  setMusicEnabled(val) {
    musicEnabled = !!val;
    persist();
    if (musicEnabled) startBG(); else stopBG();
  },
  setSfxEnabled(val) {
    sfxEnabled = !!val;
    persist();
    if (!sfxEnabled) { coinPick.stop(); coinDrop.stop(); stopTick(); winner.stop(); }
  },
  isMusicEnabled: () => musicEnabled,
  isSfxEnabled:   () => sfxEnabled,

  // unlock
  unlockAll,
  ensureUnlockHooks,
  isUnlocked: () => unlocked,

  // bg
  startBG,
  stopBG,

  // sfx (guarded)
  playTick:       () => { if (sfxEnabled && unlocked) { stopTick(); tick.play(); } },
  stopTick,
  playCoinPickup: () => { if (sfxEnabled && unlocked) coinPick.play(); },
  playCoinDrop:   () => { if (sfxEnabled && unlocked) coinDrop.play(); },
  playWinner:     () => { if (sfxEnabled && unlocked) winner.play(); },
};

/* -------------------------------------------------------
   Auto-hook on load if user had sound ON (works for guests too)
------------------------------------------------------- */
if (typeof window !== 'undefined' && (musicEnabled || sfxEnabled)) {
  // attach gesture listeners immediately so first tap enables audio after refresh
  SFX.ensureUnlockHooks();
}
