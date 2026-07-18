# DIGGS Schema — Date/Time-Bearing Elements

A reference table of every XML element in the DIGGS 3.1-dev schema (`../diggs-schema`,
`origin/3.1-dev`) whose type ultimately carries a calendar date and/or clock time value
(`date`, `time`, `dateTime`, `gYear`, `gYearMonth`, etc.) — either directly, or through a
chain of named simple/complex types and `*PropertyType` wrappers.

Generated 2026-07-17 by walking every `.xsd` file actually loaded by `Diggs.xsd`
(`include`/`import`, transitively) with a small Python script over
`xml.etree.ElementTree` — not by hand, so it should be complete and reproducible against
future schema edits. See "Methodology" below if you need to regenerate it.

## How to read the table

- **Element Name** — the XML tag as it appears in an instance document. Lowercase-first
  (`camelCase`) names are ordinary *property* elements (e.g. `whenConstructed`,
  `dateTime`). Capitalized names (e.g. `Remark`, `AssociatedFile`, `TimeInterval`) are the
  DIGGS *object* elements referenced by a `PropertyType` wrapper's own internal `ref=`
  — i.e. the row `Remark | diggs:RemarkType | diggs:RemarkPropertyType` just documents
  that `RemarkPropertyType` (used everywhere as the type of a `remark` property) wraps a
  `Remark` object, which is itself the next row down (`remarkDateTime | ... |
  diggs:RemarkType`).
- **Type Name** — the element's effective schema type: its own `type=` attribute, or (for
  an element declared with `ref=`) the type of the global element it points to.
- **Parent Object** — the complex type whose content model directly declares that
  element. Many parents here are *abstract* base types (`AbstractObjectType`,
  `AbstractFeatureType`, ...); every concrete type that extends one inherits the property
  rather than redeclaring it, so (for example) `remark`/`AbstractObjectType` covers nearly
  every DIGGS object rather than needing a separate row per concrete subtype.

167 rows, 126 distinct parent objects, 98 distinct element names.

## Methodology

1. **Built-in leaves**: `date`, `time`, `dateTime`, `gYear`, `gYearMonth` (plus
   `gMonth`/`gMonthDay`/`gDay`, unused in practice) — the members reachable through
   `gml:CalDate` → `gml:TimePositionUnion`.
2. **Value-chain types** (a type whose own simple content ultimately *is* one of the
   built-ins, via `restriction`/`extension`/`list`/`union`): `gml:CalDate`,
   `gml:TimePositionUnion`, `gml:TimePositionType`, `diggs:TimeListSimpleType`.
3. **Container types** — any complex type with at least one *direct* child element typed
   from step 2 (the worked example being `diggs:TimeIntervalType`, whose `start`/`end`
   children are `gml:TimePositionType`). Found by scanning every named complex type's own
   content model for a step‑2 match.
4. **PropertyType wrappers** — any `*PropertyType` complex type whose direct child element
   (its internal `ref=`) is one of the objects from step 3 (e.g.
   `diggs:TimeIntervalPropertyType` wraps `diggs:TimeInterval`).
5. **Final sweep** — every complex type in the schema (not just the ones found above) was
   scanned once more for any child element whose effective type matches *any* type name
   collected in steps 1–4. That sweep is what surfaces things like `remark` on
   `AbstractObjectType`, `linkedReading` on `WaterStrikeReadingType`, or
   `groutTemperature` on `GroutStageType` — a step‑3/4 type showing up as an ordinary
   property of some unrelated object type.

Step 5 is a **single sweep, not a fixed-point closure**: an early draft of this table
iterated the container/wrapper detection to convergence, which cascades through
near-universal wrappers like `RemarkPropertyType` and `AssociatedFilePropertyType` and
ends up flagging most of the schema (any object with a `remark` property becomes
"date/time-bearing" once `RemarkType.remarkDateTime` is in the family, then *its own*
`*PropertyType` wrapper is "found" too, etc.). The two-hop procedure above (illustrated by
`TimeIntervalType` in the task this table was built for) is what's actually useful, so
that's what's implemented.

### Deliberately excluded

- **`diggs:TimeIntervalListType` / `timeIntervalList` / `TimeIntervalListSimpleType`** —
  despite the name, this holds a `list itemType="decimal"` (elapsed-time counts in a
  declared `unit`), not calendar dates or clock times, so it doesn't belong in *this*
  table. It's a genuine elapsed-time/duration list though — see the "Elapsed-Time /
  Duration Elements" table below, where it is included. Its sibling
  `diggs:TimePositionListType` / `timePositionList` stays in *this* table (a genuine
  `gml:TimePositionUnion` list of calendar dates/clock times).
- **`duration` (`diggs:TimeMeasureType`)** — `TimeIntervalType.duration` and every other
  `*TimeMeasureType` field (`elapsedTime`, `timeTaken`, `totalElapsedTime`, ...) is a
  numeric quantity with a time-unit UOM (seconds, hours, days...), not a date/time
  *position*, so it's excluded from *this* table — see the separate "Elapsed-Time /
  Duration Elements" table below, which covers `diggs:TimeMeasureType` and everything that
  uses it. The `*PerTime*`/`TimePer*`/`ReciprocalTime*`/`SquareRootTime*` rate types in
  `MeasureTypes.xsd` (velocity, flow rate, frequency...) are excluded from *both* tables —
  time is only a unit divisor there, not an elapsed span in its own right. (Several
  `*TimeSeriesType` types in `Grouting.xsd`/`CoreProcedures.xsd`/`ExtProcedures.xsd`, e.g.
  `GroutingTimeSeriesType`, have *both* a genuine `initiationTime`/`endTime` pair — in this
  table — *and* a `totalElapsedTime` duration — in the other one.)
- **`gml:TimePeriodType`/`TimePeriodPropertyType`, `gml:TemporalDatumType`/
  `TemporalDatumPropertyType`, `gml:TemporalCRSType`, `gml:AbstractDatumType`** — all
  defined in the imported `core/gml3.2Profile_diggs.xsd` GML profile, but never referenced
  by any `diggs:`-namespace type (confirmed by grep across every schema file `Diggs.xsd`
  actually loads). Unreachable from a real DIGGS instance; DIGGS uses its own
  `diggs:TimeIntervalType` instead of `gml:TimePeriod`.
- **`diggs:MultiTimeInstantType` / `MultiTimeInstant` / `timeMember`** — included in the
  table (row: `timeMember | diggs:TimeArrayPropertyType | diggs:MultiTimeInstantType`) but
  flagged **deprecated** — the schema's own annotation says "Use TimePositionInstance
  instead for time instances expressed in xsd:CalDate format."
- **`diggs:TimeDomainType` / `timeDomain`** — a genuine borderline case, *not* included as
  a row. `timeDomain` (used directly in `MWDResultType`, `MonitorResultType`, and
  `TemporalResultType`) wraps the abstract `diggs:AbstractTimeObject`, substitutable by
  `TimePositionList` (real date/time), `TimeIntervalList` (decimal, not date/time), or the
  deprecated `MultiTimeInstant` (date/time). Since the schema's static type declaration
  doesn't commit to any one of those, whether a given `timeDomain` instance carries actual
  date/time values can only be determined by looking at the instance document, not the
  type declaration alone — so it falls outside the (type-name-based) mechanical procedure
  above. Worth knowing about if you're working on `MonitorResultType` or
  `TemporalResultType` display logic.

## Table

| Element Name | Type Name | Parent Object |
|---|---|---|
| remark | diggs:RemarkPropertyType | diggs:AbstractComponentObjectNoDescriptionType |
| remark | diggs:RemarkPropertyType | diggs:AbstractComponentObjectType |
| activityDateTime | diggs:TimeIntervalPropertyType | diggs:AbstractConstructionActivityType |
| constructionEnvironment | diggs:EnvironmentPropertyType | diggs:AbstractConstructionActivityType |
| calibrationAuditTrail | diggs:CalibrationPropertyType | diggs:AbstractEquipmentType |
| time | diggs:TimeIntervalPropertyType | diggs:AbstractEventType |
| associatedFile | diggs:AssociatedFilePropertyType | diggs:AbstractFeatureType |
| remark | diggs:RemarkPropertyType | diggs:AbstractFeatureType |
| specimen | diggs:SpecimenPropertyType | diggs:AbstractLaboratoryTestProcedureType |
| specimen | diggs:SpecimenPropertyType | diggs:AbstractMaterialTestlProcedureType |
| associatedFile | diggs:AssociatedFilePropertyType | diggs:AbstractNamedFeatureType |
| remark | diggs:RemarkPropertyType | diggs:AbstractNamedFeatureType |
| remark | diggs:RemarkPropertyType | diggs:AbstractNamedObjectType |
| remark | diggs:RemarkPropertyType | diggs:AbstractNamedRoleObjectType |
| remark | diggs:RemarkPropertyType | diggs:AbstractObjectNoDescriptionType |
| remark | diggs:RemarkPropertyType | diggs:AbstractObjectType |
| whenInstalled | diggs:TimeIntervalPropertyType | diggs:AbstractPileType |
| contract | diggs:ContractPropertyType | diggs:AbstractProjectType |
| projectDateTimeSpan | diggs:TimeIntervalPropertyType | diggs:AbstractProjectType |
| samplingDate | diggs:TimeIntervalPropertyType | diggs:AbstractSamplingActivityType |
| samplingEnvironment | diggs:EnvironmentPropertyType | diggs:AbstractSamplingActivityType |
| environment | diggs:EnvironmentPropertyType | diggs:AbstractSamplingFeatureType |
| dateInstalled | diggs:TimeIntervalPropertyType | diggs:AbstractSensorType |
| extractionTime | gml:TimePositionType | diggs:AbstractSpecimenType |
| testingEnvironment | diggs:EnvironmentPropertyType | diggs:AbstractTestProcedureType |
| remark | diggs:RemarkPropertyType | diggs:AbstractTimeObjectType |
| time | diggs:TimeIntervalPropertyType | diggs:AdditionEventType |
| time | diggs:TimeIntervalPropertyType | diggs:AdvancementType |
| AssociatedFile | diggs:AssociatedFileType | diggs:AssociatedFilePropertyType |
| fileDate | gml:TimePositionType | diggs:AssociatedFileType |
| whenEmplaced | diggs:TimeIntervalPropertyType | diggs:BackfillLayerType |
| backfillDateTime | diggs:TimeIntervalPropertyType | diggs:BackfillType |
| methodTime | diggs:TimeIntervalPropertyType | diggs:BoreholeConstructionMethodType |
| whenConstructed | diggs:TimeIntervalPropertyType | diggs:BoreholeType |
| whenDestroyed | diggs:TimeIntervalPropertyType | diggs:BoreholeType |
| associatedFile | diggs:AssociatedFilePropertyType | diggs:BusinessAssociateBaseType |
| remark | diggs:RemarkPropertyType | diggs:BusinessAssociateBaseType |
| Calibration | diggs:CalibrationType | diggs:CalibrationPropertyType |
| date | gml:TimePositionType | diggs:CalibrationType |
| advancementTime | diggs:TimeIntervalPropertyType | diggs:CasingAdvancementType |
| timeCasingInstalled | diggs:TimeIntervalType | diggs:CasingType |
| timeCasingRemoved | diggs:TimeIntervalType | diggs:CasingType |
| ChainOfCustodyEvent | diggs:ChainOfCustodyEventType | diggs:ChainOfCustodyEventPropertyType |
| dateCompleted | gml:TimePositionType | diggs:ChainOfCustodyEventType |
| dateInitiated | gml:TimePositionType | diggs:ChainOfCustodyEventType |
| remark | diggs:RemarkPropertyType | diggs:ComponentObjectNoDescriptionType |
| remark | diggs:RemarkPropertyType | diggs:ComponentPropertiesType |
| remark | diggs:RemarkPropertyType | diggs:ConfigurationType |
| timeInterval | diggs:TimeIntervalPropertyType | diggs:ConsolidationTestTrialType |
| remark | diggs:RemarkPropertyType | diggs:ConstituentType |
| endTime | gml:TimeInstantPropertyType | diggs:ContinuousGroutingType |
| groutingTimeSeries | diggs:GroutingTimeSeriesPropertyType | diggs:ContinuousGroutingType |
| startTimeGrouting | gml:TimeInstantPropertyType | diggs:ContinuousGroutingType |
| Contract | diggs:ContractType | diggs:ContractPropertyType |
| contractDate | gml:TimePositionType | diggs:ContractType |
| revisionDate | gml:TimePositionType | diggs:ContractType |
| files | diggs:FilesArrayPropertyType | diggs:DataPackageType |
| timeOfDelay | diggs:TimeIntervalPropertyType | diggs:DelayEventType |
| documentInformation | diggs:DocumentInformationPropertyType | diggs:DiggsType |
| timeInterval | diggs:TimeIntervalPropertyType | diggs:DirectShearConsolidationTrialType |
| DocumentInformation | diggs:DocumentInformationType | diggs:DocumentInformationPropertyType |
| auditTrail | diggs:RemarkPropertyType | diggs:DocumentInformationType |
| creationDate | gml:TimePositionType | diggs:DocumentInformationType |
| effectiveDate | gml:TimePositionType | diggs:DocumentInformationType |
| expirationDate | gml:TimePositionType | diggs:DocumentInformationType |
| remark | diggs:RemarkPropertyType | diggs:DriveSetType |
| Environment | diggs:EnvironmentType | diggs:EnvironmentPropertyType |
| dateTime | gml:TimePositionType | diggs:EnvironmentType |
| GP_FieldDataFile | diggs:AssociatedFileType | diggs:FilesArrayPropertyType |
| leachatePreparationDateTime | gml:TimePositionType | diggs:FluidSpecimenType |
| whenSurveyed | diggs:TimeIntervalPropertyType | diggs:GP_ArealSurveyType |
| whenTracklineOccupied | diggs:TimeIntervalPropertyType | diggs:GP_TracklineType |
| resultTime | diggs:TimeIntervalOrInstantPropertyType | diggs:GeophysicalFieldSurveyType |
| samplingTime | diggs:TimeIntervalOrInstantPropertyType | diggs:GeophysicalFieldSurveyType |
| validTime | diggs:TimeIntervalOrInstantPropertyType | diggs:GeophysicalFieldSurveyType |
| dateTime | diggs:TimeIntervalPropertyType | diggs:GroutSpecimenConditionsType |
| temperature | diggs:TemperatureMeasurementPropertyType | diggs:GroutSpecimenConditionsType |
| endTime | gml:TimeInstantPropertyType | diggs:GroutStageType |
| groutTemperature | diggs:TemperatureMeasurementPropertyType | diggs:GroutStageType |
| injectionTimeSeries | diggs:InjectionTimeSeriesPropertyType | diggs:GroutStageType |
| startTimeFilling | gml:TimeInstantPropertyType | diggs:GroutStageType |
| startTimePressurizing | gml:TimeInstantPropertyType | diggs:GroutStageType |
| whenConstructed | diggs:TimeIntervalPropertyType | diggs:GroutTrenchCutoffWallType |
| GroutingTimeSeries | diggs:GroutingTimeSeriesType | diggs:GroutingTimeSeriesPropertyType |
| endTime | gml:TimePositionType | diggs:GroutingTimeSeriesType |
| initiationTime | gml:TimePositionType | diggs:GroutingTimeSeriesType |
| sedimentationData | diggs:SedimentationPropertyType | diggs:HydrometerType |
| soakingPeriod | diggs:TimeIntervalPropertyType | diggs:HydrometerType |
| InjectionTimeSeries | diggs:InjectionTimeSeriesType | diggs:InjectionTimeSeriesPropertyType |
| endTime | gml:TimePositionType | diggs:InjectionTimeSeriesType |
| initiationTime | gml:TimePositionType | diggs:InjectionTimeSeriesType |
| timeInterval | diggs:TimeIntervalPropertyType | diggs:LabPermeationTrialType |
| remark | diggs:RemarkPropertyType | diggs:LaboratoryTestEventType |
| time | diggs:TimeIntervalPropertyType | diggs:LaboratoryTestEventType |
| LinkedWSReading | diggs:LinkedWSReadingType | diggs:LinkedWSReadingPropertyType |
| dateTime | gml:TimePositionType | diggs:LinkedWSReadingType |
| remark | diggs:RemarkPropertyType | diggs:LithPropertiesType |
| whenConstructed | diggs:TimeIntervalPropertyType | diggs:LoadTransferPlatformType |
| resultTime | diggs:TimeIntervalOrInstantPropertyType | diggs:MaterialTestType |
| samplingTime | diggs:TimeIntervalOrInstantPropertyType | diggs:MaterialTestType |
| validTime | diggs:TimeIntervalOrInstantPropertyType | diggs:MaterialTestType |
| dateControlPolishedStone | gml:TimePositionType | diggs:MicroDevalTestType |
| samplingTime | diggs:TimeIntervalOrInstantPropertyType | diggs:MonitorType |
| timeMember | diggs:TimeArrayPropertyType | diggs:MultiTimeInstantType *(deprecated)* |
| remark | diggs:RemarkPropertyType | diggs:ObjectNoDescriptionType |
| PDARecord | diggs:PDARecordType | diggs:PDARecordPropertyType |
| endTime | gml:TimePositionType | diggs:PDARecordType |
| initiationTime | gml:TimePositionType | diggs:PDARecordType |
| pdaRecord | diggs:PDARecordPropertyType | diggs:PileDrivingActivityType |
| pileDrivingRecord | diggs:PileDrivingRecordPropertyType | diggs:PileDrivingActivityType |
| PileDrivingRecord | diggs:PileDrivingRecordType | diggs:PileDrivingRecordPropertyType |
| endTime | gml:TimePositionType | diggs:PileDrivingRecordType |
| initiationTime | gml:TimePositionType | diggs:PileDrivingRecordType |
| testingProgress | diggs:ProgressEventArrayPropertyType | diggs:PlannedTestType |
| remark | diggs:RemarkPropertyType | diggs:PlatformType |
| associatedFile | diggs:AssociatedFilePropertyType | diggs:ProcessingStepType |
| remark | diggs:RemarkPropertyType | diggs:ProcessingStepType |
| timePerformed | diggs:TimeIntervalType | diggs:ProcessingStepType |
| ProgressEvent | diggs:ProgressEventType | diggs:ProgressEventArrayPropertyType |
| timeStamp | gml:TimePositionType | diggs:ProgressEventType |
| methodTime | diggs:TimeIntervalPropertyType | diggs:RIConstructionMethodType |
| whenConstructed | diggs:TimeIntervalPropertyType | diggs:RIFoundationSystemType |
| remark | diggs:RemarkPropertyType | diggs:ReceiverInfoType |
| time | diggs:TimeIntervalPropertyType | diggs:ReferencePointType |
| Remark | diggs:RemarkType | diggs:RemarkPropertyType |
| remarkDateTime | gml:TimePositionType | diggs:RemarkType |
| whenConstructed | diggs:TimeIntervalPropertyType | diggs:RigidInclusionType |
| remark | diggs:RemarkPropertyType | diggs:RoleType |
| timePerformed | diggs:TimeIntervalPropertyType | diggs:RoleType |
| remark | diggs:RemarkPropertyType | diggs:SampleDimensionsType |
| sampleTime | diggs:TimeIntervalPropertyType | diggs:SampleProducedType |
| chainOfCustodyEvent | diggs:ChainOfCustodyEventPropertyType | diggs:SampleType |
| Sedimentation | diggs:SedimentationType | diggs:SedimentationPropertyType |
| clockTime | gml:TimePositionType | diggs:SedimentationType |
| methodTime | diggs:TimeIntervalPropertyType | diggs:SoundingConstructionMethodType |
| whenConstructed | diggs:TimeIntervalPropertyType | diggs:SoundingType |
| remark | diggs:RemarkPropertyType | diggs:SourceInfoType |
| dateTime | diggs:TimeIntervalPropertyType | diggs:SpecimenConditionsType |
| temperature | diggs:TemperatureMeasurementPropertyType | diggs:SpecimenConditionsType |
| AbstractSpecimen | diggs:AbstractSpecimenType | diggs:SpecimenPropertyType |
| whenOccupied | diggs:TimeIntervalPropertyType | diggs:StationType |
| timeInterval | diggs:TimeIntervalPropertyType | diggs:SwellTestConsolidationStageType |
| TemperatureMeasurement | diggs:TemperatureMeasurementType | diggs:TemperatureMeasurementPropertyType |
| dateTime | gml:TimePositionType | diggs:TemperatureMeasurementType |
| resultTime | diggs:TimeIntervalOrInstantPropertyType | diggs:TestType |
| samplingTime | diggs:TimeIntervalOrInstantPropertyType | diggs:TestType |
| validTime | diggs:TimeIntervalOrInstantPropertyType | diggs:TestType |
| plannedCompletionDate | gml:TimeInstantPropertyType | diggs:TestingScheduleType |
| scheduleProgress | diggs:ProgressEventArrayPropertyType | diggs:TestingScheduleType |
| TimeInstant | gml:TimeInstantType | diggs:TimeArrayPropertyType |
| TimeInstant | gml:TimeInstantType | diggs:TimeIntervalOrInstantPropertyType |
| TimeInterval | diggs:TimeIntervalType | diggs:TimeIntervalOrInstantPropertyType |
| TimeInterval | diggs:TimeIntervalType | diggs:TimeIntervalPropertyType |
| end | gml:TimePositionType | diggs:TimeIntervalType |
| start | gml:TimePositionType | diggs:TimeIntervalType |
| timePositionList | diggs:TimeListSimpleType | diggs:TimePositionListType |
| whenTransectRun | diggs:TimeIntervalPropertyType | diggs:TransectType |
| methodTime | diggs:TimeIntervalPropertyType | diggs:TrenchConstructionMethodType |
| whenConstructed | diggs:TimeIntervalPropertyType | diggs:TrenchWallType |
| whenConstructed | diggs:TimeIntervalPropertyType | diggs:TrialPitType |
| WaterStrikeReading | diggs:WaterStrikeReadingType | diggs:WaterStrikeReadingPropertyType |
| dateTime | gml:TimePositionType | diggs:WaterStrikeReadingType |
| linkedReading | diggs:LinkedWSReadingPropertyType | diggs:WaterStrikeReadingType |
| waterStrikeReadings | diggs:WaterStrikeReadingPropertyType | diggs:WaterStrikeType |
| initialDevelopmentTime | diggs:TimeIntervalPropertyType | diggs:WellType |
| TimeInstant | gml:TimeInstantType | gml:TimeInstantPropertyType |
| timePosition | gml:TimePositionType | gml:TimeInstantType |

## Elapsed-Time / Duration Elements

The table above covers *calendar date / clock time position* — "when" something
happened. This second table covers the distinct concept of *elapsed time* — "how long"
something took — seeded from `diggs:TimeMeasureType` (a plain numeric value with a
time-unit `uom`: seconds, minutes, hours, days, ...; the schema's own annotation calls it
"Time or duration: Interval between events. One of the seven SI base quantities") and
`diggs:TimeIntervalListSimpleType` (`list itemType="decimal"`, the elapsed-time
counterpart of `TimePositionList`'s date/time list). Same two-hop procedure as the main
table (container types with a direct `TimeMeasureType`/`TimeIntervalListSimpleType`
child, then `*PropertyType` wrappers of those, then one final unrestricted sweep).

**Rows already shown in the table above are not repeated here.** A handful of types
(`diggs:TimeIntervalType` itself, and everything typed `diggs:TimeIntervalPropertyType`/
`diggs:TimeIntervalOrInstantPropertyType` — `whenConstructed`, `samplingTime`,
`resultTime`, `dateInstalled`, `methodTime`, and so on) qualify for *both* tables, because
`TimeIntervalType` carries an optional `start`/`end` pair (date/time) *and* an optional
`duration` (elapsed time) side by side. Rather than duplicate all ~70 of those rows here,
see the `duration | diggs:TimeMeasureType | diggs:TimeIntervalType` row below — any
element in the first table whose type is `TimeIntervalType`/`TimeIntervalPropertyType`/
`TimeIntervalOrInstantPropertyType` may carry that same optional `duration` value too.

**Explicitly excluded**: the `*PerTime*`/`TimePer*`/`ReciprocalTime*`/`SquareRootTime*`
compound measure types in `MeasureTypes.xsd` (`LengthPerTimeMeasureType`,
`PressurePerTimeMeasureType`, `VolumePerTimeMeasureType`, `ReciprocalTimeMeasureType`,
...) — these are *rates* (velocity, flow rate, frequency), where time is only a unit
divisor for a different physical quantity, not an elapsed span being reported in its own
right.

86 rows (new relative to the table above), 68 distinct parent objects.

| Element Name | Type Name | Parent Object |
|---|---|---|
| mixingTime | diggs:TimeMeasureType | diggs:AbstractSamplingActivityType |
| elapsedTime | diggs:TimeMeasureType | diggs:AdvancementType |
| BackPressureIncrement | diggs:BackPressureIncrementType | diggs:BackPressureIncrementPropertyType |
| elapsedTime | diggs:TimeMeasureType | diggs:BackPressureIncrementType |
| chiseling | diggs:ChiselingPropertyType | diggs:BoreholeType |
| drillAdvancement | diggs:DrillAdvancementArrayPropertyType | diggs:BoreholeType |
| elapsedTime | diggs:TimeMeasureType | diggs:CTConsoiidationIncrementType |
| CTConsolidationIncrement | diggs:CTConsoiidationIncrementType | diggs:CTConsolidationIncrementPropertyType |
| Chiseling | diggs:ChiselingType | diggs:ChiselingPropertyType |
| timeTaken | diggs:TimeMeasureType | diggs:ChiselingType |
| CompressionIncrement | diggs:CompressionIncrementType | diggs:CompressionIncrementPropertyType |
| elapsedTime | diggs:TimeMeasureType | diggs:CompressionIncrementType |
| ConsolidationIncrement | diggs:ConsolidationIncrementType | diggs:ConsolidationIncrementPropertyType |
| elapsedTime | diggs:TimeMeasureType | diggs:ConsolidationIncrementType |
| consolidationIncrement | diggs:CTConsolidationIncrementPropertyType | diggs:ConsolidationTestTrialType |
| elapsedTime | diggs:TimeMeasureType | diggs:DSConConsoiidationIncrementType |
| DsConConsolidationIncrement | diggs:DSConConsoiidationIncrementType | diggs:DSConConsolidationIncrementPropertyType |
| SwellOrCollapseMeasurement | diggs:SwellOrCollapseMeasurementType | diggs:DeformationMeasurementsArrayPropertyType |
| DelayEvent | diggs:DelayEventType | diggs:DelayEventPropertyType |
| delayDuration | diggs:TimeMeasureType | diggs:DelayEventType |
| gelTimeDesign | diggs:TimeMeasureType | diggs:DesignGroutMixType |
| marshFunnelTimeDesign | diggs:TimeMeasureType | diggs:DesignGroutMixType |
| samplingActivity | diggs:SamplingActivityPropertyType | diggs:DiggsType |
| consolidationIncrement | diggs:DSConConsolidationIncrementPropertyType | diggs:DirectShearConsolidationTrialType |
| DirectShearTestIncrement | diggs:DirectShearTestIncrementType | diggs:DirectShearTestIncrementPropertyType |
| elapsedTime | diggs:TimeMeasureType | diggs:DirectShearTestIncrementType |
| shearingIncrementPeakStressStage | diggs:DirectShearTestIncrementPropertyType | diggs:DirectShearTestType |
| shearingIncrementResidualStressStage | diggs:DirectShearTestIncrementPropertyType | diggs:DirectShearTestType |
| Advancement | diggs:AdvancementType | diggs:DrillAdvancementArrayPropertyType |
| delay | diggs:DelayEventPropertyType | diggs:DriveSetType |
| FlowReading | diggs:FlowReadingType | diggs:FlowReadingPropertyType |
| time | diggs:TimeMeasureType | diggs:FlowReadingType |
| GroutSpecimen | diggs:GroutSpecimenType | diggs:GroutSpecimenPropertyType |
| curingTime | diggs:TimeMeasureType | diggs:GroutSpecimenType |
| DesignGroutMix | diggs:DesignGroutMixType | diggs:GroutingProgramDesignPropertyType |
| design | diggs:GroutingProgramDesignPropertyType | diggs:GroutingProgramType |
| totalElapsedTime | diggs:TimeMeasureType | diggs:GroutingTimeSeriesType |
| HeatingCycleParameters | diggs:HeatingCycleParametersType | diggs:HeatingCycleParametersPropertyType |
| heatingDuration | diggs:TimeMeasureType | diggs:HeatingCycleParametersType |
| Hydrometer | diggs:HydrometerType | diggs:HydrometerPropertyType |
| dispersionDuration | diggs:TimeMeasureType | diggs:HydrometerType |
| totalElapsedTime | diggs:TimeMeasureType | diggs:InjectionTimeSeriesType |
| intactVaneTest | diggs:VaneTestPropertyType | diggs:InsituVaneTestType |
| remoldedVaneTest | diggs:VaneTestPropertyType | diggs:InsituVaneTestType |
| intactVaneTest | diggs:VaneTestPropertyType | diggs:LabVaneTestType |
| remoldedVaneTest | diggs:VaneTestPropertyType | diggs:LabVaneTestType |
| elapsedTime | diggs:TimeMeasureType | diggs:LinkedWSReadingType |
| dryingTime | diggs:TimeMeasureType | diggs:LossOnIgnitionTestType |
| ignitionTime | diggs:TimeMeasureType | diggs:LossOnIgnitionTestType |
| LugeonStep | diggs:LugeonStepType | diggs:LugeonStepPropertyType |
| totalElapsedTime | diggs:TimeMeasureType | diggs:LugeonStepType |
| lugeonStep | diggs:LugeonStepPropertyType | diggs:LugeonTestType |
| totalElapsedTime | diggs:TimeMeasureType | diggs:PDARecordType |
| hydrometer | diggs:HydrometerPropertyType | diggs:ParticleSizeTestType |
| totalElapsedTime | diggs:TimeMeasureType | diggs:PileDrivingRecordType |
| groutDesign | diggs:GroutingProgramDesignPropertyType | diggs:RISystemDesignType |
| AbstractSamplingActivity | diggs:AbstractSamplingActivityType | diggs:SamplingActivityPropertyType |
| elapsedTime | diggs:TimeMeasureType | diggs:SedimentationType |
| ShearingIncrement | diggs:ShearingIncrementType | diggs:ShearingIncrementPropertyType |
| elapsedTime | diggs:TimeMeasureType | diggs:ShearingIncrementType |
| elapsedTime | diggs:TimeMeasureType | diggs:SwellOrCollapseMeasurementType |
| swellOrCollapseMeasurements | diggs:DeformationMeasurementsArrayPropertyType | diggs:SwellOrCollapseStageType |
| consolidationIncrement | diggs:CTConsolidationIncrementPropertyType | diggs:SwellTestConsolidationStageType |
| testDuration | diggs:TimeMeasureType | diggs:TensileStrengthType |
| timeIntervalList | diggs:TimeIntervalListSimpleType | diggs:TimeIntervalListType |
| duration | diggs:TimeMeasureType | diggs:TimeIntervalType |
| TorqueIncrement | diggs:TorqueIncrementType | diggs:TorqueIncrementPropertyType |
| elapsedTime | diggs:TimeMeasureType | diggs:TorqueIncrementType |
| TriaxialTestConsolidationStage | diggs:TriaxialTestConsolidationStageType | diggs:TriaxialTestConsolidationStagePropertyType |
| consolidationIncrement | diggs:ConsolidationIncrementPropertyType | diggs:TriaxialTestConsolidationStageType |
| t50 | diggs:TimeMeasureType | diggs:TriaxialTestConsolidationStageType |
| backPressureIncrement | diggs:BackPressureIncrementPropertyType | diggs:TriaxialTestSaturationStageType |
| shearingIncrement | diggs:ShearingIncrementPropertyType | diggs:TriaxialTestShearStageType |
| consolidationStage | diggs:TriaxialTestConsolidationStagePropertyType | diggs:TriaxialTestTrialType |
| compressionIncrement | diggs:CompressionIncrementPropertyType | diggs:UnconfinedCompressiveStrengthTestType |
| testDuration | diggs:TimeMeasureType | diggs:UnconfinedCompressiveStrengthTestType |
| delay | diggs:DelayEventPropertyType | diggs:VaneTestMeasurementDataType |
| timeToSoilFailure | diggs:TimeMeasureType | diggs:VaneTestMeasurementDataType |
| torqueIncrement | diggs:TorqueIncrementPropertyType | diggs:VaneTestMeasurementDataType |
| VaneTestMeasurementData | diggs:VaneTestMeasurementDataType | diggs:VaneTestPropertyType |
| viscocityReading | diggs:ViscosityReadingPropertyType | diggs:ViscometerTestType |
| ViscosityReading | diggs:ViscosityReadingType | diggs:ViscosityReadingPropertyType |
| elapsedTime | diggs:TimeMeasureType | diggs:ViscosityReadingType |
| dryingTime | diggs:TimeMeasureType | diggs:WaterContentTestType |
| heatingCycleParameters | diggs:HeatingCycleParametersPropertyType | diggs:WaterContentTestType |
| elapsedTime | diggs:TimeMeasureType | diggs:WaterStrikeReadingType |

Note: `diggs:CTConsoiidationIncrementType`, `diggs:DSConConsoiidationIncrementType`, and
`DsConConsolidationIncrement` are reproduced verbatim from the schema, typos (`Consoiidation`
for `Consolidation`, inconsistent capitalization) included — that's the actual name to grep
for in `../diggs-schema`, not a transcription error in this table.
