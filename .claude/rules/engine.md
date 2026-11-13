---
paths:
  - "src/game/**"
---

# Moteur de jeu et sauvegarde

- `engine.ts` : fonctions **pures** sur `GameState` (pas de React, pas d'AsyncStorage, pas d'Expo). Le hasard passe
  par un `Rng` injectable (`Math.random` par défaut) : les tests le fixent (`() => 0`).
- Toute action que le joueur peut annuler appelle `remember(state)` (historique limité à `MAX_UNDO`) ; une pioche de
  plusieurs zones s'annule d'un coup. `setZones` et `setDanger` ne s'annulent pas : c'est voulu.
- Une pile vide remélange la défausse, **jamais** les cartes en cours de distribution (`drawn`).
- **Sauvegarde** (une clé par univers) : changer la forme de `GameState` ou `Piles` = incrémenter `version` et
  étendre `isValidSave`, avec un test. Bêta fermée, en stabilisation : pas de migration, une partie à l'ancien
  format est rejetée sans plantage. Après stabilisation, la migration dans `upgradeSave` (l'ancienne version
  reste lisible) et son test de rechargement redeviendront obligatoires.
- Clés AsyncStorage `zombideck.*` (`store.tsx`, `review.ts`) : ne pas les renommer. Toute valeur relue est
  validée (`parse*`, `is*`) avec une valeur par défaut : le stockage peut contenir n'importe quoi.
- **Les tests tournent sous Node** (`node --test`, suppression de types) : un fichier importé par
  `engine.test.ts`, directement ou non, ne peut pas utiliser l'alias `@/`, doit importer ses valeurs avec
  l'extension `.ts` (`'./translations.ts'`), et pas d'`enum`, de `namespace` ni de propriétés de paramètres.
  Les imports `import type` sont libres.
- Tests : `node:test` + `node:assert/strict`, noms en anglais qui disent le comportement (« undo can step back over
  an automatic reshuffle »), jeux de cartes minimaux construits dans le test plutôt que `CARD_SETS` quand on
  teste le moteur.
