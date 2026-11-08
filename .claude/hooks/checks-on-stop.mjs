// Stop: if code changed during this turn, run the tests (node --test) and the typecheck before handing back.
//
//   checks-on-stop.mjs snapshot   # UserPromptSubmit: records the state of the modified files at the start of the turn
//   checks-on-stop.mjs            # Stop: runs the checks again only if that state changed since
//
// Work in progress by the user, already modified before the turn, therefore triggers nothing. Without a snapshot
// (hook added mid-session), it falls back to "a code file modified since the last commit".
// A failure exits with code 2: Claude receives the end of the report and keeps going to fix it. `stop_hook_active`
// prevents a loop: on the second consecutive stop, the turn ends (the failure has already been reported once).
// The checks run in parallel, each under CHECK_TIMEOUT_MS, which stays below the Stop hook timeout in settings.json
// (180 s); a check that times out or cannot start counts as a failure.
import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const CODE = /\.(tsx?|[cm]?js|json)$/;
const CHECK_TIMEOUT_MS = 150_000;

const data = JSON.parse(readFileSync(0, 'utf8') || '{}');
const root = resolve(process.env.CLAUDE_PROJECT_DIR || data.cwd || '.');
const session = String(data.session_id || 'no-session').replace(/[^\w-]/g, '_');
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

// Resolves to null on success, or to a failure report (last 30 lines of output).
function run(label, args) {
  return new Promise((done) => {
    const child = spawn(process.execPath, args, { cwd: root });
    let out = '';
    child.stdout.on('data', (chunk) => (out += chunk));
    child.stderr.on('data', (chunk) => (out += chunk));
    const timer = setTimeout(() => {
      child.kill();
      done(`${label} did not finish within ${CHECK_TIMEOUT_MS / 1000} s; run it by hand.`);
    }, CHECK_TIMEOUT_MS);
    child.on('error', (err) => {
      clearTimeout(timer);
      done(`${label} could not start: ${err.message}`);
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (code === 0) return done(null);
      done(`${label} fails:\n${out.trim().split('\n').slice(-30).join('\n')}`);
    });
  });
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
const failures = (
  await Promise.all([
    run('npm test (node --test src/game/engine.test.ts)', ['--test', 'src/game/engine.test.ts']),
    existsSync(tsc) ? run('npm run typecheck (tsc --noEmit)', [tsc, '--noEmit']) : null,
  ])
).filter(Boolean);
if (failures.length) {
  process.stderr.write(`After your changes:\n\n${failures.join('\n\n')}\n`);
  process.exit(2);
}
