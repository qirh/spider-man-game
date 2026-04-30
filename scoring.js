const QUESTIONS = [
  {
    type: "mc",
    prompt: "What is Spider-Man's real name?",
    choices: ["Peter Parker", "Miles Morales", "Lewis Mumford", "Tony Stark"],
    answer: [0, 1],
  },
  {
    type: "mc",
    prompt: "What bit Peter Parker to give him powers?",
    choices: [
      "A radioactive ant",
      "A radioactive spider",
      "A magic beetle",
      "A robot bee",
    ],
    answer: 1,
  },
  {
    type: "mc",
    prompt: "What year did not have a Spider-Man movie come out?",
    choices: ["2002", "2012", "2013", "2021"],
    answer: 2,
  },
  {
    type: "mc",
    prompt: "Who is Peter Parker's aunt?",
    choices: ["Aunt May", "Aunt June", "Aunt April", "Aunt January"],
    answer: 0,
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
    type: "mc",
    prompt: "In Into the Spider-Verse, what city does Miles Morales live in?",
    choices: ["Los Angeles", "Brooklyn", "Queens", "Gotham"],
    answer: 1,
  },
  {
    type: "mc",
    prompt: "What is the best boro in NYC?",
    choices: ["Manhattan", "Brooklyn", "Queens", "The Bronx", "Staten Island"],
    answer: 2,
    requireCorrect: true,
    wrongMessage: "Wrong answer",
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
    min: 5,
    title: "FRIENDLY NEIGHBOR",
    blurb: "You know the basics. Spidey would wave.",
  },
  {
    min: 8,
    title: "WEB SLINGER",
    blurb: "Solid spidey-knowledge. J. Jonah would hate to admit it.",
  },
  {
    min: 11,
    title: "TRUE BELIEVER",
    blurb: "Excelsior! You know your Spider-Man!",
  },
  {
    min: 14,
    title: "SPIDER-SENSE MASTER",
    blurb: "With great trivia comes great responsibility.",
  },
];

function shorten(s, max = 40) {
  return s.length <= max ? s : s.slice(0, max - 1) + "…";
}

function getRank(score, ranks = RANKS) {
  let rank = ranks[0];
  for (const r of ranks) if (score >= r.min) rank = r;
  return rank;
}

function calculateScore(answers, questions = QUESTIONS) {
  let score = 0;
  let total = 0;
  const breakdown = [];

  questions.forEach((q, i) => {
    if (q.type === "mc") {
      total += 1;
      const accepted = Array.isArray(q.answer) ? q.answer : [q.answer];
      const correct = accepted.includes(answers[i]);
      if (correct) score += 1;
      breakdown.push({
        label: shorten(q.prompt),
        got: correct ? 1 : 0,
        possible: 1,
      });
    } else if (q.type === "fill") {
      total += 1;
      const ans = (answers[i] || "").trim().toLowerCase();
      const correct = ans === q.answer.toLowerCase();
      if (correct) score += 1;
      breakdown.push({
        label: `Fill-in: "${q.answer}"`,
        got: correct ? 1 : 0,
        possible: 1,
      });
    } else if (q.type === "match") {
      total += q.left.length;
      const userPairs = answers[i] || {};
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

if (typeof module !== "undefined" && module.exports) {
  module.exports = { QUESTIONS, RANKS, calculateScore, getRank, shorten };
}
