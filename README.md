# Spider-Trivia

A mobile-first, single-page Spider-Man trivia game. Vanilla HTML/CSS/JS — no build step, no dependencies.

**▶️ Play it: https://qirh.github.io/spider-man-game/**

## What's in the game

Six questions across three formats:

- **Multiple choice** — pick the right answer from four options
- **Jeopardy-style fill-in-the-blank** — type the missing word (case-insensitive)
- **Picture matching** — pair each villain with their real name (tap-to-pair)

Max score is 9. The results screen shows a per-section breakdown and a Spider-Man-themed rank from "Civilian" to "Spider-Sense Master."

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
