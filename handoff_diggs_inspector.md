# Handoff Document — DIGGS File Inspector: LithologySystem Associated Data Debugging
## Session completed: Lithology Properties / Components popup rendering

---

## File
`diggs_file_inspector.html` — **10,240 lines** (the "next to last" output from this session — the final output added an unnecessary `nodeType` guard that was rendered moot once the XML bug was identified; use the 10,240-line file).

Always upload the output file from the most recent session as ground truth.

---

## What Was Done This Session

All work was debugging and fixing the **LithologySystem associated data popup rendering** — specifically the Properties and Components detail popups.

### Bug 1: `parentPath` not handled in `renderFields` (root fix)
**Symptom:** Properties and Components popups showed massive blobs of all descendant text instead of individual field values.

**Root cause:** `renderFields` (the `showDetailPopup` pipeline) had no handling for `parentPath`. Descriptors using `parentPath` + `composite` (e.g., `LITH_PROPS_SOIL` entries for dipAngle, particleSorting, recovery length, etc.) fell through to `nodes = [el]`, causing composite sub-paths to evaluate against the entire `LithProperties` element and collect all its text.

**Fix:** Added a `parentPath` branch at the top of `renderFields`'s field loop that navigates to child node(s) first, then evaluates composite/fields sub-paths relative to each — exactly mirroring `renderKVTable` behaviour. Also added `sectionHeader` skip (sectionHeader sentinels are `renderKVTable`-only) and `subHeader`+`guardPath` support (new sentinel type, see below).

### Bug 2: `sectionHeader` sentinels caused text blobs
**Symptom:** Large blobs of all-element text at top and bottom of Properties popup.

**Root cause:** `{ sectionHeader:'General / Soil' }` and `{ sectionHeader:'Rock' }` entries had no `path` or `parentPath`, so `renderFields` used `nodes = [el]` and emitted all text content of the `LithProperties` element.

**Fix:** `if (spec.sectionHeader) continue;` at top of `renderFields` loop.

### Bug 3: `particleSizeDistribution` not rendering
**Symptom:** PSD sub-block absent from Properties popup.

**Root cause:** `LITH_PSD_DESCRIPTOR` used wrong paths — `howDetermined` is an **attribute** on `ParticleSizeDistribution`, not a child element; grain-size entries pointed to wrapper elements without navigating into `ParticleSize` children.

**Fix:** Rewrote `LITH_PSD_DESCRIPTOR` to use `@howDetermined` as a composite attribute path; each grain-size entry now uses `parentPath:'diggs:xxxGrainsize/diggs:ParticleSize'` with composite paths for `diggs:particleSizeValue`, `@uom`, and `diggs:particleSizeDescription`.

### Bug 4: `dipAngle` showing `(apparent: false)`
**Root cause:** Composite sub-path `@apparent` fired unconditionally regardless of value.

**Fix:** Changed to `@apparent[.="true"]` so the suffix only renders when the attribute is explicitly `true`.

### Bug 5: `otherLithProperty` not rendering
**Root cause:** Descriptor used `diggs:name`/`diggs:value`/`diggs:units` but actual schema uses `diggs:Parameter` wrapper with `diggs:parameterName`/`diggs:parameterValue`/`diggs:parameterUnits`.

**Fix:** Corrected both SOIL and ROCK group entries — `parentPath` now includes `diggs:Parameter` step and field paths use the correct element names.

### Bug 6: `surfaceTexture` and `otherLithProperty` duplicated
**Root cause:** Both appeared in `LITH_PROPS_SOIL` **and** `LITH_PROPS_ROCK`; since `LITH_PROPERTIES_GROUPS = [...LITH_PROPS_SOIL, ...LITH_PROPS_ROCK]` is rendered against the same element, both rendered twice.

**Fix:** Removed `surfaceTexture` and `otherLithProperty` from `LITH_PROPS_ROCK`.

### Bug 7: `gml:description` / remarks missing from Properties popup; `gml:identifier` showing
**Fix:** Added `{ path:'gml:description', italic:true }` and remark entries at top of `LITH_PROPS_SOIL` before the `sectionHeader` sentinel. Removed `gml:identifier` (not useful to display). Added `{ subHeader:'Remarks', guardPath:'diggs:remark' }` before the remark entry so a "REMARKS" label only appears when remarks are present.

### New infrastructure: `subHeader` + `guardPath` in `renderFields`
Added support for `{ subHeader:'text', guardPath?:'xpath' }` sentinel entries in the `renderFields` pipeline. Emits a styled uppercase label (no border rule — indentation provides visual grouping). `guardPath` suppresses the header when no matching nodes exist, preventing orphan labels.

Used for:
- `{ subHeader:'Remarks', guardPath:'diggs:remark' }` — before remark entries
- `{ subHeader:'Particle Size Distribution', guardPath:'diggs:particleSizeDistribution/diggs:ParticleSizeDistribution' }` — before PSD block

### PSD block rendering
The `particleSizeDistribution` entry in `LITH_PROPS_SOIL` now uses:
```js
{ subHeader:'Particle Size Distribution',
  guardPath:'diggs:particleSizeDistribution/diggs:ParticleSizeDistribution' },
{ parentPath:'diggs:particleSizeDistribution/diggs:ParticleSizeDistribution',
  fields:LITH_PSD_DESCRIPTOR, indent:true },
```
The `parentPath` + `fields` branch in `renderFields` navigates to the `ParticleSizeDistribution` element and recurses with `LITH_PSD_DESCRIPTOR`, indenting all sub-items.

### Properties pill false-positive (investigated, resolved as XML issue)
**Symptom reported:** Properties pill appearing for observations without `<lithProperties>`.
**Investigation:** `hasData: (obs) => !!(obs.primary && obs.primary.lithProperties)` is correct. Parse logic (`parseLithologyObject` → `xFirst(doc, 'diggs:lithProperties/diggs:LithProperties', lthEl)`) is correctly scoped to the Lithology element. **Confirmed to be a test XML issue** — when `<lithProperties>` is genuinely absent, the app behaves correctly. No code change needed.

---

## Current State of Key Descriptors

### `LITH_PSD_DESCRIPTOR`
Context el = `diggs:ParticleSizeDistribution`. `howDetermined` is an attribute (`@howDetermined`). Each grain-size entry uses `parentPath:'diggs:xxxGrainsize/diggs:ParticleSize'` + composite of `particleSizeValue`, `@uom`, `particleSizeDescription`.

### `LITH_PROPS_SOIL`
Order: `gml:description` (italic) → `subHeader:'Remarks'` (guarded) → `diggs:remark` → `sectionHeader:'General / Soil'` → all soil fields → `subHeader:'Particle Size Distribution'` (guarded) → PSD block → remaining fields including `surfaceTexture` and `otherLithProperty/Parameter`.

### `LITH_PROPS_ROCK`
Only rock-specific fields: grain size, hardness, strength, weathering, rock mass, slaking rate, sorting, RQD, RQD length. `surfaceTexture` and `otherLithProperty` intentionally omitted (already in SOIL group).

### `LITH_PROPERTIES_GROUPS`
`[...LITH_PROPS_SOIL, ...LITH_PROPS_ROCK]` — used for both LithProperties and ComponentProperties popups.

---

## `renderFields` Pipeline — Current Capabilities
The `showDetailPopup` pipeline (`renderFields` → `itemsToHtml`) now supports:

| Spec property | Behaviour |
|---|---|
| `sectionHeader` | Skipped (renderKVTable-only) |
| `subHeader` + optional `guardPath` | Emits styled uppercase label; suppressed if guardPath matches nothing |
| `parentPath` + `composite` | Navigate to child nodes, assemble composite string |
| `parentPath` + `fields` | Navigate to child nodes, recurse with sub-descriptor |
| `parentPath` + `multi:true` | Iterate all matching parent nodes |
| `path` + `composite` | Evaluate composite sub-paths relative to matched node |
| `path` + `fields` | Recurse into matched node |
| `path` + `format` | Apply FORMAT_FN |
| `path` + `multi:true` | Iterate all matching nodes |
| `showEmpty` | Render `—` placeholder when absent |

---

## Two Rendering Pipelines — Do Not Mix Descriptor Shapes

| Pipeline | Used by | Key descriptor properties |
|---|---|---|
| `renderKVTable(el, descriptor)` | SF Detail pane (Section 4), project info popup | `path`, `parentPath`, `composite`, `sectionHeader`, `showEmpty`, `rawFormat`, `children` |
| `renderFields(el, fields)` → `itemsToHtml` | `showDetailPopup` (all lith popups) | `path`, `parentPath`, `composite`, `fields`, `subHeader`, `guardPath`, `sectionHeader` (skipped), `format`, `multi`, `label`, `bold`, `italic`, `meta`, `indent`, `block`, `showEmpty` |

`children` is a `renderKVTable`-only property and has no effect in `renderFields`.

---

## Completed Lithology Display Features (all working)
- Lith table: from/to, classification badge (clickable → Classification popup), description, unitName, facies, Details column
- Details column pills: **Color**, **Properties**, **Components**, **Placed Obs**, **Boundary**
- Classification popup: all fields with `showEmpty:true`, clickable even when showing `—`
- Properties popup: description, remarks, all soil/rock properties, PSD sub-block with grain size details, otherLithProperty as name: value
- Components popup: per-component classification, description, abundance, component properties
- Color popup: Munsell swatch rendering, color KV fields
- `dipAngle` `(apparent)` suffix only when attribute is `true`
- `subHeader` guards prevent orphan separators when data absent
- `_pillActivate` active state with MutationObserver cleanup

---

## Next Work: Additional Associated Data Displays
The next session should tackle other `*System` subtypes and their associated badge/popup displays beyond `LithologySystem`. The pattern established for Lithology (parse layer → config objects → badge content function → `_buildLithDetailCell`-style pills) should be reused.

Candidates in priority order (based on DIGGS schema coverage):
1. **`MonitoringSystem`** — already has badge stubs; needs popup content
2. **`SamplingSystem`** / `SpecimenCollectionSystem`
3. Other measurement/test result Systems as applicable to the test files in use

---

## Architecture Quick Reference

### Key globals
- `DIGGS_SF`: `Map<type → SF[]>` — unified SF registry
- `DIGGS_LITH`: `{ [sfId]: LithologySystem[] }` — lith parse results
- `_detailPopupMap`: `Map<key → {title, sections}>` — popup registry, cleared on file load
- `SF_TYPE_CONFIG`, `DIGGS_DISPLAY_LABELS` — config-driven rendering

### Key functions
| Function | Purpose |
|---|---|
| `loadDIGGS(doc, filename)` | Main parse entry point |
| `parseLithologyObject(lthEl)` | Parse Lithology/ComponentLith element |
| `parseLithProperties(lpEl)` | Parse LithProperties/ComponentProperties element |
| `renderLithBadgeContent(sfId, sf, lithSystems, allObs)` | Orchestrator for Lithology badge |
| `_buildLithDetailCell(obs, allObs)` | Build Details column pills |
| `_buildLithClassCell(obs)` | Build Classification column cell |
| `renderFields(el, fields)` | Core renderer for showDetailPopup pipeline |
| `itemsToHtml(items)` | Serializer for RenderItem[] |
| `renderNestedKV(el, fields)` | Wraps renderFields in .kv-nested div |
| `renderKVTable(el, descriptor)` | Separate KV table pipeline (SF detail pane) |
| `showDetailPopup(key)` | Opens popup from _detailPopupMap |
| `_registerPopup(title, sections)` | Registers popup entry → returns key |
| `selectSF(type, id)` | Unified SF selection entry point |
| `buildIntervalTable(parentEl, config)` | Declarative interval table engine |
| `munsellToCSS(code)` | Munsell string → CSS hsl() |
| `evalXPath(ctx, path)` | NS-aware XPath (renderFields pipeline) |
| `xFirst(doc, expr, ctx)` | NS-aware XPath first match (parse pipeline) |
