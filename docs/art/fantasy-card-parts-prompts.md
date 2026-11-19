# Fantasy card parts: prompts for Codex

The Fantasy universe (Black Plague, Green Horde, White Death, Eternal Empire and their expansions) draws its cards
in the app and writes its own translated texts on them. To look like the printed Zombie cards, it needs a set of
**blank card parts** taken from the printed Black Plague cards.

Reference: the official Black Plague rulebook (user's PDF, "Rulebook - Black Plague.pdf"), which shows printed
Zombie cards: "Standard Zombies Invasion #01" (pages 16 and 25), "1 Extra Activation #38" and "Double Spawn! #54"
(page 26). What they look like:
- a dark red card border with rounded corners, the card body in aged cream parchment with faint stains;
- at the top, a parchment title plate with a slightly torn lower edge and a small inked rat or dragon emblem in its
  top right corner (title written by the app, dark brown medieval serif);
- under the title, centred, a short dark iron bar with a riveted ring at each end and a small plate in the middle
  where the card number is written ("01");
- four Danger Level rows stacked top to bottom (Red, Orange, Yellow, Blue), each a parchment strip with a painted
  flame on its left in the level's colour (red, orange, yellow, blue), the zombie name small in italic and its count
  large ("Fatty / x2"), and a dark zombie silhouette on the right (all written or drawn by the app);
- on special cards (Double Spawn!, Necromancer!, Abominations), an illustration under the title on a dark red
  smoky background, and a torn parchment scroll at the bottom holding the card text.

## Instructions for Codex

1. **No text, no letters, no numbers, no zombie silhouettes** anywhere: the app writes the titles, the numbers, the
   names and the counts in ten languages, and draws the zombies itself.
2. Same painted, slightly grungy medieval style for every part, flat front view, no perspective, no drop shadow
   outside the part, so that the parts fit together and match the rulebook's cards.
3. Save each file at the exact path and size, PNG with transparency outside the part, unless the entry says JPEG.
   Keep each file under 200 KB.
4. Do not touch any other file: the code is wired separately. Report the files written.

## Parts, `assets/fantasy/cards/`

| File | Size | Subject |
|---|---|---|
| `frame.png` | 900x1257 (card ratio 63:88) | The card border only, **transparent inside**: a dark blood-red border with rounded outer corners, about 4 % of the card width, slightly worn edges and a thin darker inner line. |
| `parchment.jpg` | 900x1257, JPEG quality 85 | The plain card body: aged cream parchment with soft brown stains, faint creases and darker edges, nothing drawn on it. |
| `title-plate.png` | 820x200 | The title plate, blank: a lighter parchment band with a slightly torn, irregular lower edge and a thin brown outline, a small inked rat emblem in the top right corner (like a woodcut stamp), room for one or two lines of title. |
| `number-bar.png` | 420x70 | The number bar under the title, blank: a short dark iron bar with a riveted ring at each end and a small rectangular plate in the middle, its centre left plain (the number goes there). |
| `level-row.png` | 820x200 | One Danger Level row, blank: a parchment strip with a thin brown outline and torn ends, **no flame** (separate files below), room for a small name and a big count in the middle and a silhouette on the right. |
| `flame-red.png`, `flame-orange.png`, `flame-yellow.png`, `flame-blue.png` | 260x200 each | The painted flame on the left of a row, one per Danger Level colour: a tall flickering watercolour flame with dark ink strokes, red / orange / yellow / blue, rising from the bottom, fading to transparent on its right edge so it blends into the row. |
| `text-scroll.png` | 820x300 | The text scroll of special cards, blank: a torn cream parchment scroll with curled ends and a thin brown outline, room for two to four lines of centred text. |
| `art-background.jpg` | 900x700, JPEG quality 85 | The background behind a special card's illustration: dark blood-red and black smoke, faint embers and ash, darker at the edges, nothing else on it. |
