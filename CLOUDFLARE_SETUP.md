# Cloudflare setup — sv13ext.com

## 1. GitHub

Create/push this repository as:

`SV13-Extraction-Web`

The `main` branch should contain this repository root directly (do not place the project inside another folder).

## 2. Import to Cloudflare Workers

Cloudflare Dashboard → **Workers & Pages** → **Create application** → **Import a repository**.

Select `SV13-Extraction-Web`.

Use:

- Production branch: `main`
- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`
- Root directory: repository root / blank
- Environment variables: none required for the initial release

The repository's `wrangler.jsonc` deploys `dist/` using Workers Static Assets.

## 3. Verify the workers.dev preview

Before attaching the real domain, confirm:

- `/`
- `/search/`
- `/items/`
- `/recipes/`
- `/buildings/`
- `/crops/`
- `/fishing/`
- `/maps/`
- `/codex/`
- `/knowledge/manifest.json`
- a few item/building pages with sprites

## 4. Attach sv13ext.com

Open the Worker → Settings / Domains & Routes → Add Custom Domain → `sv13ext.com`.

Cloudflare should provision the DNS/SSL association for the Worker.

Do not create a second origin/server just for the website.

## 5. www redirect

Use a Cloudflare Redirect Rule:

- Incoming hostname equals `www.sv13ext.com`
- Redirect to `https://sv13ext.com${uri}`
- Preserve query string
- Permanent (301)

## 6. Then move Discord to the hosted knowledge package

See `BOT_INTEGRATION.md`.
