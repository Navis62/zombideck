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
| crowz | done | Zombicide wiki (fandom), MurderOfCrowz_MC.png (official render, transparent) | zombies/crowz-official.png | 1902x1280, native alpha |
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
| feralDragon | done | Zombicide wiki (fandom), FeralDragon.png (official render, transparent) | abominations/feral-dragon-official.png | 1033x1280, native alpha |
| countTemeraire | done | web banner https://cdn.svc.asmodee.net/production-zombicide/uploads/image-converter/2019/05/fCountTemeraire.webp (gallery https://www.zombicide.com/zombicide-fantasy-promo-zombies/, page /pg/count-temeraire/) | assets/fantasy/necromancers/count-temeraire-official.png | red background residue cleaned up with local masks. |
| queenSevera | done | web banner https://cdn.svc.asmodee.net/production-zombicide/uploads/image-converter/2019/05/fSevera.webp (gallery https://www.zombicide.com/zombicide-fantasy-promo-zombies/, page /pg/queen-severa/) | assets/fantasy/necromancers/queen-severa-official.png | red background residue cleaned up with local masks. |
| abominalpha | done | web banner https://cdn.svc.asmodee.net/production-zombicide/uploads/image-converter/2016/04/fAbominalpha.webp (gallery https://www.zombicide.com/zombicide-fantasy-promo-zombies/, page /pg/abominalpha/) | assets/fantasy/abominations/abominalpha-official.png | red background residue removed with local masks. |
| abominarat | done | web banner https://cdn.svc.asmodee.net/production-zombicide/uploads/image-converter/2016/04/fAbominarat.webp (gallery https://www.zombicide.com/zombicide-fantasy-promo-zombies/, page /pg/abominarat/) | assets/fantasy/abominations/abominarat-official.png | red background residue removed with local masks. |
| toMeKuPa | done | web banner https://cdn.svc.asmodee.net/production-zombicide/uploads/image-converter/2016/04/fToMeKuPa.webp (gallery https://www.zombicide.com/zombicide-fantasy-zombies/, page /pg/to-me-ku-pa/) | assets/fantasy/necromancers/to-me-ku-pa-official.png | red background residue cleaned up with local masks. |
| blackheart | done | Zombicide wiki (fandom), TheBlackheart.png (official render, transparent) | necromancers/blackheart-official.png | 895x1280, native alpha |
| ostokar | done | web banner https://cdn.svc.asmodee.net/production-zombicide/uploads/image-converter/2016/04/fOstokar.webp (gallery https://www.zombicide.com/zombicide-fantasy-zombies/, page /pg/ostokar-the-pale/) | assets/fantasy/necromancers/ostokar-official.png | red background residue cleaned up with local masks. |
| evilTroy | done | Zombicide wiki (fandom), EvilTroy.png (official render, transparent) | necromancers/evil-troy-official.png | 718x840, native alpha |
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
| necromanticDragon | done | Zombicide wiki (fandom), NecromanticDragon.png (official render, transparent) | abominations/necromantic-dragon-official.png | 899x1280, native alpha |
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
| bishamon | done | Zombicide wiki (fandom), Bishamon_FR.png (official render, transparent) | abominations/bishamon-official.png | 732x1055, native alpha |
| chimimoryo | to do | nothing found (not in the rulebooks nor the two gallery pages) |  |  |
| hachiman | done | Zombicide wiki (fandom), Hachiman_FR.png (official render, transparent) | abominations/hachiman-official.png | 459x658, native alpha |
| kijin | done | Zombicide wiki (fandom), Kijin_FR.png (official render, transparent) | abominations/kijin-official.png | 1120x925, native alpha |
| kumiho | done | Zombicide wiki (fandom), Kumiho_FR.png (official render, transparent) | abominations/kumiho-official.png | 967x814, native alpha |
| nian | done | Zombicide wiki (fandom), Nian_FR.png (official render, transparent) | abominations/nian-official.png | 783x633, native alpha |
| qilin | to do | nothing found (not in the rulebooks nor the two gallery pages) |  |  |
| redHare | to do | nothing found (not in the rulebooks nor the two gallery pages) |  |  |
| shakokiDogu | to do | nothing found (not in the rulebooks nor the two gallery pages) |  |  |
| sojobo | to do | nothing found (not in the rulebooks nor the two gallery pages) |  |  |
| susanoWo | done | Zombicide wiki (fandom), SusanoWo_FR.png (official render, transparent) | abominations/susano-wo-official.png | 701x1037, native alpha |
| takemikazuchi | to do | nothing found (not in the rulebooks nor the two gallery pages) |  |  |
| toyol | done | Zombicide wiki (fandom), Toyol_FR.png (official render, transparent) | abominations/toyol-official.png | 339x416, native alpha |
| yeti | done | Zombicide wiki (fandom), Yeti_FR.png (official render, transparent) | abominations/yeti-official.png | 519x856, native alpha |
| bomoh | done | Zombicide wiki (fandom), Bomoh_FR.png (official render, transparent) | necromancers/bomoh-official.png | 444x426, native alpha |
| deathNotes | done | Zombicide wiki (fandom), DeathNotes_FR.png (official render, transparent) | necromancers/death-notes-official.png | 570x660, native alpha |
| hannya | done | Zombicide wiki (fandom), Hannya_FR.png (official render, transparent) | necromancers/hannya-official.png | 485x632, native alpha |
| kaguya | done | Zombicide wiki (fandom), Kaguya_FR.png (official render, transparent) | necromancers/kaguya-official.png | 506x667, native alpha |
| tengu | done | Zombicide wiki (fandom), Tengu_FR.png (official render, transparent) | necromancers/tengu-official.png | 610x662, native alpha |
| yukiOnna | done | Zombicide wiki (fandom), Yuki-onna_FR.png (official render, transparent) | necromancers/yuki-onna-official.png | 399x638, native alpha |
| fantasyBerserkerWalker | done | Zombicide wiki (fandom), BerserkerWalkerFantasy.png (official render, transparent) | zombies/fantasy-berserker-walker-official.png | 624x1157, native alpha |
| deadboltWalker | done | web banner https://cdn.svc.asmodee.net/production-zombicide/uploads/image-converter/2026/08/fArchers.webp (gallery https://www.zombicide.com/zombicide-fantasy-zombies/, page /pg/deadbolt-walkers/) | assets/fantasy/zombies/deadbolt-walker-official.png | red background residue removed with local masks. left figure of 3 (guess: confirm it matches the Deadbolt card) |
| terrorcottaWalker | done | web banner https://cdn.svc.asmodee.net/production-zombicide/uploads/2026/07/fWalkers.gif (gallery https://www.zombicide.com/zombicide-fantasy-zombies/, page /pg/terrorcotta-walkers/) | assets/fantasy/zombies/terrorcotta-walker-official.png | red background residue removed with local masks. middle figure of 3, red patch on the left cleaned up |
| climber | done | Zombicide wiki (fandom), Climber.png (official render, transparent) | zombies/climber-official.png | 849x1273, native alpha |
| divineBeast | to do | web: image-converter/2026/08/fDragon.webp (Azure Dragon), fTortoise.webp, fTiger.webp, fPhoenix.webp (Vermillion Bird); the app has one divineBeast subject: choose one or add four |  |  |
| reaper | done | Zombicide wiki (fandom), TheReaper.png (official render, transparent) | abominations/reaper-official.png | 1113x1280, native alpha |
| baalberith | done | Zombicide wiki (fandom), Baalberith.png (official render, transparent) | abominations/baalberith-official.png | 1137x1280, native alpha |
| horseman | done | Zombicide wiki (fandom), Horseman.png (official render, transparent) | abominations/horseman-official.png | 842x1280, native alpha |
| queenCaenedra | done | Zombicide wiki (fandom), QueenCaenedra.png (official render, transparent) | abominations/queen-caenedra-official.png | 894x1175, native alpha |
| hugBear | done | Zombicide wiki (fandom), Hugbear.png (official render, transparent) | abominations/hug-bear-official.png | 845x716, native alpha |
| banshee | done | Zombicide wiki (fandom), Banshee.png (official render, transparent) | abominations/banshee-official.png | 605x1023, native alpha |
| cerberus | done | Zombicide wiki (fandom), Cerberus.png (official render, transparent) | abominations/cerberus-official.png | 670x613, native alpha |
| lordJanas | done | Zombicide wiki (fandom), LordJanas.png (official render, transparent) | abominations/lord-janas-official.png | 576x1000, native alpha |
| marike | done | Zombicide wiki (fandom), MarikeAbomination.png (official render, transparent) | abominations/marike-official.png | 503x1000, native alpha |
| erinn | done | Zombicide wiki (fandom), Erinn.png (official render, transparent) | necromancers/erinn-official.png | 710x1000, native alpha |
| grandVizier | done | Zombicide wiki (fandom), GrandVizier.png (official render, transparent) | necromancers/grand-vizier-official.png | 1191x1394, native alpha |
| theSparrow | done | Zombicide wiki (fandom), TheSparrow.png (official render, transparent) | necromancers/the-sparrow-official.png | 935x1834, native alpha |
| dongZhuo | to do | nothing found (not in the rulebooks nor the two gallery pages) |  |  |
| zhangJiao | to do | nothing found (not in the rulebooks nor the two gallery pages) |  |  |
| fumaKotaro | to do | nothing found (not in the rulebooks nor the two gallery pages) |  |  |
| footNinja | done | Zombicide wiki (fandom), FootNinja.png (official render, transparent) | zombies/foot-ninja-official.png | 824x1280, native alpha |
| bebop | done | Zombicide wiki (fandom), BebopFantasy.png (official render, transparent) | abominations/bebop-official.png | 848x1045, native alpha |
| rocksteady | done | Zombicide wiki (fandom), RocksteadyFantasy.png (official render, transparent) | abominations/rocksteady-official.png | 625x898, native alpha |
| pharaohEddie | done | Zombicide wiki (fandom), PharaohEddie_IM.png (the Powerslave sphinx) (official render, transparent) | abominations/pharaoh-eddie-official.png | 744x464, native alpha |
| samuraiEddie | to do | nothing found (not in the rulebooks nor the two gallery pages) |  |  |
| mummyEddie | to do | nothing found (not in the rulebooks nor the two gallery pages) |  |  |
| wickerManEddie | done | Zombicide wiki (fandom), WickerEddie_IM.png (official render, transparent) | abominations/wicker-man-eddie-official.png | 495x804, native alpha |
| fearEddie | done | Zombicide wiki (fandom), FearEddie_IM.png album art; cut-out shared with the Western Fear Eddie (official render, transparent) | abominations/fear-eddie-official.png | 839x672, native alpha |
| mummRa | done | Zombicide wiki (fandom), MummRaNecromancer.png (official render, transparent) | necromancers/mumm-ra-official.png | 867x942, native alpha |
| reaperEddie | done | Zombicide wiki (fandom), ReaperEddie_IM.png (official render, transparent) | necromancers/reaper-eddie-official.png | 713x959, native alpha |
| shamanEddie | done | Zombicide wiki (fandom), ShamanEddie_IM.png (official render, transparent) | necromancers/shaman-eddie-official.png | 571x410, native alpha |
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

- `feral-dragon` and `necromantic-dragon`: the rulebook and web renders were cropped by the page edge; both now come from the complete transparent renders of the Zombicide wiki (FeralDragon.png, NecromanticDragon.png).
- Web cut-outs keep a few red floor splashes at the feet and tiny chain tips at the very bottom; Faolan (translucent) and Khan (legs) are incomplete; Terrorcotta has a blood patch. Candidates for a hand touch-up.
- Abominatroll (Zombie Bosses p.3) is as printed (contorted pose).

## To do

Every `to do` row above: mostly the Kickstarter, Special Guest, Warlords, Celestial, Crossfire, Berserker and Crowz boxes and the named Abominations of the packs. Ideas: the `/pg/` page of each box on zombicide.com (through the Wayback Machine), BoardGameGeek galleries, photos of the printed cards.
