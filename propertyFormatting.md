# Formatting rules for KV tables in the diggs_file_inspector
## Definitions
DIGGS instances contain 3 different types of elements that are handled differently by display renderers:
1. Simple Property elements (lowerCamelCase names)
    - These are elements of simple type (eg. they contain a string or numeric value as the element value and potentially attributesn, eg. ```            <totalMeasuredDepth uom="m" howDetermined="measured" qualifier="exact">56.54</totalMeasuredDepth>```

2. Object (UpperCamelCase names)
    - These are elements that are of complex type, meaning that they contain a set of nested simple property or property type elements, eg.
    ```
                 <Remark>
                    <content>SPT testing was conducted at 2.83 m intervals throughout.</content>
                    <remarkDateTime>2024-03-04</remarkDateTime>
                </Remark>
    ```

3. Property type elements (lowerCamelCsseNames)
    - These are elements that wrap objects. There are two kinds of property type elements:
        1. Simple Property Type elements: these contain a single object only. The element `<remark>` below is a a simple property type element and contains a single `<Remark>` object. Likewise, the element `<author>` in the Remark object is also a simple property type element:
           ```
            <remark>
                <Remark>
                    <content>SPT testing was conducted at 2.83 m intervals throughout.</content>
                    <author>
                        <BusinessAssociate gml:id="BA1">
                             <gml:name>Fred Flintstone</name>
                              <phoneNumber type="voice">+966 11 234 5678</phoneNumber>
                        </BusinessAssociate>
                    </author>
                    <remarkDateTime>2024-03-04</remarkDateTime>
                </Remark>
            <remark>
            ```
            - Property type elements can also contain an object by reference, using the xlink:href attribute to point to the gml:id of the contained object This allows an object to be referenced (reused) multiple times in an instance without having to dubplicate it. For example, in another context, Fred Flintstone may be identified as a contractor; in this case Fred's BusinessAssociate may be incorporated by reference:
                ```
                <contractor xlink:href=#BA1>
                 ```

        2. Array Property Type elements: these may contain more than one of the same object, eg;
             ```
            <remarks>
                <Remark>
                    <content>SPT testing was conducted at 2.83 m intervals throughout.</content>
                    <remarkDateTime>2024-03-04</remarkDateTime>
                </Remark>
                <Remark>
                    <content>This is a second remark</content>
                    <author xlink:href=#BA1>
                    <remarkDateTime>2024-03-04</remarkDateTime>
                </Remark>
            <remarks>
             ```
             - Mixed objects are not allowed in an array property type - only multiple instances of the same object.

4. Reference Properties (lowerCamelCase)
    - Reference properties are lowerCamelCase properties whose names end in Ref; they contain an xlink:href attribute only, eg:

```
<samplingFeatureRef xlink:href="BH-33/>
```
Reference elements may be used by the file inspector to control actions (eg. display a well linked to a borehole using the value of samplingFeatureRef, but generally the value of the xlink:href atttribute of a reference element is not displayed in a KV table.).

In DIGGS instances, objects (except for the root `<Diggs>` object) are *ALWAYS* contained within property type or array property type elements. No exceptions.

## Formatting simple property type elements in KV tables
A KV (key-value) table  is a two-column table where the leftmost column contains a property name, and the second column contains the propety value. Except where specified, a DIGGS object is displayed by default in the file inspector as a KV table, with each of the object's contained property elements comprising one row in the table.

Simple property elements, by default, are displayed as follows:

```
<totalMeasuredDepth uom="m" howDetermined="measured" qualifier="exact">56.54</totalMeasuredDepth>
```
Would be displayed as:
|  |  |
| --- | --- |
| **Total Measured Depth** | **56.54 m**  (measured, exact) |
|

Note: the Label column is derived from the element name (in config) and has its own style. If the uom attribute is present, it always diplays after the value and with the same style as the value. Other attributes, if present, are displayed within parens, comma separated if more than one.The parenthetical attributes are styled differently than the value. Attribute names are never displayed. All attributes are displayed in the same row/column as t he element value.

Elements with codeSpace attributes are handled a bit differently, depending on the codeSpace value.
1. Codespace attributes that are simple text are displayed as a perenthetical attribute:

```
<gml:name codeSpace="USGS">USGS-1</gml:name>
```
is displayed as:
|  |  |
| --- | --- |
| **Name** | **USGS-1**  (USGS) |
|

Again, the parenthetical attribute is styled differently from the value.

If the codeSpace attribute contains a URL (eg. http:// file:/// urn:), a link icon is displayed that is clickable and will take the user to the target resource, eg:
```
<classificationCode codeSpace="https://diggsml.org/def/codes/DIGGS/0.1/astmD2488.xml#GP">
    Poorly graded gravel
</classificationCode>
```
is displayed as:

|  |  |
| --- | --- |
| **Code** | **Poorly graded gravel** &#128279; |
|

where the &#128279; is a clickable link to the target URL. Elements with codeSpace attributes generally do not carry additional attributes, but if they do, they should be displayed in parens.

## Displaying nested objects within a KV table

Nested objects (an object within an object,wrapped in a property type element) poses a unique challenge within a KV table format, since an object is displayed as a KV table. This has generally been managaed by nesting KV tables within the rightmost cell of the parent KV tablem but this makes dieplay somewhat ugly and cluttered, so I'm proposing another approach:
- When a property type element is to be displayed, based on the config of the parent object, the KV table breaks and an expandable category Label is displayed in the label field. the category label identifies the object and contains an expansion widget that the user can click to expand the child object(s).

Example - multiple nests, one instance of a property type element within a parent KV table:
```
<LithologyObservation gml:id="Litho_Soil_Observation_BH-33_0.5">
...
    <primaryLithology>
        <Lithology gml:id="DGS14E4-D53-C4-71B0-3FB08">
            <classificationCode codeSpace="https://diggsml.org/def/codes/DIGGS/0.1/astmD2488.xml#GP">
                Poorly graded gravel
            </classificationCode>
            <lithProperties>
                <LithProperties gml:id="DGS3F43-164B-28A5-ABD7-41353">
                    <consistency>medium dense</consistency>
                    <cementation  codeSpace="https://diggsml.org/def/codes/DIGGS/0.1/lithprops.xml#GP">
                        moderate
                    </cementation>
                    <moistureCondition>moist to wet</moistureCondition>
                    <odor>no</odor>
                    <particleSorting>poorly graded</particleSorting>
                    <reactionToHCl>weak</reactionToHCl>
                    <soilStructure>stratified</soilStructure>
                </LithProperties>
            </lithProperties>
        </Lithology>
    </primaryLithology>
    <facies>fill</facies>
</LithologyObservation>
```
Will render initially as:
<table style="border-collapse:collapse; width:100%; max-width:520px; font-family:sans-serif; font-size:14px;">
  <tbody>
    <tr>
      <td colspan="2" style="border:none; padding:6px 10px; font-style:italic; border-bottom:1px solid #999;">Previous elements in Lithology observation</td>
    </tr>
    <tr>
      <td colspan="2" style="border:none; padding:6px 10px; font-weight:bold;"><details><summary>PRIMARY LITHOLOGY</summary></details></td>
      <tr>
       <td style="border:none; padding:6px 10px; font-weight:bold; border-bottom:1px solid #999;">Facies</td>
      <td style="border:none; padding:6px 10px; font-weight:bold; border-bottom:1px solid #999;">fill</td>
    </tr>
   <tbody>
    <table>

Clicking on the expansion triangle then reveals:

<table style="border-collapse:collapse; width:100%; max-width:520px; font-family:sans-serif; font-size:14px;">
  <tbody>
    <tr>
      <td colspan="2" style="border:none; padding:6px 10px; font-style:italic; border-bottom:1px solid #999;">Previous elements in Lithology observation</td>
    </tr>
    <tr>
      <td colspan="2" style="border:none; padding:6px 10px; font-weight:bold;;">▼ PRIMARY LITHOLOGY</td>
    </tr>
    <tr>
      <td style="border:none; padding:6px 10px; font-weight:bold;">Code</td>
      <td style="border:none; padding:6px 10px; font-weight:bold; ">Poorly graded gravel 🔗</td>
    </tr>
    <tr>
      <td colspan="2" style="border:none; padding:6px 10px; font-weight:bold; border-bottom:1px solid #999;"><details><summary>PROPERTIES</summary></details></td>
    </tr>
     <tr>
       <td style="border:none; padding:6px 10px; font-weight:bold; border-bottom:1px solid #999;">Facies</td>
      <td style="border:none; padding:6px 10px; font-weight:bold; border-bottom:1px solid #999;">fill</td>
    </tr>
 </tbody>
</table>

And then clicking on the PROPERTIES category label displays this:

<table style="border-collapse:collapse; width:100%; max-width:520px; font-family:sans-serif; font-size:14px;">
  <tbody>
   <tr>
      <td colspan="2" style="border:none; padding:6px 10px; font-style:italic; border-bottom:1px solid #999;">Previous elements in Lithology observation</td>
    </tr>
    <tr>
      <td colspan="2" style="border:none; padding:6px 10px; font-weight:bold;;">▼ PRIMARY LITHOLOGY</td>
    </tr>
    <tr>
      <td style="border:none; padding:6px 10px; font-weight:bold;">Code</td>
      <td style="border:none; padding:6px 10px; font-weight:bold; ">Poorly graded gravel 🔗</td>
    </tr>
    <tr>
      <td colspan="2" style="border:none; padding:6px 10px; font-weight:bold;">▼PROPERTIES</td>
    </tr>
    <tr>
      <td style="border:none; padding:6px 10px; font-weight:bold;">Consistency</td>
      <td style="border:none; padding:6px 10px; font-weight:bold;">medium dense</td>
    </tr>
    <tr>
      <td style="border:none; padding:6px 10px; font-weight:bold;">Cementation</td>
      <td style="border:none; padding:6px 10px; font-weight:bold;">moderate 🔗</td>
    </tr>
    <tr>
      <td style="border:none; padding:6px 10px; font-weight:bold;">Moisture Condition</td>
      <td style="border:none; padding:6px 10px; font-weight:bold;">moist to wet</td>
    </tr>
    <tr>
      <td style="border:none; padding:6px 10px; font-weight:bold;">Odor</td>
      <td style="border:none; padding:6px 10px; font-weight:bold;">no</td>
    </tr>
    <tr>
      <td style="border:none; padding:6px 10px; font-weight:bold;">Particle Sorting</td>
      <td style="border:none; padding:6px 10px; font-weight:bold;">poorly graded</td>
    </tr>
    <tr>
      <td style="border:none; padding:6px 10px; font-weight:bold;">Reaction to HCl</td>
      <td style="border:none; padding:6px 10px; font-weight:bold;">weak</td>
    </tr>
    <tr>
      <td style="border:none; padding:6px 10px; font-weight:bold; border-bottom:1px solid #999;">Soil Structure</td>
      <td style="border:none; padding:6px 10px; font-weight:bold; border-bottom:1px solid #999;">stratified</td>
    </tr>
    <tr>
      <td style="border:none; padding:6px 10px; font-weight:bold; border-bottom:1px solid #999;"></td>
      <td style="border:none; padding:6px 10px; font-weight:bold; border-bottom:1px solid #999;"></td>
    </tr>
    <tr>
      <td style="border:none; padding:6px 10px; border-bottom:1px solid #999;">Facies</td>
      <td style="border:none; padding:6px 10px; border-bottom:1px solid #999;">fill</td>
    </tr>
  </tbody>
</table>
Note that within an object, there are no row separator lines, but thta there are separators between embedded objects and properties of the parent object(s). Also note that there are two sets of rules below Soil Structure. This indicates that the Facies property is part of the LithologyObservation parent object, not the Primary Lithology object. If there were addtional properties within the Primary Lithology object that the config would place below properties, they would occur between the double rules. In the case where a property type element contains an object by reference the renderer must fetch the actual object via the xlink:href and display it when the Category label is clicked as if the object were directly embedded.

### When there are multiple occurrences of the same property type element or elements within an array property type
Some property type elements cam occur multiple times within an object, eg:
```
<constructionMethod>
    <BoreholeConstructionMethod gml:id="BCM-BH001-B">
          <gml:name codeSpace="http://www.globalgeosolutions.com/projects/GBL-GT-24136">BH-1 Full Construction Method Record</gml:name>
         <location>
            <LinearExtent gml:id="DGS8BE6-50E-3C2A-5616-1BBB7" srsName="#lsr-BH1"
                srsDimension="1">
                <gml:posList>0.00 30.00</gml:posList>
            </LinearExtent>
        </location>
        <methodTime>
            <TimeInterval gml:id="TI-BCM-BH001-B-METHOD">
                <start frame="#ISO-8601">2024-03-04T06:30:00+03:00</start>
                <end frame="#ISO-8601">2024-03-04T17:45:00+03:00</end>
                <duration uom="d">0.47</duration>
            </TimeInterval>
        </methodTime>
         <!-- Primary drilling method specification -->
        <constructionMethod>
            <Specification gml:id="SPEC-BH001-B-DRILL">
                <gml:name codeSpace="http://diggsml.org/def/codes/DIGGS/0.1/Specification">Rotary Wash Drilling — ASTM D5783</gml:name>
                <standardReferenceNumber>ASTM D5783</standardReferenceNumber>
                <standardTitle>Standard Guide for Use of Direct Rotary Drilling with Water-Based Drilling Fluid for Geoenvironmental Exploration and the Installation of Subsurface Water-Quality Monitoring Devices</standardTitle>
             </Specification>
        </constructionMethod>
        <constructionMethod>
            <Specification gml:id="SPEC-BH001-B-SPT">
                <gml:name codeSpace="http://diggsml.org/def/codes/DIGGS/0.1/Specification">Standard Penetration Test — ASTM D1586</gml:name>
        </constructionMethod>
         <cuttingToolInfo>
            <CuttingTool gml:id="CT-BH001-B">
                <toolTyp>triconeRollerBit</toolType>
                 <toolOuterDiameter uom="mm" howDetermined="reported"
                    >150</toolOuterDiameter>
                <toolMaterial>hardened steel with tungsten carbide inserts</toolMaterial>
             </CuttingTool>
        </cuttingToolInfo>
        <hydraulicFluidFlowRate uom="L/min" howDetermined="measured"
            >45</hydraulicFluidFlowRate>
    </BoreholeConstructionMethod>
</constructionMethod>
<constructionMethod>
    <BoreholeConstructionMethod gml:id="BCM-BH001">
        <gml:description>Rotary wash drilling using water-based drilling fluid with bentonite additive. NQ drill 
 rods advanced with rotary head; cuttings returned to surface via upward fluid circulation and collected in settlement pit.</gml:description>
         <gml:name codeSpace="http://www.globalgeosolutions.com/projects/GBL-GT-24136">BH-1 Construction Method</gml:name>
     </BoreholeConstructionMethod>
</constructionMethod>
```
Here the a Borehole record has two constructionMethod property type properties. This is how this data should be rendered (inital view after clicking the CONSTRUCTION METHODS category label)

<table style="border-collapse:collapse; width:100%; max-width:520px; font-family:sans-serif; font-size:14px;">
  <tbody>
    <tr>
      <td colspan="2" style="border:none; padding:6px 10px; font-style:italic; border-bottom:1px solid #999;">Previous elements in Boreholen</td>
    </tr>
    <tr>
      <td colspan="2" style="border:none; padding:6px 10px; font-weight:bold; border-bottom:1px solid #999;">▼ CONSTRUCTION METHODS</td>
    </tr>
  <tr>
      <td style="border:none; padding:6px 10px; font-weight:bold;">Name</td>
      <td style="border:none; padding:6px 10px; font-weight:bold;">BH-1 Full Construction Method Record 🔗</td>
    </tr>
    <tr>
      <td style="border:none; padding:6px 10px; font-weight:bold;">Location</td>
      <td style="border:none; padding:6px 10px; font-weight:bold;">0 - 30 m</td>
    </tr>
   <tr>
      <td style="border:none; padding:6px 10px; font-weight:bold;">Time</td>
      <td style="border:none; padding:6px 10px; font-weight:bold;">03/03/2024 (06:30 – 17:45) (0.47 d)</td>
    </tr>
    <tr>
      <td colspan="2" style="border:none; padding:6px 10px; font-weight:bold;"><details><summary>CONSTRUCTION SPECS</summary></details></td>
    </tr>
     <tr>
      <td colspan="2" style="border:none; padding:6px 10px; font-weight:bold;"><details><summary> DRILL BIT INFO</summary></details</td>
    </tr>
   <tr>
      <td style="border:none; padding:6px 10px; border-bottom:1px solid #999;">Hydraulic Fluid Flow Rate</td>
      <td style="border:none; padding:6px 10px; border-bottom:1px solid #999;">45 L/min (measured)</td>
    </tr>
   </tr>
   <tr>
      <td style="border:none; padding:6px 10px; font-weight:bold;">Description</td>
      <td style="border:none; padding:6px 10px; font-weight:bold;">Rotary wash drilling using water-based drilling fluid with bentonite additive. NQ drill 
 rods advanced with rotary head; cuttings returned to surface via upward fluid circulation and collected in settlement pit.</td>
    </tr>
  <tr>
      <td style="border:none; padding:6px 10px; border-bottom:1px solid #999;">Name</td>
      <td style="border:none; padding:6px 10px; border-bottom:1px solid #999;">BH-1 Construction Method</td>
    </tr>
</summary></details     </tbody>
</table>

Expanding shows the two BoneholeConstructionMethod object separated by rule lines. The first method contains two othre embedded objects (Construction Specs which contains 2 Specification objects and Drill Bit Info. Following expansion of those objects, the display looks like this:

<table style="border-collapse:collapse; width:100%; max-width:520px; font-family:sans-serif; font-size:14px;">
  <tbody>
  <tr>
      <td colspan="2" style="border:none; padding:6px 10px; font-weight:bold; border-bottom:1px solid #999;">▼ CONSTRUCTION METHODS</td>
    </tr>
  <tr>
      <td style="border:none; padding:6px 10px; font-weight:bold;">Name</td>
      <td style="border:none; padding:6px 10px; font-weight:bold;">BH-1 Full Construction Method Record 🔗</td>
    </tr>
    <tr>
      <td style="border:none; padding:6px 10px; font-weight:bold;">Location</td>
      <td style="border:none; padding:6px 10px; font-weight:bold;">0 - 30 m</td>
    </tr>
   <tr>
      <td style="border:none; padding:6px 10px; font-weight:bold;">Time</td>
      <td style="border:none; padding:6px 10px; font-weight:bold;">03/03/2024 (06:30 – 17:45) (0.47 d)</td>
    </tr>
       <td colspan="2" style="border:none; padding:6px 10px; font-weight:bold; border-bottom:1px solid #999;">▼ CONSTRUCTION SPECS</td>
    </tr>
    <tr>
      <td style="border:none; padding:6px 10px; font-weight:bold;">Name</td>
      <td style="border:none; padding:6px 10px; font-weight:bold;">Rotary Wash Drilling — ASTM D5783 🔗</td>
    </tr>
    <tr>
      <td style="border:none; padding:6px 10px; font-weight:bold;">Standard Reference No.</td>
      <td style="border:none; padding:6px 10px; font-weight:bold;">ASTM D5783</td>
    </tr>
    <tr>
      <td style="border:none; padding:6px 10px; font-weight:bold; border-bottom:1px solid #999;">Standard Title</td>
      <td style="border:none; padding:6px 10px; font-weight:bold; border-bottom:1px solid #999;">Standard Guide for Use of Direct Rotary Drilling with Water-Based Drilling Fluid for Geoenvironmental Exploration and the Installation of Subsurface Water-Quality Monitoring Devices</td>
    </tr>
       </tr>
         <td style="border:none; padding:6px 10px; font-weight:bold;">Name</td>
      <td style="border:none; padding:6px 10px; font-weight:bold;;">Standard Penetration Test — ASTM D1586</td>
    </tr>
    <tr>
      <td style="border:none; padding:6px 10px; font-weight:bold; border-bottom:1px solid #999;"></td>
      <td style="border:none; padding:6px 10px; font-weight:bold; border-bottom:1px solid #999;"></td>
    </tr>
    <tr>
      <td colspan="2" style="border:none; padding:6px 10px; font-weight:bold;">▼ DRILL BIT INFO</td>
    </tr>
       </tr>
    <tr>
      <td style="border:none; padding:6px 10px; font-weight:bold;">Outer Diameter</td>
      <td style="border:none; padding:6px 10px; font-weight:bold;">150 mm (reported)</td>
    </tr>
    <tr>
      <td style="border:none; padding:6px 10px; border-bottom:1px solid #999;">Material</td>
      <td style="border:none; padding:6px 10px; border-bottom:1px solid #999;">hardened steel with tungsten carbide inserts</td>
    </tr>
   </tr>
  <tr>
      <td style="border:none; padding:6px 10px; border-bottom:1px solid #999;">Hydraulic Fluid Flow Rate</td>
      <td style="border:none; padding:6px 10px; border-bottom:1px solid #999;">45 L/min (measured)</td>
    </tr>
   </tr>

  <tr>
      <td style="border:none; padding:6px 10px; font-weight:bold;">Description</td>
      <td style="border:none; padding:6px 10px; font-weight:bold;">Rotary wash drilling using water-based drilling fluid with bentonite additive. NQ drill 
 rods advanced with rotary head; cuttings returned to surface via upward fluid circulation and collected in settlement pit.</td>
    </tr>
  <tr>
      <td style="border:none; padding:6px 10px; border-bottom:1px solid #999;">Name</td>
      <td style="border:none; padding:6px 10px; border-bottom:1px solid #999;">BH-1 Construction Method</td>
    </tr>

     </tbody>
</table>

Although not shown here, having the rows within embedded objects indented slightly might help the visualiztion instead of relying entirely on the ruled lines to determine where a data row fits into the hierarchy. Alao note that Location and Time are actually objects that are rendered as a single row. Both of these are special cases - Time (TimeInterval( is already accommodated for, whereas formatting for Location will need to be done, I believe.

## Other special case objects

Presently, it is clear that two common objects are best rendered as single line entries in a KV table - Role and Remark. The following show how the single line display is rendered from the objects:

### Remark
```
<Remark owns="false">
    <content>BH-1 advanced by rotary wash drilling from ground surface to 56.54 m bgl on 4 March 2024.</content>
    <author>
        <BusinessAssociate gml:id="BA01">
            <gml:name codeSpace="http://www.globalgeosolutions.com">Global Geosolutions Ltd</gml:name>
            <associatedFile xlink:href="#AF001" owns="false">
                <AssociatedFile gml:id="AF-CE01-A1-01">
                    <gml:description>Promotional Photo</gml:description>
                    <gml:name>GBL.jpeg</gml:name>
                     <fileURL>https://www.globalgeosolutions.com/projects/GBL.jpegl</fileURL>
                    <fileDate>2024-05-15</fileDate>
                     <mimeType>application/jpeg</mimeType>
                    <compression>none</compression>
                    <encryption>none</encryption>
                </AssociatedFile>
            </associatedFile>
            <address>
                <Address gml:id="ADDR-CE01-A1-01">
                      <number>Level 4, Tower B</number>
                    <streetAddress>King Fahd Road</streetAddress>
                    <streetAddress>Al Olaya District</streetAddress>
                    <city>Riyadh</city>
                    <state>Riyadh Province</state>
                    <province>Riyadh Province</province>
                    <county>—</county>
                    <country>Saudi Arabia</country>
                    <postalCode>11564</postalCode>
                </Address>
            </address>
             <emailAddress type="business">info.riyadh@globalgeosolutions.com</emailAddress>
             <phoneNumber type="voice">+966 11 234 5678</phoneNumber>
         </BusinessAssociate>
    </author>
    <author xlink:href="#BA002" owns="false">
        <BusinessAssociate gml:id="BA-CE01-AUTH2">
            <gml:name codeSpace="http://www.jazera-dev.sa">Jazera Royal Palace Development Authority</gml:name>
            <emailAddress type="personal">siterepresentative@jazera-dev.sa</emailAddress>
            <phoneNumber type="mobile">+966 50 123 4567</phoneNumber>
        </BusinessAssociate>
    </author>
    <remarkDateTime>2024-03-04T17:45:00+03:00</remarkDateTime>
</Remark>
```
Content is the only required field in a remark, but other fields identify tha author and the date/time of the remark. The above would be displayed as follows:

| | |
| --- | --- |
|**Remark**| BH-1 advanced by rotary wash drilling from ground surface to 56.54 m bgl on 4 March 2024. by <u>Global Geosolutions Ltd</u> on 2024-03-04 17:45 |
|

The keywords "by" and "on" are concatenated to the content value. The first naame element of the BusinessAssociate is listed if an author is reported. The name is underlined to indicate a link action. Clicking on the name displays the KV Table of the BusinessAssociate object in a popup window. This tis the only place where popupss should be used.

### Role

```
<Role owns="false">
    <rolePerformed codeSpace="http://diggsml.org/def/codes/DIGGS/0.1/RolePerformed"
     Geotechnical Engineer
    </rolePerformed>
    <timePerformed>
        <TimeInterval gml:id="TI-BH001">
            <start frame="#ISO-8601" indeterminatePosition="unknown"
                >2024-03-04</start>
            <end frame="#ISO-8601" indeterminatePosition="unknown">2024-03-04</end>
            <duration uom="d" howDetermined="calculated">1</duration>
        </TimeInterval>
    </timePerformed>
    <remark>
        <Remark owns="false">
            <content>Global Geosolutions Ltd served as geotechnical engineer of record
                for all borehole drilling and sampling operations at the Jazera Royal
                Palace Substation site.</content>
            <remarkDateTime frame="#ISO-8601" indeterminatePosition="unknown"
                >2024-03-04</remarkDateTime>
        </Remark>
    </remark>
    <businessAssociate xlink:href="#BA001"/>
</Role>
```

Displayed as:
| | |
| --- | --- |
| **Role** | **Geotechnical Engineer 🔗**: <u>Global Geosolutions Ltd</u> from 03/01/2024 – 04/30/2024 (60 d) (*Global Geosolutions Ltd served as geotechnical engineer of record for all borehole drilling and sampling operations at the Jazera Royal Palace Substation site.*)|
|

Remark would be displayed in a muted style and only the comment reported here. Again, the BusinessAssociate name would be styled as a link that will diaplay a popup o the BusineassAssociate object when clicked.

KV Rendering

1.  





