import path from 'node:path';
import { loadKnowledge, isPublic } from './knowledge-lib.mjs';

const root = path.resolve(import.meta.dirname, '..');
const knowledgeDir = path.join(root, 'knowledge', 'Latest');
const data = loadKnowledge(knowledgeDir);
const counts = {
  items: data.items.filter(x => isPublic('item', x)).length,
  recipes: data.recipes.filter(x => isPublic('recipe', x)).length,
  buildables: data.buildables.filter(x => isPublic('building', x)).length,
  crops: data.crops.filter(x => isPublic('crop', x)).length,
  documents: data.documents.filter(x => isPublic('document', x)).length,
  levels: data.levels.filter(x => isPublic('level', x)).length,
  baits: (data.fishing.baits || []).filter(x => isPublic('bait', x)).length,
  catches: (data.fishing.loot || []).filter(x => isPublic('fishing', x)).length,
  media: data.mediaIndex.size,
};
console.log('SV13 knowledge package PASS');
console.log('Package:', data.manifest.packageVersion);
console.log('Raw manifest files:', data.manifest.files.length);
for (const [key, value] of Object.entries(counts)) console.log(`${key}: ${value}`);
