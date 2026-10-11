let searchIndexPromise;
const loadIndex = () => searchIndexPromise ||= fetch('/search-index.json', { cache:'no-store' }).then(r => r.json());
const safe = v => String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
const norm = v => String(v||'').toLowerCase().trim();
function score(q, item){
  q=norm(q); if(!q) return 0;
  const name=norm(item.name), hay=norm([item.name,item.subtitle,...(item.keywords||[])].join(' '));
  if(name===q) return 100; if(name.startsWith(q)) return 95; if(name.includes(q)) return 90;
  const parts=q.split(/\s+/).filter(Boolean); if(parts.every(x=>hay.includes(x))) return 82;
  return hay.includes(q) ? 75 : 0;
}
function imageHtml(item){return item.image?`<img src="${safe(item.image)}" alt="" loading="lazy">`:`<div class="placeholder">◈</div>`}

for(const btn of document.querySelectorAll('[data-mobile-toggle]')) btn.addEventListener('click',()=>(()=>{const nav=document.querySelector('.nav');const open=nav?.classList.toggle('open');btn.setAttribute('aria-expanded',String(Boolean(open)));})());

for(const input of document.querySelectorAll('[data-global-search]')){
  const box=input.parentElement.querySelector('.search-suggest');
  const render=async()=>{
    const q=input.value.trim(); if(!q){box?.classList.remove('open');return;}
    const idx=await loadIndex();
    const results=idx.map(x=>[score(q,x),x]).filter(x=>x[0]>0).sort((a,b)=>b[0]-a[0]||a[1].name.localeCompare(b[1].name)).slice(0,8).map(x=>x[1]);
    if(!box)return;
    box.innerHTML=results.length?results.map(x=>`<a class="suggestion" href="${safe(x.url)}">${imageHtml(x)}<span><strong>${safe(x.name)}</strong><small>${safe(x.kindLabel)}${x.subtitle?' • '+x.subtitle:''}</small></span></a>`).join(''):`<div class="suggestion"><span></span><span><strong>No match</strong><small>Try another term</small></span></div>`;
    box.classList.add('open');
  };
  input.addEventListener('input',render); input.addEventListener('focus',render);
  input.addEventListener('keydown',e=>{if(e.key==='Enter'&&input.value.trim()){e.preventDefault();location.href='/search/?q='+encodeURIComponent(input.value.trim())}});
  document.addEventListener('click',e=>{if(!input.parentElement.contains(e.target))box?.classList.remove('open')});
}

const pageInput=document.querySelector('[data-search-page]');
if(pageInput){
  const output=document.querySelector('[data-search-results]');
  const count=document.querySelector('[data-search-count]');
  const kind=document.querySelector('[data-search-kind]');
  const run=async()=>{
    const q=pageInput.value.trim(); const idx=await loadIndex();
    const selected=kind?.value||'all';
    let results=idx.filter(x=>selected==='all'||x.kind===selected);
    if(q) results=results.map(x=>[score(q,x),x]).filter(x=>x[0]>0).sort((a,b)=>b[0]-a[0]||a[1].name.localeCompare(b[1].name)).map(x=>x[1]);
    else results=results.slice().sort((a,b)=>a.name.localeCompare(b.name));
    results=results.slice(0,100);
    if(count) count.textContent=`${results.length}${results.length===100?'+' : ''} result${results.length===1?'':'s'}`;
    if(output) output.innerHTML=results.length?results.map(x=>`<a class="search-result" href="${safe(x.url)}">${imageHtml(x)}<div><div class="kind">${safe(x.kindLabel)}</div><h3>${safe(x.name)}</h3><p>${safe(x.subtitle||'')}</p></div><span class="arrow">→</span></a>`).join(''):`<div class="empty">No public Survivor Database entries matched that search.</div>`;
    const url=new URL(location.href); q?url.searchParams.set('q',q):url.searchParams.delete('q'); selected!=='all'?url.searchParams.set('kind',selected):url.searchParams.delete('kind'); history.replaceState(null,'',url);
  };
  const params=new URLSearchParams(location.search); pageInput.value=params.get('q')||''; if(kind&&params.get('kind'))kind.value=params.get('kind');
  pageInput.addEventListener('input',run); kind?.addEventListener('change',run); run();
}

for(const input of document.querySelectorAll('[data-grid-filter]')){
  const selector=input.dataset.gridFilter; const cards=[...document.querySelectorAll(selector)]; const count=document.querySelector('[data-grid-count]');
  const category=document.querySelector('[data-grid-category]');
  const run=()=>{let shown=0;const q=norm(input.value), cat=norm(category?.value); for(const card of cards){const ok=(!q||norm(card.dataset.search).includes(q))&&(!cat||cat==='all'||norm(card.dataset.category)===cat); card.style.display=ok?'':'none';if(ok)shown++;} if(count)count.textContent=`${shown} shown`;};
  input.addEventListener('input',run);category?.addEventListener('change',run);run();
}
