# OBJECT_CONFIGS reference

Reference for the row-config schema that drives the KV-table rendering
engine in `diggs_file_inspector_v2.html` (the "2026-07-13 rebuild" — see
`KV formatting.md` for the original design discussion). This describes the
**actual current implementation**, verified directly against the engine
source (`renderKVObject`, `renderPropertyRow`, `renderResolvedObject`,
`wrapCategoryHeader`, `renderSimpleRow`, `renderSimplePropertyCell`), not
the original design draft — a few things sketched during design (`multi` as
originally conceived, raw-CSS-string styling) were changed or dropped
before landing; this file reflects what's real. Last verified 2026-07-14
against the shipped engine, after: generic array-property-type handling
(`resolveXlinkChildren`), dynamic `itemLabel`, `alwaysGroup`, the
`labelClass`/`valueClass`/`attrClass`/`categoryClass` style overrides,
`borderTop`/`borderBottom`, and the switch to closed-by-default section
headers.

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

### Attribute paths

`path` may target an XML attribute (e.g. `{ path: '@gml:id', label: 'ID' }`).
The engine only attempts object-resolution (`resolveXlinkChildren`, see
below) on `Element` nodes (`nodeType === 1`) — an attribute node is always
treated as simple/leaf, safely, regardless of what it's named.

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
`LinearExtent`, `PointLocation`, `BusinessAssociate`, `Parameter`) render as
one formatted line/link instead of a nested table — checked *before*
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
