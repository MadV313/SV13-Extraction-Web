# SV13 Extraction Web

Official SV13 Extraction website and Unity-backed Survivor Database.

This repository intentionally keeps the public game website and the machine-generated field manual in one static Cloudflare Worker deployment. The authored site pages, account/login staging pages, community/support/TCG routes, placeholder artwork, Discord destinations, and existing item/crafting/construction wiki routes remain intact while the latest Unity knowledge package adds richer scene intelligence.

## Current website sections

- Official home / game / play / news / community / support / TCG / media / roadmap pages
- Visible account, register, login, and future player-overview staging routes
- Global search
- Item index and item detail pages
- Crafting manual and recipe pages
- Construction manual and buildable pages
- Farming and fishing guides
- Recovered documents / codex
- Maps enriched with captured scene activities, Boren upgrades, found documents, special systems, and linked weather/UI intelligence
- Weather & Survival guide from `weather.json`
- HUD & Icon Guide from `ui.json`
- Exact machine-readable package under `/knowledge/...`
- In-game sprites/thumbnails/UI icons bundled from the Unity project

The secure account backend is **not** implemented yet. Register/login inputs remain intentionally disabled until authentication, verification, sessions, recovery, privacy, and linked-service storage are ready.

## Requirements

- Node.js 20+
- Local Unity project available when rebuilding the media bundle

## Normal local update from Unity

The easiest path is now one command from the web repository root:

```bat
npm run update:unity -- "C:\Unity Projects\TestAssets"
```

That command runs the raw knowledge sync, rebuilds the item/buildable/map/UI media bundle directly into the repository copy, validates it, and rebuilds the site. Then run:

```bat
npm run preview
```

The underlying manual sequence is still available if you need to diagnose a step:

```bat
npm run knowledge:sync -- "C:\Unity Projects\TestAssets\SV13_Knowledge\Latest"
npm run media:build -- --unity-project "C:\Unity Projects\TestAssets" --knowledge ".\knowledge\Latest"
npm run check
npm run build
```

**Important:** run `knowledge:sync` first and then build the media bundle directly into the repository copy. `knowledge:sync` replaces `knowledge/Latest`, so running it after media bundling would remove the generated `media_index.json` and `sv13_media_*` files.

`npm run check` now refuses to pass when the media bundle is missing. This prevents a raw Unity JSON-only update from accidentally deploying a site/bot package with all game/UI imagery removed.

## What to verify locally

Open the preview URL and check at minimum:

```text
/
/database/
/items/
/recipes/
/buildings/
/maps/
/maps/player-cabin/
/weather/
/weather/player-cabin/
/ui/
/codex/
/search/
/register/
/login/
/player-overview/
/knowledge/manifest.json
```

On `Player Cabin`, confirm Boren upgrades, found documents, Skill Point Terminal, activities and the Weather & Survival link appear. In `/ui/`, confirm real HUD icons such as Health/Stamina/weather warnings display after media bundling.

## Cloudflare deployment

The existing deployment remains **Cloudflare Workers Static Assets**, not a separate replacement site.

- Production branch: `main`
- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`
- Root directory: repository root
- Current custom domain route in `wrangler.jsonc`: `sv13ext.com`

`npm run build` runs the knowledge/media validation before generating `dist/`, so Cloudflare will stop instead of publishing a media-less knowledge package.

## Current official Discord destinations

These remain configured in `src/official-pages.mjs`:

- SV13 Extraction: `https://discord.gg/vUUwQ7XAYY`
- SV13 TCG: `https://discord.gg/SRPzZWQJPf`

## Bot integration

The same hosted package feeds the Railway Discord bot:

```text
https://sv13ext.com/knowledge/manifest.json
https://sv13ext.com/knowledge/areas.json
https://sv13ext.com/knowledge/weather.json
https://sv13ext.com/knowledge/ui.json
https://sv13ext.com/knowledge/media_index.json
```

See `BOT_INTEGRATION.md` and `CONTENT_PIPELINE.md`.
