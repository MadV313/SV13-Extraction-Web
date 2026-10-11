import fs from 'node:fs';
import path from 'node:path';
import {
  loadKnowledge, buildMaps, isPublic, displayName, friendlyLabel, readableIdentifier, rarityLabel,
  buildingContext, makeSlugMap, entityKey, mediaUrl, aliases, escapeHtml, cleanText,
  copyDir, writeJson
} from './knowledge-lib.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const KNOWLEDGE = path.join(ROOT, 'knowledge', 'Latest');
const DIST = path.join(ROOT, 'dist');
const SRC = path.join(ROOT, 'src');
const SITE = 'https://sv13ext.com';
const data = loadKnowledge(KNOWLEDGE);
const maps = buildMaps(data);

const publicData = {
  items: data.items.filter(r => isPublic('item', r)),
  recipes: data.recipes.filter(r => isPublic('recipe', r)),
  buildings: data.buildables.filter(r => isPublic('building', r)),
  crops: data.crops.filter(r => isPublic('crop', r)),
  baits: (data.fishing.baits || []).filter(r => isPublic('bait', r)),
  catches: (data.fishing.loot || []).filter(r => isPublic('fishing', r)),
  documents: data.documents.filter(r => isPublic('document', r)),
  levels: data.levels.filter(r => isPublic('level', r)),
  areas: [],
  weather: [],
  ui: [],
};

const publicLevelScenes = new Set(publicData.levels.map(r => String(r.sceneName || '').toLowerCase()).filter(Boolean));
publicData.areas = data.areas.filter(r => isPublic('area', r) && publicLevelScenes.has(String(r.sceneName || '').toLowerCase()));
publicData.weather = data.weather.filter(r => isPublic('weather', r) && publicLevelScenes.has(String(r.sceneName || '').toLowerCase()));
publicData.ui = data.ui.filter(r => {
  if (!isPublic('ui', r)) return false;
  const scenes = (r.sourceScenes || []).map(x => String(x || '').toLowerCase()).filter(Boolean);
  return scenes.length === 0 || scenes.some(x => publicLevelScenes.has(x));
});

const slugMaps = {
  item: makeSlugMap('item', publicData.items),
  recipe: makeSlugMap('recipe', publicData.recipes),
  building: makeSlugMap('building', publicData.buildings),
  crop: makeSlugMap('crop', publicData.crops),
  bait: makeSlugMap('bait', publicData.baits),
  fishing: makeSlugMap('fishing', publicData.catches),
  document: makeSlugMap('document', publicData.documents),
  level: makeSlugMap('level', publicData.levels),
  weather: makeSlugMap('weather', publicData.weather),
  ui: makeSlugMap('ui', publicData.ui),
};

const itemSlugById = new Map();
for (const item of publicData.items) {
  if (!itemSlugById.has(Number(item.id))) itemSlugById.set(Number(item.id), slugMaps.item.get(entityKey('item', item)));
}
const recipeSlugByResultId = new Map();
for (const r of publicData.recipes) recipeSlugByResultId.set(Number(r.resultItemId), slugMaps.recipe.get(entityKey('recipe', r)));
const buildMaterialById = new Map(data.buildMaterials.map(x => [Number(x.id), x]));
const uiRouteByKey = new Map();
for (const r of publicData.ui) uiRouteByKey.set(String(r.uiKey || ''), `/ui/${slugMaps.ui.get(entityKey('ui', r))}/`);
const weatherRouteByAreaKey = new Map();
for (const r of publicData.weather) weatherRouteByAreaKey.set(String(r.areaKey || '').toLowerCase(), `/weather/${slugMaps.weather.get(entityKey('weather', r))}/`);

function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }
function write(rel, content) { const p = path.join(DIST, rel); ensureDir(path.dirname(p)); fs.writeFileSync(p, content, 'utf8'); }
function urlFor(kind, record) {
  const slug = slugMaps[kind]?.get(entityKey(kind, record));
  if (kind === 'item') return `/items/${slug}/`;
  if (kind === 'recipe') return `/recipes/${slug}/`;
  if (kind === 'building') return `/buildings/${slug}/`;
  if (kind === 'crop') return `/crops/${slug}/`;
  if (kind === 'bait') return `/fishing/bait/${slug}/`;
  if (kind === 'fishing') return `/fishing/catch/${slug}/`;
  if (kind === 'document') return `/codex/${slug}/`;
  if (kind === 'level') return `/maps/${slug}/`;
  if (kind === 'weather') return `/weather/${slug}/`;
  if (kind === 'ui') return `/ui/${slug}/`;
  return '/';
}
function image(kind, record) { return mediaUrl(kind, record, data, maps); }
function imgTag(kind, record, cls = '') {
  const src = image(kind, record);
  return src
    ? `<img${cls ? ` class="${cls}"` : ''} src="${src}" alt="${escapeHtml(displayName(kind, record))}" loading="lazy">`
    : '<div class="placeholder">◈</div>';
}
function activeClass(active, key) { return active === key ? 'active' : ''; }
function layout({ title, description = '', body, active = '', extraHead = '' }) {
  const fullTitle = title === 'SV13 Extraction' ? 'SV13 Extraction — Official Site' : `${title} // SV13 Extraction`;
  const nav = [['/', 'Home', 'home'], ['/game/', 'The Game', 'game'], ['/play/', 'Play', 'play'], ['/database/', 'Survivor Database', 'database'], ['/community/', 'Community', 'community'], ['/news/', 'News', 'news'], ['/tcg/', 'SV13 TCG', 'tcg'], ['/support/', 'Support', 'support']];
  const menu = nav.map(([href, label, key]) => `<a class="${activeClass(active, key)}" href="${href}">${label}</a>`).join('');
  const accountLinks = `<div class="header-actions"><a class="header-login ${active === 'account' ? 'active' : ''}" href="/login/">LOG IN</a><a class="header-register ${active === 'account' ? 'active' : ''}" href="/register/">REGISTER</a><a class="header-play" href="/play/">PLAY NOW ↗</a></div>`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(fullTitle)}</title><meta name="description" content="${escapeHtml(description || 'SV13 Extraction, a survival extraction game with persistent refuge progression.')}"><link rel="canonical" href="${SITE}"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><meta name="theme-color" content="#0c1010"><meta property="og:title" content="${escapeHtml(fullTitle)}"><meta property="og:description" content="${escapeHtml(description || 'SV13 Extraction official game website.')}"><meta property="og:type" content="website"><meta property="og:site_name" content="SV13 Extraction"><link rel="stylesheet" href="/site.css">${extraHead}</head><body><div class="site-shell"><a class="skip-link" href="#main">Skip to content</a><header class="site-header"><div class="header-inner"><a class="brand" href="/"><div class="brand-mark">13</div><div class="brand-copy"><strong>SV13 EXTRACTION</strong><span>Official Survivor Network</span></div></a><nav class="nav" id="primary-nav" aria-label="Main navigation">${menu}</nav>${accountLinks}<button class="mobile-toggle" data-mobile-toggle aria-label="Toggle navigation" aria-expanded="false" aria-controls="primary-nav">☰</button></div></header><main id="main">${body}</main><footer class="footer"><div class="footer-inner"><span>© ${new Date().getUTCFullYear()} SV13 Extraction • Official Survivor Network</span><span><a href="/about/">About</a> · <a href="/database/">Field Manual</a> · <a href="/account/">Accounts</a> · <a href="/support/">Support</a> · <a href="/privacy/">Privacy</a> · <a href="/knowledge/manifest.json">Knowledge Manifest</a></span></div></footer></div><script type="module" src="/site.js"></script></body></html>`;
}
function breadcrumbs(parts) { return `<div class="breadcrumbs"><a href="/">Survivor Database</a> ${parts.map(p => `/ ${p.href ? `<a href="${p.href}">${escapeHtml(p.label)}</a>` : escapeHtml(p.label)}`).join(' ')}</div>`; }
function chip(text, cls = '') { return text ? `<span class="chip ${cls}">${escapeHtml(text)}</span>` : ''; }
function entityCard(kind, record, subtitle = '', chips = []) {
  const name = displayName(kind, record);
  const category = friendlyLabel(record.categoryName || record.category || record.documentType || record.lootTier || record.baitTier || '');
  return `<a class="entity-card" data-filter-card data-search="${escapeHtml([name, subtitle, ...aliases(kind, record)].join(' ').toLowerCase())}" data-category="${escapeHtml(category.toLowerCase())}" href="${urlFor(kind, record)}"><div class="entity-image">${imgTag(kind, record)}</div><div class="entity-body"><h3>${escapeHtml(name)}</h3>${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ''}<div class="chips">${chips.map(c => chip(c.text, c.cls)).join('')}</div></div></a>`;
}
function meta(label, value) { return value !== '' && value != null ? `<div class="meta"><strong>${escapeHtml(label)}</strong><span>${escapeHtml(value)}</span></div>` : ''; }
function detailTop(kind, record, kicker, description, metaHtml = '') {
  const name = displayName(kind, record);
  return `${breadcrumbs([{ href: indexHref(kind), label: indexLabel(kind) }, { label: name }])}<div class="detail-hero"><div class="detail-art">${imgTag(kind, record)}</div><div class="detail-copy"><div class="kicker">${escapeHtml(kicker)}</div><h1>${escapeHtml(name)}</h1>${description ? `<div class="description">${escapeHtml(description)}</div>` : ''}${metaHtml ? `<div class="meta-grid">${metaHtml}</div>` : ''}</div></div>`;
}
function indexHref(kind) {
  return kind === 'item' ? '/items/' : kind === 'recipe' ? '/recipes/' : kind === 'building' ? '/buildings/' : kind === 'crop' ? '/crops/' : kind === 'document' ? '/codex/' : kind === 'level' ? '/maps/' : kind === 'weather' ? '/weather/' : kind === 'ui' ? '/ui/' : '/fishing/';
}
function indexLabel(kind) {
  return kind === 'item' ? 'Items' : kind === 'recipe' ? 'Crafting' : kind === 'building' ? 'Construction' : kind === 'crop' ? 'Crops' : kind === 'document' ? 'Codex' : kind === 'level' ? 'Maps' : kind === 'weather' ? 'Weather & Survival' : kind === 'ui' ? 'HUD & Icon Guide' : 'Fishing';
}
function pageHead(title, lead, kicker = 'Survivor Database') { return `<div class="kicker">${escapeHtml(kicker)}</div><h1 class="page-title">${escapeHtml(title)}</h1><p class="page-lead">${escapeHtml(lead)}</p>`; }
function dataSection(title, inner) { return `<section class="data-section"><h2>${escapeHtml(title)}</h2><div class="data-content">${inner}</div></section>`; }
function linked(url, name, detail = '') { return `<a class="linked" href="${url}"><span>${escapeHtml(name)}${detail ? `<small>${escapeHtml(detail)}</small>` : ''}</span><span>→</span></a>`; }
function searchLink(name) { return `/search/?q=${encodeURIComponent(name)}`; }
function chipsHtml(values, cls = '') { return `<div class="activity-chips">${(values || []).filter(Boolean).map(x => chip(readableIdentifier(x), cls)).join('')}</div>`; }
function rowsHtml(rows) { return `<div class="rows">${rows.filter(x => x && x[1] !== '' && x[1] != null).map(([label, value]) => `<div class="row"><span class="label">${escapeHtml(label)}</span><span>${escapeHtml(value)}</span></div>`).join('')}</div>`; }
function pct(value) { const n = Number(value); return Number.isFinite(n) ? `${Math.round(n * 100)}%` : String(value || ''); }
function temp(value) { const n = Number(value); return Number.isFinite(n) ? `${Number(n.toFixed(2))}°C` : String(value || ''); }
function seconds(value) { const n = Number(value); return Number.isFinite(n) ? `${Number(n.toFixed(2))} sec` : String(value || ''); }

function areaForLevel(level) {
  return maps.areaBySceneName.get(String(level.sceneName || '').toLowerCase()) || maps.areaByScenePath.get(String(level.sceneAssetPath || '').toLowerCase()) || null;
}
function levelForScene(sceneName) { return publicData.levels.find(x => String(x.sceneName || '').toLowerCase() === String(sceneName || '').toLowerCase()) || null; }
function weatherForArea(area) { return area?.areaKey ? maps.weatherByAreaKey.get(String(area.areaKey).toLowerCase()) || null : null; }
function routeForBuildableRef(ref) {
  const byPath = maps.buildableByPath.get(String(ref?.assetPath || '').toLowerCase());
  const byId = maps.buildableById.get(Number(ref?.numericId));
  const record = byPath || byId;
  return record && slugMaps.building.has(entityKey('building', record)) ? urlFor('building', record) : searchLink(readableIdentifier(ref?.name || 'Buildable'));
}
function routeForDocumentRef(ref) {
  const byPath = maps.documentByPath.get(String(ref?.assetPath || '').toLowerCase());
  const byId = maps.documentById.get(String(ref?.id || '').toLowerCase());
  const record = byPath || byId;
  return record && slugMaps.document.has(entityKey('document', record)) ? urlFor('document', record) : searchLink(ref?.name || ref?.id || 'Document');
}
function weatherFact(record, sourceType, keySuffix) {
  const suffix = String(keySuffix || '').toLowerCase();
  return (record?.facts || []).find(f => String(f?.sourceType || '') === sourceType && String(f?.key || '').toLowerCase().endsWith(suffix)) || null;
}
function factValue(record, sourceType, keySuffix) { return weatherFact(record, sourceType, keySuffix)?.value ?? ''; }
function groupedFacts(record, sourceType) {
  const groups = new Map();
  for (const f of record?.facts || []) {
    if (String(f?.sourceType || '') !== sourceType) continue;
    const key = String(f.hierarchyPath || 'System');
    if (!groups.has(key)) groups.set(key, new Map());
    groups.get(key).set(String(f.label || ''), String(f.value ?? ''));
  }
  return groups;
}
function shortHierarchy(value) {
  const parts = String(value || '').split('/').filter(Boolean);
  return parts.slice(Math.max(0, parts.length - 3)).map(readableIdentifier).join(' / ');
}
function evidenceExplanation(kind) {
  if (kind === 'RenderedImage') return 'Captured directly from a rendered Unity UI Image.';
  if (kind === 'RenderedRawImage') return 'Captured directly from a rendered Unity RawImage.';
  if (kind === 'ScriptIconReference') return 'Trusted icon/sprite field referenced by project-authored UI logic.';
  if (kind === 'VisibleText') return 'Player-visible text captured from the interface.';
  return kind ? `Captured UI evidence: ${kind}.` : 'Captured player-facing UI evidence.';
}

function itemDescription(r) { return cleanText(r.longDescription || r.description || 'No field notes available.'); }
function itemCard(r) { return entityCard('item', r, itemDescription(r).slice(0, 110), [{ text: friendlyLabel(r.categoryName) }, { text: rarityLabel(r.rarityName), cls: 'amber' }]); }
function fmt(n) { const x = Number(n || 0); return Number.isInteger(x) ? String(x) : String(Number(x.toFixed(2))); }
function recipeCard(r) { return entityCard('recipe', r, `${friendlyLabel(r.requiredStation) || 'Generic'} • ${fmt(r.craftDuration)}s`, [{ text: `× ${r.craftAmount || 1}`, cls: 'steel' }]); }
function buildingCard(r) { return entityCard('building', r, buildingContext(r), [{ text: friendlyLabel(r.categoryName) }, { text: (r.requirements || []).length ? `${(r.requirements || []).length} materials` : 'No material list', cls: 'amber' }]); }
function cropCard(r) { return entityCard('crop', r, `${friendlyLabel(r.seedItemName)} → ${friendlyLabel(r.produceItemName)}`, [{ text: `Yield ${r.minYield || 0}–${r.maxYield || 0}` }, { text: `${fmt(r.hoursPerStage)}h / stage`, cls: 'amber' }]); }
function baitCard(r) { return entityCard('bait', r, r.description || 'Fishing bait', [{ text: friendlyLabel(r.baitTier) }]); }
function catchCard(r) { return entityCard('fishing', r, r.description || 'Fishing catch', [{ text: friendlyLabel(r.lootTier) }, { text: friendlyLabel(r.lootType), cls: 'steel' }]); }
function documentCard(r) { return entityCard('document', r, (r.pages?.[0] || 'Recovered field document').replace(/\s+/g, ' ').slice(0, 120), [{ text: friendlyLabel(r.documentType) }, { text: r.xpReward ? `${r.xpReward} XP` : '', cls: 'amber' }]); }
function levelCard(r) {
  const area = areaForLevel(r);
  return entityCard('level', r, r.description || 'Area intelligence', [{ text: area?.hasSceneCapture ? 'Captured scene intel' : 'Level definition', cls: area?.hasSceneCapture ? 'amber' : 'steel' }, { text: area?.hasSceneCapture ? `${(area.activities || []).length} activities` : '' }]);
}
function uiCard(r) { return entityCard('ui', r, cleanText(r.meaning || r.importance || 'Player-facing interface element.').slice(0, 130), [{ text: friendlyLabel(r.category) }, { text: r.iconAuthoritative ? 'Authoritative icon' : (r.visibleLabels || []).length ? 'Visible text' : friendlyLabel(r.iconEvidenceKind), cls: 'steel' }]); }
function weatherCard(r) {
  const level = levelForScene(r.sceneName);
  const name = `${displayName('weather', r)} Weather`;
  const src = level ? image('level', level) : '';
  return `<a class="entity-card" data-filter-card data-search="${escapeHtml([name, ...(r.scheduledWeatherTypes || []), ...(r.supportedHazardTypes || [])].join(' ').toLowerCase())}" data-category="weather" href="${urlFor('weather', r)}"><div class="entity-image">${src ? `<img src="${src}" alt="${escapeHtml(name)}" loading="lazy">` : '<div class="placeholder">☁</div>'}</div><div class="entity-body"><h3>${escapeHtml(name)}</h3><p>${escapeHtml((r.scheduledWeatherTypes || []).join(' • ') || 'Environmental profile')}</p><div class="chips">${chip(r.hasPlayerExposureModel ? 'Player exposure' : 'Weather', 'amber')}${chip(`${(r.facts || []).length} facts`, 'steel')}</div></div></a>`;
}

const routes = new Set();
function writePage(route, html) {
  let rel;
  if (route === '/') rel = 'index.html';
  else rel = path.join(route.replace(/^\//, '').replace(/\/$/, ''), 'index.html');
  write(rel, html);
  routes.add(route);
}
function canonicalLayout(opts, route) {
  let html = layout(opts);
  html = html.replace(`<link rel="canonical" href="${SITE}">`, `<link rel="canonical" href="${SITE}${route === '/' ? '' : route}">`);
  return html;
}
function detailPage(route, opts) { writePage(route, canonicalLayout(opts, route)); }

fs.rmSync(DIST, { recursive: true, force: true });
ensureDir(DIST);
copyDir(KNOWLEDGE, path.join(DIST, 'knowledge'));
fs.copyFileSync(path.join(SRC, 'site.css'), path.join(DIST, 'site.css'));
fs.copyFileSync(path.join(SRC, 'site.js'), path.join(DIST, 'site.js'));
fs.copyFileSync(path.join(SRC, 'favicon.svg'), path.join(DIST, 'favicon.svg'));
if (fs.existsSync(path.join(SRC, 'official-art'))) copyDir(path.join(SRC, 'official-art'), path.join(DIST, 'official-art'));

const counts = {
  items: publicData.items.length,
  recipes: publicData.recipes.length,
  buildings: publicData.buildings.length,
  crops: publicData.crops.length,
  fishing: publicData.baits.length + publicData.catches.length,
  documents: publicData.documents.length,
  maps: publicData.levels.length,
  areas: publicData.areas.length,
  capturedAreas: publicData.areas.filter(x => x.hasSceneCapture).length,
  weather: publicData.weather.length,
  ui: publicData.ui.length,
  media: data.mediaIndex.size
};

// Official site pages are authored separately; all previous whole-site routes remain intact.
import { sitePages, siteSearchEntries } from '../src/official-pages.mjs';
for (const page of sitePages({ counts, packageVersion: data.manifest.packageVersion })) {
  writePage(page.route, canonicalLayout({ title: page.title, description: page.description, body: page.body, active: page.active }, page.route));
}

function listingPage({ route, title, lead, active, records, card, categoryOptions = [] }) {
  const categorySelect = categoryOptions.length ? `<select data-grid-category aria-label="Filter category"><option value="all">All categories</option>${categoryOptions.map(x => `<option value="${escapeHtml(x.toLowerCase())}">${escapeHtml(x)}</option>`).join('')}</select>` : '';
  const body = `<div class="container">${breadcrumbs([{ label: title }])}${pageHead(title, lead)}<div class="toolbar"><input class="filter-input" data-grid-filter="[data-filter-card]" placeholder="Filter this index…">${categorySelect}<span class="result-count" data-grid-count></span></div><div class="grid">${records.map(card).join('')}</div></div>`;
  writePage(route, canonicalLayout({ title, description: lead, body, active }, route));
}

const itemCategories = [...new Set(publicData.items.map(r => friendlyLabel(r.categoryName)).filter(Boolean))].sort((a, b) => a.localeCompare(b));
listingPage({ route: '/items/', title: 'Item Index', lead: 'Search current gear, weapons, clothing, supplies and resources exported from SV13.', active: 'database', records: publicData.items.sort((a, b) => displayName('item', a).localeCompare(displayName('item', b))), card: itemCard, categoryOptions: itemCategories });
listingPage({ route: '/recipes/', title: 'Crafting Manual', lead: 'Confirmed recipes with actual Unity ingredient requirements and crafting stations.', active: 'database', records: publicData.recipes.sort((a, b) => displayName('recipe', a).localeCompare(displayName('recipe', b))), card: recipeCard });
listingPage({ route: '/buildings/', title: 'Construction Manual', lead: 'Buildable definitions, material costs, assembly requirements and Player Cabin upgrades.', active: 'database', records: publicData.buildings.sort((a, b) => displayName('building', a).localeCompare(displayName('building', b))), card: buildingCard, categoryOptions: [...new Set(publicData.buildings.map(r => buildingContext(r)).filter(Boolean))].sort() });
listingPage({ route: '/crops/', title: "Grower's Field Notes", lead: 'Current seed, produce, yield, water, temperature and crop timing data.', active: 'database', records: publicData.crops.sort((a, b) => displayName('crop', a).localeCompare(displayName('crop', b))), card: cropCard });

const fishingBody = `<div class="container">${breadcrumbs([{ label: 'Fishing' }])}${pageHead('Fishing Guide', 'Bait and catch intelligence exported from the current SV13 data package.', 'Field Guide')}<div class="section-head"><div><h2>Bait</h2><p>Current public bait definitions.</p></div></div>${publicData.baits.length ? `<div class="grid three">${publicData.baits.map(baitCard).join('')}</div>` : '<div class="empty">No public bait records are currently confirmed.</div>'}<div class="section-head"><div><h2>Catches</h2><p>Confirmed fishing loot records.</p></div></div>${publicData.catches.length ? `<div class="grid three">${publicData.catches.map(catchCard).join('')}</div>` : '<div class="empty">No public catch records are currently confirmed.</div>'}</div>`;
writePage('/fishing/', canonicalLayout({ title: 'Fishing Guide', description: 'SV13 fishing bait and catch intelligence.', body: fishingBody, active: 'database' }, '/fishing/'));
listingPage({ route: '/maps/', title: 'Area Intel', lead: 'Known map definitions enriched with captured activities, upgrades, documents, weather and special systems when a scene intelligence capture is available.', active: 'database', records: publicData.levels.sort((a, b) => displayName('level', a).localeCompare(displayName('level', b))), card: levelCard });
listingPage({ route: '/codex/', title: 'Recovered Intel', lead: 'Recovered documents and field notes exported directly from SV13.', active: 'database', records: publicData.documents.sort((a, b) => displayName('document', a).localeCompare(displayName('document', b))), card: documentCard, categoryOptions: [...new Set(publicData.documents.map(r => friendlyLabel(r.documentType)).filter(Boolean))].sort() });
listingPage({ route: '/weather/', title: 'Weather & Survival', lead: 'Player-facing weather schedules, temperature pressure, stamina/health effects, shelter behavior and supported hazard warnings from captured SV13 systems.', active: 'database', records: publicData.weather.sort((a, b) => displayName('weather', a).localeCompare(displayName('weather', b))), card: weatherCard });
const uiCategories = [...new Set(publicData.ui.map(r => friendlyLabel(r.category)).filter(Boolean))].sort((a, b) => a.localeCompare(b));
listingPage({ route: '/ui/', title: 'HUD & Icon Guide', lead: 'Learn what captured SV13 HUD icons, warnings, markers, prompts and interface labels represent and why they matter.', active: 'database', records: publicData.ui.sort((a, b) => displayName('ui', a).localeCompare(displayName('ui', b))), card: uiCard, categoryOptions: uiCategories });

const searchBody = `<div class="container narrow">${breadcrumbs([{ label: 'Search' }])}${pageHead('Global Search', 'Search all public Survivor Database records.', 'Knowledge Uplink')}<div class="toolbar"><input class="search-page-input" data-search-page placeholder="Search the database…"><select data-search-kind><option value="all">All intel</option><option value="item">Items</option><option value="recipe">Recipes</option><option value="building">Construction</option><option value="crop">Crops</option><option value="bait">Bait</option><option value="fishing">Catches</option><option value="level">Maps</option><option value="weather">Weather</option><option value="ui">HUD / Icons</option><option value="document">Codex</option><option value="site">Official Website</option></select><span class="result-count" data-search-count></span></div><div class="search-results" data-search-results></div></div>`;
writePage('/search/', canonicalLayout({ title: 'Search', description: 'Search the SV13 Extraction Survivor Database.', body: searchBody, active: 'database' }, '/search/'));

for (const r of publicData.items) {
  const name = displayName('item', r), recipeSlug = recipeSlugByResultId.get(Number(r.id));
  let sections = '';
  if (recipeSlug) sections += dataSection('Crafting', linked(`/recipes/${recipeSlug}/`, `${name} recipe`, 'Confirmed crafting requirements'));
  const body = `<div class="container">${detailTop('item', r, 'Survivor Database', itemDescription(r), meta('Category', friendlyLabel(r.categoryName) || 'Unclassified') + meta('Rarity', rarityLabel(r.rarityName)) + meta('Weight', fmt(r.weight)) + meta('Stack', String(r.stackSize || 1)))}${sections}<p class="audit-note">Player-facing presentation is cleaned for readability. Raw Unity identifiers remain available in the machine-readable knowledge package.</p></div>`;
  const route = urlFor('item', r);
  detailPage(route, { title: name, description: itemDescription(r), body, active: 'database' });
}

for (const r of publicData.recipes) {
  const name = displayName('recipe', r);
  const resultSlug = itemSlugById.get(Number(r.resultItemId));
  const reqs = (r.requirements || []).map(req => {
    const slug = itemSlugById.get(Number(req.itemId));
    const n = friendlyLabel(req.itemName) || 'Unknown Item';
    return slug ? linked(`/items/${slug}/`, n, `× ${req.amount || 0}`) : linked(searchLink(n), n, `× ${req.amount || 0}${req.resolved ? '' : ' • unresolved'}`);
  }).join('');
  const body = `<div class="container">${detailTop('recipe', r, 'Crafting Manual', 'Current crafting requirements exported directly from SV13.', meta('Station', friendlyLabel(r.requiredStation) || 'Generic') + meta('Craft time', `${fmt(r.craftDuration)}s`) + meta('Output', `× ${r.craftAmount || 1}`) + (Number(r.craftLevel || 0) > 0 ? meta('Level', String(r.craftLevel)) : ''))}${dataSection('Requirements', reqs || '<div class="empty">No confirmed ingredients.</div>')}${resultSlug ? dataSection('Result', linked(`/items/${resultSlug}/`, name, 'Open item record')) : ''}</div>`;
  const route = urlFor('recipe', r);
  detailPage(route, { title: `Craft ${name}`, description: `Crafting recipe for ${name} in SV13 Extraction.`, body, active: 'database' });
}

for (const r of publicData.buildings) {
  const name = displayName('building', r), context = buildingContext(r);
  const reqs = (r.requirements || []).map(req => {
    const mat = buildMaterialById.get(Number(req.buildMaterialId));
    let target = '';
    if (mat?.itemDefinitions?.length) {
      const id = Number(mat.itemDefinitions[0].id);
      const slug = itemSlugById.get(id);
      if (slug) target = `/items/${slug}/`;
    }
    const n = friendlyLabel(req.buildMaterialName) || 'Unknown Material';
    return linked(target || searchLink(n), n, `× ${req.requiredAmount || 0}`);
  }).join('');
  const gate = r.assemblyGate || {};
  const assembly = gate.found ? `<div class="rows"><div class="row"><span class="label">Required tool</span><span>${escapeHtml(friendlyLabel(gate.requiredToolDisplayName || gate.requiredToolName) || 'Tool')}</span></div><div class="row"><span class="label">Assembly time</span><span>${escapeHtml(fmt(gate.assemblyDuration))}s</span></div>${gate.useToolDurability ? '<div class="row"><span class="label">Tool wear</span><span>Uses tool durability</span></div>' : ''}</div>` : '<div class="empty">No assembly gate is exported for this definition.</div>';
  const body = `<div class="container">${detailTop('building', r, 'Construction Manual', cleanText(r.description || 'Construction definition.'), meta('Type', context) + meta('Category', friendlyLabel(r.categoryName) || 'Construction') + meta('Materials', String((r.requirements || []).length)))}${dataSection('Materials', reqs || '<div class="empty">No construction requirements are currently listed.</div>')}${dataSection('Assembly', assembly)}</div>`;
  const route = urlFor('building', r);
  detailPage(route, { title: name, description: cleanText(r.description || `${context} in SV13 Extraction.`), body, active: 'database' });
}

for (const r of publicData.crops) {
  const name = displayName('crop', r);
  const seedSlug = itemSlugById.get(Number(r.seedItemId)), produceSlug = itemSlugById.get(Number(r.produceItemId));
  const linkedRows = `<div class="linked-list">${seedSlug ? linked(`/items/${seedSlug}/`, friendlyLabel(r.seedItemName), 'Seed item') : linked(searchLink(friendlyLabel(r.seedItemName)), friendlyLabel(r.seedItemName), 'Seed item')}${produceSlug ? linked(`/items/${produceSlug}/`, friendlyLabel(r.produceItemName), 'Harvested produce') : linked(searchLink(friendlyLabel(r.produceItemName)), friendlyLabel(r.produceItemName), 'Harvested produce')}</div>`;
  const climate = `<div class="rows"><div class="row"><span class="label">Cold slow</span><span>${fmt(r.coldSlowTempC)}°C</span></div><div class="row"><span class="label">Cold kill</span><span>${fmt(r.coldKillTempC)}°C</span></div><div class="row"><span class="label">Heat kill</span><span>${fmt(r.heatKillTempC)}°C</span></div><div class="row"><span class="label">Slow multiplier</span><span>${fmt(r.slowMultiplier)}×</span></div></div>`;
  const body = `<div class="container">${detailTop('crop', r, "Grower's Field Note", `${friendlyLabel(r.seedItemName)} grows into ${friendlyLabel(r.produceItemName)}.`, meta('Yield', `${r.minYield || 0}–${r.maxYield || 0}`) + meta('Stage time', `${fmt(r.hoursPerStage)} h`) + meta('Water / stage', String(r.waterPerStage || 0)) + meta('Rot after mature', `${fmt(r.hoursUntilRotAfterMature)} h`))}${dataSection('Seed & Produce', linkedRows)}${dataSection('Temperature', climate)}</div>`;
  const route = urlFor('crop', r);
  detailPage(route, { title: name, description: `Growing guide for ${name} in SV13 Extraction.`, body, active: 'database' });
}

for (const r of publicData.baits) {
  const name = displayName('bait', r);
  const links = (r.linkedItems || []).map(x => {
    const slug = itemSlugById.get(Number(x.id));
    const n = friendlyLabel(x.name || x.id);
    return linked(slug ? `/items/${slug}/` : searchLink(n), n, 'Linked inventory item');
  }).join('');
  const body = `<div class="container">${detailTop('bait', r, 'Fishing Guide', cleanText(r.description || 'Fishing bait.'), meta('Tier', friendlyLabel(r.baitTier) || 'Unknown'))}${links ? dataSection('Linked Items', `<div class="linked-list">${links}</div>`) : ''}</div>`;
  const route = urlFor('bait', r);
  detailPage(route, { title: name, description: cleanText(r.description || 'Fishing bait in SV13 Extraction.'), body, active: 'database' });
}
for (const r of publicData.catches) {
  const name = displayName('fishing', r);
  const item = maps.itemByCleanName.get(name.toLowerCase());
  const itemSlug = item ? itemSlugById.get(Number(item.id)) : null;
  const body = `<div class="container">${detailTop('fishing', r, 'Fishing Guide', cleanText(r.description || 'Fishing catch.'), meta('Tier', friendlyLabel(r.lootTier) || 'Unknown') + meta('Type', friendlyLabel(r.lootType) || 'Unknown') + meta('Weight', `${fmt(r.minWeight)}–${fmt(r.maxWeight)}`))}${itemSlug ? dataSection('Inventory Record', linked(`/items/${itemSlug}/`, name, 'Open item record')) : ''}</div>`;
  const route = urlFor('fishing', r);
  detailPage(route, { title: name, description: cleanText(r.description || 'Fishing catch in SV13 Extraction.'), body, active: 'database' });
}

for (const r of publicData.levels) {
  const name = displayName('level', r);
  const desc = cleanText(r.description || 'Current area intelligence.');
  const area = areaForLevel(r);
  const weather = weatherForArea(area);
  let sections = '';

  if (area?.hasSceneCapture) {
    sections += dataSection('What You Can Do Here', chipsHtml(area.activities || []));

    if ((area.upgrades || []).length) {
      const upgrades = (area.upgrades || []).map(u => {
        const buildLinks = (u.buildables || []).map(b => `<a href="${routeForBuildableRef(b)}">${escapeHtml(readableIdentifier(b.name))}</a>`).join(' · ');
        return `<article class="intel-card"><div class="kicker">PLAYER CABIN UPGRADE</div><h3>${escapeHtml(readableIdentifier(u.name))}</h3><p>${escapeHtml(u.summary || '')}</p>${chipsHtml(u.capabilities || [])}${buildLinks ? `<div class="intel-links">${buildLinks}</div>` : ''}</article>`;
      }).join('');
      sections += dataSection('Boren Upgrades', `<div class="intel-grid">${upgrades}</div>`);
    }

    if ((area.specialFeatures || []).length) {
      const features = (area.specialFeatures || []).map(f => {
        const uiLinks = (f.uiKeys || []).map(key => ({ key, route: uiRouteByKey.get(String(key)), record: maps.uiByKey.get(String(key)) })).filter(x => x.route && x.record).slice(0, 10);
        return `<article class="intel-card feature-card"><div class="kicker">SPECIAL SYSTEM</div><h3>${escapeHtml(readableIdentifier(f.name))}</h3><p>${escapeHtml(f.summary || '')}</p>${chipsHtml(f.capabilities || [])}${uiLinks.length ? `<div class="mini-link-grid">${uiLinks.map(x => linked(x.route, displayName('ui', x.record), friendlyLabel(x.record.category))).join('')}</div>` : ''}</article>`;
      }).join('');
      sections += dataSection('Special Features', `<div class="intel-grid">${features}</div>`);
    }

    if ((area.documents || []).length) {
      sections += dataSection('Recovered Intel In This Area', `<div class="linked-list">${(area.documents || []).map(d => linked(routeForDocumentRef(d), d.name || d.id, d.id || 'Found document')).join('')}</div>`);
    }

    if ((area.buildables || []).length) {
      sections += dataSection('Buildables & Stations Found Here', `<div class="linked-list">${(area.buildables || []).map(b => linked(routeForBuildableRef(b), readableIdentifier(b.name), b.evidence || 'Scene reference')).join('')}</div>`);
    }

    if (weather) {
      const weatherRoute = weatherRouteByAreaKey.get(String(area.areaKey || '').toLowerCase());
      sections += dataSection('Weather & Survival', `<div class="callout"><strong>${escapeHtml((weather.scheduledWeatherTypes || []).join(', ') || 'Environmental systems detected')}</strong><br>${escapeHtml('This area has captured player exposure, shelter and weather behavior.')}${weatherRoute ? ` <a class="text-link" href="${weatherRoute}">Open the full weather guide →</a>` : ''}</div>`);
    }

    if ((area.uiKeys || []).length) {
      sections += dataSection('Interface Guide', `<div class="callout">This scene has ${escapeHtml(String(area.uiKeys.length))} linked HUD/interface records. <a class="text-link" href="/ui/?q=${encodeURIComponent(name)}">Browse related HUD & icon intel →</a></div>`);
    }
  } else {
    sections += dataSection('Scene Intelligence', '<div class="empty">This level definition is public, but its full Edit/Play scene intelligence capture has not been completed yet. Activities, systems, weather and local content will appear here after that scene is scanned.</div>');
  }

  const status = area?.hasSceneCapture ? `Captured ${area.captureWasPlayMode ? 'runtime-aware' : 'Edit Mode'}` : 'Level definition only';
  const body = `<div class="container">${detailTop('level', r, 'Area Intel', desc, meta('Status', status) + meta('Activities', area?.hasSceneCapture ? String((area.activities || []).length) : 'Pending capture') + meta('Upgrades', area?.hasSceneCapture ? String((area.upgrades || []).length) : 'Pending capture'))}${sections}</div>`;
  const route = urlFor('level', r);
  detailPage(route, { title: name, description: desc, body, active: 'database' });
}

for (const r of publicData.weather) {
  const areaName = displayName('weather', r);
  const level = levelForScene(r.sceneName);
  const levelRoute = level ? urlFor('level', level) : '/maps/';
  const playerRows = [
    ['Neutral ambient temperature', temp(factValue(r, 'SV13PlayerTemperature', 'neutralAmbientTempC'))],
    ['Maximum cold reference', temp(factValue(r, 'SV13PlayerTemperature', 'maxColdAmbientTempC'))],
    ['Maximum heat reference', temp(factValue(r, 'SV13PlayerTemperature', 'maxHeatAmbientTempC'))],
    ['Stamina drain begins', pct(factValue(r, 'SV13PlayerTemperature', 'staminaDrainStartsAtColdSeverity')) + ' cold severity'],
    ['Maximum stamina drain', `${factValue(r, 'SV13PlayerTemperature', 'maxStaminaDrainPerSecond')} / sec`],
    ['Minimum stamina regen at max cold', pct(factValue(r, 'SV13PlayerTemperature', 'minStaminaRegenMultiplierAtMaxCold'))],
    ['Health drain begins', pct(factValue(r, 'SV13PlayerTemperature', 'healthDrainStartsAtColdSeverity')) + ' cold severity'],
    ['Maximum health drain', `${factValue(r, 'SV13PlayerTemperature', 'maxHealthDrainPerSecond')} / sec`],
    ['Freezing grace period', seconds(factValue(r, 'SV13PlayerTemperature', 'freezingGraceSeconds'))],
    ['Freezing damage ramp', seconds(factValue(r, 'SV13PlayerTemperature', 'freezingRampSeconds'))],
    ['Maximum effective cold protection', pct(factValue(r, 'SV13PlayerTemperature', '_maxEffectiveColdProtection'))],
    ['Maximum effective heat protection', pct(factValue(r, 'SV13PlayerTemperature', '_maxEffectiveHeatProtection'))],
  ];
  const scheduleRows = [
    ['Rain configured chance', pct(factValue(r, 'SV13CabinWeatherCycle', 'rainChance'))],
    ['Thunderstorm configured chance', pct(factValue(r, 'SV13CabinWeatherCycle', 'thunderChance'))],
    ['Light snow configured chance', pct(factValue(r, 'SV13CabinWeatherCycle', 'lightSnowChance'))],
    ['Heavy snow configured chance', pct(factValue(r, 'SV13CabinWeatherCycle', 'heavySnowChance'))],
    ['Blizzard configured chance', pct(factValue(r, 'SV13CabinWeatherCycle', 'blizzardChance'))],
    ['Storm duration range', `${factValue(r, 'SV13CabinWeatherCycle', 'minDurationHours')}–${factValue(r, 'SV13CabinWeatherCycle', 'maxDurationHours')} in-game hours`],
    ['Warning lead', `${factValue(r, 'SV13CabinWeatherCycle', 'warningLeadHours')} in-game hour(s)`],
  ];
  const tempDeltaRows = [
    ['Rain temperature change', temp(factValue(r, 'SV13WeatherManager', 'rainTempDeltaC'))],
    ['Thunderstorm temperature change', temp(factValue(r, 'SV13WeatherManager', 'thunderTempDeltaC'))],
    ['Snow temperature change', temp(factValue(r, 'SV13WeatherManager', 'snowTempDeltaC'))],
    ['Heavy snow temperature change', temp(factValue(r, 'SV13WeatherManager', 'heavySnowTempDeltaC'))],
    ['Blizzard temperature change', temp(factValue(r, 'SV13WeatherManager', 'blizzardTempDeltaC'))],
    ['Sandstorm temperature change', temp(factValue(r, 'SV13WeatherManager', 'sandTempDeltaC'))],
  ];

  const shelterGroups = groupedFacts(r, 'SV13ShelterVolume');
  const shelterCards = [...shelterGroups.entries()].map(([hierarchy, facts]) => `<article class="intel-card"><h3>${escapeHtml(shortHierarchy(hierarchy))}</h3>${rowsHtml([
    ['Weather effects suppressed', facts.get('Suppress Player Weather Effects') || ''],
    ['Temperature bonus', facts.has('Temperature Bonus C') ? `${facts.get('Temperature Bonus C')}°C` : ''],
    ['Wind protection', facts.has('Wind Protection 01') ? pct(facts.get('Wind Protection 01')) : ''],
  ])}</article>`).join('');

  const warningPrefixes = [['blizzard', 'Blizzard'], ['thunder', 'Thunderstorm'], ['radiation', 'Radiation Storm'], ['sand', 'Sandstorm']];
  const warningCards = warningPrefixes.map(([prefix, label]) => {
    const title = factValue(r, 'SV13StormWarningUI', `${prefix}Title`);
    const body = factValue(r, 'SV13StormWarningUI', `${prefix}Body`);
    if (!title && !body) return '';
    return `<article class="warning-card"><div class="kicker">${escapeHtml(label)}</div><h3>${escapeHtml(title || label)}</h3><p>${escapeHtml(body)}</p></article>`;
  }).join('');

  const pondRows = [
    ['Maximum walkable temperature', temp(factValue(r, 'SV13PondFreezeController', 'maximumWalkableTemperatureC'))],
    ['Deep-cold threshold', temp(factValue(r, 'SV13PondFreezeController', 'deepColdC'))],
    ['Deep-cold freeze speed multiplier', `${factValue(r, 'SV13PondFreezeController', 'deepColdFreezeSpeedMultiplier')}×`],
  ];

  const body = `<div class="container">${breadcrumbs([{ href: '/weather/', label: 'Weather & Survival' }, { label: areaName }])}${pageHead(`${areaName} Weather & Survival`, 'Player-facing environmental behavior captured from the actual SV13 scene and runtime player systems.', 'Environment Intel')}<div class="meta-grid">${meta('Scheduled weather', String((r.scheduledWeatherTypes || []).length))}${meta('Supported hazards', String((r.supportedHazardTypes || []).length))}${meta('Captured facts', String((r.facts || []).length))}</div>${dataSection('Weather That Can Occur Here', `${chipsHtml(r.scheduledWeatherTypes || [], 'amber')}<p class="section-note">Supported hazard UI may include additional storm types that are not scheduled in this area.</p>${chipsHtml(r.supportedHazardTypes || [], 'steel')}`)}${dataSection('Player Temperature, Stamina & Health', rowsHtml(playerRows))}${dataSection('Storm Schedule', rowsHtml(scheduleRows))}${dataSection('Weather Temperature Effects', rowsHtml(tempDeltaRows))}${shelterCards ? dataSection('Shelter Protection', `<div class="intel-grid">${shelterCards}</div>`) : ''}${warningCards ? dataSection('Hazard Warnings & Player Guidance', `<div class="intel-grid">${warningCards}</div>`) : ''}${dataSection('Frozen Pond Behavior', rowsHtml(pondRows))}${dataSection('Related Area', linked(levelRoute, areaName, 'Open full map / activity intelligence'))}<p class="audit-note">Values shown here are exported configuration from SV13 systems. Runtime-state fields are not presented as permanent rules.</p></div>`;
  const route = urlFor('weather', r);
  detailPage(route, { title: `${areaName} Weather & Survival`, description: `Weather, shelter and player exposure behavior for ${areaName}.`, body, active: 'database' });
}

for (const r of publicData.ui) {
  const name = displayName('ui', r);
  const sceneLinks = (r.sourceScenes || []).map(scene => {
    const level = levelForScene(scene);
    return level ? linked(urlFor('level', level), displayName('level', level), 'Scene where this UI was captured') : '';
  }).filter(Boolean).join('');
  const labels = (r.visibleLabels || []).filter(Boolean);
  const paths = (r.hierarchyPaths || []).filter(Boolean).slice(0, 8);
  const body = `<div class="container">${detailTop('ui', r, 'HUD & Icon Guide', cleanText(r.meaning || 'Captured player-facing interface element.'), meta('Category', friendlyLabel(r.category) || 'Interface') + meta('Evidence', friendlyLabel(r.iconEvidenceKind) || ((r.visibleLabels || []).length ? 'Visible text' : 'Captured UI')) + meta('Player HUD', r.playerHud ? 'Yes' : 'No'))}${r.importance ? dataSection('Why It Matters', `<div class="callout">${escapeHtml(r.importance)}</div>`) : ''}${labels.length ? dataSection('Visible Labels', `<div class="activity-chips">${labels.map(x => chip(x, 'steel')).join('')}</div>`) : ''}${dataSection('Evidence', `<div class="rows"><div class="row"><span class="label">Source quality</span><span>${escapeHtml(evidenceExplanation(r.iconEvidenceKind || ((r.visibleLabels || []).length ? 'VisibleText' : '')))}</span></div>${r.iconName ? `<div class="row"><span class="label">Unity icon</span><span>${escapeHtml(r.iconName)}</span></div>` : ''}${r.iconAuthoritative ? '<div class="row"><span class="label">Authoritative icon</span><span>Yes — approved player-facing icon evidence</span></div>' : ''}</div>`)}${sceneLinks ? dataSection('Seen In', `<div class="linked-list">${sceneLinks}</div>`) : ''}${paths.length ? dataSection('Captured UI Locations', `<div class="code-list">${paths.map(x => `<code>${escapeHtml(x)}</code>`).join('')}</div>`) : ''}</div>`;
  const route = urlFor('ui', r);
  detailPage(route, { title: name, description: cleanText(r.meaning || `${friendlyLabel(r.category)} interface guide entry.`), body, active: 'database' });
}

for (const r of publicData.documents) {
  const name = displayName('document', r);
  const pages = r.pages || [];
  const transcript = pages.map((p, i) => `<div class="prose">${escapeHtml(cleanText(p))}</div>${i < pages.length - 1 ? '<hr style="border:0;border-top:1px solid #2b3632;margin:28px 0">' : ''}`).join('');
  const body = `<div class="container narrow">${breadcrumbs([{ href: '/codex/', label: 'Recovered Intel' }, { label: name }])}${pageHead(name, 'Recovered document transcript.', 'Recovered Intel')}<div class="meta-grid">${meta('Type', friendlyLabel(r.documentType) || 'Unknown')}${Number(r.xpReward || 0) > 0 ? meta('Discovery XP', String(r.xpReward)) : ''}${r.repFaction ? meta('Faction', friendlyLabel(r.repFaction)) : ''}</div>${dataSection('Transcript', transcript || '<div class="empty">No transcript exported.</div>')}</div>`;
  const route = urlFor('document', r);
  detailPage(route, { title: name, description: `Recovered document: ${name}.`, body, active: 'database' });
}

const searchIndex = [...siteSearchEntries];
function addIndex(kind, record, kindLabel, subtitle = '') {
  searchIndex.push({ kind, name: displayName(kind, record), kindLabel, subtitle, url: urlFor(kind, record), image: image(kind, record), keywords: aliases(kind, record).map(friendlyLabel) });
}
publicData.items.forEach(r => addIndex('item', r, 'Item', `${friendlyLabel(r.categoryName)} • ${rarityLabel(r.rarityName)}`));
publicData.recipes.forEach(r => addIndex('recipe', r, 'Recipe', friendlyLabel(r.requiredStation) || 'Generic'));
publicData.buildings.forEach(r => addIndex('building', r, 'Construction', buildingContext(r)));
publicData.crops.forEach(r => addIndex('crop', r, 'Crop', `${friendlyLabel(r.seedItemName)} → ${friendlyLabel(r.produceItemName)}`));
publicData.baits.forEach(r => addIndex('bait', r, 'Fishing Bait', friendlyLabel(r.baitTier)));
publicData.catches.forEach(r => addIndex('fishing', r, 'Fishing Catch', friendlyLabel(r.lootTier)));
publicData.levels.forEach(r => addIndex('level', r, 'Area Intel', cleanText(r.description || '')));
publicData.weather.forEach(r => searchIndex.push({ kind: 'weather', name: `${displayName('weather', r)} Weather`, kindLabel: 'Weather & Survival', subtitle: (r.scheduledWeatherTypes || []).join(' • '), url: urlFor('weather', r), image: levelForScene(r.sceneName) ? image('level', levelForScene(r.sceneName)) : '', keywords: aliases('weather', r).map(friendlyLabel) }));
publicData.ui.forEach(r => addIndex('ui', r, 'HUD / Icon', friendlyLabel(r.category)));
publicData.documents.forEach(r => addIndex('document', r, 'Recovered Intel', friendlyLabel(r.documentType)));
writeJson(path.join(DIST, 'search-index.json'), searchIndex);
writeJson(path.join(DIST, 'site-status.json'), {
  site: 'SV13 Extraction Official Website',
  knowledgePackage: data.manifest.packageVersion,
  generatedUtc: new Date().toISOString(),
  counts,
  rawManifest: '/knowledge/manifest.json',
  datasets: { areas: '/knowledge/areas.json', weather: '/knowledge/weather.json', ui: '/knowledge/ui.json' }
});

write('robots.txt', `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`);
const sitemap = [...routes].sort().map(route => `  <url><loc>${SITE}${route === '/' ? '' : route}</loc></url>`).join('\n');
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemap}\n</urlset>\n`);
write('404.html', layout({ title: 'Intel Not Found', description: 'The requested SV13 field intelligence could not be found.', body: '<div class="not-found"><strong>404</strong><h1>SIGNAL LOST</h1><p class="page-lead">The requested page or field record is unavailable.</p><p><a href="/">← Return to the network</a></p></div>' }));

console.log('SV13 Extraction web build complete');
console.log('Package:', data.manifest.packageVersion);
console.log('Pages:', routes.size);
console.log('Search records:', searchIndex.length);
console.log('Area records:', publicData.areas.length, '| captured:', publicData.areas.filter(x => x.hasSceneCapture).length);
console.log('Weather profiles:', publicData.weather.length);
console.log('UI guide records:', publicData.ui.length);
console.log('Media records:', data.mediaIndex.size);
console.log('Output:', DIST);
