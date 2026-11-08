---
name: release
description: "Prépare une publication de Zombie Deck : vérifications, choix entre mise à jour OTA (EAS Update) et nouveau build store selon l'empreinte native, message de mise à jour, puis donne à l'utilisateur la commande exacte à lancer. Use only when the user runs /release or explicitly asks to publish an update or a build."
disable-model-invocation: true
argument-hint: "[ota | build] [message]"
---

# release

`/release` vaut accord pour **préparer** une publication, pas pour l'envoyer : une mise à jour en production arrive
chez tous les joueurs à leur prochain lancement, et l'envoi aux stores est irréversible. L'utilisateur lance la
commande finale lui-même (le hook `guard-bash.mjs` bloque `eas update` vers production, `eas submit` et `eas build --auto-submit`).

Branche : !`git branch --show-current`
État : !`git status --short`
Depuis le dernier tag ou les 15 derniers commits : !`git log --oneline -15`

## Étapes

1. **Propre** : rien de non commité, branche `master` à jour avec `origin`. Sinon, arrête-toi et dis-le
   (`/ship` d'abord).
2. **Vérifier** avec `/check`. Ne continue pas si quelque chose échoue.
3. **OTA ou build ?** Liste ce qui a changé depuis la dernière publication (demande la date ou le commit à
   l'utilisateur si tu ne la trouves pas). Changement natif = dépendance avec du code natif, plugin ou réglage
   natif dans `app.json` (icône, splash, permissions, `CFBundleLocalizations`, orientation), version d'Expo. Si
   possible, compare l'empreinte : `npx expo-updates fingerprint:generate --platform android` (demande l'accord
   pour lancer, puis compare au build en production si l'utilisateur la connaît).
   - Que du JavaScript, des textes, des cartes, des images : **OTA**.
   - Sinon : **build** ; une OTA n'atteindrait pas les joueurs (empreinte différente).
4. **Message** de mise à jour court en anglais, ce que les joueurs remarqueront (« Fix: Rue Morgue card #123 shows
   the right number of Runners »).
5. **Commande** à donner à l'utilisateur, dans un bloc à part :
   - OTA : `npx eas-cli@latest update --channel production --message "<message>"`
   - Build : `npx eas-cli@latest build --platform android --profile production`, puis l'envoi au Play Store
     (`npx eas-cli@latest submit --platform android`) ou depuis la console Play.
   Pour tester d'abord : même commande avec `--channel preview` (build `preview` installé en APK) : celle-là, tu
   peux la lancer après accord.
6. Rends compte : OTA ou build et pourquoi, la liste des changements, la commande, et ce qu'il faut vérifier sur un
   téléphone après réception (relancer deux fois l'app pour une OTA).
