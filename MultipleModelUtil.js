//
// Copyright (c) Autodesk, Inc. All rights reserved
//
// Permission to use, copy, modify, and distribute this software in
// object code form for any purpose and without fee is hereby granted,
// provided that the above copyright notice appears in all copies and
// that both that copyright notice and the limited warranty and
// restricted rights notice below appear in all supporting
// documentation.
//
// AUTODESK PROVIDES THIS PROGRAM "AS IS" AND WITH ALL FAULTS.
// AUTODESK SPECIFICALLY DISCLAIMS ANY IMPLIED WARRANTY OF
// MERCHANTABILITY OR FITNESS FOR A PARTICULAR USE.  AUTODESK, INC.
// DOES NOT WARRANT THAT THE OPERATION OF THE PROGRAM WILL BE
// UNINTERRUPTED OR ERROR FREE.
//
// Utility Class for loading models in sequence for Forge Viewer
// by Eason Kang - Autodesk Forge Partner Development (FPD)
//

(function(parent) {
  const MultipleModelAlignmentType = {
    CenterToCenter: 1,
    OriginToOrigin: 2,
    ShareCoordinates: 3,
    Custom: 4
  };

  const AGGREGATE_GEOMETRY_LOADED_EVENT = 'aggregateGeometryLoaded';

  class MultipleModelUtil {
    /**
     * @type {Viewer3D} The Forge Viewer instance
     * @private
     */
    #viewer = null;
  
    /**
     * @type {Object} options The alignment setup
     * @private
     */
    #options = null;
  
    /**
     * @param {Viewer3D} viewer The Forge Viewer instance
     * @param {Object} options The alignment setup
     * @param {MultipleModelAlignmentType} [options.alignment] The alignment type: CenterToCenter, OriginToOrigin, ShareCoordinates, or Custom
     * @param {function} [options.getCustomLoadOptions] Allows for applying custom options to be used for all model loading. The callback returns an options object that is applied by default in all model-load calls. The signature should look like: function(bubble, data) => Object
     * @param {string} [options.viewerUnits] - If specified, all models are re-scaled from model units to this unit. Must be a GNU unit format string, e.g. "m".
     * @constructor
     */
    constructor(viewer, options) {
      this.#viewer = viewer;
  
      options = options || { alignment: MultipleModelAlignmentType.OriginToOrigin };
      this.#validateOptions(options);
  
      this.#options = options;
    }
  
    /**
     * Check if input is valid
     * @param {Object} opts The alignment setup
     * @property {MultipleModelAlignmentType} [options.alignment] The alignment type: CenterToCenter, OriginToOrigin, ShareCoordinates, or Custom
     * @property {function} [options.getCustomLoadOptions] Allows for applying custom options to be used for all model loading. The callback returns an options object that is applied by default in all model-load calls. The signature should look like: function(bubble, data) => Object
     * @property {string} [options.viewerUnits] - If specified, all models are re-scale
     * @returns {bool} False if the input options is invalid
     * @private
     */
    #isValidOptions(opts) {
      if (!opts || !opts.alignment || !Object.values(MultipleModelAlignmentType).includes(opts.alignment)) return false;
  
      if (opts.alignment === MultipleModelAlignmentType.Custom) {
        if (!(opts.getCustomLoadOptions instanceof Function)) {
          return false;
        }
      }
  
      return true;
    }
  
    /**
     * Check if input is valid 
     * @param {Object} opts The alignment setup
     * @property {MultipleModelAlignmentType} [options.alignment] The alignment type: CenterToCenter, OriginToOrigin, ShareCoordinates, or Custom
     * @property {function} [options.getCustomLoadOptions] Allows for applying custom options to be used for all model loading. The callback returns an options object that is applied by default in all model-load calls. The signature should look like: function(bubble, data) => Object
     * @property {string} [options.viewerUnits] - If specified, all models are re-scale
     * @throws Will throw an error if input is invalid
     * @private
     */
    #validateOptions(opts) {
      if (!this.#isValidOptions(opts))
        throw new Error(`[MultipleModelUtil]: Invalid options or invalid \`options.getCustomLoadOptions\` while using \`MultipleModelAlignmentType.Custom\``);
    }
  
    /**
     * @type {Object} options The alignment setup
     * @property {MultipleModelAlignmentType} [options.alignment] The alignment type: CenterToCenter, OriginToOrigin, ShareCoordinates, or Custom
     * @property {function} [options.getCustomLoadOptions] Allows for applying custom options to be used for all model loading. The callback returns an options object that is applied by default in all model-load calls. The signature should look like: function(bubble, data) => Object
     * @property {string} [options.viewerUnits] - If specified, all models are re-scale
     */
    get options() {
      return this.#options;
    }
  
    /**
     * @param {Object} opts The alignment setup
     * @property {MultipleModelAlignmentType} [options.alignment] The alignment type: CenterToCenter, OriginToOrigin, ShareCoordinates, or Custom
     * @property {function} [options.getCustomLoadOptions] Allows for applying custom options to be used for all model loading. The callback returns an options object that is applied by default in all model-load calls. The signature should look like: function(bubble, data) => Object
     * @property {string} [options.viewerUnits] - If specified, all models are re-scale
     */
    set options(opts) {
      this.#validateOptions(opts);
      this.#options = opts;
    }
  
    /**
     * Process Forge URNs
     * @param {Object[]} data Model data to be loaded, e.g. [ { name: 'house.rvt', urn: 'dXJuOmFkc2sub2JqZWN0c....' } ]
     * @returns {Promise}
     */
    async processModels(data) {
      //process each promise
      //refer to http://jsfiddle.net/jfriend00/h3zaw8u8/
      const promisesInSequence = (tasks, callback) => {
        const results = [];
        return tasks.reduce((p, item) => {
          return p.then(() => {
            return callback(item).then((data) => {
              results.push(data);
              return results;
            });
          });
        }, Promise.resolve());
      };
  
      //start to process
      const results = await promisesInSequence(data, (d) => this.loadDocumentPromised(d));
      this.#viewer.fireEvent({
        type: AGGREGATE_GEOMETRY_LOADED_EVENT,
        models: results
      });
    }
  
    /**
     * Promised function for loading Forge derivative manifest
     * @param {Object} data Model data to be loaded, e.g. { name: 'house.rvt', urn: 'dXJuOmFkc2sub2JqZWN0c....' }
     * @returns {Promise} Loaded viewer model
     */
    loadDocumentPromised(data) {
      return new Promise((resolve, reject) => {
  
        const onDocumentLoadSuccess = (doc) => {
          console.log(`%cDocument for \`${data.name}\` Load Succeeded!`, 'color: blue');
  
          doc.downloadAecModelData(() => {
            // Load model
            this.loadModelPromised(
              data,
              doc,
              onLoadModelSuccess,
              onLoadModelError
            );
          });
        }
  
        const onDocumentLoadFailure = (error) => {
          console.error(`Document for \`${data.name}\` Load Failure, error: \`${error}\``);
        }
  
        const onLoadModelSuccess = (model) => {
          console.log(`%cModel for \`${data.name}\` Load Succeeded!`, 'color: blue');
  
          this.#viewer.addEventListener(
            Autodesk.Viewing.GEOMETRY_LOADED_EVENT,
            onGeometriesLoaded
          );
        }
  
        const onLoadModelError = (error) => {
          const msg = `Model for \`${data.name}\` Load Failure, error: \`${error}\``;
          console.error(msg);
  
          reject(msg);
        }
  
        const onGeometriesLoaded = (event) => {
          this.#viewer.removeEventListener(
            Autodesk.Viewing.GEOMETRY_LOADED_EVENT,
            onGeometriesLoaded
          );
  
          const msg = `Geometries for \`${data.name}\` Loaded`;
  
          console.log(`%c${msg}`, 'color: blue');
          resolve({ name: data.name, model: event.model });
        }
  
        // Main: Load Forge derivative manifest
        Autodesk.Viewing.Document.load(
          data.urn,
          onDocumentLoadSuccess,
          onDocumentLoadFailure
        );
      });
    }
  
    /**
     * Promised function for loading model from the Forge derivative manifest.
     * By default, it loads the first model only.
     * @param {Document} doc Forge derivative manifest representing the model document
     * @param {Function} onLoadModelSuccess Success callback function that will be called while the model was loaded by the Forge Viewer.
     * @param {Function} onLoadModelError Error callback function that will be called while loading model was failed.
     */
    loadModelPromised(data, doc, onLoadModelSuccess, onLoadModelError) {
      let { viewRole, viewGuid, viewerUnits, name } = data;
      viewRole = viewRole || '3d';
  
      const rootItem = doc.getRoot();
      const filter = { type: 'geometry', role: viewRole };
      if (viewGuid)
        filter.viewableID = viewGuid;
  
      const viewables = rootItem.search(filter);
  
      if (viewables.length === 0) {
        return onLoadModelError('Document contains no viewables.');
      }
  
      const viewer = this.#viewer;
  
      // Take the first viewable out as the loading target
      const bubble = viewables[0];
  
      let loadOptions = {
        modelNameOverride: name,
        applyScaling: viewerUnits
      };
  
      let globalOffset = null;
  
      switch (this.#options.alignment) {
        case MultipleModelAlignmentType.ShareCoordinates:
          globalOffset = viewer.model?.getData().globalOffset;
          const aecModelData = bubble.getAecModelData();
          if (aecModelData) {
            let tf = aecModelData && aecModelData.refPointTransformation;
            let refPoint = tf ? { x: tf[9], y: tf[10], z: 0.0 } : { x: 0, y: 0, z: 0 };
  
            const MaxDistSqr = 4.0e6;
            const distSqr = globalOffset && THREE.Vector3.prototype.distanceToSquared.call(refPoint, globalOffset);
            if (!globalOffset || distSqr > MaxDistSqr) {
              globalOffset = new THREE.Vector3().copy(refPoint);
            }
          }
  
          loadOptions.applyRefPoint = true;
          loadOptions.globalOffset = globalOffset;
          break;
        case MultipleModelAlignmentType.OriginToOrigin:
          globalOffset = viewer.model?.getData().globalOffset;
          loadOptions.globalOffset = globalOffset;
          break;
        case MultipleModelAlignmentType.Custom:
          loadOptions = Object.assign({}, loadOptions, this.options.getCustomLoadOptions(bubble, data));
          break;
      }
  
      // If no model was loaded, start the viewer and load model together
      if (!viewer.model && !viewer.started) {
        return viewer.startWithDocumentNode(doc, bubble, loadOptions)
          .then(onLoadModelSuccess)
          .catch(onLoadModelError);
      }
  
      if (viewer.model) {
        loadOptions.keepCurrentModels = true;
      }
  
      viewer.loadDocumentNode(doc, bubble, loadOptions)
        .then(onLoadModelSuccess)
        .catch(onLoadModelError);
    }
  }
  
  MultipleModelUtil.AGGREGATE_GEOMETRY_LOADED_EVENT = AGGREGATE_GEOMETRY_LOADED_EVENT;

  //Expose to global
  parent.MultipleModelAlignmentType = MultipleModelAlignmentType;
  parent.MultipleModelUtil = MultipleModelUtil;
})(window);