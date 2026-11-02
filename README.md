# Zombie Deck

Unofficial companion app for Zombicide 2nd Edition: it replaces the physical zombie spawn deck. Built with Expo and Expo Router, landscape only.

## Features

- Draw, undo and reshuffle; the discard is reshuffled automatically when the deck runs out.
- Danger Level chosen by the players, highlighted on each card.
- Expansions and promos switched on in the options; they apply to the next game.
- Interface and card language (French or English) set separately.
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
- `src/components/`: card faces, card back and artwork
- `src/data/decks.ts`: cards transcribed from the physical decks
- `src/game/`: game engine, types and saved state
- `src/i18n/translations.ts`: French and English text
- `assets/zombies/originals/`: source PNGs of the illustrations, not bundled in the app
