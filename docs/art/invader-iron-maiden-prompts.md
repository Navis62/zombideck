# Invader Iron Maiden Eddies: prompts for Codex

One picture per Eddie Abomination of the Invader cards of Iron Maiden Pack 1 (Cyborg Eddie, Samurai Eddie) and
Pack 2 (Bassist Eddie, Bounty Hunter Eddie), drawn in the **Invader** style. They are drawn and wired in
`INVADER_ART` (`src/components/zombie-art.tsx`).

Eddie is Iron Maiden's mascot: a grinning, rotting skeletal man with taut grey-blue skin over the skull, glowing
eyes, a lipless grin of yellowed teeth and long wild hair. He is a **character, not a Xeno**: keep his face and
silhouette recognisable, only the costume changes from one Eddie to the next.

## Instructions for Codex

1. Before generating, look at the Invader pictures `assets/invader/abominations/spoiler-abomination-cartoon.jpg`,
   `assets/invader/abominations/juggernaut-abomination-cartoon.jpg` and `assets/invader/zombies/xeno-worker-cartoon.jpg`:
   every new picture must look like it belongs to that set (inking, palette, moonlit mining outpost, parchment border).
2. Use the existing Eddie pictures as the **design reference** for the character (costume, props, face), not for the
   style or the background:
   - Cyborg Eddie: `assets/modern/abominations/cyborg-eddie-cartoon.jpg`
   - Samurai Eddie: `assets/fantasy/abominations/samurai-eddie-cartoon.jpg`
   - Bassist Eddie: `assets/modern/abominations/bassist-eddie-cartoon.jpg`
   - Bounty Hunter Eddie: no existing picture; the user provides a photo of the printed card. Follow the subject below.
   The user also provides photos of the printed Invader cards: where a card and the text disagree, follow the card.
   Redraw in our style, do not copy or trace.
3. For each entry, generate **one** image from the shared style block followed by the entry's subject. Generate in
   portrait (1024x2048 or taller, 1:2).
4. Post-process each image: center-crop to a 1:2 ratio and resize to **640x1280**, save as **JPEG quality 85**
   (target under 350 KB) at the path given by the entry.
5. Do not touch any other file: the code (`INVADER_ART`) is wired separately.
6. Report the files written and any entry drawn without a card photo.

## Shared style block (prepend to every subject)

> Full-body character for the Zombicide sci-fi card game, gritty inked comic-book illustration, heavy black
> linework, cel shading with splattered textures, violence kept comic-book. Cold teal and slate-blue background: a
> pale moon in a night sky, a mining outpost and gantries in silhouette with a few small red and cyan lights, dust on
> grey rock. The character stands centered, filling most of the frame from head to feet, at a three-quarter angle,
> menacing like a boss. The picture is framed by a worn cream parchment border with rounded corners and grunge
> edges. Vertical 1:2 portrait composition. No text, no letters, no numbers, no band logo, no watermark, no card
> frame other than the parchment border.

## Entries, `assets/invader/abominations/`

| File | Subject |
|---|---|
| `cyborg-eddie-abomination-cartoon.jpg` | Cyborg Eddie (Iron Maiden Pack 1): Eddie as a futuristic cyborg gunslinger. Half of his skull and torso are replaced by bolted chrome and red-glowing circuitry, a mechanical eyepiece with a red lens over one eye, exposed red muscle and cables on the chest and arms. He holds a long sci-fi laser pistol, its barrel glowing. Long dark hair, grey-blue skin, a wide toothy grin. |
| `samurai-eddie-abomination-cartoon.jpg` | Samurai Eddie (Iron Maiden Pack 1): Eddie as an undead samurai warlord in red-lacquered and dark-green armour plates, a horned kabuto helmet with a gold crest, a tattered war banner on his back. He holds a katana raised in both hands, ready to strike. Grey-blue skull face, glowing eyes, wide grin. |
| `bassist-eddie-abomination-cartoon.jpg` | Bassist Eddie (Iron Maiden Pack 2): Eddie as a wild rock bassist, a huge mane of white hair, bare bony arms, a leather vest, playing a battered electric bass guitar slung low like a weapon, mouth wide open in a scream. Grey-blue skin, glowing eyes. |
| `bounty-hunter-eddie-abomination-cartoon.jpg` | Bounty Hunter Eddie (Iron Maiden Pack 2): Eddie as a space bounty hunter, a wide-brimmed cowboy hat, a long red-brown duster coat open over a skeletal torso and exposed ribs, red-glowing goggles over his eyes, a lit match or thin cigar between his teeth, a heavy sci-fi revolver in hand. Grey-blue skin, grim grin. |
