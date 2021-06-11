# MultipleModelUtil

![Platforms](https://img.shields.io/badge/platform-windows%20%7C%20osx%20%7C%20linux-lightgray.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
[![Viewer](https://img.shields.io/badge/Viewer-v7-green.svg)](http://developer.autodesk.com/)

## Overview

Utility Class for loading models in sequence for [Forge Viewer](https://forge.autodesk.com/api/viewer-cover-page/).

A reversion of this official blog: [Aggregate multi models in sequence in Forge Viewer](https://forge.autodesk.com/blog/aggregate-multi-models-sequence-forge-viewer).

## Usage

1. Include libraries

```HTML
<link rel="stylesheet" href="https://developer.api.autodesk.com/viewingservice/v1/viewers/7.*/style.min.css" type="text/css">
<script src="https://developer.api.autodesk.com/viewingservice/v1/viewers/7.*/viewer3D.js"></script>
<script src="MultipleModelUtil.js"></script>
```

2. Create instance of the `MultipleModelUtil` inside the `Autodesk.Viewing.Initializer` callback, then call `MultipleModelUtil#processModels` to load all models

```JavaScript
Autodesk.Viewing.Initializer( options, function() {

  //get the viewer div
  const viewerDiv = document.getElementById( 'viewer' );

  //initialize the viewer object
  const viewer = new Autodesk.Viewing.Private.GuiViewer3D( viewerDiv );

  //load model one by one in sequence
  const util = new MultipleModelUtil( viewer );
  util.processModels( models );
});
```

## Example

``` JavaScript
function fetchForgeToken( callback ) {
  fetch( 'https://127.0.0.1/api/forge/oauth/token', {
    method: 'get',
    headers: new Headers({ 'Content-Type': 'application/json' })
  })
  .then( ( response ) => {
  if( response.status === 200 ) {
      return response.json();
  } else {
      return Promise.reject(
        new Error( `Failed to fetch token from server (status: ${response.status}, message: ${response.statusText})` )
      );
  }
  })
  .then( ( data ) => {
    if( !data ) return Promise.reject( new Error( 'Empty token response' ) );

    callback( data.access_token, data.expires_in );
  })
  .catch( ( error ) => console.error( error ) );
}

function launchViewer( models ) {
  if( !models || models.length <= 0 )
    return console.error( 'Empty model input' );

  const options = {
    env: 'AutodeskProduction',
    getAccessToken: fetchForgeToken
    //accessToken: 'eyJhbGciOiJIUzI1NiIs....'
  };

  Autodesk.Viewing.Initializer( options, function() {

    //get the viewer div
    const viewerDiv = document.getElementById( 'viewer' );

    //initialize the viewer object
    const viewer = new Autodesk.Viewing.Private.GuiViewer3D( viewerDiv );

    //load model one by one in sequence
    const util = new MultipleModelUtil( viewer );
    util.processModels( models );
  });
}

const models = [
  { name: '1.nwc', urn: 'urn:dXJuOmFkc2sud2lwcHJvZDpmcy5maWxlOnZmLlNpaHgxOTVuUVJDMHIyWXZUSVRuZFE/dmVyc2lvbj0x' },
  { name: '2.nwc', urn: 'urn:dXJuOmFkc2sud2lwcHJvZDpmcy5maWxlOnZmLldVRHJ4ajZ6UTBPLTRrbWZrZ3ZoLUE/dmVyc2lvbj0x' },
  { name: '3.nwc', urn: 'urn:dXJuOmFkc2sud2lwcHJvZDpmcy5maWxlOnZmLjRyZW5HRTNUU25xNHhYaW5xdWtyaWc/dmVyc2lvbj0x' }
];

launchViewer( models.concat() );
```

## Supported alignments

This utility supports 4 kinds alignments as the below:

- **Center to center**: the default way of the viewer.
  ``` javascript
  const util = new MultipleModelUtil( viewer );

  util.options = {
    alignment: MultipleModelAlignmentType.CenterToCenter
  };
  util.processModels( models );
  ```

- **Origin to origin**: Apply the globalOffset of the 1st model to others. (**This is the default alignment method of this utility**)
  ``` javascript
  const util = new MultipleModelUtil( viewer );

  util.options = {
    alignment: MultipleModelAlignmentType.OriginToOrigin
  };
  util.processModels( models );
  ```

- **By [Revit shared coordinates](https://knowledge.autodesk.com/support/revit-products/learn-explore/caas/CloudHelp/cloudhelp/2020/ENU/Revit-Collaborate/files/GUID-B82147D6-7EAB-48AB-B0C3-3B160E2DCD17-htm.html)**: Set up `applyRefpoint: true` and make the `globalOffset` to the `refPoint`.

  ``` javascript
  const util = new MultipleModelUtil( viewer );

  util.options = {
    alignment: MultipleModelAlignmentType.ShareCoordinates
  };
  util.processModels( models );
  ```

- **Custom alignment**: If the above alignments don't match your need, you can use this option to set up custom alignments.

  ``` javascript
  const util = new MultipleModelUtil( viewer );

  util.options = {
    alignment: MultipleModelAlignmentType.Custom,
    getCustomLoadOptions: (bubble, data) => {
      console.log(bubble, data);
      
      const tx = new THREE.Matrix4();
      tx.setPosition({ x:1, y:100, z:1 }).scale({ x:2, y:2, z:2 });
      return {
        placementTransform: tx
      };
    }
  };
  util.processModels( models );
  ```

**Note.** Forge Viewer supports 3 kinds of Revit link methods as I shared [here](https://stackoverflow.com/a/67018048/7745569):

- Origin to origin
- Center to center
- By shared coordinate

## License

This sample is licensed under the terms of the [MIT License](http://opensource.org/licenses/MIT).
Please see the [LICENSE](LICENSE) file for full details.

## Written by

Eason Kang [@yiskang](https://twitter.com/yiskang), [Forge Partner Development](http://forge.autodesk.com)