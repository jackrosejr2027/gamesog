# PullCrest

An original creature-card duel inside Card Arcade, human versus a local rules-based computer. No commercial card text, databases, characters, logos or source images are imported. This is not a faithful recreation of another game's rules.

## Library

150 families, each with a base plus four evolutions: 750 named forms. The full catalog contains 17,825 creature printings, 2,863 Guide/Tool printings and 568 Energy printings (21,256 total). Field-record variants reuse foundation mechanics, not thousands of separately designed creatures. 150 local generated family illustrations are shared across evolution forms with tinting. The expansion has not been individually balanced.

## Rules and Data

Read rules.json for the complete reference. effects.json defines Guide and Tool operations. Each creature stores attack costs, damage, extra costs, effects, evolution predecessor, family, stage, HP, affinity, weakness, resistance, retreat cost and abilities. Descriptive text is not executable. The starter bundle data.js is generated from these tables, enabling storage-isolated iframe demos without fetch dependencies.

Forty-card decks, six base creatures minimum, three copies per non-Energy ID. Active plus three reserves, one attachment and one Guide per turn, four evolution stages, and a four-crest race. Damage persists through evolution. Toxin, shields, fatigue, search, recovery, switching and simultaneous knockouts are implemented. See the Rules tab for all timing and targeting limits.

## Source API

Load engine.js as a classic script. PullCrestEngine.make({cards,effects,rules}) returns an engine. create([deckA,deckB],seed) returns a JSON-compatible state. legal(state) enumerates choices for state.actor. apply(state,action) returns a new state or null for an illegal action without changing its inputs. ai(state) chooses a legal action using its own hand and public state. Randomness uses a seeded xorshift generator. deckError(deck) validates a full deck.

Card Library loads full tables on demand; filters by type, stage, element, HP, damage, energy cost and ability. Exports filtered JSON. Deck Builder saves locally and imports/exports JSON. The engine is independent of the DOM. All gameplay and art are local, no AI service needed.

Run node pullcrest/generate.cjs to rebuild tables. Run node tests/pullcrest.test.cjs for engine, catalog and evolution tests. Tests and source are available in workspace; no public GitHub repository is automatically created. Multiplayer is not included.

See LICENSE.txt, ART.md and CONTRIBUTING.md. The licenses cover this new module, not unrelated arcade code. Core gameplay and art are precached; full catalog shards cache after first successful loading.
