# Ordinary the Scattering

An original, openly reusable card duel inside Card Arcade. Household fantasy, two districts, a computer opponent, a searchable catalog and a data-driven deterministic engine. It is not an implementation of another publisher's rules or card collection.

## Play

Choose Ordinary the Scattering from Card Duels at the bottom of the arcade. Quickplay is available directly from its arcade entry and at the table: one click starts with two independently shuffled random decks drawn from curated cards, including early Neighbors and Homesteads. It keeps the opening hand automatically and never changes the saved custom deck. The curated 30-card starters are ready immediately. Read the Rules tab for the full rulebook. Select a card to see legal actions; choose a target through the action buttons. During enemy attacks, choose a blocker or allow the hit. A seeded d6 is rolled only by a card that invokes it.

## Catalog

226,400 uniquely named records: 88,000 Creature, 32,000 Instant, 32,000 Sorcery, 24,000 Artifact, 28,000 Enchantment, 20,000 Land, 2,000 Planeswalker and 400 Battle. This is exactly four times the previous catalog. All 56,600 existing card IDs and records are preserved; 169,800 new records add structured effect recipes and stat/keyword combinations. Display names are Neighbor, Spark, Ritual, Tool, Habit, Homestead, Envoy, Undertaking. All six circles may mix in a deck. There are 48 curated foundation cards and 226,352 procedural expansion records, not 226,400 independently designed or balanced interactions. Unique names and card IDs do not imply that every recipe is mechanically distinct. New Homesteads can resolve settlement and recurring start-of-turn effects through the same structured interpreter. The folk-print edition uses 40 new generated local paintings and eight chalk-ink adaptations, shared across 48 faction/type artwork slots. The renderer preserves their authored palettes instead of applying per-card hue shifts. See ART.md.

A redundancy audit groups 85,670 redundant same-mechanics/same-art printings into 140,730 displayed design/art groups. The 48 artwork files remain shared by genuinely different designs. No IDs are deleted, so saved decks and imports remain valid. Search includes alternate names and IDs and returns their representative group. See redundancy-audit.json and catalog-tools.js.

Card Library supports name/ID/effect search, type, circle, cost and keyword filters, name/cost/attack sorting, pagination and filtered JSON export. Full type tables are linked in Open Source. Deck Builder supports exactly 30 cards, at most two copies per ID, local saving and JSON import/export. There are no purchasable packs, locked cards, network matches or hidden collection economy.

## Data Tables

catalog.json: factions, type counts and shard locations.
cards-TYPE.json: full card records for each catalog taxonomy.
starter.json: 48 curated records and 52 complete starter decks. The two original decks are unchanged; 50 additions cover ten archetypes with five variations each. Each has a full opening, district/sequence, key-card, focus-curve and weakness explanation, shown on hover or keyboard focus in Deck Builder. All starters work offline without loading the full catalog.
core-data.js: a generated classic-script bundle of starter and rule tables, enabling opaque-origin sandbox previews without CORS-dependent data fetches.
effects.json: operation IDs, timing triggers, target rules and generated descriptions.
keywords.json: formal keyword definitions.
rules.json: engine constants and the complete human-readable rulebook, split into named records.
schema.json: card record JSON Schema.

The structured fields and operation definitions are authoritative. The engine never interprets rules_text or lore. Changes to combat/timing semantics require changing the engine and the relevant rule records together.

## Engine API

Load engine.js as a classic browser script, or require it from Node. makeEngine({cards, effects, rules}) creates an engine. engine.create([deckA, deckB], seed) returns the initial state. engine.legal(state, player) enumerates actions. engine.transition(state, player, action) returns {ok, state, error?} without mutating the input. engine.ai(state, player) selects a legal move using only that player's hand and public information. Snapshots are JSON-compatible. No DOM or network APIs are used by the engine.

Deck shuffles, starting-player selection and dice use a seeded xorshift PRNG. Same data, seed, decks and legal action sequence produce identical states. AI policy is deterministic. No AI model/API is involved.

## Development

Run node ordinary/generate.cjs to rebuild the card tables. Run node tests/ordinary.test.cjs for schema/inventory, determinism, legal actions, effects, combat, victory, conservation and computer simulations. The integration participates in the arcade 50-step demo system; the demo uses the same rules engine and never reads or writes the real save.

The starter, rules, effects, source and artwork are precached with the arcade. Large catalog shards load on demand and are cached after a successful request; download them once before browsing the full library offline. A real disconnected-device lifecycle has not been exhaustively tested.

See LICENSE.txt, ART.md and CONTRIBUTING.md. Licenses are scoped to this new module. Source availability is not a claim that a public GitHub repository has been published.

## Additive illustration bank

The card-art bank now contains 198 local plates: all 48 retained folk-print images and 150 print-toned adaptations of existing project-generated field-guide portraits. No old cards, illustrations, source images, data tables or saved-deck formats were removed or rewritten. The new files are adapted art, not 150 newly generated paintings; the generation quota was still active.

Foundation-card illustrations are unchanged. Expansion Neighbors draw from circle-specific 26-image pools, while other expansion types can use six existing type-matched narrative scenes. art-bank.js gives each expansion card a stable image without changing its JSON record or mechanics. Library grouping preserves visually different printings and every original ID. See art-bank/manifest.json, ART.md and tests/ordinary-art-bank.test.cjs.
