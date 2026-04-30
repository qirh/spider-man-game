# Drawn-Line Matching Interaction Review

## Overview
The matching question now uses a draw-a-line interaction: users press on a villain, drag to a real name, and release to create the pair.

## Architecture
The change keeps the existing answer shape intact. Matching answers are still stored as `{ [leftId]: rightId }`, so `scoring.js` and the Node scoring tests did not need behavioral changes. The new logic lives in `script.js` as a pointer-driven UI layer on top of the existing SVG line renderer.

## Key Implementation Details
The matching help text now tells users to draw a line. Left-side match items start a Pointer Events gesture, render a live white preview line, and commit the pair only when released over a right-side target:

```js
cell.addEventListener("pointerdown", (e) => startMatchDrag(e, item.id));
```

Completed pairs still render through `redrawMatchLines()`, while the active source pair is skipped during a drag so the preview line is not drawn on top of the old completed line:

```js
if (activeMatchDrag && activeMatchDrag.leftId === leftId) return;
```

Dropping on a right-side item uses `document.elementFromPoint()` plus `closest("[data-right-id]")`, so releasing on a child span inside the button still resolves to the correct target. If the target was already paired to another left item, the old pair is removed before assigning the new one.

CSS adds `touch-action: none` to the matching grid and items so touch drawing does not scroll the page mid-gesture. Preview lines use the same SVG layer as completed lines, but with dedicated classes to disable the completed-line draw animation.

## Deviations from Plan
The implementation keeps click/tap removal for already matched items. This is not the primary pairing path, but it gives users and keyboard users a simple correction mechanism without adding a reset control.

## Challenges & Solutions
Pointer gestures can generate a synthetic click after pointerup. The implementation suppresses the immediate follow-up match click after committing, removing, or canceling a real drag so a completed or failed drag does not accidentally remove a connection.

Touch drawing can conflict with page scrolling. The matching grid and cells now opt out of touch scrolling during the gesture with `touch-action: none`.

## Testing & Verification
Automated checks run:

```sh
node --check script.js
node --check scoring.js
npm test
git diff --check
```

Static HTTP smoke test:

```sh
python3 -m http.server 8765
curl -I http://127.0.0.1:8765/
curl -I http://localhost:8765/script.js
curl -I http://localhost:8765/scoring.js
```

`npm test` passed all 15 scoring tests. The HTTP smoke test returned 200 for the app shell and both JavaScript files.

No local Playwright or Puppeteer package was available, so the drag gesture was not verified with automated browser interaction.

## Lessons Learned
The prior extraction of scoring into `scoring.js` kept this interaction change narrow. The UI could change from tap pairing to pointer drawing while preserving the tested answer and scoring contracts.

## Next Steps
Add a browser-level interaction test if the project later adopts Playwright or another browser runner. That test should draw all four matching lines, verify the Next button enables, and confirm replacing a right-side match removes the previous connection.
