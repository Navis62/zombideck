---
name: add-language
description: "Ajoute une langue à Zombie Deck : nouveau fichier dans src/i18n traduit depuis l'anglais avec les termes officiels de l'édition de cette langue, TRANSLATIONS et LANGUAGE_NAMES, CFBundleLocalizations iOS, README et fiche store. À utiliser quand l'utilisateur veut une nouvelle langue."
argument-hint: "<code de langue, ex. nl> [nom de l'édition locale de Zombicide]"
---

# add-language

Langue : `$ARGUMENTS`

Langues actuelles : !`ls src/i18n`

## Étapes

1. **Termes officiels** : Zombicide 2e édition existe-t-il dans cette langue ? Cherche les noms officiels des
   zombies (Walker, Runner, Fatty, Abomination…), « Rush », « Extra Activation », niveaux de Danger. Sans édition
   officielle, dis-le à l'utilisateur et demande quels termes utiliser avant de traduire les cartes.
2. **Fichier** : copie `src/i18n/en.ts` vers `src/i18n/<code>.ts`, exporte `<code>` typé
   `Record<TranslationKey, string>`, traduis chaque clé. Garde les paramètres `{n}` tels quels ; formes propres au
   titre Rush et à « Tous les … » si la grammaire l'exige.
3. **Branchement** dans `src/i18n/translations.ts` : import **avec l'extension `.ts`**, ajout à `TRANSLATIONS` et
   `LANGUAGE_NAMES` (nom de la langue écrit dans la langue elle-même).
4. `device-language.ts` reconnaît le `languageCode` de l'appareil : vérifie que le code choisi est celui
   qu'`expo-localization` renvoie (ex. `pt` pour le portugais du Brésil).
5. `app.json` : ajoute le code à `ios.infoPlist.CFBundleLocalizations`. C'est un changement natif : l'empreinte
   change, la langue n'arrivera sur iOS qu'avec un nouveau build ; signale-le.
6. README (liste des langues) et `store/listing.md` (nouvelle section, plus la liste des langues des autres
   sections).
7. `/check`, puis l'aperçu web dans la nouvelle langue : les textes longs tiennent-ils en paysage ?

Rends compte : clés traduites, termes officiels utilisés et leur source, termes incertains à faire relire par un
joueur de cette langue, résultat de `/check`.
