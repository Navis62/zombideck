# Invader card parts: prompts for Codex

The Invader universe (Zombicide: Invader, Dark Side and their expansions) will show the official Xeno renders from
zombicide.com, cut by us. The app draws the card around them and writes its own translated texts, so it needs a set
of **blank card parts** taken from the look of the printed Invader Xeno cards.

Look at the printed cards before drawing (photos given by the user: "WORKERS SPAWN #03", "TANKS SPAWN #08",
"ONE EXTRA ACTIVATION #51", "SPOILER ABOMINATION #16", "MOLD SPAWN: 1 WORKER!"):
- a brushed grey sci-fi metal frame with bevelled, cut corners, small rivets and panel seams;
- at the top, a dark red title plate set in the metal, white title text (written by the app);
- under the title plate, on the right, a small orange number badge (number written by the app);
- on the right side, four Danger Level tabs: an angular hexagon-like badge holding "x8", followed by a long bar that
  runs out past the right edge of the card, coloured red, orange, yellow, blue from top to bottom;
- at the bottom, a yellow-and-black hazard stripe band inside the metal frame;
- on Abomination and Mold Spawn cards, a dark red text box under the picture, with a thin lighter red border;
- the background behind the Xeno is a dark navy panel with a faint grid and small "+" marks.

## Instructions for Codex

1. **No text, no letters, no numbers, no logos** anywhere: the app writes the titles, the numbers and the counts in
   ten languages.
2. Every part is a flat front view, no perspective, no drop shadow outside the part, the same metal and colours for
   all of them so that they fit together.
3. Save each file at the exact path and size, PNG with transparency outside the part (and inside where the entry
   says so). Keep each file under 200 KB.
4. Do not touch any other file: the code is wired separately. Report the files written.

## Parts, `assets/invader/cards/`

| File | Size | Subject |
|---|---|---|
| `frame.png` | 900x1257 (card ratio 63:88) | The whole card frame, **transparent in the middle** where the Xeno picture shows: brushed grey sci-fi metal border, about 4 % of the width on the sides and the bottom, bevelled cut corners, rivets and seams, a slightly darker inner edge. Leave the top of the frame plain metal: the title plate is a separate part. |
| `title-plate.png` | 760x190 | The title plate at the top of the card, blank: a dark red recessed panel (deep crimson, slightly worn) inside a raised grey metal surround with bevelled corners, a thin yellow-and-black hazard stripe strip along its lower edge, a small notch on the right where the number badge sits. |
| `number-badge.png` | 170x110 | The card number badge, blank: a small rounded-rectangle tag in warm orange with a darker orange rim and a thin grey metal outline, slightly bevelled, as printed under the title on the right. |
| `count-tab.png` | 520x150 | One Danger Level tab, blank and **neutral white / light grey** so that the app can tint it red, orange, yellow or blue: on the left an angular hexagon-like badge with a bevelled border (where "x8" is written), joined on its right to a long flat bar with a cut end, a subtle glossy sci-fi plastic look, faint scratches. |
| `text-box.png` | 760x330 | The text box of Abomination and Mold Spawn cards, blank: a dark red, slightly translucent-looking panel with a thin lighter red border and small cut corners, a faint grid texture, room for three to five lines of white text. |
| `hazard-band.png` | 860x110 | The bottom band: a yellow-and-black diagonal hazard stripe band, worn and scratched, set in a grey metal surround with rivets at both ends. |
| `background.jpg` | 900x1257, JPEG quality 85 | The plain background behind the Xeno: a dark navy-blue metal panel with a faint square grid, small "+" marks scattered at the grid crossings, a few darker rectangular panel shapes, a soft light from the top. Nothing else on it. |
