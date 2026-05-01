const QUESTIONS = [
  {
    type: "mc",
    prompt: "What is Spider-Man's real name?",
    choices: ["Peter Parker", "Miles Morales", "Lewis Mumford", "Tony Stark"],
    answer: 0,
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
    choices: ["Riverdale High", "Midtown High", "Bayside High", "Westview High"],
    answer: 1,
  },
  {
    type: "match",
    prompt: "Match each villain to their real name.",
    breakdownLabel: "Villain matching",
    help: "Draw a line from each villain to their real name.",
    left: [
      {
        id: "a",
        label: "Doc Ock",
        imageUrl: "https://cdn.marvel.com/content/2x/226ock_ons_mas_dsk_01.jpg",
        imagePosition: "73% 58%",
        imageSize: "auto 230%",
      },
      {
        id: "b",
        label: "Green Goblin",
        imageUrl: "https://cdn.marvel.com/content/2x/104gno_ons_mas_dsk_01.jpg",
        imagePosition: "67% 46%",
        imageSize: "auto 145%",
      },
      {
        id: "c",
        label: "Vulture",
        imageUrl: "https://cdn.marvel.com/content/2x/105vat_ons_mas_dsk_01.jpg",
        imagePosition: "58% 50%",
        imageSize: "auto 145%",
      },
      {
        id: "d",
        label: "Venom",
        imageUrl: "https://cdn.marvel.com/content/2x/103veb_com_mas_dsk_03_0.jpg",
        imagePosition: "44% 44%",
        imageSize: "auto 145%",
      },
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
    type: "match",
    prompt: "Match each trip/location to the movie.",
    breakdownLabel: "Trip/location matching",
    help: "Draw a line from each trip or location to the movie.",
    left: [
      { id: "space", label: "Space" },
      { id: "dc", label: "Washington, D.C." },
      { id: "germany", label: "Germany" },
      { id: "venice", label: "Venice, Italy" },
      { id: "lic", label: "Long Island City" },
    ],
    right: [
      { id: "civil-war", label: "Captain America: Civil War (2016)" },
      { id: "far-from-home", label: "Spider-Man: Far From Home (2019)" },
      { id: "infinity-war", label: "Avengers: Infinity War (2018)" },
      { id: "no-way-home", label: "Spider-Man: No Way Home (2021)" },
      { id: "homecoming", label: "Spider-Man: Homecoming (2017)" },
    ],
    pairs: {
      space: "infinity-war",
      dc: "homecoming",
      germany: "civil-war",
      venice: "far-from-home",
      lic: "no-way-home",
    },
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
    prompt: "Where is Miles Morales from?",
    choices: ["Los Angeles", "Brooklyn", "Queens", "Gotham"],
    answer: 1,
  },
  {
    type: "mc",
    prompt: "Where is Peter Parker from?",
    choices: ["Brooklyn", "Queens", "Manhattan", "Staten Island"],
    answer: 1,
  },
  {
    type: "mc",
    prompt: "Who said \"I'm something of a scientist myself\"?",
    choices: ["Otto Octavius", "Peter Parker", "Norman Osborn", "Tony Stark"],
    answer: 2,
  },
  {
    type: "mc",
    prompt: "Which of these is NOT a Spider-Man villain?",
    choices: ["Mysterio", "Electro", "Lex Luthor", "Kraven the Hunter"],
    answer: 2,
  },
  {
    type: "mc",
    prompt: 'Who is the lead Spider-Man in "Into the Spider-Verse" (2018)?',
    choices: ["Peter Parker", "Ben Reilly", "Miles Morales", "Gwen Stacy"],
    answer: 2,
  },
  {
    type: "mc",
    prompt: "What is the greatest city in the world?",
    choices: [
      "Rome",
      "London",
      "Melbourne",
      "Cape Town",
      "Paris",
      "Tokyo",
      "Dubai",
      "Cairo",
      "Singapore",
      "Lagos",
      "New York City",
    ],
    answer: 10,
    requireCorrect: true,
  },
  {
    type: "mc",
    prompt: "What is the greatest boro in the world?",
    choices: ["Manhattan", "Brooklyn", "The Bronx", "Staten Island", "Queens"],
    answer: 4,
    requireCorrect: true,
  },
  {
    type: "mc",
    prompt: "What is the greatest neighborhood in the world?",
    choices: [
      "SoHo",
      "Shibuya",
      "Montmartre",
      "Camden",
      "Le Marais",
      "Harlem",
      "Kreuzberg",
      "Trastevere",
      "Williamsburg",
      "Sunnyside",
    ],
    answer: 9,
    requireCorrect: true,
  },
];

const WRONG_ANSWER_MESSAGES = [
  "ewwww, no",
  "of course no",
  "WRONG",
  "not even close",
  "spider-sense says no",
  "try again",
  "absolutely not",
];

const RANKS = [
  {
    min: 0,
    title: "CIVILIAN",
    blurb: "Better stick to the bus and let the heroes handle it.",
  },
  {
    min: 8,
    title: "FRIENDLY NEIGHBOR",
    blurb: "You know the basics. Spidey would wave.",
  },
  {
    min: 13,
    title: "WEB SLINGER",
    blurb: "Solid spidey-knowledge. J. Jonah would hate to admit it.",
  },
  {
    min: 18,
    title: "TRUE BELIEVER",
    blurb: "Excelsior! You know your Spider-Man!",
  },
  {
    min: 22,
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
        label: q.breakdownLabel || shorten(q.prompt),
        got,
        possible: q.left.length,
      });
    }
  });

  return { score, total, breakdown };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    QUESTIONS,
    RANKS,
    WRONG_ANSWER_MESSAGES,
    calculateScore,
    getRank,
    shorten,
  };
}
