// PostToolUse (Edit, Write) : eslint sur le fichier TypeScript / JavaScript qui vient d'être modifié.
// Erreurs : code 2, le rapport (stderr) est montré à Claude, qui corrige tout de suite. Les avertissements passent.
// Le typecheck (projet entier) est fait une fois par tour, par checks-on-stop.mjs.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const data = JSON.parse(readFileSync(0, 'utf8') || '{}');
const root = resolve(process.env.CLAUDE_PROJECT_DIR || data.cwd || '.');
const file = data.tool_input?.file_path ?? '';
const rel = relative(root, resolve(file)).replaceAll('\\', '/');
const eslint = join(root, 'node_modules', 'eslint', 'bin', 'eslint.js');

const inRepo = rel && !rel.startsWith('..') && !/^(node_modules|android|ios|\.expo|dist)\//.test(rel);
if (!inRepo || !/\.(tsx?|[cm]?js)$/.test(rel) || !existsSync(file) || !existsSync(eslint)) process.exit(0);

const r = spawnSync(process.execPath, [eslint, '--quiet', '--format', 'stylish', rel], {
  cwd: root,
  encoding: 'utf8',
  timeout: 55_000,
});
if (r.error || r.status === 0) process.exit(0); // eslint absent ou bloqué : ne pas gêner le travail
const report = [r.stdout?.trim(), r.stderr?.trim()].filter(Boolean).join('\n');
process.stderr.write(`eslint signale des erreurs dans ${rel} :\n${report}\n`);
process.exit(2);
