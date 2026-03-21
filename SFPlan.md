FINAL PLAN — Sampling Feature Summary Table

Single unified column schema (all tabs):
| Name | Location | Elevation | Purpose | Depth/Length | Date | Parent Feature | Installations |

Name — gml:name value(s). If codeSpace present, displays as Name (codeSpace). Multiple names stack vertically within the cell.
Location — lat/lon derived from referencePoint, converted from source CRS to WGS84 as needed. Present for all feature types including installations.
Elevation — vertical component of referencePoint with datum/unit label.
Purpose — whichever *Purpose element is present for the type (boreholePurpose, soundingPurpose, wellPurpose, etc.). Blank (—) if absent or type has none.
Depth/Length — whichever total extent element applies (totalMeasuredDepth, totalTransectLength, wellDepth, totalPileLength, totalSurveyArea, etc.), with unit. Blank if absent.
Date — start date from whichever when* element applies (whenConstructed, whenInstalled, whenTracklineOccupied, etc.). Blank if absent.
Parent Feature — for installations only: clickable name of the parent sampling feature. Blank for all non-installation types.
Installations — for standard sampling features only: clickable name(s) of child installations. Blank for installations and types that never have children.


Tabs:

One tab per element type present in the loaded file, labeled as split camel-case of the element local name (e.g. Borehole, Trial Pit, GP Trackline, Steel H Pile, Well, GP Multi Track, etc.)
Tabs only appear for types actually present in the data — no empty tabs
Current Boreholes / Soundings / Wells tabs replaced by this dynamic tab system
GP_Trackline tab — contains only standalone tracklines that are NOT members of any GP_MultiTrack in the file; member tracklines appear exclusively in the GP Multi Track tab


Aggregate tab (GP Multi Track):

Group header row spanning columns, showing the GP_MultiTrack name, location, elevation
Indented sub-rows beneath each header for the component GP_Trackline members, using the same column schema
Group header is collapsible (▸/▾)
Selecting the group header highlights all member tracklines together on the map
Selecting an individual component trackline sub-row highlights only that single trackline on the map


Map display:

Point features (Borehole, Sounding, TrialPit, Station) — plotted as point markers from referencePoint
Linear features as lines (GP_Trackline, Transect, GroutTrenchCutoffWall) — plotted as polylines from centerLine (LinearExtent property); GroutTrenchCutoffWall rendered as line only regardless of cutoffWallWidth
GP_MultiTrack — each member GP_Trackline plotted as a polyline; all members highlight together when group header selected, individually when a sub-row is selected
Planar features (PlanarSamplingFeature, GP_ArealSurvey) — plotted as polygons from featureExtent, border only, no fill
Volumetric features (VolumetricSamplingFeature) — plotted as polygons from featureExtent footprint, border only, no fill
Installations (Well, all Pile types) — no map markers; parent sampling feature's marker or line is highlighted/pulsed when an installation row is hovered or selected in the table


Map interaction:

Table row hover → corresponding map marker or line highlights
Table row click → feature selected; marker pulses or line highlights; detail pane populates; map pans/zooms to feature if off-screen
Map marker/line click → corresponding table tab activates if not already active; table scrolls to and highlights that row; detail pane populates
Parent Feature column link (in installation row) → selects parent feature's row in its own tab AND maintains/pulses the parent's map marker; detail pane shows parent feature detail
Installations column link (in parent row) → selects installation's row in its own tab AND maintains the parent feature's highlight on the map; detail pane shows installation detail
GP_MultiTrack group header selection → all member tracklines highlight simultaneously on map; map fits bounds to show all members
GP_MultiTrack individual sub-row selection → only that single trackline highlights on map
Deselection → clicking elsewhere in table or map clears current selection