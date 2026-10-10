import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { readJson, writeJson, sha256File } from './knowledge-lib.mjs';

const SUPPORTED = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif']);
const MEDIA_PREFIX = 'sv13_media_';
const INDEX_NAME = 'media_index.json';

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--unity-project') out.unityProject = argv[++i];
    else if (argv[i] === '--knowledge') out.knowledge = argv[++i];
    else if (argv[i] === '--help' || argv[i] === '-h') out.help = true;
    else throw new Error(`Unknown argument: ${argv[i]}`);
  }
  return out;
}

function safeName(assetPath) {
  const parsed = path.parse(assetPath);
  const stem = (parsed.name || 'sprite').replace(/[^A-Za-z0-9._-]+/g, '_').replace(/^[._]+|[._]+$/g, '') || 'sprite';
  const shortHash = crypto.createHash('sha1').update(assetPath, 'utf8').digest('hex').slice(0, 12);
  return `${MEDIA_PREFIX}${shortHash}_${stem}${parsed.ext.toLowerCase()}`;
}

function gather(knowledgeDir) {
  const found = new Set();
  const add = x => { const v = String(x || '').trim(); if (v) found.add(v); };
  for (const name of ['items.json','item_categories.json','build_materials.json','buildables.json']) {
    const p = path.join(knowledgeDir, name);
    if (!fs.existsSync(p)) continue;
    const data = readJson(p);
    if (Array.isArray(data)) for (const r of data) add(r?.iconAssetPath);
  }
  const levelsPath = path.join(knowledgeDir, 'levels.json');
  if (fs.existsSync(levelsPath)) {
    const levels = readJson(levelsPath);
    if (Array.isArray(levels)) for (const r of levels) { add(r?.thumbnailAssetPath); add(r?.loadingImageAssetPath); }
  }
  return [...found].sort((a,b) => a.localeCompare(b));
}

const args = parseArgs(process.argv.slice(2));
if (args.help || !args.unityProject) {
  console.log('Usage: node tools/build-media-bundle.mjs --unity-project "C:\\Unity Projects\\TestAssets" [--knowledge "...\\SV13_Knowledge\\Latest"]');
  process.exit(args.help ? 0 : 2);
}

const unity = path.resolve(args.unityProject);
const knowledge = path.resolve(args.knowledge || path.join(unity, 'SV13_Knowledge', 'Latest'));
const manifestPath = path.join(knowledge, 'manifest.json');
if (!fs.existsSync(path.join(unity, 'Assets'))) throw new Error(`Unity Assets folder not found: ${path.join(unity,'Assets')}`);
if (!fs.existsSync(manifestPath)) throw new Error(`Knowledge manifest not found: ${manifestPath}`);

for (const name of fs.readdirSync(knowledge)) {
  if (name.startsWith(MEDIA_PREFIX)) fs.rmSync(path.join(knowledge, name), { force: true });
}
fs.rmSync(path.join(knowledge, INDEX_NAME), { force: true });

const requested = gather(knowledge);
const assets = [], missing = [], unsupported = [];
for (const assetPath of requested) {
  const source = path.join(unity, assetPath.replace(/\//g, path.sep));
  const ext = path.extname(source).toLowerCase();
  if (!SUPPORTED.has(ext)) { unsupported.push(assetPath); continue; }
  if (!fs.existsSync(source) || !fs.statSync(source).isFile()) { missing.push(assetPath); continue; }
  const fileName = safeName(assetPath);
  const target = path.join(knowledge, fileName);
  fs.copyFileSync(source, target);
  assets.push({ assetPath, fileName, sha256: sha256File(target), bytes: fs.statSync(target).size });
}

const indexPath = path.join(knowledge, INDEX_NAME);
writeJson(indexPath, { schemaVersion: '1', generatedUtc: new Date().toISOString(), assets });

const manifest = readJson(manifestPath);
if (!Array.isArray(manifest.files)) throw new Error('manifest.json files must be an array.');
manifest.files = manifest.files.filter(e => e && typeof e === 'object' && e.fileName && e.fileName !== INDEX_NAME && !String(e.fileName).startsWith(MEDIA_PREFIX));
for (const entry of assets) manifest.files.push({ fileName: entry.fileName, sha256: entry.sha256, bytes: entry.bytes, recordCount: 0 });
manifest.files.push({ fileName: INDEX_NAME, sha256: sha256File(indexPath), bytes: fs.statSync(indexPath).size, recordCount: assets.length });
manifest.notes ??= [];
const note = 'Player-facing media bundle attached by SV13 web tooling; raw Unity asset paths remain unchanged for auditing.';
if (!manifest.notes.includes(note)) manifest.notes.push(note);
writeJson(manifestPath, manifest);

console.log('SV13 media bundle complete');
console.log('Knowledge:', knowledge);
console.log('Referenced images:', requested.length);
console.log('Copied:', assets.length);
console.log('Missing:', missing.length);
console.log('Unsupported format:', unsupported.length);
if (missing.length) console.log('Missing examples:\n' + missing.slice(0,15).map(x=>' - '+x).join('\n'));
if (unsupported.length) console.log('Unsupported examples:\n' + unsupported.slice(0,15).map(x=>' - '+x).join('\n'));
