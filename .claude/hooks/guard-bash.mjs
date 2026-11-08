// PreToolUse (Bash, PowerShell) : bloque les commandes qui détruiraient du travail, l'historique git ou une partie
// des joueurs. Code de sortie 2 = commande refusée, la raison (stderr) est renvoyée à Claude. Node seul, sans
// dépendance. Une règle est une liste de motifs qui doivent tous apparaître dans la commande.
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const DELETE = String.raw`\b(rm|del|rmdir|Remove-Item|ri|erase|rd|unlink|rimraf)\b`;

export const RULES = [
  [[String.raw`\bgit\s+push\b.*(--force\b|--force-with-lease\b|\s-f\b|\s\+\S)`], 'push forcé interdit : réécrit l’historique distant'],
  [[String.raw`\bgit\s+.*--no-verify\b`], '--no-verify interdit : corrige la cause au lieu de contourner les vérifications'],
  [[String.raw`\bgit\s+reset\s+--hard\b`], 'git reset --hard interdit : du travail non commité serait perdu'],
  [[String.raw`\bgit\s+clean\b[^|;&]*(\s-\w*f|\s--force\b)`], 'git clean -f interdit : supprimerait des fichiers non suivis'],
  [[String.raw`\bgit\s+checkout\b[^|;&]*\s(--\s+)?(\.|:/)(\s|$)`], 'git checkout . interdit : annulerait toutes les modifications en cours'],
  [[String.raw`\bgit\s+checkout\b[^|;&]*\s(-f|--force)\b`], 'git checkout -f interdit : annulerait les modifications en cours'],
  [[String.raw`\bgit\s+restore\b(?![^|;&]*--staged(?![^|;&]*(--worktree|\s-W\b)))[^|;&]*\s(\.|:/|\*)(\s|$)`],
    'git restore . interdit : annulerait toutes les modifications en cours'],
  [[String.raw`\bgit\s+stash\s+(drop|clear)\b`], 'git stash drop/clear interdit : le travail mis de côté serait perdu'],
  // Les illustrations et captures sont des originaux retravaillés à la main : rien ne permet de les régénérer.
  [[DELETE, String.raw`(\bassets\b|\bstore[/\\]|\bstore\s*$)`], 'suppression dans assets/ ou store/ interdite : ce sont des originaux'],
  // Une mise à jour OTA part chez tous les joueurs à leur prochain lancement : seulement via /release, avec accord.
  [[String.raw`\beas(-cli(@\S+)?)?\s+update\b`, String.raw`(--channel[\s=]+production|--branch[\s=]+production|--auto)`],
    'eas update vers production refusé ici : /release prépare et vérifie, puis l’utilisateur lance la commande lui-même'],
  [[String.raw`\beas(-cli(@\S+)?)?\s+submit\b`], 'eas submit refusé ici : l’envoi aux stores, c’est l’utilisateur qui le lance'],
];

export function blocked(command) {
  for (const [patterns, reason] of RULES) {
    if (patterns.every((p) => new RegExp(p, 'i').test(command))) return reason;
  }
  return null;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const data = JSON.parse(readFileSync(0, 'utf8') || '{}');
  const reason = blocked(data.tool_input?.command ?? '');
  if (reason) {
    process.stderr.write(`Bloqué par .claude/hooks/guard-bash.mjs : ${reason}. Demande à l'utilisateur s'il le faut vraiment.\n`);
    process.exit(2);
  }
}
