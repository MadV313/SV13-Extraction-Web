# SV13 Extraction — Website Expansion Pass 1

## Patch contents
- `tools/build-site.mjs`: official site routing, shared navigation, homepage swap, search-index integration, existing wiki retained.
- `src/official-pages.mjs`: twelve official pages and configurable public destination links.
- `src/site.css`: cinematic landing and survivor-terminal styling with responsive layout.
- `src/site.js`: accessibility improvement for mobile menu, escaping dynamic search result content.

## Apply
Extract this patch into the **root of the existing `SV13-Extraction-Web-main` repository**, preserving its folders and allowing replacement of the three existing files. `src/official-pages.mjs` is new. Do not remove your existing knowledge directory, tools, or other source files. Never upload `.env` or secrets to a public GitHub repo.

## Local test
1. Install Node.js 20+.
2. From the repo root, run `npm run check` then `npm run build`.
3. Run `npm run preview` and open the URL shown by the preview server.
4. Verify `/`, `/game/`, `/play/`, `/database/`, `/news/`, `/community/`, `/support/`, `/tcg/`, `/media/`, `/roadmap/`, `/account/`, `/about/` and `/privacy/`.
5. Open older links such as `/items/`, `/recipes/`, `/buildings/`, `/crops/`, `/search/` and an individual item page to ensure compatibility.
6. Use search to find a website section AND a game item. Test navigation on narrow/mobile screens.
7. Confirm Discord invitation and Ko-fi, Spotfund, itch.io URLs; update destination constants in `src/official-pages.mjs` if needed.
8. Commit the changed sources, run CI, and deploy using your existing Cloudflare process only after preview passes.

## Accuracy/availability
- Discord invite was transcribed from supplied imagery and must be confirmed live before release.
- No signup backend, email verification, OAuth, live TCG collection, payment verification or download hosting exists in this static package; links to those are informational rather than fake working forms.
- The owner-reported total is described as 'more than $1,100' and NOT displayed as a live verified total.
- Cinematic hero uses CSS atmosphere for now, not purported gameplay screenshots. Real game artwork can replace it.
- Public `/knowledge/` export behavior remains unchanged; separately audit for spoilers before public deployment.

## Next passes
- PASS 2: approved game screenshots/trailer, better mobile and accessibility testing, current official descriptions and media.
- PASS 3: backend/auth/email confirmation, secure sessions, recovery, optional Discord account linking.
- PASS 4: official publishing/admin console, approved Discord mirroring and content backfill.
- PASS 5: release storage & signed downloads, contest workflows and supporter records.
- PASS 6: connected TCG identity/collection with verified in-game events; Steam when available.

This patch includes changed source files only. Generated `dist/`, unchanged Unity knowledge exports, and untouched source files are intentionally omitted.
