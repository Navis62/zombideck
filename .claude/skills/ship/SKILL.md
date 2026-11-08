---
name: ship
description: "Livre le travail en cours de Zombie Deck : vérifications, commits petits et ordonnés, push vers origin. Use only when the user runs /ship or explicitly asks to commit and push."
disable-model-invocation: true
argument-hint: "[--no-push]"
---

# ship

Un seul développeur. `/ship` vaut accord pour commiter et pousser **ce** travail, pas les suivants. Il ne publie
rien auprès des joueurs : c'est `/release`.

Branche : !`git branch --show-current`
État : !`git status --short`

## Étapes

1. **Vérifier** avec `/check`. Ne continue pas si le lint, le typecheck ou un test échoue : rapporte l'échec.
2. **Relire** `git status` : ne commite jamais `android/`, `ios/`, `.expo/`, un keystore ou une clé (`*.jks`,
   `*.p8`, `*.p12`, `*.key`), un `.env`, ni un réglage personnel (`.claude/settings.local.json`,
   `CLAUDE.local.md`). Ajoute les fichiers un par un, pas `git add -A`.
3. **Commits** petits, un sujet chacun. Message **en anglais**, titre court à l'impératif qui dit ce qui change
   (« Fix Runner count on Rue Morgue card #123 »), puis, si le commit n'est pas trivial, un corps : pourquoi
   (le défaut ou le besoin), quoi, et la preuve (tests ajoutés, totaux). Termine par la ligne d'attribution demandée
   par l'environnement.
4. **Push** : `git push -u origin <branche>`, sauf si `$ARGUMENTS` contient `--no-push`. Sur une autre branche que
   `master`, propose la fusion ou une PR sans la faire.
5. Rends compte : la liste des commits (`git log --oneline -5`) et le résultat du push.

## Garde-fous

Pas de `--force`, pas de `--no-verify`, pas de `--amend` d'un commit déjà poussé. Si le push est refusé (distant en
avance), rapporte-le et propose `git pull --rebase` sans le lancer.
