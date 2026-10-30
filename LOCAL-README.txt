CARD ARCADE 1.0 FINAL - LOCAL VERSION

1. Extract this ZIP. Everything is inside the CardArcade folder.
2. Open a terminal in CardArcade and run:
   python3 -m http.server 8000
   On Windows you can use: py -m http.server 8000
3. Open http://localhost:8000 in a modern browser.

Do not double-click index.html: browsers restrict JSON loading and workers
on file:// URLs. A local HTTP server is required. No internet connection,
Websim account, cloud AI, npm installation or build step is needed to play.
All game code, full card catalogs, artwork, chess rules and motion profiles are
local. The arcade starts in Shelves view. Computer opponents also run entirely
locally, with bounded search and worker-failure recovery. The Classic cabinet
has 100 level profiles for each new activity, fresh New Game configurations,
and locally saved challenges. Peg Solitaire and Chinese Checkers retain their
1,000-level controls. Twenty animated page themes plus Green Felt are local
CSS; reduced-motion preferences disable background animation. Demo Previous
Step and Next Step browse recorded frames without rerunning random actions.
Resume returns to the live end of the demonstration. Demo frames use same-origin
loading for offline support and separate in-memory browser storage; they never
write your real saved progress. Sudoku levels each have a verified unique solution; later levels generally
target fewer clues, not technique-based or calibrated human difficulty.
Other higher difficulty levels increase search effort or strategic evaluation, not calibrated ratings.

For browser-only offline use, first visit on localhost or HTTPS while online
and let the service worker finish downloading the complete library (about
200 MB of browser storage). The menu shows Offline ready only after installation
finishes. Keep the page open until then. On iPhone/iPad use Safari and Add to
Home Screen for installed play; on Android use a browser supporting service
workers. Browser storage may be evicted by the operating system. Offline installation requires enough free storage;
clearing site data removes it. The extracted ZIP has no such initial internet
requirement and works with the local server even if browser caching is disabled.

Switching games via the menu or arrows retains each board in the open tab.
New game resets that board. Closing or reloading the tab clears these live
sessions; permanently saved coins, decks and cabinet progress remain.

The server only serves files. Saved progress and decks remain in the current
browser profile. This archive does not contain your personal browser saves.
Use Arcade > Save / Load and the deck export buttons to transfer those.

The service worker requires localhost or HTTPS. Other devices visiting an
HTTP LAN address can play while the server is running but may not install
or precache the app. Keep the local server running while playing.

To regenerate the archive and enable the download icon on your local copy:
   python3 downloads/build-local.py
The resulting file is downloads/offllinecodebbase.zip. The archive excludes
itself to avoid recursive packages. Its unusual filename follows the requested
name. The online arcade header links directly to this same downloadable file.

Expansion card designs and 1,000 motion profiles per family are generated;
those counts are not claims of handcrafted unique artwork or balanced cards.
License notices are retained alongside their respective modules and vendor code.
