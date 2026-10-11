# SV13 Website — Patch matched to SV13-Extraction-Web-main (1).zip

This patch was compared byte-for-byte against the ZIP you uploaded in this turn and includes ONLY files that differ or do not exist in that ZIP.

## Apply
Extract into the repository ROOT (the directory with package.json). Preserve the src/ and tools/ paths. Overwrite the existing three code files. Add the four PNGs in src/official-art/. Do not delete any other files. Commit and push these files to the actual GitHub branch used by Cloudflare deployment; a local ZIP alone does not change the live website.

## Local test
npm run check
npm run build
npm run preview

Review `/`, `/game/`, `/play/`, `/tcg/`, `/register/`, `/login/`, `/player-overview/` and `/database/`. Confirm `/items/` and `/recipes/` still work.

## Changes
- Extraction Discord: https://discord.gg/vUUwQ7XAYY
- TCG Discord: https://discord.gg/SRPzZWQJPf
- Four generated placeholder art images; asset copier wired into build.
- Updated Game page with anchors for extraction runs, persistent refuge, and threats; old wiki links preserved.
- Visible Register and Login links in desktop header and new account pages.
- New player overview planning route for future stats, equipment and TCG records.

## Not yet implemented
Registration/login pages are NON-FUNCTIONAL displays, not real accounts: inputs disabled. Requires secure server backend, email delivery, database migrations, sessions, password reset, Discord OAuth and privacy controls. Do not interpret these pages as finished auth.

## Validated
npm run check passed; npm run build passed; 395 routes, 385 search records, 289 media records; 0 broken local HTML link/asset destinations in generated output. Browser/live deploy not tested.
