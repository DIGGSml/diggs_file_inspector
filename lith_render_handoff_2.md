# Lithology Render — Handoff for Next Session

## File
`diggs_content_viewer.html` — ~10,339 lines. Upload the output file from this session; always use it as ground truth.

---

## What was built this session (complete and working)

### New CSS (lines ~1162–1200)
- `.lith-code.clickable` / `.lith-code.dash-clickable` — clickable classification badge variants
- `.detail-pill` / `.detail-pill:hover` / `.detail-pill.active` — Details column pill buttons, styled to match `.assoc-badge` (white text, orange hover, orange+border when active)
- `.lith-classification-header` — system classification type header bar
- `.lith-color-swatch` / `.lith-color-row` — inline Munsell color swatch

### Modified: `renderKVTable` (~line 4735)
Added `showEmpty` flag support: when `showEmpty:true` on a descriptor entry, absent/empty fields render with a `—` placeholder instead of being suppressed. Section headers flush if any entry in the section has `showEmpty:true`.

### Modified: `renderFields` (~line 2924) and `itemsToHtml` (~line 2890)
Root cause fix required because `showDetailPopup` routes through `renderNestedKV` → `renderFields` → `itemsToHtml`, a completely separate pipeline from `renderKVTable`. Added `showEmpty` support to `renderFields` at three points:
- When `targets` is empty (element absent from XML)
- When a composite produces no value
- When `nodeText` returns empty string

Placeholder items carry `_emptyPlaceholder: true`. `itemsToHtml` renders these with muted `—` styling while preserving the field label. **Confirmed working.**

### New config objects (~lines 3455–3730)
| Const | Line | Purpose |
|---|---|---|
| `LITH_TABLE_COLUMNS` | 3455 | 8-column config with `suppress()` predicates |
| `LITH_PSD_DESCRIPTOR` | 3494 | Particle size distribution nested block |
| `LITH_PROPS_SOIL` | 3509 | General/Soil properties descriptor array |
| `LITH_PROPS_ROCK` | 3551 | Rock properties descriptor array |
| `LITH_PROPERTIES_GROUPS` | 3571 | Combined `[...LITH_PROPS_SOIL, ...LITH_PROPS_ROCK]` |
| `LITH_CLASSIFICATION_DESCRIPTOR` | 3576 | All classification fields, all with `showEmpty:true` — working |
| `LITH_COLOR_DESCRIPTOR` | 3597 | Color KV fields |
| `LITH_DETAIL_SECTIONS` | 3617 | Color, Properties, Components, Placed Obs, Boundary pill config |

### New functions (~lines 8622–8970)
| Function | Line | Purpose |
|---|---|---|
| `munsellToCSS(code)` | 8622 | Munsell string → CSS `hsl()` |
| `renderLithColorPopup(obs, label)` | 8669 | Color popup with per-color swatch injection |
| `_munsellFromComponents(color)` | 8714 | Approximate swatch from intensity/modifier/hue |
| `_buildLithClassCell(obs)` | 8734 | Classification column cell with clickable badge/dash |
| `renderLithTable(obsArray, sf)` | 8774 | Full interval table builder |
| `_buildLithCell(key, obs, sf, allObs)` | 8814 | Per-column cell builder |
| `_buildLithDetailCell(obs, allObs)` | 8865 | Details column pill builder |
| `_pillActivate(btn)` | 8891 | Active state toggle + MutationObserver cleanup |
| `_openLithColorPopup(key)` | 8909 | Color popup trampoline |
| `renderLithBadgeContent(sfId, sf, lithSystems, allObs)` | 8918 | Orchestrator (geometry gate → mode → header → table) |

### Stub replaced (~line 8187)
```js
contentFn: () => renderLithBadgeContent(sfId, sf, lithSystems, allObs),
```

---

## Known issues / what to work on next

### 1. Detail pill `.active` state — not yet confirmed working
`_pillActivate(btn)` uses a `MutationObserver` on `#detail-popup` to remove `.active` when the popup closes. Not yet confirmed in browser — verify this works and that the orange active state is visible while a popup is open.

### 2. Popup content — not yet fully tested
The following popups were implemented but not fully exercised with real test data:
- **Color** — `renderLithColorPopup`: swatch rendering (Munsell and component-derived), KV table per color, abundance fields
- **Properties** — `LITH_PROPERTIES_GROUPS` via `showDetailPopup`: General/Soil and Rock sections, `particleSizeDistribution` nested block, `otherLithProperty` name=value pairs
- **Components** — `LITH_DETAIL_SECTIONS.components.buildSections`: per-component lithology KV, abundance, component properties
- **Placed Obs** — `LITH_DETAIL_SECTIONS.placed.buildSections`: from/to + observation text
- **Boundary** — `LITH_DETAIL_SECTIONS.boundary.buildSections`: dipAngle/Direction/distinctness/origin/topography

### 3. Table rendering — not yet fully tested with varied data
- **Station SF type**: `position` column (coordTuple), combined mode always active
- **Multiple overlapping LithologySystems**: separate mode (one table per system)
- **`unitName` / `facies` columns**: suppressed when absent across all observations
- **`symbol` column**: suppressed when no `classificationSymbol` present

---

## Key architecture notes

### Two rendering pipelines — do not confuse them

| Pipeline | Used by | `showEmpty` support |
|---|---|---|
| `renderKVTable(el, descriptor)` | SF Detail pane (Section 4), project info popup | ✓ |
| `renderNestedKV(el, fields)` → `renderFields` → `itemsToHtml` | `showDetailPopup` (all lith popups), interval table complex columns | ✓ |

**Descriptor shape differs between pipelines:**
- `renderKVTable`: uses `path:`, `parentPath:`, `composite:`, `sectionHeader:`, `showEmpty:`, `rawFormat:`
- `renderFields`: uses `path:`, `composite:`, `fields:` (nested), `format:`, `multi:`, `label:`, `bold:`, `italic:`, `meta:`, `indent:`, `block:`, `showEmpty:`

Do not mix descriptor shapes between the two pipelines.

### Classification popup flow
```
Click .lith-code.clickable
  → showDetailPopup(key)
  → _detailPopupMap.get(key) → { title:'Classification', sections:[{ els:[pri.el], fields:LITH_CLASSIFICATION_DESCRIPTOR }] }
  → for each el: renderNestedKV(el, LITH_CLASSIFICATION_DESCRIPTOR)
  → renderFields(el, LITH_CLASSIFICATION_DESCRIPTOR)
  → itemsToHtml(items)
```

`pri.el` = `diggs:Lithology` element (direct child of `diggs:primaryLithology`).

### Detail pill popup flow
```
Click .detail-pill
  → _pillActivate(this)  [active state]
  → showDetailPopup(key) or _openLithColorPopup(key)
```

Color popup uses `renderLithColorPopup(obs, label)` which renders directly to `#detail-popup-content`, bypassing `showDetailPopup` entirely.

---

## Parsed object quick reference

### LithologyObservation (`obs`)
```
obs.el, obs.gml_id, obs.howDetermined, obs.stratumCode
obs.trueTopObserved, obs.trueBaseObserved        (bool|null)
obs.locationType   'LinearExtent'|'PointLocation'|'none'|other
obs.from, obs.to   string depth values
obs.srsName        string CRS URI
obs.coordTuple     string[]  (Station physical coords)
obs.primary        LithologyObject
obs.components     ComponentLithologyObject[]
obs.facies, obs.unitName  string
obs.placedObservations    [{el,locationType,from,to,srsName,observation}]
obs.baseBoundaries        [{el,dipAngle,dipAngleApparent,dipDirection,
                             distinctness,origin,topography,howDetermined}]
```

### LithologyObject (`obs.primary`)
```
.el                         diggs:Lithology element
.classificationCode, .classificationCodeSpace, .classificationCodeFragment
.lithDescription
.classificationSymbol, .classificationSymbolCodeSpace
.groupIndexAASHTO, .legendCode, .legendCodeCodeSpace, .legendCodeHref, .legendCodeMimeType
.matrixType
.colorCharacter
.colors          ColorObject[]
.constituents    ConstituentObject[]
.lithProperties  LithPropertiesObject | null
```

### ColorObject (`obs.primary.colors[i]`)
```
.el
.rank, .origin
.preface, .colorCode, .colorName
.intensity, .modifier, .hue   (from diggs:colorComponents)
.isMunsell                    bool
.cssColor                     '' — populate via munsellToCSS(color.colorCode) at render time
.abundanceCode
.abundancePercent, .abundancePercentUom
.maxAbundancePercent, .maxAbundancePercentUom
```

### ComponentLithologyObject (`obs.components[i]`)
```
.el                         diggs:ComponentLithology element
.rank, .association
.lithology                  LithologyObject (from diggs:ComponentLith)
.componentProperties        LithPropertiesObject | null
.abundanceCode
.abundancePercent, .abundancePercentUom
.maxAbundancePercent, .maxAbundancePercentUom
```

### LithPropertiesObject (`obs.primary.lithProperties`)
```
.el
.consistency, .apparentDensity, .moistureCondition, .plasticity, .dilatancy
.dryStrength, .toughness, .cementation, .fabric, .soilStructure
.particleSize, .particleAngularity, .particleShape, .particleHardness
.particleSorting            string[]
.particleSizeDistribution   { el, howDetermined, meanGrainsize, modalGrainsize,
                               equivalentDiameter, minimumDiameter, maximumDiameter }
.reactionToHCl, .staining, .odor
.beddingOrientation, .dipAngle, .dipAngleApparent, .dipDirection, .beddingSpacing
.surfaceTexture
.unitRecoveryLength, .unitRecoveryLengthUom
.rockGrainSize, .rockHardness, .rockStrength, .rockWeathering
.rockMass, .rockSlakingRate, .rockSorting
.unitRQD, .unitRQDUom, .unitRQDLength, .unitRQDLengthUom
.otherLithProperty          [{ el, name, value, units }]
```

---

## Existing utilities

| Function | Line | Purpose |
|---|---|---|
| `renderFields(el, fields)` | 2924 | Core renderer for `showDetailPopup` pipeline — has `showEmpty` |
| `itemsToHtml(items)` | 2890 | Serializer — handles `_emptyPlaceholder` |
| `makeRenderItem(value, spec, isHtml)` | 2875 | Item factory |
| `renderNestedKV(el, fields)` | 3432 | Wraps `renderFields` output in `.kv-nested` div |
| `renderKVTable(el, descriptor)` | ~4700 | Separate KV table pipeline (SF detail pane) |
| `showDetailPopup(key)` | 3755 | Opens popup from `_detailPopupMap` using `renderNestedKV` |
| `_registerPopup(title, sections)` | 3749 | Registers popup entry → returns key |
| `_nextPopupKey()` | 3747 | Returns next `dp_N` key |
| `depthUomForRows(rows)` | 8619 | Depth UOM from srsName array |
| `evalXPath(ctx, path)` | 4658 | NS-aware XPath |
| `nodeText(n)` | 4676 | `.textContent.trim()` |
| `esc(s)` / `escHtml(s)` | ~9564 / ~4700 | HTML-escape |
