---
name: diggs-sf-config
description: Build or extend the SF Detail display for a DIGGS sampling-feature type (or a nested object type) in diggs_file_inspector.html — write its OBJECT_CONFIGS entry, check/wire whatever SF_TYPE_CONFIG or parsing hooks are actually missing (most types need none), and verify it renders. Use whenever the user asks to "build the config for <SF type>", "add SF Detail support for X", "wire up <type> the way Borehole/Well works", or wants a new sampling feature type (Sounding, TrialPit, Transect, SteelHPile, RIFoundationSystem, etc.) to show its Section 4 metadata. Covers config authoring + hook wiring + verification only — for writing/auditing test XML instances with full schema coverage, that's the separate diggs-schema-coverage skill (this skill calls into it when instance authoring is also needed, rather than duplicating that procedure).
---

# DIGGS SF Detail config + hook wiring

This project (`diggs_file_inspector.html`) shows a type's Section 4 metadata
via `OBJECT_CONFIGS[sf.type]` — `renderSFMetadata(sf)` looks it up and
returns `''` gracefully if absent. Most `SF_TYPE_CONFIG`
entries listed in the file (`TrialPit`, `Transect`, `GroutTrenchCutoffWall`,
`GP_Trackline`, `Station`, `PlanarSamplingFeature`, `GP_ArealSurvey`,
`TrenchWall`, `VolumetricSamplingFeature`, `SteelHPile`, `SteelPipePile`,
`ConcretePile`, `TimberPile`, `RIFoundationSystem`, `GP_MultiTrack`) still
have no `OBJECT_CONFIGS` entry — this is the repeatable procedure for
building one, built from the `Well` config session (2026-07-22), which
mirrored `Borehole`'s existing config and needed exactly one small hook fix
(`open3DTrajectoryView` widened from a hardcoded `'Borehole'` lookup to
search every `DIGGS_SF` type).

Read `../diggs_file_inspector/CLAUDE.md` first if you haven't already this
session — the "Architecture reference" section (Rendering engine,
Interval-table engine, Data-table engine, shared helpers/caches) documents
the conventions below in more depth, and its own top-of-file note lists
which SF types currently have a config.

## The key finding from the Well session: most of this is already generic

Before assuming a new type needs new plumbing, check what's already
type-agnostic. For `Well`, **all** of the following pre-existed and needed
zero changes: `SF_TYPE_CONFIG.Well` itself, `parseSamplingFeature()`
(centerLine/plunge/bearing/referencePoint/environment parsing is generic
across every `AbstractLinearSamplingFeatureType`), the generic SF-list
tab/table (including the "Parent Feature" `selectSF` link driven by
`cfg.parentPath`), and the "installation" `mapGeom` rendering path. The
**only** real gap was one hardcoded `'Borehole'` string inside
`open3DTrajectoryView`. Don't assume a new type needs a parse-pipeline
rewrite — usually it needs a config and nothing else.

## Procedure

### 1. Confirm what's missing

- `grep -n "OBJECT_CONFIGS\.<Type>\s*=" diggs_file_inspector.html` — does a
  config already exist (partial or full)?
- `grep -n "<Type>:" diggs_file_inspector.html` inside `SF_TYPE_CONFIG`
  (`grep -n "^const SF_TYPE_CONFIG"` to find the block) — does the type have
  `tabLabel`/`mapGeom`/`depthPath`/`parentPath`/`date`/`marker` already set?
  If the type isn't a top-level sampling feature at all (e.g. a nested
  object type like `Casing` or `WellOpening`), skip this — `SF_TYPE_CONFIG`
  is SF-only.
- Search `loadDIGGS()` (`grep -n "^function loadDIGGS"`) for a hardcoded
  parse block for this type (like the `DIGGS_WELL`/`DIGGS_WELL_DATA` block)
  vs. relying on the "GENERIC SF LOOP" comment banner further down the same
  function, which walks every `<samplingFeature>` child generically. A type
  needs a hardcoded block only if it has its own
  derived/computed fields another part of the app consumes outside the KV
  config (e.g. Well's `wellDepth`/`openings`/`screenTop`/`screenBot` feed the
  Monitor-data association logic) — a type with no such cross-cutting
  consumer usually needs nothing beyond the generic loop.
- Grep for the type name elsewhere in the file (`grep -n "'<Type>'"`) to spot
  any other hardcoded single-type assumption, the way `open3DTrajectoryView`
  had one — anything that looks generic in spirit but hardcodes one type
  name is a candidate the same way that was.

### 2. Trace the full inheritance chain

Same procedure as the `diggs-schema-coverage` skill's step 1 — walk
`extension base=`/`restriction base=` upward in `../diggs-schema` until you
hit a type cached in
`.claude/skills/diggs-schema-coverage/references/diggs-base-types.md`, then
splice: [cached base fields] + [each intermediate type's own additions, in
order] + [target type's own additions]. **Reuse that reference file rather
than re-deriving the common abstract types yourself** — it's the same
handful of base types (`AbstractFeatureType`, `AbstractSamplingFeatureType`,
`AbstractNamedFeatureType`, `AbstractObjectType`, etc.) regardless of which
half of this work you're doing.

Note which fields are `*Ref` reference properties (skip in the config —
see step 3) and which nested object types the new fields point at — check
whether an `OBJECT_CONFIGS` entry for those already exists (e.g. `Casing`,
already used by `Borehole.casing`, is reused as-is by `Well.wellCasing`
since both are `CasingPropertyType`) before authoring a duplicate.

### 3. Author the `OBJECT_CONFIGS` entry

Full row-config key reference lives in `OBJECT_CONFIGS reference.md` — read
it for anything not covered here. Conventions worth calling out because
they're easy to get subtly wrong:

- **Shared base-field arrays (`_OBJ_BASE_FIELDS`, `_FEATURE_LEADING`,
  `_FEATURE_TRAILING`, `_OBJ_TYPE_TRAILING`, `_COMPONENT_TRAILING`,
  `_NAMED_ROLE_LEADING`/`_NAMED_ROLE_TRAILING`, `_OBJ_NO_DESC_TRAILING` —
  `grep -n "^const _OBJ_BASE_FIELDS"` to find the whole block) are spread at
  the **top level of the config array**, never inside a row object.**
  `..._FEATURE_TRAILING` accidentally spread *inside* the last row object
  (rather than as its own array entry) is a
  real bug found and fixed in `OBJECT_CONFIGS.Borehole` (2026-07-22) —
  object-spreading an array yields numeric keys (`0`,`1`,`2`) that
  `renderPropertyRow` silently never reads, so the fields just never
  rendered, with no error anywhere. After authoring a config, visually
  re-check every `..._SOMETHING_TRAILING` line sits at the same indentation
  as its sibling row objects, as its own array element ending in a comma.
- **`*Ref` reference properties are omitted from the config** — never a
  plain label/value row. The only legitimate exception is a `*Ref` that
  already drives real navigation *elsewhere* (Well's `samplingFeatureRef` →
  the sf-list table's "Parent Feature" `selectSF` link, via
  `SF_TYPE_CONFIG[type].parentPath` — not a KV row at all). Don't add a KV
  row for a `*Ref` just because it feels incomplete without one.
- **Boolean-typed elements need `boolean: true`** on their row config, or
  the raw schema token shows instead of Yes/No. Check the element's actual
  type in `../diggs-schema`, don't guess from the name.
- **Reuse an existing nested-object config** when the new type's field
  shares a complexType with something already covered (see step 2) — verify
  by checking the actual `type="diggs:XxxPropertyType"` in the schema, not
  by the element's name alone (a schema name collision, like
  `BoreholeConstructionMethod`'s own `constructionMethod` vs. `Borehole`'s
  top-level `constructionMethod`, can look identical but isn't).
- **Choose interval table vs. dataTable vs. plain row** for a `multi: true`
  object-valued field: `interval` when there's a natural depth/time/position
  index to tabulate against (see "Interval-table engine" in CLAUDE.md);
  `dataTable` when there's no natural index but there are useful summary
  columns (see "Data-table engine"); otherwise a plain row lets it fall back
  to per-occurrence KV blocks.
- **`geoLocation: true`** only for a `PointLocation`/`LinearExtent` that's a
  real standalone geographic point/line (every axis matters) — not for a
  depth/LRM-referenced location (leave those as a plain row, which uses the
  single-axis `locationInline` formatter).
- A **computed/derived row** (like Borehole's "Trajectory" `compute:` — see
  its own inline comment in `OBJECT_CONFIGS.Borehole`) looks up the parsed
  `sf` via `DIGGS_SF.get('<Type>')`, not the raw DOM element — `compute()`
  only ever receives the element itself.

### 4. Wire hooks — only the ones actually missing

Per step 1's findings. In order of how often each is actually needed:

1. **Nothing** (most common — the generic dispatch/parse/list machinery
   already covers it).
2. **A `SF_TYPE_CONFIG` entry**, if the type is a top-level sampling feature
   not yet listed there at all.
3. **Widen an existing single-type-hardcoded helper** (like
   `open3DTrajectoryView`) to search generically, the same way the Well
   session did — grep for the type-agnostic sibling function's own doc
   comment first (e.g. CLAUDE.md's "3D borehole trajectory viewer" section
   notes `extractBoreholeTrajectory` is "generic to any element with a
   `centerLine` despite the name") to confirm the underlying logic really is
   generic before assuming the fix is safe.
4. **A new hardcoded parse block in `loadDIGGS()`**, only if the type has
   genuinely new cross-cutting derived data another feature needs (rare —
   don't add one just because Well/Borehole/Sounding have one).

### 5. Verify

- **Syntax**: extract `<script>` blocks and `node --check` (see CLAUDE.md's
  "Verify syntax after every edit" — this only catches parse errors, not a
  silent `ReferenceError` that voids every config defined after it).
- **Live sanity check** (CLAUDE.md's "Live-browser UI verification"):
  `puppeteer-core` against real Chrome, `npm install puppeteer-core` into a
  scratch dir (use a custom `--cache` dir if the global npm cache is
  root-owned/EPERM — `dangerouslyDisableSandbox: true` is still needed
  separately for the Chrome launch itself, since the sandbox blocks the
  process listing Chrome's singleton-lock check needs). At minimum,
  `page.evaluate` and check: `OBJECT_CONFIGS.<Type>` is truthy,
  `DIGGS_SF.get('<Type>')` has the expected entries after uploading a test
  file via `#file-input`, `selectSF('<Type>', id)` populates
  `#detail-content` with no `pageerror` events and no literal `undefined`/
  `[object Object]` leaking into the HTML.
- If the task also needs **simulated test XML instances with full schema
  coverage** to drive that live check, that authoring work is the
  `diggs-schema-coverage` skill's job, not this one — invoke it (or note
  that it should be invoked) rather than re-deriving instance-authoring
  conventions here. This skill's step 2 trace and that skill's step 1 trace
  are the same work; don't do it twice if both are needed in one session.

### 6. Update CLAUDE.md

Small targeted edit, not a rewrite (per CLAUDE.md's own "Keeping this file
current" section): add the new type to the "SF types with a full
`OBJECT_CONFIGS` entry" list (Rendering engine section), and note any hook
that was widened or added (the way the 3D trajectory viewer section notes
`open3DTrajectoryView` now searches every type). If you found a latent bug
along the way (like the Borehole `_FEATURE_TRAILING` spread), fix it in the
same session if asked, and either remove the "known bug" note or mark it
fixed rather than leaving stale/contradictory claims in the file.
