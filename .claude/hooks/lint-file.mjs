// PostToolUse (Edit, Write): eslint on the TypeScript / JavaScript file that was just modified.
// Errors: exit code 2, the report (stderr) is shown to Claude, which fixes it right away. Warnings pass.
// The typecheck (whole project) runs once per turn, in checks-on-stop.mjs.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { isAbsolute, join, relative, resolve } from 'node:path';

const data = JSON.parse(readFileSync(0, 'utf8') || '{}');
const root = resolve(process.env.CLAUDE_PROJECT_DIR || data.cwd || '.');
const file = data.tool_input?.file_path ?? '';
// On Windows, a file on another drive gives an absolute "relative" path (C:\...), hence the isAbsolute check.
const relNative = relative(root, resolve(file));
const rel = relNative.replaceAll('\\', '/');
const eslint = join(root, 'node_modules', 'eslint', 'bin', 'eslint.js');

const inRepo =
  rel && !isAbsolute(relNative) && !rel.startsWith('..') && !/^(node_modules|android|ios|\.expo|dist)\//.test(rel);
if (!inRepo || !/\.(tsx?|[cm]?js)$/.test(rel) || !existsSync(file) || !existsSync(eslint)) process.exit(0);

const r = spawnSync(process.execPath, [eslint, '--quiet', '--format', 'stylish', rel], {
  cwd: root,
  encoding: 'utf8',
  timeout: 55_000,
});
if (r.error || r.status === 0) process.exit(0); // eslint missing or stuck: do not get in the way of the work
const report = [r.stdout?.trim(), r.stderr?.trim()].filter(Boolean).join('\n');
process.stderr.write(`eslint reports errors in ${rel}:\n${report}\n`);
process.exit(2);
