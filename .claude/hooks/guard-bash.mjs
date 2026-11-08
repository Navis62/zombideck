// PreToolUse (Bash, PowerShell): blocks commands that would destroy work, git history or the players' games.
// Exit code 2 = command refused; the reason (stderr) is sent back to Claude. Plain Node, no dependency.
//
// The command is split into simple commands (lines, `;`, `|`, `&`, `&&`, `||`) after joining continuation lines
// (`\` in sh, backtick in PowerShell), and each rule is tested on one simple command at a time, so a flag on a
// later line is never attached to an earlier command. A rule is a list of patterns that must all match.
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

// `git` in command position (start of the simple command, or right after `(`, `$(`, `{`, a quote or a backtick, as in
// `bash -c "git ..."`), so that a commit message quoting a git command is not mistaken for it. Then git's global
// options (`-C dir`, `-c key=value`, `--no-pager`...) and the given subcommand.
const git = (sub) =>
  String.raw`(?:^|[("'\`{]|\$\()\s*(?:sudo\s+)?git(?:\.exe)?(?:\s+(?:-[Cc]\s+\S+|--[\w-]+(?:=\S+)?))*\s+(?:${sub})\b`;
// `eas` / `eas-cli` / `eas-cli@latest`, run directly or through npx / bunx, followed by the given subcommand.
const eas = (sub) => String.raw`\beas(?:-cli(?:@\S+)?)?\s+${sub}\b`;
// A delete command in command position (start of the simple command, or after sudo, xargs, -exec, git).
const DELETE = String.raw`(?:^\s*(?:sudo\s+|xargs(?:\s+-\S+)*\s+|git\s+)?|-exec\s+)(?:rm|del|rmdir|Remove-Item|ri|erase|rd|unlink|rimraf)\b`;
const PRODUCTION = String.raw`\s*[\s=]\s*["']?production["']?(?:\s|$)`;

export const RULES = [
  [[git('push'), String.raw`(--force\b|--force-with-lease\b|\s-\w*f\b|\s\+\S)`], 'force push is forbidden: it rewrites remote history'],
  [[git(String.raw`[\w-]+`), String.raw`\s--no-verify\b`],'--no-verify is forbidden: fix the cause instead of skipping the checks'],
  [[git('reset'), String.raw`\s--(hard|merge)\b`], 'git reset --hard is forbidden: uncommitted work would be lost'],
  [[git('clean'), String.raw`(\s-\w*f|\s--force\b)`], 'git clean -f is forbidden: it would delete untracked files'],
  [[git('checkout'), String.raw`\s--(\s|$)`], 'git checkout -- <path> is forbidden: it would discard uncommitted changes'],
  [[git('checkout'), String.raw`\s(\.|:/)(\s|$)`], 'git checkout . is forbidden: it would discard all uncommitted changes'],
  [[git('checkout|switch'), String.raw`\s(-\w*f\b|--force\b|--discard-changes\b)`], 'git checkout/switch -f is forbidden: it would discard uncommitted changes'],
  // `git restore --staged` alone only unstages; any other restore overwrites the working tree.
  [[git('restore'), String.raw`^(?!.*\s(--staged|-S)\b)`], 'git restore is forbidden: it would discard uncommitted changes'],
  [[git('restore'), String.raw`\s(--worktree|-W)\b`], 'git restore --worktree is forbidden: it would discard uncommitted changes'],
  [[git('stash'), String.raw`\s(drop|clear)\b`], 'git stash drop/clear is forbidden: stashed work would be lost'],
  // Artwork and screenshots are hand-edited originals: nothing can regenerate them.
  [[DELETE, String.raw`(\bassets\b|\bstore(?:[/\\]|["']?\s*$))`], 'deleting in assets/ or store/ is forbidden: these are originals'],
  // An OTA update reaches every player at their next launch: only through /release, with the user's consent.
  [[eas('update'), String.raw`(--channel${PRODUCTION}|--branch${PRODUCTION}|\s--auto(?:[\s=]|$))`],
    'eas update to production is refused here: /release prepares and checks, then the user runs the command'],
  [[eas('submit')], 'eas submit is refused here: sending to the stores is up to the user'],
  [[eas('build'), String.raw`\s--auto-submit`], 'eas build --auto-submit is refused here: sending to the stores is up to the user'],
];

export function simpleCommands(command) {
  return command
    .replace(/[\\`]\r?\n/g, ' ')
    .split(/\r?\n|&&|\|\||[;|&]/)
    .filter((part) => part.trim());
}

export function blocked(command) {
  for (const part of simpleCommands(command)) {
    for (const [patterns, reason] of RULES) {
      if (patterns.every((p) => new RegExp(p, 'i').test(part))) return reason;
    }
  }
  return null;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const data = JSON.parse(readFileSync(0, 'utf8') || '{}');
  const reason = blocked(data.tool_input?.command ?? '');
  if (reason) {
    process.stderr.write(`Blocked by .claude/hooks/guard-bash.mjs: ${reason}. Ask the user whether it is really needed.\n`);
    process.exit(2);
  }
}
