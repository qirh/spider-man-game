// QUESTIONS, RANKS, calculateScore, getRank, and shorten live in
// scoring.js — loaded as a separate <script> tag so the same logic can
// be required from Node tests.

const state = {
  screen: "welcome",
  qIndex: 0,
  answers: [],
  matchSelectedLeft: null,
};

const focusedFills = new Set();
const revealedHints = new Set();
let prevScreenKey = null;

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

  app.innerHTML = "";
  if (state.screen === "welcome") renderWelcome();
  else if (state.screen === "question") renderQuestion();
  else if (state.screen === "results") renderResults();

  if (isTransition) {
    const screenEl = app.querySelector(".screen");
    if (screenEl) screenEl.classList.add("animate-in");
  }
}

function renderWelcome() {
  const screen = el("div", "screen welcome");
  screen.innerHTML = `
    <div class="hanging">
      <div class="thread"></div>
      <div class="spider">🕷️</div>
    </div>
    <h1 class="title">SPIDER-MAN<br/>SUNNYSIDE<br/>CHALLENGE</h1>
    <p class="tagline">Test your spidey-sense</p>
  `;
  const btn = el("button", "btn btn-bottom", "BEGIN");
  btn.addEventListener("click", startQuiz);
  screen.appendChild(btn);
  app.appendChild(screen);
}

function startQuiz() {
  state.screen = "question";
  state.qIndex = 0;
  state.answers = [];
  state.matchSelectedLeft = null;
  focusedFills.clear();
  revealedHints.clear();
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

  if (q.type === "mc") renderMC(screen, q);
  else if (q.type === "fill") renderFill(screen, q);
  else if (q.type === "match") renderMatch(screen, q);

  app.appendChild(screen);
}

function renderMC(screen, q) {
  screen.appendChild(el("div", "q-text", q.prompt));

  const choices = el("div", "choices");
  const buttons = [];
  q.choices.forEach((c, i) => {
    const btn = el("button", "choice");
    btn.appendChild(el("span", "choice-num", String(i + 1)));
    btn.appendChild(el("span", "choice-text", c));
    if (state.answers[state.qIndex] === i) btn.classList.add("selected");
    btn.addEventListener("click", () => {
      state.answers[state.qIndex] = i;
      buttons.forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
      next.disabled = false;
    });
    buttons.push(btn);
    choices.appendChild(btn);
  });
  screen.appendChild(choices);

  const next = nextButton();
  next.disabled = state.answers[state.qIndex] === undefined;
  screen.appendChild(next);
}

function renderFill(screen, q) {
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
      });
      wrap.appendChild(hintBtn);
    }
    screen.appendChild(wrap);
  }

  const next = nextButton();
  next.disabled = !(state.answers[state.qIndex] || "").trim();
  screen.appendChild(next);

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
  screen.appendChild(el("div", "q-text", q.prompt));
  screen.appendChild(
    el("div", "match-help", "Tap a villain, then tap their real name."),
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

  q.left.forEach((item) => {
    const cell = el("button", "match-item");
    cell.dataset.leftId = item.id;
    cell.appendChild(el("span", "emoji-icon", item.emoji));
    cell.appendChild(el("span", null, item.label));
    if (state.matchSelectedLeft === item.id) cell.classList.add("selected");
    if (pairs[item.id]) {
      cell.classList.add("matched");
      cell.appendChild(el("span", "pair-num", String(pairNums[item.id])));
    }
    cell.addEventListener("click", () => onMatchLeftClick(item.id));
    leftCol.appendChild(cell);
  });

  q.right.forEach((item) => {
    const cell = el("button", "match-item");
    cell.dataset.rightId = item.id;
    cell.appendChild(el("span", null, item.label));
    const matchedLeft = Object.keys(pairs).find((k) => pairs[k] === item.id);
    if (matchedLeft) {
      cell.classList.add("matched");
      cell.appendChild(el("span", "pair-num", String(pairNums[item.id])));
    }
    cell.addEventListener("click", () => onMatchRightClick(item.id));
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

function onMatchLeftClick(id) {
  const pairs = getPairs();
  if (pairs[id]) {
    delete pairs[id];
    state.matchSelectedLeft = null;
    render();
    return;
  }
  state.matchSelectedLeft = state.matchSelectedLeft === id ? null : id;
  render();
}

function onMatchRightClick(id) {
  const pairs = getPairs();
  const matchedLeft = Object.keys(pairs).find((k) => pairs[k] === id);
  if (matchedLeft) {
    delete pairs[matchedLeft];
    render();
    return;
  }
  if (state.matchSelectedLeft) {
    pairs[state.matchSelectedLeft] = id;
    state.matchSelectedLeft = null;
    render();
  }
}

function nextButton() {
  const isLast = state.qIndex === QUESTIONS.length - 1;
  const btn = el("button", "btn btn-bottom", isLast ? "SEE RESULTS" : "NEXT");
  btn.addEventListener("click", nextQuestion);
  return btn;
}

function nextQuestion() {
  state.matchSelectedLeft = null;
  state.qIndex++;
  if (state.qIndex >= QUESTIONS.length) {
    state.screen = "results";
  }
  render();
  window.scrollTo({ top: 0, behavior: "instant" });
}

function prevQuestion() {
  state.matchSelectedLeft = null;
  if (state.qIndex === 0) {
    state.screen = "welcome";
  } else {
    state.qIndex--;
  }
  render();
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
    const range = next ? `${r.min}–${next.min - 1}` : String(r.min);

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

  app.appendChild(screen);
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
    const rightId = pairs[leftId];
    const leftCell = grid.querySelector(`[data-left-id="${leftId}"]`);
    const rightCell = grid.querySelector(`[data-right-id="${rightId}"]`);
    if (!leftCell || !rightCell) return;

    const lr = leftCell.getBoundingClientRect();
    const rr = rightCell.getBoundingClientRect();

    const x1 = lr.right - gridRect.left;
    const y1 = lr.top + lr.height / 2 - gridRect.top;
    const x2 = rr.left - gridRect.left;
    const y2 = rr.top + rr.height / 2 - gridRect.top;

    const line = document.createElementNS(SVG_NS, "line");
    line.setAttribute("x1", String(x1));
    line.setAttribute("y1", String(y1));
    line.setAttribute("x2", String(x2));
    line.setAttribute("y2", String(y2));
    svg.appendChild(line);

    for (const [cx, cy] of [
      [x1, y1],
      [x2, y2],
    ]) {
      const c = document.createElementNS(SVG_NS, "circle");
      c.setAttribute("cx", String(cx));
      c.setAttribute("cy", String(cy));
      c.setAttribute("r", "4");
      svg.appendChild(c);
    }
  });
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

document.addEventListener("keydown", (e) => {
  if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

  if (state.screen === "question") {
    const q = QUESTIONS[state.qIndex];
    if (q.type === "mc") {
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= q.choices.length) {
        e.preventDefault();
        const choiceEls = document.querySelectorAll(".choices .choice");
        const target = choiceEls[num - 1];
        if (target) target.click();
        return;
      }
    }
  }

  if (e.key === "Enter") {
    // If focus is on a specific control (back, choice, hint, etc.), let
    // the browser activate that control instead of hijacking to the
    // primary button.
    const focusedTag = e.target.tagName;
    if (focusedTag === "BUTTON" || focusedTag === "A" || focusedTag === "SELECT") {
      return;
    }
    const btn = document.querySelector(".btn-bottom:not(:disabled)");
    if (btn) {
      e.preventDefault();
      btn.click();
    }
  }
});

render();
