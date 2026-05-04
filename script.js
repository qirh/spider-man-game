// QUESTIONS, RANKS, calculateScore, getRank, and shorten live in
// scoring.js — loaded as a separate <script> tag so the same logic can
// be required from Node tests.

const state = {
  screen: "welcome",
  qIndex: 0,
  answers: [],
};

const focusedFills = new Set();
const revealedHints = new Set();
let prevScreenKey = null;
let introPlayed = false;
let wrongAnswerMessageIndex = 0;
let correctAnswerMessageIndex = 0;

// Hydrate from localStorage if a recent in-progress session exists.
(function hydrate() {
  const saved = Persistence.load();
  if (!saved) return;
  if (saved.screen === "question" && Array.isArray(saved.answers)) {
    state.screen = saved.screen;
    state.qIndex = Math.max(0, Math.min(saved.qIndex || 0, QUESTIONS.length - 1));
    state.answers = saved.answers;
    (saved.revealedHints || []).forEach((i) => revealedHints.add(i));
    introPlayed = true;
  }
})();

function persist() {
  Persistence.save(state, revealedHints);
}
let activeMatchDrag = null;
let suppressNextMatchClick = false;

const MATCH_DRAG_THRESHOLD = 6;
const app = document.getElementById("app");

function screenKey() {
  if (state.screen === "welcome") return "welcome";
  if (state.screen === "results") return "results";
  return `q-${state.qIndex}`;
}

function render() {
  const key = screenKey();
  const isTransition = key !== prevScreenKey;
  prevScreenKey = key;

  if (isTransition) clearFeedbackSplash();
  app.innerHTML = "";
  if (state.screen === "welcome") renderWelcome();
  else if (state.screen === "question") renderQuestion();
  else if (state.screen === "results") renderResults();

  if (isTransition) {
    const screenEl = app.querySelector(".screen");
    if (screenEl) screenEl.classList.add("animate-in");
  }
}

const SPIDERMAN_PIXEL_ART = `
✨✨✨✨✨✨✨✨✨⬜✨✨✨✨✨✨✨✨✨
✨✨✨✨✨✨✨✨✨⬜✨✨✨✨✨✨✨✨✨
✨✨✨✨✨✨✨✨✨⬜✨✨✨✨✨✨✨✨✨
✨✨✨✨✨✨✨✨✨⬜✨✨✨✨✨✨✨✨✨
✨✨✨✨✨✨✨⬛⬛⬜⬛⬛✨✨✨✨✨✨✨
✨✨✨✨✨✨✨⬛🟥⬜🟥⬛✨✨✨✨✨✨✨
✨✨✨✨✨✨⬛🟥🟥⬜🟥🟥⬛✨✨✨✨✨✨
✨✨✨⬛⬛⬛🟥🟥🟥⬜🟥🟥🟥⬛⬛⬛✨✨✨
✨⬛⬛🟦🟦🟦🟦🟥🟥⬜🟥🟥🟦🟦🟦🟦⬛⬛✨
⬛🟦🟦🟦🟦🟦🟦⬛⬛⬜⬛⬛🟦🟦🟦🟦🟦🟦⬛
⬛🟦🟦🟦🟦🟦⬛✨✨⬜✨✨⬛🟦🟦🟦🟦🟦⬛
✨⬛🟦🟦🟦🟦🟦⬛⬛⬜⬛⬛🟦🟦🟦🟦🟦⬛✨
✨✨⬛🟦🟦🟦🟦🟦🟦⬜🟦🟦🟦🟦🟦🟦⬛✨✨
✨✨✨⬛🟦🟦🟦🟦🟦⬜🟦🟦🟦🟦🟦⬛✨✨✨
✨✨✨✨⬛⬛⬛⬛⬛⬜⬛⬛⬛⬛⬛✨✨✨✨
✨✨✨✨⬛🟥🟥🟥⬛⬜⬛🟥🟥🟥⬛✨✨✨✨
✨✨✨⬛🟥🟥🟥🟥⬛🟥⬛🟥🟥🟥🟥⬛✨✨✨
✨✨⬛🟥🟥🟥🟥🟥⬛🟥⬛🟥🟥🟥🟥🟥⬛✨✨
✨✨⬛🟥🟥🟥⬛⬛🟥🟥🟥⬛⬛🟥🟥🟥⬛✨✨
✨⬛🟥🟥🟦⬛🟦🟥🟥🟥🟥🟥🟦⬛🟦🟥🟥⬛✨
⬛🟥🟥🟦⬛🟦🟥⬛⬛⬛⬛⬛🟥🟦⬛🟦🟥🟥⬛
⬛🟥🟦⬛🟥🟥⬛🟥🟥🟥🟥🟥⬛🟥🟥⬛🟦🟥⬛
⬛🟥⬛🟥🟥⬛🟥🟥🟥🟥🟥🟥🟥⬛🟥🟥⬛🟥⬛
⬛🟥⬛🟥⬛🟥🟥🟥🟥🟥🟥🟥🟥🟥⬛🟥⬛🟥⬛
✨⬛⬛⬛⬛🟥🟥🟥🟥🟥🟥🟥🟥🟥⬛⬛⬛⬛✨
✨✨✨✨⬛🟥🟥⬛⬛🟥⬛⬛🟥🟥⬛✨✨✨✨
✨✨✨✨⬛🟥⬛⬜⬛🟥⬛⬜⬛🟥⬛✨✨✨✨
✨✨✨✨⬛🟥⬛⬜⬛🟥⬛⬜⬛🟥⬛✨✨✨✨
✨✨✨✨⬛🟥⬛⬛⬛🟥⬛⬛⬛🟥⬛✨✨✨✨
✨✨✨✨⬛🟥⬛🟥🟥🟥🟥🟥⬛🟥⬛✨✨✨✨
✨✨✨✨⬛🟥🟥🟥🟥🟥🟥🟥🟥🟥⬛✨✨✨✨
✨✨✨✨✨⬛🟥🟥🟥🟥🟥🟥🟥⬛✨✨✨✨✨
✨✨✨✨✨✨⬛⬛🟥🟥🟥⬛⬛✨✨✨✨✨✨
✨✨✨✨✨✨✨✨⬛⬛⬛✨✨✨✨✨✨✨✨
`;

const SPIDERMAN_PIXEL_COLORS = {
  "⬛": "#0A0A0A",
  "🟥": "#E23531",
  "🟦": "#2A4FB0",
  "⬜": "#FFFFFF",
};

let spidermanPixelSvgCache = null;

function buildSpidermanPixelSvg() {
  if (spidermanPixelSvgCache) return spidermanPixelSvgCache;
  const rows = SPIDERMAN_PIXEL_ART.split("\n")
    .map((line) => Array.from(line.replace(/[︎️]/g, "").trim()))
    .filter((row) => row.length > 0);

  // The art prefixes the figure with a few thread-only rows; the .thread div
  // already supplies a long hanging thread, so crop everything above the first
  // row that contains an outline pixel.
  const firstFigureRow = rows.findIndex((row) => row.includes("⬛"));
  const cropped = firstFigureRow > 0 ? rows.slice(firstFigureRow) : rows;
  const h = cropped.length;
  const w = cropped[0].length;

  const rects = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const fill = SPIDERMAN_PIXEL_COLORS[cropped[y][x]];
      if (!fill) continue;
      rects.push(`<rect x="${x}" y="${y}" width="1.02" height="1.02" fill="${fill}"/>`);
    }
  }
  spidermanPixelSvgCache = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet" shape-rendering="crispEdges" aria-hidden="true">${rects.join("")}</svg>`;
  return spidermanPixelSvgCache;
}

function renderWelcome() {
  const screen = el("div", "screen welcome");
  if (!introPlayed) screen.classList.add("intro");
  screen.innerHTML = `
    <div class="hanging">
      <div class="thread"></div>
      <div class="spider spider-pixel">${buildSpidermanPixelSvg()}</div>
    </div>
    <h1 class="title">SPIDER-MAN<br/>SUNNYSIDE<br/>CHALLENGE</h1>
    <p class="tagline">Test your spidey-sense</p>
  `;
  const btn = el("button", "btn btn-bottom", "BEGIN");
  btn.addEventListener("click", startQuiz);
  screen.appendChild(btn);
  screen.appendChild(buildAboutBlock());
  app.appendChild(screen);

  if (!introPlayed) {
    introPlayed = true;
    // Cold page loads are not user-activated in mobile browsers, so the
    // first intro stays visual-only instead of constructing Web Audio early.
    playIntro();
  }
}

let spiderTeaserTimer = null;

function startSpiderTeasers() {
  stopSpiderTeasers();
  scheduleNextSpiderTeaser(2000 + Math.random() * 2500);
}

function stopSpiderTeasers() {
  if (spiderTeaserTimer) {
    clearTimeout(spiderTeaserTimer);
    spiderTeaserTimer = null;
  }
  document.querySelectorAll(".spider-swing").forEach((node) => node.remove());
}

function scheduleNextSpiderTeaser(delay = 5000 + Math.random() * 5000) {
  spiderTeaserTimer = setTimeout(() => {
    spiderTeaserTimer = null;
    spawnSwingingSpider();
    scheduleNextSpiderTeaser();
  }, delay);
}

function spawnSwingingSpider() {
  const root = document.createElement("div");
  root.className = "spider-swing";
  root.setAttribute("aria-hidden", "true");

  const goRight = Math.random() < 0.5;
  const topPct = 2 + Math.random() * 78;
  const threadLen = 30 + Math.random() * 220;
  const duration = 2200 + Math.random() * 2200;
  const fontSize = 22 + Math.random() * 22;

  const thread = document.createElement("div");
  thread.className = "spider-swing-thread";
  thread.style.height = `${threadLen}px`;

  const body = document.createElement("div");
  body.className = "spider-swing-body";
  body.textContent = "🦸‍♂️";
  body.style.fontSize = `${fontSize}px`;

  root.appendChild(thread);
  root.appendChild(body);
  root.style.top = `${topPct}%`;

  document.body.appendChild(root);

  const startVw = goRight ? -22 : 122;
  const endVw = goRight ? 122 : -22;
  const midVw = startVw * 0.5 + endVw * 0.5;
  const swingMag = 8 + Math.random() * 16;
  const midRot = goRight ? swingMag : -swingMag;

  const anim = root.animate(
    [
      { transform: `translateX(${startVw}vw) rotate(0deg)` },
      { transform: `translateX(${midVw}vw) rotate(${midRot}deg)`, offset: 0.5 },
      { transform: `translateX(${endVw}vw) rotate(0deg)` },
    ],
    { duration, easing: "ease-in-out" }
  );
  anim.onfinish = () => root.remove();
  anim.oncancel = () => root.remove();
}

function playIntro() {
  const overlay = document.createElement("div");
  overlay.className = "web-crack";
  overlay.setAttribute("aria-hidden", "true");
  const radii = [18, 36, 56, 78];
  const spokes = Array.from({ length: 16 }).map((_, i) => {
    const a = (i * Math.PI * 2) / 16;
    const len = 90 + (i % 3) * 4;
    return `<line x1="0" y1="0" x2="${(Math.cos(a) * len).toFixed(2)}" y2="${(Math.sin(a) * len).toFixed(2)}"/>`;
  }).join("");
  const rings = radii.map((r) => {
    const pts = Array.from({ length: 16 }).map((_, i) => {
      const a = (i * Math.PI * 2) / 16;
      const j = i % 2 === 0 ? 0.94 : 1.04;
      return `${(Math.cos(a) * r * j).toFixed(2)},${(Math.sin(a) * r * j).toFixed(2)}`;
    });
    return `<polygon points="${pts.join(" ")}" stroke-opacity="0.7"/>`;
  }).join("");
  overlay.innerHTML = `
    <div class="crack-flash"></div>
    <svg viewBox="-100 -100 200 200" xmlns="http://www.w3.org/2000/svg">
      <g fill="none" stroke="white" stroke-width="0.6" stroke-linecap="round" opacity="0.85">
        ${spokes}
        ${rings}
      </g>
      <circle cx="0" cy="0" r="4" fill="white"/>
    </svg>
  `;
  document.body.appendChild(overlay);
  setTimeout(() => overlay.remove(), 1200);
}

function startQuiz() {
  cancelActiveMatchDrag();
  AudioFx.introBoom();
  state.screen = "question";
  state.qIndex = 0;
  state.answers = [];
  focusedFills.clear();
  revealedHints.clear();
  Persistence.clear();
  persist();
  render();
}

function renderQuestion() {
  const q = QUESTIONS[state.qIndex];
  const screen = el("div", "screen");

  const back = el("button", "back-btn", "← BACK");
  back.addEventListener("click", prevQuestion);
  screen.appendChild(back);

  const progress = el("div", "progress");
  for (let i = 0; i < QUESTIONS.length; i++) {
    const dot = el("div", "progress-dot");
    if (i < state.qIndex) dot.classList.add("done");
    if (i === state.qIndex) dot.classList.add("active");
    progress.appendChild(dot);
  }
  screen.appendChild(progress);

  const labelText =
    q.label || `QUESTION ${state.qIndex + 1} / ${QUESTIONS.length}`;
  screen.appendChild(el("div", "q-label", labelText));
  screen.appendChild(renderPointTracker(q));

  if (q.type === "mc") renderMC(screen, q);
  else if (q.type === "fill") renderFill(screen, q);
  else if (q.type === "match") renderMatch(screen, q);

  app.appendChild(screen);
}

function renderMC(screen, q) {
  screen.appendChild(el("div", "q-text", q.prompt));

  const choices = el("div", "choices");
  const buttons = [];

  function updateNextState() {
    const selected = state.answers[state.qIndex];
    const hasAnswer = selected !== undefined;
    const isCorrect = isCorrectChoice(q, selected);
    next.disabled = q.requireCorrect ? !isCorrect : !hasAnswer;
  }

  q.choices.forEach((c, i) => {
    const btn = el("button", "choice");
    btn.appendChild(el("span", "choice-num", choiceShortcutLabel(i)));
    btn.appendChild(el("span", "choice-text", c));
    if (state.answers[state.qIndex] === i) btn.classList.add("selected");
    btn.addEventListener("click", () => {
      state.answers[state.qIndex] = i;
      buttons.forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
      if (q.requireCorrect) {
        if (isCorrectChoice(q, i)) {
          showFeedbackSplash(nextCorrectAnswerMessage(), { success: true });
        } else {
          showFeedbackSplash(nextWrongAnswerMessage());
        }
      }
      updateNextState();
      updatePointTracker();
      persist();
    });
    buttons.push(btn);
    choices.appendChild(btn);
  });
  screen.appendChild(choices);

  const next = nextButton();
  updateNextState();
  screen.appendChild(next);
}

function choiceShortcutLabel(i) {
  if (i < 9) return String(i + 1);
  const letterIndex = i - 9;
  if (letterIndex < 26) return String.fromCharCode(97 + letterIndex);
  return String(i + 1);
}

function choiceIndexFromKey(key, choiceCount) {
  if (/^[1-9]$/.test(key)) {
    const idx = parseInt(key, 10) - 1;
    return idx < choiceCount ? idx : -1;
  }
  if (/^[a-zA-Z]$/.test(key) && choiceCount > 9) {
    const letterIndex = key.toLowerCase().charCodeAt(0) - 97;
    const idx = 9 + letterIndex;
    return idx < choiceCount ? idx : -1;
  }
  return -1;
}

function isCorrectChoice(q, choiceIndex) {
  const accepted = Array.isArray(q.answer) ? q.answer : [q.answer];
  return accepted.includes(choiceIndex);
}

let activeFeedbackSplash = null;
let feedbackSplashHideTimer = null;
let feedbackSplashRemoveTimer = null;

function clearFeedbackSplash() {
  if (feedbackSplashHideTimer) {
    clearTimeout(feedbackSplashHideTimer);
    feedbackSplashHideTimer = null;
  }
  if (feedbackSplashRemoveTimer) {
    clearTimeout(feedbackSplashRemoveTimer);
    feedbackSplashRemoveTimer = null;
  }
  if (activeFeedbackSplash && activeFeedbackSplash.parentNode) {
    activeFeedbackSplash.parentNode.removeChild(activeFeedbackSplash);
  }
  activeFeedbackSplash = null;
}

function showFeedbackSplash(message, { success = false } = {}) {
  if (!message) return;
  clearFeedbackSplash();
  const splash = el("div", `feedback-splash${success ? " success" : ""}`, message);
  splash.setAttribute("role", "status");
  splash.setAttribute("aria-live", "polite");
  document.body.appendChild(splash);
  // Force reflow so the entry transition runs.
  void splash.offsetWidth;
  splash.classList.add("show");
  activeFeedbackSplash = splash;
  feedbackSplashHideTimer = setTimeout(() => {
    feedbackSplashHideTimer = null;
    splash.classList.remove("show");
    splash.classList.add("leave");
    feedbackSplashRemoveTimer = setTimeout(() => {
      feedbackSplashRemoveTimer = null;
      if (splash.parentNode) splash.parentNode.removeChild(splash);
      if (activeFeedbackSplash === splash) activeFeedbackSplash = null;
    }, 320);
  }, 1300);
}

function currentCorrectAnswerMessage() {
  const messages =
    typeof CORRECT_ANSWER_MESSAGES !== "undefined" && CORRECT_ANSWER_MESSAGES.length
      ? CORRECT_ANSWER_MESSAGES
      : ["wise choice"];
  return messages[correctAnswerMessageIndex % messages.length];
}

function nextCorrectAnswerMessage() {
  const message = currentCorrectAnswerMessage();
  correctAnswerMessageIndex++;
  return message;
}

function nextWrongAnswerMessage() {
  const messages =
    typeof WRONG_ANSWER_MESSAGES !== "undefined" && WRONG_ANSWER_MESSAGES.length
      ? WRONG_ANSWER_MESSAGES
      : ["Wrong answer"];
  const message = messages[wrongAnswerMessageIndex % messages.length];
  wrongAnswerMessageIndex++;
  return message;
}

function renderFill(screen, q) {
  screen.classList.add("fill-screen");

  const card = el("div", "jeopardy");
  card.appendChild(el("div", "jeopardy-prompt", q.prompt));
  screen.appendChild(card);

  const input = el("input", "jeopardy-input");
  input.type = "text";
  input.placeholder = q.placeholder || "";
  input.autocomplete = "off";
  input.autocapitalize = "off";
  input.spellcheck = false;
  input.value = state.answers[state.qIndex] || "";
  input.addEventListener("input", (e) => {
    state.answers[state.qIndex] = e.target.value;
    next.disabled = !e.target.value.trim();
    updatePointTracker();
    persist();
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && (state.answers[state.qIndex] || "").trim()) {
      e.preventDefault();
      input.blur();
      nextQuestion();
    }
  });
  screen.appendChild(input);

  if (q.hint) {
    const wrap = el("div", "hint-wrap");
    if (revealedHints.has(state.qIndex)) {
      wrap.appendChild(el("div", "hint-text", `💡 ${q.hint}`));
    } else {
      const hintBtn = el("button", "hint-btn", "💡 NEED A HINT?");
      hintBtn.addEventListener("click", () => {
        revealedHints.add(state.qIndex);
        wrap.innerHTML = "";
        wrap.appendChild(el("div", "hint-text", `💡 ${q.hint}`));
        persist();
      });
      wrap.appendChild(hintBtn);
    }
    screen.appendChild(wrap);
  }

  const next = nextButton();
  next.disabled = !(state.answers[state.qIndex] || "").trim();
  screen.appendChild(next);

  input.addEventListener("focus", () => {
    setTimeout(() => next.scrollIntoView({ block: "nearest" }), 250);
  });

  if (!focusedFills.has(state.qIndex)) {
    focusedFills.add(state.qIndex);
    setTimeout(() => input.focus(), 60);
  }
}

function getPairs() {
  if (!state.answers[state.qIndex]) state.answers[state.qIndex] = {};
  return state.answers[state.qIndex];
}

function renderMatch(screen, q) {
  clearKbMatchPending();
  screen.appendChild(el("div", "q-text", q.prompt));
  const baseHelp = q.help || "Draw a line from each item to its match.";
  screen.appendChild(
    el("div", "match-help", `${baseHelp} On a keyboard, type a number then a letter (e.g. "1a") to pair.`),
  );

  const pairs = getPairs();

  const grid = el("div", "match-grid");
  const linesSvg = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "svg",
  );
  linesSvg.setAttribute("class", "match-lines");
  grid.appendChild(linesSvg);

  const leftCol = el("div", "match-col");
  const rightCol = el("div", "match-col");

  // Pair numbers reflect order of pairing (insertion order of the pairs object).
  const pairNums = {};
  let n = 1;
  for (const leftId of Object.keys(pairs)) {
    pairNums[leftId] = n;
    pairNums[pairs[leftId]] = n;
    n++;
  }

  q.left.forEach((item, i) => {
    const cell = el("button", "match-item");
    cell.dataset.leftId = item.id;
    cell.appendChild(el("span", "match-kb-shortcut", `${i + 1}`));
    renderMatchItemContent(cell, item);
    if (pairs[item.id]) {
      cell.classList.add("matched");
      cell.appendChild(el("span", "pair-num", String(pairNums[item.id])));
    }
    cell.addEventListener("pointerdown", (e) => startMatchDrag(e, item.id));
    cell.addEventListener("click", (e) => onMatchLeftClick(e, item.id));
    leftCol.appendChild(cell);
  });

  q.right.forEach((item, i) => {
    const cell = el("button", "match-item");
    cell.dataset.rightId = item.id;
    cell.appendChild(
      el("span", "match-kb-shortcut", String.fromCharCode(97 + i)),
    );
    renderMatchItemContent(cell, item);
    const matchedLeft = Object.keys(pairs).find((k) => pairs[k] === item.id);
    if (matchedLeft) {
      cell.classList.add("matched");
      cell.appendChild(el("span", "pair-num", String(pairNums[item.id])));
    }
    cell.addEventListener("click", (e) => onMatchRightClick(e, item.id));
    rightCol.appendChild(cell);
  });

  grid.appendChild(leftCol);
  grid.appendChild(rightCol);
  screen.appendChild(grid);

  requestAnimationFrame(redrawMatchLines);

  const next = nextButton();
  next.disabled = Object.keys(pairs).length !== q.left.length;
  screen.appendChild(next);
}

function renderMatchItemContent(cell, item) {
  if (item.imageUrl) {
    cell.classList.add("match-image-item");
    cell.style.setProperty("--match-image", `url("${item.imageUrl}")`);
    cell.style.setProperty(
      "--match-image-position",
      item.imagePosition || "center",
    );
    cell.style.setProperty("--match-image-size", item.imageSize || "cover");
    cell.appendChild(el("span", "match-image-label", item.label));
    return;
  }

  if (item.emoji) cell.appendChild(el("span", "emoji-icon", item.emoji));
  cell.appendChild(el("span", null, item.label));
}

function onMatchLeftClick(e, id) {
  if (consumeSuppressedMatchClick(e)) return;
  const pairs = getPairs();
  if (pairs[id]) {
    delete pairs[id];
    render();
  }
}

function onMatchRightClick(e, id) {
  if (consumeSuppressedMatchClick(e)) return;
  const pairs = getPairs();
  const matchedLeft = Object.keys(pairs).find((k) => pairs[k] === id);
  if (matchedLeft) {
    delete pairs[matchedLeft];
    render();
  }
}

function nextButton() {
  const isLast = state.qIndex === QUESTIONS.length - 1;
  const btn = el("button", "btn btn-bottom", isLast ? "SEE RESULTS" : "NEXT");
  btn.addEventListener("click", () => {
    if (!isLast) AudioFx.advance();
    nextQuestion();
  });
  return btn;
}

function nextQuestion() {
  cancelActiveMatchDrag();
  state.qIndex++;
  if (state.qIndex >= QUESTIONS.length) {
    state.screen = "results";
    Persistence.clear();
  } else {
    persist();
  }
  render();
  scrollToTop();
}

function prevQuestion() {
  cancelActiveMatchDrag();
  if (state.qIndex === 0) {
    state.screen = "welcome";
    Persistence.clear();
  } else {
    state.qIndex--;
    persist();
  }
  render();
  scrollToTop();
}

function prevQuestionFromKeyboard() {
  if (state.screen === "results") {
    cancelActiveMatchDrag();
    state.screen = "question";
    state.qIndex = QUESTIONS.length - 1;
    render();
    scrollToTop();
    return;
  }

  prevQuestion();
}

function nextQuestionFromKeyboard() {
  const q = QUESTIONS[state.qIndex];
  if (!canKeyboardAdvance(q)) {
    showRequiredChoiceFeedback();
    return;
  }

  nextQuestion();
}

function canKeyboardAdvance(q) {
  return !q.requireCorrect || isCorrectChoice(q, state.answers[state.qIndex]);
}

function showRequiredChoiceFeedback() {
  const feedback = document.querySelector(".choice-error");
  if (feedback) setChoiceFeedback(feedback, nextWrongAnswerMessage());
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "instant" });
}

function renderResults() {
  const { score, total, breakdown } = calculateScore(state.answers);
  const rank = getRank(score);

  const screen = el("div", "screen");

  screen.appendChild(el("div", "results-eyebrow", "MISSION COMPLETE"));

  const scoreWrap = el("div", "score-display");
  scoreWrap.appendChild(el("div", "score-number", String(score)));
  scoreWrap.appendChild(el("div", "score-total", `OUT OF ${total}`));
  screen.appendChild(scoreWrap);

  const ranksList = el("div", "rank-list");
  RANKS.forEach((r, i) => {
    const next = RANKS[i + 1];
    const range = next ? `${r.min}–${next.min - 1}` : `${r.min}–${total}`;

    const row = el("div", "rank-row");
    if (score >= r.min) row.classList.add("achieved");
    if (r === rank) row.classList.add("current");

    const main = el("div", "rank-row-main");
    main.appendChild(el("span", "rank-row-title", r.title));
    main.appendChild(el("span", "rank-row-min", range));
    row.appendChild(main);
    row.appendChild(el("div", "rank-row-blurb", r.blurb));
    ranksList.appendChild(row);
  });
  screen.appendChild(ranksList);

  const list = el("div", "breakdown");
  breakdown.forEach((b) => {
    const row = el("div", "breakdown-row");
    row.appendChild(el("span", null, b.label));
    const isPerfect = b.got === b.possible;
    const cls = isPerfect ? "mark right" : b.got === 0 ? "mark wrong" : "mark";
    row.appendChild(el("span", cls, `${b.got} / ${b.possible}`));
    list.appendChild(row);
  });
  screen.appendChild(list);

  const restart = el("button", "btn btn-bottom", "PLAY AGAIN");
  restart.style.marginTop = "28px";
  restart.addEventListener("click", startQuiz);
  screen.appendChild(restart);

  screen.appendChild(buildAboutBlock());

  app.appendChild(screen);
}

function buildAboutBlock() {
  const about = el("div", "about-block");
  about.innerHTML = `
    <p>
      This game was made by me, Saleh
      (<a href="mailto:saleh@alghusson.com">saleh@alghusson.com</a>).
      The purpose was to have an interactive activity during my tour
      <a
        href="https://www.mas.org/events/a-friendly-neighborhood-tour-of-sunnyside-with-a-focus-on-spider-man/"
        target="_blank"
        rel="noopener"
        >A Friendly Neighborhood Tour of Sunnyside (with a focus on Spider-Man)</a
      >
      as part of Jane's Walk festival 2026 in NYC.
      Feel free to play it, I'd love any feedback you have, please email it to me.
    </p>
    <p>
      And if you are in the NYC area and you got a high score,
      I do have some prizes left from the tour (as of writing this),
      so lmk and you may possibly win a v small and tiny prize.
    </p>
  `;
  return about;
}

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined && text !== null) e.textContent = text;
  return e;
}

const SVG_NS = "http://www.w3.org/2000/svg";

function redrawMatchLines() {
  if (state.screen !== "question") return;
  const q = QUESTIONS[state.qIndex];
  if (q.type !== "match") return;
  const grid = document.querySelector(".match-grid");
  const svg = grid && grid.querySelector(".match-lines");
  if (!grid || !svg) return;

  const pairs = getPairs();
  const gridRect = grid.getBoundingClientRect();
  svg.setAttribute("viewBox", `0 0 ${gridRect.width} ${gridRect.height}`);
  svg.setAttribute("width", String(gridRect.width));
  svg.setAttribute("height", String(gridRect.height));
  svg.innerHTML = "";

  Object.keys(pairs).forEach((leftId) => {
    if (activeMatchDrag && activeMatchDrag.leftId === leftId) return;

    const rightId = pairs[leftId];
    const leftCell = grid.querySelector(`[data-left-id="${leftId}"]`);
    const rightCell = grid.querySelector(`[data-right-id="${rightId}"]`);
    if (!leftCell || !rightCell) return;

    const start = getLeftAnchor(leftCell, gridRect);
    const end = getRightAnchor(rightCell, gridRect);
    appendWebConnection(svg, start, end);
  });
}

function startMatchDrag(e, leftId) {
  if (e.button !== undefined && e.button !== 0) return;

  const grid = e.currentTarget.closest(".match-grid");
  const svg = grid && grid.querySelector(".match-lines");
  if (!grid || !svg) return;

  cancelActiveMatchDrag();

  activeMatchDrag = {
    pointerId: e.pointerId,
    leftId,
    source: e.currentTarget,
    grid,
    svg,
    startClientX: e.clientX,
    startClientY: e.clientY,
    moved: false,
    dropTarget: null,
    preview: null,
  };

  activeMatchDrag.source.classList.add("drawing-source");
  activeMatchDrag.grid.classList.add("drawing");
  document.body.classList.add("match-dragging");

  if (activeMatchDrag.source.setPointerCapture) {
    activeMatchDrag.source.setPointerCapture(e.pointerId);
  }

  window.addEventListener("pointermove", onMatchPointerMove);
  window.addEventListener("pointerup", onMatchPointerUp);
  window.addEventListener("pointercancel", onMatchPointerCancel);
  document.addEventListener("touchmove", preventScrollWhileDragging, {
    passive: false,
  });

  redrawMatchLines();
  createMatchPreview();
  updateMatchPreview(e.clientX, e.clientY);
  e.preventDefault();
}

function onMatchPointerMove(e) {
  if (!activeMatchDrag || e.pointerId !== activeMatchDrag.pointerId) return;

  const dx = e.clientX - activeMatchDrag.startClientX;
  const dy = e.clientY - activeMatchDrag.startClientY;
  if (Math.hypot(dx, dy) >= MATCH_DRAG_THRESHOLD) {
    activeMatchDrag.moved = true;
  }

  updateMatchPreview(e.clientX, e.clientY);
  e.preventDefault();
}

function onMatchPointerUp(e) {
  if (!activeMatchDrag || e.pointerId !== activeMatchDrag.pointerId) return;

  const { leftId } = activeMatchDrag;
  const target = getRightTargetAt(e.clientX, e.clientY);
  const wasDrag = activeMatchDrag.moved;
  let shouldRender = false;

  if (target) {
    setMatchPair(leftId, target.dataset.rightId);
    shouldRender = true;
  } else if (!wasDrag) {
    const pairs = getPairs();
    if (pairs[leftId]) {
      delete pairs[leftId];
      shouldRender = true;
    }
  }

  if (shouldRender || wasDrag) suppressSyntheticMatchClick();
  finishMatchDrag({ renderAfter: shouldRender });
  e.preventDefault();
}

function onMatchPointerCancel(e) {
  if (!activeMatchDrag || e.pointerId !== activeMatchDrag.pointerId) return;
  finishMatchDrag();
}

function setMatchPair(leftId, rightId) {
  const pairs = getPairs();
  Object.keys(pairs).forEach((key) => {
    if (key !== leftId && pairs[key] === rightId) delete pairs[key];
  });
  pairs[leftId] = rightId;
  persist();
}

let kbMatchPending = { left: null, right: null };

function clearKbMatchPending() {
  kbMatchPending.left = null;
  kbMatchPending.right = null;
  document
    .querySelectorAll(".match-item.kb-pending")
    .forEach((el) => el.classList.remove("kb-pending"));
}

function updateKbMatchHighlights(q) {
  document
    .querySelectorAll(".match-item.kb-pending")
    .forEach((el) => el.classList.remove("kb-pending"));
  if (kbMatchPending.left != null) {
    const item = q.left[kbMatchPending.left];
    const cell = item && document.querySelector(`[data-left-id="${item.id}"]`);
    if (cell) cell.classList.add("kb-pending");
  }
  if (kbMatchPending.right != null) {
    const item = q.right[kbMatchPending.right];
    const cell = item && document.querySelector(`[data-right-id="${item.id}"]`);
    if (cell) cell.classList.add("kb-pending");
  }
}

function tryKbMatchPair(q) {
  if (kbMatchPending.left == null || kbMatchPending.right == null) return;
  const leftItem = q.left[kbMatchPending.left];
  const rightItem = q.right[kbMatchPending.right];
  if (!leftItem || !rightItem) return;
  setMatchPair(leftItem.id, rightItem.id);
  kbMatchPending.left = null;
  kbMatchPending.right = null;
  render();
}

function handleMatchKeyboard(q, e) {
  if (e.altKey || e.ctrlKey || e.metaKey) return false;

  if (e.key === "Escape" || e.key === "Backspace") {
    if (kbMatchPending.left == null && kbMatchPending.right == null) return false;
    e.preventDefault();
    clearKbMatchPending();
    return true;
  }

  if (/^[1-9]$/.test(e.key)) {
    const idx = parseInt(e.key, 10) - 1;
    if (idx >= q.left.length) return false;
    e.preventDefault();
    kbMatchPending.left = idx;
    updateKbMatchHighlights(q);
    tryKbMatchPair(q);
    return true;
  }

  if (/^[a-zA-Z]$/.test(e.key)) {
    const idx = e.key.toLowerCase().charCodeAt(0) - 97;
    if (idx >= q.right.length) return false;
    e.preventDefault();
    kbMatchPending.right = idx;
    updateKbMatchHighlights(q);
    tryKbMatchPair(q);
    return true;
  }

  return false;
}

function renderPointTracker(q) {
  const tracker = el("div", "point-tracker");

  const current = el("div", "point-stat");
  current.appendChild(el("span", "point-label", "POINTS"));
  const currentValue = el("strong", "point-value");
  currentValue.setAttribute("data-point-current", "true");
  current.appendChild(currentValue);

  const worth = el("div", "point-stat");
  worth.appendChild(el("span", "point-label", "THIS QUESTION"));
  worth.appendChild(
    el("strong", "point-value", `+${formatPoints(questionPoints(q))}`),
  );

  tracker.appendChild(current);
  tracker.appendChild(worth);
  updatePointTracker(tracker);
  return tracker;
}

function updatePointTracker(root = document) {
  const current = root.querySelector("[data-point-current]");
  if (!current) return;
  const completedAnswers = state.answers.slice(0, state.qIndex);
  const completedQuestions = QUESTIONS.slice(0, state.qIndex);
  const { score } = calculateScore(completedAnswers, completedQuestions);
  const { total } = calculateScore([]);
  current.textContent = `${score} / ${formatPoints(total)}`;
}

function formatPoints(points) {
  return `${points} ${points === 1 ? "PT" : "PTS"}`;
}

function createMatchPreview() {
  if (!activeMatchDrag) return;

  const line = document.createElementNS(SVG_NS, "path");
  line.setAttribute("class", "match-preview-line");

  const startDot = document.createElementNS(SVG_NS, "circle");
  startDot.setAttribute("class", "match-preview-dot");
  startDot.setAttribute("r", "4");

  const endDot = document.createElementNS(SVG_NS, "circle");
  endDot.setAttribute("class", "match-preview-dot");
  endDot.setAttribute("r", "4");

  activeMatchDrag.svg.appendChild(line);
  activeMatchDrag.svg.appendChild(startDot);
  activeMatchDrag.svg.appendChild(endDot);
  activeMatchDrag.preview = { line, startDot, endDot };
}

function updateMatchPreview(clientX, clientY) {
  if (!activeMatchDrag || !activeMatchDrag.preview) return;

  const { grid, source, preview } = activeMatchDrag;
  const gridRect = grid.getBoundingClientRect();
  const start = getLeftAnchor(source, gridRect);
  const target = getRightTargetAt(clientX, clientY);
  const end = target
    ? getRightAnchor(target, gridRect)
    : getPointInGrid(gridRect, clientX, clientY);

  preview.line.setAttribute("d", getWebGeometry(start, end).d);
  preview.startDot.setAttribute("cx", String(start.x));
  preview.startDot.setAttribute("cy", String(start.y));
  preview.endDot.setAttribute("cx", String(end.x));
  preview.endDot.setAttribute("cy", String(end.y));

  if (activeMatchDrag.dropTarget !== target) {
    if (activeMatchDrag.dropTarget) {
      activeMatchDrag.dropTarget.classList.remove("drop-target");
    }
    if (target) target.classList.add("drop-target");
    activeMatchDrag.dropTarget = target;
  }
}

function finishMatchDrag({ renderAfter = false } = {}) {
  if (!activeMatchDrag) return;

  const drag = activeMatchDrag;
  if (drag.source.releasePointerCapture && drag.source.hasPointerCapture?.(drag.pointerId)) {
    drag.source.releasePointerCapture(drag.pointerId);
  }

  window.removeEventListener("pointermove", onMatchPointerMove);
  window.removeEventListener("pointerup", onMatchPointerUp);
  window.removeEventListener("pointercancel", onMatchPointerCancel);
  document.removeEventListener("touchmove", preventScrollWhileDragging, {
    passive: false,
  });

  drag.source.classList.remove("drawing-source");
  drag.grid.classList.remove("drawing");
  document.body.classList.remove("match-dragging");
  if (drag.dropTarget) drag.dropTarget.classList.remove("drop-target");

  activeMatchDrag = null;

  if (renderAfter) render();
  else redrawMatchLines();
}

function cancelActiveMatchDrag() {
  if (activeMatchDrag) finishMatchDrag();
}

function preventScrollWhileDragging(e) {
  if (!activeMatchDrag) return;
  if (e.cancelable) e.preventDefault();
}

function getLeftAnchor(leftCell, gridRect) {
  const rect = leftCell.getBoundingClientRect();
  return {
    x: rect.right - gridRect.left,
    y: rect.top + rect.height / 2 - gridRect.top,
  };
}

function getRightAnchor(rightCell, gridRect) {
  const rect = rightCell.getBoundingClientRect();
  return {
    x: rect.left - gridRect.left,
    y: rect.top + rect.height / 2 - gridRect.top,
  };
}

function getPointInGrid(gridRect, clientX, clientY) {
  return {
    x: Math.max(0, Math.min(gridRect.width, clientX - gridRect.left)),
    y: Math.max(0, Math.min(gridRect.height, clientY - gridRect.top)),
  };
}

function appendWebConnection(svg, start, end) {
  const group = document.createElementNS(SVG_NS, "g");
  group.setAttribute("class", "web-connection");

  [-4, 4].forEach((offset) => {
    const strand = document.createElementNS(SVG_NS, "path");
    strand.setAttribute("class", "web-strand web-strand-side");
    strand.setAttribute("d", getWebGeometry(start, end, offset).d);
    group.appendChild(strand);
  });

  const geometry = getWebGeometry(start, end);
  const main = document.createElementNS(SVG_NS, "path");
  main.setAttribute("class", "web-strand web-strand-main");
  main.setAttribute("d", geometry.d);
  group.appendChild(main);

  [0.25, 0.5, 0.75].forEach((t, index) => {
    const thread = document.createElementNS(SVG_NS, "path");
    thread.setAttribute("class", "web-cross-thread");
    thread.setAttribute("d", getWebThreadPath(geometry, t, index));
    group.appendChild(thread);
  });

  [start, end].forEach((point) => {
    const knot = document.createElementNS(SVG_NS, "circle");
    knot.setAttribute("class", "web-knot");
    knot.setAttribute("cx", formatSvgNumber(point.x));
    knot.setAttribute("cy", formatSvgNumber(point.y));
    knot.setAttribute("r", "4");
    group.appendChild(knot);
  });

  svg.appendChild(group);
}

function getWebGeometry(start, end, offset = 0) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const distance = Math.hypot(dx, dy) || 1;
  const nx = -dy / distance;
  const ny = dx / distance;
  const bend = Math.max(10, Math.min(26, distance * 0.14));

  const p0 = offsetPoint(start, nx, ny, offset);
  const p3 = offsetPoint(end, nx, ny, offset);
  const p1 = {
    x: start.x + dx * 0.34 + nx * (bend + offset),
    y: start.y + dy * 0.34 + ny * (bend + offset),
  };
  const p2 = {
    x: start.x + dx * 0.66 + nx * (bend + offset),
    y: start.y + dy * 0.66 + ny * (bend + offset),
  };

  return {
    p0,
    p1,
    p2,
    p3,
    d: `M ${formatSvgPoint(p0)} C ${formatSvgPoint(p1)} ${formatSvgPoint(p2)} ${formatSvgPoint(p3)}`,
  };
}

function getWebThreadPath(geometry, t, index) {
  const point = getCubicPoint(geometry, t);
  const tangent = getCubicTangent(geometry, t);
  const length = Math.hypot(tangent.x, tangent.y) || 1;
  const ux = tangent.x / length;
  const uy = tangent.y / length;
  const nx = -uy;
  const ny = ux;
  const halfWidth = index === 1 ? 10 : 8;
  const skew = index === 1 ? 4 : -3;
  const from = {
    x: point.x - nx * halfWidth - ux * skew,
    y: point.y - ny * halfWidth - uy * skew,
  };
  const to = {
    x: point.x + nx * halfWidth + ux * skew,
    y: point.y + ny * halfWidth + uy * skew,
  };

  return `M ${formatSvgPoint(from)} L ${formatSvgPoint(to)}`;
}

function getCubicPoint({ p0, p1, p2, p3 }, t) {
  const mt = 1 - t;
  return {
    x:
      mt ** 3 * p0.x +
      3 * mt ** 2 * t * p1.x +
      3 * mt * t ** 2 * p2.x +
      t ** 3 * p3.x,
    y:
      mt ** 3 * p0.y +
      3 * mt ** 2 * t * p1.y +
      3 * mt * t ** 2 * p2.y +
      t ** 3 * p3.y,
  };
}

function getCubicTangent({ p0, p1, p2, p3 }, t) {
  const mt = 1 - t;
  return {
    x:
      3 * mt ** 2 * (p1.x - p0.x) +
      6 * mt * t * (p2.x - p1.x) +
      3 * t ** 2 * (p3.x - p2.x),
    y:
      3 * mt ** 2 * (p1.y - p0.y) +
      6 * mt * t * (p2.y - p1.y) +
      3 * t ** 2 * (p3.y - p2.y),
  };
}

function offsetPoint(point, nx, ny, offset) {
  return {
    x: point.x + nx * offset,
    y: point.y + ny * offset,
  };
}

function formatSvgPoint(point) {
  return `${formatSvgNumber(point.x)} ${formatSvgNumber(point.y)}`;
}

function formatSvgNumber(value) {
  return Number(value.toFixed(2));
}

function getRightTargetAt(clientX, clientY) {
  if (!activeMatchDrag) return null;

  const hit = document.elementFromPoint(clientX, clientY);
  const target = hit && hit.closest("[data-right-id]");
  return target && activeMatchDrag.grid.contains(target) ? target : null;
}

function suppressSyntheticMatchClick() {
  suppressNextMatchClick = true;
  setTimeout(() => {
    suppressNextMatchClick = false;
  }, 0);
}

function consumeSuppressedMatchClick(e) {
  if (!suppressNextMatchClick) return false;
  e.preventDefault();
  e.stopPropagation();
  return true;
}

let resizePending = false;
window.addEventListener("resize", () => {
  if (resizePending) return;
  resizePending = true;
  requestAnimationFrame(() => {
    resizePending = false;
    redrawMatchLines();
  });
});

function isEditableTarget(target) {
  if (!target) return false;
  return (
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.isContentEditable
  );
}

document.addEventListener("keydown", (e) => {
  if (isEditableTarget(e.target)) return;
  if (handleArrowNavigation(e)) return;

  if (state.screen === "question") {
    const q = QUESTIONS[state.qIndex];
    if (q.type === "mc") {
      const idx = choiceIndexFromKey(e.key, q.choices.length);
      if (idx >= 0) {
        e.preventDefault();
        const choiceEls = document.querySelectorAll(".choices .choice");
        const target = choiceEls[idx];
        if (target) target.click();
        return;
      }
    }
    if (q.type === "match") {
      if (handleMatchKeyboard(q, e)) return;
    }
  }

  if (e.key === "Enter") {
    const focused = e.target;
    const focusedTag = focused.tagName;
    if (focusedTag === "SELECT") return;
    if (focusedTag === "A") return;
    if (
      focused.classList &&
      (focused.classList.contains("back-btn") ||
        focused.classList.contains("hint-btn"))
    ) {
      return;
    }
    const btn = document.querySelector(".btn-bottom:not(:disabled)");
    if (btn) {
      e.preventDefault();
      btn.click();
    }
  }
});

function handleArrowNavigation(e) {
  if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return false;
  if (e.altKey || e.ctrlKey || e.metaKey) return false;

  if (state.screen === "welcome") {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      startQuiz();
      return true;
    }
    return false;
  }

  if (state.screen === "results") {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      prevQuestionFromKeyboard();
      return true;
    }
    return false;
  }

  if (state.screen !== "question") return false;

  e.preventDefault();
  if (e.key === "ArrowLeft") prevQuestionFromKeyboard();
  else nextQuestionFromKeyboard();
  return true;
}

// Mute toggle wiring
(function setupMute() {
  const btn = document.getElementById("mute-toggle");
  if (!btn) return;
  function sync() {
    const m = AudioFx.isMuted();
    btn.textContent = m ? "🔇" : "🔊";
    btn.classList.toggle("muted", m);
  }
  btn.addEventListener("click", () => {
    AudioFx.setMuted(!AudioFx.isMuted());
    sync();
  });
  sync();
})();

render();
startSpiderTeasers();
