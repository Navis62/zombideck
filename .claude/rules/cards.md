---
paths:
  - "src/data/**"
  - "src/game/types.ts"
  - "src/components/card-face.tsx"
  - "src/components/zombie-art.tsx"
  - "assets/*/zombies/**"
  - "assets/*/abominations/**"
  - "assets/*/necromancers/**"
  - "assets/*/icons/**"
---

# Cartes (transcription des paquets physiques)

- `src/data/decks.ts` est une **transcription** des cartes imprimées : on ne devine pas un nombre de zombies, un type ou
  un numéro. Sans la carte (photo, liste fournie par l'utilisateur), demande-la.
- Identifiant = `<setId>-<numéro imprimé sur 3 chiffres>` (`core2e-037`). **Ne jamais renommer ni renuméroter un id
  existant** : les parties sauvegardées le référencent, et `isValidSave` jette toute sauvegarde qui contient un id
  inconnu (le joueur perd sa partie en cours).
- `counts` est dans l'ordre Bleu, Jaune, Orange, Rouge. Les cartes l'impriment **de haut en bas, Rouge en premier** :
  inverse l'ordre en transcrivant.
- Les extensions se suivent sans trou à partir de #041 (test « expansion cards follow the printed numbers ») ; le
  paquet de base reste à 40 cartes, Fort Hendrix le remplace carte pour carte (`replaces`).
- Nouveau set : `optional: true`, `replaces` s'il remplace un set, `addsZombies: true` s'il doit diluer les
  Abominations du kit (`scaled`), et `isHard` (partie difficile) comme le livret de règles la trie. Puis
  `set.<id>` dans **chaque** fichier de `src/i18n/`. Suis `/add-expansion`.
- Nouveau type de zombie : `ZombieType` (`types.ts`), noms `zombie.<type>.other` (+ `.rush`, `.all` si ces cartes
  existent) dans chaque langue, illustration dans `MODERN_OFFICIAL` ou `FANTASY_OFFICIAL` (art officiel), sinon `MODERN_ART` (dessin), dans `zombie-art.tsx`, symbole dans `ZOMBIE_SYMBOLS`
  (`card-face.tsx`) si la carte en imprime un.
- Illustrations : `assets/<univers>/zombies/` ; `<type>-cartoon.jpg` pour un dessin (Modern seulement, quand il n'y a pas d'art officiel) ; l'art officiel (`<type>-official.png` ou `-official.jpg`, réduit à 256 couleurs ou en JPEG) est préféré quand il existe, les originaux en pleine taille vont dans `.art-sources/` (ignoré par git) ; les Abominations (génériques et nommées) vont dans `assets/<univers>/abominations/`, les Nécromanciens (Fantasy) dans `assets/fantasy/necromancers/`, la liste faisant foi étant `src/data/threat.ts` ; JPEG de 1280 px de haut. Symboles : `assets/<univers>/icons/`, PNG. Un asset propre à un univers va dans son dossier ; seuls les fichiers que cite `app.json` restent hors des dossiers d'univers (icônes à la racine de `assets/`, et `assets/cards/back.jpg`, l'écran de démarrage) : les déplacer changerait l'empreinte native.
- Quand un total change (cartes par set, parties facile / difficile), mets à jour le test correspondant dans
  `engine.test.ts` **avec la source** du nouveau chiffre, pas pour le faire passer.
