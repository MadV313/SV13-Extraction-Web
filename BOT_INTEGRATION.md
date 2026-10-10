# Discord / Railway integration

The website is deliberately built from the same knowledge package as the bot.

Once `https://sv13ext.com/knowledge/manifest.json` is live and verified, update Railway:

```text
WEB_BASE_URL=https://sv13ext.com
SV13_KNOWLEDGE_BASE_URL=https://sv13ext.com/knowledge
SV13_KNOWLEDGE_CACHE_DIR=/data/knowledge-cache
STATE_DB_PATH=/data/sv13_bot.sqlite3
AUTO_SYNC=true
AUTO_PUBLISH=false
```

Keep the persistent Railway volume.

The existing bot's remote knowledge source will download the manifest-listed JSON **and media files**, verify their hashes, cache them on the volume, and the v0.2 media resolver can then attach the appropriate in-game sprite to Discord embeds.

After changing the variables:

1. Redeploy the bot.
2. Confirm the log reports a `remote:https://sv13ext.com/knowledge` knowledge source.
3. Run `/sv13status`.
4. Test `/item Carrot`, `/crop Cabbage`, `/building GreenHouse`, and `/recipe .45 ACP`.
5. Verify sprites appear.
6. Keep `AUTO_PUBLISH=false` until permanent forum posts are reviewed.

Do not delete the Railway volume; it still stores SQLite publication/channel state and the verified remote cache.
