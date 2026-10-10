# SV13 content pipeline

The authoritative direction is:

```text
Unity
  → SV13_Knowledge/Latest
  → media bundle
  → SV13-Extraction-Web/knowledge/Latest
  → Cloudflare Workers Static Assets
  → sv13ext.com
       ├─ player-facing field manual
       ├─ /knowledge machine package
       └─ sprites/thumbnails
  → Railway Discord bot remote cache
```

## Normal update

From the web repository root:

```bat
node tools\build-media-bundle.mjs --unity-project "C:\Unity Projects\TestAssets"
node tools\sync-knowledge.mjs "C:\Unity Projects\TestAssets\SV13_Knowledge\Latest"
npm run check
npm run build
```

Then commit/push.

`sync-knowledge.mjs` replaces the repository copy atomically after validating the source package.

## Presentation vs raw data

The website does not rewrite the authoritative Unity JSON. Internal names such as `SV13_GreenHouse`, `FPS_RarityLevel_Epic`, `HQFPS_45 ACP`, and `STP_Log` remain available in `/knowledge` for auditing.

The public UI applies a presentation layer and displays `GreenHouse`, `Epic`, `.45 ACP`, and `Log`.
