# Invader illustrations: prompts for the image generator

Every picture the third universe needs: Zombicide: Invader (core box) and Dark Side. Each one is drawn in the
house style of the existing art, which is already shared by Modern and Fantasy:

- zombies: `assets/modern/zombies/runner-cartoon.jpg`, `assets/fantasy/zombies/fantasy-walker-cartoon.jpg`
- card backs: `assets/cards/back.jpg` (Modern), `assets/fantasy/cards/back-fantasy.jpg`
- backgrounds: `assets/modern/backgrounds/ruined-city.jpg`, `assets/fantasy/backgrounds/ruined-castle.jpg`

Each universe keeps the same inking and the same worn border, but has **its own dominant colour and setting**.
Modern uses amber and orange over a ruined city. Fantasy uses sepia and orange over a ruined castle. Invader moves
to **cold deep-space blue and teal with alien blood-red accents**, over a mining outpost on an alien planet.

## The Invader setting (remind the generator of it)

Zombicide: Invader is science fiction. On PK-L7, a remote planet, a human mining colony extracts Xenium, a
precious ore. The miners woke up the **Xenos**, an alien swarm. Xenos are **not zombies and not undead**: they are
living alien organisms, with no human flesh, no rot and no human clothes. They come in a few castes:

- **Worker**: the basic Xeno, a gaunt humanoid.
- **Tank**: a huge, armoured brute.
- **Hunter**: a fast predator that runs on all fours.
- **Abomination**: a colossal monster.

The **Mold** is a dark purple-black alien growth that spreads over the base and spawns Xenos. In Dark Side,
the **Drillers** are a red, chitinous Xeno strain that lives deep in the mines. They burrow out of the ground
through **Pits**.

The scenery is industrial sci-fi: prefab modules, airlocks, bulkheads, hazard stripes, mining rigs and drills,
pipes, flickering lights, a sky full of stars over an alien horizon. There is no zombie-apocalypse city, no
castle, no magic.

**Do not copy the CMON card art.** Draw original creatures that match the descriptions below. Do not trace any
published Zombicide illustration.

## Instructions

1. Look at the reference files above first: every new picture must look like it belongs to the same set (heavy
   black inking, cel shading, splatter textures, worn rounded border), recoloured for Invader.
2. For each entry, generate **one** image from the shared style block of its kind (creature, background or card
   back), followed by the entry's subject.
3. Post-process it to the size given in the entry and save it as **JPEG quality 85** (target under 350 KB) at the
   path given.
4. Do not touch any other file: the code (`src/components/zombie-art.tsx`, translations, deck data) is wired
   separately.
5. Report the files written, and any entry you skipped or are unsure of.

## Creatures

### Shared style block (prepend to every creature)

> Full-body alien creature for a sci-fi survival card game, gritty inked comic-book illustration, heavy black
> linework, cel shading with splattered textures, violence kept comic-book (no realistic viscera).
> Cold monochrome background in deep navy, steel blue and teal: a hazy sci-fi mining outpost in silhouette, prefab
> modules, antenna masts, gantries and a large pale alien planet or moon low in the sky, drifting dust and sparks.
> The creature is centred and fills most of the frame from head to feet, facing the viewer at a three-quarter
> angle. Its alien blood and accents are vivid red, the only warm colour in the picture.
> The picture is framed by a worn cream border with rounded corners and grunge edges, like the other cards of the
> set. Vertical portrait composition.
> The creature is a living ALIEN organism (a "Xeno"), NOT a zombie, NOT undead and NOT human: no rotting flesh, no
> human clothes, no human face, no hair. Wet alien hide, exposed sinew and chitin, tendrils and fangs instead.
> No humans in the picture. No text, no letters, no numbers, no watermark, no card frame other than the border.

Generate in portrait (1024x1536 or taller), centre-crop to a **1:2** ratio and resize to **640x1280**.

### Invader core box: Xenos (4)

Folder `assets/invader/zombies/` for the three castes, `assets/invader/abominations/` for the Abomination.

| File | Subject |
|---|---|
| `zombies/xeno-worker-cartoon.jpg` | Xeno Worker: a gaunt, hunched humanoid alien, taller than a man, with long arms and heavy clawed hands. Its hide is a mottled sickly brown-grey over corded muscles. Its bald, elongated, bulbous skull has small pale eyes, and a bundle of long red-and-purple tentacles hangs from its mouth like a beard. It lurches forward in a slow walk. |
| `zombies/xeno-tank-cartoon.jpg` | Xeno Tank: a hulking alien brute, three times the bulk of a Worker, with massive shoulders and thick armoured plates of grey-brown chitin on its back and forearms. Its small, bone-pale, skull-like head is wreathed in a mane of thick writhing red tentacles. Its knuckles drag along the ground; it is heavy and unstoppable. |
| `zombies/xeno-hunter-cartoon.jpg` | Xeno Hunter: a lean, fast alien predator running on four long sinewy limbs. Its body is stretched and low to the ground, its spine ridged, its skin tight and greyish brown. Its long eyeless head opens into huge jaws ringed with needle teeth and red tongue-tendrils. Show it mid-leap, with motion streaks. |
| `abominations/spoiler-abomination-cartoon.jpg` | Spoiler Abomination: a colossal alien behemoth with a bloated, pale ivory body covered in swollen folds, bony ridges and smaller fused heads. A cluster of dark tendrils and spines sprouts from its back, and a single glowing red sac pulses on one shoulder. Purple-black alien Mold oozes from its feet and drips from its jaws. It is huge, slow and nightmarish, and dwarfs the outpost behind it. |

### Dark Side: Drillers (4)

The Drillers are the same castes in a red strain: glossy blood-red and crimson chitin with darker plates, built
for digging through rock. The background stays the cold blue mining outpost, but seen from underground: a mine
tunnel with rails, support beams and work lamps, broken rock and dust.

| File | Subject |
|---|---|
| `zombies/driller-worker-cartoon.jpg` | Driller Worker: a humanoid alien covered in glossy crimson chitin plates, with a hunched, spiny back and long arms that end in shovel-like digging claws. Its narrow head bristles with short horns. It climbs out of a hole in the rock floor. |
| `zombies/driller-tank-cartoon.jpg` | Driller Tank: a massive alien brute in thick, layered crimson armour plates like overlapping shields. Its broad, flat head is armoured like a ram, its jaws are full of jagged fangs, and its huge forearms end in pick-like claws. It bursts through a rock wall. |
| `zombies/driller-hunter-cartoon.jpg` | Driller Hunter: a fast alien predator on four limbs, in glossy crimson chitin with curved blade-like spikes along its spine and elbows. Its jaws open wide. It springs out of a tunnel in a spray of rubble. |
| `abominations/driller-abomination-cartoon.jpg` | Driller Abomination: a gigantic alien Abomination in jagged crimson armour plates, hunched like a mountain. Its huge head ends in a long, twisted, drill-like horn, and its open maw is lined with rows of teeth. Its thick clawed arms have just torn a wide Pit open in the ground. It towers over a mining rig. |

## Background (1)

### Style block

> Wide establishing shot for the menu of a sci-fi survival card game, painterly detailed illustration in the same
> spirit as the reference backgrounds (gritty, atmospheric, slightly inked), no characters. Cold palette of deep
> navy, steel blue and teal, with small warm accents (red warning lights, sparks).
> The centre of the picture stays calm and readable, because the app writes menus over it. No text, no letters, no
> numbers, no watermark, no border.

Generate in landscape (1536x768 or wider, ratio **2:1**) and resize to **1920x960**.

| File | Subject |
|---|---|
| `backgrounds/mining-outpost.jpg` | An abandoned human mining outpost on a barren alien planet at night. Prefab modules with broken windows, a damaged landing pad, a giant drilling rig and conveyor towers, and cables and pipes along the ground. Dark purple-black alien Mold creeps over the walls and the ground, with faint glowing spores. A cracked airlock door hangs open, and red emergency lights blink. Above, a starry sky with a huge pale ringed planet and a nebula haze. Dust drifts across a rocky road that leads into the scene, like the road in the reference backgrounds. |

## Card back (1)

### Style block

> Back of a playing card for a sci-fi survival card game, bold screen-printed comic-poster style matching the two
> reference card backs (same composition, same chunky distressed lettering, same halftone and splatter textures),
> recoloured in navy, steel blue and teal with vivid red alien accents and yellow-and-black hazard stripes.
> Portrait card with rounded corners, ratio 2:3.

Generate in portrait (1024x1536) and resize to **853x1280**.

| File | Subject |
|---|---|
| `cards/back-invader.jpg` | The title "ZOMBIE DECK" in big cracked cream letters in the centre, exactly as on the reference backs. A frame of riveted metal bulkhead panels with yellow-and-black hazard stripes. At the top, a skyline of mining-outpost modules and a drilling rig, with a ringed planet and stars, and in the middle a triangular biohazard-style warning sign replaced by an alien claw symbol. At the bottom, instead of the zombie hand, a clawed alien Xeno hand with red tendrils bursting out of cracked metal floor plating. Red claw slashes on both sides and alien red splatters. |

The words "ZOMBIE DECK" are the only text allowed on this picture; check that they are spelled correctly.
