const test = require("node:test");
const assert = require("node:assert");
const {
  QUESTIONS,
  RANKS,
  calculateScore,
  getRank,
  shorten,
} = require("../scoring.js");

const MAX_SCORE = QUESTIONS.reduce(
  (acc, q) => acc + (q.type === "match" ? q.left.length : 1),
  0,
);

test("getRank returns CIVILIAN for scores below the FRIENDLY NEIGHBOR threshold", () => {
  assert.strictEqual(getRank(0).title, "CIVILIAN");
  assert.strictEqual(getRank(4).title, "CIVILIAN");
});

test("getRank advances at every threshold boundary", () => {
  assert.strictEqual(getRank(5).title, "FRIENDLY NEIGHBOR");
  assert.strictEqual(getRank(7).title, "FRIENDLY NEIGHBOR");
  assert.strictEqual(getRank(8).title, "WEB SLINGER");
  assert.strictEqual(getRank(10).title, "WEB SLINGER");
  assert.strictEqual(getRank(11).title, "TRUE BELIEVER");
  assert.strictEqual(getRank(13).title, "TRUE BELIEVER");
  assert.strictEqual(getRank(14).title, "SPIDER-SENSE MASTER");
});

test("calculateScore: empty answers gives score 0 and full possible total", () => {
  const { score, total } = calculateScore([]);
  assert.strictEqual(score, 0);
  assert.strictEqual(total, MAX_SCORE);
});

test("multiple-choice questions put the correct answer first", () => {
  QUESTIONS.forEach((q, idx) => {
    if (q.type !== "mc") return;
    assert.strictEqual(q.answer, 0, `question ${idx + 1}`);
    assert.ok(q.choices[0], `question ${idx + 1} should have a first choice`);
  });
});

test("calculateScore: multiple-choice questions score only first choices", () => {
  QUESTIONS.forEach((q, idx) => {
    if (q.type !== "mc") return;

    const correct = [];
    correct[idx] = 0;
    assert.strictEqual(calculateScore(correct).score, 1, `question ${idx + 1}`);

    const wrong = [];
    wrong[idx] = 1;
    assert.strictEqual(calculateScore(wrong).score, 0, `question ${idx + 1}`);
  });
});

test("calculateScore: fill-in is case-insensitive and trims whitespace", () => {
  const idx = QUESTIONS.findIndex((q) => q.type === "fill");
  const correct = QUESTIONS[idx].answer;

  for (const variant of [correct, correct.toUpperCase(), `  ${correct}  `]) {
    const answers = [];
    answers[idx] = variant;
    const { score } = calculateScore(answers);
    assert.strictEqual(score, 1, `variant ${JSON.stringify(variant)}`);
  }
});

test("calculateScore: fill-in rejects an unrelated answer", () => {
  const idx = QUESTIONS.findIndex((q) => q.type === "fill");
  const answers = [];
  answers[idx] = "definitely not the answer";
  const { score } = calculateScore(answers);
  assert.strictEqual(score, 0);
});

test("calculateScore: match round scores per correct pair", () => {
  const idx = QUESTIONS.findIndex((q) => q.type === "match");
  const correctPairs = QUESTIONS[idx].pairs;
  const pairCount = Object.keys(correctPairs).length;

  // All correct
  const allRight = [];
  allRight[idx] = { ...correctPairs };
  assert.strictEqual(calculateScore(allRight).score, pairCount);

  // One wrong
  const oneWrong = { ...correctPairs };
  const firstKey = Object.keys(oneWrong)[0];
  oneWrong[firstKey] = "not-a-real-id";
  const partial = [];
  partial[idx] = oneWrong;
  assert.strictEqual(calculateScore(partial).score, pairCount - 1);

  // None paired
  const empty = [];
  empty[idx] = {};
  assert.strictEqual(calculateScore(empty).score, 0);
});

test("calculateScore: total includes every match pair as a separate point", () => {
  const matchQ = QUESTIONS.find((q) => q.type === "match");
  const mcCount = QUESTIONS.filter((q) => q.type === "mc").length;
  const fillCount = QUESTIONS.filter((q) => q.type === "fill").length;
  const expected = mcCount + fillCount + matchQ.left.length;
  assert.strictEqual(calculateScore([]).total, expected);
});

test("calculateScore: a fully correct playthrough hits the maximum", () => {
  const answers = QUESTIONS.map((q) => {
    if (q.type === "mc") {
      return Array.isArray(q.answer) ? q.answer[0] : q.answer;
    }
    if (q.type === "fill") return q.answer;
    if (q.type === "match") return { ...q.pairs };
    return undefined;
  });
  const { score, total } = calculateScore(answers);
  assert.strictEqual(score, total);
});

test("calculateScore: breakdown row count matches question count", () => {
  const { breakdown } = calculateScore([]);
  assert.strictEqual(breakdown.length, QUESTIONS.length);
});

test("shorten leaves strings at or below the limit unchanged", () => {
  assert.strictEqual(shorten("hello"), "hello");
  assert.strictEqual(shorten("a".repeat(40)), "a".repeat(40));
});

test("shorten truncates longer strings to exactly the limit, ending in ellipsis", () => {
  const s = "a".repeat(100);
  const result = shorten(s);
  assert.strictEqual(result.length, 40);
  assert.ok(result.endsWith("…"));
});

test("RANKS thresholds are monotonically increasing", () => {
  for (let i = 1; i < RANKS.length; i++) {
    assert.ok(
      RANKS[i].min > RANKS[i - 1].min,
      `RANKS[${i}].min (${RANKS[i].min}) must be > RANKS[${i - 1}].min (${RANKS[i - 1].min})`,
    );
  }
});

test("RANKS top tier is reachable at the maximum possible score", () => {
  const top = RANKS[RANKS.length - 1];
  assert.strictEqual(getRank(MAX_SCORE).title, top.title);
});

test("Queens borough question requires Queens before proceeding", () => {
  const q = QUESTIONS.find((question) =>
    question.prompt.toLowerCase().includes("best boro"),
  );
  assert.ok(q, "expected a best boro question");
  assert.strictEqual(q.requireCorrect, true);
  assert.strictEqual(q.choices[q.answer], "Queens");
  assert.ok(q.choices.includes("Staten Island"));
  assert.strictEqual(q.wrongMessage, "Wrong answer");
});
