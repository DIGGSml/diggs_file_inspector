# OBJECT_CONFIGS reference

Reference for the row-config schema that drives the KV-table rendering
engine in `diggs_file_inspector.html`. This describes the
**actual current implementation**, verified directly against the engine
source (`renderKVObject`, `renderPropertyRow`, `renderResolvedObject`,
`wrapCategoryHeader`, `renderSimpleRow`, `renderSimplePropertyCell`,
`renderIntervalTable`, `renderDataTable`, `resolveIntervalIndexCells`,
`_resolveDataColumnCell`). Last verified 2026-08-06 against the shipped engine.

## Top-level shape

`OBJECT_CONFIGS[TypeName]` = an array of **row-config** objects, one entry
per DIGGS type (`Borehole`, `Casing`, `Address`, ...), consumed by
`renderKVObject(el, config)`. A type absent from the registry renders
nothing (no error) — `wrapCategoryHeader` suppresses any header with an
empty body, so a partially-built config degrades gracefully.

A config array is processed top-to-bottom; that order is the render order.
Each entry is one of three row kinds, distinguished by which key is present:

| Row kind | Trigger key | Purpose |
|---|---|---|
| Section banner | `sectionHeader` | Starts a new labeled group of rows within the same object (e.g. Borehole's "Classification", "Geometry") |
| Standalone banner | `subHeader` | A label-only divider above the next field, no border, optionally gated by `guardPath` |
| Property row | everything else | Renders one property — the general case, covered in detail below |

## Section banner rows (`sectionHeader`)

| Key | Type | Default if absent | Behavior |
|---|---|---|---|
| `sectionHeader` | string | — (required to trigger this row kind) | The banner text |
| `collapsible` | boolean | `true` | `false` → a **static** banner (plain text, no triangle, not clickable). Anything else (including omitted) → an **active** collapsible section, starts **closed** (2026-07-14: every category/section banner in this engine now defaults closed — see "Default open/closed state" below). |

A section with zero visible rows underneath is dropped entirely.

## Standalone banner rows (`subHeader`)

| Key | Type | Default if absent | Behavior |
|---|---|---|---|
| `subHeader` | string | — (required to trigger this row kind) | The label text, its own small row, no border |
| `guardPath` | XPath string | none (banner always shows) | Only renders when this XPath matches ≥1 node on the object |

Not currently used by any shipped config — implemented, available, unexercised.

## Property rows

| Key | Type | Default if absent | Behavior |
|---|---|---|---|
| `path` | XPath string | `'.'` (the object element itself) | Where to find the property element(s), relative to the current object. `'@gml:id'`-style attribute paths work too (see "Attribute paths" below). |
| `label` | string | Auto-derived from the last step of `path` (camelCase → Title Case). `path: '.'` with no `label` → empty string. | The static, row-level key text — used as the per-occurrence label when `itemLabel` is absent, and as the base for auto-pluralization. `label: ''` (explicit empty string) differs from omitting `label`: it forces a blank key rather than auto-deriving one. |
| `multi` | boolean | `false` | `false`/omitted → only the *first* XPath match is used. `true` → every matching node is considered. |
| `itemLabel` | string \| `(node) => string` | Falls back to `label` | Per-occurrence label. A **string** is a static override (e.g. `'Advancement'`). A **function** is called with that specific occurrence's own resolved element, so the label can be derived from its own field values (e.g. a Construction Method's own depth range, a Parameter's own name) — a falsy return also falls back to `label`. Used for a resolved object's own header/key, wherever it's shown (a plain row's key *or* a category header's title — see "Dynamic labels" below). |
| `labelPlural` | string | `label + 's'` | Title used for the outer group banner when more than one occurrence resolves (see "Multi-occurrence grouping"). Naive `+'s'` is wrong for irregular plurals ("Equipment", not "Equipments") or when `itemLabel` is dynamic (per-occurrence text can't be meaningfully pluralized) — set this explicitly in either case. |
| `alwaysGroup` | boolean | `false` | Forces the outer group banner to wrap even a **single** resolved occurrence (normally the banner is skipped when there's only one — see below). Needed for `SPECIAL_OBJECT_FORMATTERS` rows (Role/Remark/TimeInterval/Location/BusinessAssociate/Parameter), which render as one flat KV row with no header of their own — once `itemLabel` replaces the row's key with per-occurrence text, the field's own static identity has nowhere to show unless the banner is forced. Not needed for an ordinary object-registry row (e.g. `constructionMethod`), which already gets a per-instance header regardless of count. |
| `showEmpty` | boolean | `false` | `false`/omitted → row skipped entirely when nothing matches. `true` → renders an em-dash placeholder instead. |
| `splitRows` | boolean | `false` | Only affects **simple** (leaf) properties with `multi:true` and more than one matched node. `false` → all values join into one cell, stacked with a small gap. `true` → each value gets its own full row, repeating the same label. |
| `boolean` | boolean | `false` | Only affects simple (leaf) properties. Normalizes `true`/`1`/`yes` → "Yes", `false`/`0`/`no` → "No" (case-insensitive); unrecognized text passes through unchanged. Applied before uom/attribute decoration. |
| `configOverride` | string \| array \| function | none — falls through to automatic type-name lookup | See "Object resolution" below — three distinct forms, three distinct behaviors. |
| `dimDefault` | number | `1` | Only relevant when the property resolves to a `LinearExtent`/`PointLocation`. The `srsDimension` to assume if the element doesn't declare one itself. |
| `labelClass` | string (CSS class name) | none — plain `kv-key` | Appended to a plain row's key cell: `kv-key <labelClass>`. |
| `valueClass` | string (CSS class name) | none — plain `kv-val` | Appended to a plain row's value cell: `kv-val <valueClass>`. Covers the value *and* its `uom` (they always share one style, per `KV formatting.md`'s rule) — not the "other attributes" parenthetical, which is `attrClass`. |
| `attrClass` | string (CSS class name) | none — plain `cs-tag` | Appended to the "other attributes" parenthetical only (`cs-tag <attrClass>`) — the value/uom text itself uses `valueClass` instead. |
| `categoryClass` | string (CSS class name) | none — plain `kv-section-header` | Appended to a `.kv-section-header` div: both a resolved object's own per-instance header *and* its outer plural/group banner go through this. Deliberately a **separate** key from `labelClass` — a category header and a plain row's key already render through different default classes (`kv-section-header` vs `kv-key`), so their override is a different knob too, not one key reused in two places. |
| `borderTop` | boolean | `undefined` — no top border | `true` → adds a top border to this row's `.kv-row` (`kv-row-border-top` class). Only affects plain KV rows (`renderSimpleRow`) — a category/banner header has its own separate default divider (always a top border, via `.kv-section-header`) and isn't affected by this key. |
| `borderBottom` | boolean | `undefined` — automatic (bottom border on every row except the last child of its container) | `true` forces a bottom border on (`kv-row-border-bottom`) — meaningful mainly for a row that would otherwise be a container's last child. `false` suppresses the default bottom border (`kv-row-no-border-bottom`) — e.g. to visually merge a row with the one below it. |
| `interval` | object `{ expands?, index[], column[] }` | none — falls through to the default per-instance full-KV rendering described above | Only takes effect when `multi:true`. Renders the property as a compact interval table instead — see "Interval tables" below for the full sub-schema. |
| `dataTable` | object `{ expands?, column[], sort? }` | none | `interval`'s sibling for a `multi:true` row with no natural index — see "Data tables" below. |
| `compute` | `(el) => string \| {val, keyExtra} \| falsy` | none | Escape hatch for a **single** row whose value has no schema element of its own — derived from the object's context element (`el`) by arbitrary JS instead of an XPath `path`. See "Computed rows" below. When present, bypasses `path`/object resolution entirely — `path` is not read. |
| `computeRows` | `(el) => {label, val}[] \| falsy` | none | Escape hatch for a **group** of rows computed from state outside `el`'s own schema fields entirely (e.g. a cross-document lookup). See "Computed rows" below. Also bypasses `path` entirely. |

**`path` on an ordinary row must be a plain string or a real `'a | b'` XPath
union — never an array.** The array-of-alternatives, priority-fallback
convention (`['a', 'b']`, first-match-wins) is a feature of `interval.column[]`
and `dataTable.column[]` **only** (implemented inside `_resolveDataColumnCell`,
the shared table-column resolver) — an ordinary property row renders through
`renderPropertyRow`, which calls `evalXPath(el, rowCfg.path)` directly, and
`evalXPath`/`createExpression` require a string. Passing an array is a
**silent no-op**: the array coerces to a garbled comma-joined string,
`createExpression` throws, `evalXPath`'s own try/catch swallows it and
returns no matches — with no visible error, just an empty/missing row (or,
worse, an entire category silently vanishing, since `wrapCategoryHeader`
suppresses any header with an empty body). Found live (2026-07-22):
`OBJECT_CONFIGS.LinearReferencingMethod` was accidentally authored this way
(`path: ['diggs:name', 'glr:name']`, modeled after the working
`interval.column` convention) — the entire "Linear Referencing Method"
category disappeared for a file using the deprecated `glr:`-namespace variant,
with no error to point at the cause. **The fix for an ordinary row that needs
to match either of two alternative element names is the union string**
(`path: 'diggs:name | glr:name'`), exactly like
`OBJECT_CONFIGS.LinearSpatialReferenceSystem`'s own `'diggs:lrm | glr:lrm'`
row already does correctly — safe here specifically because a
current-vs-deprecated-namespace pair are mutually exclusive on any one
instance (never both populated at once), the same condition every other
union-path use in this engine already requires.

### Attribute paths

`path` may target an XML attribute (e.g. `{ path: '@gml:id', label: 'ID' }`).
The engine only attempts object-resolution (`resolveXlinkChildren`, see
below) on `Element` nodes (`nodeType === 1`) — an attribute node is always
treated as simple/leaf, safely, regardless of what it's named.

## Computed rows (`compute`, `computeRows`)

Both are checked at the very top of `renderPropertyRow`, before `path` is
even read — a row using either key never touches XPath resolution at all.

**`compute: (el) => result`** — a single row whose value is derived from the
object's context element (`el`) by arbitrary JS rather than a schema
element. Used for a value that genuinely has no XML backing of its own (e.g.
Borehole's Trajectory/Orientation row, classified from `centerLine`'s
`posList` tuples). Renders as one plain row, exactly like a simple
XML-backed property would:

- Return a falsy value → the row renders nothing (or, with `rowCfg.showEmpty`,
  an em-dash placeholder).
- Return a plain string → used as the value cell, same as any leaf value.
- Return `{val, keyExtra}` → `val` is the value cell; `keyExtra` is extra HTML
  rendered on its own line **under the label** (in the key column, not next
  to the value) — added for Borehole's Trajectory row, whose "View 3D" pill
  belongs with the label, not the value text.

```js
{ label: 'Trajectory', compute: el => FORMAT_FN.centerLineOrientationDetail(sf) }
```

**`computeRows: (el) => [{label, val}, ...]`** — a **group** of rows computed
from state outside `el`'s own schema fields entirely — typically a
cross-document lookup, not a child element of `el` at all. The motivating
cases are both on `Sample`-adjacent configs: `OBJECT_CONFIGS.Sample`'s
"Associated Measurements" row (every procedure that tested this Sample,
found by searching the whole document, not a property of `Sample` itself)
and the shared `_sampleRefRows` row on `OBJECT_CONFIGS.SoilSpecimen`/
`_MEAS_META_TRAILING` ("Sample Name" — resolves that object's own
`sampleRef` children to the linked Sample's display name).

Grouping follows the **same convention** every ordinary multi-occurrence row
already uses (see "Multi-occurrence grouping" below): a falsy/empty array
renders nothing; exactly one item renders as a plain row (`it.label` as its
key, e.g. a lone "Sample Name" reads just like any other field) with no
group header; two or more are wrapped in one `wrapCategoryHeader` (title =
`rowCfg.labelPlural` or `rowCfg.label + 's'`), each item its own row
underneath. `rowCfg.alwaysGroup: true` forces the header even for a single
result (used for "Associated Measurements", so it's always its own named
section rather than sometimes reading as a bare unlabeled row). **A
`computeRows` row using `alwaysGroup` with a `label` that already reads
plural must also set `labelPlural` explicitly** — found live:
"Associated Measurements" with no `labelPlural` fell through to the
`label + 's'` default and rendered "Associated Measurementss".

```js
{ label: 'Sample Name', computeRows: el => _sampleRefRows(el) }
```

## How a property row decides simple vs. object — fully automatic

There's no `kind:`/`type:` flag. For each matched node (respecting `multi`),
the engine calls `resolveXlinkChildren(node)`, which implements DIGGS'
embed-or-reference duality **generalized to count(*)**:

- **count(\*) === 0** (no embedded element child) → falls back to
  `xlink:href` resolution; 0 or 1 result.
- **count(\*) === 1** → the ordinary single-object-or-reference wrapper case
  (one embedded object).
- **count(\*) > 1** → a true DIGGS "Array Property Type" wrapper (e.g.
  `drillAdvancement`'s `DrillAdvancementArrayPropertyType`, which embeds
  multiple `Advancement` objects directly in one wrapper, with no
  per-object sub-wrapper) — **every** embedded child is returned, each
  becoming its own occurrence, exactly like multiple sibling wrapper
  matches would. No per-type config or override is needed for this case —
  verified (2026-07-14) against the full DIGGS 3.1-dev schema: of 34
  `*ArrayPropertyType` complex types, only `DrillAdvancementArrayPropertyType`
  carries its own attribute (`setName`) that would be lost by this generic
  handling; every other one is a bare sequence of embedded objects and needs
  nothing special.

Embedded content is always preferred over `xlink:href` when a property
element (unusually, but validly) has both — `resolveXlinkChildren` checks
for element children first and only falls back to `href` when there are
none.

A node with zero element children and no text (a true leaf, e.g. `gml:name`)
naturally resolves to nothing object-like and falls through to the
simple-property path — no special-casing needed.

**`multi`** (looping across sibling *wrapper* matches from `path`) and
`resolveXlinkChildren`'s count(\*) branch (looping across objects embedded
*within one wrapper*) are orthogonal and compose freely — a config can hit
either axis, or both at once, with no extra bookkeeping.

**Reference Properties** (any element whose name literally ends in `Ref`)
are never rendered as a row — checked before resolution, unconditionally.

## Object resolution — `configOverride` and the two lookup registries

Once a property resolves to one or more objects, each is rendered via
`renderResolvedObject`, in this order:

1. **`rowCfg.configOverride` present?**
   - **String** → treated as a type name, looked up in
     `SPECIAL_OBJECT_FORMATTERS` then `OBJECT_CONFIGS`, *instead of* the
     resolved element's own tag name.
   - **Array** → an inline config array, used directly instead of any
     registry lookup — for a one-off variant of a type you don't want to
     add to the shared registry.
   - **Function** `(node) => htmlString` → a full escape hatch, bypassing
     object/simple detection and the count(\*) generic-array handling
     entirely. Called once per matched node (respecting `multi`), each
     wrapped in its own category header via `itemLabel`/`label`. Reserved
     for the case a wrapper's *own* attributes carry real data that would
     be lost by generic array handling — currently only `drillAdvancement`
     (its `setName` attribute lives on the wrapper, not any `Advancement`
     child).
2. **No override** → the resolved element's own tag name is checked against
   `SPECIAL_OBJECT_FORMATTERS`, then `OBJECT_CONFIGS`, automatically.

**`SPECIAL_OBJECT_FORMATTERS`** (`Role`, `Remark`, `TimeInterval`,
`LinearExtent`, `PointLocation`, `BusinessAssociate`, `Parameter`,
`DelayEvent`) render as one formatted line/link instead of a nested table
— checked *before*
`OBJECT_CONFIGS`, so one of these can't be overridden back to table
rendering via a same-named `OBJECT_CONFIGS` entry (only via `configOverride`
pointing elsewhere). Each formatter is called with the **resolved object**
directly (not the wrapper) — `locationInline`/`timeIntervalInline`/
`renderParameterInline`/`resolvePropertyEl` (used by `renderBALink`/
`renderRoleNested`/`renderRemarkNested`) all self-detect via `localName`,
so they work identically whether hand-called with a wrapper or handed an
already-resolved object.

A type absent from both registries renders nothing (empty category body,
suppressed by `wrapCategoryHeader`) — not an error, but also not loud, so a
typo'd type name fails silently.

## Multi-occurrence grouping

When more than one occurrence resolves for a row, everything is wrapped in
one outer banner titled `labelPlural` (or `label + 's'` if omitted), with
each individual occurrence still rendering its own block underneath — via
`renderResolvedObject`'s own header for an `OBJECT_CONFIGS`-registry type,
or a flat row for a `SPECIAL_OBJECT_FORMATTERS` type. Exactly one
occurrence skips the outer banner **unless** `rowCfg.alwaysGroup` is set.

## Interval tables (`interval`)

An alternate rendering for a `multi:true` object-valued property row —
instead of the default per-instance full-KV category list (see
"Multi-occurrence grouping" above), the property renders as one compact
table: a row per occurrence, one or more **index** columns (from a
position/time-shaped property — the thing that makes each occurrence
distinct, e.g. a depth interval), a few summary **column**s, and — unless
suppressed — a per-row expand triangle revealing a KV table of everything
else on that occurrence. See `IntervalTableNotes.md` for the original design
notes/worked example (`Borehole.holeDiameter`/`BoreholeDiameter`) and
`renderIntervalTable`/`resolveIntervalIndexCells` (near `renderResolvedObject`
in `diggs_file_inspector.html`) for the implementation.

`rowCfg.interval` is only read when `rowCfg.multi` is also `true` — it's
meaningless on a non-repeating property (there's nothing to tabulate
against). It lives on the **parent** object's row config (e.g.
`OBJECT_CONFIGS.Borehole`'s `holeDiameter` row), not on the child type's own
`OBJECT_CONFIGS` (e.g. `OBJECT_CONFIGS.BoreholeDiameter`) — this is a
decision about how *this one property* should render, the same footing as
`itemLabel`/`categoryClass`/`configOverride`, all of which already live at
the row-config level rather than on the child type.

| Key | Type | Default if absent | Behavior |
|---|---|---|---|
| `expands` | boolean | `true` | `false` → every row renders with no expand triangle at all, plain columns only (no remaining-fields KV is even computed). `true` (or omitted) → a row still only gets a triangle if it actually has non-empty remaining content (see below) — a row with nothing left over never shows a triangle either, even with `expands:true`. |
| `index` | array of index-descriptors (below) | `[]` | One or more index dimensions. Each descriptor contributes one or two columns to the table, placed before `column`'s own columns, in declaration order. In practice almost always a single entry (e.g. one depth-interval property). |
| `column` | array of column-descriptors (below) | `[]` | Additional simple-leaf summary columns, placed after `index`'s columns. |
| `startOpen` | boolean | `false` | Whether the table's own outer category banner starts expanded. Every other category/section banner in this engine defaults **closed** (see "Default open/closed state" below) and this key defaults the same way for consistency — set `true` only when hiding the table behind an extra click would itself be a regression from prior behavior (Lithology's observation table is the one config that sets this: v1 always showed it immediately, with only individual rows collapsible for their own detail). |
| `rowKey` | `(childEl) => string` | none | Adds `data-obs-key="<value>"` to each generated `<tr>`. An escape hatch for a caller that needs to look up a specific row's DOM element from elsewhere on the page (Lithology's row ↔ graphic-log-zone sync is the only current user — see its own worked example below). |
| `rowOnClick` | string (a literal onclick expression, e.g. `'_lithRowClick(this)'`) | none — falls back to the default (`toggleKVSection(this)` when expandable, no handler otherwise) | Overrides the row's onclick **unconditionally**, including on a row with nothing to expand (unlike the default, which omits the handler entirely there) — needed when the click also has to do something besides toggling the row's own expand state (e.g. syncing an external element). The custom handler is responsible for calling `toggleKVSection` itself if it still wants the expand behavior (see the Lithology example, which does exactly this). |

An index/column descriptor's `path` must match the exact same relative
XPath string(s) used for that field in the *child* type's own
`OBJECT_CONFIGS` entry — the expand panel is built by filtering that
array (see "Remaining-fields expand panel" below), and the filter matches
on `path` string equality. `path` may also be an XPath **union**
(`'diggs:time | diggs:elapsedTime'`) for a schema `<choice>` where only one
branch is ever populated per occurrence (verified 2026-07-19 —
`Advancement`'s `time`/`elapsedTime` choice, `WaterStrikeReading`'s/
`LinkedWSReading`'s `elapsedTime`/`dateTime` choice) — `renderIntervalTable`
splits on `|` when building the consumed-paths set, so **every** branch of
the union gets excluded from the expand panel, not just the literal union
string (which wouldn't match either branch's own single-path entry in the
child's `OBJECT_CONFIGS`).

### Index descriptors (`interval.index[]`)

| Key | Type | Default if absent | Behavior |
|---|---|---|---|
| `path` | XPath string | — (required) | Where to find the index property, relative to the repeating child object. May be a union (`'a \| b'`) — see above. |
| `label` | string | none — falls through to the kind-specific label below | **Full override for this descriptor's header text, applied regardless of which node-kind actually resolved.** Meant for a union `path` whose resolved kind can differ row to row (e.g. `Advancement`'s `time`/`elapsedTime` choice — one row might resolve `time`, using what would've been `timeLabel1`, another `elapsedTime`, using `elapsedTimeLabel`) — without this, the header is built from whichever kind the first *sorted* row happened to produce, which reads inconsistently (or, if that row's index failed to resolve at all, previously fell back to running `_labelFromPath` on the raw union string — see below). Set it to something like `'Time \| Elapsed Time'` so the header reads consistently no matter which branch each row resolves to. Only meaningful for a single-cell descriptor (`pointLabel`/`elapsedTimeLabel`-shaped) — setting it on a descriptor that can produce two cells (a `LinearExtent` range) would give both cells the same header. |
| `pointLabel` | string | `'At'` | Column label when the resolved node is a `PointLocation` (one value). |
| `lineLabel1` | string | `'From'` | First column label when the resolved node is a `LinearExtent` (a range). |
| `lineLabel2` | string | `'To'` | Second column label for a `LinearExtent`'s end value (omitted entirely if the range has no end token). |
| `timeLabel1` | string | `'Time'` | First-column label when a `TimeInterval` (or bare dateTime leaf) resolves with **no pairing** — just a lone reported time. See "Shape-dependent `TimeInterval` labels" below for when this applies vs. `startLabel`. |
| `startLabel` | string | `'Start'` | First-column label when a `TimeInterval` resolves **paired** with an `end` *or* a `duration`. |
| `timeLabel2` | string | `'End'` | Second-column label for a `TimeInterval`'s `end`, when present. |
| `durationLabel` | string | `'Duration'` | Second-column label for a `TimeInterval`'s `duration`, when present and there's no `end` (a start+duration pairing, no absolute end). |
| `elapsedTimeLabel` | string | `'Elapsed Time'` | Column label when the resolved node is a plain elapsed-time/duration leaf (a bare measure, no wrapper object), **or** a `TimeInterval` with a `duration` but no `start`/`end` at all (see below). |

### Shape-dependent `TimeInterval` labels (2026-07-22)

A `TimeInterval` index's **default** first-column label is not fixed — it's
computed per-occurrence from that row's own shape, since which shape a given
occurrence has is a per-instance data fact, not something the config can
know ahead of time (the same reason the fixed-column-width reconciliation
below exists):

| Occurrence's own shape | First column | Second column |
|---|---|---|
| `start` only (no `end`, no `duration`) | `timeLabel1` (`'Time'`) | — |
| `start` + `end` | `startLabel` (`'Start'`) | `timeLabel2` (`'End'`) |
| `start` + `duration`, no `end` | `startLabel` (`'Start'`) | `durationLabel` (`'Duration'`) |
| `duration` only, no `start`/`end` | `elapsedTimeLabel` (`'Elapsed Time'`) | — |
| Plain elapsed-time/duration leaf (no `TimeInterval` wrapper) | `elapsedTimeLabel` (`'Elapsed Time'`) | — |
| Plain dateTime leaf (no `TimeInterval` wrapper) | `timeLabel1` (`'Time'`) — always, never `startLabel`, since a bare leaf has no pairing concept | — |

Every one of these is still overridable per row via the matching `idxCfg`
key; only the *default selection* between `timeLabel1`/`startLabel` is
shape-dependent. `idxCfg.label` (see above) overrides all of this
unconditionally for every cell the descriptor produces, regardless of shape
— use it when a union `path`'s resolved kind can differ row to row and a
single consistent header is wanted (e.g. `'Time \| Elapsed Time'`).

**2026-07-19 bug, fixed**: when an occurrence's index path failed to resolve
entirely, the em-dash-cell fallback used to check only `pointLabel`/
`lineLabel1` before falling back to `_labelFromPath(idxCfg.path)` — silently
ignoring `timeLabel1`/`elapsedTimeLabel`/`label` even when set, **and**
running `_labelFromPath` on the *whole raw union string* (e.g. `'diggs:time
| diggs:elapsedTime'`), which only strips a `diggs:`-prefix at the very
start — producing a garbled header like `"Time | diggs:elapsed Time"`. Now
checks `label`/`pointLabel`/`lineLabel1`/`timeLabel1`/`startLabel`/
`elapsedTimeLabel` (in that order — `startLabel` was added to this fallback
chain alongside the shape-dependent labels above) before falling back to
`_labelFromPath` on just the union's *first* branch.

Node-shape detection (`resolveIntervalIndexCells`) mirrors
`FORMAT_FN.locationInline`/`timeIntervalInline` — `LinearExtent` vs.
`PointLocation` vs. `TimeInterval` vs. plain leaf is auto-detected from the
resolved element's own `localName`, not declared in config. Unlike those
inline formatters (which join a range into one display string), each value
becomes its **own cell**, and the uom is shown **once, in the column
header** (a `<br>`-separated `.col-uom` line below the label) rather than
repeated per cell — deliberately different from an ordinary value column
(below), which shows uom inline with each value per the normal KV
convention, since an index's uom is table-wide, not per-occurrence. uom
resolution for `LinearExtent`/`PointLocation` prefers `srsName`/`LSR_UOM`
(the LRM-resolved unit) but falls back to the element's own `uomLabels`
attribute (`_axisUomLabel`, picking the token for the resolved axis index)
when no LSR unit is available — see "Shared helpers/caches" in CLAUDE.md.
`rowCfg.dimDefault` (the same key `SPECIAL_OBJECT_FORMATTERS` rows already
use for `LinearExtent`/`PointLocation` `srsDimension` fallback) applies here
too.

**Display formatting (2026-07-20)**: every index cell (not just the leading
one) forces its content onto a single line via `.kv-interval-lead`
(`white-space:nowrap`) — without it, a narrow column can wrap the leading
`.kv-tri` triangle away from its value, or wrap a value like `36.59`
mid-number onto two lines once `.kv-interval-val` picked up
`word-break:break-word` for long free-text columns (found live on a lithology
"To" column, which isn't the leading cell so the original leading-cell-only
fix didn't cover it). A numeric index value is also rounded to 2 decimal
places for display (`Math.round(v * 100) / 100`, so a value like `32.2912`
reads as `32.29` and an already-short value like `36.59` is untouched) — a
formatted date/time string passes through unaffected, since the rounding
only applies when `typeof value === 'number'`. This is purely a display
concern; the underlying resolved value used for sorting is never rounded.

**Fixed column width per descriptor (2026-07-19 fix)**: a single index
descriptor can legitimately resolve to a *different* number of cells from
row to row — a `LinearExtent` range (From+To) on one occurrence vs. a
single point (From only, no "to" token) on another, a `TimeInterval` with
just a `start` vs. `start`+`end`, or failing to resolve at all on a row
where that property simply wasn't reported (found live against
`Borehole.constructionEvent` real data, where some `BoreholeEvent`
occurrences report only `location`, others only `time`). Cells used to be
placed purely positionally per row, so a descriptor's variable width
silently misaligned every column after it once two rows disagreed on how
many cells they produced — `renderIntervalTable` now resolves every row's
raw per-descriptor cells first, then fixes each descriptor's column width
to the *most* cells any row produced for it (canonical per-slot labels/uom
come from that same richest row), and pads every other row's missing slots
with em-dash placeholders under the correct label — so a given column
always means the same thing in every row, regardless of which rows
happened to populate which optional sub-value. An occurrence whose
descriptor didn't resolve at all still gets exactly this fixed number of
em-dash slots (not just one), and a descriptor nothing resolved for on
*any* row falls back to a single em-dash slot using `idxCfg`'s own static
label keys.

A `TimeInterval` with no `start`/`end` at all but a `duration` child
(verified 2026-07-19 against `Advancement.time` in `InspectorTestFile.xml`
— `<time><TimeInterval><start/><duration uom="min">5</duration>` — a
duration-only reading, no absolute time) reads as a single cell under
`elapsedTimeLabel`, the same as a bare `elapsedTime`/duration leaf — not
under `timeLabel1`/`timeLabel2`, which are reserved for an absolute
start/end. A plain leaf (no wrapper object at all) is disambiguated between
a `gml:TimePositionType` date (`timeLabel1`) and an elapsed-time/duration
measure (`elapsedTimeLabel`) by whether it carries a `uom` attribute — a
date never does, a measure always does — **not** by whether its text
contains `"T"` (a real ISO `dateTime`-with-time-of-day value, e.g.
`"2015-06-04T23:55:00"`, legitimately contains `"T"` too; an earlier
version of this check excluded exactly that case, a bug fixed before it was
ever exercised against real data — see `WaterStrikeReading`'s/
`LinkedWSReading`'s bare `dateTime` choice-branch, `gml:TimePositionType`).

Rows are sorted ascending by the **first** index descriptor's own numeric
sort value (the `LinearExtent`'s `from`, the `PointLocation`'s value, the
`TimeInterval`'s `start` as an epoch timestamp, or the leaf's parsed
number) — an occurrence whose index didn't resolve to a sortable number
sorts after every occurrence that did.

### Column descriptors (`interval.column[]`)

| Key | Type | Default if absent | Behavior |
|---|---|---|---|
| `path` | XPath string, **or an array of XPath strings** | required, unless `compute` is set | Where to find the column's value, relative to the repeating child object. An array is a **priority fallback list** (2026-07-19) — see below. When `compute` is also set, `path` is only consulted for the expand-panel exclusion set (`_buildTableConsumedPaths`) — the cell's own content comes from `compute` instead (see below). |
| `label` | string | Auto-derived from `path` (same `_labelFromPath` camelCase→Title Case rule as an ordinary row's label; for an array `path`, derived from the *first* alternative — in practice always set `label` explicitly for an array path, since an auto-derived name from whichever alternative happens to be first is rarely the right header text) | The column header text. |
| `boolean` | boolean | `false` | Same Yes/No normalization as an ordinary property row's `boolean` key. |
| `attrClass` | string (CSS class) | none | Same "other attributes" parenthetical override as an ordinary property row's `attrClass`. |
| `compute` | `(childEl) => {html, sortVal?} \| string \| falsy` | none | Escape hatch that bypasses path-based cell resolution entirely — see "Object-valued columns via `compute`" below. Checked *before* `path`, so the two aren't mutually exclusive: keep `path` alongside `compute` purely so the expand panel still excludes that field (see the `path` row above). |

A column with no `compute` is rendered via the same `renderSimplePropertyCell`
every ordinary leaf property row uses — value + uom (inline, not
header-hoisted like an index column) + any other attributes in one
parenthetical + codeSpace. If a `column.path` (with no `compute`) resolves to
an **object-valued** property, it's silently left out of the table and falls
back into the expand panel instead, rather than being dropped or crashing —
the intended v1 scope for a plain `path` column is simple leaf values only,
per `IntervalTableNotes.md`. Use `compute` (below) when an object-valued
summary is genuinely wanted in the column itself.

### Object-valued columns via `compute` (2026-08-06)

A plain `path` column deliberately never renders an object-valued match as a
cell — only a leaf value. When a column genuinely needs to summarize an
*object*-valued property (e.g. a `PointLocation`), set `compute` instead:

```js
{
  // Object-valued (PointLocation) — a plain `path` column would leave this
  // as an em-dash and fall back to the expand panel; `compute` resolves and
  // formats it directly, mirroring what _renderGenericDataTable's own
  // auto-built column descriptors already do internally for exactly this
  // case (locationInline here).
  path: 'diggs:rpLocation', label: 'Reference Point Elevation',
  compute: c => {
    const propEl = evalXPath(c, 'diggs:rpLocation')[0];
    const target = propEl && resolveXlinkChildren(propEl)[0];
    const fmt = target && SPECIAL_OBJECT_FORMATTERS[target.localName];
    return fmt ? { html: fmt(target) } : null;
  },
}
```

`compute(childEl)` is called by `_resolveDataColumnCell` in place of path
resolution. Its return value:

- Falsy → the cell renders an em-dash.
- An object `{html, sortVal?}` → `html` is the cell content; `sortVal`
  feeds `dataTable.sort` (below) when present, else defaults to `''`.
- A bare string/value → used as **both** the cell HTML and (stringified)
  the sort value.

`path` is kept alongside `compute` (as shown above) purely so
`_buildTableConsumedPaths` still excludes that field from the per-row
expand panel — `_resolveDataColumnCell` checks `compute` before ever
touching `path`, so the two never conflict; `path` here does no resolution
work of its own. First shipped use: `OBJECT_CONFIGS.WaterLevelMonitoring`'s
`referencePoints` row (its `rpLocation` column, above) — the first
hand-authored `interval`/`dataTable` column descriptor in the file to use
`compute`. Apply the same pattern to any future column needing to show an
object-valued (not plain-leaf) summary value.

**`path` as a priority-fallback array** (2026-07-19) — `['a', 'b', 'c']`
tries each alternative in order against the repeating child object,
independently, and uses the **first one that actually has something to
show** — added for `Borehole.constructionMethod`'s column, which needs
"prefer the nested Specification's own `gml:name`, fall back to
`BoreholeConstructionMethod`'s own `gml:name` only if the Specification (or
its name) is absent". "Actually has something to show" matters, not just
"matched an element": an alternative that resolves to an *empty* leaf
element (e.g. a schema-present-but-blank `<gml:name/>` — a real case, found
live in `InspectorTestFile.xml`'s `Location_BH-33`, where one
`BoreholeConstructionMethod`'s Specification carries exactly this) does
**not** count as matched — the search keeps going to the next alternative
rather than stopping on a technically-present-but-blank node and rendering
an em-dash. An object-valued alternative (handled specially below) always
counts as matched regardless of its own leaf text, since "empty" isn't a
meaningful concept for it the same way:

```js
column: [{
  path: ['diggs:constructionMethod/diggs:Specification/gml:name[1]', 'gml:name[1]'],
  label: 'Specification',
}],
```

This is **deliberately a different mechanism from the `'a | b'` union
syntax** `index` paths use for a schema `<choice>` (see "Index descriptors"
above and `renderIntervalTable`'s own comment) — a real XPath `|` union
returns matches from **both** sides at once, in document order, which only
gives correct "prefer A, else B" behavior when the schema *guarantees* at
most one side is ever populated (a `<choice>`). Here both alternatives can
genuinely be present simultaneously (a `BoreholeConstructionMethod` can have
its own `gml:name` *and* a Specification with its own, unrelated `gml:name`)
and the config author wants an explicit preference, not whichever happens
to come first in document order — which, for this exact pair, would be the
*wrong* one anyway, since `BoreholeConstructionMethod`'s own `gml:name`
precedes its nested `constructionMethod` (Specification) child in schema
sequence order. An array is tried strictly in the order **written**,
regardless of document order. Only the matched alternative's path is
excluded from the expand panel (not every alternative wholesale).

Verified 2026-07-19 against three real/synthetic cases: `inspectorMockup.xml`'s
`Location_BH-33` (Specification has a real name → wins outright); a
synthetic snippet with a nameless Specification (no `gml:name` element at
all → falls back to the object's own name) and no match on either (em-dash);
and — the case that caught the "matched an element" vs. "matched a value"
bug above — `InspectorTestFile.xml`'s `Location_BH-33`, whose Specification
has an *empty* `<gml:name/>` (present as an element, no text) rather than no
name element at all — correctly falls back to the object's own populated
name instead of stopping on the blank element and showing an em-dash.

### Remaining-fields expand panel

Rather than a separately-authored "detail" config, each row's expand
content is computed by taking the child type's own `OBJECT_CONFIGS[type]`
array (or `rowCfg.configOverride` if it's an array) and **dropping every
entry whose `path` was already consumed by an `index` or `column`
descriptor**, then rendering what's left through the ordinary, unchanged
`renderKVObject`. This means the expand panel automatically shows
everything else on the object (name/description/status, other properties,
remark/role, ...) with no duplication and no separate config to keep in
sync — and empty `sectionHeader` groups still collapse away automatically,
exactly as `renderKVObject` already does everywhere else.

**Deliberately exact-path matching only — a nested/deep consumed path does
NOT exclude its containing wrapper row** (settled 2026-07-19, after trying
and reverting the opposite same-day — see below). A user-authored
`Borehole.constructionEvent` "Event" column, `column: [{ path: ['gml:name[1]',
'gml:description', 'diggs:remark/diggs:Remark/diggs:content'], label: 'Event' }]`,
surfaced the question directly: for three of BH-33's real `BoreholeEvent`s
(`InspectorTestFile.xml`), the Event value comes from the *deep*
`diggs:remark/diggs:Remark/diggs:content` path, which doesn't string-match
`_OBJ_TYPE_TRAILING`'s `diggs:remark` row (that row renders the *whole*
Remark — content **and any author/date it may carry** — as one line via
`SPECIAL_OBJECT_FORMATTERS.Remark`, keyed off the wrapper path, not the deep
content path) — so the whole Remark still renders in the expand panel,
redundantly repeating the same text the Event column just showed.

A same-day attempt fixed *that* by also excluding a row whenever any
consumed path started with `f.path + '/'` (a prefix match) — but this traded
a cosmetic annoyance for real, silent data loss on a **much bigger case**:
`Borehole.constructionMethod`'s own column (see its worked example above)
falls back through `diggs:constructionMethod/diggs:Specification/gml:name[1]`,
and `diggs:constructionMethod` is *itself* a config row (labeled
"Specification") whose object carries many more fields —
identifier/status/implementationStatus/shortMethodName/standardClause/etc.
The prefix match silently dropped the **entire** Specification section from
the expand panel the moment its name was reused in the column, discarding
real data with no indication anything was missing. Reverted per explicit
user direction: an occasional cosmetic duplicate (a Remark's content
appearing both in a column and again as part of its own composite line) is
an acceptable, minor cost — silently hiding a real XML element's data to
avoid it is not. The filter is back to `!consumedPaths.has(f.path)`, exact
match only, and stays that way; don't reintroduce prefix-based exclusion
without also solving how to keep a partially-consumed object's *other*
fields visible (no such mechanism exists today — `SPECIAL_OBJECT_FORMATTERS`
composite formatters like Remark/Role render all-or-nothing, with no hook
to suppress one sub-field while keeping the rest).

A row only gets an expand triangle (`.kv-tri`, otherwise a `.kv-tri-spacer`
of the same width so index values still line up) when `expands !== false`
**and** that occurrence's own filtered remaining config actually produced
non-empty HTML — an occurrence whose every field is already shown as an
index/column gets no triangle, even though the table-level `expands`
default is `true`. Toggling reuses `toggleKVSection` unchanged (a `<tr>`
row and its adjacent detail `<tr>` toggle exactly like the `<div>`/`<div>`
category-header pattern it was written for).

### Worked example

```js
{
  path: 'diggs:holeDiameter', multi: true, labelPlural: 'Hole Diameters',
  interval: {
    index: [{ path: 'diggs:diameterLocation' }],   // From/To (m), auto-detected LinearExtent
    column: [{ path: 'diggs:diameter' }],           // Diameter, e.g. "200.0 mm (measured, greater than)"
  },
}
```

Renders a "Hole Diameters" table with From/To/Diameter columns; each row
expands to Name/Description/Status (everything else
`OBJECT_CONFIGS.BoreholeDiameter` declares, since `diameterLocation` and
`diameter` were consumed by `index`/`column`). First shipped use, verified
2026-07-19 against `inspectorMockup.xml`'s `Location_BH-33`.

**Phase 2 (2026-07-19) — union-path index on a schema `<choice>`**, from
`Borehole`'s `drillAdvancement` row. `Advancement` requires `location` but
only optionally carries `time` (`TimeInterval`) **or** `elapsedTime` (a bare
duration leaf) — never both, per `AdvancementType`'s own `<choice>` — so one
index descriptor's `path` covers both branches:

```js
configOverride: (setEl) => {
  const setName = setEl.getAttribute('setName') || '';
  const rows = evalXPath(setEl, 'diggs:Advancement');
  const nameRow = setName ? renderSimpleRow('Set Name', escHtml(setName)) : '';
  const tableHtml = renderIntervalTable(
    rows.map(el => ({ child: el })),
    { interval: {
        index: [
          { path: 'diggs:location' },
          { path: 'diggs:time | diggs:elapsedTime', label: 'Time | Elapsed Time' },
        ],
        column: [{ path: 'diggs:advancementRate' }],
    } },
    'Advancement'
  );
  return nameRow + tableHtml;
},
```

Note this is called directly from inside a `configOverride` **function**
(the `DrillAdvancementArrayPropertyType` wrapper embeds multiple
`Advancement` children with its own `setName` attribute — see
"`configOverride` as a function" above) — `renderIntervalTable(resolved,
rowCfg, label)` only ever reads `child` off each `resolved` entry, so a
caller with a plain array of elements (not `{propEl, child}` pairs from
`renderPropertyRow`'s own resolution) can call it directly with
`els.map(el => ({ child: el }))`, bypassing `renderPropertyRow` entirely.
Verified 2026-07-19 against `InspectorTestFile.xml`'s two real `Advancement`
instances, which exercise the duration-only `TimeInterval` sub-case (see
above) — From/To (ft) + Elapsed Time (min) columns, Advancement Rate
em-dash (unpopulated in that file), expand panel showing
Description/Downward Thrust/Downthrust Pressure/Penetration Rate.

**Phase 2 — union-path index on a *nested* `multi:true` row**, from
`WaterStrikeReading`'s `linkedReading` row (`LinkedWSReading`, one primary
reading's follow-up readings — same two `<choice>`s as `WaterStrikeReading`
itself: `elapsedTime|dateTime` for the reading's own time, `notEncountered|
waterLocation` for its value):

```js
{ path: 'diggs:linkedReading', multi: true, labelPlural: 'Linked Readings',
  interval: {
    index: [
      { path: 'diggs:elapsedTime | diggs:dateTime', timeLabel1: 'Date/Time' },
      { path: 'diggs:waterLocation', pointLabel: 'Water Depth' },
    ],
  },
},
```

No `column` here — `notEncountered` (the rare case where no water was found,
so `waterLocation` is absent instead of reported) is deliberately left out
of `index`/`column` entirely, so it just falls through to the expand panel
like any other unconsumed field — no special-casing needed. This is the
ordinary `interval:` key on a normal `renderPropertyRow`-driven `multi:true`
row (unlike `drillAdvancement` above), verified 2026-07-19 via a synthetic
in-page `WaterStrikeReading` snippet (no repo test file currently populates
`linkedReading`) exercising both `<choice>` branches per row.

**Phase 3 (2026-07-19) — auditing every other `multi:true` row in
`OBJECT_CONFIGS.Borehole`** (and one level of nesting below it) for which
are genuinely index-shaped. Converted, all verified live except where
noted:

| Parent row | Child type | `index` | `column` |
|---|---|---|---|
| `Borehole.constructionMethod` | `BoreholeConstructionMethod` | `location`, `methodTime` | Specification's `gml:name`, falling back to the object's own `gml:name` (array `path` — see "Column descriptors" above; revised 2026-07-19, was `holeStability`) |
| `Borehole.casing` | `Casing` | `casingLocation` | `casingOutsideDiameter`, `casingMaterial` |
| `Casing.casingAdvancement` (nested) | `CasingAdvancement` | `advancementTime`, `casingBaseAtStart`, `casingBaseAtEnd` | `casingBlows` |
| `Backfill.backfillLayer` (nested) | `BackfillLayer` | `backfillInterval` | `backfillMaterial` |
| `Borehole.constructionEvent` | `BoreholeEvent` | `location`, `time` | none |
| `Borehole.flush` | `Flush` | `flushZoneLocation` | `fluidType` |
| `Borehole.chiseling` (deprecated) | `Chiseling` | `chiselingLocation`, `timeTaken` | `chiselingToolUsed` |
| `Borehole.environment` | `Environment` | `dateTime` | `ambientTemperature` |

Two rows carry more than one *point/line*-shaped index descriptor at once
(`CasingAdvancement`'s `casingBaseAtStart`/`casingBaseAtEnd`, both
`PointLocationPropertyType` — object-valued, so they can't be `column`s;
each is its own index descriptor instead, contributing one cell apiece) —
the engine doesn't care how many index descriptors there are or what mix of
kinds they resolve to, it was already designed to concatenate whatever
columns each descriptor produces.

`Borehole.constructionEvent`'s `location`/`time` are the pair that surfaced
the fixed-column-width bug described above — a real dataset
(`InspectorTestFile.xml`'s `Location_BH-33`) has some `BoreholeEvent`
occurrences reporting only `location` and others only `time` (with both a
`start` and `end`), so this is the config that proved the fix, not just a
theoretical case.

`OBJECT_CONFIGS.BoreholeEvent`'s own `location`/`time` rows also had a
latent bug fixed alongside this: the config previously read `diggs:eventTime`
— an element that doesn't exist anywhere in the schema. `location`/`time`
are inherited from `AbstractEventType` (`core/AbstractTypes.xsd:268`), which
names the time element literally `time`, not `eventTime` — this row never
matched anything until corrected.

**Deliberately NOT converted**: `Borehole.waterStrike` — `WaterStrike`'s own
top-level fields (`sealLocation`/`bottomCasing`/`bottomHole`, all distinct
`PointLocation` concepts, no single natural "index") aren't cleanly
index-shaped the way every row above is; the genuinely repeating,
time-indexed part of this structure (`WaterStrikeReading.linkedReading`) was
already converted in phase 2. Also not converted: `gml:name`/`gml:identifier`/
`investigationTarget`/`boreholeType` (plain repeating text/enum values, not
objects at all), `linearReferencing` (`LinearSpatialReferenceSystem` — a
referencing-system *definition*, not a position/time-indexed measurement),
and `otherSamplingFeatureProperty` (`Parameter`, renders via
`SPECIAL_OBJECT_FORMATTERS` as a flat name/value row with no location/time
property of its own to index on).

**Phase 4 (2026-07-20) — Lithology rebuilt on this engine, with full DIGGS
schema coverage.** Restores the v1 lithology observation display
(`LithologySystem` → `LithologyObservation` → primary/component
`Lithology`/`ComponentLith` classification, colors, constituents, lith/
component properties, particle size distributions, placed observations,
base boundaries) as `OBJECT_CONFIGS` entries instead of a bespoke parse+
render pipeline. This is also where `startOpen`/`rowKey`/`rowOnClick` (see
the `interval` key table above) were added, since Lithology needed all
three:

```js
// On LithologySystem's own config (OBJECT_CONFIGS.LithologySystem):
{
  path: 'diggs:lithologyObservation', multi: true, labelPlural: 'Lithology Observations',
  interval: {
    startOpen: true,  // v1 always showed this table immediately
    index: [{ path: 'diggs:location' }],
    column: [{
      path: ['diggs:primaryLithology/diggs:Lithology/diggs:classificationCode',
             'diggs:primaryLithology/diggs:Lithology/diggs:lithDescription'],
      label: 'Material',
    }],
    // Row <-> graphic-log-zone sync (see _lithRowClick/_lithZoneClick in
    // diggs_file_inspector.html, near drawLithLog). rowKey must match
    // exactly how the separate custom geometry parser
    // (parseLithologyObservation) derives obs.gml_id, so a table row and
    // its SVG zone resolve to the same key regardless of which of the two
    // independent pipelines produced it.
    rowKey: el => (el.getAttribute('gml:id') || el.getAttributeNS(NS.gml, 'id') || '')
      .replace(/[^a-zA-Z0-9_-]/g, '_'),
    rowOnClick: '_lithRowClick(this)',
  },
},
```

The renderer (`renderLithBadgeContent`) calls this row two ways: `renderKVObject(sys.el, OBJECT_CONFIGS.LithologySystem.filter(f => f.path !== 'diggs:lithologyClassificationType' && f.path !== 'diggs:lithologyObservation'))`
for the system's own "extra metadata" panel (name/description/identifier/
status/observationProcedure/role/remark/associatedFile — everything not
already shown via the static classification-type header or the table
itself), and `renderPropertyRow(sys.el, thatSameRowConfig)` for the table.
Both reuse the unchanged generic engine — no lithology-specific rendering
code exists anymore beyond `_lithRowClick`/`_lithZoneClick` (the row↔zone
sync) and `drawLithLog` (the SVG graphic log itself, which still consumes
the separate custom-parsed `sys.observations` for geometry/pattern-fill —
deliberately kept independent of the KV/table display, since the graphic
log doesn't render KV rows and duplicating that parse into more
`OBJECT_CONFIGS` rows would only risk the two falling out of sync).

Two new shapes worth noting since they don't appear anywhere else yet:
`ComponentLithology` (`LithologyObservation.componentLithology`) is a
two-layer wrapper — the abundance/`@association`/`@rank` attributes live on
`ComponentLithology` itself, while the actual classification lives one
level deeper on its own `lithology` property (`ComponentLith`) — easy to
conflate as one type; and `LithProperties`/`ComponentProperties` are
genuinely distinct types (not one aliased to the other) that happen to
share most of their ~30 fields, differing in exactly which four fields
(`odor`/`unitRecoveryLength`/`unitRQD`/`unitRQDLength`) and which
"other property" element name (`otherLithProperty` vs.
`otherComponentProperty`) each one has.

Verified live (2026-07-20) against real data in `InspectorTestFile.xml` (13
`LithologySystem`s): graphic log + table render together; row expand
(orange highlight, via the ordinary `.kv-row-expanded` mechanism — no
lithology-specific row-color class anymore) and graphic-log zone sync work
both directions; one observation exercising primary Lithology + 2 Colors
(each with `ColorComponents`) + a Constituent + `LithProperties` (with a
full `ParticleSizeDistribution` — mean/modal/equivalent/minimum/maximum
grain size, each its own nested `ParticleSize` object) + 3
`ComponentLithology`s (each with its own nested classification/color/
constituent/`ComponentProperties`) + a `baseBoundary` all rendered with no
missing elements; a separate observation exercising `placedObservation`
also rendered correctly.

## Data tables (`dataTable`)

A sibling of `interval:` for a `multi:true` object-valued row that has the
same "a few summary columns + per-row expand to everything else" shape but
**no natural index** — no depth/time/position property that makes each
occurrence distinct. `ComponentLithology`, `Constituent`, and `Color` are the
motivating cases: their useful at-a-glance data is a name/material column plus
an abundance column, with nothing to sort rows by inherently. Rows render in
**document order** by default; an optional `sort` key can reorder by a chosen
column instead.

Shares its column-resolution, consumed-paths, and expand-panel machinery
byte-for-byte with `interval:` — `_buildTableConsumedPaths`,
`_resolveDataColumnCell`, and `_buildTableExpandHtml` (near
`renderIntervalTable`/`renderDataTable` in `diggs_file_inspector.html`) are
extracted helpers both `renderIntervalTable` and `renderDataTable` call, so a
`dataTable.column` descriptor behaves **identically** to an
`interval.column[]` descriptor — see "Column descriptors (`interval.column[]`)"
above for the full priority-fallback-array/object-valued-exception rules; they
are not repeated here. Like `interval`, `rowCfg.dataTable` is only read when
`rowCfg.multi` is also `true`, and lives on the **parent** object's row config,
not the child type's own `OBJECT_CONFIGS`.

| Key | Type | Default if absent | Behavior |
|---|---|---|---|
| `column` | array of column-descriptors (identical shape to `interval.column[]`) | `[]` | The table's only columns — there is no `index`. |
| `expands` | boolean | `true` | Same meaning as `interval.expands`. |
| `startOpen` | boolean | `false` | Same meaning as `interval.startOpen`. |
| `rowKey` | `(childEl) => string` | none | Same meaning as `interval.rowKey`. |
| `rowOnClick` | string (literal onclick expression) | none | Same meaning as `interval.rowOnClick`. |
| `sort` | `{ column, dir?, numeric? }` | none (document order) | Reorders rows by one column's resolved value. `column` is either the column's `label` string (matched against each descriptor's own `label`, or its auto-derived label from `path` if `label` is omitted) or a 0-based index into the `column` array. `dir: 'desc'` reverses (default ascending). `numeric: true` parses each cell's value as a float for comparison (a value that fails to parse sorts last, regardless of `dir`); omitted/`false` compares as strings (`localeCompare`). Ties keep their original document-order relative position (a stable sort). |

Column resolution now also follows `xlink:href` at an intermediate wrapper
(2026-07-22, via `_resolvePathNodes`, shared by `interval.column` too) — a
multi-segment `path` like
`'diggs:lithology/diggs:ComponentLith/diggs:classificationCode'` still
resolves when `diggs:lithology` is an empty `xlink:href` reference rather than
holding its `ComponentLith` inline. A plain XPath (what `evalXPath` alone
supports) has no way to cross that hop; `_resolvePathNodes` tries the direct
XPath first (so any inline instance is unaffected) and only falls back to a
step-wise, href-following walk if that resolves nothing. A bracketed
predicate on a segment (e.g. `'gml:name[1]'`, used by
`Borehole.constructionMethod`'s own Method column) is handled — stripped for
the localName match, then applied as a 1-based position within that node's
own matches. **Verified against a real bug**, not just in theory: an earlier
version of this resolver didn't strip the predicate, so a bracketed final
segment silently failed to match through the href branch, falling through to
a *lower-priority* fallback alternative instead of the referenced object's own
value (caught via `LithologyXlinkTest.xml`, a synthetic paired inline/xlink
test file in the repo root — see CLAUDE.md's "Data-table engine" section for
the full story, including a schema nuance: `ComponentLithPropertyType` doesn't
actually declare `xlink:href` support in the current 3.1-dev schema, unlike
`SpecificationPropertyType`, so the two halves of that test file have
different `xmllint` expectations).

### Worked examples

`LithologyObservation.componentLithology` — a `ComponentLithology` wraps a
`ComponentLith` one level down via its own `lithology` property
(`ComponentLithologyType.lithology` is a `ComponentLithPropertyType`, per
`core/Core.xsd` — **not** `Lithology`, the distinct sibling type
`primaryLithology` uses; easy to conflate, see the config's own banner
comment):

```js
{
  path: 'diggs:componentLithology', multi: true,
  label: 'Component Lithology', labelPlural: 'Component Lithologies',
  dataTable: {
    column: [
      {
        path: ['diggs:lithology/diggs:ComponentLith/diggs:classificationCode',
               'diggs:lithology/diggs:ComponentLith/diggs:lithDescription'],
        label: 'Material',
      },
      { path: ['diggs:abundanceCode', 'diggs:abundancePercent'], label: 'Abundance' },
    ],
  },
}
```

`Lithology.constituent`/`ComponentLith.constituent` and `.color` — both parent
types need identical `Constituent`/`Color` columns, so the `dataTable` configs
are shared module-level consts (`_LITH_COLOR_DATATABLE`,
`_LITH_CONSTITUENT_DATATABLE`, near `OBJECT_CONFIGS.Lithology`) rather than
duplicated inline:

```js
const _LITH_CONSTITUENT_DATATABLE = {
  column: [
    { path: 'diggs:codeValue', label: 'Constituent' },
    { path: ['diggs:abundanceCode', 'diggs:abundancePercent'], label: 'Abundance' },
  ],
};
// ...
{ path: 'diggs:constituent', multi: true, label: 'Constituent', labelPlural: 'Constituents', dataTable: _LITH_CONSTITUENT_DATATABLE },
```

Renders rows in document order (a `Lithology`'s constituents/colors have no
inherent ordering); `maxAbundancePercent` and every other field not consumed by
a column (description, distribution, rank, status, remark, identifier, color
components, ...) still shows in each row's expand panel.

### Deferred: unifying with the SF summary table

The upper-left Sampling Feature summary table (`buildSFTabs`/`buildSFTable`) is
conceptually the same "rows + columns + expand/select" shape, but its columns
derive from **pre-parsed flat SF properties** (`sf.name`, `sf.depth`, resolved
`parentRef`/`childRefs` cross-links via `sfById`, an install-count "…N more"
expander) rather than XML paths on a repeating child element, and its row
click **selects** the feature (`selectSF`) rather than expanding a KV panel.
Migrating it onto this engine is a deliberately separate, not-yet-done pass —
but `_resolveDataColumnCell` already has the forward seam for it:
`colCfg.compute(child)` (see "Object-valued columns via `compute`" above),
which bypasses path resolution entirely and returns `{html, sortVal}` (or a
bare value) directly — exactly what a computed SF-table column (a resolved
link, a formatted depth/date) would need. `compute` now has its first real
caller (`OBJECT_CONFIGS.WaterLevelMonitoring`'s `referencePoints` column,
for an object-valued cell — not an SF-table column), so the mechanism itself
is proven in production, just not yet for this specific migration. A future
migration would also need a `rowMode: 'select'`-style config (swap the row's
onclick for a select callback, omit the expand row) that is **not
implemented yet** — only the default expand-on-click row is.

## Geometry rows (`geoLocation`, `mapToggle`)

Two independent row-config flags (2026-07-21/22) built for `OBJECT_CONFIGS.Project`'s
on-demand geometry rows (`referencePoint`/`linearExtent`/`arealExtent`,
`ProjectEvent.location`, `Project.locality`) — see CLAUDE.md's "Project detail
and geometry" for the surrounding on-demand-plotting feature. Both are read
in `renderResolvedObject`.

**`geoLocation: true`** opts a `PointLocation`/`LinearExtent` row **out** of
`SPECIAL_OBJECT_FORMATTERS`' one-line shortcut (`FORMAT_FN.locationInline`)
and into the normal `OBJECT_CONFIGS` registry/nested-KV path instead (i.e.
`OBJECT_CONFIGS.PointLocation`/`.LinearExtent`, added specifically for this).
`locationInline` is built for a borehole's own linear-referencing system — it
shows a single axis value picked by `srsDimension` (the depth/measure value),
correct for e.g. `BoreholeDiameter.diameterLocation` but silently wrong for a
real standalone 3D geographic point/line, where every axis (easting/northing/
height) plus the object's own `uncertainty` child needs to show, not just one.
Every `PointLocation`/`LinearExtent` row that omits this flag keeps the
existing one-line inline behavior unchanged.

```js
{ path: 'diggs:location', label: 'Where', geoLocation: true }   // ProjectEvent
```

**`mapToggle: true`** is for a row whose label carries its own always-visible
"Show on Map" button (via a custom `itemLabel` function — see the worked
example below) that must stay clickable for every occurrence, regardless of
whether that occurrence has any further KV detail (description/uncertainty) to
expand into. It routes the row through `wrapGeometryCategoryHeader` instead of
the normal `wrapCategoryHeader`. The only difference: `wrapCategoryHeader`
renders **nothing** for an empty body (correct for every ordinary object-valued
row — no header without content); `wrapGeometryCategoryHeader` still renders a
static header (with a `.kv-tri-spacer` in place of the triangle, no `onclick`)
when the body is empty, so the label's own button doesn't vanish along with it.
When the body **is** non-empty, the two behave identically — closed by default,
`.kv-tri` toggles via `toggleKVSection`.

`geoLocation` and `mapToggle` are independent and often combined but not the
same thing: `mapToggle` only changes whether an empty body suppresses the
header; `geoLocation` only changes which renderer produces the body in the
first place. `Project.arealExtent` sets `mapToggle` alone (no `geoLocation`) —
its `PlanarSurface`/`MultiPlanarSurface`/`Shell`/`MultiSurfaceAggregate` body
types were never in `SPECIAL_OBJECT_FORMATTERS` to begin with, so the default
path already resolves the registry correctly. `Project.locality` sets
`geoLocation` alone (no `mapToggle`) — it gets the full nested coordinate
display but not a map-plot button (`LocalityPropertyType`'s `PointLocation`
branch is itself schema-discouraged for Projects in favor of
`referencePoint`).

### Worked example

```js
{
  path: 'diggs:referencePoint', label: 'Reference Point',
  geoLocation: true, mapToggle: true,
  itemLabel: el => {
    const latlng = _pointLocationToLatLng(el);
    return _projGeomItemLabel('Reference Point', latlng ? { kind: 'point', latlngs: latlng } : null);
  },
},
```

`_projGeomItemLabel` appends the "Show on Map" pill to the static label and
registers the resolved lat/lngs so the pill's click handler
(`_toggleProjGeomOnMap`) can plot them (properly `toWGS84`-transformed) and
pan/zoom the map — see `_pointLocationToLatLng`/`_linearExtentToLatLngs`/
`_surfaceToLatLngRings` near `_toggleProjGeomOnMap` in
`diggs_file_inspector.html`. If `latlng` fails to resolve, `itemLabel` passes
`null` and the pill is omitted for that occurrence, falling back to the plain
static label.

## Default open/closed state

Every category/section banner in this engine starts **closed** by default
(2026-07-14 change) — there is currently no per-row way to override this to
start open; it's a global default, not yet config-driven. Three call sites
all pass a hardcoded `false` for `wrapCategoryHeader`'s `startOpen`
parameter: `renderKVObject`'s `sectionHeader` banners, `renderPropertyRow`'s
object-registry branch (a resolved object's own per-instance header — even
a lone/solo occurrence no longer auto-opens, unlike the pre-2026-07-14
behavior), and the `configOverride`-function branch (including
`drillAdvancement`'s own per-Advancement-set header, in its inline
`configOverride` function). Clicking a header still toggles it open/closed
exactly as before — only the *initial* render state changed.

## Dynamic labels

`itemLabel` (see the property-row table above) is the general mechanism for
a label computed from an occurrence's own data rather than static config
text. It's read in exactly one place, `_itemLabel(rowCfg, node, label)`,
and used uniformly wherever a resolved occurrence needs its own label —
`renderResolvedObject`'s `SPECIAL_OBJECT_FORMATTERS` branch, its
`OBJECT_CONFIGS`-registry branch, and the `configOverride`-function branch
all funnel through it. A dynamic `itemLabel` function receives the
**already-resolved object** (never the wrapper) as `node`.

**Escaping**: `label`/`itemLabel` values are treated as **trusted HTML**,
not raw text — both `renderSimpleRow` and `wrapCategoryHeader` insert them
unescaped (matching the convention already used for `keyExtra`/codeSpace
decoration). A static config string is author-controlled and safe as-is.
A dynamic `itemLabel` function that pulls text out of the XML instance
(e.g. a Parameter's own name) **must** `escHtml()` that text itself before
returning it — see the worked example below.

## codeSpace on a dynamic label

`parameterName` (and similar CodeType-like properties) can carry its own
`codeSpace`. `_codeSpaceKeyExtra(node)` is the shared helper (also used
internally by `renderSimplePropertyCell` for ordinary simple-property
codeSpace decoration) that produces the same key-column treatment anywhere:
a URL-like codeSpace becomes a small inline 🔗 link; a plain-text codeSpace
becomes a parenthetical. It always returns a string (`''` when there's no
codeSpace), so it's safe to concatenate unconditionally.

## Worked examples

All taken directly from `OBJECT_CONFIGS.Borehole` in the shipped file.

**Dynamic `itemLabel` on an ordinary object row** (no `alwaysGroup` needed —
an object-registry row already gets its own header regardless of count):

```js
{
  path: 'diggs:constructionMethod', multi: true,
  itemLabel: el => {
    const loc = FORMAT_FN.locationInline(evalXPath(el, 'diggs:location')[0]);
    return loc ? `Construction from ${loc}` : null;   // null -> falls back to auto-derived 'Construction Method'
  },
}
```

**Dynamic `itemLabel` + codeSpace + forced grouping on a
`SPECIAL_OBJECT_FORMATTERS` row** (Parameter renders as a flat row with no
header of its own, so `alwaysGroup` keeps the field's own identity visible):

```js
{
  path: 'diggs:otherSamplingFeatureProperty', multi: true,
  label: 'Other Property', labelPlural: 'Other Properties', alwaysGroup: true,
  categoryClass: 'kv-cat-accent',
  itemLabel: el => {
    const nameEl = evalXPath(el, 'diggs:parameterName')[0];
    const txt = nodeText(nameEl);
    return txt ? escHtml(txt) + _codeSpaceKeyExtra(nameEl) : null;
  },
}
```

**Per-row style override on a plain simple-property row**:

```js
{
  path: 'diggs:bearing',
  labelClass: 'kv-label-highlight', valueClass: 'kv-val-mono', attrClass: 'kv-attr-warn',
}
```

**`configOverride` as a function** (the one case that still needs it — a
wrapper whose own attribute, `setName`, would otherwise be lost):

```js
{
  path: 'diggs:drillAdvancement', multi: true, label: 'Drill Advancement Set',
  labelPlural: 'Drill Advancement Sets',
  configOverride: (setEl) => {
    const setName = setEl.getAttribute('setName') || '';
    const rows = evalXPath(setEl, 'diggs:Advancement');
    const nameRow = setName ? renderSimpleRow('Set Name', escHtml(setName)) : '';
    const rowsHtml = rows
      .map(advEl => wrapCategoryHeader('Advancement', renderKVObject(advEl, OBJECT_CONFIGS.Advancement), false))
      .join('');
    return nameRow + rowsHtml;
  },
}
```

**`borderTop`/`borderBottom`**:

```js
{ path: 'diggs:someField', borderTop: true }        // extra top border, e.g. to set this row apart
{ path: 'diggs:someOtherField', borderBottom: false } // suppress the default bottom border
```

## Not currently implemented

Mentioned during earlier design discussion but never wired into the real
engine — don't reach for this expecting an effect:

- Raw inline CSS strings for styling (an earlier `labelStyle`/`valueStyle`/
  `attrStyle` naming from the original design draft) — superseded by the
  real, shipped `labelClass`/`valueClass`/`attrClass`/`categoryClass`,
  which reference **class names** defined once in the stylesheet, not
  inline `style="..."` strings, per the project's own stated preference for
  theme-consistent, maintainable styling.
