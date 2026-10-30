# Artwork — folk-print edition

The current card images replace all 48 illustrations of the previous cartoon household-fantasy edition. All replacement source art was generated specifically for this project with Websim image generation, without uploaded references or third-party source paintings.

## Direction

An illustrated folk-fantasy world built around everyday errands becoming myth: textured paper, ink contours, rich shadow, limited-color print palettes, surreal domestic objects, civic spaces and distinctive neighbors. The prompts requested linocut and cut-paper qualities; the results are generated illustrations, not physical hand-carved prints.

Each circle has a consistent palette:
- Moss Bureau: forest green, moss, ochre, parchment.
- Ember Kitchen: vermilion, burnt orange, smoky plum, parchment.
- Tide Archive: deep indigo, turquoise, seafoam, parchment.
- Copper Guild: petrol blue, rust, copper orange, parchment.
- Violet Post: aubergine, dusty rose, lavender, parchment.
- Chalk Assembly: charcoal, chalk cream, muted mustard.

## Coverage and reuse

Files retain the existing art/F-T.webp convention: F is the faction index and T is the type index (Neighbor, Spark, Ritual, Tool, Habit, Homestead, Envoy, Undertaking). All 48 slots are 576 × 384 local WebP files.

Five two-column/four-row generated sheets supplied 40 new paintings for circles 0–4. Their compositions were prompted around the 40 corresponding foundation-card names and subjects. Paper gutters were cropped away before resizing.

Image generation reached the account's daily limit before the sixth sheet and proposed back painting could be generated. Rather than leave old illustrations in the new edition, Chalk Assembly uses eight chalk-ink color studies adapted with Pillow from the new art. In type order, the source slots are 3-0, 4-2, 1-7, 3-5, 0-4, 2-5, 0-0, 3-7. These are recolored shared compositions, not eight additional unique paintings. Its foundation subjects are therefore thematic approximations, not bespoke illustrations of each card's name. Card backs are original CSS ornamental patterns, not generated paintings.

The 226,400 catalog records continue to share these 48 artwork slots; they do not have individually commissioned or unique paintings. Legacy art_hue metadata remains in the data for compatibility, but the renderer no longer applies arbitrary hue rotation. IDs, gameplay data, saved decks and design/art grouping remain unchanged.

## Provenance and rights

No existing franchise characters, commercial card art, logos or artist-name style references were requested. Local assets need no runtime image generation. To the extent contributors hold transferable rights, they dedicate them under CC0-1.0. AI output may lack copyright protection and is not guaranteed to be exclusive or free of resemblance to other work. This is provenance, not legal clearance. Contributed replacements should identify source, creator, license and required attribution.

## Additive field-guide bank

The field-guide expansion preserves every file in art/ byte-for-byte and adds 150 plates under art-bank/neighbor-NNN.webp. These adapt the project's existing generated PullCrest field-guide portraits (see ../pullcrest/ART.md), using a modest paper-warmth/color/contrast treatment and landscape padding that retains the creature silhouette. All original PullCrest files remain unchanged. This update generated zero new paintings because the daily image-generation limit was still active. The added plates are adaptations, not newly commissioned or independently generated compositions. Their anatomy is thematic inspiration, not a literal depiction of each procedurally named Neighbor.

The bank now offers 198 local plates: the 48 retained folk-print slots plus 150 field-guide adaptations. It does not represent 198 newly painted scenes, nor one unique image per catalog card. art-bank/manifest.json records source paths and circle/type tags. art-bank/preserved-files.json records the pre-update SHA-256 digests of the 216 protected original images, data tables and engine/style files.

Foundation cards retain their exact art. Expansion Neighbors receive a deterministic plate from their circle's retained Neighbor illustration and 25 added portraits. Other expansion types may use any of the six retained type-matched narrative scenes, expanding visual combinations without new procedural recoloring. Routing depends only on immutable card ID and the versioned fixed bank, never match seed, deck position or view. Library grouping uses both original art identity and routed image, so it can split old groups to expose different pictures but cannot merge away an old group or delete an ID. Raw JSON records remain unchanged; the presentation route lives in art-bank.js. Everything works offline.
