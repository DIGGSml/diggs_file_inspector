# Lithology Badge Render — Handoff for Next Session

## File
`diggs_content_viewer.html` — ~9,635 lines. Upload the file; always use it as ground truth.

---

## Context: what is already done

### Parse layer (complete — do not touch)

`DIGGS_LITH[sfId]` = array of **LithologySystem** objects:
```
{
  el: Element,                         // raw diggs:LithologySystem element
  gml_id: string,
  classificationTypes: [{ value, codeSpace }],
  observations: [ LithologyObservation, ... ]
}
```

Parse functions live inside `loadDIGGS()` (~lines 4797–5159). Every sub-object carries
its raw XML element as `.el` for XPath rendering.

### Badge wrapper (complete — do not touch the outer shell)

Lines ~7808–7854 in `buildAssocBadges(sf)`:
```js
const lithSystems = DIGGS_LITH[sfId] || [];
if (lithSystems.length) {
  const totalObs = lithSystems.reduce((n,sys) => n + sys.observations.length, 0);
  const allObs   = lithSystems.flatMap(sys => sys.observations);
  badges.push({
    id:        `assoc-lith-${sfId.replace(/[^a-zA-Z0-9]/g,'_')}`,
    label:     'Lithology',
    count:     `${totalObs} interval${totalObs !== 1 ? 's' : ''}`,
    contentFn: () => {
      // ── STUB (lines 7820–7851) — replace this entire body ──
      ...
    },
  });
}
```

**Only the body of `contentFn` (lines 7820–7851) needs to be replaced.**

### UOM display fix (complete)

`.col-uom` CSS now has `text-transform:none; letter-spacing:0` (line 1271) so UOM strings
from XML are displayed exactly as encoded, even when nested inside an uppercase `<th>`.

---

## What this session must build

### 1. `munsellToCSS(code)` — new top-level function

Insert after `depthUomForRows` (~line 8276).

Input: Munsell code string, e.g. `"10YR 4/3"`, `"5GY 6/2"`, `"N 5/"`.
Output: approximate CSS `hsl(...)` string, or `''` on parse failure.

Algorithm sketch:
- Parse hue letter(s): map to hue angle (YR≈30°, Y≈60°, GY≈90°, G≈120°, BG≈165°,
  B≈210°, PB≈255°, P≈290°, RP≈330°, R≈0°).
- Value (0–10) → lightness roughly `value * 9 + 10`%.
- Chroma → saturation roughly `min(100, chroma * 10)`%.
- `N` (neutral) → `hsl(0,0%,${value*9+10}%)`.
- Return `''` for any parse failure.

This populates `color.cssColor` at render time (not stored in the parsed object).

---

### 2. Replace the stub `contentFn` body

The replacement is a single call:
```js
contentFn: () => renderLithBadgeContent(sfId, sf, lithSystems, allObs),
```

---

### 3. `renderLithBadgeContent(sfId, sf, lithSystems, allObs)` — orchestrator

Insert as a top-level function after `depthUomForRows`.

**Step 1 — geometry gate.**
```js
const nonLinear = allObs.some(o =>
  o.locationType !== 'LinearExtent' &&
  o.locationType !== 'PointLocation' &&
  o.locationType !== 'none'
);
if (nonLinear)
  return `<div style="color:var(--text-muted);padding:12px;font-size:12px">
    Lithology display for 2D/3D sampling features is not yet implemented.</div>`;
```

**Step 2 — decide render mode.**
Compute depth range per system: `[min(parseFloat(obs.from)), max(parseFloat(obs.to))]`.
Two systems *overlap* if their ranges intersect. If any pair overlaps → **separate** mode
(one table per system, each with its own header). Otherwise → **combined** mode (single
table, all observations merged and depth-sorted, header lists all classification types).

Station SFs (`sf.type === 'Station'`): always combined; systems separated by `<hr>` in
the classification header block.

**Step 3 — build classification header.**
Combined:
```html
<div class="lith-classification-header">
  Classification: <span>USCS</span> · <span>AGI Rock</span>
</div>
```
Separate (one header per system before its table):
```html
<div class="lith-classification-header">Classification (0.0–11.5 ft): USCS</div>
```

**Step 4 — build table(s).** Call `renderLithTable(obs[], activeColumns, sfId)` for each
group of observations.

**Step 5 — return** assembled HTML.

---

### 4. Column config — define as `const LITH_TABLE_COLUMNS` near other config objects (~line 3400)

```js
const LITH_TABLE_COLUMNS = [
  { key:'from',           label:'From',           always:false,
    suppress: (obs, sf) => sf.type === 'Station' },
  { key:'to',             label:'To',             always:false,
    suppress: (obs, sf) => sf.type === 'Station' },
  { key:'position',       label:'Position',       always:false,
    suppress: (obs, sf) => sf.type !== 'Station' ||
                           !obs.some(o => o.coordTuple && o.coordTuple.length) },
  { key:'classification', label:'Classification', always:true  },
  { key:'symbol',         label:'Symbol',         always:false,
    suppress: (obs) => !obs.some(o => o.primary && o.primary.classificationSymbol) },
  { key:'description',    label:'Description',    always:true  },
  { key:'unitName',       label:'Unit Name',      always:false,
    suppress: (obs) => !obs.some(o => o.unitName) },
  { key:'facies',         label:'Facies',         always:false,
    suppress: (obs) => !obs.some(o => o.facies) },
  { key:'details',        label:'Details',        always:true  },
];
```

`suppress(allObs, sf)` is called once per column before building the table. Active columns
= those where `always:true` OR `suppress(...)` returns false.

Note: if *both* `unitName` and `facies` are suppressed, fold them into the Details button
as a `Facies / Unit` section (see detail sections below).

---

### 5. `renderLithTable(obsArray, sf)` — table builder

```
1. Resolve activeColumns from LITH_TABLE_COLUMNS.
2. Depth-sort obsArray (parseFloat(obs.from), then string compare fallback).
3. Build <thead> — each active col gets a <th>.
   From / To: append <br><span class="col-uom">(uom)</span> via depthUomForRows(obsArray).
4. For each obs build <tr> with a <td> per active column.
5. Return <table class="sub-table">…</table>.
```

**Cell content per column key:**

| key | content |
|---|---|
| `from` | `<td class="mono">${esc(obs.from)}</td>` |
| `to` | `<td class="mono">${esc(obs.to)}</td>` |
| `position` | coord values joined `" / "`, axis labels (see §6) as `col-uom` sub-label |
| `classification` | `<span class="lith-code">${esc(code \|\| fragment \|\| '—')}</span>` |
| `symbol` | `esc(obs.primary.classificationSymbol)` |
| `description` | `esc(obs.primary.lithDescription \|\| '—')` with `white-space:normal` |
| `unitName` | `esc(obs.unitName)` |
| `facies` | `esc(obs.facies)` |
| `details` | pill buttons — see §7 |

---

### 6. Position column — axis label resolution (Station SFs only)

`obs.coordTuple` is a `string[]` of coordinate values (already parsed).
`obs.srsName` is the CRS URI.

Label strategy:
- If `obs.coordTuple.length === 0` → `'—'`
- If values in lat/lon range (both in `[-90,90] × [-180,180]`) → labels `Lat / Lon`
- Otherwise → labels `E / N` (show `obs.srsName` fragment as tooltip)

Display: `coordTuple.join(' / ')` with axis labels as a `col-uom` sub-label in the cell.

---

### 7. Detail buttons — `LITH_DETAIL_SECTIONS` config and `detail-pill` CSS

**Add CSS** (near `.lith-code`, ~line 1166 — check first that `.detail-pill` isn't already defined):
```css
.detail-pill {
  display:inline-block; margin:1px 2px; padding:1px 6px;
  background:var(--surface2); border:1px solid var(--border);
  border-radius:3px; font-size:10px; color:var(--text-muted);
  cursor:pointer; white-space:nowrap;
}
.detail-pill:hover { background:var(--surface3); color:var(--text); }
```

**`LITH_DETAIL_SECTIONS`** — array of:
```js
{
  key:        string,
  label:      string,
  hasData:    (obs) => bool,       // whether to show this pill for a given observation
  popupTitle: (obs) => string,
  buildSections: (obs) => [        // argument to _registerPopup
    { heading?: string, els: [Element], fields: [...] }
  ]
}
```

Pill rendering (inside the `details` cell):
```js
for (const sec of LITH_DETAIL_SECTIONS) {
  if (!sec.hasData(obs)) continue;
  const key = _registerPopup(sec.popupTitle(obs), sec.buildSections(obs));
  detailsHtml += `<button class="detail-pill"
    onclick="showDetailPopup('${key}')">${escHtml(sec.label)}</button>`;
}
```

**Sections to define:**

| key | label | hasData | popup content |
|---|---|---|---|
| `classification` | Classification | `groupIndexAASHTO \|\| legendCode \|\| matrixType` on primary | fields on `obs.primary.el` |
| `color` | Color | `primary.colors.length > 0` | one section per color; swatch + code/name/components/abundance |
| `properties` | Properties | `primary.lithProperties != null` | LITH_PROPERTIES_GROUPS on `obs.primary.lithProperties.el` |
| `components` | Components | `obs.components.length > 0` | one sub-card per component |
| `placed` | Placed Obs | `obs.placedObservations.length > 0` | list of from/to + observation text |
| `boundary` | Boundary | `obs.baseBoundaries.length > 0` | dipAngle/Direction/distinctness/origin/topography per boundary |
| `faciesunit` | Facies / Unit | `(obs.facies \|\| obs.unitName) && bothColsSuppressed` | two-field display |

---

### 8. `LITH_PROPERTIES_GROUPS` — for the Properties popup

Two named groups. Only emit a group heading if ≥1 field is populated.

**General / Soil (in schema order):**
`consistency`, `apparentDensity`, `moistureCondition`, `plasticity`, `dilatancy`,
`dryStrength`, `toughness`, `cementation`, `fabric`, `soilStructure`,
`particleSize`, `particleAngularity`, `particleShape`, `particleHardness`,
`particleSorting` (multi-valued), `particleSizeDistribution` (nested block — see §9),
`reactionToHCl`, `staining`, `odor`,
`beddingOrientation` / `dipAngle` / `dipDirection` / `beddingSpacing`,
`surfaceTexture`, `unitRecoveryLength` (+ uom attr), `otherLithProperty` (name=value pairs)

**Rock:**
`rockGrainSize`, `rockHardness`, `rockStrength`, `rockWeathering`, `rockMass`,
`rockSlakingRate`, `rockSorting`,
`unitRQD` (+ uom), `unitRQDLength` (+ uom),
`surfaceTexture`, `otherLithProperty` (name=value pairs)

Use `renderKVTable(lpEl, descriptorArray)` where each entry follows the established
descriptor shape (see §10). Pass `obs.primary.lithProperties.el` as the element.

Same groups apply to `ComponentProperties` (pass `component.componentProperties.el`).

---

### 9. `particleSizeDistribution` nested rendering

Within the Properties popup this is a nested sub-block. The parsed object:
```
obs.primary.lithProperties.particleSizeDistribution = {
  el, howDetermined,
  meanGrainsize:     { value, uom, description },
  modalGrainsize:    { value, uom, description },
  equivalentDiameter:{ value, uom, description },
  minimumDiameter:   { value, uom, description },
  maximumDiameter:   { value, uom, description },
}
```

Render as a small indented block (use `renderNestedKV` with XPath or hand-build from the
parsed JS object). Suppress rows where value is empty.

---

### 10. `renderNestedKV` field descriptor shape (existing — reuse)

```js
// Simple path:
{ label: 'Consistency', path: 'diggs:consistency' }

// Attribute:
{ label: 'Apparent?', path: 'diggs:dipAngle/@apparent' }

// Composite (value + units):
{ label: 'Recovery Length', parentPath: 'diggs:unitRecoveryLength',
  composite: [
    { path: '.' },
    { path: '@uom', prefix: ' ' }
  ]
}

// Multi (unbounded child):
{ label: 'Sorting', parentPath: 'diggs:particleSorting',
  composite: [{ path: '.' }] }

// rawFormat — pass entire element to a KV_FORMAT function:
{ label: 'Legend Code', parentPath: 'diggs:legendCode',
  rawFormat: 'codeWithSpace' }   // must exist in KV_FORMAT
```

`_registerPopup(title, sectionsArray)` returns a key string.
`sections` = `[{ heading?: string, els: [Element], fields: descriptorArray }]`

---

## Parsed object quick reference

### LithologyObservation (`obs`)
```
obs.el, obs.gml_id, obs.howDetermined, obs.stratumCode
obs.trueTopObserved, obs.trueBaseObserved        (bool|null)
obs.locationType   'LinearExtent'|'PointLocation'|'none'|other
obs.from, obs.to   string depth values
obs.srsName        string CRS URI
obs.offsetDistance, obs.offsetBearing            (Transect LRS)
obs.coordTuple     string[]  (Station physical coords)
obs.axisLabels     string[]  (currently always [] — resolve at render time)
obs.primary        LithologyObject
obs.components     ComponentLithologyObject[]
obs.facies, obs.unitName  string
obs.placedObservations    [{el,locationType,from,to,srsName,observation}]
obs.baseBoundaries        [{el,dipAngle,dipAngleApparent,dipDirection,
                             distinctness,origin,topography,howDetermined}]
```

### LithologyObject (`obs.primary`)
```
.el
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
.rank, .origin              attributes
.preface, .colorCode, .colorName
.intensity, .modifier, .hue (from diggs:colorComponents)
.isMunsell                  bool
.cssColor                   '' — populate via munsellToCSS(color.colorCode) at render time
.abundanceCode
.abundancePercent, .abundancePercentUom
.maxAbundancePercent, .maxAbundancePercentUom
```

### ComponentLithologyObject (`obs.components[i]`)
```
.el                         diggs:ComponentLithology element
.rank, .association         attributes on ComponentLithology
.lithology                  LithologyObject (from diggs:ComponentLith)
.componentProperties        LithPropertiesObject | null
.abundanceCode
.abundancePercent, .abundancePercentUom
.maxAbundancePercent, .maxAbundancePercentUom
```

### LithPropertiesObject (`obs.primary.lithProperties`)
```
.el                         diggs:LithProperties or diggs:ComponentProperties
.consistency, .apparentDensity, .moistureCondition, .plasticity, .dilatancy
.dryStrength, .toughness, .cementation, .fabric, .soilStructure
.particleSize, .particleAngularity, .particleShape, .particleHardness
.particleSorting            string[]   (multi-valued)
.particleSizeDistribution   { el, howDetermined,
                               meanGrainsize, modalGrainsize, equivalentDiameter,
                               minimumDiameter, maximumDiameter }
                             (each GrainSize: { value, uom, description })
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

## Existing utilities (do not re-implement)

| Function | Line | Purpose |
|---|---|---|
| `xNodes(doc, expr, ctx)` | 1763 | XPath node list |
| `xFirst(doc, expr, ctx)` | 1771 | XPath first node |
| `xText(doc, expr, ctx)` | 1775 | XPath text value |
| `diggsLabel(name)` | 2067 | Human-readable DIGGS type label |
| `renderNestedKV(el, fields)` | 3401 | KV block from XML element + field descriptors |
| `_registerPopup(title, sections)` | 3420 | Register popup → returns key string |
| `showDetailPopup(key)` | 3426 | Open registered popup |
| `buildIntervalTable(parentEl, cfg)` | 3491 | Declarative interval table |
| `renderKVTable(element, descriptor)` | 4371 | KV table from descriptor array |
| `evalXPath(ctx, path)` | 4328 | NS-aware XPath relative to context node |
| `nodeText(n)` | 4349 | `.textContent.trim()` |
| `escHtml(s)` | 4679 | HTML-escape |
| `depthUomForRows(rows)` | 8276 | Resolve LSR UOM string from obs array |
| `esc(s)` | 9436 | HTML-escape (same as escHtml) |

## Existing CSS classes

| Class | Purpose |
|---|---|
| `.sub-table` | Main observation table |
| `.sub-table th` | Header — uppercase, `text-transform:uppercase` |
| `.col-uom` | UOM sub-label in header — has `text-transform:none` (line 1271) |
| `.lith-code` | Classification pill — orange accent, monospace (line 1162) |
| `.mono` | Monospace depth values |
| `.kv-row`, `.kv-key`, `.kv-val` | KV table rows |
| `.kv-section-header` | Section heading within a KV block |
| `.kv-nested` | Nested KV sub-block |
| `.detail-pill` | **Not yet defined** — add near `.lith-code` |

---

## Implementation order

1. Add `munsellToCSS(code)` top-level function (~after line 8276)
2. Add `.detail-pill` CSS (~after line 1166)
3. Add `LITH_TABLE_COLUMNS` config (~after line 3400)
4. Add `LITH_PROPERTIES_GROUPS` config
5. Add `LITH_DETAIL_SECTIONS` config (with `buildSections` for each)
6. Add `renderLithTable(obsArray, sf)` function
7. Add `renderLithBadgeContent(sfId, sf, lithSystems, allObs)` function
8. Replace stub body (lines 7820–7851) with:
   `return renderLithBadgeContent(sfId, sf, lithSystems, allObs);`

Test after each step — open the badge, check console for errors, verify
pills appear and popups open without JS errors.
