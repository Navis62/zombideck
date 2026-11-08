// Tests for guard-bash.mjs: node --test .claude/hooks/
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { blocked } from './guard-bash.mjs';

const BLOCKED = [
  'git push --force origin main',
  'git push -f',
  'git push origin +main',
  'git commit --no-verify -m x',
  'git reset --hard',
  'git -C . reset --hard',
  'git reset HEAD --hard',
  'git clean -fd',
  'git checkout .',
  'git checkout HEAD -- src',
  'git checkout -- src/app/index.tsx',
  'git checkout -f main',
  'git switch -f main',
  'git switch --discard-changes main',
  'git restore src',
  'git restore .',
  'git restore --worktree --staged src',
  'git stash drop',
  'rm -rf assets/zombies',
  'Remove-Item -Recurse store/',
  'git rm assets/icons/x.png',
  'find assets -name "*.jpg" -exec rm {} +',
  'npx eas-cli@latest update --channel production --message x',
  'npx eas-cli@latest update --channel "production" --message x',
  "eas update --branch='production'",
  'eas update --channel=production',
  'npx eas-cli@latest update \\\n  --channel production',
  'npx eas-cli@latest update `\n  --channel production',
  'eas update --auto',
  'npx eas-cli@latest submit -p android',
  'npx eas-cli@latest build -p android --profile production --auto-submit',
  'echo ok && git reset --hard',
  'bash -c "git reset --hard"',
  'echo $(git stash clear)',
];

const ALLOWED = [
  'git push origin feat/x',
  'git push -u origin feat/x',
  'git push --follow-tags',
  'git status',
  'git checkout -b feature',
  'git switch main',
  'git restore --staged src/app/index.tsx',
  'git stash pop',
  'npx eas-cli@latest update --channel preview --message x',
  'npx eas-cli@latest build -p android --profile production',
  'npx eas-cli@latest update --channel preview --auto-submit-is-not-a-flag',
  'git commit -m "x" -m "notes about store/ listing and the rd column"',
  'grep -n rd assets/x',
  'git commit -m "explain why git reset --hard is blocked"',
  'git checkout HEAD~1 -b fix\ngit switch -c other\necho -f',
  'git clean -n\necho -f',
  'ls store/',
];

test('blocks destructive and publishing commands', () => {
  for (const command of BLOCKED) assert.ok(blocked(command), `should block: ${command}`);
});

test('lets harmless commands through', () => {
  for (const command of ALLOWED) assert.equal(blocked(command), null, `should allow: ${command}`);
});
