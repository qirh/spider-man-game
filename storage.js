// Lightweight localStorage persistence for in-progress quiz state.
// Stores only screen, question index, answers, and revealed hints.
// Silently falls back to a no-op if storage is unavailable (private mode, etc.).

const Persistence = (() => {
  const KEY = "spidey:progress:v1";
  const MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

  function safeGet() {
    try { return localStorage.getItem(KEY); } catch (_) { return null; }
  }
  function safeSet(v) {
    try { localStorage.setItem(KEY, v); } catch (_) {}
  }
  function safeDel() {
    try { localStorage.removeItem(KEY); } catch (_) {}
  }

  return {
    save(state, revealedHints) {
      const payload = {
        v: 1,
        ts: Date.now(),
        screen: state.screen,
        qIndex: state.qIndex,
        answers: state.answers,
        revealedHints: Array.from(revealedHints || []),
      };
      try { safeSet(JSON.stringify(payload)); } catch (_) {}
    },
    load() {
      const raw = safeGet();
      if (!raw) return null;
      try {
        const data = JSON.parse(raw);
        if (!data || data.v !== 1) return null;
        if (Date.now() - data.ts > MAX_AGE_MS) { safeDel(); return null; }
        return data;
      } catch (_) {
        safeDel();
        return null;
      }
    },
    clear() { safeDel(); },
  };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = Persistence;
}
