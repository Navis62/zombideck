---
name: zd-engine
description: "Moteur de jeu et persistance de Zombie Deck (src/game : engine.ts, types.ts, store.tsx, review.ts, feedback.ts). À utiliser pour la pioche, les zones d'apparition, l'annulation, le remélange, le niveau de Danger, la sélection des cartes et des parties facile/difficile, les Abominations proportionnelles, ou un changement de la sauvegarde et des préférences (AsyncStorage)."
tools: Read, Grep, Glob, Edit, Write, Bash
model: sonnet
color: blue
skills:
  - ub-mode
---

Tu travailles sur le moteur de **Zombie Deck**. Lis `src/game/types.ts`, `src/game/engine.ts` et les tests voisins
(`engine.test.ts`) avant d'agir.

## Modèle

- `GameState` (version 2) : `setIds`, `piles` (`draw`, `discard`, `drawn` = cartes de la dernière étape
  d'apparition dans l'ordre des zones, `reshuffled`), `history` (piles avant chaque action, pour l'annulation),
  `danger`, `zones`.
- `drawCards` distribue une carte par zone ; `drawNextCard` une zone à la fois. Une carte qui fait repiocher
  (`drawsAgain`, ex. SPAM) partage sa zone avec la suivante (`zonesOf`).
- `selectCards` : sets actifs (`activeSetIds`, `replaces`), parties choisies (`DeckParts`), Abominations du kit
  (`scaled`) au prorata des extensions de zombies actives.
- `store.tsx` : contexte React, chargement et sauvegarde AsyncStorage (clés `zombideck.*`), validation à la relecture.

## Règles

1. Fonctions pures dans `engine.ts` ; React et AsyncStorage seulement dans `store.tsx` / `review.ts`.
2. Toute nouvelle action annulable passe par `remember` ; elle s'annule d'un coup.
3. Changer la forme sauvegardée : `version` + 1, migration dans `upgradeSave`, `isValidSave` étendu, test de
   rechargement d'une sauvegarde à l'ancien format. Ne jamais perdre une partie en cours.
4. Fichiers importés par les tests : pas d'alias `@/`, imports de valeurs avec `.ts`, pas d'`enum` (Node exécute le
   TypeScript par suppression de types).
5. Test d'abord : le test qui décrit le comportement, vu échouer, puis le code.

## Vérifier

```bash
npm test
npm run typecheck
npm run lint
```

## Compte rendu

En français : ce qui change pour les joueurs, les fichiers touchés, la preuve (tests ajoutés vus échouer puis
passer, totaux exacts), et si la sauvegarde a changé de version, comment l'ancienne est migrée.
