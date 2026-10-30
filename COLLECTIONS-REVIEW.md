# Board Games, Card Puzzles & Solo Adventures

## Scope

Reviewed the existing collection membership and implementations: **29 Board Games, 2 Card Puzzles (Bowling and Memory), and 25 Solo Adventures** (five legacy/inspired games plus twenty original scenarios). This is a rules/implementation review, not a claim to implement every published variation of these games. Existing menus, saved sessions, artwork and difficulty choices are preserved.

## Fixes from this pass

- Adventure actions are now validated against the current scenario before any state change. Unknown actions and another scenario's healing/rewind/action cannot fall through to a default attack or other move.
- Hand selections must contain unique, in-range integer indices. Single-card scenarios enforce their card limit at the engine boundary, including optional escorts and command cards. Two-card scenarios retain their documented combinations.
- Dungeon Delver checks survival before granting a Heart-door heal: lethal room damage cannot resurrect the player. Its guide now gives the actual damage formula.
- Vampire Court charges its two-HP toll on every sixth action, including feeding. The toll resolves before checking victory, so a fatal final audience cannot pay a victory reward. Feeding still counts toward the 36-action deadline.
- Shieldwall's rules clarify that damage remaining after each assigned defender is applied immediately. Starship Salvage explicitly describes one optional escort and rounding down its protection.
- Corrected the local README's stale claim of technique-ranked Sudoku. The puzzles have unique solutions; fewer givens are not a calibrated human difficulty rating.
- Bumped the offline cache revision and rebuilt the downloadable local package to ship the reviewed source.

## Rules/variation boundaries

Board Games: see BOARD-REVIEW.md for the full 29-entry matrix. Checkers uses American/English rules; Mancala is Kalah; Chinese Checkers uses a documented destination-camp lock; Backgammon uses the documented coin-toss opening. Ur, Senet, Morris, Fox and Geese, and Alquerque are explicitly solo/reconstructed puzzle variants, not complete historical two-player rulesets. Hanayama-style entries are original digital ring/channel puzzles. Numbered search settings are effort profiles, not Elo ratings or 1,000 separately tuned opponents.

Card Puzzles: Memory pairs rank **and colour**, giving exactly 26 pairs. Bowling is the three-card, subset-sum variant, not a simulation of physical bowling or another published card layout. Aces count one; faces count ten; every roll discards the whole hand. Conventional strike/spare scoring includes tenth-frame bonus rolls and caps a perfect game at 300.

Solo Adventures: Scoundrel uses the documented 44-card dungeon, room carry, weapon rank limit and first-potion allowance. The Long Road uses printed-suit bonuses with rank-wild Aces and a custom boss. Quiet Year-style Journal is a prompt journal, not a competitive win/loss game. Savage Worlds-style Skirmish and Castle Falkenstein-style Challenges are simplified, labelled inspired games, not implementations of their complete tabletop systems.

The twenty original scenarios each retain their own objective and actions: Delver (12 rooms), Dragon Hunt (80 dragon HP), Soul Crypt (60 banked souls), Spellforge (6 exact totals), Shieldwall (6 waves), Vampire Court (four houses at 8 within 36 actions), Starship Salvage (40 salvage and extraction), Corsair (60 enemy HP), Wild Trail (12 suit markers), Alchemist (6 pairs to 13), Bone Legion (8 guardians), Iron Arena (3 champions), Moonlit Heist (9 locks before alarm 8), Last Village (6 raiders), Chronomancer (10 gates with 3 nonrenewable rewinds), Bounty Ledger (60 earned gold, excluding the initial 20), Relic Vault (10 relics then escape), Caravan (10 legs, living escort and 30 gold), Skyspire (20 floors), and Oracle Quest (two sigils per suit within 24 encounters).

## Checks executed this pass

- Original boards: forced Checkers captures/promotions, 50 simulations, 150 Kalah playouts, Chinese Checkers geometry/camp locks, and legal removal witnesses for all 1,000 Mahjong profiles.
- More boards: independent uniqueness checks for all 1,000 Sudoku puzzles, chess special moves/draws, Backgammon dice/bar/bearoff constraints, Connect Four, Othello, Dominoes and Dots and Boxes; 521 exhaustive human paths against default perfect Tic-Tac-Toe; **100 complete self-play games** with conservation and five AI-level boundaries.
- Board-review suite: difficulty boundaries, full Tic-Tac-Toe trees, cache isolation, ten additional self-play matches and terminal guards. Opponent suite: legal immutable decisions at six level boundaries and hidden-information safety.
- All 1,000 profiles for each of the seven solo puzzle engines: verified witness paths where promised, or the relevant deterministic/counting/termination invariants. All 900 world-puzzle levels completed using legal stored witnesses. All 1,000 Jewel starts and five complete AI rounds passed.
- Existing expansion suite: all twenty original adventure victory transitions, one-time rewards, death rewind and scenario actions; legacy review suite covers the other five adventures' terminal behavior, wild poker evaluation and final journal entry.
- New collections regression suite: invalid action/selection boundaries across all twenty original adventures; Delver lethal damage; Vampire Court feeding/toll and fatal final audience; both action deadlines; optional-card limits; full-state Chronomancer rewind. A complete 26-pair Memory game and **723 legal tenth-frame Bowling cases** across open/strike/spare prefixes, plus perfect score, illegal rolls and repeated payout prevention.
- DOM/controller suites passed for all seven solo puzzles, eight more-board games and nine world puzzles. Session suite passed independent leave/resume checks for all 114 registered games (including entries outside this review).
- Fifty-action explained demos passed for all 25 adventures and both Card Puzzles; demo storage remained isolated. The first demo batch reached its execution time limit after 18 passing scenarios; all remaining scenarios were completed in a separate successful batch.

The initial combined engine batch hit the tool execution limit and was split into individual suites. The worker-only rerun did not finish within the shared controller batch's time limit; this pass does not claim a fresh completed worker-only result. Existing worker tests are retained.

## Limits

No manual browser playthrough of every game/level was performed in this pass. DOM tests and legal witness solutions are not human usability or balance testing. Chance-based boards/adventures can lose or require guesses; Nurikabe and generated world-logic layouts do not claim unique solutions. Numeric profiles can reuse mechanics. A passing regression suite is not proof that every possible state is bug-free.
