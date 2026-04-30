# Spider-Man Sunnyside Challenge

A mobile-first, single-page Spider-Man trivia game. Vanilla HTML/CSS/JS — no build step, no dependencies.

**▶️ Play it: https://qirh.github.io/spider-man-game/**

## What's in the game

Twelve questions across three formats:

- **Multiple choice** — pick the right answer from four options (use the 1-4 keys on desktop)
- **Jeopardy-style fill-in-the-blank** — type the missing word (case-insensitive); some questions have a hint button
- **Picture matching** — draw a line from each villain to their real name

Max score is 15 — nine 1-point multiple-choice questions, two 1-point fill-ins, and one matching round worth 4 points. The results screen shows a per-question breakdown plus the full Spider-Man-themed rank ladder from "Civilian" to "Spider-Sense Master," with the rank you earned highlighted.

## Run locally

Just open `index.html` directly in a browser:

```sh
open index.html
```

Or serve over HTTP (useful for testing on a phone over the same Wi-Fi):

```sh
python3 -m http.server 5555
# then visit http://<your-mac-ip>:5555/ on your phone
```

## Tests

The pure scoring logic (questions, ranks, score calculation) lives in `scoring.js` so it can run in both the browser and Node. Tests use Node's built-in test runner — no install needed:

```sh
node --test tests/
# or
npm test
```
