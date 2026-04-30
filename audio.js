// Tiny Web Audio synth — no external assets.
// Lazy-init the AudioContext on first user gesture (browser autoplay policy).

const AudioFx = (() => {
  let ctx = null;
  let muted = false;

  try {
    muted = localStorage.getItem("spidey:muted") === "1";
  } catch (_) {}

  function ensureCtx() {
    if (muted) return null;
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function tone({ freq = 440, dur = 0.12, type = "sine", gain = 0.18, attack = 0.005, release = 0.08, slideTo = null }) {
    const c = ensureCtx();
    if (!c) return;
    const t0 = c.currentTime;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(gain, t0 + attack);
    g.gain.linearRampToValueAtTime(0, t0 + dur + release);
    osc.connect(g).connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + dur + release + 0.02);
  }

  function noiseBurst({ dur = 0.08, gain = 0.12 }) {
    const c = ensureCtx();
    if (!c) return;
    const t0 = c.currentTime;
    const buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const src = c.createBufferSource();
    src.buffer = buf;
    const g = c.createGain();
    g.gain.value = gain;
    const filt = c.createBiquadFilter();
    filt.type = "highpass";
    filt.frequency.value = 1200;
    src.connect(filt).connect(g).connect(c.destination);
    src.start(t0);
  }

  return {
    isMuted: () => muted,
    setMuted(v) {
      muted = !!v;
      try { localStorage.setItem("spidey:muted", muted ? "1" : "0"); } catch (_) {}
    },
    // tiny tick for selecting a choice
    click() { tone({ freq: 520, dur: 0.04, type: "square", gain: 0.08, release: 0.04 }); },
    // satisfying lock-in for matching a villain
    match() {
      tone({ freq: 660, dur: 0.08, type: "triangle", gain: 0.14 });
      setTimeout(() => tone({ freq: 990, dur: 0.1, type: "triangle", gain: 0.14 }), 70);
    },
    // page/question advance
    advance() { tone({ freq: 380, dur: 0.06, type: "sine", gain: 0.1, slideTo: 560 }); },
    // negative buzz for wrong gated answer
    wrong() { tone({ freq: 220, dur: 0.18, type: "sawtooth", gain: 0.12, slideTo: 110 }); },
    // hint reveal sparkle
    hint() {
      tone({ freq: 880, dur: 0.06, type: "sine", gain: 0.08 });
      setTimeout(() => tone({ freq: 1320, dur: 0.08, type: "sine", gain: 0.08 }), 60);
    },
    // web-thwip for the intro spider drop
    thwip() {
      tone({ freq: 1200, dur: 0.18, type: "sawtooth", gain: 0.1, slideTo: 220 });
      noiseBurst({ dur: 0.12, gain: 0.06 });
    },
    // glass-crack for the intro web-crack
    crack() {
      noiseBurst({ dur: 0.18, gain: 0.18 });
      tone({ freq: 180, dur: 0.12, type: "square", gain: 0.08, slideTo: 60 });
    },
    // mission-complete fanfare on results
    fanfare() {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
      notes.forEach((f, i) => {
        setTimeout(() => tone({ freq: f, dur: 0.18, type: "triangle", gain: 0.16, release: 0.18 }), i * 110);
      });
    },
  };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = AudioFx;
}
