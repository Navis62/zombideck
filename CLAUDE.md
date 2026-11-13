# Zombie Deck

Application Expo / React Native (Expo Router, paysage, thème sombre) qui remplace le paquet de cartes d'apparition
des zombies de Zombicide 2e édition. Hors ligne, sans compte ni collecte de données, publiée sur Google Play,
corrections envoyées en OTA (EAS Update). Projet perso, un seul développeur, Windows.
Le README décrit les fonctionnalités et l'organisation du code : @README.md
Consignes Expo (doc versionnée, commandes, CNG) : @AGENTS.md

## Commandes

```bash
npm test            # moteur et données (node --test src/game/engine.test.ts, ~1 s)
npm run typecheck   # tsc --noEmit ; attrape aussi une traduction manquante
npm run lint        # expo lint
npx expo start      # serveur de dev ; aperçu web : configuration « web » de .claude/launch.json
npx expo install <paquet>   # jamais npm install <paquet>
```

## Règles du dépôt

- Code, commentaires, noms de tests, README et commits **en anglais** ; on échange avec l'utilisateur dans sa langue.
- Les cartes (`src/data/decks.ts`) sont une transcription des paquets imprimés : on ne devine rien, on demande la
  carte. Un id de carte existant ne change jamais.
- Sauvegarde (une partie par univers) : tant que l'app est en bêta fermée (stabilisation), pas de migration : forme de la sauvegarde changée = `version` + `isValidSave` (l'ancienne partie est rejetée) + test ; la migration (`upgradeSave` + test de rechargement) reviendra après stabilisation.
  Un id de carte existant ne change jamais.
- Toute clé de traduction existe dans les 10 langues, avec les termes officiels de chaque édition.
- `android/` est généré : configurer dans `app.json`. Un changement natif impose un build store (fingerprint).
- Pas de publication (`eas update`, `eas build`, `eas submit`) ni de push sans demande : `/release`, `/ship`.

## Où regarder

- Règles détaillées par zone : `.claude/rules/` (chargées selon les fichiers touchés).
- Agents : `zd-architect` (conception, lecture seule), `zd-engine` (moteur, sauvegarde), `zd-content` (cartes,
  extensions, traductions), `zd-ui` (écrans), `zd-tester`, `zd-reviewer` (relecture, lecture seule).
- Skills : `/check`, `/add-expansion`, `/add-language`, `/release`, `/ship`, `/ub-mode`, `/tech-debt-audit`.
