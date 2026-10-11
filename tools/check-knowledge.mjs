import fs from 'node:fs';
import path from 'node:path';
import { loadKnowledge, isPublic, mediaAssetPath, buildMaps } from './knowledge-lib.mjs';

const root = path.resolve(import.meta.dirname, '..');
const knowledgeDir = path.join(root, 'knowledge', 'Latest');
const data = loadKnowledge(knowledgeDir);
const maps = buildMaps(data);

if (!data.mediaBundlePresent || data.mediaIndex.size === 0) {
  throw new Error(
    'Player-facing media bundle is missing from knowledge/Latest.\n' +
    'After syncing the Unity package, run:\n' +
    'npm run media:build -- --unity-project "C:\\Unity Projects\\TestAssets" --knowledge ".\\knowledge\\Latest"'
  );
}

const publicLevels = data.levels.filter(x => isPublic('level', x));
const publicScenes = new Set(publicLevels.map(x => String(x.sceneName || '').toLowerCase()).filter(Boolean));
const publicUi = data.ui.filter(x => isPublic('ui', x) && ((x.sourceScenes || []).length === 0 || (x.sourceScenes || []).some(s => publicScenes.has(String(s || '').toLowerCase()))));
const publicWeather = data.weather.filter(x => isPublic('weather', x) && publicScenes.has(String(x.sceneName || '').toLowerCase()));
const publicAreas = data.areas.filter(x => isPublic('area', x) && publicScenes.has(String(x.sceneName || '').toLowerCase()));

const counts = {
  items: data.items.filter(x => isPublic('item', x)).length,
  recipes: data.recipes.filter(x => isPublic('recipe', x)).length,
  buildables: data.buildables.filter(x => isPublic('building', x)).length,
  crops: data.crops.filter(x => isPublic('crop', x)).length,
  documents: data.documents.filter(x => isPublic('document', x)).length,
  levels: publicLevels.length,
  capturedAreas: publicAreas.filter(x => x.hasSceneCapture).length,
  weatherProfiles: publicWeather.length,
  uiEntries: publicUi.length,
  baits: (data.fishing.baits || []).filter(x => isPublic('bait', x)).length,
  catches: (data.fishing.loot || []).filter(x => isPublic('fishing', x)).length,
  media: data.mediaIndex.size,
};

const MEDIA_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif']);
const mediaRefs = new Set();
const addMedia = (kind, records) => {
  for (const r of records) {
    const asset = mediaAssetPath(kind, r, maps);
    if (asset) mediaRefs.add(asset);
  }
};
addMedia('item', data.items.filter(x => isPublic('item', x)));
addMedia('recipe', data.recipes.filter(x => isPublic('recipe', x)));
addMedia('building', data.buildables.filter(x => isPublic('building', x)));
addMedia('crop', data.crops.filter(x => isPublic('crop', x)));
addMedia('level', publicLevels);
addMedia('ui', publicUi);
const bundleEligibleMediaRefs = [...mediaRefs].filter(x => MEDIA_EXTENSIONS.has(path.extname(x).toLowerCase()));
const unmappedMedia = bundleEligibleMediaRefs.filter(x => !data.mediaIndex.has(x));

console.log('SV13 knowledge package PASS');
console.log('Package:', data.manifest.packageVersion);
console.log('Knowledge schema:', data.manifest.knowledgeSchemaVersion);
console.log('Toolkit:', data.manifest.toolkitVersion);
console.log('Manifest files:', data.manifest.files.length);
for (const [key, value] of Object.entries(counts)) console.log(`${key}: ${value}`);
console.log('Player-facing media refs:', mediaRefs.size);
console.log('Bundle-eligible media refs:', bundleEligibleMediaRefs.length);
console.log('Unmapped player-facing media refs:', unmappedMedia.length);
if (unmappedMedia.length) console.log('Unmapped examples:\n' + unmappedMedia.slice(0, 12).map(x => ` - ${x}`).join('\n'));

const manifestErrors = Number(data.manifest?.counts?.validationErrors || 0);
if (manifestErrors > 0) throw new Error(`Unity knowledge manifest reports ${manifestErrors} validation error(s).`);
