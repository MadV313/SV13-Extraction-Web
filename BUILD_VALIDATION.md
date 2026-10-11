# Build validation

Validated against the supplied final Player Cabin knowledge package.

- Knowledge package: `20261011-181816`
- Knowledge schema: `4`
- Project Intelligence toolkit: `0.9.1`
- Public items: `217`
- Public confirmed recipes: `71`
- Public buildables: `30`
- Public crops: `7`
- Public recovered documents: `33`
- Public levels/maps: `7`
- Fully captured public areas: `1` (`Player Cabin`)
- Public weather profiles: `1`
- Public HUD/UI guide records: `317`
- Public bait records: `3`
- Public fishing catch records: `3`
- Validation errors reported by Unity: `0`

## Website generation validation

With a complete media-bundle test fixture:

- Media references discovered from the final package: `430`
- Bundle-supported file references: `428`
- Expected unsupported Unity-only resources: `2`
- Generated routes: `715`
- Generated HTML files including 404: `716`
- Generated search records: `705`
- Internal href/src references checked: `18,900`
- Broken internal links/assets: `0`
- JavaScript syntax checks: PASS
- Player Cabin map enrichment assertion: PASS
- Weather / stamina / health guide assertion: PASS
- HUD & Icon Guide assertion: PASS

The two unsupported media references are Unity resources rather than normal web image files (`.renderTexture` / built-in Unity resource). The website safely falls back instead of attempting to expose them.

Actual media files must still be bundled from the user's local Unity project before deployment; the source upload itself did not contain `media_index.json` or any `sv13_media_*` files.
