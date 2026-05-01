// Tiny Web Audio synth with optional local samples.
// Lazy-init the AudioContext on first user gesture (browser autoplay policy).

const AudioFx = (() => {
  let ctx = null;
  let muted = false;
  let master = null;
  const samples = {
    choose: createSample("sfx/thwip.wav", 0.34),
    introBoom: createSample("sfx/intro-boom.wav", 0.28),
  };

  try {
    muted = localStorage.getItem("spidey:muted") === "1";
  } catch (_) {}

  function createSample(url, gain) {
    const sample = {
      url,
      gain,
      bytesPromise: null,
      buffer: null,
      decodePromise: null,
      failed: false,
    };

    if (typeof window === "undefined" || typeof fetch !== "function") {
      sample.failed = true;
      return sample;
    }

    sample.bytesPromise = fetch(url)
      .then((response) => {
        if (!response.ok) throw new Error(`Unable to load ${url}`);
        return response.arrayBuffer();
      })
      .catch(() => {
        sample.failed = true;
        return null;
      });

    return sample;
  }

  function ensureCtx() {
    if (muted) return null;
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = createMasterOutput(ctx);
      warmDecodeSamples(ctx);
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function createMasterOutput(c) {
    const compressor = c.createDynamicsCompressor();
    compressor.threshold.value = -24;
    compressor.knee.value = 18;
    compressor.ratio.value = 6;
    compressor.attack.value = 0.004;
    compressor.release.value = 0.18;

    const out = c.createGain();
    out.gain.value = 0.46;
    compressor.connect(out).connect(c.destination);
    return compressor;
  }

  function outputNode(c) {
    return master || c.destination;
  }

  function decodeBytes(c, bytes) {
    const copy = bytes.slice(0);
    try {
      const decoded = c.decodeAudioData(copy);
      if (decoded && typeof decoded.then === "function") return decoded;
    } catch (_) {}
    return new Promise((resolve, reject) => {
      c.decodeAudioData(bytes.slice(0), resolve, reject);
    });
  }

  function warmDecodeSample(sample, c) {
    if (!sample || sample.buffer || sample.decodePromise || sample.failed) return;
    sample.decodePromise = sample.bytesPromise
      .then((bytes) => {
        if (!bytes) {
          sample.failed = true;
          return null;
        }
        return decodeBytes(c, bytes);
      })
      .then((buffer) => {
        if (buffer) sample.buffer = buffer;
        else sample.failed = true;
        return buffer;
      })
      .catch(() => {
        sample.failed = true;
        return null;
      });
  }

  function warmDecodeSamples(c) {
    Object.values(samples).forEach((sample) => warmDecodeSample(sample, c));
  }

  function playSample(name, fallback) {
    const c = ensureCtx();
    if (!c) return;
    const sample = samples[name];
    if (!sample || sample.failed) {
      fallback();
      return;
    }
    if (!sample.buffer) {
      warmDecodeSample(sample, c);
      fallback();
      return;
    }

    const src = c.createBufferSource();
    const gain = c.createGain();
    src.buffer = sample.buffer;
    gain.gain.value = sample.gain;
    src.connect(gain).connect(outputNode(c));
    src.start(c.currentTime);
  }

  function tone({
    freq = 440,
    dur = 0.12,
    type = "sine",
    gain = 0.08,
    attack = 0.006,
    release = 0.08,
    slideTo = null,
    delay = 0,
    filter = null,
  }) {
    const c = ensureCtx();
    if (!c) return;
    const t0 = c.currentTime + delay;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(gain, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + release);

    if (filter) {
      const f = c.createBiquadFilter();
      f.type = filter.type;
      f.frequency.setValueAtTime(filter.frequency, t0);
      if (filter.q) f.Q.value = filter.q;
      osc.connect(f).connect(g).connect(outputNode(c));
    } else {
      osc.connect(g).connect(outputNode(c));
    }

    osc.start(t0);
    osc.stop(t0 + dur + release + 0.02);
  }

  function noiseBurst({
    dur = 0.08,
    gain = 0.06,
    delay = 0,
    filterType = "bandpass",
    frequency = 2400,
    q = 0.8,
  } = {}) {
    const c = ensureCtx();
    if (!c) return;
    const t0 = c.currentTime + delay;
    const buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      const fade = 1 - i / data.length;
      data[i] = (Math.random() * 2 - 1) * fade * fade;
    }

    const src = c.createBufferSource();
    src.buffer = buf;
    const g = c.createGain();
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    const filt = c.createBiquadFilter();
    filt.type = filterType;
    filt.frequency.value = frequency;
    filt.Q.value = q;
    src.connect(filt).connect(g).connect(outputNode(c));
    src.start(t0);
  }

  function webZip({ delay = 0, gain = 0.055 } = {}) {
    tone({
      freq: 1320,
      slideTo: 520,
      dur: 0.09,
      type: "triangle",
      gain,
      release: 0.06,
      delay,
      filter: { type: "bandpass", frequency: 1800, q: 1.1 },
    });
    noiseBurst({
      dur: 0.07,
      gain: gain * 0.7,
      delay,
      filterType: "bandpass",
      frequency: 3600,
      q: 1.2,
    });
  }

  function clickEffect() {
    tone({ freq: 620, dur: 0.025, type: "sine", gain: 0.045, release: 0.035 });
  }

  function crackEffect() {
    noiseBurst({ dur: 0.1, gain: 0.055, frequency: 2600, q: 1.4 });
    tone({ freq: 190, dur: 0.08, type: "sine", gain: 0.035, slideTo: 90 });
  }

  return {
    isMuted: () => muted,
    setMuted(v) {
      muted = !!v;
      try { localStorage.setItem("spidey:muted", muted ? "1" : "0"); } catch (_) {}
    },
    // soft UI tick for selecting a choice
    click() {
      clickEffect();
    },
    // sample-backed choice select, with the soft UI tick as fallback
    choose() {
      playSample("choose", clickEffect);
    },
    // soft web lock-in for matching a pair
    match() {
      webZip({ gain: 0.06 });
      tone({ freq: 740, dur: 0.08, type: "sine", gain: 0.055, delay: 0.055 });
      tone({ freq: 980, dur: 0.09, type: "sine", gain: 0.045, delay: 0.1 });
    },
    // page/question advance: a very short web-sling zip
    advance() {
      webZip({ gain: 0.045 });
    },
    // gentle wrong-answer thud instead of a harsh buzz
    wrong() {
      tone({ freq: 160, dur: 0.1, type: "sine", gain: 0.065, slideTo: 105 });
      noiseBurst({
        dur: 0.06,
        gain: 0.025,
        filterType: "lowpass",
        frequency: 420,
        q: 0.7,
      });
    },
    // hint reveal sparkle, quieter than before
    hint() {
      tone({ freq: 880, dur: 0.045, type: "sine", gain: 0.04 });
      tone({ freq: 1320, dur: 0.06, type: "sine", gain: 0.04, delay: 0.055 });
    },
    // web-thwip for the intro spider drop
    thwip() {
      webZip({ gain: 0.07 });
      tone({ freq: 410, dur: 0.12, type: "sine", gain: 0.035, slideTo: 260, delay: 0.04 });
    },
    // softened crack for the intro web-crack
    crack() {
      playSample("introBoom", crackEffect);
    },
    // mission-complete fanfare on results
    fanfare() {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
      notes.forEach((f, i) => {
        tone({
          freq: f,
          dur: 0.13,
          type: "sine",
          gain: 0.065,
          release: 0.16,
          delay: i * 0.105,
        });
      });
    },
  };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = AudioFx;
}
