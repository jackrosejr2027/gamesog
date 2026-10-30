# Board-game review

Scope: all 29 games in the Board Games collection. Reviewed the rule engines, controller transitions, opponent behavior, end conditions, difficulty parameters, and existing regression suites. Classic Games received an additional profile/solvability regression run; it is a separate collection.

## Changes made

- Chinese Checkers now always restarts from the standard ten-marble camps. New Game no longer silently plays random opening moves.
- Competitive board results remain on screen. Starting another match or advancing difficulty is a player choice; automatic progression remains for numbered solo puzzles.
- Tic-Tac-Toe now has saved, selectable difficulty. Low settings recognize immediate wins/threats but can miss forks; settings 650–1000 retain full-tree perfect play. Default perfect play is preserved.
- Existing opponent-level controls now describe Beginner, Casual, Challenging, Advanced, or Expert bands. These describe search-effort ranges, not calibrated player ratings.
- Sudoku descriptions no longer claim technique-based difficulty grading. Each puzzle is uniquely solvable; higher numbers generally target fewer clues, not guaranteed harder adjacent puzzles.
- Ancient/reconstructed entries identify their solo puzzle format in their library description, rather than implying a full historical two-player implementation.
- Backgammon reuses bounded, keyed legal-turn enumeration across rendering, validation, and AI. Returned sequences are copied to prevent cache corruption; changes to board, dice, bar, bearing-off counts, or turn invalidate the key.
- Jewel Cascade returns no legal swaps or AI action after a win/loss, avoiding an AI exception on finished games.

## Rules and difficulty coverage

| Game | Rules/variant reviewed | Challenge model |
|---|---|---|
| Checkers | American/English: forced forward man captures, full multi-jumps, crowning ends turn, kings, no-move loss, repetition/quiet draws | Search depth, budget, capture extensions |
| Chinese Checkers | 121 holes, ten pieces, six-way steps/multi-hops, non-capturing jumps; documented destination-camp lock | Assignment planning, reply search, repetition avoidance |
| Mancala | Kalah: stores, opposite captures, bonus turns, final sweep, ties | Extra-turn-aware bounded search |
| Mahjong Solitaire | Free-edge/uncovered matching, undo, no-pair detection | 1,000 solution-verified layouts; tile/layer growth |
| Sudoku | Fixed clues; rows/columns/boxes; unique completions | 1,000 verified puzzles, generally fewer givens |
| Chess | Legal check handling, mate, castling, en passant, four promotions, stalemate/material/repetition/fifty-move draws | Bounded tactical lookahead; not Elo |
| Backgammon | Documented single-game coin-toss opening variant; bar priority, hits, maximum dice usage, higher-die rule, doubles, bearing off | Complete-turn evaluation and blot-risk weighting; dice unchanged |
| Connect Four | Gravity, full columns, four line directions, full-board draws | Win/block checks and increasing lookahead |
| Othello | Eight-direction flips, forced pass, neither-side-can-move finish, disc scoring | Corners, mobility, stability, deeper search |
| Dominoes | Double-six draw variant, oriented ends, mandatory legal plays, repeated draws, blocked pip scoring | Flexible-hand/blocking evaluation; no hidden-hand/stock access |
| Dots and Boxes | Shared double-box claims, bonus turns, final scoring | Capture chains and bounded sacrifice search |
| Tic-Tac-Toe | Legal placements, lines, draws | Short-lookahead beginner through provably non-losing perfect play |
| 2048 | One merge per tile per slide, legal-slide detection, spawning, terminal states | Seeded spawn profiles; not guaranteed winnable |
| Tchuka Ruma | Relay sowing, store stops, empty-pit failure, loop detection, seed conservation | 1,000 solvable seed layouts |
| Shut the Box | Legal subset sums, permitted dice choices, blocked-round scoring | More tiles at higher profiles; chance remains |
| Nurikabe | Numbered island sizes, one clue per island, connected sea, no sea 2x2 | 1,000 verified solutions; uniqueness not claimed |
| Peg Solitaire | Orthogonal jumps, removal, one-peg goal, no-move losses | Reverse-constructed solvable starts |
| Pentalpha | Pentagram placement paths, empty start/end, nine-stone target | Less opening assistance; profiles can repeat mechanics |
| Minesweeper | Safe initial reveal/neighborhood, mine counts, flood fill, flags, win/loss | Larger/denser fields; no no-guess guarantee |
| Hitori | No repeated kept digits, non-adjacent shades, connected kept cells | Larger grids/shade density |
| Kakuro | Across/down sums, digits 1–9, no repeats in a run | Larger grids/fewer givens; multiple solutions accepted |
| Nonogram | Row/column runs, separating empties, accepting any matching completion | Increasing grid size; uniqueness not claimed |
| Hanayama-style Puzzles | Original ring/channel puzzle, orientation gates, legal travel, move budget | Longer verified routes, fewer spare moves; not a physical replica |
| Royal Game of Ur | Explicit reconstructed solo fixed-throw race puzzle | More counters/longer routes; not full two-player Ur |
| Senet | Explicit solo sequence puzzle, water/rebirth, exact exits | More counters/tighter sequences; not historically certain full Senet |
| Alquerque Puzzle | Solo removal on the drawn lattice, legal captures, one-counter finish | More counters/tighter budgets; not full two-player Alquerque |
| Nine Men's Morris Puzzle | Adjacent moves/flying at three, mills, protected capture targets | Fixed-enemy solo challenge; not full placement/movement match |
| Fox and Geese Puzzle | Orthogonal fox moves/jumps, frozen geese, capture goal | Larger capture challenges; not full asymmetric opponent play |
| Jewel Cascade | Adjacent matching swaps, intersection scoring, cascades, gravity, free dead-board redeals, move limit | Higher targets/fewer moves/more colors; no guaranteed winning path |

## Checks actually run

- Original-board suite: 50 simulated Checkers games, 150 Kalah playouts, star geometry/hops/camp rules, and verified solution paths for all 1,000 Mahjong levels.
- More-board suite: independent uniqueness/solution checks for all 1,000 Sudoku puzzles; chess special/endgame rules; Connect Four, Othello, backgammon, domino and box rules; exhaustive human paths against default perfect Tic-Tac-Toe; 15 complete self-play matches and AI legality at five level boundaries.
- New board-review suite: exhaustive beginner/casual/perfect Tic-Tac-Toe human paths, win/block checks at five settings, cache isolation, ten additional full self-play matches, conservation, terminal guards and effort scaling.
- Opponent suite: legal immutable decisions at six boundaries, tactical wins/defenses, Chinese camp finishes, bearoff, double-box claims, and hidden-information safety.
- Solo suite: 1,000 profiles each for seven solo engines, testing solutions or the appropriate invariants (not claiming all chance-based levels are winnable).
- World-puzzle suite: all 900 seeded levels solved through legal witness paths, plus invalid completion/capture/exit cases.
- Jewel suite: all 1,000 starts, cascades and legal swaps; five complete AI rounds; win/loss terminal guards.
- Classic-level suite: 2,300 profiles, fresh starts, target/geometry checks and stored solutions where provided.
- Controller/UI/worker suites: real control dispatch, saved difficulties, game switching, stale/duplicate replies, worker exceptions/timeouts, legal fallbacks, standard Chinese resets, and persistent match results.
- Browser: full expert Tic-Tac-Toe draw, Connect Four gravity/computer reply, Mancala sowing/extra turn. No browser console errors in that session. This was representative interactive testing, not a manual playthrough of every level.

## Limits

Fun is subjective and cannot be established by solvability tests alone. The collection now has clearer difficulty expectations and fewer disruptive transitions, but further human playtesting is still needed to tune pacing and challenge. Increasing search budgets is not proof of monotonically increasing strength on every position; 1,000 numeric settings are not 1,000 separately calibrated opponents. Historical solo variants remain explicitly labelled variants, and chance-based games retain their stated uncertainty.

## Mahjong / printed-deck follow-up

Mahjong's former mirrored face assignment was replaced with randomized pairing of independently free tiles. Live new games receive fresh random seeds; explicit seeds remain reproducible for regression tests and demos. Every accepted deal is constructed along a complete legal removal sequence. All 1,000 default profiles passed their solution checks again; another 360 shuffled deals at nine boundaries were solved, and mirrored opening matches fell to about 3%, rather than being automatic. A controller test checked twelve genuinely different New Game layouts and that switching away and back preserves the current deal.

Solitaire now uses a separate presentation layer with mirrored corner indices, traditional numbered pip layouts, generated court portraits, and an engraved indigo card back. All 52 rank/suit combinations, motion identities, six solitaire hosts, saved face-color variables, and demo inclusion have regression coverage. No solitaire movement rules were changed.
