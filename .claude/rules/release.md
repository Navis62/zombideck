---
paths:
  - "app.json"
  - "eas.json"
  - "package.json"
---

# Configuration native et publication

- `runtimeVersion` suit la politique **fingerprint** : ajouter ou mettre à jour un module natif, un plugin dans
  `app.json`, une permission ou une icône change l'empreinte. Une mise à jour OTA ne touche alors **que** les builds
  qui ont la même empreinte : le changement natif exige un nouveau build sur les stores (`eas build`), signale-le.
- Dépendances : `npx expo install <paquet>` (versions compatibles avec le SDK), jamais `npm install <paquet>`.
  Après un ajout : `npx expo-doctor`. Un module natif nouveau ne marche pas dans Expo Go : build de développement.
- `android/` est généré (prébuild, ignoré par git) : on ne l'édite pas, on configure dans `app.json` ou un plugin.
- Canaux EAS : `development`, `preview` (APK interne), `production`. `appVersionSource: remote` et
  `autoIncrement` : ne pas toucher aux numéros de version à la main.
- Toute publication (`eas update`, `eas build`, `eas submit`) est une action envers les joueurs ou les stores :
  jamais sans accord explicite de l'utilisateur, et l'envoi en production, c'est lui qui le lance (`/release`).
- `PRIVACY.md` : l'application ne collecte rien. Toute dépendance qui envoie des données (analytics, crash
  reporting, publicité) contredit la politique publiée : à refuser ou à discuter avec l'utilisateur d'abord.
