1. Verify DIGGS_SF is populated
jsDIGGS_SF
Should show a Map with keys matching the SF types actually present in your file (e.g. "Borehole", "Well", "Sounding"). Click the map entries to expand.
js[...DIGGS_SF.entries()].map(([k,v]) => `${k}: ${v.length}`)
Quick summary — should match the badge counts shown in the UI tabs.

2. Verify legacy aliases still point to the same arrays
jsDIGGS_BH === DIGGS_SF.get('Borehole')
DIGGS_CPT === DIGGS_SF.get('Sounding')
DIGGS_WELL === DIGGS_SF.get('Well')
All three should return true. If any returns false, the alias re-sync broke.

3. Spot-check a parsed SF object for the new fields
jsDIGGS_BH[0]
Expand the object and confirm these new fields are present:

purpose — string or ""
linearExtentLatLngs — null for point features (Borehole/CPT/Well), or an array for line features
linearExtentLen — null or a number
parentRef — null for Boreholes
childRefs — [] on a Borehole with no Wells; an array of Well ids on one that has them

jsDIGGS_WELL[0]

parentRef should be a string matching a Borehole's id (not null, if your file has a samplingFeatureRef on the Well)
childRefs should be [] (Wells don't have children)


4. Verify childRefs back-fill worked
js// Find a borehole that has wells installed in it
DIGGS_BH.filter(b => b.childRefs.length > 0)
Should return the boreholes that have at least one Well referencing them. Then cross-check:
jslet bh = DIGGS_BH.find(b => b.childRefs.length > 0)
bh.childRefs                              // array of Well ids
DIGGS_WELL.filter(w => w.parentRef === bh.id)  // should match 1:1

5. Check any generically-parsed types (e.g. TrialPit)
Only relevant if your file contains those element types:
jsDIGGS_SF.get('TrialPit')    // undefined if none in file — that's correct
DIGGS_SF.get('GP_Trackline')
If present, spot-check one entry for linearExtentLatLngs — it should be an array of [lat, lon] pairs, not null.

6. Confirm SF_TYPE_CONFIG and SF_DETAIL_DESCRIPTORS are accessible
jsObject.keys(SF_TYPE_CONFIG)
// → ['Borehole', 'Sounding', 'Well', 'TrialPit', 'GP_Trackline', 'GP_MultiTrack', 'Station', 'Transect']

SF_DETAIL_DESCRIPTORS
// → {} (empty stub — correct for now)
```

---

## What a clean result looks like

With a typical BH+Well file you'd expect something like:
```
DIGGS_SF size: 2          ← only types present in the file
BH: 12, Well: 4
DIGGS_BH === DIGGS_SF.get('Borehole') → true
DIGGS_BH[0].childRefs    → ['W001', 'W002']
DIGGS_WELL[0].parentRef  → 'BH003'
DIGGS_WELL[0].childRefs  → []
DIGGS_BH[0].purpose      → '' or a string
The one thing most likely to be wrong is parentRef on Wells — that depends on whether your test file actually has <diggs:samplingFeatureRef xlink:href="#BH001"/> inside the <Well> element. If parentRef is null on all Wells, check the raw XML to see what the element is named (it may be samplingFeature rather than samplingFeatureRef in your version).