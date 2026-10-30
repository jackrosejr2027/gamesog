# Contributing

This folder is a self-contained original game module, served as static files in Card Arcade. No package manager or build step is required to play.

1. Read rules.json, effects.json, keywords.json and schema.json before adding cards.
2. Add original expressions and maintain every card ID. Prefer editing the curated templates in generate.cjs and running node ordinary/generate.cjs to rebuild tables reproducibly.
3. A new effect operation needs an engine interpreter branch, targeting rules, AI evaluation and regression tests. Card descriptions do not execute code.
4. Run node tests/ordinary.test.cjs. Test deterministic replay, invalid-action immutability, combat boundaries, deck conservation and AI legal moves. Generated expansion cards have NOT all been balance-tested.
5. Submit only work you have the right to license. Contributions must accept the component licenses in LICENSE.txt: code MIT, original data/rules CC0. Include an explicit rights statement with your proposed change. Art must include provenance and a compatible license; do not import another commercial game's database, text, names, logos or artwork.
6. Do not modify unrelated arcade games or saves. Card data must remain declarative JSON, with no embedded executable expressions or external script URLs.

The project does not create or publish a GitHub repository automatically. Its source files and tables are accessible from the Open Source tab. They can be downloaded and hosted in a repository by the creator. There is no server-side collaboration or multiplayer service in this release; matches are human versus a local computer opponent.
