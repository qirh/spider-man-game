# Spider-Man Sunnyside Challenge

A mobile-first, single-page Spider-Man trivia game. Vanilla HTML/CSS/JS — no build step, no dependencies.

**▶️ Play it: https://qirh.github.io/spider-man-game/**

## What's in the game

Fourteen questions across three formats:

- **Multiple choice** — pick the right answer from the options (use number keys on desktop; left/right arrows move between questions)
- **Jeopardy-style fill-in-the-blank** — type the missing word (case-insensitive); some questions have a hint button
- **Picture matching** — draw a line from each image-backed villain tile to their real name

Max score is 17 — eleven 1-point multiple-choice questions, two 1-point fill-ins, and one matching round worth 4 points. The results screen shows a per-question breakdown plus the full Spider-Man-themed rank ladder from "Civilian" to "Spider-Sense Master," with the rank you earned highlighted.

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

## Deployment & PR previews

The live site at https://qirh.github.io/spider-man-game/ is served from the `gh-pages` branch. Two workflows keep it in sync:

- **`.github/workflows/deploy.yml`** — on every push to `main`, mirrors the repo (excluding tests, workflows, and package metadata) to `gh-pages`.
- **`.github/workflows/pr-preview.yml`** — on every PR open/update, publishes a preview to `gh-pages/pr-preview/pr-<number>/` and comments the URL on the PR. The preview is deleted automatically when the PR is closed or merged.

**One-time setup (after merging this PR):** in **Settings → Pages**, change the source from `main` to `gh-pages` (root). Until you do, the workflows will populate `gh-pages` but the live site will keep serving from `main`.

## Tests

The pure scoring logic (questions, ranks, score calculation) lives in `scoring.js` so it can run in both the browser and Node. Tests use Node's built-in test runner — no install needed:

```sh
node --test tests/
# or
npm test
```
