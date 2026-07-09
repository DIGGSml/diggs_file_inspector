# DIGGS File Inspector — Project Memory

## What this project is

A standalone, single-file HTML/JS tool (`diggs_file_inspector.html`, ~13,400 lines)
for parsing, visualizing, and inspecting DIGGS (Data Interchange for Geotechnical
and Geoenvironmental Specialists) XML files in the browser. No build step, no
bundler — CDN-embedded dependencies only (proj4js, Leaflet 1.9.4). Dark theme.

Repo contains:
- An example DIGGS XML instance file
- A `snippets and plan docs/` directory that contains some prior session handoff docs (read the most recent one
  first when starting a new session) — it has "Known Working State" and
  "Potential Next Items" sections that are more current than this file). The directory also contains xml snippets
   from the DIGGS Schema as text files. You can ignore those and instead refer to the active schema repo at: https://github.com/DIGGSml/schema-dev/tree/3.1-dev
 
- `README.md`(Github README explaining the application.
## Keeping this file current

This file is auto-loaded into every session's context, so it's trusted by
default — a stale claim here is worse than no claim (e.g. a prior "dead code"
list here was half wrong and would have broken working code if trusted
blindly; see "Known flagged / unvalidated areas" below).

**After completing a task, update this file if the change:**
- touches something already documented here — an architecture note, a listed
  function's described behavior, a "Working conventions" rule, or an entry in
  "Known flagged / unvalidated areas" — correct or remove the stale claim;
- introduces a new shared helper, cache, or convention future sessions should
  reuse instead of re-implementing from scratch;
- resolves, downgrades, or newly discovers a "Known flagged / unvalidated"
  item;
- changes domain context (schema/CRS/unit assumptions) that "Domain context"
  relies on.

**Skip it** for trivial fixes, pure exploration, or changes that don't touch
anything documented here — don't pad this file with routine work.

When updating: prefer a small targeted edit (correct a stale line, add one
dated note) over rewriting the surrounding section, and double-check any
function/line references you add are still accurate — don't propagate a
claim you haven't verified against the current code.

## DIGGS Schema Reference

This application targets the active DIGGS 3.1-dev development schema,
maintained at https://github.com/DIGGSml/schema-dev/tree/3.1-dev.

A local clone already exists as a sibling directory: `../schema-dev`. It's
managed via GitHub Desktop and edited in Oxygen as part of the normal DIGGS
schema-development workflow (not part of this repo — never edit or commit
its contents from here). It should generally be current, but active
development may mean uncommitted or unpushed local edits exist that predate
what's on the `3.1-dev` remote branch.

**When authoring a DIGGS XML instance, determining an XPath, or verifying
that a config accounts for every schema element/attribute:** read the actual
XSD files under `../schema-dev` directly (Read/Grep), rather than WebFetching
GitHub pages. WebFetch summarizes fetched content through a secondary model
before it reaches you — fine for a quick "does this element exist" check,
but not reliable for exhaustive, verbatim schema detail (e.g. confirming
every child element of a complex type is present in a config).

Before relying on it, check `../schema-dev` exists (`ls ../schema-dev`) and
sanity-check recency if the task is precision-sensitive (`git -C
../schema-dev log -1`, `git -C ../schema-dev status`). If it's missing, ask
the user rather than falling back to a WebFetch summary of the GitHub page.

## Working conventions

- **No build step.** This is a single `.html` file with `<script>` blocks.
  Never introduce a bundler, package.json, or module system unless explicitly
  asked — the whole point is that it runs by opening the file in a browser.
- **Verify syntax after every edit.** Extract and concatenate all `<script>`
  blocks and run `node --check` on the result before considering an edit done:
  ```bash
  python3 -c "
  import re
  content = open('diggs_file_inspector.html').read()
  scripts = re.findall(r'<script[^>]*>(.*?)</script>', content, re.DOTALL)
  open('/tmp/check.js','w').write('\n;\n'.join(scripts))
  "
  node --check /tmp/check.js
  ```
- **Prefer numeric verification over eyeballing** for anything involving unit
  conversion, CRS math, or geometry — write a small standalone `node` harness
  reproducing the relevant function(s) against real XML values from the repo's
  example files (or values the user pastes from a screenshot) before declaring
  a fix correct.
- Match the existing code's style: no semicolon-free style, template literals
  for HTML string building, `const`/`let` (no `var`), JSDoc-style block comments
  above non-trivial functions explaining *why*, not just what.
- When fixing a bug, prefer the minimal targeted `str_replace`-style edit over
  a rewrite of the surrounding function, so diffs stay reviewable.

## Architecture reference

**Rendering pipeline is config-driven**, not hardcoded per sampling-feature
type: `SF_DETAIL_DESCRIPTORS`, `KV_FORMAT`, `FORMAT_FN`, `renderKVTable()`,
`renderFields()`/`itemsToHtml()`, `buildIntervalTable()`. Adding/changing a
displayed field should usually mean editing a descriptor/config object, not
writing new rendering logic. Two rendering pipelines exist:
- `renderKVTable()` — descriptor objects `{label, path, rawFormat, ...}`
- `renderFields()`/`showDetailPopup()` — field arrays with `composite`,
  `parentPath`, `guardPath`, `subHeader`, `showEmpty`

**SF Detail pane (`#detail-panel`, the middle column) — two nested scroll
regions** built by `showSFDetail()`/`showDetail()`:
- `#detail-content-fixed` — height-capped at 50% (`max-height:50%`,
  `overflow-y:auto`), holds section 1 (header) and section 2
  (`buildSFCommonGrid()` — coordinates/elevation).
- `#detail-content-scroll` — fills the rest, freely scrollable. Holds section
  3 (associated-data badge grids, see below) followed by section 4
  (`renderSFMetadata()` — the config-driven `SF_DETAIL_DESCRIPTORS` output).
  Both are injected together in `showSFDetail()` after `showDetail()` creates
  the two containers.
- **Associated-data badges are grouped into three independently-collapsible
  grids** via `ASSOC_BADGE_CATEGORIES` (2026-07-08) — `samples` ("Sampling
  and Samples"), `observations` ("Observations"), `measurements`
  (everything else — BH/CPT measurement badges, monitor sections, the CPT
  profile badge). `buildAssocBadges()` tags each badge object with a
  `category` key; `renderBadgeGrid()` groups by category and skips any
  category with zero badges (no empty title/grid emitted). **When adding a
  new badge kind, tag it with the matching `category` — don't add a new
  section-title string inline.** Collapse mechanism reuses the existing
  `toggleKVSection()` / `.kv-tri` pattern from `renderKVTable()`'s
  `kv-section-header` — both use a row/badge-count default-open rule
  (2026-07-08): a badge-grid category starts expanded when it holds ≤2
  badges (one row of the 2-column grid), collapsed otherwise; a `kv-section`
  starts expanded when it holds exactly one row, collapsed otherwise. Both
  also share the same divider styling — `.sf-assoc-section-title` mirrors
  `.kv-section-header`'s `border-top`/`margin-top` rule so every section
  (badge-grid or metadata) gets a line above it and no trailing whitespace
  below. **Horizontal padding for badge grids comes from `.sf-assoc-section`
  itself** (`padding:0 16px`, vertically unpadded) — the plain wrapper
  `showSFDetail()` puts around `renderBadgeGrid()`'s output only adds
  `padding-top:10px` (no horizontal/bottom) for vertical parity with the
  section-4 metadata block's own top offset. **Don't reintroduce horizontal
  or bottom padding on that outer wrapper** (e.g. by reusing the
  `.detail-section` class there) — it previously double-padded the grids
  horizontally against `.sf-assoc-section` and left a trailing gap/border
  below the last category grid; both were reported and fixed 2026-07-08.

**Map rendering: `sf.polygonLatLngs` is computed generically for every
planar SF type, regardless of `SF_TYPE_CONFIG[type].mapGeom`** (2026-07-08
finding, confirmed while switching `TrenchWall` from point→polygon).
`parseSamplingFeature()` always attempts featureExtent ring extraction +
WGS84 transform (`posListToLatLngs()` drops Z, i.e. already projects onto
the horizontal plane) and stores the result on `sf.polygonLatLngs` whether
or not the type is configured to render as a polygon. `initMap()`'s
per-SF-type loop is what actually gates rendering, purely on
`cfg.mapGeom === 'polygon'` — so **making an existing point-rendered planar
SF type (e.g. a future flip of `PlanarSamplingFeature`/
`VolumetricSamplingFeature`) render as a polygon is just a config change**:
set `mapGeom: 'polygon'` and give `marker` polygon-style fields
(`color`/`weight`/`fillColor`/`fillOpacity`/`opacity`, see `TrenchWall`/
`GP_ArealSurvey`) — no new geometry-extraction code needed, and the
point-marker fallback (for unresolvable/local CRS), click/selection, popup,
and legend all key off `cfg.mapGeom` generically already. Known gap in the
underlying extraction: see "Polygon ring extraction... does not search
`MultiSurfaceAggregate`" below. **Also note**: `GP_ArealSurvey`'s `marker`
has a `fillColor: '##4843a3'` double-`#` typo (pre-existing, not yet fixed)
— produces `NaN` channels in the map-legend's `hexToRgba()`; don't copy it
when adding new polygon-style marker configs.

**Shared helpers/caches (2026-07-08 shortening/efficiency pass)** — use these
instead of re-writing the patterns they replaced:
- `getIdIndex(doc)` — lazily-built `Map` of `gml:id`/`id` → element per
  Document (WeakMap-cached, self-invalidating on file reload). **Never use
  `querySelector('[*|id="…"]')` for id lookups** — it walks the whole document
  per call; the index is O(1). `resolveHref(el)` follows an `xlink:href`
  fragment via this index.
- `parseEPSG()` is memoized by srsName (`_PARSE_EPSG_CACHE`); callers must not
  mutate the returned `{horiz, vert}` object (all current callers destructure).
- `toWGS84()` caches proj4 converter objects per EPSG code
  (`_PROJ_CONV_CACHE`) — proj4's 3-arg form re-parses both proj-strings on
  every call, so per-vertex loops must go through `toWGS84`, not raw `proj4()`.
- `getXPathExpr(doc, expr)` — compiled-XPath cache used by `xpathNS`, `xFirst`,
  and `evalXPath`. The cache key includes the current `NS.diggs` binding
  because `detectDiggsNS()` rebinds it per loaded file and `createExpression`
  resolves prefixes at compile time — keep that invariant if touching it.
- `numTokens(text, keepNaN)` — whitespace-separated numeric list parsing
  (posList, DIGGS parallel arrays). Pass `keepNaN=true` when positional
  alignment with a sibling parallel array must be preserved.
- `vertDatumLabel(srsName, datumRef)` — vertical-datum display label shared by
  `renderElevRef` and `renderLTPElevAttr`.
- `SF_ID_SECTION` / `SF_TRAILING_SECTIONS` / `SF_OTHER_PROPS_SECTION` —
  shared descriptor blocks spread into `SF_DETAIL_DESCRIPTORS` type arrays.
  New SF types should spread these rather than copy-pasting the stanzas.

**Considered and deferred (2026-07-08 — don't re-litigate from scratch):**
`dEl()`-style namespace-accessor helper (~50 mechanical edit sites, moderate
risk); KV_FORMAT one-line delegate table (~6 lines saved, low value); CSS
utility-class consolidation (visual-regression risk); per-row `html +=` →
array-join (low impact); narrowing the `'//*[@xlink:href]'` scan in project
parsing (runs once per load, low impact).

**Key globals/functions** (non-exhaustive, but the ones worth knowing before
touching CRS/unit/geometry code):
- `DIGGS_SF` — Map of all parsed sampling features, keyed by type
- `SF_TYPE_CONFIG` — per-type parsing/display config
- `crsCategory(sf)` — classifies a CRS as `local | geographic3d | geocentric |
  geographic | projected | unknown | none`, generically (not via hardcoded
  EPSG lists) — 3D-ness from `srsDimension===3` + no separate vertEPSG;
  geocentric from `+proj=geocent` in the CRS's own proj4 def
- `crsDefLinearUnit(epsgCode)` / `crsDefHeightUnit(epsgCode)` — resolve a
  CRS's native unit from its proj4 def string; `crsDefLinearUnit` returns `'°'`
  for a longlat CRS (horizontal display), `crsDefHeightUnit` always returns a
  *linear* unit (height/Z), defaulting to `'m'` for longlat (ellipsoidal
  height convention)
- `resolveHorizUnit(sf)` / `resolveVertUnit(sf)` — async, resolve display
  unit + provenance (`''` | `'reported'` | `'mismatch'`) for horizontal and
  vertical axes respectively, priority: embedded CRS def → epsg.io fetch →
  `uomLabels` (flagged `(reported)`) → cross-check flagged `(reported uom
  mismatch)`
- `VERT_CRS_INFO` — embedded table of vertical CRS EPSG code → `{name, unit}`.
  **This table is a common source of subtle bugs** (see: EPSG:5702 was
  wrongly listed as `'ft'` instead of `'ftUS'` — always verify a vertical
  CRS's unit against the EPSG registry before adding/trusting an entry here)
- `coordsToLocalMeters(coords, srsName)` — converts raw coordinate tuples to
  local-metric `[x,y,z]` meters for length/area math. **Critical invariant:**
  the Z/height axis unit must be resolved from the CRS's own *separate*
  vertical component (`vert`, via `parseEPSG()`) when one exists — never
  assume Z shares the horizontal axes' unit. A compound CRS routinely pairs a
  meters horizontal (e.g. UTM) with a US-survey-feet vertical (e.g. NAVD88/
  ftUS), and vice versa.
- `polylineLengthMeters()` / `newellAreaMeters()` — pure 3D geometry math,
  unit-agnostic (operate on meters already converted by `coordsToLocalMeters`)
- `computeCenterLineLength()` / `computeFeatureExtentArea()` — the
  "computed geometry" cross-check pipeline; produces `sf.computedGeom =
  {kind, value, unit}` and `sf.geomMismatch`
- `computedValueMismatch(reportedVal, reportedUnit, computedVal, computedUnit,
  isArea)` — 2%-relative / floored-absolute tolerance check. **Area/volume
  unit strings from XML `uom` attributes carry a UCUM exponent suffix (e.g.
  `"km2"`) that is NOT a key in `LINEAR_UNIT_TO_M`** — always run reported
  area/volume units through `stripAreaExponent()` before calling
  `unitToMeters()`, or the conversion factor silently defaults to 1
- `getReportedGeomValue(sf)` — single source of truth for "what does this SF
  report" (checks `sf.depth` → `sf.wellDepth` → `sf.linearExtentLen`)
- `superscriptUom()` / `escUom()` — convert UCUM-style trailing-digit unit
  exponents to Unicode superscripts for **display only** (`m2`→`m²`) — never
  use the superscripted form as a lookup key into `LINEAR_UNIT_TO_M` or
  similar; always convert/compare using the raw UCUM string first, superscript
  last, at render time only

## Known flagged / unvalidated areas (carry forward until resolved)

- **Local Cartesian CRS support** — validated 2026-07-08 against real
  instances (`TrenchWall2.xml`, `InspectorTestFile.xml`, both use a
  `LocalCartesianCRS`-referenced `featureExtent`): `toWGS84()`'s local-CRS
  branch correctly transforms ring geometry end-to-end (render, click-select,
  computed-area cross-check all confirmed working). No longer flagged as
  unvalidated.
- **`collectFeatureExtentRawPatches()`'s Solid/MultiSurfaceAggregate path** —
  still unvalidated against a real instance (only `PlanarSurface` instances
  exist in this repo's test files so far).
- **Polygon ring extraction (`polygonLatLngs`, used for map rendering) does
  not search `MultiSurfaceAggregate`** (2026-07-08 finding) — both
  `parseSamplingFeature()`'s inline extractor and its standalone twin
  `_resolvePolygonRings()` hardcode `surfaceEls` to `PlanarSurface` +
  `MultiPlanarSurface` only, so a `featureExtent/MultiSurfaceAggregate/
  surfaceMembers/PlanarSurface/...` instance would fall back to a point
  marker even though `collectFeatureExtentRawPatches()` (area-math path)
  already handles it generically via descendant-`exterior` search. Extend
  `surfaceEls` in both places if/when a real `MultiSurfaceAggregate` instance
  turns up for any planar SF type (TrenchWall, GP_ArealSurvey,
  PlanarSamplingFeature).
- **Associated Data pane** — uom display and general polish not yet started
  there; flagged by the user as "lots to do."
- **CPT/lithology chart-plotting code** (`prop.uom` in SVG axis labels/
  tooltips) — not yet covered by the superscripted-unit display pass.
- Dead code removed (2026-07-08): `renderLTPZoneTable`, `ltpZoneHover`,
  `_ltpZoneMaps`, `initLTPZoneMap`, and `resetCMCMarkers` — all verified
  unreferenced and deleted. **The rest of the CMC cluster is LIVE, not dead**:
  `renderCMCTable` (wired via `rawFormat:'renderCMCTable'` in the `LTPZone`
  descriptor), `showCMCMarkers` / `clearCMCMarkers` / `_selectCMCRow` /
  `_cmcMarkerState` (the CMC map-marker path reached when `sf.type==='LTPZone'`
  is selected). A prior version of this list wrongly flagged those five as dead
  — verify call sites (rawFormat strings, inline `onclick`/`onmouseenter`
  handlers) before trusting any "dead code" claim here.

## Domain context (for accurate DIGGS/geotechnical reasoning)

- DIGGS sampling features have real 3D geometry: 1D (borehole/transect
  centerlines — `LinearExtent`/posList), 2D/3D planar (trench walls, LTP
  features — `featureExtent`, `PlanarSurface`/`MultiPlanarSurface`/
  `MultiSurfaceAggregate`/`Solid`).
- Compound CRS is the norm, not the exception, in real project data:
  horizontal component (geographic or projected) + a separate vertical datum
  component (e.g. NAVD88, NGVD29), each with its own independent linear unit.
- US survey foot (`ftUS`, EPSG conversion factor `1200/3937` m) and
  international foot (`ft`, exactly `0.3048` m) differ by roughly 2 parts per
  million — enough to matter at the 2%-relative mismatch tolerance only in
  edge cases, but the two must never be silently conflated in a lookup table.
