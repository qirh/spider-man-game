const test = require("node:test");
const assert = require("node:assert");
const {
  QUESTIONS,
  RANKS,
  CORRECT_ANSWER_MESSAGES,
  WRONG_ANSWER_MESSAGES,
  calculateScore,
  getRank,
  questionPoints,
  shorten,
} = require("../scoring.js");

const MAX_SCORE = QUESTIONS.reduce(
  (acc, q) => acc + questionPoints(q),
  0,
);

test("getRank returns CIVILIAN for scores below the FRIENDLY NEIGHBOR threshold", () => {
  assert.strictEqual(getRank(0).title, "CIVILIAN");
  assert.strictEqual(getRank(131).title, "CIVILIAN");
});

test("getRank advances at every threshold boundary", () => {
  assert.strictEqual(getRank(132).title, "FRIENDLY NEIGHBOR");
  assert.strictEqual(getRank(137).title, "FRIENDLY NEIGHBOR");
  assert.strictEqual(getRank(138).title, "WEB SLINGER");
  assert.strictEqual(getRank(144).title, "WEB SLINGER");
  assert.strictEqual(getRank(145).title, "TRUE BELIEVER");
  assert.strictEqual(getRank(149).title, "TRUE BELIEVER");
  assert.strictEqual(getRank(150).title, "SPIDER-SENSE MASTER");
});

test("calculateScore: empty answers gives score 0 and full possible total", () => {
  const { score, total } = calculateScore([]);
  assert.strictEqual(score, 0);
  assert.strictEqual(total, MAX_SCORE);
  assert.strictEqual(total, 152);
  assert.strictEqual(QUESTIONS.length, 19);
});

test("multiple-choice questions have valid answer indexes", () => {
  QUESTIONS.forEach((q, idx) => {
    if (q.type !== "mc") return;
    const answers = Array.isArray(q.answer) ? q.answer : [q.answer];
    assert.ok(
      answers.length > 0,
      `question ${idx + 1} should have at least one answer index`,
    );
    answers.forEach((answer) => {
      assert.ok(
        Number.isInteger(answer),
        `question ${idx + 1} answer should use integer indexes`,
      );
      assert.ok(
        answer >= 0 && answer < q.choices.length,
        `question ${idx + 1} answer should point to an existing choice`,
      );
    });
  });
});

test("multiple-choice correct answers are mixed across option positions", () => {
  const answerPositions = new Set(
    QUESTIONS.filter((q) => q.type === "mc").flatMap((q) =>
      Array.isArray(q.answer) ? q.answer : [q.answer],
    ),
  );

  assert.ok(answerPositions.size >= 3, "expected mixed answer positions");
  assert.ok(answerPositions.has(0), "expected at least one first-choice answer");
  assert.ok(answerPositions.has(4), "expected Queens to use the fifth choice");
});

test("calculateScore: multiple-choice questions score only their answer index", () => {
  QUESTIONS.forEach((q, idx) => {
    if (q.type !== "mc") return;

    const accepted = Array.isArray(q.answer) ? q.answer : [q.answer];
    accepted.forEach((answer) => {
      const correct = [];
      correct[idx] = answer;
      assert.strictEqual(
        calculateScore(correct).score,
        questionPoints(q),
        `question ${idx + 1}`,
      );
    });

    const wrong = [];
    wrong[idx] = q.choices.findIndex(
      (_, choiceIndex) => !accepted.includes(choiceIndex),
    );
    assert.strictEqual(calculateScore(wrong).score, 0, `question ${idx + 1}`);
  });
});

test("Spider-Man real name question accepts Peter Parker and Miles Morales", () => {
  const idx = QUESTIONS.findIndex(
    (q) => q.prompt === "What is Spider-Man's real name?",
  );
  const q = QUESTIONS[idx];
  assert.deepStrictEqual(q.answer, [0, 1]);

  [0, 1].forEach((answer) => {
    const answers = [];
    answers[idx] = answer;
    assert.strictEqual(calculateScore(answers).score, 1);
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

test("calculateScore: total includes weighted question values", () => {
  const expected = QUESTIONS.reduce((total, q) => total + questionPoints(q), 0);
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

test("calculateScore: matching breakdown labels describe each round", () => {
  const { breakdown } = calculateScore([]);
  assert.ok(
    breakdown.some((row) => row.label === "Villain matching"),
    "expected villain matching breakdown label",
  );
  assert.ok(
    breakdown.some((row) => row.label === "Trip/location matching"),
    "expected trip/location matching breakdown label",
  );
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
    question.prompt.toLowerCase().includes("greatest boro"),
  );
  assert.ok(q, "expected a greatest boro question");
  assert.strictEqual(q.requireCorrect, true);
  assert.strictEqual(q.choices[q.answer], "Queens");
  assert.ok(q.choices.includes("Staten Island"));
});

test("final gates are blocking and weighted", () => {
  const finalGates = QUESTIONS.slice(-4);
  assert.deepStrictEqual(
    finalGates.map((q) => q.prompt),
    [
      "What is the greatest city in the world?",
      "What is the greatest boro in the world?",
      "What is the greatest neighborhood in the world?",
      "Which boro is better?",
    ],
  );

  assert.deepStrictEqual(
    finalGates.map((q) => q.choices[q.answer]),
    ["New York City", "Queens", "Sunnyside", "Queens"],
  );
  assert.deepStrictEqual(finalGates.map(questionPoints), [10, 10, 10, 100]);
  assert.strictEqual(finalGates[2].choices.at(-1), "Sunnyside");
  assert.deepStrictEqual(finalGates[3].choices, ["Brooklyn", "Queens"]);

  finalGates.forEach((q) => {
    assert.strictEqual(q.type, "mc");
    assert.strictEqual(q.requireCorrect, true);
  });
});

test("wrong answer messages rotate through a shared message list", () => {
  assert.ok(WRONG_ANSWER_MESSAGES.length >= 6);
  assert.ok(WRONG_ANSWER_MESSAGES.includes("ewwww, no"));
  assert.ok(WRONG_ANSWER_MESSAGES.includes("of course no"));
  assert.ok(WRONG_ANSWER_MESSAGES.includes("WRONG"));
});

test("correct answer messages rotate through a shared message list", () => {
  assert.ok(CORRECT_ANSWER_MESSAGES.length >= 4);
  assert.ok(CORRECT_ANSWER_MESSAGES.includes("wise choice"));
  assert.ok(CORRECT_ANSWER_MESSAGES.includes("of course"));
});

test("quote attribution question points to Norman Osborn", () => {
  const q = QUESTIONS.find((question) =>
    question.prompt.includes("scientist myself"),
  );
  assert.ok(q, "expected a scientist quote question");
  assert.strictEqual(q.choices[q.answer], "Norman Osborn");
});

test("odd-one-out villain question points to Lex Luthor", () => {
  const q = QUESTIONS.find((question) =>
    question.prompt.includes("NOT a Spider-Man villain"),
  );
  assert.ok(q, "expected an odd-one-out villain question");
  assert.strictEqual(q.choices[q.answer], "Lex Luthor");
});

test("Miles and Peter origin questions are adjacent", () => {
  const milesIdx = QUESTIONS.findIndex(
    (question) => question.prompt === "Where is Miles Morales from?",
  );
  assert.ok(milesIdx >= 0, "expected a Miles origin question");
  assert.strictEqual(QUESTIONS[milesIdx].choices[QUESTIONS[milesIdx].answer], "Brooklyn");

  const peter = QUESTIONS[milesIdx + 1];
  assert.strictEqual(peter.prompt, "Where is Peter Parker from?");
  assert.strictEqual(peter.choices[peter.answer], "Queens");
});

test("matching villain tiles include image backgrounds", () => {
  const q = QUESTIONS.find((question) =>
    question.prompt.includes("villain"),
  );
  assert.ok(q, "expected a matching question");
  q.left.forEach((item) => {
    assert.match(item.imageUrl, /^https:\/\/cdn\.marvel\.com\//);
    assert.ok(item.imagePosition, `${item.label} should set image position`);
    assert.ok(item.imageSize, `${item.label} should set image size`);
  });
});

test("trip/location matching question maps locations to movies", () => {
  const q = QUESTIONS.find((question) =>
    question.prompt.includes("trip/location"),
  );
  assert.ok(q, "expected a trip/location matching question");
  assert.strictEqual(q.left.length, 5);
  assert.strictEqual(q.right.length, 5);
  assert.strictEqual(q.pairs.space, "infinity-war");
  assert.strictEqual(q.pairs.dc, "homecoming");
  assert.strictEqual(q.pairs.germany, "civil-war");
  assert.strictEqual(q.pairs.venice, "far-from-home");
  assert.ok(q.left.some((item) => item.label === "Long Island City"));
  assert.strictEqual(q.pairs.lic, "no-way-home");
});
