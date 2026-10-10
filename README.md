# SV13 Extraction Web

Official web field manual / Survivor Database for **SV13 Extraction**.

This repository is intentionally simple: the site is generated as static HTML from the same authoritative `SV13_Knowledge/Latest` package used by the Discord bot. No database, server runtime, or framework dependency is required for the first release.

## What is included

- Home / Survivor Database landing page
- Global search + autocomplete
- Item index and item detail pages
- Crafting manual and recipe detail pages
- Construction manual and buildable detail pages
- Farming / crop field notes
- Fishing guide
- Maps / level intel
- Recovered document / codex pages
- Player-facing name cleanup matching the Discord bot
- Direct use of the exported in-game sprites/thumbnails
- Exact raw Unity knowledge package exposed at `/knowledge/...`
- Cloudflare Workers Static Assets configuration

## Local build

Node.js 20+ is the only local requirement.

```bash
npm run check
npm run build
npm run preview
```

Then open `http://127.0.0.1:8788`.

## Refresh from Unity

After Unity builds `SV13_Knowledge/Latest`:

```bat
node tools\build-media-bundle.mjs --unity-project "C:\Unity Projects\TestAssets"
node tools\sync-knowledge.mjs "C:\Unity Projects\TestAssets\SV13_Knowledge\Latest"
npm run check
npm run build
```

Commit and push the updated `knowledge/Latest` folder. Cloudflare will rebuild the site from the new authoritative package.

## Cloudflare deployment

Use **Cloudflare Workers**, not a new Pages project.

1. Push this repository to GitHub as `SV13-Extraction-Web`.
2. Cloudflare Dashboard → Workers & Pages → Create application → Import a repository.
3. Select this repository.
4. Build command: `npm run build`
5. Deploy command: `npx wrangler deploy`
6. No environment variables are required for v0.1.
7. Deploy first to the generated `*.workers.dev` URL and verify it.
8. Add `sv13ext.com` as the Worker custom domain.
9. Add a Cloudflare redirect from `www.sv13ext.com/*` to `https://sv13ext.com/$1`.

See `CLOUDFLARE_SETUP.md` for the exact setup/checklist.

## Discord integration after the site is live

The live site exposes the complete knowledge package here:

```text
https://sv13ext.com/knowledge/manifest.json
https://sv13ext.com/knowledge/items.json
https://sv13ext.com/knowledge/media_index.json
https://sv13ext.com/knowledge/<sprite filename>
```

That allows the existing bot to move off the manually uploaded Railway knowledge folder. See `BOT_INTEGRATION.md`.
