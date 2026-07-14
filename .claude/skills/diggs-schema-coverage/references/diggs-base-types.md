# DIGGS 3.1-dev recurring base types

Cached 2026-07-12 against `../diggs-schema` at commit `39ef4ebf` (branch
`3.1-dev`, confirmed up to date with `origin/3.1-dev` at cache time — re-run
`git -C ../diggs-schema fetch && git -C ../diggs-schema log -1` if this feels
stale). File:line pointers below are to `../diggs-schema/<path>`.

Every concrete DIGGS object type extends one of these. When tracing a new
type's inheritance chain, stop climbing once you hit one of these and splice
in its field list rather than re-deriving it.

**How to read the field lists**: order is schema sequence order (the order
elements must appear in an instance). `?` = optional (0..1), `*` = repeatable
optional (0..unbounded), `+` = repeatable required (1..unbounded), no suffix
= required singleton. `[choice: A | B]` marks an XSD `<choice>` group —
review the "unused choice branch" guidance in SKILL.md before treating a
choice-alternative as a coverage gap.

---

## The "abstract root" layer

### AbstractDiggsType — `core/AbstractTypes.xsd:17`
Restriction of `gml:AbstractGMLType`. Just: `gml:id` (required attribute).
Nothing else. Every other type below ultimately derives from this — it's
where the universal `gml:id` requirement comes from.

---

## Feature-ish types (used for top-level, independently-identifiable things: systems, samples, specifications, business associates)

### AbstractFeatureBaseType — `core/AbstractTypes.xsd:299`
Restriction of `gml:AbstractFeatureType`. Extends AbstractDiggsType's `gml:id`.
- `gml:description`?
- `gml:identifier`?
- attr `gml:id` (required)

### AbstractFeatureType — `core/AbstractTypes.xsd:318`
Extends `AbstractFeatureBaseType`.
- (inherited: `gml:description`?, `gml:identifier`?)
- `gml:name`*
- `internalIdentifier`?  (type `gml:CodeWithAuthorityType`, required `codeSpace`)
- `status`?
- `implementationStatus`?
- `associatedFile`*  (type `AssociatedFilePropertyType`)
- `role`*  (type `RolePropertyType`)
- `remark`*  (type `RemarkPropertyType`)

This is the base for `LithologySystem` (via `AbstractObservationSystemType`),
`Specification`, `BusinessAssociate` (via a *restriction*, see below), most
top-level System/procedure objects.

### AbstractObservationSystemType — `core/AbstractTypes.xsd:709`
Extends `AbstractFeatureType`. Base for every `*System` object
(LithologySystem, ColorSystem, ConstituentSystem, OrientationSystem, etc.).
- (inherited: full AbstractFeatureType list above)
- `projectRef`+
- `programRef`?
- `[choice: samplingFeatureRef | sampleRef]`
- `observationProcedure`?  (type `SpecificationPropertyType`)

### AbstractProcedureType — `core/AbstractTypes.xsd:824`
Extends `AbstractFeatureType` with an **empty** `<sequence/>` — adds nothing
of its own. `SpecificationType` extends this directly, so `Specification`'s
full field list is just AbstractFeatureType's list + Specification's own
fields (don't go looking for AbstractProcedureType-specific fields, there
are none).

---

## Object-ish types (used for non-independently-identifiable supporting content: properties, descriptors, sub-observations)

### AbstractObjectBaseType — `core/AbstractTypes.xsd:30`
Extends `AbstractDiggsType`.
- `gml:description`?
- `gml:identifier`?
- attr `gml:id` (required, inherited)

### AbstractObjectType — `core/AbstractTypes.xsd:671`
Extends `AbstractObjectBaseType`. Base for most "component object" types
(ComponentLithology, Boundary, TimeInterval, SampleProduced, etc.).
- (inherited: `gml:description`?, `gml:identifier`?)
- `gml:name`*
- `status`?
- `remark`*  (type `RemarkPropertyType`)

### ObjectNoDescriptionType — `core/Common.xsd:128`
**Restriction** of `AbstractObjectType` — drops `gml:description` and
`gml:name` entirely, keeps only:
- `gml:identifier`?
- `status`?
- `remark`*

Used by `ParticleSizeType` and similar leaf value-objects where a name/
description would be noise.

### AbstractObjectNoDescriptionType — `core/AbstractTypes.xsd:43`
Extends `AbstractDiggsType` directly (not via AbstractObjectBaseType) —
similar end result to ObjectNoDescriptionType but reached differently. Base
for `AbstractObservationType`.
- `gml:identifier`?
- `status`?
- `remark`*

### AbstractObservationType — `core/AbstractTypes.xsd:737`
Extends `AbstractObjectNoDescriptionType`. Base for every `*Observation`
type (LithologyObservation, GeoUnitObservation, etc.).
- (inherited: `gml:identifier`?, `status`?, `remark`*)
- `measurementRef`*
- `location`?
- `trueTopObserved`?
- `trueBaseObserved`?
- attrs: `howDetermined` (`DescriptorMethodEnumType`), `stratumCode` (string)

### AbstractComponentObjectBaseType — `core/AbstractTypes.xsd:70`
Restriction of `gml:AbstractGMLType`. Base for small descriptive sub-objects
(Color, ColorComponents, LithProperties, ComponentProperties, Constituent,
ParticleSizeDistribution, PlacedObservation, Boundary — note Boundary uses
`AbstractObjectType` not this one, double-check per type).
- `gml:description`?
- `gml:identifier`?
- attr `gml:id` (optional — NOT required, unlike the feature-ish types)

### ComponentObjectNoDescriptionType — `core/Common.xsd:32`
**Restriction** of `AbstractComponentObjectType` (a type this file hasn't
needed to trace in full — restriction drops description/name). Base for
`LithologyType`, `ColorType`, `ComponentLithType`.
- `gml:identifier`?
- `status`?
- `remark`*
- attr `gml:id` (optional)

### AbstractNamedObjectType — `core/AbstractTypes.xsd:601`
Extends `AbstractObjectBaseType`. Base for `AssociatedFileType`,
`SoftwareApplicationType`, `BusinessAssociateBaseType` (via further
restriction).
- (inherited: `gml:description`?, `gml:identifier`?)
- `gml:name`+  (note: **required**, min 1 — not optional like AbstractObjectType's)
- `status`?
- `remark`*

---

## Common utility/property types (appear everywhere, worth knowing cold)

### RemarkType — `core/Common.xsd:2111`
- `content` (required string)
- `author`*  (`BusinessAssociatePropertyType`)
- `remarkDateTime`?  (`gml:TimePositionType`)

### RoleType — `core/Common.xsd:2225`
- `rolePerformed` (required, `gml:CodeType`)
- `timePerformed`?  (`TimeIntervalPropertyType`)
- `remark`*
- `businessAssociate`+

### BusinessAssociateBaseType — `core/Common.xsd:1057`
Restriction of `AbstractNamedFeatureType` (not traced separately — same
shape as AbstractFeatureType minus internalIdentifier/implementationStatus/role):
- `gml:description`?, `gml:identifier`?, `gml:name`+, `internalIdentifier`?,
  `status`?, `associatedFile`*, `remark`*

### BusinessAssociateType — `core/Common.xsd:1090`
Extends `BusinessAssociateBaseType`, adds:
- `title`?  (`gml:CodeType`)
- `address`*  (`AddressPropertyType`)
- `emailAddress`*  (`EmailType` — pattern-constrained, see below)
- `phoneNumber`*  (`PhoneType` — pattern-constrained, see below)
- `associatedWith`*  (`BusinessAssociatePropertyType` — can be `xlink:href`-only)

### AssociatedFileType — `core/Common.xsd:922`
Extends `AbstractNamedObjectType`, adds:
- `contact`*  (`BusinessAssociatePropertyType`, can be `xlink:href`-only)
- `fileURL` (required, `anyURI`)
- `fileType`?, `creatingApplication`? (`SoftwareApplicationPropertyType`),
  `documentType`?, `fileDate`? (`gml:TimePositionType`), `fileStructure`?
  (ref `diggs:fileStructure`, `gml:CodeType`), `mimeType`?
  (`MimeTypeEnumExtType`), `compression`? (`anyURI`), `encryption`? (`anyURI`)

### ParameterType — `core/Common.xsd:1721`
Extends `AbstractComponentObjectBaseType`, adds:
- `parameterName` (required, `gml:CodeType`)
- `parameterMinValue`?, `parameterValue`?, `parameterMaxValue`? (all plain string)
- `parameterUnits`?  (`diggs:AllUnits`)
- attr `index`?  (positiveInteger)

### AddressType — `core/Common.xsd:865`
Extends `AbstractObjectBaseType` (so `gml:id` required). Field order matters —
**`country` comes before `postalCode`**, easy to get backwards:
`number`?, `streetAddress`*, `city`?, `state`?, `province`?, `county`?,
`country`?, `postalCode`?

### Email / Phone value patterns — `core/Common.xsd:1248`, `:1771`
- Email: `([A-z0-9_\.\-\+])+@(([A-z0-9_\-]{2,})\.)+[A-z0-9_\-]{2,}` — a normal
  address like `jane.smith@acme-geotech.com` matches fine.
- Phone: `(\+[0-9]( )?)?([0-9]( |-|\.|)){6,14}[0-9]|...` — a plain
  `303-555-0142` style string matches the first alternative; don't use the
  parenthesized-areacode alternative, its pattern has a trailing-space typo
  in the schema (`...[0-9]{4} "` — note the space before the closing quote)
  that makes `(303) 555-0142` without a trailing space technically fail.
- Both types carry a `type` attribute from an extensible enum
  (`personal`/`business` for email; `voice`/`fax`/etc. for phone) via a
  `union` with `OtherNameType`, so free-text values are also legal if the
  standard enum doesn't fit.

### TimeIntervalType / TimeIntervalPropertyType — `core/Common.xsd:2467`, `:832`
Property type wraps one `TimeInterval` element (requires `gml:id`):
- `start` (required, `gml:TimePositionType`)
- `end`?, `duration`?  (`diggs:TimeMeasureType`)

### Date/time value convention observed in this repo's instances
`gml:TimePositionType` values in `inspectorMockup.xml` consistently use
`frame="#ISO-8601"` with a plain date string, e.g.
`<fileDate frame="#ISO-8601">2025-05-20</fileDate>`. An `indeterminatePosition="unknown"`
attribute also appears on some pre-existing `remarkDateTime`/`fileDate`
elements elsewhere in that file, but it's semantically for a genuinely
unknown/approximate date — don't add it when authoring a new, specific date.

---

## Things this file does NOT cover

Domain-specific leaf types (LithProperties, ComponentProperties, Constituent,
Color, ColorComponents, ParticleSizeDistribution/ParticleSize, Boundary,
PlacedObservation, ComponentLithology/ComponentLith, and anything under
`extended/`/`specialty/`) are not cached here — they're specific to whatever
object you're auditing and change too much between audits to be worth
pre-deriving. Trace those fresh each time per SKILL.md's procedure, and
consider adding a genuinely stable, high-reuse one here afterward if it turns
out to recur (e.g. if the next few audits all touch `LithProperties` again,
that'd be worth caching).
