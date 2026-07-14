---
name: diggs-schema-coverage
description: Audit a DIGGS XML instance/snippet in this repo against the DIGGS 3.1-dev schema (../diggs-schema) to find schema elements/attributes not yet instantiated, and/or author new content into the instance so every potentially-displayed element gets at least one example. Use whenever the user asks to check "full coverage" of a DIGGS type against the schema, wants a test/mockup XML file to exercise every field a given object (LithologySystem, Sample, etc.) can carry, or asks to verify an instance accounts for all optional and mandatory child elements — including phrasing like "does this instance use every element", "add the missing elements", or "make sure the renderer is exercised for X".
---

# DIGGS schema coverage audit + authoring

This project (`diggs_file_inspector.html`) needs test/mockup DIGGS XML instances
that exercise every schema field a given object type can carry, so the app's
renderers can be checked against real markup instead of guessed at. This skill
is the repeatable procedure for that: trace a type's full inheritance chain in
`../diggs-schema`, diff it against what an instance actually uses, and (when
asked) author schema-valid, domain-sensible values for the gaps.

Read `../diggs_file_inspector/CLAUDE.md` first if you haven't already this
session — the "DIGGS Schema Reference" section there covers schema location,
recency-checking, and the `xsi:schemaLocation` pitfall (an instance's own
`xsi:schemaLocation` may point at the stable 3.0.0 release, which predates
constructs this project actually targets on `3.1-dev` — always validate
against `../diggs-schema/Diggs.xsd`, not a URL in the instance).

## Why the reference file matters

The expensive part of this task isn't reasoning — it's re-deriving the same
handful of DIGGS abstract base types via repeated grep/Read cycles, because
almost every concrete DIGGS object type inherits from one of about a dozen
recurring abstract types (`AbstractFeatureType`, `AbstractObjectType`,
`AbstractComponentObjectBaseType`, `ComponentObjectNoDescriptionType`,
`AbstractObservationType`, `AbstractObservationSystemType`, etc.). Those
barely change release to release. `references/diggs-base-types.md` caches
their full element lists, in schema-declared order, with file:line pointers.

**Check that reference file before grepping the abstract types yourself.**
It will save the largest chunk of the work. It's a cache, not gospel — if a
line pointer looks stale (element not where expected), re-derive that one
type from the schema and correct the reference file (see "Keeping the
reference current" below).

## Procedure

### 1. Identify the target type and its full inheritance chain

Find the element/complexType in `../diggs-schema` (grep across `core/*.xsd`,
`extended/*.xsd`, `specialty/*.xsd` — the type may live outside `Core.xsd`).
Walk `extension base=`/`restriction base=` upward until you hit a type
already catalogued in `references/diggs-base-types.md`, then splice: full
field list = [that cached base] + [every intermediate type's own
`<sequence>` additions, in order] + [the target type's own additions].

**Order matters.** When you author XML later, elements must appear in the
combined sequence order (base type's fields first, then each derived type's
own new fields appended after) — not just the final type's own `<sequence>`,
and not alphabetically or by "logical" grouping.

### 2. Note `<choice>` groups explicitly

A `<choice>` is not a gap when one branch is unused — it's an alternative
representation. Track choices separately from plain optional elements:
- If every instance you're auditing uses the same branch, that's worth
  flagging (e.g. "`abundanceCode` vs `abundancePercent`: only `abundancePercent`
  is used anywhere") because when authoring, the right fix is a *new example*
  of the other branch, not adding fields to the branch already in use.
  Producing an instance of the unused branch elsewhere is the point (this
  exercises different renderer logic), not a compliance nit.
- Watch for `<choice minOccurs="0">` wrapping child elements that each
  *also* have `minOccurs="0"` — that's valid XSD for "this choice is
  entirely optional" and a fully-empty match is legal; don't mistake it for
  a required field.

### 3. Cross-check against the instance, scoped correctly

Read the actual line ranges of the object(s) being audited (there are often
several sibling instances of the target type in one file — check presence
**across all of them combined**, not per-instance, since the goal is whether
the file as a whole exercises every field). A tag counts as "instantiated"
even with an empty value (`<odor/>`) — the point is exercising the renderer's
presence-check, not the value itself.

For anything past ~3-4 nested object types deep (e.g. auditing a system
object whose observations wrap a primary object whose properties wrap yet
another sub-object), the mechanical trace-and-cross-check is worth
delegating to a background `general-purpose` agent — it's high-volume,
low-judgment file reading. Give it: the already-traced top of the chain (so
it doesn't redo that), the exact instance line ranges, and the list of
sub-types still to trace. **Then spot-verify a handful of its claims
yourself** against the live schema files before trusting them for authoring
— a wrong field name or wrong choice structure in a report is a minor
annoyance, but the same error baked into authored XML fails validation or
silently misrepresents the schema. In practice, checking 60-70% of the
claimed types directly is enough to catch systematic errors without redoing
the whole trace.

### 4. Separate reference-only elements from potentially-displayed ones

Elements whose entire content model is an `xlink:href` pointer to another
object (`xxxRef` properties, or a property type whose only child is another
feature reference) don't need exhaustive population — ask the user, but the
default assumption from prior sessions is: **skip populating pure reference
elements** unless asked, and focus effort on elements that carry actual
content the app might render.

### 5. Report format

A table per traced type: schema field list (name + cardinality), then
PRESENT (cite one instance line) or **MISSING**. End with a consolidated
missing-elements list grouped by type, and a short "pattern" note if one
exists (e.g. "domain-specific fields are exhaustively covered; only the
generic bookkeeping fields inherited from abstract base types are
consistently skipped on the lower-level nested objects"). Call out unused
`<choice>` branches in their own line, distinct from missing elements.

### 6. Authoring phase (when asked to fill gaps)

- **Distribute logically, don't force uniformity.** If a repeating type
  (e.g. a lithology system) has multiple sibling instances representing
  different domains (soil vs. rock), put domain-specific fields only where
  they make sense (rock properties in the rock instance, not the soil one).
  Not every instance needs every field — one worked example anywhere in the
  file is enough to exercise the renderer.
- **For an unused choice branch, add a new example of that branch** rather
  than editing an existing element that already uses the other branch.
- **Verify enum values and value patterns before writing them** — grep the
  schema's `simpleType` restriction/pattern for the exact field, don't
  pattern-match a plausible-sounding value from a similarly-named field
  elsewhere (see CLAUDE.md's "Recurring mistakes" list — enum values must be
  copied verbatim, `uom` isn't available on every measure-like type, etc.).
  This applies doubly to fields you're adding for the first time in a
  session, since there's no existing correct usage in the file to copy from.
- **Validate incrementally, not at the end.** After each meaningful chunk
  of edits: `xmllint --noout --schema ../diggs-schema/Diggs.xsd <file>.xml`.
  Sequence-order mistakes are cheap to fix one at a time and expensive to
  debug in a batch of 20 edits.
- **Match the file's existing conventions** for things the schema leaves
  open-ended: `codeSpace` URL patterns (e.g.
  `https://diggsml.org/def/codes/DIGGS/0.1/<dictionary>.xml#<term>` for
  controlled vocabularies, `https://acme-geotech.com` for informal
  identifiers), date values (`<field frame="#ISO-8601">2025-05-20</field>`),
  and `gml:id` naming (short, hyphenated, prefixed by object type). Grep a
  couple of existing examples of the same element before inventing a new
  format.

## Keeping the reference current

If `references/diggs-base-types.md` ever contradicts what you read directly
in `../diggs-schema` (renamed field, changed cardinality, a base type that no
longer exists), the live schema wins — update the reference file with a
dated note, the same way CLAUDE.md tracks corrections to its own claims.
Check `git -C ../diggs-schema log -1` against `origin/3.1-dev` if a
contradiction seems surprising; the local clone can lag or lead the remote
branch (see CLAUDE.md).
