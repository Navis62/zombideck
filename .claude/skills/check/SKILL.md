---
name: check
description: "Vérification complète de Zombie Deck avant de considérer un travail fini ou de commiter : lint, typecheck, tests, expo-doctor si les dépendances ont changé, cohérence README et traductions. À utiliser après une modification de code, ou quand l'utilisateur demande « vérifie », « lance les tests », « c'est bon ? »."
allowed-tools: Bash(npm test) Bash(npm run typecheck) Bash(npm run lint) Bash(npx expo-doctor) Bash(git status *) Bash(git diff *)
---

# check

Fichiers modifiés : !`git status --short`

1. `npm run lint`
2. `npm run typecheck` (attrape aussi une clé de traduction oubliée dans une langue)
3. `npm test`
4. Si `package.json` ou `app.json` a changé : `npx expo-doctor`, et dis si l'empreinte native (fingerprint) change :
   nouvelle dépendance native, plugin, permission, icône = build store nécessaire, l'OTA ne suffira pas.
5. Si le diff touche `src/app/` ou `src/components/` : propose de vérifier dans l'aperçu web (configuration `web` de
   `.claude/launch.json`), en paysage.
6. README : si le diff ajoute ou change une fonctionnalité visible, une extension, une langue ou une commande,
   vérifie que le README le dit (« Features », « Adding content », liste des langues). Même chose pour
   `store/listing.md` (liste des extensions et des langues).

Rends compte en quelques lignes : résultat exact de chaque étape (passés / échoués / sautés), et pour un échec la
cause probable avec `fichier:ligne`. Ne corrige rien sans le dire.
