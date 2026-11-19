# Western art: prompts for Codex

The Western universe (Zombicide: Undead or Alive) shows the official CMON card art: the zombies and Abominations are
cut from scans of the printed cards, and the card back is the official one. The app draws its own translated texts
over them, so it needs a few **blank card parts** to write on. The pictures that are still drawn are listed below.

The generated art that the official art replaced is kept under the Git tag `generated-art`.

## Instructions for Codex

1. Look at the printed Western cards first (photos given by the user, and the scans the app uses in
   `assets/western/zombies/` and `assets/western/abominations/`): every part must look like it was cut from a real
   Undead or Alive card (same wood, same colours, same wear), so that the app's text on top looks printed.
2. **No text, no letters, no numbers** anywhere: the app writes the card title, the number and the counts itself, in
   ten languages.
3. Save each file at the exact path and size given, PNG with transparency where the entry says so, otherwise JPEG
   quality 90. Keep the files small (under 150 KB each).
4. Do not touch any other file: the code is wired separately.
5. Report the files written.

## Blank card parts, `assets/western/cards/`

| File | Size | Subject |
|---|---|---|
| `header-plank.png` | 1200x260, transparent outside the plank | The title plank at the top of an Undead or Alive Zombie card, blank: a light, slightly worn wooden board with visible grain and a few knots, its top edge covered by a torn red paint brush stroke that spills over the left and right ends, a thin double dark-brown rule (two horizontal lines) running along the lower third where the title would be underlined, a slightly irregular bottom edge. Flat front view, no perspective, no shadow outside the plank. |
| `footer-plank.png` | 1200x420, transparent outside the plank | The text plank at the bottom of an Undead or Alive Abomination card (where "No special rule." or the Abomination rule is printed), blank: the same light worn wood as the header, horizontal planks with grain, a darker wooden rim with two small rounded nail heads on the top edge, slightly irregular edges. Flat front view, room for three to five lines of centred text. |
| `count-label.png` | 360x150, transparent outside the label | The count label of an Undead or Alive Zombie card (where "x10" is printed), blank: a small cream / off-white paper or card label with torn, slightly ragged edges, a faint paper texture, and on its right end a short torn strip left blank in pure white (the app tints it red, orange, yellow or blue for the Danger Level). Flat front view, no shadow outside the label. |

## Background, `assets/western/backgrounds/` (done)

Landscape **1920x960**, JPEG quality 85. No characters, no text, calm enough for menu buttons on top.

| File | Subject |
|---|---|
| `dusty-town.jpg` | A deserted dusty frontier town at sunset: a wide empty main street with a saloon, a general store, a jail and a water tower, a few wooden fences and a tumbleweed, red mesas and a desert in the distance, a burnt orange and ochre sky with long clouds, a hint of zombie silhouettes far away, inked comic-book style, heavy linework, painted dust. No parchment border. |
