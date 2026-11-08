---
paths:
  - "src/app/**"
  - "src/components/**"
  - "src/theme.ts"
---

# Écrans et composants

- Expo Router : chaque fichier de `src/app/` est un écran ; le code qui n'est pas une route va dans
  `src/components/` ou `src/game/`. Imports via l'alias `@/`.
- Application **paysage uniquement**, thème sombre. Couleurs depuis `theme.ts` (`COLORS`, `CARD_COLORS`,
  `DANGER_COLORS`), retour visuel `PRESSED` sur tout `Pressable` : pas de couleur en dur.
- Tout texte affiché passe par `t(...)` (`useApp()`), y compris `accessibilityLabel` : aucune chaîne en dur.
- Accessibilité : la carte piochée est lue par TalkBack / VoiceOver ; un bouton a `accessibilityRole` et un
  libellé, un choix a `accessibilityState` (`selected`). Ne casse pas l'annonce de la carte.
- Le téléphone reste posé sur la table pendant la partie : gros boutons, `useKeepAwake` sur l'écran de jeu, pas
  d'action destructive en un seul toucher (« Tout remélanger » demande un second toucher, `CONFIRM_MS`).
- Les tailles et délais sont des constantes nommées en tête de fichier (`MIN_CARD_WIDTH`, `CONFIRM_MS`…), avec un
  commentaire qui dit pourquoi.
- Le web (react-native-web) sert d'aperçu : `useNativeDriver` est désactivé sur web, les vibrations n'existent pas
  (`feedback.ts` l'ignore). Une API absente sur web se protège par `Platform.OS`.
- Vérifier une modification visible dans l'aperçu web (`.claude/launch.json`, configuration `web`, port 8081), en
  paysage et à plusieurs largeurs, puis dire à l'utilisateur ce qui reste à voir sur un vrai téléphone (vibration,
  lecteur d'écran, encoche).
- Une fonctionnalité visible ajoutée ou changée : mets à jour la liste « Features » du `README.md`.
