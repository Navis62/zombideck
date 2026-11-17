# Zombie Deck

Unofficial companion app for Zombicide 2nd Edition: it replaces the physical zombie spawn deck. Built with Expo and Expo Router, landscape only.

## Features

- The app opens on a carousel of Zombicide universes; each one has its own menu, expansions and saved choices (Modern, Fantasy and Invader); the background fades to the scenery of the universe you swipe to.
- Fantasy: Black Plague, Green Horde, White Death and Eternal Empire, alone or mixed, with Double Spawn, Enter the Horde, the Horde symbol and White Death's Zombie Siege on the cards.
- Invader (sci-fi): the Invader and Dark Side boxes, alone or together, with Xeno Workers, Tanks and Hunters (Drillers in Dark Side), Spoiler and Driller Abominations, Mold and Pit Spawn cards (a Mold Spawn reminds you to draw another card when no Mold Zone is active) and Extra Activations; the easier or the harder half of the deck can be switched off in the options.
- Invader expansions: Black Ops, Dark Side Extras, Civilian Extras, Soldier Extras, Promo Xenos, Project: ELITE Crossover, Comic Book Extras Vol. 1, Vol. 2 and Vol. 2 (Android, with Synkrasis) and Iron Maiden Packs 1 and 2, with named Abominations (Juggernaut, Stomper, Brood Mother, Stepmother, the Eddies and more) and new Xenos (Driller Blitzers, Flingers, Seeker Workers with their rule printed on the card, Xenomoths, Biters).
- Fantasy expansions: Wulfsburg, NPC-1, NPC-2, Zombie Bosses, Deadeye Walkers, Murder of Crowz, Friends and Foes, the Horde Box, No Rest for the Wicked, Rat King & Swamp Troll, Massive Darkness 2 Crossover, Iron Maiden, ThunderCats, Compagnia della Forca, Comic Book Extras Vol. 2, Timecrash, Berserker Walkers, Climbers & Terrorcotta Walkers, Crossfire Pack, Bebop & Rocksteady, Divine Beasts, Warlords of the Middle Kingdom, Warlords of the Rising Sun, the Kickstarter packs and Special Guest boxes, and the boss cards of Frozen Fortress and the Warlords boxes, with named Abominations and Necromancers.
- Fantasy bosses are picked one by one and dealt the White Death and Dead Men Tales way: the deck keeps its core Abominations and Necromancers, and each one drawn reveals a boss from an Abomination or Necromancer deck, one at a time or as an Abomination Fest; a revealed boss shows the rule of its boss card.
- Modern Abominations come from a deck of named Abominations: the core box, the upgrade kit, The Boys, Supernatural, Ghostbusters, Monty Python, Iron Maiden, Urban Legends, Dark Nights: Metal and the Kickstarter exclusives. SPAM cards are set aside and play their cantrip (draw the next card), Gozer draws three candidates and the players choose which two it keeps, Batman Who Laughs arrives with The Robins, and a "Draw an Abomination" button deals one by hand beside the cards (Fantasy has the same button once a named boss is picked).
- Draw, undo, shuffle the deck or reshuffle everything; the discard is reshuffled automatically when the deck runs out.
- Danger Level chosen by the players; cards show only the current level, or all four. Showing only the current level, fantasy cards draw their zombie large beside its count, like modern cards.
- Core box, Fort Hendrix (replaces the core deck) and expansions or promos switched on in their own menu, reached from the main menu; they apply to the next game.
- English (default), French, German, Spanish, Italian, Polish, Brazilian Portuguese, Russian, Ukrainian and Czech; the cards follow the app language.
- The game is saved on the device and can be resumed; each universe keeps its own game, so starting one never replaces another's.
- The drawn card is read out by screen readers (TalkBack, VoiceOver).
- The discard pile can be browsed, most recent card first; reshuffling everything asks for a second tap.
- Optional vibration on each draw; the app follows the device language until another one is chosen.
- Corrections to cards and translations ship over the air with EAS Update (`npx eas-cli@latest update --channel production`).

## Development

```bash
npm ci
npx expo start     # dev server
npm test           # game engine and deck data tests
npm run typecheck
npm run lint
```

## Project layout

- `src/app/`: screens (Expo Router routes)
- `src/components/`: card faces, card back, discard sheet, buttons, artwork, background and hazard stripes
- `src/data/decks.ts`: cards transcribed from the physical decks
- `src/data/fantasy.ts`: the fantasy era cards (Black Plague, Green Horde and their expansions), checked against the printed cards
- `src/data/invader.ts`: the Invader and Dark Side Xeno cards, with their Mold and Pit spawns, and the Invader expansions
- `src/data/threat.ts`: how the fantasy deck sets its bosses apart in their own decks, with the rulebook quotes; a new boss goes in its lists
- `src/data/universes.ts`: the universes offered in the opening carousel and the sets of each
- `src/game/`: game engine, types and saved state
- `src/i18n/`: one file per language; `fr.ts` defines the keys every language must provide
- `assets/<universe>/`: the artwork of each universe (`modern/`, `fantasy/`, `invader/`), so a new universe gets its own folder
  - `zombies/`, `abominations/` and (Fantasy only) `necromancers/`: one illustration per zombie type, 1280 px tall JPEGs; named bosses go in `abominations/` or `necromancers/`, everything else in `zombies/`
  - `icons/`: expansion symbols printed above the Danger Levels
  - `backgrounds/` and `cards/`: its carousel and menu background, its card back (the modern one stays in `assets/cards/`, see below)
- `assets/*.png` and `assets/cards/back.jpg`: app icon, adaptive icon, favicon and splash image (also the modern card back), referenced by `app.json` (moving them changes the native build)

## Adding content

- **Cards:** add a set to `CARD_SETS` in `src/data/decks.ts` (`optional: true` for an expansion, `replaces` if it swaps out another set, `addsZombies: true` if it should bring its share of the upgrade kit's Abomination cards, and `isHard` for its harder cards), then its `set.<id>` name in every file of `src/i18n/`. The tests check that every expansion has a name in every language.
- **Zombie type:** add it to `ZombieType` in `src/game/types.ts`, its `zombie.<type>.other` name in every language (plus `zombie.<type>.rush` if it has Rush cards and `zombie.<type>.all` if it has Extra Activation cards), its illustration in `assets/<universe>/zombies/` (`abominations/` or `necromancers/` for a boss) and in `MODERN_ART` or `FANTASY_ART` (`src/components/zombie-art.tsx`) and, if the cards print one, its symbol in `ZOMBIE_SYMBOLS` (`src/components/card-face.tsx`).
- **Universe:** add its id to `UniverseId` (`src/game/types.ts`) and `UNIVERSE_IDS` (`src/game/engine.ts`), its sets, the zombies it shows and whether its core boxes replace each other to `UNIVERSES` (`src/data/universes.ts`), its carousel card to `PLAYABLE` (`src/app/index.tsx`), its look to the `Record<UniverseId, …>` tables the typecheck then asks for (`SCENERY`, `CARD_BACKS`, `BORDERS`, `BOSS_LOOK`, its zombie art) and its `universe.*` names in every language.
- **Language:** copy `src/i18n/en.ts`, translate it, then add it to `TRANSLATIONS` and `LANGUAGE_NAMES` in `src/i18n/translations.ts`.

## Disclaimer

Fan-made and unofficial. Zombicide is a trademark of CMON Global Limited; this app is not affiliated with or endorsed by CMON. Card counts and terms are transcribed from the published games for players who own them.

## License

The source code is released under the MIT License (see `LICENSE`). It does not cover the Zombicide name, rules or card contents, which belong to CMON.

## Support

If this app is useful at your table, you can [buy me a coffee](https://buymeacoffee.com/navis62) to help me keep building and improving apps.
