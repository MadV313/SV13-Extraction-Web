const EXTRACTION_DISCORD='https://discord.gg/vUUwQ7XAYY';
const TCG_DISCORD='https://discord.gg/SRPzZWQJPf';
const ITCH='https://madhausestudios.itch.io/sv13-extraction';
const KOFI='https://ko-fi.com/madv811785';
const SHOP='https://ko-fi.com/madv811785/shop';
const SPOT='https://www.spotfund.com/story/4528f42c-fe34-40d7-9502-1ee3c04ceca3?SFID=HelpBuildSV13Extraction';

const ART={
  hero:'/official-art/hero-zone-overlook.png',
  run:'/official-art/extraction-run.png',
  refuge:'/official-art/refuge-cabin.png',
  encounter:'/official-art/hostile-encounter.png'
};

const ext=(href)=>href.startsWith('http')?' target="_blank" rel="noopener noreferrer"':'';
const link=(href,label,cls='button')=>`<a class="${cls}" href="${href}"${ext(href)}>${label} <span aria-hidden="true">↗</span></a>`;
const header=(eyebrow,title,lead)=>`<div class="terminal-head"><div class="kicker">SV13 / ${eyebrow}</div><h1>${title}</h1><p>${lead}</p></div>`;
const wrap=(content)=>`<div class="container official-page">${content}</div>`;
const section=(id,eyebrow,title,description,content='')=>`<section class="official-section"${id?` id="${id}"`:''}><div class="kicker">${eyebrow}</div><h2>${title}</h2><p class="official-lead">${description}</p>${content}</section>`;
const tiles=(items)=>`<div class="official-tiles">${items.map(([n,t,d,h])=>`<a class="official-tile" href="${h}"><span class="tile-num">${n}</span><h3>${t}</h3><p>${d}</p><span class="tile-arrow">Explore →</span></a>`).join('')}</div>`;
const banner=(eyebrow,title,body,cta='')=>`<div class="official-banner"><div><div class="kicker">${eyebrow}</div><h3>${title}</h3><p>${body}</p></div>${cta}</div>`;
const artFigure=(src,alt,kicker='')=>`<figure class="art-figure"><img src="${src}" alt="${alt}" loading="lazy">${kicker?`<figcaption>${kicker}</figcaption>`:''}</figure>`;
const feature=(options)=>`<div class="feature-split${options.reverse?' reverse':''}"><div class="feature-copy"><div class="kicker">${options.eyebrow}</div><h3>${options.title}</h3><p>${options.description}</p>${options.extra||''}</div>${artFigure(options.image,options.alt,options.caption||'')}</div>`;
const statGrid=(items)=>`<div class="official-stats">${items.map(([n,l])=>`<span><b>${n}</b>${l}</span>`).join('')}</div>`;
const authShell=(mode)=>mode==='register'
  ? `<div class="auth-shell"><div class="auth-grid"><label>Email address<input type="email" placeholder="you@example.com" disabled></label><label>Display name<input type="text" placeholder="Your survivor name" disabled></label><label>Password<input type="password" placeholder="Create a password" disabled></label><label>Confirm password<input type="password" placeholder="Repeat password" disabled></label><label>Discord username (optional)<input type="text" placeholder="For future linking" disabled></label><label>Steam profile (future)<input type="text" placeholder="Optional later" disabled></label></div><button class="button muted" disabled>ACCOUNT CREATION COMING ONLINE</button><small>This interface is staged visually, but account creation is not live until the auth backend is deployed.</small></div>`
  : `<div class="auth-shell"><div class="auth-grid auth-grid-login"><label>Email address<input type="email" placeholder="you@example.com" disabled></label><label>Password<input type="password" placeholder="Enter password" disabled></label></div><button class="button muted" disabled>LOG IN COMING ONLINE</button><small>Login entry points are now visible on the website. Backend authentication, sessions and recovery still need to be wired.</small></div>`;

const homeCards=[
 ['01','Extraction runs','Enter dangerous locations, gather what you can, and try to leave with more than you brought in.','/game/#runs'],
 ['02','Permanent refuge','Bring resources home to improve your cabin, stations and long-term foothold.','/game/#refuge'],
 ['03','Hostile encounters','Navigate infected threats, harsh conditions and other dangers in the field.','/game/#encounters'],
 ['04','Field intelligence','Browse the live Unity-backed item, crafting, and construction database.','/database/']
];

export const siteSearchEntries=[
  ...[
    ['Game Overview','/game/'],
    ['Play SV13 Extraction','/play/'],
    ['Survivor Database','/database/'],
    ['Development News','/news/'],
    ['Community and Contests','/community/'],
    ['Support SV13','/support/'],
    ['SV13 Trading Card Game','/tcg/'],
    ['Media Gallery','/media/'],
    ['Development Roadmap','/roadmap/'],
    ['Survivor Accounts','/account/'],
    ['Register Survivor Account','/register/'],
    ['Log In to Survivor Account','/login/'],
    ['Player Overview','/player-overview/'],
    ['About SV13','/about/']
  ].map(([name,url])=>({kind:'site',name,kindLabel:'Official Website',subtitle:'SV13 Extraction',url,image:'',keywords:['sv13','survivor','extraction','account','community']}))
];

export function sitePages({counts,packageVersion}){
  const dbTiles=[
    ['01','Item Index',`${counts.items} public item records`,'/items/'],
    ['02','Crafting Manual',`${counts.recipes} confirmed recipes`,'/recipes/'],
    ['03','Construction',`${counts.buildings} buildable definitions`,'/buildings/'],
    ['04','Farming & Fishing','Growing and fishing guides','/crops/'],
    ['05','Maps','Known areas and location intel','/maps/'],
    ['06','Recovered Intel',`${counts.documents} documents`,'/codex/'],
    ['07','Search Everything','Search the full field manual','/search/'],
    ['08','Fishing','Baits and catches','/fishing/']
  ];
  const p=(route,title,description,active,body)=>({route,title,description,active,body:wrap(body)});
  return [
    p('/','SV13 Extraction','Official SV13 Extraction game website. Explore the survival experience and join the playable build.','home',
      `<section class="cinematic-hero"><div class="cinematic-grain"></div><div class="cinematic-grid"><div class="cinematic-content"><div class="eyebrow">TRANSMISSION 013 · PLAYABLE BUILD AVAILABLE</div><h1>SURVIVE.<br>SCAVENGE.<br><em>EXTRACT.</em></h1><p>An unforgiving survival extraction experience. Venture into dangerous territory, secure valuable supplies, and build a refuge worth returning to.</p><div class="action-row">${link('/play/','GET ACCESS')}${link('/game/','DISCOVER THE GAME','button outline')}${link('/register/','REGISTER ACCOUNT','button ghost')}</div><small>Current build access is distributed through the official Extraction Discord while website-hosted builds are prepared.</small></div><div class="cinematic-art">${artFigure(ART.hero,'Lone survivor overlooking a ruined extraction zone','Original placeholder key art for SV13 Extraction')}</div></div><div class="hero-stamp">SV13 // THE ZONE IS UNSTABLE</div></section>`+
      section('', 'THE EXPERIENCE', 'Every extraction matters', 'Risk what you carry. Return with what you can save. Grow your permanent foothold between runs.', tiles(homeCards))+
      section('', 'LIVE GAME DIRECTION', 'Now with gameplay-style placeholder art', 'These images are temporary website artwork created to match the current SV13 tone until official in-game captures and promo art replace them.', `<div class="art-strip">${artFigure(ART.run,'Two survivors on an extraction run','Extraction run')} ${artFigure(ART.refuge,'A fortified survivor refuge cabin','Persistent refuge')} ${artFigure(ART.encounter,'Survivors facing infected enemies','Hostile encounter')}</div>`) +
      section('', 'THE SURVIVOR NETWORK', 'A game hub, not just a wiki', 'Use the site to learn the game, access the community, track development, support the project, and prepare for unified website accounts that will later connect with TCG and the game itself.', `${statGrid([[counts.items,'Items'],[counts.recipes,'Recipes'],[counts.buildings,'Buildables'],['1','Playable build']])}<div class="action-row">${link('/database/','OPEN FIELD MANUAL')}${link('/community/','JOIN THE COMMUNITY','button outline')}${link('/account/','VIEW ACCOUNT PLAN','button ghost')}</div>`) +
      section('', 'CURRENT ACCESS', 'Join the playable build', 'The currently available public playable build is distributed through approved roles in the official Extraction Discord. The next release can also be attached directly to the domain when you decide to host it here.', banner('ACCESS STATUS','Discord role-approved build access','Join the official Extraction Discord, complete onboarding, and follow the current instructions to access the build.', link(EXTRACTION_DISCORD,'JOIN EXTRACTION DISCORD')))
    ),

    p('/game/','The Game','SV13 Extraction gameplay and persistent progression.','game',
      header('GAME INTELLIGENCE','THE GAME','A survival extraction experience built around risky expeditions and progression between runs.')+
      section('runs','CORE LOOP','Deploy. Survive. Return.','Scavenge equipment and resources in hostile locations, then extract what you can carry back to your persistent refuge.', `${feature({eyebrow:'EXTRACTION RUNS',title:'Risk vs reward in the field',description:'Your expeditions are about decision-making under pressure: how deep to push, what to loot, when to cut losses, and how to get out alive. Runs should feel tense, valuable, and worth repeating.',image:ART.run,alt:'Survivors scavenging during an extraction run',caption:'Temporary website artwork — extraction run'})}<div class="action-row">${link('/play/','HOW TO ACCESS THE BUILD')}${link('/database/','BROWSE FIELD INTEL','button outline')}</div>`)+
      section('refuge','PERSISTENCE','Build something worth returning to','Between runs, your persistent refuge gives purpose to scavenging. Resources, stations, storage and future upgrades reinforce the long-term survival loop.', feature({eyebrow:'PERSISTENT REFUGE',title:'Cabin progression between missions',description:'The cabin and its surrounding stations are the backbone of long-form progression. That includes crafting spaces, storage, generator-powered utilities, farming, medical and other expansion systems as they come online.',image:ART.refuge,alt:'Survivor refuge cabin with workshop',caption:'Temporary website artwork — refuge buildout',reverse:true}) )+
      section('encounters','SURVIVAL PRESSURE','Not every threat is human','Field encounters can involve infected threats, dangerous spaces, weather pressure, resource scarcity, and future PvE/PvP tension depending on the current build and mode.', feature({eyebrow:'HOSTILE CONTACT',title:'Danger in every deployment',description:'The world should stay unstable. Players need to navigate noise, visibility, exposure, and enemy pressure while carrying the risk of losing what they brought in.',image:ART.encounter,alt:'Survivors facing infected in the field',caption:'Temporary website artwork — hostile encounter'}) )+
      section('', 'FIELD SUPPORT', 'The working knowledge base is already live', 'If you want hard information instead of just a pitch page, the Survivor Database is still the best source for public items, crafting, construction and other extracted knowledge.', `${tiles([['01','Items & Loot','Browse the current public item index','/items/'],['02','Recipes','Check public crafting records','/recipes/'],['03','Construction','See buildables and requirements','/buildings/'],['04','Search','Find specific field intel fast','/search/']])}`)
    ),

    p('/play/','Play SV13 Extraction','How to access the currently available SV13 Extraction playable build.','play',
      header('DEPLOYMENT TERMINAL','PLAY SV13 EXTRACTION','The current playable release is distributed through approved roles in the official Extraction Discord community.')+
      banner('CURRENT ACCESS','Discord role-approved testing','Join the server, read the onboarding instructions, and obtain an approved access role to find the current build.', link(EXTRACTION_DISCORD,'JOIN OFFICIAL DISCORD'))+
      section('', 'DEPLOYMENT PROCEDURE', 'Getting started', 'Use the instructions in Discord for the latest installation requirements and build details.', `<ol class="steps"><li>Join the official SV13 Extraction Discord server.</li><li>Complete the server onboarding and request any required access role.</li><li>Open the authorized build channel after approval.</li><li>Follow the current installation notes and check known issues before launching.</li></ol>`) +
      section('', 'UPCOMING DELIVERY', 'Website-hosted releases', 'Direct website downloads and release management are planned for a future build. Until then, the site should point players to the live Discord flow while still preparing a cleaner future download path.', `<div class="action-row">${link(ITCH,'VIEW ITCH.IO GAME PAGE','button outline')}${link('/register/','PREPARE A SURVIVOR ACCOUNT','button ghost')}</div>`) +
      section('', 'WHY ACCOUNTS MATTER', 'Future account linking', 'Website accounts will later support email verification, optional Discord linking, TCG linking, and eventually Steam linking so that a player stays connected across the ecosystem.')
    ),

    p('/database/','Survivor Database','Unity-backed SV13 field manual and searchable knowledge base.','database',
      header('FIELD MANUAL','SURVIVOR DATABASE',`Live-generated public field intelligence. Knowledge package ${packageVersion}.`) +
      section('', 'KNOWLEDGE UPLINK', 'Browse the records', 'The original database routes and sprites have been retained. This page is now the gateway into the existing wiki/data structure.', tiles(dbTiles)) +
      banner('SEARCH','Find something specific','Search items, crafting instructions, construction records and other exported knowledge.', link('/search/','SEARCH ALL INTEL'))
    ),

    p('/news/','News & Development','Official news, patch notes and development status.','news',
      header('TRANSMISSIONS','NEWS & DEVELOPMENT','Follow official build updates, development progress and future announcements.')+
      section('', 'LATEST STATUS', 'Active development', 'SV13 Extraction has a playable build available through Discord role approval. Future website posts and version-specific release notes will appear here once the publishing service is connected.', banner('CURRENT PUBLISHING','Discord remains the live source','The Discord development channels remain the active publication path until mirrored website posting is wired in.', link(EXTRACTION_DISCORD,'FOLLOW ON DISCORD'))) +
      section('', 'COMING ONLINE', 'Publishing hub', 'Admin-authored announcements, Discord message mirroring, changelogs and archived devlogs are planned for the next major publishing integration pass.')
    ),

    p('/community/','Community & Contests','Join the SV13 community, contests and lore submissions.','community',
      header('COMMUNITY OPERATIONS','THE COMMUNITY','Meet other survivors, share creations, follow events and help shape the SV13 universe.')+
      section('', 'JOIN THE NETWORK', 'Survivors wanted', 'The official Discord currently hosts events, screenshots, lore submissions, feedback and access to the playable build.', link(EXTRACTION_DISCORD,'JOIN THE COMMUNITY'))+
      section('', 'EVENT BOARD', 'Contests & showcases', 'A website contest manager, submission review process and winners archive are planned. Current events and entry rules remain on Discord until those features launch.', tiles([['01','Community Events','See currently announced community activities',EXTRACTION_DISCORD],['02','Lore Submissions','Contribute story ideas through the community',EXTRACTION_DISCORD],['03','Screenshots','Share your experiences and view media','/media/'],['04','Supporter Roles','Learn about the official support destinations','/support/']]))
    ),

    p('/support/','Support Development','Official SV13 Extraction funding and supporter links.','support',
      header('SUPPORT OPERATIONS','SUPPORT SV13','Help support ongoing development through the official channels.')+
      section('', 'OFFICIAL DESTINATIONS', 'Choose how to help', 'Contribution pages, membership terms and benefits are maintained by their respective providers. Some externally posted totals and descriptions may still lag behind your current progress and will be reconciled later.', `<div class="official-links">${link(KOFI,'KO-FI CREATOR PAGE')}${link(SHOP,'KO-FI SHOP','button outline')}${link(SPOT,'SPOTFUND CAMPAIGN','button outline')}${link(ITCH,'ITCH.IO GAME PAGE','button outline')}</div>`) +
      section('', 'TRANSPARENT PROGRESS', 'Owner-reported support total', 'You currently report more than $1,100 raised across donation sources. The website intentionally avoids showing an automated live total until those external pages and internal records are reconciled properly.')+
      section('', 'SUPPORTER BENEFITS', 'Roles and recognition', 'Existing Discord supporter roles and Ko-fi memberships are being retained as reference material. Exact tier prices, availability and game rewards will be published after review and syncing.')
    ),

    p('/tcg/','SV13 Trading Card Game','SV13 TCG companion experience and planned cross-game collections.','tcg',
      header('CONNECTED UNIVERSE','SV13 TCG','The separate SV13 trading card experience is playable through Discord, with future collection connectivity planned for Extraction.')+
      section('', 'CARD OPERATIONS', 'Build a collection. Challenge survivors.', 'Discover the existing SV13 TCG through its Discord community. Website card browsing, account linking and verified in-game card grants will arrive in later integration passes.', `<div class="action-row">${link(TCG_DISCORD,'JOIN TCG DISCORD')}${link('/account/','ACCOUNT LINKING PLAN','button outline')}</div>`) +
      section('', 'FUTURE INTEGRATION', 'One survivor identity', 'Website accounts, optional Discord linking and later Steam identity will support a unified survivor profile. Once connected, a player’s TCG collection and later in-game reward events can be managed from the same identity layer.')
    ),

    p('/media/','Media Gallery','SV13 Extraction gameplay media and screenshots.','media',
      header('VISUAL RECORDS','MEDIA GALLERY','An official home for gameplay screenshots, trailers and approved community media.')+
      section('', 'PLACEHOLDER ARTWORK', 'Website visuals now in place', 'Until official in-game screenshots and trailers replace them, the site is using generated survival-game placeholder artwork matched to the current SV13 visual direction.', `<div class="art-strip">${artFigure(ART.hero,'Zone overlook artwork','Hero artwork')} ${artFigure(ART.run,'Extraction run artwork','Extraction artwork')} ${artFigure(ART.refuge,'Refuge artwork','Refuge artwork')}</div>`) +
      section('', 'COMING ONLINE', 'Approved media archive', 'A proper media library, curated gallery, and later video embeds can be wired in once the official source material is ready.')
    ),

    p('/roadmap/','Development Roadmap','SV13 Extraction development progress and planned website systems.','roadmap',
      header('OPERATIONS BOARD','DEVELOPMENT ROADMAP','A public view of development progress with a distinction between what exists now and what comes next.')+
      section('', 'CURRENT STATUS', 'Playable build available', 'Access is currently managed through approved Discord roles. The expanded website shell is live, the Survivor Database remains working, and placeholder account entry points are now visible.')+
      section('', 'NEXT WEBSITE SYSTEMS', 'Near-term build targets', 'The next major milestones are real account backend/auth, Discord publishing integration, website-hosted downloads, and deeper TCG / player-profile connectivity.')
    ),

    p('/account/','Survivor Accounts','SV13 unified identity and account linking roadmap.','account',
      header('IDENTITY CONTROL','SURVIVOR ACCOUNTS','One future identity connecting the website, Discord, SV13 TCG and later Steam.')+
      section('', 'ACCOUNT ENTRY', 'Visible account routes are now in place', 'This pass exposes account-oriented pages and navigation so the site clearly shows where account systems will live. The secure backend for actual registration and login still needs to be implemented.', `<div class="action-row">${link('/register/','REGISTER','button')}${link('/login/','LOG IN','button outline')}${link('/player-overview/','PLAYER OVERVIEW','button ghost')}</div>`) +
      section('', 'IDENTITY PLAN', 'Optional platform connections', 'Each website account should have a stable internal survivor ID. Discord, TCG, and later Steam identities will be linked independently so the player remains connected across the whole ecosystem.') +
      section('', 'FUTURE PLAYER OVERVIEW', 'A connected survivor profile', 'Once account services are live, the site can expand into a player overview area showing account links, TCG profile, progression stats, refuge status, gear snapshots and other approved game-connected information.')
    ),

    p('/register/','Register Survivor Account','Create a future SV13 survivor account.','account',
      header('ACCOUNT CREATION','REGISTER','Create a future survivor identity that can later connect the website, Discord, TCG and the main SV13 Extraction title.')+
      section('', 'STAGING AREA', 'Registration UI is now visible', 'This is the planned account creation surface. It is intentionally non-functional until secure backend registration, email verification and data policy support are wired in.', authShell('register'))+
      section('', 'WHAT IT WILL UNLOCK', 'Why create an account?', 'A single survivor identity can later support website access, TCG linking, optional Discord verification, future Steam verification, and a player overview connected to your activity across the SV13 ecosystem.')
    ),

    p('/login/','Log In','Log in to a future SV13 survivor account.','account',
      header('AUTHENTICATION','LOG IN','Account entry points are now visible so the website structure reflects the planned direction of the platform.')+
      section('', 'STAGING AREA', 'Login page present, backend pending', 'This page exists now so users can see where account access will live, but no live authentication, sessions, recovery or remember-me logic is enabled yet.', authShell('login'))+
      section('', 'IN THE MEANTIME', 'Current live access path', 'For the actual playable build today, the official Discord remains the live access path.', `<div class="action-row">${link(EXTRACTION_DISCORD,'OPEN EXTRACTION DISCORD')}${link('/play/','VIEW PLAY INSTRUCTIONS','button outline')}</div>`)
    ),

    p('/player-overview/','Player Overview','Future connected player overview for SV13 survivor accounts.','account',
      header('SURVIVOR PROFILE','PLAYER OVERVIEW','A future at-a-glance dashboard for your linked SV13 identity.')+
      section('', 'PLANNED PROFILE DATA', 'What this page can eventually show', 'Once the account layer and game-side services are connected, this page can become a personalized overview for SV13 Extraction and TCG.', `<div class="stats-grid"><div class="stat-box"><strong>Account links</strong><span>Website · Discord · TCG · Steam</span></div><div class="stat-box"><strong>Extraction status</strong><span>Build access, refuge tier, progression hooks</span></div><div class="stat-box"><strong>Loadout snapshot</strong><span>Current or recent approved gear state</span></div><div class="stat-box"><strong>TCG collection</strong><span>Decks, owned cards, challenges and rewards</span></div><div class="stat-box"><strong>Milestones</strong><span>Stats, completions, achievements, contest wins</span></div><div class="stat-box"><strong>Supporter status</strong><span>Verified supporter perks and memberships</span></div></div>`)+
      section('', 'NOT LIVE YET', 'Backend and security first', 'This page should not show fake data. It becomes useful only after real account services, trusted game data inputs, and TCG synchronization are implemented.')
    ),

    p('/about/','About SV13 Extraction','About the SV13 Extraction project.','about',
      header('PROJECT DOSSIER','ABOUT SV13','SV13 Extraction is an actively developed survival extraction game with a playable community build.')+
      section('', 'OFFICIAL HUB', 'Your starting point', 'Learn the game, join the current Discord build, consult the field manual and follow development from one place.', `<div class="action-row">${link('/game/','EXPLORE THE GAME')}${link('/database/','VISIT THE FIELD MANUAL','button outline')}</div>`) +
      section('', 'WEBSITE DIRECTION', 'More than just a wiki', 'The goal is to expand the current database site into the full public-facing hub for discovery, onboarding, accounts, news, community, contests, support, and later player-connected systems.')
    ),

    p('/privacy/','Privacy & Data','SV13 website privacy information and service notice.','privacy',
      header('NETWORK NOTICE','PRIVACY & DATA','This static website does not currently provide active member account registration or collect live account registration data.')+
      section('', 'CURRENT WEBSITE', 'Static content today', 'The current website serves public informational pages and the searchable field manual. External links lead to third-party services governed by their own terms and privacy policies.')+
      section('', 'BEFORE ACCOUNT LAUNCH', 'Policy still required', 'A complete privacy policy, retention schedule, account deletion workflow, password policy, verification process and support contact path must be finalized before live website registration is enabled.')
    )
  ];
}
