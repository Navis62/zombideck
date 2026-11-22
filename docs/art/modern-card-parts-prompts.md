# Modern card parts: prompts

The Modern universe (Zombicide 2nd Edition) draws its spawn cards in the app and writes its own translated texts on
them. To look like the printed Zombie cards it needs a few **blank card parts**. The zombies
(`assets/modern/**/<name>-official.png`) and the background (`assets/modern/backgrounds/generic-horde.jpg`) are already
in place: nothing to draw there.

References, to attach to the prompt (crops of the 2nd Edition rulebook pages 4, 17, 25 and 26, kept out of git in
`.art-sources/modern/references/`): `spawn-walkers-p25.png`, `rush-fatty-p26.png`, `extra-activation-p26.png`,
`abomination-cards-p17.png`.

## What the printed cards look like

- No frame: the picture runs to the rounded edges of the card, behind everything.
- A flat title banner across the top, over the picture. Its lower edge is **slanted, rising slightly to the right**
  (about 3 degrees), lined with a thin dark line and a row of hand-painted slanted hazard dashes, dry-brush style:
  - spawn: black banner, **white** dashes, white title;
  - Rush: yellow banner (`#fed000`), **black** dashes, black title;
  - Extra Activation: red banner (`#db121a`), **black** dashes, black title;
  - Abomination: black banner, **yellow** dashes, yellow title.
- The card number, small and dim, at the top right (written by the app).
- On the right, four white labels stacked Red, Orange, Yellow, Blue, running off the right edge of the card. Each is a
  clean white rectangle holding "x9"; on its right the white breaks up in a torn, splattered edge over the level
  colour (`#dc0f20`, `#e87c00`, `#fed100`, `#4594b2`), with a few white specks in the colour and a thin dark shadow
  under the label. On Extra Activation cards the same label is longer ("All Walkers").
- Rush, Extra Activation and Abomination cards have a flat footer band at the bottom, in the colour of the banner, with
  the same dashes: short slanted ones along the bottom edge and a thicker one at each end.

## Prompt to paste

> Attached are four photos of printed cards, for the style only. Draw the blank graphic parts listed below, one image
> per part, so that they can be layered to rebuild such a card.
>
> Rules for every part: flat front view, no perspective, no card, no mock-up, no zombie, no background scene. **No
> text, letters, numbers or logos.** Solid flat colours with a light screen-print grain, and hand-painted dry-brush
> dashes like worn hazard tape. PNG at the exact size given, really transparent outside the part (no checkerboard, no
> white or grey backing, no halo). Same brush and same grain for all the parts, so that they look like one set.
>
> 1. `header-spawn.png`, 900x300. A black (#0b0b0b) banner filling the whole width and the top of the image. Its lower
>    edge is slanted: at 290 px from the top on the left, at 245 px on the right. Along that edge, a thin dark line and
>    a row of 8 to 9 slanted white dry-brush dashes about 45 px tall, cut by the edge of the banner. Everything above
>    the dashes is plain black, kept empty. Transparent below the edge.
> 2. `header-rush.png`, 900x300. Exactly the same shape and dashes, banner yellow #fed000, dashes black.
> 3. `header-extra.png`, 900x300. Exactly the same shape and dashes, banner red #db121a, dashes black.
> 4. `header-abomination.png`, 900x300. Exactly the same shape and dashes, banner black #0b0b0b, dashes yellow #fed000.
> 5. `footer-rush.png`, 900x200. A yellow #fed000 band filling the image, straight top edge, opaque. A row of 7 to 8
>    slanted black dry-brush dashes about 45 px tall along the bottom edge, and one thicker black dash at each end,
>    half way up, cut by the sides. The middle (from 110 to 790 px wide, 15 to 140 px high) is plain and empty.
> 6. `footer-extra.png`, 900x200. Exactly the same, band red #db121a, dashes black.
> 7. `footer-abomination.png`, 900x340. The same idea on a taller band: black #0b0b0b, yellow #fed000 dashes along the
>    bottom edge and one at each end. The middle (from 110 to 790 px wide, 15 to 280 px high) is plain and empty.
> 8. `count-paper.png`, 420x150. A plain white paper label, opaque, straight on its left, top and bottom edges, from the
>    left edge to about 250 px. Beyond that the white breaks up in a torn, splattered, grunge edge, with a few
>    separate white specks up to about 360 px; transparent after that. Nothing but pure white and transparency: the
>    level colour is added behind by the app. No shadow.
> 9. `activation-paper.png`, 760x150. Exactly the same label, longer: plain white up to about 600 px, the torn edge and
>    the specks between 600 and 710 px, transparent after that.
>
> Draw part 1 first and wait for my approval before the others.

`footer-spam.png` (the bottom of the SPAM text panel) is not drawn: it is `footer-abomination.png` with its dashes turned
white, to redo if that part changes.

## Where the files go

`assets/modern/cards/`, under the names above. Each is then reduced to at most 200 KB (256 colours with alpha) before
it is wired. The layout depends on the sizes given here: a part redrawn at another ratio needs its constants changed in
`src/components/card-face.tsx`.

Check on receipt: real transparency (look at the part on a magenta ground), no letter or number, the four headers
superimposable, the white parts pure white (they are tinted from behind).
