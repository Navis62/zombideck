# Western (Zombicide: Undead or Alive) prompts for Codex

The art of the **Western** universe: the Walkers, Runners, Brutes and Long-Dead Walkers, one picture per named
Abomination, the carousel/menu background and the card back. They go in `assets/western/` and are wired separately
(`src/components/zombie-art.tsx` and the universe tables). The setting is the 19th-century American Wild West:
a dusty frontier town, saloon, desert, mesas, a sunset orange and ochre sky. No modern city, no medieval fantasy,
no sci-fi. All the Abominations below are zombie Abominations (undead flesh), not machines or spirits, except where
the subject says otherwise.

## Instructions for Codex

1. Before generating, look at the existing art of the other universes, for example
   `assets/invader/abominations/spoiler-abomination-cartoon.jpg`, `assets/fantasy/abominations/abominarat-cartoon.jpg`
   and `assets/invader/zombies/xeno-worker-cartoon.jpg`: the Western pictures use the same inked comic-book style and
   the same cream parchment rounded border, only the setting and the palette change.
2. The user provides photos of the printed Western cards: they are the **main reference** for every subject (pose,
   costume, colours, props). Where a card and the text below disagree, follow the card. Redraw in our style, do not
   copy or trace. No actor likeness: invented faces only.
   The official Western zombies gallery (https://www.zombicide.com/western-zombies-gallery/) shows the full,
   uncropped artwork of six of them; open each page and use it as the reference for the whole figure, which the
   cards crop:
   - Walker: https://www.zombicide.com/pg/walker-5/
   - Runner: https://www.zombicide.com/pg/runner-4/
   - Brute: https://www.zombicide.com/pg/brute-2/
   - Abomination (the Bowler Hat): https://www.zombicide.com/pg/abomination-4/
   - Nightmare Horse: https://www.zombicide.com/pg/nightmare-horse-abomination/
   - Steam Monster: https://www.zombicide.com/pg/steam-monster/

   The promo zombies gallery (https://www.zombicide.com/western-promo-zombies-gallery/) has the full artwork of the
   Long-Dead Walkers and of the pack Abominations; use them the same way:
   - Long-Dead Walker: https://www.zombicide.com/pg/long-dead-walkers/
   - Abominabear: https://www.zombicide.com/pg/abominabear/
   - Abominape: https://www.zombicide.com/pg/abominape/
   - Alpha Bane: https://www.zombicide.com/pg/alpha-bane/
   - Bizon: https://www.zombicide.com/pg/bizon/
   - Blood Bull: https://www.zombicide.com/pg/blood-bull/
   - Cactus Queen: https://www.zombicide.com/pg/cactus-queen/
   - Crocosaur: https://www.zombicide.com/pg/crocosaur/
   - Deathgrasp: https://www.zombicide.com/pg/deathgrasp/
   - Fat Mace: https://www.zombicide.com/pg/fat-mace/
   - Gore Geyser: https://www.zombicide.com/pg/gore-geyser/
   - Little Trickster: https://www.zombicide.com/pg/little-trickster/
   - Melting Pot: https://www.zombicide.com/pg/melting-pot/
   - Plymouth Hound: https://www.zombicide.com/pg/plymouth-hound/
   - Pusbag: https://www.zombicide.com/pg/pusbag/
   - Rotten Claw: https://www.zombicide.com/pg/rotten-claw/
   - Swamp Tongue: https://www.zombicide.com/pg/swamp-tongue/
   - Texas Deadhorn: https://www.zombicide.com/pg/texas-deadhorn/
   - The Great Trickster: https://www.zombicide.com/pg/the-great-trickster/
   - Wendigo: https://www.zombicide.com/pg/wendigo/

   Only the Bowler Hat (core box, see the Abomination page above) has no page of its own. The other figures of the
   promo gallery (Gunslinger, Horse Head Walker, Lumberjack, Mariachi, Miner, Revenant, Snake Oil Salesman, Soldier,
   Stagecoach Driver, Station Master, Teacher) have no spawn card: don't draw them.
3. For each entry, generate **one** image from the shared style block followed by the entry's subject. Generate in
   portrait (1024x2304 or taller, 4:9) for the zombies and abominations.
4. Post-process each image: center-crop to a 4:9 ratio and resize to **576x1280**, save as **JPEG quality 85**
   (target under 350 KB) at the path given by the entry. The background and the card back have their own size, see
   their sections.
5. Do not touch any other file: the code is wired separately.
6. Report the files written and any entry drawn without a card photo.

## Shared style block (prepend to every zombie and Abomination subject)

> Full-body character for the Zombicide Wild West zombie card game, gritty inked comic-book illustration, heavy
> black linework, cel shading with splattered textures, violence kept comic-book. Background: a dusty frontier town
> street at sunset, a saloon and wooden shopfronts in silhouette, a desert with red mesas far away, a burnt orange
> and ochre sky, dust in the air. The character stands centered, filling most of the frame from head to feet, at a
> three-quarter angle, menacing. The picture is framed by a worn cream parchment border with rounded corners and
> grunge edges. Vertical 4:9 portrait composition. No text, no letters, no numbers, no watermark, no card frame other
> than the parchment border.

## Zombies, `assets/western/zombies/`

| File | Subject |
|---|---|
| `western-walker-cartoon.jpg` | Western Walker, first variant: a shambling old man, grey rotting skin, a filthy sleeveless undershirt and dirty suspenders, torn trousers, arms hanging forward, vacant white eyes, mouth open. |
| `western-walker-2-cartoon.jpg` | Western Walker, second variant: a shambling woman in a ruffled red saloon dress, torn and stained, a flower in her tangled hair, grey rotting skin, arms reaching forward, vacant white eyes. |
| `western-runner-cartoon.jpg` | Western Runner: a lanky, wiry undead cowboy-farmer caught mid-sprint, a red bandana around his neck, suspenders over a torn shirt, scrawny arms thrown forward, wild eyes, gaping mouth. |
| `western-brute-cartoon.jpg` | Western Brute: a huge bald hulking zombie with a small head and massive arms, torn clothes and dirty bandages wrapped around his fists and torso, stitched grey-green skin, a heavy stomping pose. A second variant exists on the cards (the same brute in a red union suit): draw the first, then if the card photo shows the red union suit, draw it as `western-brute-2-cartoon.jpg` and say so in the report. |
| `long-dead-walker-cartoon.jpg` | Long-Dead Walker (Kickstarter): a dried-out skeleton-like walker, brown leathery skin stretched over bones, rags of a trail outfit, long stringy hair, an old hat lost on its back, walking in the desert, a bleached cattle skull and a cactus nearby. |

## Abominations, `assets/western/abominations/`

Each one is a big boss, bigger than the zombies, drawn in the same style block. Keep every one clearly undead.

| File | Subject |
|---|---|
| `bowler-hat-cartoon.jpg` | Bowler Hat (core box, also the art of the generic ABOMINATION card): a giant mutated brute towering over the street, swollen muscles, stitched grey skin, a row of bone spikes along its back, and a ridiculous tiny bowler hat perched on its head. |
| `nightmare-horse-cartoon.jpg` | Nightmare Horse: a rotting undead horse, exposed ribs and torn flesh, glowing red eyes, a smoking mane, a broken saddle and trailing rusty chains, rearing on its hind legs. |
| `abominape-cartoon.jpg` | Abominape: a giant undead ape, patchy matted fur over rotting muscle, long arms with huge clawed hands, one hand reaching out to snatch someone, an angry roaring face. |
| `crocosaur-cartoon.jpg` | Crocosaur: a huge undead crocodile-dinosaur hybrid, scaly torn hide, exposed ribs, a jaw full of broken teeth, a thick heavy tail, crawling out of a muddy river bank. |
| `abominabear-cartoon.jpg` | Abominabear: a monstrous undead grizzly bear, rotting fur, bare bone showing on the skull and shoulders, long yellow claws, roaring, standing on its hind legs. |
| `texas-deadhorn-cartoon.jpg` | Texas Deadhorn: an undead longhorn steer, huge curved horns, patchy hide over a bony frame, a Texas brand mark burned on the flank, glowing eyes, snorting steam. |
| `bizon-cartoon.jpg` | Bizon: a giant undead bison charging, a shaggy hump, rotting hide with exposed ribs, broken horns, dust clouds from its hooves, head lowered. |
| `blood-bull-cartoon.jpg` | Blood Bull: a furious undead bull covered in blood, red-stained hide, a ring in its nose, sharp horns dripping, glowing red eyes, charging down the street. |
| `little-trickster-cartoon.jpg` | Little Trickster: a small sly undead coyote-spirit creature in a ragged poncho, a crooked toothy grin, a feathered charm and a dice in its claws, mischievous and sinister, a child-sized figure that still dominates the frame. |
| `gore-geyser-cartoon.jpg` | Gore Geyser: a bloated undead monster with a gaping chest cavity, blood and gore spraying out of it like a geyser, bursting veins, a dislocated jaw, ragged remains of a miner's clothes. |
| `melting-pot-cartoon.jpg` | Melting Pot: a huge fat mass of fused corpses, many arms, faces and legs merged into a single lumpy body, small walkers' limbs sticking out of it, dripping melted flesh, a rusty cauldron-like belly. |
| `plymouth-hound-cartoon.jpg` | Plymouth Hound: a huge undead hound with a rotting skull-like head, exposed jaw and ribs, a pilgrim's buckled hat and a torn black collar, hackles raised, ready to pounce. |
| `pusbag-cartoon.jpg` | Pusbag: an enormous bloated corpse swollen with pus, stretched yellow-green skin ready to burst, boils and sacks all over the body, small arms and a drooping face, ragged clothes barely holding on. |
| `the-great-trickster-cartoon.jpg` | The Great Trickster: a tall undead figure with a coyote's skull-like head, a feathered headdress, a ragged ceremonial poncho, glowing eyes and a wide fanged grin, three small avatars around it: a black raven on one shoulder, a coyote at its feet, a rabbit in its hand, all with glowing eyes. The three avatars (Raven, Coyote, Rabbit) are part of this one picture. |
| `cactus-queen-cartoon.jpg` | Cactus Queen: a monstrous undead woman fused with a giant cactus, green spiny skin and arms like cactus limbs, pink flowers blooming on her head as a crown and on her body, a torn old dress, long thorns, a menacing smile. |
| `alpha-bane-cartoon.jpg` | Alpha Bane: a fast, lean, muscular undead beast-man, an alpha predator, long claws, a wolf-like feral face, scarred grey skin, an agile aggressive crouch ready to strike. |
| `deathgrasp-cartoon.jpg` | Deathgrasp: a gaunt undead creature with enormous grasping hands and long fingers reaching toward the viewer, a pale skeletal body, ragged shroud, dragging its victims in. |
| `fat-mace-cartoon.jpg` | Fat Mace: a very fat hulking undead brute carrying a huge spiked mace made from a wagon wheel hub and a fence post, stitched belly, small angry eyes, leather straps and rusty buckles. |
| `swamp-tongue-cartoon.jpg` | Swamp Tongue: an undead swamp creature, slimy green-brown skin, covered in moss, a huge sticky tongue lashing out of a wide mouth, bulging eyes, standing in a bog with reeds. |
| `rotten-claw-cartoon.jpg` | Rotten Claw: an undead monster with one gigantic rotten claw arm, exposed bone and dripping tissue, tiny body, long rusty talons, raised to rake. |
| `wendigo-cartoon.jpg` | Western Wendigo: a tall emaciated undead creature with antlers, a skull-like deer head, long thin limbs with claws, pale rotting skin stretched over ribs, glowing eyes, a dark frozen-forest mood at dusk. It is a different creature from the Modern Wendigo: look at the card photo and `assets/modern/abominations/` and do not copy that one. |
| `steam-monster-cartoon.jpg` | Steam Monster (Gears & Guns; rule: when it enters a Zone, any Steam Nozzles in it are Broken): a hulking pale undead brute, flesh and bandages, a top hat on its head, brass goggles over one eye, a tattered dark long coat, raising a big pipe wrench in one hand, a broken smoking tube or pipe on the other arm leaking steam. Still undead flesh, not a machine. Follow the card and miniature photos. |

## Background, `assets/western/backgrounds/`

Landscape **1920x960** (same size as the Fantasy and Invader backgrounds, `assets/fantasy/backgrounds/ruined-castle.jpg`),
JPEG quality 85. No characters, no text, calm enough for menu buttons on top.

| File | Subject |
|---|---|
| `dusty-town.jpg` | A deserted dusty frontier town at sunset: a wide empty main street with a saloon, a general store, a jail and a water tower, a few wooden fences and a tumbleweed, red mesas and a desert in the distance, a burnt orange and ochre sky with long clouds, a hint of zombie silhouettes far away, inked comic-book style, heavy linework, painted dust. No parchment border. |

## Card back, `assets/western/cards/`

Portrait **853x1280**, JPEG quality 85 (same size as `assets/fantasy/cards/back-fantasy.jpg` and
`assets/invader/cards/back-invader.jpg`: look at both for the layout, the title and the parchment border).

| File | Subject |
|---|---|
| `back-western.jpg` | Card back of the Western deck: a worn wanted-poster and wooden-sign look, weathered planks with nails, a sheriff star, two crossed revolvers, a skull in a cowboy hat in the center, the title "ZOMBIE DECK" in bold western slab-serif letters on a wooden plank header like the other backs, cream parchment border with rounded corners and grunge edges, orange and ochre palette. The only text allowed is "ZOMBIE DECK". |
