# Discord / Railway integration

The website and Discord bot deliberately consume the same hosted knowledge package.

Railway production values remain:

```text
WEB_BASE_URL=https://sv13ext.com
SV13_KNOWLEDGE_BASE_URL=https://sv13ext.com/knowledge
SV13_KNOWLEDGE_CACHE_DIR=/data/knowledge-cache
STATE_DB_PATH=/data/sv13_bot.sqlite3
AUTO_SYNC=true
AUTO_PUBLISH=false
```

Keep the persistent Railway volume.

The hosted package now includes the original definitions plus:

```text
/knowledge/areas.json
/knowledge/weather.json
/knowledge/ui.json
/knowledge/media_index.json
/knowledge/sv13_media_...
```

The web media bundler now includes authoritative HUD/UI icon paths as well as item, buildable and map artwork, allowing the v0.3 bot's `/ui` embeds to resolve the same assets used by the website.

## Post-deploy checks

After the website has deployed the new package:

1. Confirm `/knowledge/manifest.json` reports package `20261011-181816` (or the newest later package).
2. Confirm `/knowledge/media_index.json` loads and is non-empty.
3. Run `/sv13sync` in Discord.
4. Run `/sv13status`.
5. Test `/map Player Cabin`.
6. Test `/weather Player Cabin`.
7. Test `/ui Health`, `/ui Stamina`, `/ui Blizzard`, and `/ui Skill Point`.
8. Verify item/building/UI images appear.
9. Keep `AUTO_PUBLISH=false` until permanent forum updates have been reviewed.

Do not delete the Railway volume; it stores SQLite publication/channel state and the verified remote cache.
