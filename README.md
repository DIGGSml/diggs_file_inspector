# DIGGS File Inspector

A standalone, browser-based viewer for [DIGGS](https://www.diggsml.org/) (Data Interchange for Geotechnical and Geoenvironmental Specifications) XML files. Load any DIGGS 3.0 instance document and explore its full contents through a structured, interactive interface — no installation, no server, no dependencies to manage.

---

## Purpose

DIGGS XML files can be large, deeply nested, and difficult to inspect with general-purpose tools. The DIGGS File Inspector is purpose-built to parse and display DIGGS 3.0 instance documents in a human-readable form that reflects the logical structure of the standard: projects, sampling features, sampling activities and samples, lab, in-situ and monitoring measurements, observation systems, program and construction activities, and project metadata — all rendered according to their schema roles.

The application is a single self-contained HTML file. Open it in any modern browser, drag-and-drop (or use the file picker to load) a DIGGS XML file, and the interface populates immediately. Nothing is sent to a server; all parsing and rendering happens locally in the browser.

---

## Target Users

- **Geotechnical engineers and geologists** who need to verify, review, or QC DIGGS data files produced by software or field data collection systems.
- **DIGGS implementers and software developers** who are building tools that produce or consume DIGGS XML and need to validate that their output is structured correctly.
- **DIGGS Technical Committee members and standard contributors** who need to inspect real-world instance documents during schema development and review.
- **Data managers and project personnel** who want a quick visual summary of what is in a DIGGS file without writing custom scripts.---

## Supported DIGGS Object Classes
This tool is currently under development and does not yet support all v. 3.0 objects and properties. The information below reflects the current state of progress.

### Document Information
The XML files name is parsed and displayed in a summary bar above the SF tabs, with file version, creation date, creating application, author and status, if available..

### Projects
- DIGGS files with multiple projects are supported. Select project of interest from the pill bar or dropdown in the left panel. All sampling features associated with the selected project will display in the summary table and map. Features referencing multiple projects appear under each.



- All `Project` properties in the file are parsed and displayed. Each project is accessible via a pill bar (up to 3 projects) or a dropdown (4 or more). If project metadata properties exist, they an be vieweed by clicking the project info button (ⓘ). Project metadata includes names, purpose, date span, roles and associated business associates, locality, status, remarks, associated files, and `otherProjectProperty` entries. The project info button (ⓘ) is disabled when the project is referenced only by fragment identifier with no corresponding element

### Sampling Features
All DIGGS 3.0 Sampling Feature types are recognized and displayed in the SF table and on the map. The level of detail support varies by type.

| Sampling Feature Type | Summary Table | Map | Detail Panel |
|---|---|---|---|
| `Borehole` | ✅ Full | ✅ Point marker | ✅ Full | 
| `Sounding` | ✅ Full | ✅ Point marker | ✅ Full | 
| `Well` | ✅ Full | ✅ Point marker | ✅ Full | 
| `TrialPit` | ✅ Full | ✅ Point marker | Metadata only |
| `Station` | ✅ Full | ✅ Point marker | Metadata only |
| `Transect` | ✅ Full | ✅ Polyline | Metadata only |
| `GroutTrenchCutoffWall` | ✅ Full | ✅ Polyline | Metadata only |
| `GP_Trackline` | ✅ Full | ✅ Polyline | Metadata only |
| `GP_MultiTrack` | ✅ Full (collapsible group rows) | ✅ Via member tracklines | Metadata only |
| `TrenchWall` | ✅ Full | ✅ Point marker | Metadata only |
| `GP_ArealSurvey` | ✅ Full | ✅ Polygon outline | Metadata only |

**Notes:**
- "Metadata only" in the Detail Panel column means the center panel displays the SF's identification, location, timing, roles, remarks, and associated data, but does not yet have type-specific properies or nested property information.
- Borehole and Sounding detail panels include full interval-based construction data tables (diameter, flush, casing, backfill, construction method, drill advancement, construction events, water strikes, etc.).
- Well detail panels include interval-based tables for openings, casing, installation events, maintenance events, and abandonment events.
### Observation Systems
The followign Observation Systems are supported;

| Observation System | System Properties | Observation Properties |
|---|---|---|
| `LithologySystem` | ✅ Full | 0D and 1D sampling features only |
| `ColorSystem` | -- | -- |
| `DiscontinuitySystem` | -- | -- |
| `GeoUnitSystem` | -- | -- |
| `StratigraphySystem` | -- | -- |
| `OtherObservationSystem` | -- | -- |

`LithologySystem` objects attached to Borehole, Sounding, and TrialPit features are fully parsed and rendered. The Lithology badge in the SF table expands to a detailed lithology log table. Each interval row includes:

| Column | Content |
|---|---|
| From / To | Depth interval with units |
| Classification | Primary classification badge (USCS, USCS-coarse, Wentworth, bedrock, etc.), clickable for full classification popup |
| Description | Free-text lithologic description |
| Unit Name / Facies | Stratigraphic identifiers |
| Details | Pill buttons for Color, Properties, Components, Placed Observations, and Boundary |

**Color popup:** Munsell code rendered as a CSS color swatch alongside all color descriptor fields.

**Properties popup:** Full `LithProperties` and `ComponentProperties` display, including general/soil fields (particle shape, structure, plasticity, consistency, moisture, cementation, inclusions, surface texture, dipAngle with apparent-dip suffix, recovery, particle sorting), rock fields (grain size, hardness, strength, weathering, rock mass description, slaking rate, sorting, RQD), particle size distribution sub-block with individual grain-size fraction entries, `otherLithProperty` as name/value pairs, and remarks.

**Components popup:** Per-component classification badge, description, and abundance, each with its own Properties pill.

**Placed Observations and Boundary popups:** Registered and accessible; content display depends on data present.

### Measurements
`for each samping feature, measurements are grouped together by their procedure type. A badge is displayed in the central pane for each procedure associated with the selected sampling feature. Clicking on the procedure badge will display the result properties and values in  either text or plot form. Metadata for each procedure is either not or partially supported at this time, depending on the procedure. Current status of measurement data is as follows:

| Test Procedure | Measurement Results | Procedure Metadata | Data Plots |
|---|---|---|---|
| AggregateAbrasionValueTest |✅ Full |-- |-- |
| AggregateCrushingValueTest |✅ Full | --|-- |
| AggregateElongationIndexTest|✅ Full |-- |-- |
| AggregateFlakinessIndexTest |✅ Full |-- |-- |
| AggregateImpactValueTest | ✅ Full|-- |-- |
| AggregatePolishedStoneValueTest |✅ Full |-- |-- |
| AggregateSlakeDurabilityTest |✅ Full |-- |-- |
| AggregateWaterAbsorptionTest | ✅ Full|v-- |-- |
| AtterbergLimitsTest | ✅ Full|-- |-- |
| ChalkCrushingValueTest |✅ Full |-- |-- |
| ConsolidationTest |✅ Full |-- |-- |
| DirectShearTest |✅ Full |-- |-- |
| DrivenPenetrationTest | ✅ Full|Drive sets only |-- |
| DynamicProbeTest |✅ Full |-- |-- |
| EnvironmentalScreeningTest | ✅ Full|-- |-- |
| FlatPlateDilatometerTest | ✅ Full|-- |-- |
| FrostSusceptibilityTest | ✅ Full|-- |-- |
| InsituCBRTest |✅ Full |-- |-- |
| InsituDensityTest |✅ Full |-- |-- |
| InSituPenetrometerTest |✅ Full |-- |-- |
| InsituPermeabilityTest |✅ Full |-- |-- |
| InsituResistivityTest |✅ Full |-- |-- |
| InsituVaneTest |✅ Full |-- |-- |
| LabCBRTest |✅ Full |-- |-- |
| LabChemicalTest |✅ Full |-- |-- |
| LabCompactionTest |✅ Full |-- |-- |
| LabDensityTest |✅ Full |-- |-- |
| LabPenetrometerTest |✅ Full |-- |-- |
| LabPermeabilityTest |✅ Full |-- |-- |
| LabResistivityTest |✅ Full |-- |-- |
| LabVaneTest |✅ Full |-- |-- |
| LabVelocityTest |✅ Full |-- |-- |
| LinearShrinkageTest |✅ Full |-- |-- |
| LosAngelesAbrasionTest |✅ Full |-- |-- |
| LossOnIgnitionTest |✅ Full |-- |-- |
| LugeonTest |✅ Full |-- |-- |
| MaterialGradationTest |✅ Full |-- |-- |
| MCVTest |✅ Full |-- |-- |
| MicroDevalTest |✅ Full |-- |-- |
| MWDProcedure |✅ Full |-- |-- |
| OrganicMatterByWetCombustionTest |✅ Full |-- |-- |
| ParticleSizeTest |✅ Full |-- |-- |
| PocketPenetrometerTest |✅ Full |-- |-- |
| PointLoadTest |✅ Full |-- |-- |
| PorePressureDissipationTest |✅ Full |Partial |Dissipation Time Series |
| PressuremeterTest |✅ Full |-- |-- |
| PumpingTest |✅ Full |-- |-- |
| RedoxTest |✅ Full |-- |-- |
| RelativeDensityTest |✅ Full |-- |-- |
| RockPorosityDensityTest | ✅ Full|-- |-- |
| SchmidtReboundHardnessTest |✅ Full |-- |-- |
| ShoreScleroscopeHardnessTest |✅ Full | | |
| SpecificGravityTest |✅ Full | | |
| StaticConePenetrationTest |✅ Plots only |Partial |-Depth-series plots of results |
| SuctionTest |✅ Full |-- |-- |
| SwellOrCollapseTest |✅ Full |-- |-- |
| TensileStrengthTest |✅ Full |-- |-- |
| TriaxialTest |✅ Full |-- |-- |
| UnconfinedCompressiveStrengthTest |✅ Full |-- |-- |
| WaterContentTest |✅ Full |-- |-- |
| WaterLevelMonitoring |✅ Plots only |-- Time-series plots of results |
| WirelineLog |✅ Full |-- |-- |



---

## Application Architecture

The inspector is a **single-file HTML application** (~11,000+ lines). It has no build step and no external dependencies beyond two libraries embedded in the file:

- **Leaflet 1.9.4** — interactive map rendering
- **proj4js** — coordinate reference system transformation (for projecting non-WGS84 coordinates to map display coordinates)

### Layout: Four Panes

```
┌────────────────┬──────────────────────────────┬────────────────────────┐
│ Left Column    │ Center: SF Detail Panel      │ Right: SF Association  │
│                │                              │ Panel (triggered when  │
│  SF Summary    │  Metadata for selected SF    │ selecting badges from  │
│  Table         │  (Section 4 descriptors)     │ central pane.          │
│                │   Measurement and observation|                        │                        │
│  Map           │    system badges             │                        │
└────────────────┴──────────────────────────────┴────────────────────────┘
```

The SF Summary Table at top-left lists all sampling features. Clicking a row selects it, populates the Detail Panel (center), and highlights the corresponding map marker.

### Parse Layer

On file load, `loadDIGGS(doc, filename)` orchestrates parsing:

1. **`parseProjects(doc)`** — builds `DIGGS_BA_MAP` (business associate lookup) and project registry.
2. **`parseSamplingFeature(doc, el, type)`** — called for every SF element; extracts identity fields, location (with CRS-aware coordinate projection), geometry (point/polyline/polygon), and type-specific fields. Returns a plain SF object stored in the unified `DIGGS_SF` Map keyed by type.
3. **Lithology parsing** — `parseLithologyObject()` / `parseLithProperties()` are called from within the Borehole/Sounding/TrialPit parsing paths and build `DIGGS_LITH[sfId]` arrays of typed observation objects.
4. **`enrichElevUnits()`** — asynchronous post-parse step that looks up vertical CRS definitions from the DIGGS CRS registry to resolve elevation units for each SF.
5. **`enrichLsrUoms(doc)`** — resolves unit-of-measure labels from `LocalSpatialReferenceSystem` definitions embedded in the file.

### Rendering Layer

All rendering is **config-driven**. No SF type or data type has bespoke rendering logic written directly into display functions. Instead:

- **`SF_TYPE_CONFIG`** governs how each SF type appears in the table and on the map.
- **`DIGGS_DISPLAY_LABELS` / `diggsLabel()`** provide human-readable labels for DIGGS element names throughout the UI.
- **`SF_DETAIL_DESCRIPTORS`** drive the center Detail Panel via `renderKVTable()`.
- **Lithology descriptor objects** (`LITH_TABLE_COLUMNS`, `LITH_PROPERTIES_GROUPS`, `LITH_CLASSIFICATION_DESCRIPTOR`, `LITH_COLOR_DESCRIPTOR`, `LITH_DETAIL_SECTIONS`, `LITH_PSD_DESCRIPTOR`) drive all lithology display via `renderLithBadgeContent()` and `renderFields()`.
- **`PROJECT_DETAIL_DESCRIPTOR`** drives the project info popup via `renderKVTable()`.
- **`KV_FORMAT` / `FORMAT_FN`** registries provide named formatter functions referenced by string key from within descriptors.

### Two Rendering Pipelines

There are two distinct rendering pipelines, each with its own descriptor shape. **Do not mix them.**

| Pipeline | Entry point | Used for |
|---|---|---|
| **KV Table** | `renderKVTable(el, descriptor)` | SF Detail Panel (center pane), Project info popup |
| **Fields / Detail Popup** | `renderFields(el, fields)` → `itemsToHtml()` | All `showDetailPopup()` content: lithology Classification, Color, Properties, Components popups |

### Map

The map is Leaflet-based with a basemap switcher (OpenStreetMap, CartoDB Positron, Esri Satellite, Esri Topo). CRS transformation is handled by proj4js; all coordinates are validated against strict WGS84 range bounds before being passed to Leaflet, with a graceful point-fallback path for unresolvable CRS references.

Point SF types render as labeled circle markers. Line SF types render as polylines from `centerLine`/`LinearExtent`. Planar SF types render as polygon outlines (no fill) from `featureExtent`. `GP_MultiTrack` members are rendered as individual polylines; the group header row in the table controls collective selection. Project geometry is rendered below SF markers in a muted style.

---

## Config and Descriptor Objects

### `SF_TYPE_CONFIG`

Defined near the top of the script section. One entry per SF type string (e.g., `'Borehole'`, `'GP_Trackline'`). Each entry has:

| Property | Type | Purpose |
|---|---|---|
| `label` | string | Human-readable type name shown in tab headings |
| `plural` | string | Plural form for tab labels |
| `mapGeom` | `'point'` \| `'line'` \| `'polygon'` \| `'none'` | Controls how the SF is drawn on the map |
| `marker` | object | Icon style for point types: `{ color, symbol, size }` |
| `lineStyle` | object | Polyline style for line types: `{ color, weight, opacity }` |
| `polygonStyle` | object | Polygon style for planar types |
| `tabOrder` | number | Controls left-to-right ordering of SF type tabs |

Example:
```js
Borehole: {
  label: 'Borehole', plural: 'Boreholes',
  mapGeom: 'point',
  marker: { color: '#4a9eff', symbol: '⬤', size: 12 },
  tabOrder: 10
}
```

### `DIGGS_DISPLAY_LABELS`

A flat object mapping DIGGS element/attribute names (as they appear in the schema) to display strings. Used by `diggsLabel(name)` throughout the UI wherever a human-readable label is needed but not explicitly supplied by a descriptor.

```js
const DIGGS_DISPLAY_LABELS = {
  boreholePurpose: 'Purpose',
  whenConstructed: 'Constructed',
  particleSizeValue: 'Size Value',
  // ...
};
```

To change how any DIGGS element name is displayed, add or modify an entry here.

### `SF_DETAIL_DESCRIPTORS`

An object with one array per SF type that has full Detail Panel support (`Borehole`, `Sounding`, `Well`). Each array is a **descriptor array** consumed by `renderKVTable()`.

**Descriptor array entries** for the KV Table pipeline:

| Property | Type | Purpose |
|---|---|---|
| `sectionHeader` | string | Renders a styled section divider; no path evaluation |
| `label` | string | Row label shown in the left column |
| `path` | XPath string | Evaluates relative to the SF element; text content used |
| `parentPath` | XPath string | Navigates to a child element first; `rawFormat` or `composite` then evaluates relative to it |
| `rawFormat` | string | Key into `KV_FORMAT` registry; function receives the navigated element and returns HTML |
| `composite` | array | Array of `{ path, prefix?, suffix?, sep? }` sub-specs; combined into a single string |
| `multi` | boolean | When true with `parentPath`, iterates all matching child nodes |
| `showEmpty` | boolean | When true, renders a `—` placeholder if no data found |
| `children` | array | Sub-descriptor rendered indented below the parent row (KV pipeline only) |

Example — a simple field:
```js
{ label: 'Purpose', path: 'diggs:boreholePurpose' }
```

Example — a delegated table:
```js
{ sectionHeader: 'Hole Diameter' },
{ label: '', parentPath: '.', rawFormat: 'renderHoleDiameterTable' }
```

Example — a composite field with conditional suffix:
```js
{ label: 'Plunge', parentPath: 'diggs:centerLine/diggs:LinearExtent',
  rawFormat: 'resolvePlunge' }
```

### `PROJECT_DETAIL_DESCRIPTOR`

A descriptor array with the same structure as SF_DETAIL_DESCRIPTORS entries, consumed by `renderKVTable()` to render the project info popup. Covers names, purpose, date range, roles, business associates, locality, status, remarks, associated files, and other project properties.

### `KV_FORMAT` and `FORMAT_FN`

`KV_FORMAT` is the named-function registry for the `rawFormat` property used in `renderKVTable()` descriptors. Each key is a string (used as the `rawFormat` value in descriptors); the corresponding function receives a DOM element and returns an HTML string.

`FORMAT_FN` is the lower-level function registry containing the actual implementations. `KV_FORMAT` functions are thin delegates into `FORMAT_FN`. Complex formatters like `renderBANested`, `renderRemarkNested`, `resolveBAName`, `timeIntervalInline`, `renderBoreholeConstruction*` tables, and orientation resolvers all live here.

To add a new formatter:
1. Add the implementation function to `FORMAT_FN`.
2. Add a `KV_FORMAT` entry that delegates to it (or implement it directly in `KV_FORMAT` if it is simple).
3. Reference the `KV_FORMAT` key as `rawFormat: 'yourKey'` in any descriptor.

### `buildIntervalTable(parentEl, config)`

A generic engine for rendering interval-indexed data tables (construction records, casing, openings, etc.). Called from `KV_FORMAT` functions rather than from descriptors directly. Config properties:

| Property | Purpose |
|---|---|
| `rowPath` | XPath relative to `parentEl` to find row elements |
| `locationPath` | XPath within each row to the `LinearExtent` for from/to depth columns |
| `srsDimensionDefault` | Fallback for depth extraction when `srsDimension` attribute is absent |
| `columns` | Array of column specs: `{ label, path, format?, width? }` |

### Lithology Descriptor Objects

All lithology rendering is driven by a family of descriptor objects consumed by `renderLithBadgeContent()` and the `renderFields()` pipeline.

#### `LITH_TABLE_COLUMNS`

Array of column spec objects for the lithology log table. Each entry:

| Property | Purpose |
|---|---|
| `key` | Identifier used internally to route to the correct cell builder |
| `label` | Column header text |
| `width` | CSS width string |
| `buildFn` | String key for the cell-builder function (e.g., `'buildClassCell'`, `'buildDescCell'`) |

#### `LITH_PROPERTIES_GROUPS`

Concatenation of `LITH_PROPS_SOIL` and `LITH_PROPS_ROCK` arrays. Used as the `fields` argument to `renderFields()` for both LithProperties and ComponentProperties popups. Entries use the **Fields/Detail Popup pipeline** shape:

| Property | Type | Purpose |
|---|---|---|
| `sectionHeader` | string | Ignored in `renderFields` (KV pipeline only) — skip silently |
| `subHeader` | string | Renders a styled uppercase section label |
| `guardPath` | XPath string | When on a `subHeader` entry, suppresses the header if no nodes match |
| `label` | string | Row label |
| `path` | XPath string | Evaluates relative to the context element |
| `parentPath` | XPath string | Navigate to child node(s) first; `composite` or `fields` then applies relative to each |
| `composite` | array | Sub-path specs assembled into a single string: `{ path, prefix?, suffix?, sep?, skipIf? }` |
| `fields` | array | Sub-descriptor; recurse into matched child with a nested `renderFields()` call |
| `format` | string | Key into `FORMAT_FN` for value transformation |
| `multi` | boolean | Iterate all matching nodes |
| `italic` | boolean | Render value in italics |
| `bold` | boolean | Render label in bold |
| `indent` | boolean | Indent the row visually |
| `showEmpty` | boolean | Render `—` when absent |

#### `LITH_PSD_DESCRIPTOR`

Descriptor array for the Particle Size Distribution sub-block within LithProperties. Context element is `diggs:ParticleSizeDistribution`. Each grain-size fraction entry uses `parentPath` pointing to the relevant `diggs:*Grainsize/diggs:ParticleSize` element and a `composite` spec assembling size value, unit, and description.

#### `LITH_CLASSIFICATION_DESCRIPTOR` and `LITH_COLOR_DESCRIPTOR`

Flat descriptor arrays for the Classification and Color popups respectively, consumed by `renderFields()`. `LITH_COLOR_DESCRIPTOR` entries include a `format: 'munsellSwatch'` key that renders a CSS color swatch alongside the Munsell code string.

#### `LITH_DETAIL_SECTIONS`

Array of section-spec objects driving `_buildLithDetailCell()` — the function that produces the Details column pill buttons. Each entry:

| Property | Purpose |
|---|---|
| `key` | Unique string identifying the pill (e.g., `'color'`, `'props'`, `'comps'`) |
| `label` | Text shown on the pill button |
| `hasData` | `(obs) => boolean` — controls whether the pill appears |
| `buildSections` | `(obs, allObs) => [{title, els, fields}]` — returns the popup section specs |

---

## Modifying Descriptors

The config-driven architecture means that most display changes — adding fields, changing labels, reordering sections, adding formatters — require only editing descriptor objects. No display function logic needs to change.

### Changing a Field Label

Labels in the SF Detail Panel come from the `label` property of descriptor entries in `SF_DETAIL_DESCRIPTORS`. For example, to change "Purpose" to "Borehole Purpose" for Borehole:

```js
// Before:
{ label: 'Purpose', path: 'diggs:boreholePurpose' }

// After:
{ label: 'Borehole Purpose', path: 'diggs:boreholePurpose' }
```

For labels throughout the application that derive from element names (rather than explicit `label` properties), edit `DIGGS_DISPLAY_LABELS`.

### Adding a New Field to an SF Detail Panel

Find the appropriate type's array in `SF_DETAIL_DESCRIPTORS` and add a descriptor entry at the desired position:

```js
// Add a simple text field to Borehole:
{ label: 'Drilling Fluid', path: 'diggs:drillingFluid' }

// Add a field that formats its value:
{ label: 'Start Date', parentPath: 'diggs:whenConstructed/diggs:TimeInterval',
  rawFormat: 'renderTimeInterval' }
```

If the element you are adding uses a format not yet in `KV_FORMAT`, add a function there first (see the **Adding a Custom Formatter** section below).

### Adding a New Section to an SF Detail Panel

Insert a `sectionHeader` sentinel followed by field entries:

```js
{ sectionHeader: 'Rock Quality' },
{ label: 'RQD',          path: 'diggs:rqd' },
{ label: 'RQD Length',   path: 'diggs:rqdLength' },
```

Sections are purely visual dividers; they have no effect on XPath evaluation.

### Adding a Field to a Lithology Popup

The Properties popup is driven by `LITH_PROPS_SOIL` (for soil and universal fields) and `LITH_PROPS_ROCK` (for rock-specific fields). Add entries using the `renderFields` pipeline shape. For a simple text field on the LithProperties element:

```js
{ label: 'Organic Content', path: 'diggs:organicContent' }
```

For a field on a child element:
```js
{ label: 'Induration', parentPath: 'diggs:induration/diggs:Induration',
  composite: [{ path: 'diggs:indurationDescription' }] }
```

If you add a `subHeader` entry and only want it to appear when data is present, add `guardPath`:
```js
{ subHeader: 'Induration', guardPath: 'diggs:induration/diggs:indurationDescription' },
```

Fields added to `LITH_PROPS_SOIL` render for both LithProperties and ComponentProperties (because both use `LITH_PROPERTIES_GROUPS`). Fields that only apply to rock specimens should go in `LITH_PROPS_ROCK`.

### Adding a Custom Formatter

1. Add an implementation to `FORMAT_FN`:

```js
const FORMAT_FN = {
  // ... existing entries ...

  myFormatter(node) {
    const val = node.textContent.trim();
    return val ? `<em>${escHtml(val)}</em>` : '';
  }
};
```

2. Add a `KV_FORMAT` delegate if you need to use it from `renderKVTable` descriptors:

```js
const KV_FORMAT = {
  // ... existing entries ...
  myFormatter(el) { return FORMAT_FN.myFormatter(el); }
};
```

3. Reference it in a descriptor:

```js
// In SF_DETAIL_DESCRIPTORS (KV pipeline):
{ label: 'My Field', parentPath: 'diggs:myElement', rawFormat: 'myFormatter' }

// In LITH_PROPERTIES_GROUPS (renderFields pipeline):
{ label: 'My Field', path: 'diggs:myElement', format: 'myFormatter' }
```

Note that `rawFormat` (string key) is used in `renderKVTable` descriptors, while `format` (string key into `FORMAT_FN`) is used in `renderFields` descriptors.

### Adding Support for a New SF Type's Detail Panel

1. Add the type to `SF_DETAIL_DESCRIPTORS` with a descriptor array:

```js
SF_DETAIL_DESCRIPTORS.TrialPit = [
  { sectionHeader: 'Classification' },
  { label: 'Purpose', path: 'diggs:trialPitPurpose' },
  // ...
];
```

2. The rendering infrastructure (`showSFDetail` → `renderSFMetadata`) automatically picks up the new entry. No other changes are required for basic KV-table display.

For interval-based child data (like borehole construction tables), write a `KV_FORMAT` function that calls `buildIntervalTable()` with the appropriate config, then reference it from a `rawFormat` descriptor entry.

---

## Running the Application

No build step is required. Open `diggs_file_inspector.html` in any modern browser (Chrome, Firefox, Edge, Safari). Use the file picker or drag-and-drop a DIGGS 3.0 XML file onto the drop zone to load it.

The application has been tested with DIGGS 3.0 instance documents conforming to the `https://diggsml.org/schemas/3` namespace. Files using the earlier `schema-dev` namespace may parse with partial results.

---

## Status and Roadmap

This application is actively developed. Current focus areas:

- Expanding Detail Panel coverage to `TrialPit`, `Station`, and geophysical SF types
- Rendering associated `*System` subtypes beyond `LithologySystem` and `MonitoringSystem` (e.g., `SamplingSystem`, `SpecimenCollectionSystem`, measurement result systems)
- Basemap layer switching improvements
- Validation feedback overlays for schema-conformance issues

Contributions and issue reports are welcome. When reporting a display problem, please include the relevant fragment of the DIGGS XML that is not rendering correctly.

---

## License

[To be added]
