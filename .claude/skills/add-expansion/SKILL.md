---
name: add-expansion
description: "Ajoute une extension ou une promo de Zombicide 2e édition au paquet de Zombie Deck : transcription des cartes dans src/data/decks.ts, nom dans les 8 langues, nouveaux types de zombies (illustration, symbole), tests de totaux, README et fiche store. À utiliser quand l'utilisateur veut ajouter un set de cartes."
argument-hint: "<nom de l'extension> [photos ou liste des cartes]"
---

# add-expansion

Extension : `$ARGUMENTS`

Sets existants : !`grep -oE "^const [A-Z_]+ = '[a-zA-Z0-9]+'" src/data/decks.ts`
Dernier numéro de carte : !`grep -oE "'[0-9]{3}'" src/data/decks.ts | sort | tail -1`

## Avant d'écrire

Il faut **les cartes elles-mêmes** (photos ou liste : numéro, type, Rush / Extra Activation, nombres par niveau,
symbole imprimé). Sans elles, demande-les : on ne transcrit pas de mémoire. Demande aussi, si ce n'est pas évident :
le set remplace-t-il un paquet (`replaces`) ? Ajoute-t-il des zombies (`addsZombies`, dilue les Abominations du
kit) ? Comment son livret trie-t-il la partie difficile (`isHard`) ?

## Étapes

1. **Constante** du set et entrée dans `CARD_SETS` (`optional: true`), à la suite des sets existants : la
   numérotation des extensions continue sans trou après le dernier numéro.
2. **Cartes** avec `spawn`, `rush`, `extra`, `special`, `shooter` ; `counts` dans l'ordre Bleu, Jaune, Orange,
   Rouge (la carte imprime le Rouge en haut).
3. **Nouveau type de zombie** s'il y en a un : `ZombieType` (et `RushZombie` / `ExtraZombie`), illustration
   `assets/zombies/<type>-cartoon.jpg` dans `ART` (`zombie-art.tsx`), symbole dans `assets/icons/` et
   `ZOMBIE_SYMBOLS` (`card-face.tsx`). Sans illustration fournie, dis-le : n'en fabrique pas.
4. **Traductions** : `set.<id>` et, pour un nouveau type, `zombie.<type>.other` (+ `.rush`, `.all`) dans les 8
   fichiers de `src/i18n/`, avec le nom officiel de l'édition de chaque langue ; liste ceux dont tu n'es pas sûr.
5. **Tests** (`engine.test.ts`) : ajoute le set à « every set splits into easier and harder cards » et mets à jour
   les totaux (174 cartes d'extension, numérotation jusqu'au dernier numéro, part des Abominations) d'après les
   cartes, pas d'après le résultat du code.
6. **Docs** : liste des extensions dans `store/listing.md` (toutes les langues) et README si besoin.
7. `/check`.

Rends compte : cartes ajoutées (nombre, facile / difficile / Extra), noms par langue et ceux à vérifier, totaux des
tests, et rappelle que c'est publiable en OTA sauf si un module natif a été ajouté.
