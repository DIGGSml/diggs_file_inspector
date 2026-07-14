# Displaying data in KV tables in the diggs_file_inspector
## Definitions
DIGGS instances contain 4 different types of elements; the direct contents of two of them are commonly diaplayed in the diggs_file_inspector in KV tables:

1. Simple Property elements (lowerCamelCase names)
    - These are elements of simple type (eg. they contain a string or numeric value as the element value and potentially attributesn, eg. 
    ```
      <totalMeasuredDepth uom="m" howDetermined="measured" qualifier="exact">56.54</totalMeasuredDepth>
    ```

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

## General proposed architecture for KV table contsruction and display
version 1 of the file_inspector developed a complex method for KV table generation and deisplay that I think can be significantly simplified if we consider the following:

1. A KV (key-value) table consists of two-column rows where the leftmost column contains property name cells (the key), and the second column contains the propety value cells (the value). 
2. A row in a KV table is analgous to a simple property type DIGGS element: The element name represents the Key, and the element value the Value cell in the row. The only complication to this the presence of attributes in a simple property type, but these can be displayed programmatically within the key or value cells.
3. A DIGGS object is simply a collection of simple properties and property types, so it is analogous to a KV table itself, where each of the simple properties make up a row. The complication here is that within a DIGGS object may be propoerty type elements with embedded objects. However, this can simply be thought of as another KV table within a parent KV table, so the rendering machinery is the same
4. So fundamentally, we should be able to render any DIGGS object or portion of a DIGGS object for diaplay in a KV table with a single coding architecture - no multiple pipelines or complex branching.
5. our goal all along is for KV table rendering to be configurable via descriptor objects that do not require code modifications to change display options. Given the above, the application must contain at least one config object (json formatted const) for *EVERY* DIGGS object the app needs to display. The config will list which object properties are displayed and in what order. It wil define the label text, label, value and attribute styling (by referencing a CSS style), the KV title (if any), sections within the KV table headed by banner text that can be hidden or not, active or static, with active meaning that a triangle display widget; sections can be used to group related property elements together and allow for collapse or expansion of the section, whereas a static banner would just be text without any collapse control. An option should be given to have the KV title be an active (collapsbile) title as well. In additiona, banner text can be displayed above each field (it's own row essentially), and a flag to determine whether a bottom or top border should be displayed for the row should also be added to provide more display flexibility to the table.
6. So without fully figuring out the wiring, the basic idea for rendering a KV table in a particular portion of the doccument would be to pass an object rendering function the object to be displayed and a config object. The renderer then uses this to generate the html to build the table. When the config defines one of the table rows as a property element, it simply grabs that child object (either directly or by reference, depending on the instance) from the parsed xml, and its config, and calls itself recursively to contiue the rendering. This continues until the parent object is completely rendered. This architecutre provides flaexibility and is also comprehensive in that any object can be rendered with a single pipeline.

## Formatting simple property type elements in KV tables
I mentioned above that the addition of attributes makes an xml element a bit more complex than a simple KV pair, so i propose the follwoing formatting to enable simple property elements to be rendered within a single KV row. Alhough there are many types of attributes used in DIGGS, there are a few that are two common ones that are worth special handling - uom, and codeSpace

Simple property elements that may or may not contain uom would displayed as follows:

```
<totalMeasuredDepth uom="m" howDetermined="measured" qualifier="exact">56.54</totalMeasuredDepth>
```
to:
|  |  |
| --- | --- |
| **Total Measured Depth** | **56.54 m**  (measured, exact) |
|

Note: the Label column is derived from the element name (in config) and has its own style specified in config. If the uom attribute is present, it always diplays after the value and with the same style as the value. Other attributes, if present, are displayed within parens, comma separated if more than one. The parenthetical attributes are styled differently than the value (attribute styling in config for that property). Attribute names are never displayed. All attributes are displayed in the same row/column as the element value.

Elements with codeSpace attributes are handled a bit differently, depending on the codeSpace value.
1. Codespace attributes that are simple text are displayed as a perenthetical attribute in the Key column:

```
<gml:name codeSpace="USGS">USGS-1</gml:name>
```
is displayed as:
|  |  |
| --- | --- |
| **Name**  (USGS) | **USGS-1** |
|

Again, the parenthetical attribute is styled differently from the value and label (attribute style in config).

If the codeSpace attribute contains a URL (eg. http:// file:/// urn:), a link icon is displayed that is clickable and will take the user to the target resource, eg:
```
<classificationCode codeSpace="https://diggsml.org/def/codes/DIGGS/0.1/astmD2488.xml#GP">
    Poorly graded gravel
</classificationCode>
```
is displayed as:

|  |  |
| --- | --- |
| **Code** &#128279; | **Poorly graded gravel**  |
|

where the &#128279; is a clickable link to the target URL. Elements with codeSpace attributes have text values so never cary a uom and generally do not carry additional attributes, but if they do, they should be displayed in parens within the value cell as with the default treatment.

## Other special case objects

As was done in version 1, several common DIGGS objects are displayed in a way that allows them to be diaplayed as a simple property element - these are Role, Remark, and TimeInterval.  The BusinessAssociate object is always a child object of other objects and uses the same diaplay logic as other objects,  but managed a bit differently- it is never displayed withn a parent KV table - instead it is displayed standalone in a popup window triggered by an inline link diplayed in a parent KV table deruved from the BusinessAssociate object.

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

The keywords "by" and "on" are concatenated to the content value. The first name element of the BusinessAssociate is listed if an author is reported. The name is underlined to indicate a link action. Clicking on the name displays the KV Table of the BusinessAssociate object in a popup window. This tis the only place where popups are used.

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

Remark would be displayed in its own muted style and only the comment reported here. Again, the BusinessAssociate name would be styled as a link that will diaplay a popup o the BusineassAssociate object when clicked.

I don't have the specific conversion for TimeInterval to show you. You should use what was developed in version 1.







