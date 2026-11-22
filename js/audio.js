window.SB = window.SB || {};

/**
 * 音频引擎：支持模板自带 BGM + 两首程序合成八音盒/小屋旋律 + 复古星露谷风音效
 */
window.SB.Audio = (function () {
  const TRACKS = [
    { id: 'template-bgm', name: '星露谷生日旋律 (默认)', subtitle: '温暖节庆原声' },
    { id: 'musicbox-birthday', name: '八音盒 · 生日快乐歌', subtitle: '清脆像素八音盒' },
    { id: 'cabin-lullaby', name: '鹈鹕镇暖炉晚风', subtitle: '轻柔五声音阶小夜曲' },
  ];

  let ctx = null;
  let masterGain = null;
  let mp3Audio = null;
  let mp3Failed = false;
  let unlocked = false;
  let muted = false;
  let playing = false;
  let volume = 0.55;
  let bgmDucked = false;
  let currentTrackIndex = 0;
  let seqTimer = null;
  let seqStep = 0;
  let stepToggle = 0;

  // Happy Birthday in C major (frequencies in Hz, duration in beats)
  const HAPPY_BIRTHDAY_NOTES = [
    [392.0, 0.75], [392.0, 0.25], [440.0, 1], [392.0, 1], [523.25, 1], [493.88, 2],
    [392.0, 0.75], [392.0, 0.25], [440.0, 1], [392.0, 1], [587.33, 1], [523.25, 2],
    [392.0, 0.75], [392.0, 0.25], [783.99, 1], [659.25, 1], [523.25, 1], [493.88, 1], [440.0, 2],
    [698.46, 0.75], [698.46, 0.25], [659.25, 1], [523.25, 1], [587.33, 1], [523.25, 2.5],
  ];

  // Cozy Stardew-inspired pentatonic lullaby (G major pentatonic)
  const LULLABY_NOTES = [
    [392.0, 1], [493.88, 1], [587.33, 1.5], [659.25, 0.5], [587.33, 2],
    [493.88, 1], [440.0, 1], [392.0, 2],
    [329.63, 1], [392.0, 1], [440.0, 1.5], [493.88, 0.5], [440.0, 2],
    [392.0, 1], [329.63, 1], [293.66, 2],
  ];

  function ensureContext() {
    if (!ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      ctx = new AudioCtx();
      masterGain = ctx.createGain();
      masterGain.gain.value = muted ? 0 : volume;
      masterGain.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    return ctx;
  }

  function ensureMp3() {
    if (!mp3Audio && !mp3Failed) {
      mp3Audio = new Audio('assets/audio/birthday-bgm.mp3');
      mp3Audio.loop = true;
      mp3Audio.preload = 'auto';
      mp3Audio.volume = muted ? 0 : volume * 0.7;
      mp3Audio.addEventListener('error', () => {
        mp3Failed = true;
      });
    }
    return mp3Audio;
  }

  function playTone(freq, durationSec, type = 'triangle', gainLevel = 0.16, delay = 0) {
    const ac = ensureContext();
    if (!ac || muted) return;
    const now = ac.currentTime + delay;
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(Math.max(0.001, gainLevel), now + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);
    osc.connect(g);
    g.connect(masterGain);
    osc.start(now);
    osc.stop(now + durationSec + 0.02);
  }

  function stopSynthSequencer() {
    if (seqTimer) {
      clearTimeout(seqTimer);
      seqTimer = null;
    }
  }

  function runSynthStep() {
    if (!playing || muted) return;
    const track = TRACKS[currentTrackIndex];
    if (!track || track.id === 'template-bgm') return;

    const list = track.id === 'musicbox-birthday' ? HAPPY_BIRTHDAY_NOTES : LULLABY_NOTES;
    const beatMs = track.id === 'musicbox-birthday' ? 420 : 520;
    const [freq, beats] = list[seqStep % list.length];
    seqStep = (seqStep + 1) % list.length;
    const duckMult = bgmDucked ? 0.16 : 1;

    if (track.id === 'musicbox-birthday') {
      playTone(freq, beats * 0.42, 'sine', 0.18 * duckMult);
      playTone(freq * 2, beats * 0.18, 'triangle', 0.05 * duckMult);
    } else {
      playTone(freq, beats * 0.55, 'triangle', 0.14 * duckMult);
      if (seqStep % 2 === 1) {
        playTone(freq * 0.5, beats * 0.7, 'sine', 0.08 * duckMult);
      }
    }

    seqTimer = setTimeout(runSynthStep, beats * beatMs);
  }

  function effectiveMp3Volume() {
    if (muted) return 0;
    return volume * (bgmDucked ? 0.12 : 0.7);
  }

  function applyPlaybackState() {
    stopSynthSequencer();
    const audio = mp3Audio;
    if (audio) {
      audio.volume = effectiveMp3Volume();
    }
    if (masterGain && ctx) {
      masterGain.gain.setTargetAtTime(muted ? 0 : volume, ctx.currentTime, 0.03);
    }

    if (!playing || muted) {
      if (audio && !audio.paused) {
        audio.pause();
      }
      return;
    }

    const track = TRACKS[currentTrackIndex];
    if (track.id === 'template-bgm' && !mp3Failed) {
      const el = ensureMp3();
      if (el) {
        el.play().catch(() => {
          // If MP3 cannot play, gracefully fall back to music box melody
          currentTrackIndex = 1;
          seqStep = 0;
          runSynthStep();
        });
        return;
      }
    }

    if (audio && !audio.paused) {
      audio.pause();
    }
    seqStep = 0;
    runSynthStep();
  }

  function unlock() {
    if (unlocked) return;
    unlocked = true;
    ensureContext();
    ensureMp3();
  }

  function startBgm() {
    unlock();
    playing = true;
    muted = false;
    applyPlaybackState();
  }

  function togglePlay() {
    unlock();
    if (!playing) {
      playing = true;
      muted = false;
    } else {
      playing = false;
    }
    applyPlaybackState();
    return playing;
  }

  function selectTrack(index) {
    unlock();
    currentTrackIndex = ((index % TRACKS.length) + TRACKS.length) % TRACKS.length;
    playing = true;
    muted = false;
    if (mp3Audio) {
      mp3Audio.currentTime = 0;
    }
    applyPlaybackState();
    return TRACKS[currentTrackIndex];
  }

  function setVolume(val) {
    volume = Math.max(0, Math.min(1, Number(val)));
    if (volume > 0 && muted) muted = false;
    if (mp3Audio) mp3Audio.volume = effectiveMp3Volume();
    if (masterGain && ctx) {
      masterGain.gain.setTargetAtTime(muted ? 0 : volume, ctx.currentTime, 0.03);
    }
  }

  function setBgmDuck(ducked) {
    bgmDucked = Boolean(ducked);
    if (mp3Audio) mp3Audio.volume = effectiveMp3Volume();
  }

  // Retro SFX helpers
  function step() {
    if (muted) return;
    ensureContext();
    stepToggle = 1 - stepToggle;
    playTone(stepToggle ? 148 : 132, 0.055, 'triangle', 0.045);
  }

  function blip() {
    if (muted) return;
    ensureContext();
    playTone(580 + Math.random() * 140, 0.045, 'square', 0.032);
  }

  function open() {
    if (muted) return;
    ensureContext();
    playTone(440, 0.08, 'triangle', 0.11, 0);
    playTone(659.25, 0.12, 'triangle', 0.11, 0.05);
  }

  function close() {
    if (muted) return;
    ensureContext();
    playTone(523.25, 0.07, 'triangle', 0.09, 0);
    playTone(392.0, 0.1, 'triangle', 0.08, 0.045);
  }

  function candleBlow() {
    if (muted) return;
    ensureContext();
    // Soft air puff + celebratory chime
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, idx) => playTone(n, 0.22, 'sine', 0.13, idx * 0.075));
  }

  function giftOpen() {
    if (muted) return;
    ensureContext();
    const notes = [523.25, 659.25, 783.99, 987.77, 1046.5];
    notes.forEach((n, idx) => playTone(n, 0.18, 'triangle', 0.14, idx * 0.065));
  }

  function junimo() {
    if (muted) return;
    ensureContext();
    playTone(740, 0.07, 'sine', 0.14, 0);
    playTone(987.77, 0.11, 'sine', 0.14, 0.065);
  }

  function questDone() {
    if (muted) return;
    ensureContext();
    const notes = [523.25, 587.33, 659.25, 783.99, 1046.5];
    notes.forEach((n, idx) => playTone(n, 0.25, 'triangle', 0.14, idx * 0.08));
  }

  function firework() {
    if (muted) return;
    ensureContext();
    const base = 420 + Math.random() * 260;
    [base, base * 1.25, base * 1.5, base * 2].forEach((n, idx) => {
      playTone(n, 0.2, 'sine', 0.09, idx * 0.045);
    });
  }

  function door() {
    if (muted) return;
    ensureContext();
    playTone(293.66, 0.09, 'triangle', 0.11, 0);
    playTone(392.0, 0.14, 'triangle', 0.12, 0.07);
  }

  function bark() {
    if (muted) return;
    ensureContext();
    playTone(310, 0.07, 'triangle', 0.15, 0);
    playTone(420, 0.09, 'triangle', 0.14, 0.09);
  }

  function meow() {
    if (muted) return;
    const ac = ensureContext();
    if (!ac) return;
    const now = ac.currentTime;
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(760, now + 0.09);
    osc.frequency.exponentialRampToValueAtTime(490, now + 0.28);
    g.gain.setValueAtTime(0.001, now);
    g.gain.exponentialRampToValueAtTime(0.14, now + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
    osc.connect(g);
    g.connect(masterGain);
    osc.start(now);
    osc.stop(now + 0.32);
  }

  function gacha() {
    if (muted) return;
    ensureContext();
    [480, 600, 720, 960].forEach((n, idx) => {
      playTone(n, 0.14, 'triangle', 0.12, idx * 0.06);
    });
  }

  function bubble() {
    if (muted) return;
    ensureContext();
    [520, 680, 860].forEach((n, idx) => {
      playTone(n, 0.09, 'sine', 0.12, idx * 0.055);
    });
  }

  function bake() {
    if (muted) return;
    ensureContext();
    [392, 494, 587, 784].forEach((n, idx) => {
      playTone(n, 0.13, 'triangle', 0.11, idx * 0.055);
    });
  }

  function playPianoNote(freq, durationSec = 1.35, velocity = 0.85) {
    if (muted) return;
    const ac = ensureContext();
    if (!ac) return;
    const now = ac.currentTime;
    const vel = Math.max(0.15, Math.min(1.0, Number(velocity) || 0.85));

    const filter = ac.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2800, now);
    filter.frequency.exponentialRampToValueAtTime(900, now + Math.min(0.65, durationSec * 0.6));
    filter.connect(masterGain);

    const osc1 = ac.createOscillator();
    const osc2 = ac.createOscillator();
    const osc3 = ac.createOscillator();
    const gBody = ac.createGain();
    const gHammer = ac.createGain();

    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(freq, now);
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq, now);
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(freq * 2, now);

    gBody.gain.setValueAtTime(0.0001, now);
    gBody.gain.linearRampToValueAtTime(0.22 * vel, now + 0.012);
    gBody.gain.exponentialRampToValueAtTime(0.07 * vel, now + 0.26);
    gBody.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

    gHammer.gain.setValueAtTime(0.0001, now);
    gHammer.gain.linearRampToValueAtTime(0.11 * vel, now + 0.008);
    gHammer.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

    osc1.connect(gBody);
    osc2.connect(gBody);
    osc3.connect(gHammer);
    gBody.connect(filter);
    gHammer.connect(filter);

    osc1.start(now);
    osc2.start(now);
    osc3.start(now);
    osc1.stop(now + durationSec + 0.04);
    osc2.stop(now + durationSec + 0.04);
    osc3.stop(now + 0.22);
  }

  function keyClick() {
    if (muted) return;
    ensureContext();
    playTone(960 + Math.random() * 140, 0.028, 'triangle', 0.055);
  }

  function sizzle() {
    if (muted) return;
    const ac = ensureContext();
    if (!ac) return;
    const dur = 0.19;
    const len = Math.floor(ac.sampleRate * dur);
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * 0.48));
    }
    const src = ac.createBufferSource();
    src.buffer = buf;
    const filter = ac.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 2600 + Math.random() * 800;
    filter.Q.value = 1.4;
    const g = ac.createGain();
    g.gain.setValueAtTime(0.16, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
    src.connect(filter);
    filter.connect(g);
    g.connect(masterGain);
    src.start();
  }

  function chop() {
    if (muted) return;
    ensureContext();
    playTone(210, 0.045, 'triangle', 0.14);
    playTone(420, 0.03, 'square', 0.05, 0.012);
  }

  function dishDone() {
    if (muted) return;
    ensureContext();
    [523.25, 659.25, 783.99, 1046.5].forEach((f, idx) => {
      playTone(f, 0.24, 'triangle', 0.16, idx * 0.08);
      playTone(f * 2, 0.16, 'sine', 0.06, idx * 0.08 + 0.02);
    });
  }

  let voiceAudio = null;
  let voiceFallbackTimer = null;

  function stopVoiceWish() {
    if (voiceFallbackTimer) {
      clearTimeout(voiceFallbackTimer);
      voiceFallbackTimer = null;
    }
    if (voiceAudio) {
      try {
        voiceAudio.pause();
        voiceAudio.currentTime = 0;
      } catch (_) {}
      voiceAudio = null;
    }
    setBgmDuck(false);
  }

  function playVoiceWish(src, onEnded) {
    stopVoiceWish();
    ensureContext();
    setBgmDuck(true);

    function playFallbackChime() {
      const notes = [
        [523.25, 0], [659.25, 0.32], [783.99, 0.64], [1046.5, 0.96],
        [987.77, 1.45], [783.99, 1.78], [659.25, 2.15], [523.25, 2.55],
        [587.33, 3.05], [659.25, 3.4], [523.25, 3.8],
      ];
      notes.forEach(([f, d]) => {
        playTone(f, 0.42, 'sine', 0.15, d);
        playTone(f * 2, 0.2, 'triangle', 0.04, d + 0.02);
      });
      voiceFallbackTimer = setTimeout(() => {
        setBgmDuck(false);
        if (onEnded) onEnded('fallback');
      }, 4300);
    }

    if (!src) {
      playFallbackChime();
      return;
    }
    try {
      const a = new Audio(src);
      a.volume = muted ? 0 : Math.min(1, volume * 1.15);
      voiceAudio = a;
      let settled = false;
      a.addEventListener('ended', () => {
        if (settled) return;
        settled = true;
        setBgmDuck(false);
        if (onEnded) onEnded('audio');
      });
      a.addEventListener('error', () => {
        if (settled) return;
        settled = true;
        voiceAudio = null;
        playFallbackChime();
      });
      a.play().catch(() => {
        if (settled) return;
        settled = true;
        voiceAudio = null;
        playFallbackChime();
      });
    } catch (_) {
      playFallbackChime();
    }
  }

  return {
    TRACKS,
    unlock,
    startBgm,
    togglePlay,
    selectTrack,
    setVolume,
    setBgmDuck,
    isPlaying: () => playing && !muted,
    getCurrentTrackIndex: () => currentTrackIndex,
    getVolume: () => volume,
    step,
    blip,
    open,
    close,
    candleBlow,
    giftOpen,
    junimo,
    questDone,
    firework,
    door,
    bark,
    meow,
    gacha,
    bubble,
    bake,
    sizzle,
    chop,
    dishDone,
    playVoiceWish,
    stopVoiceWish,
    playPianoNote,
    keyClick,
  };
})();
