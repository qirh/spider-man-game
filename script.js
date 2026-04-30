const QUESTIONS = [
  {
    type: "mc",
    prompt: "Who created Spider-Man?",
    choices: [
      "Stan Lee & Jack Kirby",
      "Stan Lee & Steve Ditko",
      "Bob Kane & Bill Finger",
      "Jerry Siegel & Joe Shuster",
    ],
    answer: 1,
  },
  {
    type: "fill",
    prompt: "WITH GREAT POWER COMES GREAT _______",
    placeholder: "your answer",
    answer: "responsibility",
    hint: "responsabilidad in spanish",
    label: "FILL IN THE BLANK",
  },
  {
    type: "mc",
    prompt: "What is the name of Peter Parker's high school?",
    choices: ["Midtown High", "Riverdale High", "Bayside High", "Westview High"],
    answer: 0,
  },
  {
    type: "match",
    prompt: "Match each villain to their real name.",
    left: [
      { id: "a", emoji: "🐙", label: "Doc Ock" },
      { id: "b", emoji: "🎃", label: "Green Goblin" },
      { id: "c", emoji: "🦅", label: "Vulture" },
      { id: "d", emoji: "🖤", label: "Venom" },
    ],
    right: [
      { id: "1", label: "Norman Osborn" },
      { id: "2", label: "Otto Octavius" },
      { id: "3", label: "Eddie Brock" },
      { id: "4", label: "Adrian Toomes" },
    ],
    pairs: { a: "2", b: "1", c: "4", d: "3" },
  },
  {
    type: "fill",
    prompt: "PETER PARKER'S BELOVED UNCLE WAS NAMED UNCLE _______",
    placeholder: "his first name",
    answer: "ben",
    hint: "Βενιαμίν in greek",
    label: "FILL IN THE BLANK",
  },
  {
    type: "mc",
    prompt: 'Who is the lead Spider-Man in "Into the Spider-Verse" (2018)?',
    choices: ["Peter Parker", "Ben Reilly", "Miles Morales", "Gwen Stacy"],
    answer: 2,
  },
];

const RANKS = [
  {
    min: 0,
    title: "CIVILIAN",
    blurb: "Better stick to the bus and let the heroes handle it.",
  },
  {
    min: 3,
    title: "FRIENDLY NEIGHBOR",
    blurb: "You know the basics. Spidey would wave.",
  },
  {
    min: 5,
    title: "WEB SLINGER",
    blurb: "Solid spidey-knowledge. J. Jonah would hate to admit it.",
  },
  {
    min: 7,
    title: "TRUE BELIEVER",
    blurb: "Excelsior! You know your Marvel.",
  },
  {
    min: 9,
    title: "SPIDER-SENSE MASTER",
    blurb: "With great trivia comes great responsibility.",
  },
];

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
    <h1 class="title">SPIDER-MAN<br/>CHALLENGE</h1>
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

function calculateScore() {
  let score = 0;
  let total = 0;
  const breakdown = [];

  QUESTIONS.forEach((q, i) => {
    if (q.type === "mc") {
      total += 1;
      const correct = state.answers[i] === q.answer;
      if (correct) score += 1;
      breakdown.push({
        label: shorten(q.prompt),
        got: correct ? 1 : 0,
        possible: 1,
      });
    } else if (q.type === "fill") {
      total += 1;
      const ans = (state.answers[i] || "").trim().toLowerCase();
      const correct = ans === q.answer.toLowerCase();
      if (correct) score += 1;
      breakdown.push({
        label: `Fill-in: "${q.answer}"`,
        got: correct ? 1 : 0,
        possible: 1,
      });
    } else if (q.type === "match") {
      total += q.left.length;
      const userPairs = state.answers[i] || {};
      let got = 0;
      Object.keys(q.pairs).forEach((leftId) => {
        if (userPairs[leftId] === q.pairs[leftId]) got += 1;
      });
      score += got;
      breakdown.push({
        label: "Villain matching",
        got,
        possible: q.left.length,
      });
    }
  });

  return { score, total, breakdown };
}

function shorten(s, max = 40) {
  return s.length <= max ? s : s.slice(0, max - 1) + "…";
}

function getRank(score) {
  let rank = RANKS[0];
  for (const r of RANKS) if (score >= r.min) rank = r;
  return rank;
}

function renderResults() {
  const { score, total, breakdown } = calculateScore();
  const rank = getRank(score);

  const screen = el("div", "screen");

  screen.appendChild(el("div", "results-eyebrow", "MISSION COMPLETE"));

  const scoreWrap = el("div", "score-display");
  scoreWrap.appendChild(el("div", "score-number", String(score)));
  scoreWrap.appendChild(el("div", "score-total", `OUT OF ${total}`));
  screen.appendChild(scoreWrap);

  screen.appendChild(el("div", "rank-title", rank.title));
  screen.appendChild(el("div", "rank-blurb", rank.blurb));

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
    const btn = document.querySelector(".btn-bottom:not(:disabled)");
    if (btn) {
      e.preventDefault();
      btn.click();
    }
  }
});

render();
