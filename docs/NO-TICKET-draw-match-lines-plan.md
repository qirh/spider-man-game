# Drawn-Line Matching Interaction Plan

## Goal
Replace the matching question's tap-to-pair interaction with a direct draw-a-line interaction.

## Current State
The matching question renders left and right option columns, stores pairs in `state.answers[state.qIndex]`, and draws SVG lines between paired cells after users tap a left option and then a right option. Existing scoring logic in `scoring.js` already scores pair objects, so the answer data shape can stay unchanged.

## Architecture/Design
Keep the existing pair storage and scoring contract, but change the match UI interaction layer. Users will start a connection from a left-side item with pointer/touch input, drag across the matching grid, see a live preview line, and release over a right-side item to create or replace a pair. Existing completed pairs remain SVG lines in `.match-lines`; the in-progress gesture will use a separate SVG preview element so redraws remain simple.

The implementation should use Pointer Events rather than separate mouse/touch handlers. Pointer capture will keep the gesture stable if the pointer moves quickly, while hit testing with `document.elementFromPoint()` will determine the right-side target on release. Clicking an already matched left or right item should still remove that pair so users can correct mistakes without needing a separate reset control.

## Implementation Steps
1. Update matching render text and state.
   - Modify `script.js` to track an active drag state instead of a selected-left tap state.
   - Update the matching helper copy to describe drawing lines.
   - Verification: start/restart/back navigation clears incomplete drag state.
2. Implement pointer-driven pairing.
   - Add pointer handlers for left items to start a drag, update a preview line on movement, and create a pair on release over a right item.
   - Preserve existing unpair behavior by allowing clicks/taps on matched items to remove their connection.
   - Verification: drawing left-to-right creates pairs, replacing a right-side match removes the previous left pair, and Next enables only when all left items are paired.
3. Update SVG line rendering and styles.
   - Add CSS classes for dragging, valid drop targets, and preview lines.
   - Ensure the existing completed line redraw continues to work after resize and rerender.
   - Verification: completed lines and preview line align with cells on desktop and mobile widths.
4. Keep scoring and tests stable.
   - Leave `scoring.js` answer shape unchanged.
   - Run `npm test`, `node --check script.js`, `node --check scoring.js`, and `git diff --check`.

## Success Criteria
- Users can complete the matching question by drawing from each villain to a real name.
- Existing completed connections are visible and removable.
- Partial/incomplete drag gestures do not create bad state.
- Results scoring remains unchanged.
- Automated scoring tests still pass.

## Risks & Mitigations
- Pointer/touch behavior may scroll the page while drawing: set `touch-action: none` on match items and the grid while preserving normal navigation elsewhere.
- Hit testing can return child spans instead of the button: use `closest("[data-right-id]")` when resolving release targets.
- Rerenders can interrupt a drag if state changes too early: keep drag preview outside persisted answers and commit only on pointerup.
- Keyboard accessibility could regress: keep matched items as buttons and preserve click-to-remove behavior for correction.
