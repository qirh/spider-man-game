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
  cancelActiveMatchDrag();
  state.screen = "question";
  state.qIndex = 0;
  state.answers = [];
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
  const feedback = el("div", "choice-error");

  function updateNextState() {
    const selected = state.answers[state.qIndex];
    const hasAnswer = selected !== undefined;
    const isCorrect = isCorrectChoice(q, selected);
    next.disabled = q.requireCorrect ? !isCorrect : !hasAnswer;
    feedback.textContent = q.requireCorrect && hasAnswer && !isCorrect
      ? q.wrongMessage || "Wrong answer"
      : "";
  }

  q.choices.forEach((c, i) => {
    const btn = el("button", "choice");
    btn.appendChild(el("span", "choice-num", String(i + 1)));
    btn.appendChild(el("span", "choice-text", c));
    if (state.answers[state.qIndex] === i) btn.classList.add("selected");
    btn.addEventListener("click", () => {
      state.answers[state.qIndex] = i;
      buttons.forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
      updateNextState();
    });
    buttons.push(btn);
    choices.appendChild(btn);
  });
  screen.appendChild(choices);

  if (q.requireCorrect) {
    feedback.setAttribute("aria-live", "polite");
    screen.appendChild(feedback);
  }

  const next = nextButton();
  updateNextState();
  screen.appendChild(next);
}

function isCorrectChoice(q, choiceIndex) {
  const accepted = Array.isArray(q.answer) ? q.answer : [q.answer];
  return accepted.includes(choiceIndex);
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
  screen.appendChild(el("div", "q-text", q.prompt));
  screen.appendChild(
    el("div", "match-help", "Draw a line from each villain to their real name."),
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
    renderMatchItemContent(cell, item);
    if (pairs[item.id]) {
      cell.classList.add("matched");
      cell.appendChild(el("span", "pair-num", String(pairNums[item.id])));
    }
    cell.addEventListener("pointerdown", (e) => startMatchDrag(e, item.id));
    cell.addEventListener("click", (e) => onMatchLeftClick(e, item.id));
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
  btn.addEventListener("click", nextQuestion);
  return btn;
}

function nextQuestion() {
  cancelActiveMatchDrag();
  state.qIndex++;
  if (state.qIndex >= QUESTIONS.length) {
    state.screen = "results";
  }
  render();
  scrollToTop();
}

function prevQuestion() {
  cancelActiveMatchDrag();
  if (state.qIndex === 0) {
    state.screen = "welcome";
  } else {
    state.qIndex--;
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
    showRequiredChoiceFeedback(q);
    return;
  }

  nextQuestion();
}

function canKeyboardAdvance(q) {
  return !q.requireCorrect || isCorrectChoice(q, state.answers[state.qIndex]);
}

function showRequiredChoiceFeedback(q) {
  const feedback = document.querySelector(".choice-error");
  if (feedback) feedback.textContent = q.wrongMessage || "Wrong answer";
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

  if (activeMatchDrag.source.setPointerCapture) {
    activeMatchDrag.source.setPointerCapture(e.pointerId);
  }

  window.addEventListener("pointermove", onMatchPointerMove);
  window.addEventListener("pointerup", onMatchPointerUp);
  window.addEventListener("pointercancel", onMatchPointerCancel);

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

  drag.source.classList.remove("drawing-source");
  drag.grid.classList.remove("drawing");
  if (drag.dropTarget) drag.dropTarget.classList.remove("drop-target");

  activeMatchDrag = null;

  if (renderAfter) render();
  else redrawMatchLines();
}

function cancelActiveMatchDrag() {
  if (activeMatchDrag) finishMatchDrag();
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

document.addEventListener("keydown", (e) => {
  if (handleArrowNavigation(e)) return;

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

render();
