import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export const PUBLIC_STATUSES = new Set(['SV13AuthoredCandidate', 'ProjectIntegratedCandidate']);

export function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''));
}

export function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + '\n', 'utf8');
}

export function sha256File(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

export function verifyKnowledgeDir(knowledgeDir) {
  const manifestPath = path.join(knowledgeDir, 'manifest.json');
  if (!fs.existsSync(manifestPath)) throw new Error(`manifest.json not found: ${manifestPath}`);
  const manifest = readJson(manifestPath);
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
    throw new Error('manifest.json must contain an object.');
  }
  if (!Array.isArray(manifest.files)) throw new Error('manifest.json files must be an array.');

  const required = [
    'items.json', 'recipes.json', 'item_categories.json', 'buildables.json',
    'build_materials.json', 'crops.json', 'fishing.json', 'documents.json',
    'levels.json', 'loot_tables.json', 'areas.json', 'weather.json', 'ui.json',
    'validation.json'
  ];
  const names = new Set(manifest.files.filter(x => x && typeof x === 'object').map(x => String(x.fileName || '')));
  const missingEntries = required.filter(x => !names.has(x));
  if (missingEntries.length) throw new Error(`Manifest is missing required entries: ${missingEntries.join(', ')}`);

  const errors = [];
  for (const entry of manifest.files) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue;
    const name = String(entry.fileName || '').trim();
    if (!name) continue;
    if (name.includes('/') || name.includes('\\') || name === '.' || name === '..') {
      errors.push(`unsafe manifest file name: ${name}`);
      continue;
    }
    const filePath = path.join(knowledgeDir, name);
    if (!fs.existsSync(filePath)) {
      errors.push(`missing: ${name}`);
      continue;
    }
    if (Number.isInteger(entry.bytes) && fs.statSync(filePath).size !== entry.bytes) {
      errors.push(`byte mismatch: ${name}`);
    }
    if (entry.sha256 && sha256File(filePath) !== String(entry.sha256).toLowerCase()) {
      errors.push(`hash mismatch: ${name}`);
    }
  }
  if (errors.length) throw new Error(`Knowledge package validation failed:\n- ${errors.slice(0, 20).join('\n- ')}`);
  return manifest;
}

export function friendlyLabel(value) {
  let text = String(value ?? '').trim();
  if (!text) return '';
  for (let i = 0; i < 4; i++) {
    const updated = text.replace(/^(?:SV13|HQFPS|STP|FPSCore|FPS)[_\- ]+/i, '').trim();
    if (updated === text) break;
    text = updated;
  }
  text = text.replace(/^RarityLevel[_\- ]+/i, '');
  text = text.replace(/^ItemCategory[_\- ]+/i, '');
  text = text.replace(/^Category[_\- ]+/i, '');
  text = text.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
  text = text.replace(/(^|[^0-9])45 ACP\b/gi, (m, p1) => `${p1}.45 ACP`);
  return text;
}

export function readableIdentifier(value) {
  let text = friendlyLabel(value);
  if (!text) return '';
  text = text
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim();
  return text;
}

export function rarityLabel(value) {
  return friendlyLabel(value).replace(/^RarityLevel\s*/i, '').trim() || 'Unknown';
}

export function displayName(kind, record) {
  let raw = '';
  if (kind === 'recipe') raw = record.resultItemName || record.recipeKey || '';
  else if (kind === 'building') {
    raw = record.name || '';
    if (String(raw).startsWith('BuildingPiece_') && record.description) raw = record.description;
  } else if (kind === 'crop') raw = record.cropName || record.name || '';
  else if (kind === 'bait') raw = record.baitName || record.assetName || '';
  else if (kind === 'fishing') raw = record.lootName || record.assetName || '';
  else if (kind === 'document') raw = record.title || record.id || '';
  else if (kind === 'level') raw = record.name || record.assetName || '';
  else if (kind === 'area') raw = record.name || record.areaName || record.sceneName || record.areaKey || '';
  else if (kind === 'weather') raw = record.areaName || record.name || record.sceneName || record.areaKey || '';
  else if (kind === 'ui') raw = record.name || record.iconName || record.uiKey || '';
  else raw = record.name || '';
  return friendlyLabel(raw);
}

export function isPublic(kind, record) {
  if (!record || typeof record !== 'object') return false;

  // Scene-derived knowledge does not carry definition contentStatus.
  if (kind === 'weather') {
    return Boolean(record.hasWeatherSystem && displayName(kind, record).trim());
  }
  if (kind === 'ui') {
    const name = displayName(kind, record).trim();
    if (!name) return false;
    const hasEvidence = Boolean(
      record.iconAuthoritative ||
      String(record.iconAssetPath || '').trim() ||
      (record.visibleLabels || []).some(x => String(x || '').trim()) ||
      String(record.meaning || '').trim()
    );
    return hasEvidence;
  }
  if (kind === 'area') {
    return Boolean(String(record.sceneName || '').trim() && displayName(kind, record).trim());
  }

  const status = String(record?.source?.contentStatus || '').trim();
  if (!PUBLIC_STATUSES.has(status)) return false;
  const name = displayName(kind, record).trim();
  if (!name) return false;
  const low = name.toLowerCase();
  if (['example ', ' demo', 'prototype', 'showcase'].some(token => low.includes(token))) return false;
  if (kind === 'recipe' && !record.hasIngredients) return false;
  if (kind === 'level' && !String(record.sceneName || '').trim()) return false;
  return true;
}

export function buildingContext(record) {
  const components = new Set((record.sv13ComponentTypes || []).map(String));
  if (components.has('SV13PermanentUpgradeController')) return 'Boren Player Cabin Upgrade';
  if (components.has('SV13PermanentConstructable')) return 'Player Cabin Construction';
  return friendlyLabel(record.categoryName) || 'Construction';
}

export function slugify(value) {
  let text = friendlyLabel(value).toLowerCase();
  text = text.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
  text = text.replace(/&/g, ' and ');
  text = text.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return text || 'entry';
}

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function cleanText(value) {
  return String(value ?? '').replace(/\r\n/g, '\n').trim();
}

export function entityKey(kind, record) {
  const source = record.source || {};
  const assetPath = String(source.assetPath || '');
  if (kind === 'item') return `item:${record.id}:${assetPath}`;
  if (kind === 'recipe') return `recipe:${record.recipeKey || ''}`;
  if (kind === 'building') return `building:${record.id}:${assetPath}`;
  if (kind === 'crop') return `crop:${assetPath}`;
  if (kind === 'bait') return `bait:${assetPath}`;
  if (kind === 'fishing') return `fishing:${assetPath}`;
  if (kind === 'document') return `document:${record.id || ''}:${assetPath}`;
  if (kind === 'level') return `level:${assetPath}`;
  if (kind === 'area') return `area:${record.areaKey || record.sceneAssetPath || displayName(kind, record)}`;
  if (kind === 'weather') return `weather:${record.areaKey || record.sceneAssetPath || displayName(kind, record)}`;
  if (kind === 'ui') return `ui:${record.uiKey || record.iconGuid || displayName(kind, record)}`;
  return `${kind}:${assetPath}:${displayName(kind, record)}`;
}

export function aliases(kind, record) {
  const out = [];
  if (kind === 'recipe') out.push(record.resultItemName || '');
  else if (kind === 'building') out.push(record.name || '');
  else if (kind === 'crop') out.push(record.cropName || record.name || '');
  else if (kind === 'bait') out.push(record.baitName || record.assetName || '');
  else if (kind === 'fishing') out.push(record.lootName || record.assetName || '');
  else if (kind === 'document') out.push(record.title || record.id || '');
  else if (kind === 'level') out.push(record.name || record.assetName || '');
  else if (kind === 'area') out.push(record.name || record.areaName || '', record.sceneName || '', record.areaKey || '');
  else if (kind === 'weather') out.push(record.areaName || '', record.sceneName || '', record.areaKey || '');
  else if (kind === 'ui') out.push(record.name || '', record.iconName || '', record.category || '');
  else out.push(record.name || '');

  if (kind === 'item') out.push(record.description || '', record.longDescription || '', record.categoryName || '');
  if (kind === 'recipe') {
    out.push(record.requiredStation || '');
    out.push((record.requirements || []).map(x => x.itemName || '').join(' '));
  }
  if (kind === 'building') {
    out.push(record.description || '', record.categoryName || '', buildingContext(record));
    out.push((record.requirements || []).map(x => x.buildMaterialName || '').join(' '));
  }
  if (kind === 'crop') out.push(record.seedItemName || '', record.produceItemName || '');
  if (kind === 'bait' || kind === 'fishing') out.push(record.description || '', record.baitTier || '', record.lootTier || '', record.lootType || '');
  if (kind === 'document') out.push(record.id || '', record.codexEntryId || '', record.documentType || '');
  if (kind === 'level') out.push(record.sceneName || '', record.description || '', record.assetName || '');
  if (kind === 'area') {
    out.push(record.description || '');
    out.push((record.activities || []).join(' '));
    out.push((record.borenUpgrades || []).join(' '));
    out.push((record.upgrades || []).flatMap(x => [x?.name || '', x?.summary || '', ...(x?.capabilities || [])]).join(' '));
    out.push((record.specialFeatures || []).flatMap(x => [x?.name || '', x?.summary || '', ...(x?.capabilities || [])]).join(' '));
  }
  if (kind === 'weather') {
    out.push((record.scheduledWeatherTypes || record.stormTypes || []).join(' '));
    out.push((record.supportedHazardTypes || []).join(' '));
    out.push((record.facts || []).map(x => `${x?.label || ''} ${x?.value || ''}`).join(' '));
  }
  if (kind === 'ui') {
    out.push(record.meaning || '', record.importance || '', record.iconEvidenceKind || '');
    out.push((record.visibleLabels || []).join(' '));
    out.push((record.sourceScenes || []).join(' '));
    out.push((record.hierarchyPaths || []).join(' '));
  }
  return out.map(String).filter(Boolean);
}

export function loadKnowledge(knowledgeDir) {
  const manifest = verifyKnowledgeDir(knowledgeDir);
  const load = name => readJson(path.join(knowledgeDir, name));
  const items = load('items.json');
  const recipes = load('recipes.json');
  const categories = load('item_categories.json');
  const buildables = load('buildables.json');
  const buildMaterials = load('build_materials.json');
  const crops = load('crops.json');
  const fishing = load('fishing.json');
  const documents = load('documents.json');
  const levels = load('levels.json');
  const lootTables = load('loot_tables.json');
  const areas = load('areas.json');
  const weather = load('weather.json');
  const ui = load('ui.json');
  const validation = load('validation.json');
  const mediaIndexPath = path.join(knowledgeDir, 'media_index.json');
  const mediaIndexRaw = fs.existsSync(mediaIndexPath) ? load('media_index.json') : { assets: [] };
  const mediaIndex = new Map();
  for (const entry of mediaIndexRaw.assets || []) {
    if (entry?.assetPath && entry?.fileName) mediaIndex.set(String(entry.assetPath), String(entry.fileName));
  }
  return {
    manifest, items, recipes, categories, buildables, buildMaterials, crops, fishing,
    documents, levels, lootTables, areas, weather, ui, validation,
    mediaIndex, mediaBundlePresent: fs.existsSync(mediaIndexPath)
  };
}

export function buildMaps(data) {
  const itemById = new Map(data.items.map(x => [Number(x.id), x]));
  const itemByCleanName = new Map(data.items.map(x => [friendlyLabel(x.name).toLowerCase(), x]));
  const buildMaterialById = new Map(data.buildMaterials.map(x => [Number(x.id), x]));
  const buildableById = new Map();
  const buildableByPath = new Map();
  for (const x of data.buildables || []) {
    if (!buildableById.has(Number(x.id))) buildableById.set(Number(x.id), x);
    const p = String(x?.source?.assetPath || '');
    if (p) buildableByPath.set(p.toLowerCase(), x);
  }
  const documentById = new Map((data.documents || []).map(x => [String(x.id || '').toLowerCase(), x]));
  const documentByPath = new Map();
  for (const x of data.documents || []) {
    const p = String(x?.source?.assetPath || '');
    if (p) documentByPath.set(p.toLowerCase(), x);
  }
  const areaByKey = new Map();
  const areaBySceneName = new Map();
  const areaByScenePath = new Map();
  for (const x of data.areas || []) {
    if (x?.areaKey) areaByKey.set(String(x.areaKey).toLowerCase(), x);
    if (x?.sceneName) areaBySceneName.set(String(x.sceneName).toLowerCase(), x);
    if (x?.sceneAssetPath) areaByScenePath.set(String(x.sceneAssetPath).toLowerCase(), x);
  }
  const weatherByAreaKey = new Map();
  for (const x of data.weather || []) if (x?.areaKey) weatherByAreaKey.set(String(x.areaKey).toLowerCase(), x);
  const uiByKey = new Map((data.ui || []).filter(x => x?.uiKey).map(x => [String(x.uiKey), x]));
  return {
    itemById, itemByCleanName, buildMaterialById, buildableById, buildableByPath,
    documentById, documentByPath, areaByKey, areaBySceneName, areaByScenePath,
    weatherByAreaKey, uiByKey
  };
}

export function mediaAssetPath(kind, record, maps) {
  if (kind === 'item') return String(record.iconAssetPath || '');
  if (kind === 'recipe') return String(maps.itemById.get(Number(record.resultItemId))?.iconAssetPath || '');
  if (kind === 'building') return String(record.iconAssetPath || '');
  if (kind === 'crop') return String(maps.itemById.get(Number(record.produceItemId))?.iconAssetPath || '');
  if (kind === 'bait') {
    for (const linked of record.linkedItems || []) {
      const item = maps.itemById.get(Number(linked.id));
      if (item?.iconAssetPath) return String(item.iconAssetPath);
    }
    return '';
  }
  if (kind === 'fishing') {
    const item = maps.itemByCleanName.get(friendlyLabel(record.lootName || record.assetName).toLowerCase());
    return String(item?.iconAssetPath || '');
  }
  if (kind === 'level' || kind === 'area') return String(record.thumbnailAssetPath || record.loadingImageAssetPath || '');
  if (kind === 'ui') return String(record.iconAssetPath || '');
  return '';
}

export function mediaUrl(kind, record, data, maps) {
  const assetPath = mediaAssetPath(kind, record, maps);
  const fileName = data.mediaIndex.get(assetPath);
  return fileName ? `/knowledge/${encodeURIComponent(path.basename(fileName))}` : '';
}

export function makeSlugMap(kind, records) {
  const counts = new Map();
  const map = new Map();
  for (const record of records) {
    const base = slugify(displayName(kind, record));
    const count = (counts.get(base) || 0) + 1;
    counts.set(base, count);
    const slug = count === 1 ? base : `${base}-${count}`;
    map.set(entityKey(kind, record), slug);
  }
  return map;
}

export function copyDir(src, dest) {
  fs.rmSync(dest, { recursive: true, force: true });
  fs.mkdirSync(dest, { recursive: true });
  fs.cpSync(src, dest, { recursive: true });
}
