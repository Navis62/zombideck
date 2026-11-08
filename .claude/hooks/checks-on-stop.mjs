// Stop : si du code a changé pendant ce tour, lance les tests (node --test) et le typecheck avant de rendre la main.
//
//   checks-on-stop.mjs snapshot   # UserPromptSubmit : mémorise l'état des fichiers modifiés au début du tour
//   checks-on-stop.mjs            # Stop : relance les vérifications seulement si cet état a changé depuis
//
// Un travail en cours de l'utilisateur, déjà modifié avant le tour, ne déclenche donc rien. Sans instantané (hook
// ajouté en cours de session), on retombe sur « un fichier de code modifié depuis le dernier commit ».
// Un échec renvoie le code 2 : Claude reçoit la fin du rapport et continue pour corriger. `stop_hook_active` évite de
// boucler : au second arrêt consécutif, on laisse finir (l'échec a déjà été signalé une fois).
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const CODE = /\.(tsx?|[cm]?js|json)$/;

const data = JSON.parse(readFileSync(0, 'utf8') || '{}');
const root = resolve(process.env.CLAUDE_PROJECT_DIR || data.cwd || '.');
const session = String(data.session_id || 'sans-session').replace(/[^\w-]/g, '_');
const state = join(tmpdir(), 'zombideck-hooks', `${session}.txt`);

function changedCode() {
  const r = spawnSync('git', ['status', '--porcelain', '--untracked-files=all', '--', 'src', 'app.json', 'package.json', 'tsconfig.json'], {
    cwd: root,
    encoding: 'utf8',
    timeout: 30_000,
  });
  return (r.stdout ?? '')
    .split('\n')
    .filter(Boolean)
    .map((line) => line.slice(3).split(' -> ').at(-1).replace(/^"|"$/g, ''))
    .filter((name) => CODE.test(name))
    .map((name) => join(root, name));
}

function fingerprint() {
  const h = createHash('sha256');
  for (const p of changedCode().sort()) {
    const st = existsSync(p) ? statSync(p) : null;
    h.update(`${p}|${st ? st.mtimeMs : 0}|${st ? st.size : -1}\n`);
  }
  return h.digest('hex');
}

function run(label, args) {
  const r = spawnSync(process.execPath, args, { cwd: root, encoding: 'utf8', timeout: 150_000 });
  if (r.error || r.status === 0) return null;
  const out = [r.stdout, r.stderr].filter(Boolean).join('\n').trim().split('\n').slice(-30).join('\n');
  return `${label} échoue :\n${out}`;
}

try {
  if (process.argv[2] === 'snapshot') {
    mkdirSync(join(tmpdir(), 'zombideck-hooks'), { recursive: true });
    writeFileSync(state, fingerprint(), 'utf8');
    process.exit(0);
  }
  if (data.stop_hook_active) process.exit(0);
  if (existsSync(state) ? readFileSync(state, 'utf8') === fingerprint() : changedCode().length === 0) process.exit(0);
} catch {
  process.exit(0);
}

const tsc = join(root, 'node_modules', 'typescript', 'bin', 'tsc');
const failures = [
  run('npm test (node --test src/game/engine.test.ts)', ['--test', 'src/game/engine.test.ts']),
  existsSync(tsc) ? run('npm run typecheck (tsc --noEmit)', [tsc, '--noEmit']) : null,
].filter(Boolean);
if (failures.length) {
  process.stderr.write(`Après tes modifications :\n\n${failures.join('\n\n')}\n`);
  process.exit(2);
}
