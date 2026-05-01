// Sample-only audio. The only active sound is the thwip on question advance.
// Lazy-init the AudioContext on first user gesture (browser autoplay policy).

const AudioFx = (() => {
  let ctx = null;
  let muted = false;
  let master = null;
  const samples = {
    advance: createSample("sfx/thwip.wav", 0.34),
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

  function playDecodedSample(c, sample) {
    const src = c.createBufferSource();
    const gain = c.createGain();
    src.buffer = sample.buffer;
    gain.gain.value = sample.gain;
    src.connect(gain).connect(outputNode(c));
    src.start(c.currentTime);
  }

  function playSample(name) {
    const c = ensureCtx();
    if (!c) return;
    const sample = samples[name];
    if (!sample || sample.failed) return;
    if (sample.buffer) {
      playDecodedSample(c, sample);
      return;
    }

    warmDecodeSample(sample, c);
    if (sample.decodePromise) {
      sample.decodePromise.then((buffer) => {
        if (!buffer || muted) return;
        playDecodedSample(c, sample);
      });
    }
  }

  function noop() {}

  return {
    isMuted: () => muted,
    setMuted(v) {
      muted = !!v;
      try { localStorage.setItem("spidey:muted", muted ? "1" : "0"); } catch (_) {}
    },
    click: noop,
    choose: noop,
    match: noop,
    wrong: noop,
    hint: noop,
    thwip: noop,
    crack: noop,
    fanfare: noop,
    advance() {
      playSample("advance");
    },
  };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = AudioFx;
}
