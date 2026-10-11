# SV13 content pipeline

The authoritative direction is:

```text
Unity
  → SV13_Knowledge/Latest
  → SV13-Extraction-Web/knowledge/Latest (raw sync)
  → web media bundler reads Unity Assets
       ├─ item/buildable/map artwork
       └─ authoritative HUD/UI icon artwork
  → media_index.json + sv13_media_* files
  → validation + static site build
  → Cloudflare Workers Static Assets
  → sv13ext.com
       ├─ official game website
       ├─ Survivor Database
       ├─ map / weather / UI guides
       └─ /knowledge machine package + media
  → Railway Discord bot remote cache
```

## Normal update

Preferred one-command flow from the web repository root:

```bat
npm run update:unity -- "C:\Unity Projects\TestAssets"
```

Then:

```bat
npm run preview
```

Manual equivalent:

```bat
npm run knowledge:sync -- "C:\Unity Projects\TestAssets\SV13_Knowledge\Latest"
npm run media:build -- --unity-project "C:\Unity Projects\TestAssets" --knowledge ".\knowledge\Latest"
npm run check
npm run build
```

Then review locally, commit, and push.

### Why this order matters

`knowledge:sync` atomically replaces `knowledge/Latest` with the current Unity export. That raw Unity package intentionally does not contain the web-generated media bundle.

Therefore **do not** run the media bundle first and then sync. The sync would delete it.

The media build must happen against the repository copy after the sync. It adds:

```text
knowledge/Latest/media_index.json
knowledge/Latest/sv13_media_*.png/.jpg/.webp/...
```

and updates the copied manifest so the website and Discord bot can hash-verify those files.

## Knowledge schema 4 datasets used by the website

The current site consumes:

```text
items.json
recipes.json
item_categories.json
buildables.json
build_materials.json
crops.json
fishing.json
documents.json
levels.json
loot_tables.json
areas.json
weather.json
ui.json
validation.json
```

`areas.json`, `weather.json`, and `ui.json` are now required by validation.

## Presentation vs raw data

The website does not rewrite the authoritative Unity JSON. Raw Unity identifiers remain available under `/knowledge` for auditing.

The public site applies a presentation layer and cross-links the data into player-facing pages. Raw scene-system inventories remain out of the normal UI; the website uses the curated area/weather/UI records exported by Project Intelligence.
