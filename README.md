# Spider-Man Sunnyside Challenge

A mobile-first, single-page Spider-Man trivia game. Vanilla HTML/CSS/JS — no build step, no dependencies.

**▶️ Play it: https://qirh.github.io/spider-man-game/**

## What's in the game

Fifteen questions across three formats:

- **Multiple choice** — pick the right answer from the options (use number keys on desktop; left/right arrows move between questions)
- **Jeopardy-style fill-in-the-blank** — type the missing word (case-insensitive); some questions have a hint button
- **Picture matching** — draw lines through image-backed villain tiles and movie-location rounds

Max score is 22 — eleven 1-point multiple-choice questions, two 1-point fill-ins, and two matching rounds worth 9 points. The results screen shows a per-question breakdown plus the full Spider-Man-themed rank ladder from "Civilian" to "Spider-Sense Master," with the rank you earned highlighted.

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
