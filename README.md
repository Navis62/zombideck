# Zombie Deck

Unofficial companion app for Zombicide 2nd Edition: it replaces the physical zombie spawn deck. Built with Expo and Expo Router, landscape only.

## Features

- The app opens on a carousel of Zombicide universes; each one has its own menu, expansions and saved choices (Modern and Fantasy).
- Fantasy: Black Plague, Green Horde, White Death and Eternal Empire, alone or mixed, with Double Spawn, Enter the Horde, the Horde symbol and White Death's Zombie Siege on the cards.
- Fantasy expansions: Wulfsburg, NPC-1, NPC-2, Zombie Bosses, Deadeye Walkers, Murder of Crowz, Friends and Foes, the Horde Box, No Rest for the Wicked, Rat King & Swamp Troll, Massive Darkness 2 Crossover, Iron Maiden, ThunderCats, Compagnia della Forca, Comic Book Extras Vol. 2, Timecrash, Berserker Walkers, Climbers & Terrorcotta Walkers, Crossfire Pack, Bebop & Rocksteady, Divine Beasts, Warlords of the Middle Kingdom, Warlords of the Rising Sun, the Kickstarter packs and Special Guest boxes, and the boss cards of Frozen Fortress and the Warlords boxes, with named Abominations and Necromancers.
- Fantasy bosses are picked one by one and dealt the White Death and Dead Men Tales way: the deck keeps its core Abominations and Necromancers, and each one drawn reveals a boss from an Abomination or Necromancer deck, one at a time or as an Abomination Fest; a revealed boss shows the rule of its boss card.
- Draw, undo, shuffle the deck or reshuffle everything; the discard is reshuffled automatically when the deck runs out.
- Danger Level chosen by the players; cards show only the current level, or all four. Showing only the current level, fantasy cards draw their zombie large beside its count, like modern cards.
- Core box, Fort Hendrix (replaces the core deck) and expansions or promos switched on in their own menu, reached from the main menu; they apply to the next game.
- English (default), French, German, Spanish, Italian, Polish, Brazilian Portuguese, Russian, Ukrainian and Czech; the cards follow the app language.
- The game is saved on the device and can be resumed.
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
- `src/data/threat.ts`: how the fantasy deck sets its bosses apart in their own decks, with the rulebook quotes; a new boss goes in its lists
- `src/data/universes.ts`: the universes offered in the opening carousel and the sets of each
- `src/game/`: game engine, types and saved state
- `src/i18n/`: one file per language; `fr.ts` defines the keys every language must provide
- `assets/zombies/`: one illustration per zombie type, 1280 px tall JPEGs
- `assets/icons/`: expansion symbols printed above the Danger Levels

## Adding content

- **Cards:** add a set to `CARD_SETS` in `src/data/decks.ts` (`optional: true` for an expansion, `replaces` if it swaps out another set, `addsZombies: true` if it should bring its share of the upgrade kit's Abomination cards, and `isHard` for its harder cards), then its `set.<id>` name in every file of `src/i18n/`. The tests check that every expansion has a name in every language.
- **Zombie type:** add it to `ZombieType` in `src/game/types.ts`, its `zombie.<type>.other` name in every language (plus `zombie.<type>.rush` if it has Rush cards and `zombie.<type>.all` if it has Extra Activation cards), its illustration in `ART` (`src/components/zombie-art.tsx`) and, if the cards print one, its symbol in `ZOMBIE_SYMBOLS` (`src/components/card-face.tsx`).
- **Universe:** add its id to `UniverseId` (`src/game/types.ts`) and `UNIVERSE_IDS` (`src/game/engine.ts`), its sets, the zombies it shows and whether its core boxes replace each other to `UNIVERSES` (`src/data/universes.ts`), its carousel card to `PLAYABLE` (`src/app/index.tsx`) and its `universe.*` names in every language.
- **Language:** copy `src/i18n/en.ts`, translate it, then add it to `TRANSLATIONS` and `LANGUAGE_NAMES` in `src/i18n/translations.ts`.

## Disclaimer

Fan-made and unofficial. Zombicide is a trademark of CMON Global Limited; this app is not affiliated with or endorsed by CMON. Card counts and terms are transcribed from the published games for players who own them.

## License

The source code is released under the MIT License (see `LICENSE`). It does not cover the Zombicide name, rules or card contents, which belong to CMON.

## Support

If this app is useful at your table, you can [buy me a coffee](https://buymeacoffee.com/navis62) to help me keep building and improving apps.
