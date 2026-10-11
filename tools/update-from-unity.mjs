import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = path.resolve(import.meta.dirname, '..');
const unityArg = process.argv[2];
if (!unityArg || unityArg === '--help' || unityArg === '-h') {
  console.log('Usage: npm run update:unity -- "C:\\Unity Projects\\TestAssets"');
  process.exit(unityArg ? 0 : 2);
}

const unity = path.resolve(unityArg);
const sourceKnowledge = path.join(unity, 'SV13_Knowledge', 'Latest');
const repoKnowledge = path.join(ROOT, 'knowledge', 'Latest');
if (!fs.existsSync(path.join(unity, 'Assets'))) throw new Error(`Unity Assets folder not found: ${path.join(unity, 'Assets')}`);
if (!fs.existsSync(path.join(sourceKnowledge, 'manifest.json'))) throw new Error(`Unity knowledge package not found: ${sourceKnowledge}`);

function run(script, args = []) {
  const result = spawnSync(process.execPath, [path.join(ROOT, 'tools', script), ...args], {
    cwd: ROOT,
    stdio: 'inherit',
    windowsHide: false,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}

console.log('\n[1/4] Syncing authoritative Unity knowledge...');
run('sync-knowledge.mjs', [sourceKnowledge]);

console.log('\n[2/4] Rebuilding website/bot media bundle (including HUD/UI icons)...');
run('build-media-bundle.mjs', ['--unity-project', unity, '--knowledge', repoKnowledge]);

console.log('\n[3/4] Validating knowledge + media...');
run('check-knowledge.mjs');

console.log('\n[4/4] Building static website...');
run('build-site.mjs');

console.log('\nSV13 website update complete. Review the local preview, then commit/push the changed knowledge and source files.');
