# @plexus-ms/brand

The Plexus visual identity as a versioned dependency: the PLX-02 "Crossing" mark,
design tokens, and React components. The human-readable spec lives in the
compendium at [`miscellaneous/brand`](https://github.com/plexus-ms/compendium/tree/main/miscellaneous/brand);
this package is the machine-readable source of truth for assets.

## What's inside

| Entry | Contents |
| --- | --- |
| `@plexus-ms/brand` | Tokens (`colors`, `fonts`, `typeScale`, `wordmark`) and the generated mark geometry. |
| `@plexus-ms/brand/react` | `<Mark/>`, `<Wordmark/>`, `<BraidBand/>` (React 19 peer, optional). |
| `@plexus-ms/brand/brand.css` | All tokens as `--plx-*` custom properties, with `.dark` role-token overrides. |
| `@plexus-ms/brand/assets/*` | Standalone SVGs: `mark`, `mark-small`, `mark-twotone`, `mark-dark`, `favicon`, `avatar`, `braid-band`; plus `avatar.png` (1024×1024). |

## Construction

Every asset derives from one set of geometry constants in
`scripts/generate-assets.mjs`. The over-under gap of the crossing is cut
*geometrically* (real sub-paths found numerically, split via de Casteljau) so
the marks work on any background — no ground-colored halo tricks. The script
emits both the SVG files and `src/geometry.generated.ts`, so the React
components render the exact same paths: decide once, propagate.

The one raster in the set is `assets/avatar.png` — the GitHub org profile
picture, which cannot be an SVG. It is rendered from `assets/avatar.svg` via
[`sharp`](https://sharp.pixelplumbing.com) in the same script, so it never
drifts from the source. To refresh the org avatar, run `pnpm generate` and
upload `assets/avatar.png` under **Organization → Settings → Profile picture**.

Regenerate after changing geometry:

```sh
mise run generate   # or: pnpm generate
```

## Deliberately deferred

- Outlined-text wordmark SVGs (`wordmark.svg`) — need font-outlining tooling;
  use `<Wordmark/>` on the web (requires IBM Plex Mono 700 in context).
- Raster favicons / apple-touch icons — `assets/favicon.svg` (with embedded
  `prefers-color-scheme`) covers modern browsers.
