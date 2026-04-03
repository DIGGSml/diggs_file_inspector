# Lithology Badge Redesign — Session Handoff

## Working file
`diggs_content_viewer.html` (uploaded as `diggs_content_viewer.html`) — ~9,229 lines.
Always use the uploaded file as ground truth.

---

## What is changing
Replace the current flat 4-column Lithology badge table (From, To, Code, Description) with a
fully schema-faithful display driven by the complete LithologySystem/LithologyObservation
structure. The current parse is in the `// ── LITHOLOGY ────` block (~line 4783) and the
badge render is in `buildAssocBadges()` (~line 7424).

---

## Parse changes — DIGGS_LITH

`DIGGS_LITH[sfId]` changes from a flat rows array to an **array of LithologySystem objects**
(one per LithologySystem element referencing this SF). Multiple systems per SF are valid.

```js
DIGGS_LITH[sfId] = [
  {
    gml_id: string,
    classificationTypes: [ { value, codeSpace } ],   // lithologyClassificationType (1+)
    observations: [ <LithologyObservation object> ]   // see below
  },
  ...
]
```

### LithologyObservation parsed object
```js
{
  gml_id: string,
  howDetermined: string,          // @howDetermined attribute
  stratumCode: string,            // @stratumCode attribute (legacy AGS)
  trueTopObserved: bool|null,
  trueBaseObserved: bool|null,

  // Location (from diggs:location child)
  locationType: 'LinearExtent' | 'PointLocation' | 'none',
  from: string,       // LinearExtent: first token of posList; PointLocation 1D: single value
  to: string,         // LinearExtent: second token; PointLocation: ''
  srsName: string,
  // For PointLocation with offset (Transect LRS):
  offsetDistance: string,
  offsetBearing: string,
  // For PointLocation in physical CRS (Station):
  coordTuple: string[],   // raw coordinate values
  axisLabels: string[],   // resolved per CRS logic below

  // primaryLithology/Lithology
  primary: <LithologyObject>,     // see below

  // componentLithology (0+)
  components: [ <ComponentLithologyObject> ],

  // observation-level fields
  facies: string,
  unitName: string,

  // placedObservation (0+)
  placedObservations: [
    {
      locationType: 'LinearExtent' | 'PointLocation',
      from: string, to: string, srsName: string,
      observation: string
    }
  ],

  // baseBoundary (0+)
  baseBoundaries: [
    {
      dipAngle: string, dipAngleApparent: bool,
      dipDirection: string,
      distinctness: string,
      origin: string,
      topography: string,
      howDetermined: string
    }
  ]
}
```

### LithologyObject (primaryLithology/Lithology and ComponentLith share most fields)
```js
{
  // Required (one or both)
  classificationCode: string,
  classificationCodeSpace: string,   // full URL
  classificationCodeFragment: string, // text after # in codeSpace URL — fallback display value
  lithDescription: string,

  // Optional classification
  classificationSymbol: string,
  classificationSymbolCodeSpace: string,
  groupIndexAASHTO: string,
  legendCode: string,
  legendCodeCodeSpace: string,
  legendCodeHref: string,
  legendCodeMimeType: string,
  matrixType: string,               // soil | rock | solid organic matter | surficial

  // Color
  colorCharacter: string,           // uniform | mottled | banded | variegated | multicolored
  colors: [ <ColorObject> ],        // see below

  // Constituents
  constituents: [ <ConstituentObject> ],  // see below

  // LithProperties
  lithProperties: <LithPropertiesObject> | null   // see below
}
```

### ComponentLithologyObject
```js
{
  rank: string,                     // @rank attribute
  association: string,              // @association attribute
  lithology: <LithologyObject>,     // ComponentLith — same fields as above minus legendCode/matrixType
  abundanceCode: string,
  abundancePercent: string,
  abundancePercentUom: string,
  maxAbundancePercent: string,
  maxAbundancePercentUom: string
}
```

### ColorObject
```js
{
  rank: string,         // @rank
  origin: string,       // @origin
  preface: string,
  colorCode: string,    // Munsell code if present, e.g. "10YR 4/3"
  colorName: string,
  // colorComponents (if present)
  intensity: string,
  modifier: string,
  hue: string,
  // abundance
  abundanceCode: string,
  abundancePercent: string,
  abundancePercentUom: string,
  maxAbundancePercent: string,
  maxAbundancePercentUom: string,
  // derived
  isMunsell: bool,      // true if colorCode matches Munsell pattern OR colorComponents populated
  cssColor: string      // approximate CSS color derived from Munsell/components — may be ''
}
```

### ConstituentObject
```js
{
  rank: string,           // @rank
  codeValue: string,
  codeValueCodeSpace: string,
  category: string,       // @category on codeValue
  howDetermined: string,  // @howDetermined on codeValue
  abundanceCode: string,
  abundancePercent: string,
  abundancePercentUom: string,
  maxAbundancePercent: string,
  distribution: string
}
```

### LithPropertiesObject
(same fields apply to ComponentPropertiesObject)
```js
{
  // General and Soil Properties group
  consistency: string,
  apparentDensity: string,
  moistureCondition: string,
  plasticity: string,
  dilatancy: string,
  dryStrength: string,
  toughness: string,
  cementation: string,
  fabric: string,
  soilStructure: string,
  particleSize: string,
  particleAngularity: string,
  particleShape: string,
  particleHardness: string,
  particleSorting: string[],        // maxOccurs unbounded
  particleSizeDistribution: {       // complex sub-object
    howDetermined: string,
    meanGrainsize: <GrainSizeObj>,
    modalGrainsize: <GrainSizeObj>,
    equivalentDiameter: <GrainSizeObj>,
    minimumDiameter: <GrainSizeObj>,
    maximumDiameter: <GrainSizeObj>
  } | null,
  reactionToHCl: string,
  staining: string,
  odor: string,
  beddingOrientation: string,       // text form
  dipAngle: string,
  dipAngleApparent: bool,
  dipDirection: string,
  beddingSpacing: string,
  surfaceTexture: string,
  unitRecoveryLength: string,
  unitRecoveryLengthUom: string,
  otherLithProperty: [ { name, value, units } ],

  // Rock Properties group
  rockGrainSize: string,
  rockHardness: string,
  rockStrength: string,
  rockWeathering: string,
  rockMass: string,
  rockSlakingRate: string,
  rockSorting: string,              // NEW element added to schema
  unitRQD: string,
  unitRQDUom: string,
  unitRQDLength: string,
  unitRQDLengthUom: string,
  otherLithProperty: [ { name, value, units } ]  // also at bottom of rock group if populated
}
```

### GrainSizeObj
```js
{ value: string, uom: string, description: string }
```

---

## Geometry type gate

At badge render time, inspect the `locationType` values across ALL observations in ALL systems
for this SF:
- If any observation has a geometry type other than `LinearExtent`, `PointLocation`, or `none`
  → render stub message in assoc pane:
  *"Lithology display for 2D/3D sampling features is not yet implemented."*
- Otherwise proceed with normal rendering.

---

## Multiple LithologySystem handling

**Overlap detection (1D SFs):**
- Per system: find `min(from)` and `max(to)` across all observations using `parseFloat`
- If depth ranges of any two systems overlap → render **separately** (one table per system,
  HR separator between them)
- If no overlap → render **combined** (all observations interleaved by depth order into one table)

**Station (0D):** overlap is meaningless — always render combined. Systems separated by HR
within the classification header block (treated like other metadata items: role, status, remark).

---

## Classification header block

Appears above the table. For combined display:
```
Classification System(s):
  USCS (0–24 ft)
  Rock-AGI (24–43 ft)
```
For separate display, each table has its own header. Systems within a Station header separated
by `<hr>` within the header block.

---

## Main table columns

| Column | Always shown | Suppressed if |
|---|---|---|
| From | 1D only | — |
| To | 1D only | — |
| Position | 0D with coords only | no PointLocation on station |
| Classification | always | — |
| Symbol | conditional | no observation has classificationSymbol |
| Description | always | — |
| Unit Name | conditional | no observation has unitName |
| Facies | conditional | no observation has facies |
| Details | always | (individual buttons suppressed per section) |

**Classification cell value:** `classificationCode` if present, else `classificationCodeFragment`
(text after `#` in codeSpace URL).

**Symbol cell value:** `classificationSymbol`.

---

## Position column — Station CRS label resolution

Priority order:
1. `srsName` of PointLocation matches `srsName` of Station `referencePoint` → reuse
   already-resolved proj4js axis labels for that CRS
2. Coordinate tuple has 1 value → display Station referencePoint coordinates with its axis labels
3. 2D/3D tuple, srsName differs → range-check: if values within [-90,90] × [-180,180] →
   label "Lat / Lon"; else → label "E / N" (show raw srsName as sub-label/tooltip)

---

## Detail buttons (Details column, per observation row)

One small pill button per section. Button only rendered if section has data.

| Button | Popup content |
|---|---|
| Classification | groupIndexAASHTO, legendCode (+ codeSpace, href, mimeType), matrixType |
| Color | colorCharacter + each Color object: swatch (if Munsell/components) + name/code + abundance + preface + origin/rank |
| Properties | LithProperties in two labeled groups (see below) |
| Components | One sub-card per componentLithology: rank, association, abundance, lithology fields, componentProperties |
| Placed Obs | List of placedObservations with from/to or point position + observation text |
| Boundary | baseBoundary fields: dipAngle (+apparent flag), dipDirection, distinctness, origin, topography, howDetermined |
| Facies/Unit | facies + unitName — only shown as button if BOTH columns are suppressed from main table |

---

## LithProperties popup — property groups

**General and Soil Properties:**
consistency, apparentDensity, moistureCondition, plasticity, dilatancy, dryStrength, toughness,
cementation, fabric, soilStructure, particleSize, particleAngularity, particleShape,
particleHardness, particleSorting, particleSizeDistribution, reactionToHCl, staining, odor,
beddingOrientation/dipAngle/dipDirection, beddingSpacing, surfaceTexture, unitRecoveryLength,
otherLithProperty (at bottom)

**Rock Properties:**
rockGrainSize, rockHardness, rockStrength, rockWeathering, rockMass, rockSlakingRate,
rockSorting, unitRQD, unitRQDLength, surfaceTexture, otherLithProperty (at bottom)

Only render a group heading if at least one field in that group is populated.
`otherLithProperty` rendered as name/value pairs at bottom of whichever group(s) are shown.

---

## ParticleSizeDistribution rendering (within Properties popup)

Rendered as a nested KV block:
```
Particle Size Distribution  [howDetermined if present]
  Mean grain size:       0.25 mm  (fine sand)
  Modal grain size:      0.20 mm
  Equivalent diameter:   —
  Min diameter:          0.05 mm
  Max diameter:          2.0 mm   (coarse sand)
```
Suppress rows where GrainSizeObj is empty.

---

## Color swatch rendering

- `colorCode` present AND matches Munsell pattern (e.g. `10YR 4/3`, `5GY 6/2`) → render
  swatch + show code as text
- `colorComponents` populated (has at least `hue`) → construct approximate Munsell description
  from intensity + modifier + hue, render swatch from those components
- Neither above but `colorName` present → text only, no swatch
- `preface` shown before the color description (e.g. "with reddish brown ■ 10YR 4/3")
- `@origin`, `@rank` shown as sub-labels where present
- Abundance shown inline

---

## Existing code to replace/extend

- **Parse block** (~line 4783): replace `DIGGS_LITH` loop entirely
- **Badge definition** (~line 7424): replace `contentFn` entirely; keep badge `id`/`label`/`count` pattern
- **DIGGS_DISPLAY_LABELS** (~line 2048): `LithologySystem: 'Lithology'` already present — no change needed
- **`depthUomForRows()`**: will need to work with new observation object structure

---

## Architectural constraints — CRITICAL

These must be followed to keep the codebase maintainable and consistent:

1. **No new rendering primitives.** All KV rendering in detail popups uses the existing
   `renderKVTable()` with descriptor config objects. All interval/tabular data uses the
   existing `buildIntervalTable()`. All popup registration uses the existing
   `_registerPopup()` / `showDetailPopup()` machinery. No parallel or duplicate
   rendering functions.

2. **Declarative config, not imperative JS.** LithProperties property groups, main table
   column definitions, and detail popup section layouts must all be expressed as
   descriptor/config objects (consistent with `SF_DETAIL_DESCRIPTORS`, `KV_FORMAT`,
   `PROJECT_DETAIL_DESCRIPTOR` patterns). Adding a new schema element in future means
   adding one entry to a config object — not modifying JS logic.

3. **Reuse existing utilities.** `depthUomForRows()`, `esc()`, `xText()`, `xFirst()`,
   `xNodes()`, `diggsLabel()`, `renderKVTable()`, `buildIntervalTable()` etc. must all
   be reused as-is. Only genuinely new capabilities warrant new functions.

---

## New config objects needed (declarative)

- `LITH_TABLE_COLUMNS` — column descriptor array for the main observation table. Each
  entry has: `key`, `label`, `always: bool`, `suppress: (observations[]) => bool`
  predicate for conditional columns (symbol, unitName, facies).

- `LITH_PROPERTIES_GROUPS` — descriptor array for LithProperties popup, structured as
  two named groups ("General and Soil Properties", "Rock Properties"), each containing
  an ordered array of field descriptors compatible with `renderKVTable()` config format.

- `LITH_DETAIL_SECTIONS` — descriptor array defining the per-row detail popup buttons:
  `{ key, label, hasData: (obs) => bool, renderConfig: (obs) => kvDescriptor }`.
  Drives both button rendering and popup content via `renderKVTable()`.

- `LITH_COLOR_DESCRIPTOR` — KV descriptor for a single Color object, used by the
  Color section popup via `renderKVTable()`.

- `LITH_BOUNDARY_DESCRIPTOR` — KV descriptor for a Boundary object.

- `LITH_COMPONENT_DESCRIPTOR` — KV descriptor for a ComponentLithology sub-card.

---

## New functions needed (parse + orchestration only)

- `parseLithologySystem(doc, lsEl)` → LithologySystem object
- `parseLithologyObservation(doc, obsEl)` → LithologyObservation object
- `parseLithologyObject(doc, lithEl)` → LithologyObject (shared by primary + ComponentLith)
- `parseLithProperties(doc, lpEl)` → LithPropertiesObject
- `parseColorObject(doc, colorEl)` → ColorObject
- `munsellToCSS(code)` → approximate CSS color string (or '' if unrecognised)
- `renderLithBadgeContent(sfId, sf)` → orchestrator: geometry gate check, system
  overlap detection, classification header, table — delegates all rendering to
  existing machinery via config objects above
- `renderLithTable(systems, columns, sfType)` → builds the observation table HTML
  using `LITH_TABLE_COLUMNS` config; registers detail popups via `_registerPopup()`
