# DIGGS File Inspector
Last Updated - Aug. 7, 2026 *(the information herein may be superceded by more recent application commits)*

*A standalone, browser-based viewer for [DIGGS](https://www.diggsml.org/) (Data
Interchange for Geotechnical and Geoenvironmental Specialists) XML files. Open
one HTML file, drop in a DIGGS instance document, and explore its full contents
— features, geometry, lithology, samples, tests, monitoring records and
geophysical results — through an interactive, geotechnically-aware interface.*

*No installation. No server. No account.* **Your data never leaves your computer.**

---

## Contents

- [What it does](#what-it-does)
- [Quick start](#quick-start)
- [Who it's for](#who-its-for)
- [User guide](#user-guide)
  - [How the screen is organized](#how-the-screen-is-organized)
  - [1 · The file bar](#1--the-file-bar)
  - [2 · Choosing a project](#2--choosing-a-project)
  - [3 · The feature table and map](#3--the-feature-table-and-map)
  - [4 · The Detail panel](#4--the-detail-panel)
  - [5 · The Associated Data panel](#5--the-associated-data-panel)
  - [Reading the data: expansion triangles and link icons](#reading-the-data-expansion-triangles-and-link-icons)
  - [Graphics ↔ data: where selections are linked](#graphics--data-where-selections-are-linked)
  - [Working with plots](#working-with-plots)
  - [Working with 3D views](#working-with-3d-views)
- [What the Inspector displays](#what-the-inspector-displays)
  - [Sampling features](#sampling-features)
  - [Observation systems](#observation-systems)
  - [Samples and sampling activities](#samples-and-sampling-activities)
  - [Measurements and test procedures](#measurements-and-test-procedures)
  - [Result domains and visualization](#result-domains-and-visualization)
  - [Project and document metadata](#project-and-document-metadata)
- [Architecture and privacy](#architecture-and-privacy)
  - [What works offline](#what-works-offline)
- [Coordinate reference systems](#coordinate-reference-systems)
  - [Embedded CRS support](#embedded-crs-support)
  - [Vertical datums](#vertical-datums)
  - [Non-EPSG reference systems](#non-epsg-reference-systems)
  - [srsName formats recognized](#srsname-formats-recognized)
  - [Reference registries and dictionaries](#reference-registries-and-dictionaries)
- [Known limitations](#known-limitations)
- [Reporting problems](#reporting-problems)
- [License](#license)

---

## What it does

DIGGS files are large, deeply nested, and heavily cross-referenced. A borehole's
lithology may live in a separate observation system halfway down the document,
its samples in a third place, and the lab tests on those samples in a fourth —
joined only by `xlink:href` identifiers. Generic XML tools show you the tree;
they don't show you the borehole.

The DIGGS File Inspector resolves those relationships and presents the file the
way a geotechnical professional thinks about it:

- **Sampling-feature centric.** Pick a borehole, sounding, well, trench wall or
  survey line, and everything attached to it — construction record, lithology,
  samples, in-situ and lab tests, monitoring data — is one click away.
- **Geometry-aware.** Coordinates are transformed and mapped, centerlines are
  classified (vertical / inclined / deviated / multilateral) and viewable in 3D,
  surface and solid feature extents are measured and rendered.
- **Graphical where a graphic is the right answer.** Patterned lithology logs,
  well-construction diagrams, grain-size and Atterberg plots, depth and
  time-series profiles, ERT-style heat maps, 3D volumes.
- **Complete where completeness matters.** Every field the display engine knows
  about is shown, with its unit, its code space, and its provenance — no
  silently dropped data.

---

## Quick start

1. Download `diggs_file_inspector.html` (a single file — clone the repo or use
   the raw download).
2. Open it in a modern browser (Chrome, Edge, Firefox, or Safari). Double-clicking
   the file is fine; it runs from `file://`.
3. Drag a DIGGS file onto the drop zone, or click to browse. Both the `.xml` and
   `.diggs` extensions are accepted — they carry the same payload, a DIGGS XML
   instance document.

The interface populates immediately. To load a different file, click **↩ Load New
File** (or the logo) in the top-left.

> **Note on file size.** Very large instance documents (tens of MB) parse in a few
> seconds; the spinner stays up until parsing completes.

> **Note on caching.** If you replace `diggs_file_inspector.html` with a newer
> version and the browser still shows old behavior, a plain reload may not be
> enough — clear the cache or open it in a private window.

---

## Who it's for

- **Geotechnical engineers and geologists** verifying, reviewing or QC-ing DIGGS
  data delivered by a consultant, drilling contractor or field data-collection
  system.
- **DIGGS implementers and software developers** checking that what their
  software writes is what a consumer will actually read.
- **DIGGS Technical Committee members and contributors** inspecting real-world
  instance documents during schema development.
- **Data managers and project personnel** who need to see what is in a file
  without writing a script.

---

## User guide

### How the screen is organized

```
┌───────────────────────────────────────────────────────────────────────────────┐
│  FILE BAR   file name · created · author        [type counts]   ↩ Load New    │
├────────────────────┬────────────────────────────┬─────────────────────────────┤
│  Project selector  │                            │                             │
│  ┌──────────────┐  │   DETAIL PANEL             │   ASSOCIATED DATA PANEL     │
│  │ Feature tabs │  │                            │                             │
│  │ Summary table│  │   1 · Feature header       │   Construction graphic      │
│  └──────────────┘  │   2 · Location / CRS grid  │   (auto), then whichever    │
│  ═══ drag ═══      │   3 · Associated Data tabs │   badge you click:          │
│  ┌──────────────┐  │   4 · Full metadata (KV)   │   lithology log, samples,   │
│  │     MAP      │  │                            │   result tables, plots,     │
│  │   + legend   │  │                            │   3D views                  │
│  └──────────────┘  │                            │                             │
└────────────────────┴────────────────────────────┴─────────────────────────────┘
        left column        ║ drag ║                    ║ drag ║
```

The three columns are separated by **drag handles** — grab the vertical bars to
rebalance the columns, or the horizontal bar in the left column to trade table
height for map height.

### 1 · The file bar

Shows the loaded file name, its `DocumentInformation` creation date and author(s),
and a count badge per sampling-feature type present in the file. Clicking the
logo or **↩ Load New File** returns to the load screen and fully resets state.

Four action buttons operate on the loaded file:

- **✓ Validate** — sends the file to the official DIGGS schema validation
  service (`diggs.geosetta.org`) and reports errors and warnings in a dialog.
  Requires an internet connection; the file is sent only for validation.
- **⤓ Export DIGGS XML** — downloads the raw DIGGS XML exactly as it was
  loaded (byte-for-byte; the Inspector never rewrites your data).
- **🖫 Save Shareable File** — downloads a single self-contained HTML file
  with the DIGGS data embedded. Anyone can open it in a browser — it boots
  straight into the Inspector with the data loaded, and carries the same
  Validate / Export / Load New File abilities.
- **↩ Load New File** — returns to the load screen to open another file
  (also available inside a saved shareable copy).

### 2 · Choosing a project

A DIGGS file may contain several projects. The **Project** dropdown at the top of
the left column filters everything below it: only the sampling features belonging
to the selected project appear in the tabs, the summary table and the map. A
feature referenced by more than one project appears under each. An **All
Projects** entry at the bottom of the list removes the filter.

**View Details --->** opens the project's own metadata (names, purpose, dates,
roles and business associates, locality, status, remarks, associated files,
`otherProjectProperty`) in the centre Detail panel. The button is hidden when the
file only references a project by identifier with no `Project` element to show.
Project geometry (reference point, linear extents, areal extents) is **never
auto-plotted** — each occurrence carries its own **Show on Map** button, and only
one project geometry is shown at a time.

Selecting any sampling feature replaces the project view in the centre panel;
the two never share it.

### 3 · The feature table and map

**Tabs** — one per sampling-feature type present in the (filtered) file, with a
count. The table below has six columns: *Name*, *Depth / Extent*, *Date*,
*Parent Feature*, *Installations*, *Purpose*.

- *Depth / Extent* shows the feature's own reported measurement with its unit.
  Where the Inspector can also compute the value from geometry (centerline
  length, surface area) it cross-checks the two and flags a disagreement beyond
  2 %.
- *Parent Feature* is a live link for installations — a well or pile jumps to the
  borehole it was installed in.
- *Installations* lists what was installed inside the feature.
- **GP_MultiTrack** and **RI Foundation System** rows are expandable group
  headers; clicking one opens an accordion of its member tracklines, or its load
  transfer platforms and rigid inclusions.

**Map** — Leaflet, with a basemap switcher (Street, Dark, Satellite, Topo) in the
top-right corner and a legend strip beneath. Point features render as coloured
symbols, linear features as polylines, planar features as filled polygons.
Clicking a marker selects the feature exactly as clicking its table row does, and
vice versa; the selected feature is highlighted in bright pink and brought to the
front (so a feature sharing coordinates with another can't be hidden underneath).

Features whose coordinates cannot be resolved to real-world positions are still
fully listed and inspectable — they simply carry no marker, and the Detail panel
explains why.

### 4 · The Detail panel

Selecting a feature builds four sections in the centre column:

1. **Header** — type, name, identifier.
2. **Location** — the full CRS description (horizontal and vertical components,
   with the source of each display unit noted), both horizontal coordinates,
   elevation, and total depth / extent. Warnings appear here: an unresolvable
   CRS, a detected latitude/longitude axis swap, or a reported-vs-computed
   geometry mismatch.
3. **Associated Data** — the badge panel (see below).
4. **Feature metadata** — the complete, schema-traced key/value rendering of that
   feature type: identification, purpose, timing, roles and business associates,
   trajectory, linear referencing, construction records, events, water strikes,
   remarks, associated files and any `other…Property` entries.

Sections 1–3 stay pinned; section 4 scrolls independently.

Feature types without a metadata configuration yet simply show no section 4 (see
[Sampling features](#sampling-features) for which types are complete).

### 5 · The Associated Data panel

The right-hand column. Two things put content here:

**Automatically — the Construction graphic.** Selecting any feature that carries
construction data immediately draws a depth-scaled column diagram, without your
clicking anything:

| Column | Contents |
|---|---|
| **Lithology** | Patterned graphic log of every non-overlapping lithology system logged on the feature |
| **Wells and Backfill** | Backfill layers as patterned zones, with any well installed in the hole drawn over them — solid casing as plain pipe, screened intervals as slotted pipe, scaled to real relative diameters and centred on each well's own axis |
| **Casing** | The parent feature's own casing program, drawn concentrically (widest first) and coloured by material, with a mirrored diameter scale |
| **Hole Diameter** | A staircase depth-vs-diameter chart of the reported hole diameters |

A blue water-table symbol (triangle plus tick) is drawn beside the first present
column at the depth of the most recent water-strike reading. Each patterned
column has its own collapsible legend beneath it (all legends start closed, so
the log itself gets the height). Selecting a **Well** shows the parent borehole's
lithology and backfill with only that one well's casing and screen drawn.

**On demand — the badges.** Section 3 of the Detail panel groups everything else
attached to the feature into three tabs:

| Tab | Contains |
|---|---|
| **Material Samples** | The joined sampling-activity / sample table plus its depth-scaled sample marker column |
| **Observations** | The Lithology badge — graphic log beside the interval table |
| **Measurements** | One badge per test/monitoring procedure type found on the feature, with a count |

Click a tab to open its grid, then a badge to load it into the panel. Clicking a
badge replaces the Construction graphic; re-selecting the feature brings the
Construction graphic back.

A measurement badge lays out up to three **resizable, collapsible panes** —
**Plot**, **Results**, and procedure **Metadata**. Drag the divider between any
two panes to resize; click a pane header to collapse it and give its space to
the others. When a plot is present, Results and Metadata start collapsed so the
plot gets the room.

### Reading the data: expansion triangles and link icons

Almost everything in the Inspector is progressive disclosure. The conventions are
consistent everywhere:

| You see | It means |
|---|---|
| **▸ / ▾ orange section header** | A collapsible category. Click anywhere on the header. |
| **▸ at the left of a table row** | That row expands to every remaining field of the object it summarizes — the interval tables (lithology, casing, construction methods, reference points, samples, aggregated test results) show a handful of summary columns and hide the rest here. A row with nothing left over has no triangle. |
| **🔗 next to a field label** | The value's `codeSpace` is a dictionary URL. Click to open that dictionary entry in a new tab (needs internet). |
| **small grey text under a label** | A plain-text `codeSpace` (typically the organization that defined the code). |
| **Underlined name** | A business associate. Click for their full contact record. |
| **Clickable result-table column header** | Opens that property's full `Property` definition — class, code space, null value, qualifiers, detection limits, sampling rate. |
| **`—`** | The field exists in the file but carries no value in this particular record. |
| **Value uom (extra)** | The value, its unit, then any other attributes on that element in one parenthetical. |

Repeating objects each get their own header rather than being merged, so you can
always tell two occurrences apart. Units are shown as reported, with UCUM
exponents rendered properly (`m2` → m²).

### Graphics ↔ data: where selections are linked

Wherever a graphic sits next to a table, the two are synchronized in both
directions:

- **Lithology** — clicking a zone in the graphic log expands its table row and
  scrolls to it; clicking the row outlines its zone in white.
- **Samples** — clicking a sample marker highlights and expands its row in the
  joined table, and vice versa. Markers are coloured by sampling method, shaped
  by the activity (triangle = point sample, rectangle = driven interval), and
  drawn so that unrecovered length reads as a hollow gap.
- **Rigid inclusions / CMC piles** — table rows and their map markers select
  together.
- **Samples ↔ tests** — if a sample's expanded record lists **Associated
  Measurements**; clicking one jumps to the owning feature, opens the right
  procedure badge and expands the exact result row. The reverse link ("Sample
  Name" on a test or specimen) navigates back.
- **Show on Map** — on project geometry rows.
- **View 3D** — on trajectory and feature-extent rows (see below).

### Working with plots

Every depth, time-series and procedure plot shares one toolbar and one
interaction model:

- **⊞ Reset** — back to full extent. **＋ / －** — zoom. **n=** — point count.
- **Scroll** to zoom, **drag** to pan, **hover** for a crosshair and a value
  tooltip.
- Depth profiles always span the full depth of the hole (0 to total depth), not
  just the data's own range, so two properties are directly comparable.
- Where a lithology log exists, a bare patterned reference column is drawn to the
  left of a depth-profile row at the same scale, so values can be read against
  the material at that depth.
- Grain-size distribution curves use a fixed 0.001–125 mm × 0–100 % frame on
  every test so any two curves are directly comparable.

### Working with 3D views

**View 3D** buttons open an interactive Three.js scene in the Associated Data
panel:

| Where | What it shows |
|---|---|
| A borehole, sounding, well or rigid inclusion whose trajectory is **Inclined**, **Deviated** or **Multilateral** | The real centerline as a 3D tube, with vertex markers at every survey station, elevation ladder, and every sidetrack leg drawn in its own colour |
| A **GP_Trackline** with real elevation change | The survey path as a 3D line |
| A **planar or volumetric sampling feature** | The actual surface patches or solid faces, with a **Solid / Translucent** toggle |
| A **3D gridded result** (e.g. a 3D resistivity array) | A point cloud, three orthogonal index-sliced surfaces with continuous (interpolated) position sliders, and — where the dataset is small enough and WebGL 2 is available — a GPU ray-marched translucent volume |

Controls: drag to orbit, scroll to zoom, right-drag to pan. The toolbar offers
**Reset**, **Plan**, **N Elevation**, **E Elevation** and an
**Isometric (Perspective) or Orthographic** toggle, with a labelled N/E/Up orientation gizmo in
the corner.

---

## What the Inspector displays

This tool is under active development and does not yet cover every DIGGS object
and property. The tables below reflect the current state, checked against the
[DIGGS 3.1-dev schema](https://github.com/DIGGSml/schema-dev/tree/3.1-dev).

Legend: **✅ Full** · **◐ Partial** · **— Not yet**

### Sampling features

Every sampling-feature type in the schema is recognized, listed and (where its
geometry resolves) mapped. Depth of *metadata* coverage varies.

| Sampling feature | Summary table | Map | Feature metadata | Construction graphic | 3D view |
|---|---|---|---|---|---|
| `Borehole` | ✅ Full | ✅ Point | ✅ Full | ✅ Full | ✅ Trajectory |
| `Sounding` | ✅ Full | ✅ Point | ✅ Full | ✅ Full | ✅ Trajectory |
| `Well` | ✅ Full | ✅ Via parent feature | ✅ Full | ✅ Full (parent's hole + this well) | ✅ Trajectory |
| `RigidInclusion` | ✅ In RIFS accordion | ✅ Via parent system | ✅ Full | ◐ Water strike / lithology | ✅ Trajectory |
| `RIFoundationSystem` | ✅ Full (accordion) | ✅ Polygon | ✅ Full | — | — |
| `LoadTransferPlatform` | ✅ In RIFS accordion | ✅ Zone polygons | ✅ Full | — | — |
| `GP_Trackline` | ✅ Full | ✅ Polyline | ✅ Full | — | ✅ Path |
| `PlanarSamplingFeature` | ✅ Full | ✅ Polygon | ✅ Full | — | ✅ Surface |
| `VolumetricSamplingFeature` | ✅ Full | ✅ Point | ✅ Full | — | ✅ Solid |
| `TrialPit` | ✅ Full | ✅ Point | — | ◐ Lithology only | — |
| `Station` | ✅ Full | ✅ Point | — | ◐ Lithology only | — |
| `Transect` | ✅ Full | ✅ Polyline | — | ◐ Lithology only | — |
| `GroutTrenchCutoffWall` | ✅ Full | ✅ Polyline | — | — | — |
| `TrenchWall` | ✅ Full | ✅ Polygon | — | — | — |
| `GP_ArealSurvey` | ✅ Full | ✅ Polygon | — | — | — |
| `GP_MultiTrack` | ✅ Full (group rows) | ✅ Via member tracklines | — | — | — |
| `SteelHPile` | ✅ Full | ✅ Via parent feature | — | — | — |
| `SteelPipePile` | ✅ Full | ✅ Via parent feature | — | — | — |
| `ConcretePile` | ✅ Full | ✅ Via parent feature | — | — | — |
| `TimberPile` | ✅ Full | ✅ Via parent feature | — | — | — |

**Notes**

- A feature type with **—** under *Feature metadata* still appears everywhere
  else — table, map, location and CRS panel, and all of its associated
  lithology, samples and measurements. What it does not yet have is a section 4
  rendering of its own type-specific properties.
- The **Construction graphic** is driven by the *data present*, not by feature
  type: any feature carrying lithology, backfill, casing, hole diameters or water
  strikes gets the corresponding columns.
- **Feature-extent geometry** supported for mapping, measurement and 3D:
  `PlanarSurface`, `MultiPlanarSurface`, `CompositeSurface` (including members
  with independent CRSs, and members shared by `xlink:href`), `MultiSurface`,
  `TriangulatedSurface`, and `Solid` (outer shell; interior voids are not
  analyzed).
- Feature extents are classified automatically: planar features report
  **Orientation** (Horizontal / Vertical / Sloping) and **Shape** (Planar /
  Multi-Planar / Composite / Triangulated / Multi Surface); volumetric features
  report **Shape** (Prism / Polyhedra / Curved).

### Observation systems

| Observation system | System properties | Observations |
|---|---|---|
| `LithologySystem` | ✅ Full | ✅ Full for 0D and 1D sampling features |
| `ColorSystem` | — | — |
| `DiscontinuitySystem` | — | — |
| `GeoUnitSystem` | — | — |
| `StratigraphySystem` | — | — |
| `OtherObservationSystem` | — | — |

`LithologySystem` coverage is complete against the schema and includes every
nested type: `LithologyObservation`, `Lithology`, `ComponentLithology` /
`ComponentLith`, `Color` / `ColorComponents`, `Constituent`, `LithProperties`
and `ComponentProperties` (soil *and* rock fields, including RQD and recovery),
`ParticleSizeDistribution` / `ParticleSize`, `PlacedObservation`, and `Boundary`.

The **graphic log** renders each interval with a real lithologic pattern:

- All 26 USCS (ASTM D2487) soil groups — 15 basic, 11 dual — plus fill.
- Sedimentary, igneous and metamorphic rock types.
- Patterns are recreated from the **FGDC** standard lithologic pattern set, over
  a per-family background colour (gravels orange, sands yellow, silts green,
  clays blue, organics grey, sedimentary rock on white, igneous/volcanic on red,
  metamorphic on purple).
- Material is resolved from `classificationCode`, then `classificationSymbol`,
  then `legendCode`, then free-text `lithDescription` (parsed for dominant
  lithology and fines qualifier, e.g. "poorly graded sand with clay" → SP-SC).
- `lithology_pattern_reference.pdf` in this repo is a printable vector swatch
  sheet of every pattern.

Lithology display for 2D/3D sampling features (patterned trench-wall and outcrop
polygons) is **not yet implemented** — those features show an explanatory
placeholder.

### Samples and sampling activities

| Object | Coverage |
|---|---|
| `SamplingActivity` | ✅ Full |
| `Sample` | ✅ Full |
| `SampleProduced` | ✅ Full |
| `Container`, `SampleDimensions`, `ChainOfCustodyEvent` | ✅ Full |
| 2D / 3D sampling features | — Placeholder |

Sampling activities and the samples they produced are joined into one table —
one row per activity/sample pair — sorted by depth, with columns for activity
depth, method, sample name, sample depth, sample type and **Recovery %**.

Recovery is computed rather than assumed, in priority order: a reported
`totalSampleRecovery`, else `totalSampleRecoveryLength` ÷ activity interval, else
the sample's own recovered interval ÷ activity interval, else 100 % for a point
sample and 0 % for an interval with no recovery data at all. All arithmetic is
done in metres from the raw values, not from rounded display strings.

An activity with no sample produced still gets a row — "no sample" is data.

### Measurements and test procedures

Measurements (`Test`, `Monitor`, `MaterialTest`, `MeasurementWhileDrilling`) are
grouped into one badge per procedure type per feature. **Every procedure type in
the schema is supported at the baseline level**, because result parsing and
metadata rendering are generic rather than written per procedure:

| Capability | Coverage |
|---|---|
| **Result table** — one column per `Property`, type-aware, with unit and clickable property definition | ✅ All procedure types |
| **Automatic depth / time plots** — one per drawable numeric column, whenever the result domain is numeric and spatial or temporal | ✅ All procedure types |
| **Measurement metadata** — name, investigation target, timing, roles, sample cross-reference, remarks | ✅ All procedure types |
| **Procedure metadata** — the procedure object's own fields, equipment, specifications, environment, test events, specimens | ✅ All procedure types (generic rendering) |
| **Curated field order / labels / sub-tables** | ◐ Selected types (below) |
| **Discipline-specific plots** | ◐ Selected types (below) |

Where one measurement badge aggregates several separate measurement objects (for
example eight SPT tests on one borehole), each result row expands to *that*
measurement's own metadata and procedure record, so nothing is misattributed to
a single "representative" test.

**Procedures with enhanced, hand-tuned display:**

| Procedure | Enhancement |
|---|---|
| `AtterbergLimitsTest` | Curated layout; trial data as compact tables; **liquid-limit flow curve** (water content vs. log blow count or cone penetration, with the LL reference construction drawn at N=25 / 20 mm) and the **USCS plasticity chart** (A-line, U-line, 50 % divider, hatched CL-ML zone, classification regions, this test's own LL/PI point) side by side |
| `ParticleSizeTest` | Curated layout; sieve and hydrometer data as tables; **grain-size distribution curve** pooling every sieve and hydrometer stage into one smooth spline on a fixed comparative 0.001–125 mm × 0–100 % frame |
| `PorePressureDissipationTest` | **Dissipation time-series plot** from the procedure's own temporal result |
| `DrivenPenetrationTest` | **Drive Sets** summary column (e.g. `5/9/10`) in the result table |
| `StaticConePenetrationTest` | Curated layout including pore-pressure element and saturation details |
| `WaterLevelMonitoring` | Curated layout; **reference points as an interval table** (start/end), so a reference point reset mid-monitoring reads correctly |
| `GeophysicalProcessing` | One badge per `geophysicalMethod` rather than one generic badge, so ERT, seismic refraction, GPR and magnetometry on the same feature stay separate |

**All procedure types recognized** (baseline coverage as above):

*In-situ* — `DrivenPenetrationTest`, `DynamicProbeTest`, `FlatPlateDilatometerTest`,
`GP_FieldProcedure`, `InSituPenetrometerTest`, `InsituCBRTest`, `InsituDensityTest`,
`InsituPermeabilityTest`, `InsituResistivityTest`, `InsituVaneTest`, `LugeonTest`,
`MWDProcedure`, `PorePressureDissipationTest`, `PressuremeterTest`, `PumpingTest`,
`StaticConePenetrationTest`, `WaterLevelMonitoring`, `WirelineLog`

*Laboratory* — `AggregateAbrasionValueTest`, `AggregateCrushingValueTest`,
`AggregateElongationIndexTest`, `AggregateFlakinessIndexTest`,
`AggregateImpactValueTest`, `AggregatePolishedStoneValueTest`,
`AggregateSlakeDurabilityTest`, `AggregateSoundnessTest`,
`AggregateTenPercentFinesTest`, `AggregateWaterAbsorptionTest`,
`AtterbergLimitsTest`, `ChalkCrushingValueTest`, `ConsolidationTest`,
`DirectShearTest`, `EnvironmentalScreeningTest`, `FrostSusceptibilityTest`,
`LabCBRTest`, `LabChemicalTest`, `LabCompactionTest`, `LabDensityTest`,
`LabPenetrometerTest`, `LabPermeabilityTest`, `LabResistivityTest`, `LabVaneTest`,
`LabVelocityTest`, `LinearShrinkageTest`, `LosAngelesAbrasionTest`,
`LossOnIgnitionTest`, `MCVTest`, `MicroDevalTest`, `ParticleSizeTest`,
`PocketPenetrometerTest`, `PointLoadTest`, `RedoxTest`, `RelativeDensityTest`,
`RockPorosityDensityTest`, `SchmidtReboundHardnessTest`,
`ShoreScleroscopeHardnessTest`, `SpecificGravityTest`, `SuctionTest`,
`TensileStrengthTest`, `TriaxialTest`, `UnconfinedCompressiveStrengthTest`,
`WaterContentTest`

*Material* — `BleedTest`, `FlowConeTest`, `LineLossTest`, `MarshFunnelTest`,
`MaterialGradationTest`, `MudBalanceTest`, `PressureFiltrationTest`, `SetTimeTest`,
`ShrinkageTest`, `SlumpTest`, `SyneresisTest`, `TiltCupTest`, `ViscometerTest`,
`WashoutTest`

*Geophysical* — `GeophysicalProcessing` (all methods)

> **Legacy namespace tolerance.** Real-world hybrid files sometimes keep the
> DIGGS 2.6 `.../schemas/2.6/geotechnical` namespace on their in-situ test
> procedures while the rest of the document is 3.x. Those subtrees are read
> correctly, including cross-references that leave the subtree.

### Result domains and visualization

The display chosen for a result set is driven by the shape of its *domain*, not
by which test produced it — so a new instrument reporting an existing domain
shape works with no changes.

| Domain | Recognized geometry | Display |
|---|---|---|
| **Spatial (point / interval)** | `PointLocation`, `LinearExtent`, `MultiPointLocation`, `MultiCurve` | Depth-indexed result table; depth profile plots (interval domains draw as a true staircase); lithology reference column alongside |
| **Temporal** | `TimeInterval`, elapsed time | Time-indexed result table; time-series plots |
| **Grid — 2D** | `ReferenceableGridByArray`, `RectifiedGrid`, `Grid` | Heat-map section with **Blocky** (per-cell polygon) and **Smooth** (continuous field) modes, topography line, axis ticks, vertical-exaggeration note, and a colour legend with ramp and log/linear toggles. One section per reported property. |
| **Grid — 3D** | Same, three-dimensional | 3D volume renderer — point cloud, three interpolated orthogonal slice planes, optional ray-marched translucent volume, hover readout of `(i, j, k)` and value |

Grid traversal follows the grid's own `sequenceRule` (linear and boustrophedonic).
Colour ramps are a registry, not hard-coded — a categorical or diverging ramp is a
data addition, not a code change.

> **Grid result tables.** For a grid domain the Results pane currently shows a row
> count rather than a full table; a grid can carry tens of thousands of rows and
> table virtualization is not built yet. The section or volume view *is* the
> display for this domain.

### Project and document metadata

| Object | Coverage |
|---|---|
| `DocumentInformation` (file name, creation date, author, application) | ✅ Full |
| `Project` (names, purpose, dates, roles, locality, status, remarks, associated files, other properties) | ✅ Full |
| `Contract`, `ProjectEvent` | ✅ Full |
| `BusinessAssociate` (contacts, addresses, roles) | ✅ Full |
| Project geometry (reference point, linear extent, areal extent) | ✅ Full, on-demand map plotting |
| Multiple projects per file | ✅ Full, with filtering |

---

## Architecture and privacy

The Inspector is a **single self-contained HTML file**. There is no build step,
no package manager, no bundler and no module system. Every dependency is embedded
in the file itself:

| Library | Version | Used for |
|---|---|---|
| [proj4js](http://proj4js.org/) | embedded | Coordinate reference system transformation |
| [Leaflet](https://leafletjs.com/) | 1.9.4 | Interactive map |
| [three.js](https://threejs.org/) | r128 | 3D trajectory, surface/solid and volume viewers |

**All processing is local.** The file you load is read by the browser's own
`FileReader`, parsed in memory with the browser's `DOMParser`, and rendered
entirely on your machine. **No part of your DIGGS file is ever uploaded,
transmitted, logged or sent to any server** — including to the makers of this
tool. You can verify this yourself: open the file's Network tab while loading a
document, or run the whole thing on an air-gapped machine.

### What works offline

The Inspector is fully usable with no internet connection. The table below is
precise about what changes.

| Feature | Offline | Notes |
|---|---|---|
| Loading and parsing any DIGGS file | ✅ Works | Entirely local |
| Feature tables, tabs, project filtering | ✅ Works | |
| Detail panels and all metadata rendering | ✅ Works | |
| Lithology logs, FGDC patterns, legends | ✅ Works | Patterns are drawn, not downloaded |
| Sample graphics, construction graphics, well diagrams | ✅ Works | |
| Result tables, depth/time plots, procedure plots | ✅ Works | |
| 2D grid sections and 3D grid volumes | ✅ Works | three.js is embedded |
| 3D trajectory, surface and solid viewers | ✅ Works | |
| Coordinate transformation for the 236 embedded CRSs | ✅ Works | See below |
| Local Cartesian CRS georeferencing | ✅ Works | Definition is inside the file |
| Cross-references *within* the loaded file | ✅ Works | |
| **Map basemap tiles** | ❌ Blank | The map, markers, legend and selection all still work — the background imagery is simply grey |
| **CRS definitions not in the embedded table** | ❌ Unresolved | Falls back gracefully: the feature is still listed and inspectable, and the Location panel says the CRS could not be resolved. Normally fetched from epsg.io. |
| **Vertical datum units not in the embedded table** | ❌ Falls back | Uses the file's own `uomLabels` when present |
| **Remote `xlink:href` references to diggsml.org** | ❌ Not resolved | Used for linear-referencing-system unit definitions and shared dictionary objects; the row shows as an unresolved reference rather than an error |
| **Clicking a 🔗 code-space link** | ❌ No page | Opens an external dictionary URL in a new tab |

Outbound requests are restricted by design. XML documents are only fetched from
`diggsml.org` (or a local `file://` path); any other host in an `xlink:href` is
simply not followed.

---

## Coordinate reference systems

DIGGS geometry is genuinely 3D and routinely compound: a horizontal CRS
(geographic or projected) paired with an independent vertical datum, each with
its own linear unit. The Inspector treats them independently throughout — it
never assumes elevation shares the horizontal unit, and it distinguishes the US
survey foot (`ftUS`, 1200/3937 m) from the international foot (`ft`, exactly
0.3048 m).

### Embedded CRS support

**236 CRS definitions are compiled into the file** and resolve with no network
access:

| Family | EPSG range | Coverage |
|---|---|---|
| WGS 84 / UTM north | 32601–32660 | All 60 zones |
| WGS 84 / UTM south | 32701–32760 | All 60 zones |
| NAD83 / UTM | 26901–26923 | Zones 1–23 |
| NAD27 / UTM | 26701–26722 | Zones 1–22 |
| Geographic 2D / 3D | 4326, 4979, 4269, 4267, 4258, 4230, 4277, 4283, 7844, 4289 | WGS 84, WGS 84 3D, NAD83, NAD27, ETRS89, ED50, OSGB36, GDA94, GDA2020, Amersfoort |
| Geocentric (ECEF) | 4978 | WGS 84 geocentric |
| Web Mercator | 3857, 900913 | |
| British National Grid | 27700 | OSGB36 |
| Irish Grid | 29902 | |
| Amersfoort / RD New | 28992 | Netherlands |
| SWEREF99 TM | 3006 | Sweden |
| ETRS89 / UTM | 25828–25837 | Zones 28–37 |
| GDA94 / MGA | 28348–28356 | Zones 48–56 |
| GDA2020 / MGA | 7850–7856 | Zones 50–56 |
| NAD83 State Plane (US) | see ---> | California I–VI (2225–2230), Texas N/NC/C/SC/S (2275–2279), Florida E/W/N (2236–2238), New York E/C/W/Long Island (2260–2263), Illinois E/W (3435, 3436), Washington N/S (2285, 2286), Oregon N/S (2269, 2270), Louisiana N/S (3451, 3452), Virginia N/S (2283, 2284) |

**Any other EPSG code** is fetched on demand from [epsg.io](https://epsg.io/)
(both the proj4 definition and the CRS name) and cached for the session. If that
fetch fails — offline, or an unknown code — the feature is still fully listed and
inspectable; it just carries no map marker and the Location panel says so.

Geocentric (ECEF) source coordinates are rotated into a true local East-North-Up
frame before any horizontal/vertical decomposition, so an inclined hole in an
ECEF file is classified correctly rather than being flattened by naive per-axis
scaling.

### Vertical datums

Embedded vertical CRS table (name and elevation unit, used to label elevations
and reconcile units):

| EPSG | Datum | Unit |
|---|---|---|
| 5703 | NAVD88 | m |
| 8228 | NAVD88 | ft |
| 6360 | NAVD88 | ftUS |
| 5702 | NGVD29 | ftUS |
| 5714 | MSL (height) | m |
| 5715 | MSL (depth) | m |
| 5773 | EGM96 geoid | m |
| 3855 | EGM2008 geoid | m |
| 5701 | ODN (Newlyn) | m |
| 5711 | AHD (Australia) | m |
| 5705 | Baltic (height) | m |
| 5706 | Baltic (depth) | m |
| 5709 | NAP (Netherlands) | m |
| 5621 | EVRF2007 | m |
| 6647 | CGVD2013 | m |
| 4979 | WGS 84 ellipsoidal height | m |

Any other vertical EPSG code is resolved from epsg.io (parsing `+vunits` /
`+vto_meter`) and cached; failing that, the file's own `uomLabels` is used, and
the Location panel marks the display unit's provenance as *reported* or
*mismatch* accordingly.

### Non-EPSG reference systems

| Reference system | Support |
|---|---|
| **`diggs:LocalCartesianCRS`** | ✅ Read from the document's own `DocumentInformation/crs`. Georeferenced through its origin, axis direction vectors, scale factor and per-axis `originOffset` — so a site grid or an ERT line laid out in local metres maps to real-world coordinates with no network access. Its origin and axis definitions are also displayed directly on the features that reference it. |
| **`LinearSpatialReferenceSystem` (LRS)** | ✅ Depth and station values are interpreted against the file's own linear referencing system, including its unit of measure. An LRS defined only by reference to `diggsml.org` is fetched when online. |
| **`LinearReferencingMethod`** | ✅ Displayed, including deprecated `glr:` namespace variants |
| **Compound CRS** | ✅ Horizontal and vertical components parsed and applied independently |

### srsName formats recognized

All of the following resolve to the right EPSG code(s):

```
urn:ogc:def:crs:EPSG::4326
urn:ogc:def:crs:EPSG:6.6:4326
urn:ogc:def:crs,crs:EPSG::9357,crs:EPSG::5773
http://www.opengis.net/def/crs/EPSG/0/26911
https://www.opengis.net/def/crs-compound?1=http://www.opengis.net/def/crs/EPSG/0/4326&2=http://www.opengis.net/def/crs/EPSG/0/6360
.../epsg.xml#4326
#4326
#<local-crs-id>            → a LocalCartesianCRS defined in the file
https://diggsml.org/def/crs/DIGGS/0.1/lrs.xml#<id>   → a linear referencing system
```

Legacy longitude/latitude axis-order mis-encoding in geographic CRSs is detected
and corrected, and flagged in the Location panel with a **⇄ axis swapped** note
rather than being silently fixed.

### Reference registries and dictionaries

| Resource | Link | Used for |
|---|---|---|
| DIGGS home | <https://www.diggsml.org/> | The standard itself |
| DIGGS schema (3.1-dev) | <https://github.com/DIGGSml/schema-dev/tree/3.1-dev> | The schema this tool targets |
| DIGGS code dictionaries | <https://diggsml.org/def/codes/DIGGS/0.1/> | Property, classification and method code spaces referenced by `codeSpace` |
| DIGGS CRS / LRS definitions | <https://diggsml.org/def/crs/DIGGS/0.1/> | Shared linear referencing system definitions |
| EPSG Geodetic Parameter Registry | <https://epsg.org/> | Authoritative CRS definitions |
| epsg.io | <https://epsg.io/> | Runtime lookup source for CRSs not embedded |
| OGC Definitions Server | <https://www.opengis.net/def/crs/> | The URI form most DIGGS files use for `srsName` |
| FGDC cartographic standard | <https://www.fgdc.gov/standards/projects/FGDC-standards-projects/geologic-symbol> | Source of the lithologic patterns |
| USCS (ASTM D2487) | <https://www.astm.org/d2487-17e01.html> | Soil classification groups used by the pattern resolver |

---

## Known limitations

Being explicit about what is *not* there yet:

- **2D/3D lithology and sampling display.** Patterned trench-wall and outcrop
  polygons, and sampling tables for planar/volumetric features, show a
  placeholder rather than a rendering.
- **Observation systems other than `LithologySystem`** are not yet parsed.
- **Objects belonging to the ConstructionActivity and Program object classes** are not yet parsed.
- **Feature metadata (section 4)** is not yet written for `TrialPit`, `Station`,
  `Transect`, `GroutTrenchCutoffWall`, `TrenchWall`, `GP_ArealSurvey`,
  `GP_MultiTrack` and the four pile types.
- **Grid result tables** show a row count instead of a table pending
  virtualization.
- **Fence diagrams** (several 2D sections in shared 3D space) and
  **isosurfacing** are not built.
- **Solid feature-extent area/volume computation** is implemented but has not yet
  been validated against a real-world instance.
- **No schema validation.** The Inspector shows you what a file contains; it does
  not tell you whether the file is schema-valid. Use the official DIGGS validator 
  hosted at: https://diggs.geosetta.org/?app=xsl_validator, `xmllint` or an XML editor
  for that.
- Additional procedure-specific plots (compaction, e-log-p, stress-strain) are
  planned but not built; those tests currently render as result tables plus
  automatic profiles.

---

## Reporting problems

Issues and suggestions are welcome. When reporting a display problem, please
include:

1. The **fragment of DIGGS XML** that is not rendering as expected (a minimal
   snippet is ideal — please remove anything confidential).
2. What you expected to see, and what appeared instead.
3. Your browser and version.

Because the Inspector never transmits your file, a bug can only be reproduced
from a sample you choose to share.

---

## License

[MIT](LICENSE) © 2026 dponti
