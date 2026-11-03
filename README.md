# Zombie Deck

Unofficial companion app for Zombicide 2nd Edition: it replaces the physical zombie spawn deck. Built with Expo and Expo Router, landscape only.

## Features

- Draw, undo, shuffle the deck or reshuffle everything; the discard is reshuffled automatically when the deck runs out.
- Danger Level chosen by the players; cards show only the current level, or all four.
- Core box, Fort Hendrix (replaces the core deck) and expansions or promos switched on in the options; they apply to the next game.
- English (default), French, German, Italian, Polish and Brazilian Portuguese; the cards follow the app language.
- The game is saved on the device and can be resumed.

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
- `src/components/`: card faces, card back, artwork, background and hazard stripes
- `src/data/decks.ts`: cards transcribed from the physical decks
- `src/game/`: game engine, types and saved state
- `src/i18n/`: one file per language; `fr.ts` defines the keys every language must provide
