# Solitaire & Puzzles review

Scope: the 35 games on the Solitaire & Puzzles carousel shelf. Checked with
`tests/solitaire-review.test.cjs` (engine-level audit), the demo runs in
`tests/demos.test.cjs`, and the session test in `tests/sessions.test.cjs`.

## Corrected in this review

- **Timers:** stale timers from a previous game are discarded on restart,
  stop and restore (Solitaire and Memory), so a leave/return cannot clear a
  newly selected card.
- **Bowling:** strike, spare and gutter marks, including 10th-frame bonus
  marks, are shown from the actual rolls. Bowling ignores further rolls once
  the game is finished.
- **Aces Up:** selecting an empty pile clears the selection instead of moving
  an undefined card. The end-of-game check also runs after "Deal four."
- **Multi-card moves** (Yukon, Scorpion, Wasp, Simple Simon, Russian) need
  the whole run from the chosen card upward to be face-up.
- **Canfield:** an empty tableau pile refills from the reserve only when the
  reserve has cards, so a finished reserve no longer throws.
- **Rules text:** two-deck games (Forty Thieves, Josephine) describe Draw 1 as
  classical and Draw 3 as an optional stock variant. The four-reserve game
  (Duchess) describes the shared Draw 1/Draw 3 choice with one redeal.
- **Carousel shelf:** World Puzzles (Hitori, Nonogram and others) did not keep
  their state when you left and returned, because the session registration
  filter used the wrong description. The filter now matches the registered
  description, and all 114 registered games keep their state.

## Game by game

Standard = follows the commonly published rules. Variant = a named, documented
variant with the differences stated in its rules text. Nothing here presents a
variant as standard.

| Game | Status | Notes |
| --- | --- | --- |
| Klondike | Standard | Draw 1 or Draw 3 is a shared control; Draw 1 is the classical rule. |
| FreeCell | Standard | Four free cells, four foundations. |
| Spider | Standard | Draw 1 or Draw 3 shared control in the help text. |
| Pyramid | Standard | |
| Golf | Standard | |
| TriPeaks | Standard | |
| Accordion | Variant | Top-card variant; the rules text says so. |
| Clock | Standard | |
| Monte Carlo | Standard | |
| Castle | Standard | |
| Calculation | Variant | Ace-start variant, labelled as such. |
| La Belle Lucie | Variant | No redeals, kept deliberately. |
| Memory | Standard | Timer isolation fixed. |
| Bowling | Standard | Marks and bonuses corrected. |
| Yukon | Variant | Face-up groups move, even out of sequence. |
| Russian Solitaire | Variant | Yukon with same-suit building. |
| Baker's Game | Variant | Four cells, suit building. |
| Eight Off | Variant | Eight cells, four pre-occupied. |
| Seahaven Towers | Variant | Ten towers, four free cells, two pre-set. |
| Forty Thieves | Variant | Two decks, ten columns, no redeals, Draw 1 classical. |
| Josephine | Variant | Forty Thieves with movable suited runs. |
| Canfield | Variant | Thirteen-card reserve; reserve refill guarded. |
| Duchess | Variant | Foundation base chosen from four reserves; one redeal. |
| Scorpion | Variant | Exposed groups move; four suited runs complete. |
| Wasp | Variant | Scorpion with freely fillable empty columns. |
| Simple Simon | Variant | Suited moves, mixed-suit building. |
| Aces Up | Variant | Discard lower cards of matching suits. |
| Baker's Dozen | Variant | Thirteen columns; no filling empty spaces. |
| Bisley | Variant | Builds up from Aces and down from Kings. |
| Little Spider | Variant | Open-deal variant: red Aces and black Kings. |
| Flower Garden | Variant | Six beds and a sixteen-card bouquet. |
| Bristol | Variant | Eight columns, three waste piles. |
| Gaps (Montana) | Variant | Four suit rows from Two to King. |
| Nestor | Variant | Match exposed ranks; clear all fifty-two. |
| Gin Rummy | Standard | Gin scoring and meld rules as tested in `tests/gin.test.cjs`. |

## Verification

- `tests/solitaire-review.test.cjs`: all 35 games, 280 seeded deal, render and
  card-conservation checks, legal-move rules, stock and recycle policies,
  covered-card rules, terminal fixtures and single payouts, bowling bonuses,
  Aces Up guards, Memory timer isolation.
- `tests/demos.test.cjs`: every game on the shelf plays a 50-action demo.
- `tests/sessions.test.cjs`: all 114 registered games keep their state.
