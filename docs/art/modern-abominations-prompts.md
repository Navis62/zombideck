# Modern Abomination illustrations: prompts for Codex

One picture per named Abomination of the Modern Abomination deck (Zombicide 2nd Edition), in the style of the
existing modern art (`assets/modern/abominations/abomination-cartoon.jpg`, `trejo-cartoon.jpg`).

Each picture shows the character printed on its Zombicide card, under its real name. Many of these Abominations
are **not zombies**: superheroes, demons, ghosts, cryptids, comedy characters, cosmic gods. Each entry says what
the creature is. Only draw rotting undead flesh when the entry says **Zombie**.

## Instructions for Codex

1. Before generating, look at `assets/modern/abominations/abomination-cartoon.jpg` and
   `assets/modern/abominations/trejo-cartoon.jpg`: every new picture must look like it belongs to the same set
   (inking, palette, background, border), whatever the creature is.
2. The user provides photos of the printed Abomination cards. For each entry, find the card with the same name
   and use its comic-book artwork as the **main reference** for the character's design (silhouette, costume,
   features, props, pose idea): redraw it in our style and framing, do not copy or trace the card art, and never
   base a face on a live-action actor. The subject text below only completes the reference; where they disagree,
   follow the card. If no card photo matches an entry, use the subject text alone and say so in the report.
3. For each entry below, generate **one** image from the shared style block, then the entry's **Nature** line,
   then its subject. Generate in portrait (1024x1536 or taller).
4. Post-process each image: center-crop to a 4:9 ratio and resize to **576x1280**, save as **JPEG quality 85**
   (target under 350 KB) at the path given by the entry, in `assets/modern/abominations/`.
5. Do not touch any other file: the code (`src/components/zombie-art.tsx`, translations, deck data) is wired
   separately once the cards are transcribed.
6. Report the list of files written, the entries drawn without a card reference, and any entry you skipped.

## Shared style block (prepend to every subject)

> Full-body boss character for the Zombicide zombie-apocalypse card game, gritty inked comic-book illustration,
> heavy black linework, cel shading with splattered textures, violence kept comic-book (no realistic viscera).
> Saturated amber-orange monochrome background: hazy ruined modern city skyline, broken buildings and poles in
> silhouette, dust and embers. The character stands centered, filling most of the frame from head to feet, facing
> the viewer at a three-quarter angle. The picture is framed by a worn cream parchment border with rounded corners
> and grunge edges. Vertical portrait composition.
> Present-day setting (Zombicide modern era, not medieval fantasy): contemporary city, contemporary clothes and
> gear unless the subject says otherwise; no castles, no medieval armour, no swords and sorcery, no fantasy-era
> parchment painting style.
> Draw the named character recognisably, following the comic-book redesign printed on its Zombicide card (given
> as reference): its costume, features and props, redrawn in this style; not a photographic likeness of any actor.
> No text, no letters, no numbers, no watermark, no card frame other than the parchment border.

Nature lines to append, as given by each entry:

- **Zombie**: "The character is a mutated zombie Abomination: rotting skin, exposed muscle, pustules, blood."
- **Not a zombie**: "The character is NOT a zombie and NOT undead: healthy living skin (or its natural monster
  hide), no rotting flesh, no wounds, no zombie features, no blood on itself."
- **Undead (not a zombie)**: "The character is a supernatural undead being, not a zombie: dry, skeletal or
  ghostly, no rotting zombie flesh."

## Core box (4)

| File | Nature | Subject |
|---|---|---|
| `hobomination-cartoon.jpg` | Zombie | The Hobomination: a hulking homeless-zombie Abomination, swollen grey-green body wrapped in filthy layered rags, cardboard and plastic bags, chains, rotten teeth, flies around it. |
| `abominawild-cartoon.jpg` | Zombie | The Abominawild: a feral beast-like Abomination hunched on long arms, torn flesh fused with bark and moss, tattered camouflage hunting jacket, bone spurs from the shoulders, glowing yellow eyes. |
| `abominacop-cartoon.jpg` | Zombie | The Abominacop: a massive police-officer Abomination, riot helmet fused into the skull, tattered uniform splitting over grotesque muscles, a dented sheriff star badge, rebar and nails sticking out of its back. |
| `patient-zero-cartoon.jpg` | Zombie | Patient 0: a giant hospital-patient Abomination, torn hospital gown, IV bags and tubes still stuck in its arms, surgical staples across a bloated body, bandaged head, medical restraints dangling. |

## Zombies & Companions upgrade kit (3)

| File | Nature | Subject |
|---|---|---|
| `abomb-abomination-cartoon.jpg` | Zombie | The A-Bomb Abomination: a huge Abomination covered in grey spiked bony plates like a living tank, gripping claws reaching forward to grab, radioactive glow seeping between plates. |
| `berserker-abomination-cartoon.jpg` | Zombie | The Berserker Abomination: an Abomination wearing crude welded scrap-metal armour plates and spikes bolted into its flesh, bullet dents on the plates, roaring, a torn red sports jersey under the armour. |
| `toxic-abomination-cartoon.jpg` | Zombie | The Toxic Abomination: pink and purple bubbling pustules all over its body, dripping glowing acid-green blood, long bone spikes from its back, toxic mist around its feet. |

## Urban Legends Abomination pack (4)

| File | Nature | Subject |
|---|---|---|
| `killer-clown-cartoon.jpg` | Zombie | The Killer Clown: a hulking clown Abomination, torn ruffled collar and patched clown suit, bone spikes bursting through the shoulders and back, grinning rotten face with clown make-up, holding a bunch of balloons. |
| `chupacabra-cartoon.jpg` | Zombie | The Chupacabra: a hairless dog-like beast on four long legs, ochre mottled hide, row of quills down the spine, huge fanged jaws open, low predatory stance. |
| `sewer-crocodile-cartoon.jpg` | Zombie | The Sewer Crocodile: a giant crocodile Abomination coiled around a brick sewer outlet and a broken pipe, scaly hide with bony spikes, jaws wide open, sewage dripping. |
| `abductor-cartoon.jpg` | Zombie | The Abductor: a zombified grey alien, tall gaunt body, oversized bald head, large black eyes, long thin fingers, peeling grey skin, a faint tractor-beam glow behind it. |

## The Boys (8): the Supes, living super-humans

| File | Nature | Subject |
|---|---|---|
| `homelander-cartoon.jpg` | Not a zombie | Homelander from The Boys: blue armoured suit with gold eagle shoulder plates, star-spangled cape flowing, perfect blond hair, cruel smile, eyes glowing red with laser vision, floating above the ground. |
| `a-train-cartoon.jpg` | Not a zombie | A-Train from The Boys: blue and white speedster suit with the A logo, sunglasses-like visor, caught mid-sprint with motion streaks and dust trails. |
| `black-noir-cartoon.jpg` | Not a zombie | Black Noir from The Boys: full matte black armoured suit and featureless black masked helmet, short blade in hand, crouching in shadow. |
| `queen-maeve-cartoon.jpg` | Not a zombie | Queen Maeve from The Boys: long red hair, silver tiara, bronze and red armoured warrior costume with arm bracers, in a combat stance. |
| `soldier-boy-cartoon.jpg` | Not a zombie | Soldier Boy from The Boys: dark green tactical uniform with shoulder pads, round shield with a star, saluting, cocky. |
| `the-deep-cartoon.jpg` | Not a zombie | The Deep from The Boys: green and gold scaled suit, gills on the neck, dripping seawater, muscular, flexing. |
| `starlight-cartoon.jpg` | Not a zombie | Starlight from The Boys: white and gold costume with a star emblem, long blonde hair, arms spread releasing a blinding light burst from her hands. |
| `translucent-cartoon.jpg` | Not a zombie | Translucent from The Boys: an invisible man, only a faint glassy shimmer in the outline of a man with a smug grin and eyes faintly visible, dust swirling around his invisible body. |

## Supernatural (6)

| File | Nature | Subject |
|---|---|---|
| `alpha-vampire-cartoon.jpg` | Undead (not a zombie) | The Alpha Vampire from Supernatural: an ancient elegant vampire in a dark tailored three-piece suit and patterned silk tie, bald head, extended hand, fangs, regal and menacing. |
| `wendigo-cartoon.jpg` | Not a zombie | The Wendigo from Supernatural: a pale emaciated creature, grey stretched hide over visible ribs, elongated limbs, screaming mouth full of needle teeth. |
| `leviathan-cartoon.jpg` | Not a zombie | A Leviathan from Supernatural: a man in a white shirt and loose tie whose head splits open into a huge toothy maw, black ooze dripping. |
| `black-dog-cartoon.jpg` | Not a zombie | The Black Dog from Supernatural: a gigantic hellhound, black shaggy fur, smoking glowing red eyes, slavering jaws, prowling low. |
| `crowley-cartoon.jpg` | Not a zombie | Crowley, King of Hell, from Supernatural: black overcoat and dark suit, short beard, smug expression, red-glowing eyes, wisps of black smoke. |
| `archangel-michael-cartoon.jpg` | Not a zombie | Archangel Michael from Supernatural: a young man in a grey jacket, calm cold stare, luminous wing shadows behind him and a beam of pale light. |

## Ghostbusters (4)

| File | Nature | Subject |
|---|---|---|
| `zuul-cartoon.jpg` | Not a zombie | Zuul, the Gatekeeper terror dog from Ghostbusters: black stone-like hide, curved ram horns, red glowing eyes, snarling fanged maw, crouched like a gargoyle. |
| `vinz-clortho-cartoon.jpg` | Not a zombie | Vinz Clortho, the Keymaster terror dog from Ghostbusters: grey-black hide, long horns, clawed paws, red eyes, roaring on a rooftop. |
| `stay-puft-cartoon.jpg` | Not a zombie | The Stay Puft Marshmallow Man from Ghostbusters: giant smiling marshmallow mascot in a sailor collar, hat and red neckerchief, angry eyebrows, towering over the ruins, scorched in places. |
| `gozer-cartoon.jpg` | Not a zombie | Gozer the Gozerian from Ghostbusters: androgynous otherworldly goddess in a sleek white iridescent body-suit, flat-top hair, red eyes, lightning crackling from both raised hands. |

## Monty Python's Flying Circus (7)

| File | Nature | Subject |
|---|---|---|
| `nude-organist-cartoon.jpg` | Not a zombie | The Nude Organist from Monty Python: a grinning man seen from the side, seated at a church organ, wearing only a bow tie, the organ hiding everything below the chest, a startled policeman in the corner. Comic, non-explicit. |
| `undead-parrot-cartoon.jpg` | Undead (not a zombie) | The Dead Parrot from Monty Python: a Norwegian Blue parrot lying stiff on its back with feet in the air, eyes shut, faint wisps of ghostly energy rising from it. |
| `gumbys-cartoon.jpg` | Not a zombie | The Gumbys from Monty Python: four identical dim-witted men with knotted handkerchiefs on their heads, small moustaches, round glasses, braces, rolled-up trousers and wellington boots, arms raised. |
| `the-foot-cartoon.jpg` | Not a zombie | The Foot from Monty Python: a gigantic bare foot descending from the sky, cut-out paper collage style, about to stomp on the ruins. |
| `fish-slapping-dancer-cartoon.jpg` | Not a zombie | The Fish-Slapping Dancer from Monty Python: a man in a khaki explorer outfit and pith helmet doing a jolly dance, slapping with a large wet fish in each hand. |
| `hells-grannies-cartoon.jpg` | Not a zombie | Hell's Grannies from Monty Python: a gang of four tough elderly grannies in black dresses, flowery hats and handbags, marching menacingly, one swinging a teapot. |
| `greenwich-crew-cartoon.jpg` | Zombie | The Greenwich Crew: a tangled pile of mismatched zombies fused together into one crawling mass, a sailor, a clerk, a jogger in a blue tracksuit, a lady in a coat, many arms and heads. |

## Iron Maiden (12): Eddie

All twelve are Eddie, Iron Maiden's mascot, in the look of the album cover the card refers to. Nature for all:
**Undead (not a zombie)**. No band logo, no lettering.

| File | Subject |
|---|---|
| `asylum-eddie-cartoon.jpg` | Asylum Eddie: Eddie in a torn straitjacket with loose straps, padded cell behind, twitching. |
| `original-eddie-cartoon.jpg` | Original Eddie: Eddie with wild flaming orange spiked hair and a ripped jacket, staring wide-eyed, as on the first album. |
| `cyborg-eddie-cartoon.jpg` | Cyborg Eddie: Eddie as a cyborg, exposed muscles fused with chrome plates, cables, a laser eyepiece and a futuristic gun. |
| `mummy-eddie-cartoon.jpg` | Mummy Eddie: Eddie as a mummy wrapped in loose bandages, bursting out of a stone wall. |
| `undead-eddie-cartoon.jpg` | Undead Eddie: Eddie rising from his grave, blue-green skin, crumbling earth and tombstone, arms reaching up. |
| `trooper-eddie-cartoon.jpg` | Trooper Eddie: Eddie as a 19th-century British redcoat cavalryman holding a tattered Union flag and a sabre. |
| `bassist-eddie-cartoon.jpg` | Bassist Eddie: Eddie playing a bass guitar with one boot on a speaker, wild white hair. |
| `reaper-eddie-cartoon.jpg` | Reaper Eddie: Eddie as the Grim Reaper, black hooded robe, long scythe, skeletal hand beckoning. |
| `fear-eddie-cartoon.jpg` | Fear Eddie: Eddie as the gnarled tree-creature of Fear of the Dark, twisted dark-blue branches growing from his body and head, long clawed fingers. |
| `wicker-eddie-cartoon.jpg` | Wicker Eddie: Eddie as the giant Wicker Man effigy made of woven branches, burning with flames at the feet. |
| `pharaoh-eddie-cartoon.jpg` | Pharaoh Eddie: Eddie as a seated colossal pharaoh on a throne with nemes headdress, flanked by two smaller pharaoh statues. |
| `killer-eddie-cartoon.jpg` | Killer Eddie: Eddie as the back-alley killer of Killers, long hair, striped shirt, axe in hand, lunging. |

These files live in `assets/modern/abominations/`; the fantasy Eddies of the same names in `assets/fantasy/abominations/`
or `assets/fantasy/necromancers/`
are different pictures and must not be overwritten.

## Kickstarter exclusives (6)

| File | Nature | Subject |
|---|---|---|
| `batabomination-cartoon.jpg` | Zombie | The Batabomination: a huge bat-winged Abomination, purple leathery skin, bat ears, tiny blind eyes, enormous membrane wings spread, clawed feet. |
| `bigfoot-cartoon.jpg` | Not a zombie | Bigfoot: a sasquatch, huge, shaggy dark-brown fur, ape-like face, long arms, lurking at the edge of a forest. |
| `cthulhu-cartoon.jpg` | Not a zombie | Cthulhu: a colossal octopus-headed elder god, green scaly humanoid body, face tentacles, leathery bat wings, rising behind the ruins. |
| `bearmanboar-cartoon.jpg` | Zombie | The Bearmanboar: a grotesque hybrid Abomination half bear, half man, half boar, shaggy fur, human torso with stitched seams, boar tusks and snout. |
| `lankyman-cartoon.jpg` | Not a zombie | The Lankyman: an extremely tall thin faceless figure in a black suit and tie, pale blank face, elongated arms ending in long claws. |
| `actual-cannibal-cartoon.jpg` | Not a zombie | The Actual Cannibal: a wiry feral man crawling on all fours, ragged clothes, bloody mouth, bulging muscles. Stylised face, not a photographic likeness of any actor. |

## Dark Nights: Metal (9): the Dark Multiverse Batmen

The English text of some cards is still missing; generating their pictures is optional. Nature for all:
**Not a zombie**.

| File | Subject |
|---|---|
| `batman-earth-1-cartoon.jpg` | The Devastator (Batman Earth-1): a monstrous Batman mutated into a hulking beast covered in long quills and spikes, torn cowl. |
| `batman-earth-11-cartoon.jpg` | The Drowned (Batman Earth-11): a female Batman with long black hair, tentacle cape, golden trident, eerie green glow. |
| `batman-earth-12-cartoon.jpg` | The Merciless (Batman Earth-12): Batman in black-steel armour with jagged wings, a horned helmet and a golden sword. |
| `batman-earth-32-cartoon.jpg` | The Dawnbreaker (Batman Earth-32): Batman in green power armour lit by a glowing green power ring, arm raised. |
| `batman-earth-44-cartoon.jpg` | The Murder Machine (Batman Earth-44): a robotic Batman in grey mechanical armour with a glowing red reactor in the chest. |
| `batman-earth-52-cartoon.jpg` | The Red Death (Batman Earth-52): a speedster Batman in red armour with lightning-bolt motifs, sprinting. |
| `batman-who-laughs-cartoon.jpg` | The Batman Who Laughs: a twisted Batman with a spiked crown helm, a wide manic grin, chains and hooks, long black cape. |
| `the-robins-cartoon.jpg` | The Robins: a pack of four feral, twisted Robins in torn red, green and yellow costumes, eye masks, snarling. |
| `lobo-batman-cartoon.jpg` | Lobo Batman: a huge biker-brute Batman with a pale skull face, spiked shoulder armour, ammo belts, curved hook blades, long black cape. |

## Not included

- SPAM: `spam-cartoon.jpg` already exists.
