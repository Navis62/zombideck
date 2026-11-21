# Fantasy official artwork: sourcing status

Replaces the original cartoon illustrations of the Fantasy universe (`FANTASY_ART` in `src/components/zombie-art.tsx`) with official CMON renders, like Invader.

## Sources and method

- **Rulebook PDFs** (`C:\Users\Pierrick\Downloads\Zombicide Fantasy Règles`): figures are embedded RGBA images (colour + soft mask), extracted with `Page.get_images()` and `Pixmap(doc, xref)` plus its mask: clean transparent cut-outs, 250 to 1230 px tall. Used: Black Plague, Green Horde, Wulfsburg, Friends and Foes, Horde Box, No Rest for the Wicked, Zombie Bosses, Rat King & Swamp Troll.
- **zombicide.com galleries** https://www.zombicide.com/zombicide-fantasy-zombies/ and https://www.zombicide.com/zombicide-fantasy-promo-zombies/ (each tile links to `/pg/<slug>/`). The site refuses scripted requests (403), so the page HTML came from the Wayback Machine and the dates of the image folders from the `/pg/` pages; the files themselves come from the open CDN `cdn.svc.asmodee.net`. The full-size file is the thumbnail URL without the `-705x594` / `-260x185` suffix, always 950x800 RGB: a banner with a red floor, a grey wall on top, the game logo bottom right and a chain border at the bottom. No alpha: the figure is cut by comparing each pixel with the row median colour, the logo box and the chain are masked, small bits are dropped.
- Where both exist, the rulebook render wins (real alpha, no cutting artefacts) at about the same resolution. The web pages have no taller version.
- The White Death, Frozen Fortress, Timecrash, Warlords, Celestial Knights, Crossfire, Deadeye, Crowz, NPC and Berserker PDFs are flattened page scans (no extractable renders).
- Masters (full-size RGBA PNG): `.art-sources/fantasy/<kind>/<name>-official-master.png` (gitignored). Shipped: 256-colour PNG with alpha, `<name>-official.png` in the subject directory, none above 220 KB, source size (no upscaling).

## Subjects (56 done of 114)

| FANTASY_ART key | Status | Source | File | Notes |
|---|---|---|---|---|
| wolfz | done | rulebook "Wulfsburg" p.10, embedded image xref 920 (RGBA) | assets/fantasy/zombies/wolfz-official.png | native alpha, native resolution |
| wolfbomination | done | rulebook "Wulfsburg" p.23, embedded image xref 1592 (RGBA) | assets/fantasy/abominations/wolfbomination-official.png | native alpha, native resolution |
| npcWalker | done | [Promo NPC](https://www.zombicide.com/pg/promo-npc/) | assets/fantasy/zombies/npc-walker-*-official.png | Snow White, Bishop and Headless cutouts selected by card number. |
| deadeyeWalker | done | web banner https://cdn.svc.asmodee.net/production-zombicide/uploads/image-converter/2016/04/fDeadeye-B.webp (gallery https://www.zombicide.com/zombicide-fantasy-zombies/, page /pg/deadeye-walkers-2/) | assets/fantasy/zombies/deadeye-walker-official.png | red background residue removed with local masks. |
| crowz | to do | Rules - Murder of Crowz.pdf (header illustration on a flattened scan) |  |  |
| taintedWalker | done | rulebook "Friends and Foes" p.5, embedded image xref 541 (RGBA) | assets/fantasy/zombies/tainted-walker-official.png | native alpha, native resolution |
| taintedAbomination | done | rulebook "Friends and Foes" p.7, embedded image xref 895 (RGBA) | assets/fantasy/abominations/tainted-abomination-official.png | native alpha, native resolution |
| ablobination | done | rulebook "Zombie Bosses" p.4, embedded image xref 102 (RGBA) | assets/fantasy/abominations/ablobination-official.png | native alpha, native resolution |
| abominatroll | done | rulebook "Zombie Bosses" p.3, embedded image xref 70 (RGBA) | assets/fantasy/abominations/abominatroll-official.png | native alpha, native resolution |
| abominotaur | done | rulebook "Zombie Bosses" p.2, embedded image xref 42 (RGBA) | assets/fantasy/abominations/abominotaur-official.png | native alpha, native resolution |
| fattyBurster | done | rulebook "Horde Box" p.5, embedded image xref 303 (RGBA) | assets/fantasy/zombies/fatty-burster-official.png | native alpha, native resolution |
| zombieGiant | done | rulebook "Horde Box" p.6, embedded image xref 375 (RGBA) | assets/fantasy/abominations/zombie-giant-official.png | native alpha refined to remove embedded red background |
| gorgomination | done | rulebook "Horde Box" p.8, embedded image xref 616 (RGBA) | assets/fantasy/abominations/gorgomination-official.png | native alpha, native resolution |
| hordeBrother | done | rulebook "Horde Box" p.9, embedded image xref 730 (RGBA) | assets/fantasy/abominations/horde-brother-official.png | native alpha, native resolution |
| siegeBreaker | done | rulebook "Horde Box" p.10, embedded image xref 810 (RGBA) | assets/fantasy/abominations/siege-breaker-official.png | native alpha, native resolution |
| swampLurker | done | rulebook "Horde Box" p.10, embedded image xref 814 (RGBA) | assets/fantasy/abominations/swamp-lurker-official.png | native alpha, native resolution |
| abominabunny | done | rulebook "Horde Box" p.7, embedded image xref 536 (RGBA) | assets/fantasy/abominations/abominabunny-official.png | small (255x221) |
| magentaCovefe | done | rulebook "Horde Box" p.11, embedded image xref 894 (RGBA) | assets/fantasy/abominations/magenta-covefe-official.png | native alpha, native resolution |
| vaultWarden | done | rulebook "Horde Box" p.9, embedded image xref 734 (RGBA) | assets/fantasy/abominations/vault-warden-official.png | native alpha, native resolution |
| werezombie | done | rulebook "Horde Box" p.11, embedded image xref 898 (RGBA) | assets/fantasy/abominations/werezombie-official.png | native alpha, native resolution |
| chromatiz | done | rulebook "Horde Box" p.8, embedded image xref 612 (RGBA) | assets/fantasy/abominations/chromatiz-official.png | native alpha, native resolution |
| feralDragon | done | rulebook "Horde Box" p.3, embedded image xref 147 (RGBA) | assets/fantasy/abominations/feral-dragon-official.png | CROPPED at the page edge (wing runs off): do not use, needs another source |
| countTemeraire | done | web banner https://cdn.svc.asmodee.net/production-zombicide/uploads/image-converter/2019/05/fCountTemeraire.webp (gallery https://www.zombicide.com/zombicide-fantasy-promo-zombies/, page /pg/count-temeraire/) | assets/fantasy/necromancers/count-temeraire-official.png | red background residue cleaned up with local masks. |
| queenSevera | done | web banner https://cdn.svc.asmodee.net/production-zombicide/uploads/image-converter/2019/05/fSevera.webp (gallery https://www.zombicide.com/zombicide-fantasy-promo-zombies/, page /pg/queen-severa/) | assets/fantasy/necromancers/queen-severa-official.png | red background residue cleaned up with local masks. |
| abominalpha | done | web banner https://cdn.svc.asmodee.net/production-zombicide/uploads/image-converter/2016/04/fAbominalpha.webp (gallery https://www.zombicide.com/zombicide-fantasy-promo-zombies/, page /pg/abominalpha/) | assets/fantasy/abominations/abominalpha-official.png | red background residue removed with local masks. |
| abominarat | done | web banner https://cdn.svc.asmodee.net/production-zombicide/uploads/image-converter/2016/04/fAbominarat.webp (gallery https://www.zombicide.com/zombicide-fantasy-promo-zombies/, page /pg/abominarat/) | assets/fantasy/abominations/abominarat-official.png | red background residue removed with local masks. |
| toMeKuPa | done | web banner https://cdn.svc.asmodee.net/production-zombicide/uploads/image-converter/2016/04/fToMeKuPa.webp (gallery https://www.zombicide.com/zombicide-fantasy-zombies/, page /pg/to-me-ku-pa/) | assets/fantasy/necromancers/to-me-ku-pa-official.png | red background residue cleaned up with local masks. |
| blackheart | to do | nothing found (not in the rulebooks nor the two gallery pages) |  |  |
| ostokar | done | web banner https://cdn.svc.asmodee.net/production-zombicide/uploads/image-converter/2016/04/fOstokar.webp (gallery https://www.zombicide.com/zombicide-fantasy-zombies/, page /pg/ostokar-the-pale/) | assets/fantasy/necromancers/ostokar-official.png | red background residue cleaned up with local masks. |
| evilTroy | to do | nothing found (not in the rulebooks nor the two gallery pages) |  |  |
| queenMedea | done | web banner https://cdn.svc.asmodee.net/production-zombicide/uploads/image-converter/2016/04/fMedea.webp (gallery https://www.zombicide.com/zombicide-fantasy-promo-zombies/, page /pg/queen-medea/) | assets/fantasy/necromancers/queen-medea-official.png | red background residue cleaned up with local masks. |
| grin | done | web banner https://cdn.svc.asmodee.net/production-zombicide/uploads/image-converter/2016/04/fGrin-Necromancer.webp (gallery https://www.zombicide.com/zombicide-fantasy-promo-zombies/, page /pg/grin/) | assets/fantasy/necromancers/grin-official.png | red background residue cleaned up with local masks. |
| erikSummoner | done | web banner https://cdn.svc.asmodee.net/production-zombicide/uploads/image-converter/2019/05/fErik.webp (gallery https://www.zombicide.com/zombicide-fantasy-promo-zombies/, page /pg/erik-the-summoner/) | assets/fantasy/necromancers/erik-summoner-official.png | red background residue cleaned up with local masks. |
| innsmouth | done | web banner https://cdn.svc.asmodee.net/production-zombicide/uploads/image-converter/2019/04/fInnsmouth.webp (gallery https://www.zombicide.com/zombicide-fantasy-zombies/, page /pg/grand-inquisitor-innsmouth/) | assets/fantasy/necromancers/innsmouth-official.png | red background residue cleaned up with local masks. |
| faolan | done | web banner https://cdn.svc.asmodee.net/production-zombicide/uploads/image-converter/2019/04/fFaolan.webp (gallery https://www.zombicide.com/zombicide-fantasy-zombies/, page /pg/faolan/) | assets/fantasy/necromancers/faolan-official.png | red background residue cleaned up with local masks. translucent ghost body: holes, review |
| lordOfSkulls | done | web banner https://cdn.svc.asmodee.net/production-zombicide/uploads/image-converter/2019/04/fLord-of-Skulls.webp (gallery https://www.zombicide.com/zombicide-fantasy-zombies/, page /pg/the-lord-of-skulls-2/) | assets/fantasy/necromancers/lord-of-skulls-official.png | red background residue cleaned up with local masks. |
| spectralWalker | done | rulebook "No Rest for the Wicked" p.7, embedded image xref 539 (RGBA) | assets/fantasy/zombies/spectral-walker-official.png | native alpha, native resolution |
| ratz | done | rulebook "Rat King & Swamp Troll" p.2, embedded image xref 31 (RGBA) | assets/fantasy/zombies/ratz-official.png | native alpha, native resolution |
| ratKing | done | web banner https://cdn.svc.asmodee.net/production-zombicide/uploads/image-converter/2019/04/fRat-King.webp (gallery https://www.zombicide.com/zombicide-fantasy-zombies/, page /pg/rat-king/) | assets/fantasy/necromancers/rat-king-official.png | red background residue cleaned up with local masks. |
| swampTroll | done | rulebook "Rat King & Swamp Troll" p.3, embedded image xref 64 (RGBA) | assets/fantasy/abominations/swamp-troll-official.png | native alpha, native resolution |
| necromanticDragon | done | rulebook "No Rest for the Wicked" p.3, embedded image xref 189 (RGBA) | assets/fantasy/abominations/necromantic-dragon-official.png | CROPPED at the page edge (wing runs off): do not use, needs another source |
| wdWalker | done | web banner https://cdn.svc.asmodee.net/production-zombicide/uploads/image-converter/2026/07/fWalkers-WD-1.webp (gallery https://www.zombicide.com/zombicide-fantasy-zombies/, page /pg/walker-white-death/) | assets/fantasy/zombies/wd-walker-official.png | red background residue removed with local masks. left figure of 2 |
| wdRunner | done | web banner https://cdn.svc.asmodee.net/production-zombicide/uploads/image-converter/2026/07/fRunners-WD.webp (gallery https://www.zombicide.com/zombicide-fantasy-zombies/, page /pg/runner-white-death/) | assets/fantasy/zombies/wd-runner-official.png | red background residue removed with local masks. left figure of 2 |
| wdBrute | done | web banner https://cdn.svc.asmodee.net/production-zombicide/uploads/image-converter/2026/07/fBrute-WD-1-1.webp (gallery https://www.zombicide.com/zombicide-fantasy-zombies/, page /pg/brute-white-death/) | assets/fantasy/zombies/wd-brute-official.png | red background residue removed with local masks. |
| khanAbomination | done | web banner https://cdn.svc.asmodee.net/production-zombicide/uploads/image-converter/2026/07/fKhan-Abomination.webp (gallery https://www.zombicide.com/zombicide-fantasy-zombies/, page /pg/kahn-abomination/) | assets/fantasy/abominations/khan-abomination-official.png | auto-cut off the red background: review. legs partly lost |
| defilerNecromancer | done | web banner https://cdn.svc.asmodee.net/production-zombicide/uploads/image-converter/2026/07/fDefiler-Necromancer.webp (gallery https://www.zombicide.com/zombicide-fantasy-zombies/, page /pg/defiler-necromancer/) | assets/fantasy/necromancers/defiler-necromancer-official.png | red background residue cleaned up with local masks. |
| eeWalker | to do | nothing found (not in the rulebooks nor the two gallery pages) |  |  |
| eeRunner | to do | nothing found (not in the rulebooks nor the two gallery pages) |  |  |
| eeBrute | to do | nothing found (not in the rulebooks nor the two gallery pages) |  |  |
| godEaterAbomination | done | web banner https://cdn.svc.asmodee.net/production-zombicide/uploads/image-converter/2026/07/fGodEaterAbomination.webp (gallery https://www.zombicide.com/zombicide-fantasy-zombies/, page /pg/god-eater-abomination/) | assets/fantasy/abominations/god-eater-abomination-official.png | red background residue removed with local masks. the banner top cuts the figure |
| amaterasu | to do | nothing found (not in the rulebooks nor the two gallery pages) |  |  |
| asura | to do | nothing found (not in the rulebooks nor the two gallery pages) |  |  |
| bishamon | to do | nothing found (not in the rulebooks nor the two gallery pages) |  |  |
| chimimoryo | to do | nothing found (not in the rulebooks nor the two gallery pages) |  |  |
| hachiman | to do | nothing found (not in the rulebooks nor the two gallery pages) |  |  |
| kijin | to do | nothing found (not in the rulebooks nor the two gallery pages) |  |  |
| kumiho | to do | nothing found (not in the rulebooks nor the two gallery pages) |  |  |
| nian | to do | nothing found (not in the rulebooks nor the two gallery pages) |  |  |
| qilin | to do | nothing found (not in the rulebooks nor the two gallery pages) |  |  |
| redHare | to do | nothing found (not in the rulebooks nor the two gallery pages) |  |  |
| shakokiDogu | to do | nothing found (not in the rulebooks nor the two gallery pages) |  |  |
| sojobo | to do | nothing found (not in the rulebooks nor the two gallery pages) |  |  |
| susanoWo | to do | nothing found (not in the rulebooks nor the two gallery pages) |  |  |
| takemikazuchi | to do | nothing found (not in the rulebooks nor the two gallery pages) |  |  |
| toyol | to do | nothing found (not in the rulebooks nor the two gallery pages) |  |  |
| yeti | to do | nothing found (not in the rulebooks nor the two gallery pages) |  |  |
| bomoh | to do | nothing found (not in the rulebooks nor the two gallery pages) |  |  |
| deathNotes | to do | nothing found (not in the rulebooks nor the two gallery pages) |  |  |
| hannya | to do | nothing found (not in the rulebooks nor the two gallery pages) |  |  |
| kaguya | to do | nothing found (not in the rulebooks nor the two gallery pages) |  |  |
| tengu | to do | nothing found (not in the rulebooks nor the two gallery pages) |  |  |
| yukiOnna | to do | nothing found (not in the rulebooks nor the two gallery pages) |  |  |
| fantasyBerserkerWalker | to do | Rules - Berserker Walkers.pdf p.1 (inset on a flattened scan, about 300 px) |  |  |
| deadboltWalker | done | web banner https://cdn.svc.asmodee.net/production-zombicide/uploads/image-converter/2026/08/fArchers.webp (gallery https://www.zombicide.com/zombicide-fantasy-zombies/, page /pg/deadbolt-walkers/) | assets/fantasy/zombies/deadbolt-walker-official.png | red background residue removed with local masks. left figure of 3 (guess: confirm it matches the Deadbolt card) |
| terrorcottaWalker | done | web banner https://cdn.svc.asmodee.net/production-zombicide/uploads/2026/07/fWalkers.gif (gallery https://www.zombicide.com/zombicide-fantasy-zombies/, page /pg/terrorcotta-walkers/) | assets/fantasy/zombies/terrorcotta-walker-official.png | red background residue removed with local masks. middle figure of 3, red patch on the left cleaned up |
| climber | to do | web: 2026/07/fClimbers.gif (3 overlapping figures, 950x800); Rules - Climbers and Terrorcotta Walkers.pdf p.1 has a small inset |  |  |
| divineBeast | to do | web: image-converter/2026/08/fDragon.webp (Azure Dragon), fTortoise.webp, fTiger.webp, fPhoenix.webp (Vermillion Bird); the app has one divineBeast subject: choose one or add four |  |  |
| reaper | to do | nothing found (not in the rulebooks nor the two gallery pages) |  |  |
| baalberith | to do | nothing found (not in the rulebooks nor the two gallery pages) |  |  |
| horseman | to do | nothing found (not in the rulebooks nor the two gallery pages) |  |  |
| queenCaenedra | to do | nothing found (not in the rulebooks nor the two gallery pages) |  |  |
| hugBear | to do | nothing found (not in the rulebooks nor the two gallery pages) |  |  |
| banshee | to do | nothing found (not in the rulebooks nor the two gallery pages) |  |  |
| cerberus | to do | nothing found (not in the rulebooks nor the two gallery pages) |  |  |
| lordJanas | to do | nothing found (not in the rulebooks nor the two gallery pages) |  |  |
| marike | to do | nothing found (not in the rulebooks nor the two gallery pages) |  |  |
| erinn | to do | nothing found (not in the rulebooks nor the two gallery pages) |  |  |
| grandVizier | to do | nothing found (not in the rulebooks nor the two gallery pages) |  |  |
| theSparrow | to do | nothing found (not in the rulebooks nor the two gallery pages) |  |  |
| dongZhuo | to do | nothing found (not in the rulebooks nor the two gallery pages) |  |  |
| zhangJiao | to do | nothing found (not in the rulebooks nor the two gallery pages) |  |  |
| fumaKotaro | to do | nothing found (not in the rulebooks nor the two gallery pages) |  |  |
| footNinja | to do | nothing found (crossover, not on the two gallery pages) |  |  |
| bebop | to do | nothing found |  |  |
| rocksteady | to do | nothing found |  |  |
| pharaohEddie | to do | nothing found (not in the rulebooks nor the two gallery pages) |  |  |
| samuraiEddie | to do | nothing found (not in the rulebooks nor the two gallery pages) |  |  |
| mummyEddie | to do | nothing found (not in the rulebooks nor the two gallery pages) |  |  |
| wickerManEddie | to do | nothing found (not in the rulebooks nor the two gallery pages) |  |  |
| fearEddie | to do | nothing found (not in the rulebooks nor the two gallery pages) |  |  |
| mummRa | to do | nothing found (not in the rulebooks nor the two gallery pages) |  |  |
| reaperEddie | to do | nothing found (not in the rulebooks nor the two gallery pages) |  |  |
| shamanEddie | to do | nothing found (not in the rulebooks nor the two gallery pages) |  |  |
| wardenBrute | done | rulebook "Black Plague" p.6, embedded image xref 1339 (RGBA) | assets/fantasy/zombies/fantasy-fatty-official.png | native alpha, native resolution |
| fantasyWalker | done | rulebook "Black Plague" p.8, embedded image xref 1508 (RGBA) | assets/fantasy/zombies/fantasy-walker-official.png | native alpha, native resolution |
| fantasyRunner | done | rulebook "Black Plague" p.25, embedded image xref 3308 (RGBA) | assets/fantasy/zombies/fantasy-runner-official.png | native alpha, native resolution |
| fantasyFatty | done | rulebook "Black Plague" p.6, embedded image xref 1339 (RGBA) | assets/fantasy/zombies/fantasy-fatty-official.png | native alpha, native resolution |
| fantasyAbomination | done | rulebook "Black Plague" p.49, embedded image xref 5281 (RGBA) | assets/fantasy/abominations/fantasy-abomination-official.png | native alpha, native resolution |
| orcWalker | done | rulebook "Green Horde" p.25, embedded image xref 3754 (RGBA) | assets/fantasy/zombies/orc-walker-official.png | native alpha, native resolution |
| orcRunner | done | rulebook "Green Horde" p.28, embedded image xref 4001 (RGBA) | assets/fantasy/zombies/orc-runner-official.png | native alpha, native resolution |
| orcFatty | done | web banner https://cdn.svc.asmodee.net/production-zombicide/uploads/image-converter/2019/04/fOrc-Fatty.webp (gallery https://www.zombicide.com/zombicide-fantasy-zombies/, page /pg/orc-fatty/) | assets/fantasy/zombies/orc-fatty-official.png | red background residue removed with local masks. |
| orcAbomination | done | rulebook "Green Horde" p.52, embedded image xref 6153 (RGBA) | assets/fantasy/abominations/orc-abomination-official.png | native alpha, native resolution |
| necromancer | done | rulebook "Black Plague" p.31, embedded image xref 4127 (RGBA) | assets/fantasy/necromancers/necromancer-official.png | native alpha, native resolution |
| orcNecromancer | done | rulebook "Green Horde" p.48, embedded image xref 5972 (RGBA) | assets/fantasy/necromancers/orc-necromancer-official.png | native alpha, native resolution |

## Other official images found, no subject in the app

- Web: fDoom, fGloom (giants), fBishop (promo), fJadeBrutes (Warden Brutes), fWalkers-BP (two Black Plague walkers, one female), fWalkers-WD-2 and -3.
- Rulebooks: Black Plague p.38 x4812 (female walker), survivors and familiars (Friends and Foes griffins, dogs, wolves), Horde Box p.6 x379 (Finarton), Dead Men Tales rulebook p.8 x1901 (an unnamed Abomination).

## Known issues

- `feral-dragon` and `necromantic-dragon`: both renders are cropped by the page edge (a wing runs off); the web banners are cropped the same way. Another source or a photo of the printed card is needed.
- Web cut-outs keep a few red floor splashes at the feet and tiny chain tips at the very bottom; Faolan (translucent) and Khan (legs) are incomplete; Terrorcotta has a blood patch. Candidates for a hand touch-up.
- Abominatroll (Zombie Bosses p.3) is as printed (contorted pose).

## To do

Every `to do` row above: mostly the Kickstarter, Special Guest, Warlords, Celestial, Crossfire, Berserker and Crowz boxes and the named Abominations of the packs. Ideas: the `/pg/` page of each box on zombicide.com (through the Wayback Machine), BoardGameGeek galleries, photos of the printed cards.
