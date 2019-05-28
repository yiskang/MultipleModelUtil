# MultipleModelUtil

![Platforms](https://img.shields.io/badge/platform-windows%20%7C%20osx%20%7C%20linux-lightgray.svg)
[![License](http://img.shields.io/:license-mit-blue.svg)](http://opensource.org/licenses/MIT)

## Overview

Utility Class for loading models in sequence for [Forge Viewer](https://forge.autodesk.com/api/viewer-cover-page/)

## Usage

1. Include libraries

```HTML
<script src="https://developer.api.autodesk.com/viewingservice/v1/viewers/viewer3D.js?v=6.5.*"></script>
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

## License

This sample is licensed under the terms of the [MIT License](http://opensource.org/licenses/MIT).
Please see the [LICENSE](LICENSE) file for full details.

## Written by

Eason Kang <br />
Forge Partner Development <br />
https://developer.autodesk.com/ <br />
https://forge.autodesk.com/blog <br />