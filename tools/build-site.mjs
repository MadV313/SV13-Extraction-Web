import fs from 'node:fs';
import path from 'node:path';
import {
  loadKnowledge, buildMaps, isPublic, displayName, friendlyLabel, rarityLabel,
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
};

const slugMaps = {
  item: makeSlugMap('item', publicData.items),
  recipe: makeSlugMap('recipe', publicData.recipes),
  building: makeSlugMap('building', publicData.buildings),
  crop: makeSlugMap('crop', publicData.crops),
  bait: makeSlugMap('bait', publicData.baits),
  fishing: makeSlugMap('fishing', publicData.catches),
  document: makeSlugMap('document', publicData.documents),
  level: makeSlugMap('level', publicData.levels),
};

const itemSlugById = new Map();
for (const item of publicData.items) if (!itemSlugById.has(Number(item.id))) itemSlugById.set(Number(item.id), slugMaps.item.get(entityKey('item', item)));
const recipeSlugByResultId = new Map();
for (const r of publicData.recipes) recipeSlugByResultId.set(Number(r.resultItemId), slugMaps.recipe.get(entityKey('recipe', r)));
const buildMaterialById = new Map(data.buildMaterials.map(x => [Number(x.id), x]));

function ensureDir(p){ fs.mkdirSync(p,{recursive:true}); }
function write(rel, content){ const p=path.join(DIST,rel); ensureDir(path.dirname(p)); fs.writeFileSync(p,content,'utf8'); }
function urlFor(kind, record){
  const slug = slugMaps[kind].get(entityKey(kind,record));
  if (kind==='item') return `/items/${slug}/`;
  if (kind==='recipe') return `/recipes/${slug}/`;
  if (kind==='building') return `/buildings/${slug}/`;
  if (kind==='crop') return `/crops/${slug}/`;
  if (kind==='bait') return `/fishing/bait/${slug}/`;
  if (kind==='fishing') return `/fishing/catch/${slug}/`;
  if (kind==='document') return `/codex/${slug}/`;
  if (kind==='level') return `/maps/${slug}/`;
  return '/';
}
function image(kind, record){ return mediaUrl(kind, record, data, maps); }
function imgTag(kind,record,cls=''){ const src=image(kind,record); return src?`<img${cls?` class="${cls}"`:''} src="${src}" alt="${escapeHtml(displayName(kind,record))}" loading="lazy">`:`<div class="placeholder">◈</div>`; }
function activeClass(active,key){return active===key?'active':''}
function layout({title,description='',body,active='',extraHead=''}){
  const fullTitle=title==='SV13 Extraction'?'SV13 Extraction // Survivor Database':`${title} // SV13 Extraction`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(fullTitle)}</title><meta name="description" content="${escapeHtml(description||'SV13 Extraction Survivor Database and field manual.')}"><link rel="canonical" href="${SITE}"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><meta name="theme-color" content="#0c1010"><meta property="og:title" content="${escapeHtml(fullTitle)}"><meta property="og:description" content="${escapeHtml(description||'Unity-backed field intelligence for SV13 Extraction.')}"><meta property="og:type" content="website"><meta property="og:site_name" content="SV13 Extraction"><link rel="stylesheet" href="/site.css">${extraHead}</head><body><div class="site-shell"><header class="site-header"><div class="header-inner"><a class="brand" href="/"><div class="brand-mark">13</div><div class="brand-copy"><strong>SV13 EXTRACTION</strong><span>Survivor Database</span></div></a><nav class="nav"><a class="${activeClass(active,'items')}" href="/items/">Items</a><a class="${activeClass(active,'recipes')}" href="/recipes/">Crafting</a><a class="${activeClass(active,'buildings')}" href="/buildings/">Construction</a><a class="${activeClass(active,'field')}" href="/crops/">Field Guide</a><a class="${activeClass(active,'maps')}" href="/maps/">Maps</a><a class="${activeClass(active,'codex')}" href="/codex/">Codex</a></nav><div class="header-search"><input data-global-search placeholder="Search field intel…" aria-label="Search"><div class="search-suggest"></div></div><button class="mobile-toggle" data-mobile-toggle aria-label="Toggle navigation">☰</button></div></header><main>${body}</main><footer class="footer"><div class="footer-inner"><span>SV13 // Survivor Database • Unity-backed field intelligence</span><span>Package ${escapeHtml(data.manifest.packageVersion||'unknown')} • <a href="/knowledge/manifest.json">Raw knowledge</a></span></div></footer></div><script type="module" src="/site.js"></script></body></html>`;
}
function breadcrumbs(parts){ return `<div class="breadcrumbs"><a href="/">Survivor Database</a> ${parts.map(p=>`/ ${p.href?`<a href="${p.href}">${escapeHtml(p.label)}</a>`:escapeHtml(p.label)}`).join(' ')}</div>`; }
function chip(text,cls=''){return text?`<span class="chip ${cls}">${escapeHtml(text)}</span>`:''}
function entityCard(kind, record, subtitle='', chips=[]){ const name=displayName(kind,record); return `<a class="entity-card" data-filter-card data-search="${escapeHtml([name,subtitle,...aliases(kind,record)].join(' ').toLowerCase())}" data-category="${escapeHtml(friendlyLabel(record.categoryName||record.documentType||record.lootTier||record.baitTier||'').toLowerCase())}" href="${urlFor(kind,record)}"><div class="entity-image">${imgTag(kind,record)}</div><div class="entity-body"><h3>${escapeHtml(name)}</h3>${subtitle?`<p>${escapeHtml(subtitle)}</p>`:''}<div class="chips">${chips.map(c=>chip(c.text,c.cls)).join('')}</div></div></a>`; }
function meta(label,value){return value!==''&&value!=null?`<div class="meta"><strong>${escapeHtml(label)}</strong><span>${escapeHtml(value)}</span></div>`:''}
function detailTop(kind,record,kicker,description,metaHtml=''){ const name=displayName(kind,record); return `${breadcrumbs([{href:indexHref(kind),label:indexLabel(kind)},{label:name}])}<div class="detail-hero"><div class="detail-art">${imgTag(kind,record)}</div><div class="detail-copy"><div class="kicker">${escapeHtml(kicker)}</div><h1>${escapeHtml(name)}</h1>${description?`<div class="description">${escapeHtml(description)}</div>`:''}${metaHtml?`<div class="meta-grid">${metaHtml}</div>`:''}</div></div>`; }
function indexHref(kind){return kind==='item'?'/items/':kind==='recipe'?'/recipes/':kind==='building'?'/buildings/':kind==='crop'?'/crops/':kind==='document'?'/codex/':kind==='level'?'/maps/':'/fishing/'}
function indexLabel(kind){return kind==='item'?'Items':kind==='recipe'?'Crafting':kind==='building'?'Construction':kind==='crop'?'Crops':kind==='document'?'Codex':kind==='level'?'Maps':'Fishing'}
function pageHead(title,lead,kicker='Survivor Database'){return `<div class="kicker">${escapeHtml(kicker)}</div><h1 class="page-title">${escapeHtml(title)}</h1><p class="page-lead">${escapeHtml(lead)}</p>`}
function dataSection(title,inner){return `<section class="data-section"><h2>${escapeHtml(title)}</h2><div class="data-content">${inner}</div></section>`}
function linked(url,name,detail=''){return `<a class="linked" href="${url}"><span>${escapeHtml(name)}${detail?`<small>${escapeHtml(detail)}</small>`:''}</span><span>→</span></a>`}
function searchLink(name){return `/search/?q=${encodeURIComponent(name)}`}

function itemDescription(r){return cleanText(r.longDescription||r.description||'No field notes available.');}
function itemCard(r){ return entityCard('item',r,itemDescription(r).slice(0,110),[{text:friendlyLabel(r.categoryName)},{text:rarityLabel(r.rarityName),cls:'amber'}]); }
function fmt(n){const x=Number(n||0);return Number.isInteger(x)?String(x):String(Number(x.toFixed(2)));}
function recipeCard(r){return entityCard('recipe',r,`${friendlyLabel(r.requiredStation)||'Generic'} • ${fmt(r.craftDuration)}s`,[{text:`× ${r.craftAmount||1}`,cls:'steel'}]);}
function buildingCard(r){return entityCard('building',r,buildingContext(r),[{text:friendlyLabel(r.categoryName)},{text:(r.requirements||[]).length?`${(r.requirements||[]).length} materials`:'No material list',cls:'amber'}]);}
function cropCard(r){return entityCard('crop',r,`${friendlyLabel(r.seedItemName)} → ${friendlyLabel(r.produceItemName)}`,[{text:`Yield ${r.minYield||0}–${r.maxYield||0}`},{text:`${fmt(r.hoursPerStage)}h / stage`,cls:'amber'}]);}
function baitCard(r){return entityCard('bait',r,r.description||'Fishing bait',[{text:friendlyLabel(r.baitTier)}]);}
function catchCard(r){return entityCard('fishing',r,r.description||'Fishing catch',[{text:friendlyLabel(r.lootTier)},{text:friendlyLabel(r.lootType),cls:'steel'}]);}
function documentCard(r){return entityCard('document',r,(r.pages?.[0]||'Recovered field document').replace(/\s+/g,' ').slice(0,120),[{text:friendlyLabel(r.documentType)},{text:r.xpReward?`${r.xpReward} XP`:'' ,cls:'amber'}]);}
function levelCard(r){return entityCard('level',r,r.description||'Area intelligence',[{text:'Area intel',cls:'steel'}]);}

const routes = new Set();
function writePage(route, html){
  let rel;
  if (route === '/') rel='index.html';
  else rel=path.join(route.replace(/^\//,'').replace(/\/$/,''),'index.html');
  write(rel,html); routes.add(route);
}
function canonicalLayout(opts, route){
  let html=layout(opts);
  html=html.replace(`<link rel="canonical" href="${SITE}">`,`<link rel="canonical" href="${SITE}${route==='/'?'':route}">`);
  return html;
}
function detailPage(route, opts){writePage(route,canonicalLayout(opts,route));}

fs.rmSync(DIST,{recursive:true,force:true}); ensureDir(DIST);
copyDir(KNOWLEDGE,path.join(DIST,'knowledge'));
fs.copyFileSync(path.join(SRC,'site.css'),path.join(DIST,'site.css'));
fs.copyFileSync(path.join(SRC,'site.js'),path.join(DIST,'site.js'));
fs.copyFileSync(path.join(SRC,'favicon.svg'),path.join(DIST,'favicon.svg'));

const counts={
  items:publicData.items.length, recipes:publicData.recipes.length, buildings:publicData.buildings.length,
  crops:publicData.crops.length, fishing:publicData.baits.length+publicData.catches.length,
  documents:publicData.documents.length, maps:publicData.levels.length, media:data.mediaIndex.size
};
const boren = publicData.buildings.filter(r=>buildingContext(r)==='Boren Player Cabin Upgrade');
const featuredItems = publicData.items.filter(r=>['Food','Firearms','Melee','Tools'].some(c=>friendlyLabel(r.categoryName).toLowerCase().includes(c.toLowerCase()))).slice(0,8);

const homeBody=`<div class="container"><section class="hero"><div><div class="eyebrow">SV13 Extraction // Live Field Intelligence</div><h1>SURVIVOR <span>DATABASE</span></h1><p>Search the current Unity-backed field manual for items, crafting, construction, farming, fishing, locations, and recovered documents. Player-facing names are cleaned while the raw export stays intact for auditing.</p><div class="hero-search"><input data-global-search placeholder="Search items, recipes, upgrades, maps…" aria-label="Search Survivor Database"><div class="search-suggest"></div></div></div><aside class="hero-card"><div><div class="status"><span class="dot"></span><strong>Knowledge uplink online</strong></div><p class="package">Package ${escapeHtml(data.manifest.packageVersion)}<br>Unity ${escapeHtml(data.manifest.unityVersion||'')}</p></div><div class="stats"><div class="stat"><strong>${counts.items}</strong><span>Items</span></div><div class="stat"><strong>${counts.recipes}</strong><span>Recipes</span></div><div class="stat"><strong>${counts.buildings}</strong><span>Buildables</span></div><div class="stat"><strong>${counts.documents}</strong><span>Documents</span></div></div></aside></section>
<section><div class="section-head"><div><div class="kicker">Browse intel</div><h2>Field Manual</h2><p>Everything below is generated from the same package used by the Discord bot.</p></div></div><div class="grid"><a class="nav-card" href="/items/"><span class="icon">📦</span><strong>Item Index</strong><small>Gear, weapons, supplies, clothing and resources.</small><span class="count">${counts.items} records</span></a><a class="nav-card" href="/recipes/"><span class="icon">🛠️</span><strong>Crafting Manual</strong><small>Confirmed ingredient requirements and stations.</small><span class="count">${counts.recipes} recipes</span></a><a class="nav-card" href="/buildings/"><span class="icon">🏗️</span><strong>Construction</strong><small>Buildables, material requirements and cabin upgrades.</small><span class="count">${counts.buildings} definitions</span></a><a class="nav-card" href="/crops/"><span class="icon">🌱</span><strong>Growing Guide</strong><small>Seeds, yields, water, temperature and rot timing.</small><span class="count">${counts.crops} crops</span></a><a class="nav-card" href="/fishing/"><span class="icon">🎣</span><strong>Fishing Guide</strong><small>Bait and confirmed catches.</small><span class="count">${counts.fishing} records</span></a><a class="nav-card" href="/maps/"><span class="icon">🗺️</span><strong>Area Intel</strong><small>Production maps and known locations.</small><span class="count">${counts.maps} areas</span></a><a class="nav-card" href="/codex/"><span class="icon">📄</span><strong>Recovered Intel</strong><small>Documents, notes and codex transcripts.</small><span class="count">${counts.documents} documents</span></a><a class="nav-card" href="/search/"><span class="icon">⌕</span><strong>Global Search</strong><small>Search across every public knowledge category.</small><span class="count">Unified index</span></a></div></section>
${boren.length?`<section><div class="section-head"><div><div class="kicker">Player Cabin</div><h2>Boren Upgrades</h2><p>Buildables explicitly tagged by the current Unity export as permanent Boren Player Cabin upgrades.</p></div><a href="/buildings/">View construction →</a></div><div class="grid three">${boren.map(buildingCard).join('')}</div></section>`:''}
<section><div class="section-head"><div><div class="kicker">Current database</div><h2>Field Supplies</h2><p>A sample of player-facing records with their in-game sprites.</p></div><a href="/items/">Browse all items →</a></div><div class="grid">${featuredItems.map(itemCard).join('')}</div></section></div>`;
writePage('/',canonicalLayout({title:'SV13 Extraction',description:'Official SV13 Extraction Survivor Database and field manual.',body:homeBody},'/'));

function listingPage({route,title,lead,active,records,card,categoryOptions=[]}){
  const categorySelect=categoryOptions.length?`<select data-grid-category aria-label="Filter category"><option value="all">All categories</option>${categoryOptions.map(x=>`<option value="${escapeHtml(x.toLowerCase())}">${escapeHtml(x)}</option>`).join('')}</select>`:'';
  const body=`<div class="container">${breadcrumbs([{label:title}])}${pageHead(title,lead)}<div class="toolbar"><input class="filter-input" data-grid-filter="[data-filter-card]" placeholder="Filter this index…">${categorySelect}<span class="result-count" data-grid-count></span></div><div class="grid">${records.map(card).join('')}</div></div>`;
  writePage(route,canonicalLayout({title,description:lead,body,active},route));
}

const itemCategories=[...new Set(publicData.items.map(r=>friendlyLabel(r.categoryName)).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
listingPage({route:'/items/',title:'Item Index',lead:'Search current gear, weapons, clothing, supplies and resources exported from SV13.',active:'items',records:publicData.items.sort((a,b)=>displayName('item',a).localeCompare(displayName('item',b))),card:itemCard,categoryOptions:itemCategories});
listingPage({route:'/recipes/',title:'Crafting Manual',lead:'Confirmed recipes with actual Unity ingredient requirements and crafting stations.',active:'recipes',records:publicData.recipes.sort((a,b)=>displayName('recipe',a).localeCompare(displayName('recipe',b))),card:recipeCard});
listingPage({route:'/buildings/',title:'Construction Manual',lead:'Buildable definitions, material costs, assembly requirements and Player Cabin upgrades.',active:'buildings',records:publicData.buildings.sort((a,b)=>displayName('building',a).localeCompare(displayName('building',b))),card:buildingCard,categoryOptions:[...new Set(publicData.buildings.map(r=>buildingContext(r)).filter(Boolean))].sort()});
listingPage({route:'/crops/',title:"Grower's Field Notes",lead:'Current seed, produce, yield, water, temperature and crop timing data.',active:'field',records:publicData.crops.sort((a,b)=>displayName('crop',a).localeCompare(displayName('crop',b))),card:cropCard});

const fishingBody=`<div class="container">${breadcrumbs([{label:'Fishing'}])}${pageHead('Fishing Guide','Bait and catch intelligence exported from the current SV13 data package.','Field Guide')}<div class="section-head"><div><h2>Bait</h2><p>Current public bait definitions.</p></div></div>${publicData.baits.length?`<div class="grid three">${publicData.baits.map(baitCard).join('')}</div>`:`<div class="empty">No public bait records are currently confirmed.</div>`}<div class="section-head"><div><h2>Catches</h2><p>Confirmed fishing loot records.</p></div></div>${publicData.catches.length?`<div class="grid three">${publicData.catches.map(catchCard).join('')}</div>`:`<div class="empty">No public catch records are currently confirmed.</div>`}</div>`;
writePage('/fishing/',canonicalLayout({title:'Fishing Guide',description:'SV13 fishing bait and catch intelligence.',body:fishingBody,active:'field'},'/fishing/'));
listingPage({route:'/maps/',title:'Area Intel',lead:'Production areas and level records currently exposed by the SV13 knowledge package.',active:'maps',records:publicData.levels.sort((a,b)=>displayName('level',a).localeCompare(displayName('level',b))),card:levelCard});
listingPage({route:'/codex/',title:'Recovered Intel',lead:'Recovered documents and field notes exported directly from SV13.',active:'codex',records:publicData.documents.sort((a,b)=>displayName('document',a).localeCompare(displayName('document',b))),card:documentCard,categoryOptions:[...new Set(publicData.documents.map(r=>friendlyLabel(r.documentType)).filter(Boolean))].sort()});

const searchBody=`<div class="container narrow">${breadcrumbs([{label:'Search'}])}${pageHead('Global Search','Search all public Survivor Database records.','Knowledge Uplink')}<div class="toolbar"><input class="search-page-input" data-search-page placeholder="Search the database…"><select data-search-kind><option value="all">All intel</option><option value="item">Items</option><option value="recipe">Recipes</option><option value="building">Construction</option><option value="crop">Crops</option><option value="bait">Bait</option><option value="fishing">Catches</option><option value="level">Maps</option><option value="document">Codex</option></select><span class="result-count" data-search-count></span></div><div class="search-results" data-search-results></div></div>`;
writePage('/search/',canonicalLayout({title:'Search',description:'Search the SV13 Extraction Survivor Database.',body:searchBody},'/search/'));

for(const r of publicData.items){
  const name=displayName('item',r), recipeSlug=recipeSlugByResultId.get(Number(r.id));
  let sections='';
  if(recipeSlug) sections+=dataSection('Crafting',linked(`/recipes/${recipeSlug}/`,`${name} recipe`,'Confirmed crafting requirements'));
  const body=`<div class="container">${detailTop('item',r,'Survivor Database',itemDescription(r),meta('Category',friendlyLabel(r.categoryName)||'Unclassified')+meta('Rarity',rarityLabel(r.rarityName))+meta('Weight',fmt(r.weight))+meta('Stack',String(r.stackSize||1)))}${sections}<p class="audit-note">Player-facing presentation is cleaned for readability. Raw Unity identifiers remain available in the machine-readable knowledge package.</p></div>`;
  const route=urlFor('item',r); detailPage(route,{title:name,description:itemDescription(r),body,active:'items'});
}

for(const r of publicData.recipes){
  const name=displayName('recipe',r); const resultSlug=itemSlugById.get(Number(r.resultItemId));
  const reqs=(r.requirements||[]).map(req=>{const slug=itemSlugById.get(Number(req.itemId)); const n=friendlyLabel(req.itemName)||'Unknown Item'; return slug?linked(`/items/${slug}/`,n,`× ${req.amount||0}`):linked(searchLink(n),n,`× ${req.amount||0}${req.resolved?'':' • unresolved'}`)}).join('');
  const body=`<div class="container">${detailTop('recipe',r,'Crafting Manual','Current crafting requirements exported directly from SV13.',meta('Station',friendlyLabel(r.requiredStation)||'Generic')+meta('Craft time',`${fmt(r.craftDuration)}s`)+meta('Output',`× ${r.craftAmount||1}`)+(Number(r.craftLevel||0)>0?meta('Level',String(r.craftLevel)):'') )}${dataSection('Requirements',reqs||'<div class="empty">No confirmed ingredients.</div>')}${resultSlug?dataSection('Result',linked(`/items/${resultSlug}/`,name,'Open item record')):''}</div>`;
  const route=urlFor('recipe',r); detailPage(route,{title:`Craft ${name}`,description:`Crafting recipe for ${name} in SV13 Extraction.`,body,active:'recipes'});
}

for(const r of publicData.buildings){
  const name=displayName('building',r), context=buildingContext(r);
  const reqs=(r.requirements||[]).map(req=>{
    const mat=buildMaterialById.get(Number(req.buildMaterialId)); let target='';
    if(mat?.itemDefinitions?.length){ const id=Number(mat.itemDefinitions[0].id); const slug=itemSlugById.get(id); if(slug) target=`/items/${slug}/`; }
    const n=friendlyLabel(req.buildMaterialName)||'Unknown Material'; return linked(target||searchLink(n),n,`× ${req.requiredAmount||0}`);
  }).join('');
  const gate=r.assemblyGate||{};
  const assembly=gate.found?`<div class="rows"><div class="row"><span class="label">Required tool</span><span>${escapeHtml(friendlyLabel(gate.requiredToolDisplayName||gate.requiredToolName)||'Tool')}</span></div><div class="row"><span class="label">Assembly time</span><span>${escapeHtml(fmt(gate.assemblyDuration))}s</span></div>${gate.useToolDurability?'<div class="row"><span class="label">Tool wear</span><span>Uses tool durability</span></div>':''}</div>`:'<div class="empty">No assembly gate is exported for this definition.</div>';
  const body=`<div class="container">${detailTop('building',r,'Construction Manual',cleanText(r.description||'Construction definition.'),meta('Type',context)+meta('Category',friendlyLabel(r.categoryName)||'Construction')+meta('Materials',String((r.requirements||[]).length)))}${dataSection('Materials',reqs||'<div class="empty">No construction requirements are currently listed.</div>')}${dataSection('Assembly',assembly)}</div>`;
  const route=urlFor('building',r); detailPage(route,{title:name,description:cleanText(r.description||`${context} in SV13 Extraction.`),body,active:'buildings'});
}

for(const r of publicData.crops){
  const name=displayName('crop',r); const seedSlug=itemSlugById.get(Number(r.seedItemId)), produceSlug=itemSlugById.get(Number(r.produceItemId));
  const linkedRows=`<div class="linked-list">${seedSlug?linked(`/items/${seedSlug}/`,friendlyLabel(r.seedItemName),'Seed item'):linked(searchLink(friendlyLabel(r.seedItemName)),friendlyLabel(r.seedItemName),'Seed item')}${produceSlug?linked(`/items/${produceSlug}/`,friendlyLabel(r.produceItemName),'Harvested produce'):linked(searchLink(friendlyLabel(r.produceItemName)),friendlyLabel(r.produceItemName),'Harvested produce')}</div>`;
  const climate=`<div class="rows"><div class="row"><span class="label">Cold slow</span><span>${fmt(r.coldSlowTempC)}°C</span></div><div class="row"><span class="label">Cold kill</span><span>${fmt(r.coldKillTempC)}°C</span></div><div class="row"><span class="label">Heat kill</span><span>${fmt(r.heatKillTempC)}°C</span></div><div class="row"><span class="label">Slow multiplier</span><span>${fmt(r.slowMultiplier)}×</span></div></div>`;
  const body=`<div class="container">${detailTop('crop',r,"Grower's Field Note",`${friendlyLabel(r.seedItemName)} grows into ${friendlyLabel(r.produceItemName)}.`,meta('Yield',`${r.minYield||0}–${r.maxYield||0}`)+meta('Stage time',`${fmt(r.hoursPerStage)} h`)+meta('Water / stage',String(r.waterPerStage||0))+meta('Rot after mature',`${fmt(r.hoursUntilRotAfterMature)} h`))}${dataSection('Seed & Produce',linkedRows)}${dataSection('Temperature',climate)}</div>`;
  const route=urlFor('crop',r); detailPage(route,{title:name,description:`Growing guide for ${name} in SV13 Extraction.`,body,active:'field'});
}

for(const r of publicData.baits){
  const name=displayName('bait',r); const links=(r.linkedItems||[]).map(x=>{const slug=itemSlugById.get(Number(x.id)); const n=friendlyLabel(x.name||x.id); return linked(slug?`/items/${slug}/`:searchLink(n),n,'Linked inventory item')}).join('');
  const body=`<div class="container">${detailTop('bait',r,'Fishing Guide',cleanText(r.description||'Fishing bait.'),meta('Tier',friendlyLabel(r.baitTier)||'Unknown'))}${links?dataSection('Linked Items',`<div class="linked-list">${links}</div>`):''}</div>`;
  const route=urlFor('bait',r); detailPage(route,{title:name,description:cleanText(r.description||`Fishing bait in SV13 Extraction.`),body,active:'field'});
}
for(const r of publicData.catches){
  const name=displayName('fishing',r); const item=maps.itemByCleanName.get(name.toLowerCase()); const itemSlug=item?itemSlugById.get(Number(item.id)):null;
  const body=`<div class="container">${detailTop('fishing',r,'Fishing Guide',cleanText(r.description||'Fishing catch.'),meta('Tier',friendlyLabel(r.lootTier)||'Unknown')+meta('Type',friendlyLabel(r.lootType)||'Unknown')+meta('Weight',`${fmt(r.minWeight)}–${fmt(r.maxWeight)}`))}${itemSlug?dataSection('Inventory Record',linked(`/items/${itemSlug}/`,name,'Open item record')):''}</div>`;
  const route=urlFor('fishing',r); detailPage(route,{title:name,description:cleanText(r.description||`Fishing catch in SV13 Extraction.`),body,active:'field'});
}

for(const r of publicData.levels){
  const name=displayName('level',r); const desc=cleanText(r.description||'Current area intelligence.');
  const body=`<div class="container">${detailTop('level',r,'Area Intel',desc,meta('Status','Known area'))}</div>`;
  const route=urlFor('level',r); detailPage(route,{title:name,description:desc,body,active:'maps'});
}

for(const r of publicData.documents){
  const name=displayName('document',r); const pages=r.pages||[];
  const transcript=pages.map((p,i)=>`<div class="prose">${escapeHtml(cleanText(p))}</div>${i<pages.length-1?'<hr style="border:0;border-top:1px solid #2b3632;margin:28px 0">':''}`).join('');
  const body=`<div class="container narrow">${breadcrumbs([{href:'/codex/',label:'Recovered Intel'},{label:name}])}${pageHead(name,'Recovered document transcript.','Recovered Intel')}<div class="meta-grid">${meta('Type',friendlyLabel(r.documentType)||'Unknown')}${Number(r.xpReward||0)>0?meta('Discovery XP',String(r.xpReward)):''}${r.repFaction?meta('Faction',friendlyLabel(r.repFaction)):''}</div>${dataSection('Transcript',transcript||'<div class="empty">No transcript exported.</div>')}</div>`;
  const route=urlFor('document',r); detailPage(route,{title:name,description:`Recovered document: ${name}.`,body,active:'codex'});
}

const searchIndex=[];
function addIndex(kind,record,kindLabel,subtitle=''){
  searchIndex.push({kind,name:displayName(kind,record),kindLabel,subtitle,url:urlFor(kind,record),image:image(kind,record),keywords:aliases(kind,record).map(friendlyLabel)});
}
publicData.items.forEach(r=>addIndex('item',r,'Item',`${friendlyLabel(r.categoryName)} • ${rarityLabel(r.rarityName)}`));
publicData.recipes.forEach(r=>addIndex('recipe',r,'Recipe',friendlyLabel(r.requiredStation)||'Generic'));
publicData.buildings.forEach(r=>addIndex('building',r,'Construction',buildingContext(r)));
publicData.crops.forEach(r=>addIndex('crop',r,'Crop',`${friendlyLabel(r.seedItemName)} → ${friendlyLabel(r.produceItemName)}`));
publicData.baits.forEach(r=>addIndex('bait',r,'Fishing Bait',friendlyLabel(r.baitTier)));
publicData.catches.forEach(r=>addIndex('fishing',r,'Fishing Catch',friendlyLabel(r.lootTier)));
publicData.levels.forEach(r=>addIndex('level',r,'Area Intel',cleanText(r.description||'')));
publicData.documents.forEach(r=>addIndex('document',r,'Recovered Intel',friendlyLabel(r.documentType)));
writeJson(path.join(DIST,'search-index.json'),searchIndex);
writeJson(path.join(DIST,'site-status.json'),{site:'SV13 Extraction Survivor Database',knowledgePackage:data.manifest.packageVersion,generatedUtc:new Date().toISOString(),counts,rawManifest:`/knowledge/manifest.json`});

write('robots.txt',`User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`);
const sitemap=[...routes].sort().map(route=>`  <url><loc>${SITE}${route==='/'?'':route}</loc></url>`).join('\n');
write('sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemap}\n</urlset>\n`);
write('404.html',layout({title:'Intel Not Found',description:'The requested SV13 field intelligence could not be found.',body:`<div class="not-found"><strong>404</strong><h1>INTEL NOT FOUND</h1><p class="page-lead">That Survivor Database record does not exist or is not public.</p><p><a href="/">← Return to the field manual</a></p></div>`}));

console.log('SV13 Extraction web build complete');
console.log('Package:',data.manifest.packageVersion);
console.log('Pages:',routes.size);
console.log('Search records:',searchIndex.length);
console.log('Media records:',data.mediaIndex.size);
console.log('Output:',DIST);
