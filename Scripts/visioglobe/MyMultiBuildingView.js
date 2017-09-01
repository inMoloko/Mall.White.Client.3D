/**
 * Created by Nekrasov on 7/17/2017.
 */
/* eslint-disable max-len, brace-style, no-mixed-spaces-and-tabs, comma-dangle, no-var, guard-for-in, new-cap */
/**
 * @fileOverview
 * Contains an application level helper class for displaying maps with MultiBuilding Storyboard.
 * It is furnished as an example, and can be customized or used as a starting point by the developer.
 *
 * It assumes mapviewer.web.js or mapviewer.web2d.js has already been loaded (for place bubble and routes)
 *
 */


/*
 approach

 parse mapviewer.getExtraData().config.venue_layout
 // This API is available since VisioKiosk (now named VisioWeb) 1.7.17


 goTo(partial ExploreState, animated?)

 The ExploreState is:
 mode?: global|building|floor,
 buildingID?: string
 floorID?: string
 place?|viewpoint? {position, pitch? heading?}


 getMode()
 getBuildings() -> array of VgBuilding's already sorted by displayIndex
 getBuilding(name) -> VgBuilding|false

 getCurrentExploreState()

 ExploreState
 currentMode
 currentBuildingID
 currentFloorID
 viewpoint

 // Has no information from the mapviewer.
 Venue
 hasGlobalLayer
 globalLayerID
 defaultBuildingIndex
 buildings (sorted by displayIndex which is good from UI perspective)
 viewpoint
 footprint

 Building object
 id
 name
 shortname
 description

 venue back pointer

 groundFloor
 defaultFloor
 floors (sorted by levelIndex which is good from the UI perspective)
 displayIndex
 viewpoint, footprint, point
 modelPOI

 Floor object
 id
 name
 shortname
 description
 levelIndex
 viewpoint, footprint, center
 building back pointer


 Trigger Signals
 modeWillChange: current,target
 MyMultiBuildingView.exploreStateChanged
 MyMultiBuildingView.exploreStateWillChange
 */

var multiBuildingView;

/**
 * @public
 * @name MyMultiBuildingView
 * @class
 * @constructor MyMultiBuildingView
 *
 * @description
 * Initial implementation of multi-building storyboard, it is subject to change in future versions.
 *
 * <br>Requirements:</br>
 * <ul>
 * <li>Dataset should be published with sdk.web=1.7.14 or sdk.web2d=1.7.14</li>
 * </ul>
 *
 * <br>Storyboard:</br>
 * <ul>
 * <li>There are three modes: Global, Building, Floor</li>
 * <li>View starts in the global View</li>
 * <li>clicking on any building, will change into building mode focusing on a single building</li>
 * <li>the building view shows all the floors of a building as a stack</li>
 * <li>clicking on any floor, will change the floor in building view then pass onto floor view</li>
 * <li>clicking the global button will bring you back to global view</li>
 * <li>clicking the buiding name button will bring you to the building view</li>
 * <li>mouseover/out has been commented out on mapviewer.web.js</li>
 * <li>clicking on a show will display bubble.
 *     clicking set origin, will add Start Pin,
 *     clicking set destination will add End Pin if no Start Pin, otherwise will compute route
 * </li>
 * <li>When routes are computed, stepping through instructions in Building view will only change the floor.</li>
 * <li>When routes are viewed in Building View, there is a Link that connects the routes through different floors.</li>
 * </ul>
 *
 * Triggers signals: 'MyMultiBuildingView.exploreStateChanged', 'MyMultiBuildingView.exploreStateWillChange'
 *
 * @param {vg.mapviewer.web.Mapviewer|vg.mapviewer.web2d.Mapviewer} mapviewer
 * @param {Object} venueLayout describes the venue layout. Usually mapviewer.getExtraData().config.venue_layout
 * @param {Object} venueLayoutLocalization describes the .name, .shortName, .description for each building and floor.
 *        Usually mapviewer.getExtraData().resources[language].localized.locale[language].venueLayout
 *       {'B3': { name: 'building 3', description: 'my building', shortName: 'bldg3'}, 'B2'....}
 * @param {Object} parameters
 * @param {string} parameters.containerDivSelector selector, e.g. #container to find the right div where the mapviewer and map are on.
 *
 * @example
 // for the most part, we go for the defaults
 var parameters = {
	'containerDivSelector': '#container'
};
 multiBuildingView = new MyMultiBuildingView(mapviewer,mapviewer.getExtraData().config.venue_layout, parameters);
 * @since 1.7.17
 * @since 1.7.18 Experimental "multi-floor" mode, for datasets not configured in multi-building on the mapeditor side.
 */
var MyMultiBuildingView = function (mapviewer, venueLayout, venueLayoutLocalization, parameters) {
    let self = this;
    // turn this on for more console printouts.
    this.debug = false;
    this.defaultPosition = {x: 300, y: 0, z: 0};
    this.mapviewer = mapviewer;
    this.mapviewerFloorByID = {};
    // Parse venueLayout
    var mapviewerFloors = mapviewer.getFloors();
    var i;
    var l;
    var mapviewerFloor;
    for (i = 0, l = mapviewerFloors.length; i < l; i++) {
        mapviewerFloor = mapviewerFloors[i];
        // disable all floors at start
        mapviewerFloor.setEnabled(false);
        this.mapviewerFloorByID[mapviewerFloor.name] = mapviewerFloor;
    }

    this.venueLayout = MyMultiBuildingView.parseVenueLayout(mapviewer, this.mapviewerFloorByID, venueLayout);
    this.setVenueLayoutLocalization(venueLayoutLocalization);

    this.parameters = parameters;

    // ExploreState
    this.exploreState = {
        mode: 'global',
    };


    // function checkElseDefault(value,d)
    // {
    // 	return (typeof(value) === 'undefined') ? d : value;
    // };
    //
    // parameters = parameters || {};
    //
    // // the mapviewer changeFloor and camera.goTo functions will be overridden.
    this.originalChangeFloorFunction = mapviewer.changeFloor;
    // this.originalGoToFunction = mapviewer.camera.goTo;
    // this.originalGetCurrentFloorFunction = mapviewer.getCurrentFloor;

    // Override (carefully) two commonly used mapviewer functions since they might be
    // used elsewhere, notably MyRoute, and MyNavigation
    mapviewer.changeFloor = this.changeFloorOverride.bind(this);
    mapviewer.getCurrentFloor = this.getCurrentFloorOverride.bind(this);
    // mapviewer.camera.goTo = this.cameraGoToOverride.bind(this);

    // DIV where the mapviewer is initialized
    this.container = jQuery(parameters.containerDivSelector);
    this.customPreManipulatorStartCenter = false;
    this.containerHeight = parseInt(this.container.css('height'), 10);
    this.containerWidth = parseInt(this.container.css('width'), 10);

    // number of pixels of vertical drag before switching floors in building mode
    this.verticalPanChangeFloorThreshold = this.containerHeight * 0.1;

    this.activeBuildingMarkerPOIs = {};
    this.inactiveBuildingMarkerPOIs = {};
    this.setupActiveBuildingMarkerPOIs();


    // On VisioKiosk (now named VisioWeb) 1.7.17, the mouseup callback should only get one element
    // when clicking on POIs.
    // Clicking on Building Model or marker should go into building mode.
    mapviewer.on('mouseup', function (ev) {
        // console.log('CALLBACK mouseup '+ev.args.element);
        var element = ev.args.element;
        if (jQuery.isArray(element)) {
            console.log('WARNING getting array maybe many POIs, should not happen on VisioWeb 1.7.17+');
            return;
        }
        if (element && element.options) {
            var id = element.options('id');
            if (typeof(multiBuildingView.venueLayout.buildingByID[id]) !== 'undefined') {
                setTimeout(function () {
                    // make it asynchrone, because otherwise on the custom manipulator will get the tap event
                    multiBuildingView.goTo({mode: 'building', buildingID: id, floorID: MyMultiBuildingView.DEFAULT});
                }, 0);
                // stop other events.
                return false;
            }
        }
    });


    this.isWeb2D = false;
    if (mapviewer.sdkType === 'web2d') {
        this.isWeb2D = true;
        this.buildingModeEnabled = false;
        this.buildingAndFloorModePaddingFactor = 0;
        this.globalModePaddingFactor = 0;

        // these values don't exist or can't be animated on VisioWeb2D
        this.floorAnimationDuration = 0;
        this.headingAnimationDuration = 0;
        this.pitchAnimationDuration = 0;

        /* There is a lot of functionality that does not apply to VisioWeb2D
         * there are two approaches, we can either "disconnect" all the places where that is used
         * or "mock" the missing interfaces.  We choose for simplicity the later.
         */
        var floors = mapviewer.getFloors();
        var floor;
        var noop = function () {
        };
        var floorFunctionsToMock = {
            setPosition: noop,
            getPosition: function () {
                return {x: 0, y: 0, z: 0};
            },
            setAutoUpdateLOD: noop,
            getLODs: function () {
                return [];
            }
        };
        var cameraFunctionsToMock = {
            setManipulator: noop,
            getManipulator: noop,
            setCustomPreManipulatorListener: noop,
            getCustomPreManipulatorListener: function () {
                return false;
            }
        };
        for (var i in floors) {
            floor = floors[i];
            for (var func in floorFunctionsToMock) {
                if (typeof(floor[func]) !== 'function') {
                    floor[func] = floorFunctionsToMock[func];
                }
            }
        }
        for (var func in cameraFunctionsToMock) {
            if (typeof(mapviewer.camera[func]) !== 'function') {
                mapviewer.camera[func] = cameraFunctionsToMock[func];
            }
        }
    }
};

/**
 * @public
 * @name multifloorCompatibilityMode
 * @field
 * @type number
 * @memberOf MyMultiBuildingView.prototype
 * @description
 * Changes some parameters to have a view close to multifloor stack view:
 * In building mode see all floors, in floor mode see only active floor;
 * In building mode use always lod 0, in floor let auto;
 * Content is always enabled, even on forced lod;
 * floors move out of the way on the right direction when switching floors in 'floor' mode;
 * in compatibility mode hide route links in floor mode;
 * save initial position for building mode if no footprint;
 * When no footprint is found we use the inital camera position
 *
 * gap between floors, if no mapviewer.getExtraData() is in synthesizeVenueLayout
 * @since 1.7.18?
 */
MyMultiBuildingView.prototype.multifloorCompatibilityMode = false;

/**
 * @public
 * @name DEFAULT
 * @constant
 * @type string
 * @memberOf MyMultiBuildingView.prototype
 * @description
 * value to indicate that one would like to go to the default floor or building.
 * @example MyMultiBuildingView#goTo
 multiBuildingView.goTo({
     mode: 'global',
     buildingID: MyMultiBuildingView.DEFAULT,
     floorID: MyMultiBuildingView.DEFAULT,
     animationDuration: 0
 });
 */
MyMultiBuildingView.DEFAULT = '<DEFAULT VALUE>';

/**
 * @public
 * @name floorModePaddingFactor
 * @field
 * @type number
 * @memberOf MyMultiBuildingView.prototype
 * @description
 * padding as a percentage of the border of the screen that the building mode view point should be calculated using getViewPointFromPositions().
 * values should range from 0 to 0.5.  Default value is 0.1 for VisioWeb and 0.0 for VisioWeb2D.
 */
MyMultiBuildingView.prototype.floorModePaddingFactor = 0.1;


/**
 * @public
 * @name buildingModePaddingFactor
 * @field
 * @type number
 * @memberOf MyMultiBuildingView.prototype
 * @description
 * padding as a percentage of the border of the screen that the building mode view point should be calculated using getViewPointFromPositions().
 * values should range from 0 to 0.5.  Default value is 0.1 for VisioWeb and 0.0 for VisioWeb2D.
 */
MyMultiBuildingView.prototype.buildingModePaddingFactor = 0.1;
/**
 * @public
 * @name globalModePaddingFactor
 * @field
 * @type number
 * @memberOf MyMultiBuildingView.prototype
 * @description
 * padding as a percentage of the border of the screen that global mode view point should be calculated using getViewPointFromPositions().
 * values should range from 0 to 0.5.  Default value is 0.
 */
MyMultiBuildingView.prototype.globalModePaddingFactor = 0.0;

/**
 * @public
 * @name buildingModeEnabled
 * @field
 * @type boolean
 * @memberOf MyMultiBuildingView.prototype
 * @description
 * Determines whether buildingMode should be allowed, otherwise it will only use global and floor mode.
 * default is true.
 */
MyMultiBuildingView.prototype.buildingModeEnabled = true;

/**
 * @public
 * @name globalModePitch
 * @field
 * @type number
 * @memberOf MyMultiBuildingView.prototype
 * @description
 * Camera pitch in degrees for global mode.  default is -50.
 * @see MyMultiBuildingView#goTo
 */
MyMultiBuildingView.prototype.globalModePitch = -50;
/**
 * @public
 * @name buildingModePitch
 * @field
 * @type number
 * @memberOf MyMultiBuildingView.prototype
 * @description
 * Camera pitch in degrees for building mode.  default is -35.
 * @see MyMultiBuildingView#goTo
 */
MyMultiBuildingView.prototype.buildingModePitch = -20;
/**
 * @public
 * @name floorModePitch
 * @field
 * @type number
 * @memberOf MyMultiBuildingView.prototype
 * @description
 * Camera pitch in degrees for foo mode.  default is -50.
 * @see MyMultiBuildingView#goTo
 */
MyMultiBuildingView.prototype.floorModePitch = -50;

/**
 * @public
 * @name floorAnimationDuration
 * @field
 * @type number
 * @memberOf MyMultiBuildingView.prototype
 * @description
 * duration in seconds for animating floors in and out, overridden if animationDuration is passed to goTo().  default value is 0.7 second.
 * @see MyMultiBuildingView#goTo
 */
MyMultiBuildingView.prototype.floorAnimationDuration = 0.7; // in seconds
/**
 * @public
 * @name pitchAnimationDuration
 * @field
 * @type number
 * @memberOf MyMultiBuildingView.prototype
 * @description
 * duration in seconds for animating the camera pitch when changing modes, overridden if animationDuration is passed to goTo().  default value is 0.7 second.
 * @see MyMultiBuildingView#goTo
 */
MyMultiBuildingView.prototype.pitchAnimationDuration = 0.7; // in seconds
/**
 * @public
 * @name headingAnimationDuration
 * @field
 * @type {number}
 * @memberOf MyMultiBuildingView.prototype
 * @description
 * duration in seconds for animating the camera heading when changing modes, overridden if animationDuration is passed to goTo().  default value is 0.7 second.
 * @see MyMultiBuildingView#goTo
 */
MyMultiBuildingView.prototype.headingAnimationDuration = 0.7; // in seconds
/**
 * @public
 * @name cameraPositionAnimationDuration
 * @field
 * @type number
 * @memberOf MyMultiBuildingView.prototype
 * @description
 * duration in seconds for animating the camera position when changing modes, overridden if animationDuration is passed to goTo().  default value is 0.7 second.
 * @see MyMultiBuildingView#goTo
 */
MyMultiBuildingView.prototype.cameraPositionAnimationDuration = 0.5; // in seconds
/**
 * @public
 * @name buildingModelAnimationDurationUp
 * @field
 * @type number
 * @memberOf MyMultiBuildingView.prototype
 * @description
 * duration in seconds for animating buildings going up. Default is 0.7 seconds.
 * @see MyMultiBuildingView#goTo
 * @since 1.7.19
 */
MyMultiBuildingView.prototype.buildingModelAnimationDurationUp = 0.7; // in seconds
/**
 * @public
 * @name buildingModelAnimationDurationDown
 * @field
 * @type number
 * @memberOf MyMultiBuildingView.prototype
 * @description
 * duration in seconds for animating buildings going down.  Default is 0 seconds.
 * @see MyMultiBuildingView#goTo
 * @since 1.7.19
 */
MyMultiBuildingView.prototype.buildingModelAnimationDurationDown = 0.0; // in seconds

MyMultiBuildingView.prototype.stackHeight = 30;
/**
 * @public
 * @name stackHeightFarAway
 * @field
 * @type number
 * @memberOf MyMultiBuildingView.prototype
 * @description
 * distance above the ground that layers will be sent to, before they are hidden. default value is 750.
 */
MyMultiBuildingView.prototype.stackHeightFarAway = 750;

/**
 * @public
 * @name buildingMarkerHeight
 * @field
 * @type number
 * @memberOf MyMultiBuildingView.prototype
 * @description
 * distance above the ground building markers on the global view will be placed. default value is 50.
 */
MyMultiBuildingView.prototype.buildingMarkerHeight = 50;
/**
 * @public
 * @name buildingMarkerScale
 * @field
 * @type number
 * @memberOf MyMultiBuildingView.prototype
 * @description
 * scale size for building markers on the global view. default value is 30.
 */
MyMultiBuildingView.prototype.buildingMarkerScale = 30;

/*
 * @return false or an explore state with any missing information filled in.
 */
/**
 * @private
 * @name resolveExploreState
 * @memberOf MyMultiBuildingView.prototype
 * @function
 *
 * @description
 * given a exploreState (usually coming from goTo), it will fill in any missing elements if needed,
 * resolve DEFAULT buildings or floors, handle the case when there is no global layer.
 * @param {VgExploreState} exploreState
 * @return {VgExploreState} resolvedExploreState with mode, buildingID, floorID filled in if necessary.
 *
 * @see MyMultiBuildingView#goTo
 * @see MyMultiBuildingView#getMapStateForExploreState
 * @see MyMultiBuildingView#applyMapState
 * @since 1.7.17
 */
MyMultiBuildingView.prototype.resolveExploreState = function (exploreState) {
    var venueLayout = this.venueLayout;
    var mapviewer = this.mapviewer;

    var targetPlace;
    var targetBuildingID;
    var targetFloorID;
    var targetBuilding;
    var targetViewpoint;
    var targetMode;

    var mapviewerTargetPlace;

    var resolvedExploreState = {};

    // If the user requested global layer id as floor, then force global mode.
    // if (exploreState.floorID === venueLayout.globalLayerID)
    // {
    //     exploreState.mode = 'global';
    //     exploreState.floorID = undefined;
    // }

    // has RequestedPlace?
    if (typeof(exploreState.place) !== 'undefined') {
        targetPlace = exploreState.place;

        // Does requested place live in outside layer
        mapviewerTargetPlace = mapviewer.getPlace(targetPlace);
        if (mapviewerTargetPlace) {
            if (mapviewerTargetPlace.vg && mapviewerTargetPlace.vg.floor &&
                mapviewerTargetPlace.vg.floor == venueLayout.globalLayerID) {
                resolvedExploreState = {mode: 'global', place: targetPlace};
            }
            else {
                targetFloorID = mapviewerTargetPlace.vg.floor;
                targetBuilding = venueLayout.buildingByFloorID[targetFloorID];
                if (typeof(targetBuilding) === 'undefined') {
                    console.log('ERROR cannot find building for floorID: ' + targetFloorID);
                    return false;
                }
                targetBuildingID = targetBuilding.id;
                // validate floorID
                if (typeof(targetBuilding.floorByID[targetFloorID]) === 'undefined') {
                    console.log('ERROR cannot find floorID: ' + targetFloorID + ' in building ' + targetBuildingID);
                    return false;
                }
                resolvedExploreState = {
                    mode: 'floor',
                    buildingID: targetBuildingID,
                    floorID: targetFloorID,
                    place: targetPlace
                };
            }
        }
        else {
            return false;
        }
        return resolvedExploreState;
    }


    // WARNING not validated to be in the workflow
    if (exploreState.buildingID === MyMultiBuildingView.DEFAULT) {
        if (this.venueLayout.defaultBuildingIndex !== false) {
            exploreState.buildingID = venueLayout.buildings[this.venueLayout.defaultBuildingIndex].id;
        }
        else {
            exploreState.buildingID = undefined;
            // rollback floor.
            if (exploreState.floorID === MyMultiBuildingView.DEFAULT) {
                exploreState.floorID = undefined;
            }
        }
    }

    // Has Requested Building
    if (typeof(exploreState.buildingID) !== 'undefined') {
        targetBuildingID = exploreState.buildingID;
        targetBuilding = venueLayout.buildingByID[targetBuildingID];
        if (typeof(targetBuilding) === 'undefined') {
            console.log('ERROR cannot find building for floorID: ' + targetFloorID);
            return false;
        }

        // Has Requested Floor
        if (typeof(exploreState.floorID) !== 'undefined' && exploreState.floorID !== MyMultiBuildingView.DEFAULT) {
            targetFloorID = exploreState.floorID;
        }
        else {
            targetFloorID = targetBuilding.floors[targetBuilding.defaultFloorIndex].id;
        }
    }
    // Has Requested Floor
    else if (typeof(exploreState.floorID) !== 'undefined') {
        // Is RequestedFloor == global layer
        if (exploreState.floorID === venueLayout.globalLayerID) {
            // targetFloorID = undefined;
            exploreState.mode = 'global';
            targetFloorID = this.exploreState.floorID;
            targetBuildingID = this.exploreState.buildingID;
        }
        else {
            targetFloorID = exploreState.floorID;
            targetBuilding = venueLayout.buildingByFloorID[targetFloorID];
            if (typeof(targetBuilding) === 'undefined') {
                console.log('ERROR cannot find building for floorID: ' + targetFloorID);
                return false;
            }
            targetBuildingID = targetBuilding.id;
            // validate floorID
            if (typeof(targetBuilding.floorByID[targetFloorID]) === 'undefined') {
                console.log('ERROR cannot find floorID: ' + targetFloorID + ' in building ' + targetBuildingID);
                return false;
            }
        }
    }
    else {
        targetFloorID = this.exploreState.floorID;
        targetBuildingID = this.exploreState.buildingID;
    }

    // Has Requested Mode
    if (typeof(exploreState.mode) !== 'undefined') {
        targetMode = exploreState.mode;
    }
    else {
        targetMode = this.exploreState.mode;
    }

    // Is Mode == global
    if (targetMode == 'global') {
        // Is Global mode available
        if (venueLayout.hasGlobalLayer) {
            // next step is has Viewpoint
        }
        else {
            console.log('WARNING, global mode requested, but does not exist');
            targetMode = 'building';
        }
    }

    if (targetMode == 'building' || targetMode == 'floor') {
        // FocusedBuilding = calc
        if (typeof(targetBuildingID) === 'undefined') {
            // if there is a default building, pick that
            // otherwise pick first building


            // pick first Building
            if (venueLayout.buildings.length > 0) {
                targetBuildingID = venueLayout.buildings[0].id;
            }
        }
        // FocusedFloor = calc
        // if there is a default floor, pick that
        // otherwise pick floor with level 0
        if (typeof(targetFloorID) === 'undefined') {
            targetBuilding = venueLayout.buildingByID[targetBuildingID];
            if (targetBuilding && targetBuilding.floors.length > 0) {
                targetFloorID = targetBuilding.floors[0].id;
            }
        }
    }

    if (targetMode == 'building') {
        // Is Building Mode enabled
        if (this.buildingModeEnabled) {
            // Is Building Mode available?
            // Building mode is available if focused building has more than one floor
            targetBuilding = venueLayout.buildingByID[targetBuildingID];
            if (targetBuilding && targetBuilding.floors.length > 1) {
            }
            else {
                targetMode = 'floor';
            }
        }
        else {
            targetMode = 'floor';
        }
    }

    // Is Mode == floor
    if (targetMode == 'floor') {
        // Is Floor Mode available?
        // Floor Mode is available if there is focused building.
        targetBuilding = venueLayout.buildingByID[targetBuildingID];
        if (targetBuilding) {

        }
        else {
            if (venueLayout.hasGlobalLayer) {
                targetMode = 'global';
                console.log('WARNING, requesting a floor, but no focused building, fallback to global');
            }
            else {
                console.log('ERROR, no focused building, and no global mode');
            }
        }
    }


    // Has Requested ViewPoint
    if (typeof(exploreState.viewpoint) !== 'undefined') {
        // FocusedViewPoint = RequestedViewPoint
        targetViewpoint = exploreState.viewpoint;
        // Is Mode == building
        // If so give error, and remove viewpoint, we don't accept viewpoint in building mode.
        if (targetMode == 'building') {
            // HANDLE VIEWPOINT
            console.log('WARNING: asking for a viewpoint in building mode not possible');
            targetViewpoint = undefined;
        }
    }


    if ((targetMode === 'building' || targetMode === 'floor')
        && (typeof(targetFloorID) === 'undefined' || typeof(targetBuildingID) === 'undefined')
    ) {
        // Is Global Mode available?
        if (venueLayout.hasGlobalLayer) {
            targetMode = 'global';
            console.log('WARNING: targetMode was building or floor, but invalid targetFloor or targetBuilding: ' + targetFloorID + '/' + targetBuildingID);
        }
        else {
            console.log('ERROR: invalid targetFloor or targetBuilding, and no global mode to fallback to');
        }
    }

    resolvedExploreState = {
        mode: targetMode,
        buildingID: targetBuildingID,
        floorID: targetFloorID
    };
    if (typeof(targetViewpoint) !== 'undefined') {
        resolvedExploreState.viewpoint = targetViewpoint;
    }
    return resolvedExploreState;
};

/**
 * @name goTo
 * @memberOf MyMultiBuildingView.prototype
 * @function
 *
 * @description
 * Goto a explore state.
 * Triggers signals: 'MyMultiBuildingView.exploreStateWillChange' with arguments .target, .current and .view , and
 *  'MyMultiBuildingView.exploreStateChanged' with arguments .current, .previous and .view
 *
 * @param {Object} exploreState
 * @param {string} [exploreState.mode] mode one of 'global', 'building', 'floor'
 * @param {string} [exploreState.buildingID=MyMultiBuildingView.DEFAULT]
 * @param {string} [exploreState.floorID=MyMultiBuildingView.DEFAULT]
 * If it is the same as the current floor, the done() function is called directly.
 * @param {boolean} [exploreState.noViewpoint=false] if true the camera position will not be updated to default viewpoint for mode.
 * @param {number} [exploreState.animationDuration=default for cameraPositionDuration, pitchAnimationDuration and headingAnimationDuration] Duration in seconds for cameraPosition, heading, and pitch animation, note that mapviewer.camera.goTo has different signature.
 * @param {number} [exploreState.cameraPositionAnimationDuration=this.cameraPositionAnimationDuration] Duration in seconds for animation of camera position change if any.
 * @param {number} [exploreState.pitchAnimationDuration=this.pitchAnimationDuration] Duration in seconds for animation of camera pitch change if any.
 * @param {number} [exploreState.headingAnimationDuration=this.headingAnimationDuration] Duration in seconds for animation of camera heading change if any.
 * @param {number} [exploreState.floorAnimationDuration=this.floorAnimationDuration] Duration in seconds for animation of floors (same as animationDuration for changeFloor())
 * @param {Object} [exploreState.viewpoint=viewpoint that shows the whole floor or outside] viewpoint has preference over place
 * @param {Object} [exploreState.viewpoint.position] viewpoint has preference over place
 * @param {Object} [exploreState.viewpoint.pitch] optional pitch, otherwise use default for mode.
 * @param {Object} [exploreState.viewpoint.heading] optional heading, otherwise use one defined on footprint for building or outside layer.
 * @return {jQuery.Deferred.Promise} where a done() or fail() callback can be added.
 *
 * @example
 multiBuildingView.goTo({mode: 'global',animationDuration: 0});
 multiBuildingView.goTo({
  mode: 'building',
  buildingID: 'B2',
  animationDuration: 0.5})
 .done(function(){... update UI here ....});

 multiBuildingView.goTo({
    mode: 'global',
    buildingID: MyMultiBuildingView.DEFAULT,
    floorID: MyMultiBuildingView.DEFAULT,
    animationDuration: 0
});

 multiBuildingView.goTo({
    mode: 'floor',
    floorID: 'B4-UL04',
    animationDuration: 0,
    viewpoint: {
      position: {x: -127.8117136719601, y: -135.464972367098, radius: 64.24722758526218}
    }
});
 * @since 1.7.17
 * @since 1.7.19 fixed doc for .noViewpoint and .animationDuration parameter
 * @since 1.7.21 can specify the duration for pitch,heading, camera position, floor individually.  Best just to update this.*animationDuration parameters.
 */
MyMultiBuildingView.prototype.goTo = function (exploreState) {
    var deferred = jQuery.Deferred();
    var result = deferred.promise();
    var mapviewer = this.mapviewer;

    if (this.debug) {
        console.log('CALL goTo(mode: ' + exploreState.mode + ', buildingID: ' + exploreState.buildingID + ', floorID: ' + exploreState.floorID);
    }

    var resolvedExploreState = this.resolveExploreState(exploreState);
    if (resolvedExploreState === false) {
        deferred.reject({message: 'resolveExploreState failed'});
        return result;
    }

    if (this.debug) {
        console.log('CALL goTo resolved(mode: ' + resolvedExploreState.mode + ', buildingID: ' + resolvedExploreState.buildingID + ', floorID: ' + resolvedExploreState.floorID);
    }

    var mapState = this.getMapStateForExploreState(resolvedExploreState);


    if (exploreState.noViewpoint) {
        mapState.cameraConfig = false;
    }

    var triggerResult = mapviewer.trigger('MyMultiBuildingView.exploreStateWillChange', {
        target: resolvedExploreState,
        current: this.getCurrentExploreState(),
        view: this
    });

    if (triggerResult === false) {
        deferred.reject({message: 'trigger handler for MyMultiBuildingView.exploreStateWillChange returned false'});
        return result;
    }
    ;

    var currentExploreState = this.getCurrentExploreState();

    // pass animation duration parameters
    if (typeof(exploreState.animationDuration) !== 'undefined') {
        mapState.pitchAnimationDuration = exploreState.animationDuration;
        mapState.headingAnimationDuration = exploreState.animationDuration;
        mapState.cameraPositionAnimationDuration = exploreState.animationDuration;
    }
    if (typeof(exploreState.pitchAnimationDuration) !== 'undefined') {
        mapState.pitchAnimationDuration = exploreState.pitchAnimationDuration;
    }
    if (typeof(exploreState.headingAnimationDuration) !== 'undefined') {
        mapState.headingAnimationDuration = exploreState.headingAnimationDuration;
    }
    if (typeof(exploreState.cameraPositionAnimationDuration) !== 'undefined') {
        mapState.cameraPositionAnimationDuration = exploreState.cameraPositionAnimationDuration;
    }
    if (typeof(exploreState.floorAnimationDuration) !== 'undefined') {
        mapState.floorAnimationDuration = exploreState.floorAnimationDuration;
    }

    this.applyMapState(mapState).done(function () {
        // maybe have previous?
        mapviewer.trigger('MyMultiBuildingView.exploreStateChanged', {
            current: resolvedExploreState,
            previous: currentExploreState,
            view: this
        });
        deferred.resolve();
    }.bind(this))
        .fail(function () {
            deferred.reject();
        });
    // THIS SHOULD BE DONE AT END
    // console.log('add signal will change/did change, and update at end');

    this.exploreState.mode = resolvedExploreState.mode;
    if (typeof(resolvedExploreState.buildingID) !== 'undefined') {
        this.exploreState.buildingID = resolvedExploreState.buildingID;
    }
    if (typeof(resolvedExploreState.floorID) !== 'undefined') {
        this.exploreState.floorID = resolvedExploreState.floorID;
    }

    return result;
};

/**
 * @name getMapStateForExploreState
 * @memberOf MyMultiBuildingView.prototype
 * @function
 *
 * @description
 * converts a given exploreState to a MapState describing
 * new layer positions, if 3D Models will be visible, camera position.
 * normally it does not have to be so robust as it will be called with a resolved state
 *
 * @param {Object} exploreState
 * @param {Object} [exploreState.mode]
 * @param {Object} [exploreState.buildingID] undefined (if mode is global) or valid buildingID, cannot be DEFAULT.
 * @param {Object} [exploreState.floorID] undefined (if mode is global) or valid floorID, cannot be DEFAULT.
 * @param {Object} [exploreState.place] placeID
 * @param {Object} [exploreState.noViewpoint] do not change the current viewpoint, do not animate camera.
 * @param {Object} [exploreState.viewpoint] viewpoint has preference over place
 * @param {Object} [exploreState.viewpoint.position] viewpoint has preference over place
 * @param {Object} [exploreState.viewpoint.pitch] optional pitch, otherwise use default for mode.
 * @param {Object} [exploreState.viewpoint.heading] optional heading, otherwise use one defined on footprint for building or outside layer.
 * If it is the same as the current floor, the done() function is called directly.
 * @param {Object}[options] Additional options to change floor.
 * @return {MapState}
 *
 * @since 1.7.17
 * @since 1.7.18 fixed exploreState.viewpoint.pitch and heading, and added exploreState.noViewpoint to skip moving the camera.
 */
MyMultiBuildingView.prototype.getMapStateForExploreState = function (exploreState) {
    let self = this;
    var venueLayout = this.venueLayout;
    var mapviewer = this.mapviewer;

    // Similar to VisioMove getLayerConfigs
    var mapState = {
        targetLevelIndex: false,
        layerConfig: {},
        cameraConfig: {},
        buildingModels: {},
        manipulator: 'map',

        floorAnimationDuration: this.floorAnimationDuration,
        pitchAnimationDuration: this.pitchAnimationDuration,
        headingAnimationDuration: this.headingAnimationDuration,
        cameraPositionAnimationDuration: this.cameraPositionAnimationDuration,
        buildingModelAnimationDurationUp: this.buildingModelAnimationDurationUp,
        buildingModelAnimationDurationDown: this.buildingModelAnimationDurationDown
    };

    var targetMode = exploreState.mode;
    var targetBuildingID = exploreState.buildingID;
    var targetBuilding;
    var targetFloorID = exploreState.floorID;
    var targetFloor;

    if (typeof(targetBuildingID) !== 'undefined') {
        targetBuilding = venueLayout.buildingByID[targetBuildingID];
        if (typeof(targetBuilding) === 'undefined') {
            console.log('ERROR: unknown targetBuildingID: ' + targetBuildingID);
            return false;
        }

        if (typeof(targetFloorID) === 'undefined') {
            console.log('ERROR: unknown targetFloorID: ' + targetFloorID);
            return false;
        }
        targetFloor = targetBuilding.floorByID[targetFloorID];

        if (typeof(targetFloor) === 'undefined') {
            console.log('ERROR: unknown targetFloorID ' + targetFloorID);
            return false;
        }

        mapState.targetLevelIndex = targetFloor.levelIndex;
    }


    // For testing.
    if (targetMode !== 'global' &&
        (typeof(targetFloor) === 'undefined' || typeof(targetBuilding) === 'undefined') && this.debug) {
        debugger;
    }

    // Update layerConfig for globalLayer
    var globalLayerConfig;
    if (venueLayout.hasGlobalLayer) {
        switch (targetMode) {
            case 'global':
                globalLayerConfig = {
                    lod: 'auto',
                    position: {x: 0, y: 0, z: 0},
                    visible: true
                };
                break;
            case 'building':
            case 'floor':

                if (targetFloor.levelIndex >= 0) {
                    globalLayerConfig = {
                        lod: 'auto',
                        // TODO PARAMETER STACK HEIGHT
                        // position: {x: 0,y: 0, z: -1.0 * targetFloor.levelIndex * this.stackHeight},
                        position: {
                            x: 0,
                            y: 0,
                            z: -targetFloor.groundStackHeight
                        },
                        visible: true
                    };
                }
                else {
                    globalLayerConfig = {
                        lod: 'auto',
                        position: {x: 0, y: 0, z: this.stackHeightFarAway},
                        visible: false
                    };
                }
                break;
        }
        mapState.layerConfig[venueLayout.globalLayerID] = globalLayerConfig;
    }
    // for debugging
    // globalLayerConfig.visible = false;

    // Floor animation
    // For zoom storyboard, if going from global->floor, or floor->floor from a different building
    // set floorAnimationDuration to 0.
    if (targetMode === 'floor' &&
        (this.exploreState.mode === 'global'
            || (this.exploreState.mode === 'floor' && this.exploreState.buildingID !== targetBuildingID)
        )
    ) {
        mapState.floorAnimationDuration = 0;
    }

    var building;
    var floor;
    var bi;
    var fi;
    var floorLayerConfig = {};

    // Update layerConfig
    for (bi in venueLayout.buildings) {
        building = venueLayout.buildings[bi];
        for (fi in building.floors) {
            floor = building.floors[fi];
            switch (targetMode) {
                case 'global':

                    if (floor.levelIndex <= 0) {
                        floorLayerConfig = {
                            lod: 'auto',
                            // TODO PARAMETER STACK HEIGHT
                            // position: {x: 0,y: 0, z: 1.0 * floor.levelIndex * this.stackHeight},
                            position: {
                                x: 0,
                                y: 0,
                                z: floor.groundStackHeight
                            },
                            visible: false,
                            immediateVisible: false
                        };
                    }
                    else {
                        floorLayerConfig = {
                            lod: 'auto',
                            position: {
                                x: 0,
                                y: 0,
                                z: this.stackHeightFarAway
                            },
                            visible: false,
                            immediateVisible: false
                        };
                    }
                    break;
                case 'building':
                case 'floor':
                    if (building.id == targetBuildingID) // walkway storyboard: || (targetFloor.levelIndex == 3 && floor.levelIndex == targetFloor.levelIndex)
                    {
                        var floorShouldBeVisible = (this.isWeb2D) ?
                            (floor.levelIndex == targetFloor.levelIndex) : // display only the last floor
                            (floor.levelIndex <= targetFloor.levelIndex); // display last floor as well as all below

                        // in multifloorCompatibilityMode, in building see all floors, in floor see only active floor
                        if (this.multifloorCompatibilityMode) {
                            if (targetMode === 'building') {
                                floorShouldBeVisible = true;
                            }
                            else {
                                // display only last floor
                                floorShouldBeVisible = (floor.levelIndex == targetFloor.levelIndex);
                            }
                        }

                        if (floorShouldBeVisible) {
                            floorLayerConfig = {
                                lod: (floor.levelIndex == targetFloor.levelIndex) ? 'auto' : 0,
                                // TODO PARAMETER STACK HEIGHT
                                position: {
                                    x: 0,
                                    y: 0,
                                    // the targetFloor will be at 0, and the other ones will be below.
                                    // z: (floor.levelIndex - targetFloor.levelIndex) * this.stackHeight
                                    z: (floor.groundStackHeight - targetFloor.groundStackHeight)
                                },
                                visible: true,
                            };
                            // in multifloorCompatibilityMode, in building mode use always lod 0, in floor let auto.
                            if (this.multifloorCompatibilityMode) {
                                floorLayerConfig.lod = (targetMode === 'building') ? 0 : 'auto';
                            }
                        }
                        else {
                            floorLayerConfig = {
                                lod: 'auto',
                                position: {
                                    x: 0,
                                    y: 0,
                                    z: this.stackHeightFarAway
                                },
                                visible: false,
                                // immediateVisible: false
                            };
                            // since floors below current floor will not be displayed, we want the to move out of the way on the right direction.
                            if (this.multifloorCompatibilityMode) {
                                floorLayerConfig.position.z *= (floor.levelIndex < targetFloor.levelIndex) ? -1.0 : 1.0;
                            }
                        }
                    }
                    else {
                        if (floor.levelIndex <= 0) {
                            floorLayerConfig = {
                                lod: (floor.levelIndex == targetFloor.levelIndex) ? 'auto' : 0,
                                // TODO PARAMETER STACK HEIGHT
                                position: {
                                    x: 0,
                                    y: 0,
                                    // the targetFloor will be at 0, and the other ones will be below.
                                    // z: (floor.levelIndex - targetFloor.levelIndex) * this.stackHeight
                                    z: (floor.groundStackHeight - targetFloor.groundStackHeight)
                                },
                                visible: false,
                            };
                        }
                        else {
                            floorLayerConfig = {
                                lod: 'auto',
                                position: {
                                    x: 0,
                                    y: 0,
                                    z: this.stackHeightFarAway
                                },
                                visible: false,
                                // immediateVisible: false
                            };
                        }
                    }
                    break;
            }
            mapState.layerConfig[floor.id] = floorLayerConfig;
        }
    }

    // Update building Models
    // we put is separate for readability
    for (bi in venueLayout.buildings) {
        building = venueLayout.buildings[bi];
        // in global mode all models are visible
        // in other modes, all models except target building are visible
        mapState.buildingModels[building.id] = {
            visible: (targetMode == 'global') ? true : ((building.id == targetBuildingID) ? false : true)
            // walkway storyboard: 	visible: (targetMode == 'global') ? true : ((building.id == targetBuildingID  || (targetFloor.levelIndex == 3 && floor.levelIndex == targetFloor.levelIndex)) ? false : true)
        };
    }

    // Update camera
    var footprint = false;
    var pointDescriptor = false;
    var getViewpointParameters;

    var showDebuggingFootprints = false;

    var paddingFactor = 0;
    switch (targetMode) {
        case 'global':
            mapState.cameraConfig.pitch = this.globalModePitch;

            footprint = mapviewer.getFootprint(venueLayout.globalLayerID);
            pointDescriptor = mapviewer.getPoint(venueLayout.globalLayerID);
            paddingFactor = this.globalModePaddingFactor;
            break;
        case 'building':
            mapState.cameraConfig.pitch = this.buildingModePitch;
            footprint = mapviewer.getFootprint(targetBuildingID) || mapviewer.getFootprint(venueLayout.globalLayerID);
            pointDescriptor = mapviewer.getPoint(targetBuildingID) || mapviewer.getPoint(venueLayout.globalLayerID);
            paddingFactor = this.buildingModePaddingFactor;
            break;
        case 'floor':
            mapState.cameraConfig.pitch = this.floorModePitch;
            footprint = mapviewer.getFootprint(targetBuildingID) || mapviewer.getFootprint(venueLayout.globalLayerID);
            pointDescriptor = mapviewer.getPoint(targetBuildingID) || mapviewer.getPoint(venueLayout.globalLayerID);
            paddingFactor = this.floorModePaddingFactor;
            break;
    }

    if (!exploreState.noViewpoint) {
        // set mapState.cameraConfig
        if (typeof(exploreState.viewpoint) !== 'undefined' && typeof(exploreState.viewpoint.position) !== 'undefined') {
            mapState.cameraConfig.position = exploreState.viewpoint.position;

            if (typeof(exploreState.viewpoint.heading) !== 'undefined') {
                mapState.cameraConfig.heading = exploreState.viewpoint.heading;
            }
            if (typeof(exploreState.viewpoint.pitch) !== 'undefined') {
                mapState.cameraConfig.pitch = exploreState.viewpoint.pitch;
            }
        }
        else {
            if (typeof(exploreState.place) !== 'undefined') {
                var placeFootprint = mapviewer.getFootprint(exploreState.place);
                if (placeFootprint) {
                    footprint = placeFootprint;
                }
            }

            if (pointDescriptor) {
                mapState.cameraConfig.heading = pointDescriptor.headingInDegrees;
            }


            if (footprint) {
                if (showDebuggingFootprints) {
                    mapviewer.addRoutingPath({
                        points: footprint.points,
                        floor: venueLayout.globalLayerID,
                        color: ((targetMode == 'global') ? '#FFFF00' : '#FF0000'),
                        overlay: true
                    });
                }

                // set the pitch when calculating the getViewPointFromPositions
                getViewpointParameters = {
                    points: footprint.points,
                    top: paddingFactor * this.containerHeight,
                    bottom: paddingFactor * this.containerHeight,
                    left: paddingFactor * this.containerWidth,
                    right: paddingFactor * this.containerWidth,
                    pitch: mapState.cameraConfig.pitch,
                    heading: mapState.cameraConfig.heading || mapviewer.camera.heading
                };
                mapState.cameraConfig.position = mapviewer.getViewpointFromPositions(getViewpointParameters);
            }

            // in multifloorCompatibilityMode when no footprint is found we use the inital camera position
            if (this.multifloorCompatibilityMode && footprint === false) {
                if (typeof(this.cachedInitialPosition) === 'undefined') {
                    this.cachedInitialPosition = mapviewer.camera.position;
                }
                mapState.cameraConfig.position = {
                    x: this.cachedInitialPosition.x,
                    y: this.cachedInitialPosition.y,
                    radius: this.cachedInitialPosition.radius
                };
                if (targetMode === 'floor') {
                    var tmpPosition = mapState.cameraConfig.position;
                    tmpPosition.radius *= 0.75;

                    mapState.cameraConfig.position = tmpPosition;
                }
            }
        }
    }
    else {
        mapState.cameraConfig = false;
    }

    // Update manipulator
    mapState.manipulator = (targetMode == 'building') ? 'custom' : 'map';

    // Update camera config
    // TODO
    // console.log('TODO complete camera config');

    return mapState;
};

/*
 *
 *          targetLevelIndex: number
 * 			layerConfig{id}
 lod: auto|number
 position:
 visible: boolean
 immediateVisible: boolean
 cameraConfig:
 position
 pitch?
 heading?
 buildingModels{id}
 visible: boolean
 manipulator: custom|map
 [animationDuration: N] in seconds
 */
// return deferred
/**
 * @private
 * @name applyMapState
 * @memberOf MyMultiBuildingView.prototype
 * @function
 *
 * @description
 * Private function. applies a mapState, launching animations for floors, camera, position/pitch, 3D Models.
 *
 * @param {MapState} mapState bring the map to this state (camera position, floor position, visibility, etc)
 * @return {jQuery.Promise}
 *
 * @since 1.7.17
 */
MyMultiBuildingView.prototype.applyMapState = function (mapState) {
    var venueLayout = this.venueLayout;
    var mapviewer = this.mapviewer;

    var deferred = jQuery.Deferred();
    var result = deferred.promise();

    var deferredFloorAnimation = jQuery.Deferred();
    var deferredCameraPositionAnimation = jQuery.Deferred();
    var deferredCameraPitchAnimation = jQuery.Deferred();
    var deferredCameraHeadingAnimation = jQuery.Deferred();

    // layerconfig
    var floorConfig;
    var mapviewerFloor;

    var i;
    var newStateList = [];
    var isCurrentlyVisible;
    var floorID;
    var buildingID;

    var pitchAnimationDuration = (typeof(mapState.pitchAnimationDuration) !== 'undefined') ? mapState.pitchAnimationDuration : this.pitchAnimationDuration;
    var headingAnimationDuration = (typeof(mapState.headingAnimationDuration) !== 'undefined') ? mapState.headingAnimationDuration : this.headingAnimationDuration;
    var floorAnimationDuration = (typeof(mapState.floorAnimationDuration) !== 'undefined') ? mapState.floorAnimationDuration : this.floorAnimationDuration;
    var cameraPositionAnimationDuration = (typeof(mapState.cameraPositionAnimationDuration) !== 'undefined') ? mapState.cameraPositionAnimationDuration : this.cameraPositionAnimationDuration;
    var buildingModelAnimationDurationUp = (typeof(mapState.buildingModelAnimationDurationUp) !== 'undefined') ? mapState.buildingModelAnimationDurationUp : this.buildingModelAnimationDurationUp;
    var buildingModelAnimationDurationDown = (typeof(mapState.buildingModelAnimationDurationDown) !== 'undefined') ? mapState.buildingModelAnimationDurationDown : this.buildingModelAnimationDurationDown;
    let newFloorState;
    /*
     Behavior:
     Floors that are visible, but become invisible, will be animated to their final position, and then hidden.
     Except if there is a the model for the building where that floor belongs becomes visible
     In which case, the Floor will become invisible right away.
     Floors that are invisible, but become visible will be displayed right away, before they are animated
     */
    for (floorID in mapState.layerConfig) {
        mapviewerFloor = this.mapviewerFloorByID[floorID];
        if (typeof(mapviewerFloor) !== 'undefined') {
            floorConfig = mapState.layerConfig[floorID];

            isCurrentlyVisible = mapviewerFloor.isEnabled();

            if (typeof(floorConfig.immediateVisible) !== 'undefined') {
                mapviewerFloor.setEnabled(floorConfig.immediateVisible);
            }

            if (floorConfig.visible || isCurrentlyVisible) {
                if (!isCurrentlyVisible && floorConfig.visible) {
                    mapviewerFloor.setEnabled(floorConfig.visible);
                }

                newStateList.push({
                    mapviewerFloor: mapviewerFloor,
                    startPosition: mapviewerFloor.getPosition(),
                    // copy the position
                    endPosition: {x: floorConfig.position.x, y: floorConfig.position.y, z: floorConfig.position.z},
                    visible: floorConfig.visible
                });
            }
            else {
                mapviewerFloor.setPosition(floorConfig.position);
                mapviewerFloor.setEnabled(floorConfig.visible);
            }

            if (mapviewerFloor.isEnabled()) {
                // we apply the map state every time, thus if not enabled, we don't need
                // to update autoUpdateLOD
                if (floorConfig.lod == 'auto') {
                    mapviewerFloor.setAutoUpdateLOD(true);
                    mapviewerFloor.setContentEnabled(true);
                }
                else {
                    mapviewerFloor.setAutoUpdateLOD(false);
                    mapviewerFloor.setContentEnabled(false);

                    var lods = mapviewerFloor.getLODs();
                    for (i = 0; i < lods.length; i++) {
                        lods[i].setEnabled(i == floorConfig.lod);
                    }
                    // in multifloorCompatibilityMode, content is always enabled, even on forced lod
                    mapviewerFloor.setContentEnabled(this.multifloorCompatibilityMode ? true : false);
                }
            }
            else {
                // var lods = mapviewerFloor.getLODs();
                // for (i = 0; i < lods.length; i++)
                // {
                //     lods[i].setEnabled(false);
                // }
            }

            // TEST
            // mapviewerFloor.getLODs()[0].setEnabled(true);
        }
        else {
            console.log('ERROR applyMapState to a non-existing floorID: ' + floorID);
            deferred.reject();
            return result;
        }
    }


    var onComplete = function () {
        for (i in newStateList) {
            mapviewerFloor = newStateList[i].mapviewerFloor;
            mapviewerFloor.setPosition(newStateList[i].endPosition);
            mapviewerFloor.setEnabled(newStateList[i].visible);
            // if (mapviewerFloor.isAutoUpdateLOD() === false && newStateList[i].visible === false)
            // {
            //     var lods = mapviewerFloor.getLODs();
            //     for (i = 0; i < lods.length; i++)
            //     {
            //         lods[i].setEnabled(false);
            //     }
            // }
        }
        deferredFloorAnimation.resolve();
    };

    if (floorAnimationDuration > 0) {
        // var floorAnimation = jQuery({interpolation: 0.0}).animate({interpolation: 1.0 }, {
        // it is preferable to use mapviewer.animateValue (available in 1.7.19) since it is synchronised
        // with the frame rate, thus not possible to call two step() functions in a row without rendering.
        // we stop previous floor animation to make sure previous one does not run at the same time.
        if (this.currentFloorAnimation && this.currentFloorAnimation.stop) {
            this.currentFloorAnimation.stop();
        }
        this.currentFloorAnimation = mapviewer.animateValue(0.0, 1.0, {
            duration: floorAnimationDuration * 1000, /* in ms */
            easing: 'swing', // not used
            step: function (interpolation) {
                var interpolatedPosition;
                var startPosition;
                var endPosition;
                for (i in newStateList) {
                    newFloorState = newStateList[i];
                    mapviewerFloor = newFloorState.mapviewerFloor;
                    startPosition = newFloorState.startPosition;
                    endPosition = newFloorState.endPosition;
                    interpolatedPosition = {
                        x: startPosition.x + (endPosition.x - startPosition.x) * interpolation,
                        y: startPosition.x + (endPosition.y - startPosition.y) * interpolation,
                        z: startPosition.z + (endPosition.z - startPosition.z) * interpolation,
                    };
                    mapviewerFloor.setPosition(interpolatedPosition);
                }
            },
            complete: onComplete
        });
    }
    else {
        onComplete();
    }

    // handle models (for VisioWeb only)
    var buildingModels;
    var modelsForFloor;
    var poi;
    var i;
    var building;
    // Zoom storyboard: Building Animation UX: move buildings up to uncover.
    // If you don't want animation set ...AnimationDurationUp to 0.
    if (!this.isWeb2D && this.venueLayout.hasGlobalLayer) {
        for (buildingID in mapState.buildingModels) {
            building = this.venueLayout.buildingByID[buildingID];
            if (building && building.modelPOIs.length > 0) {
                modelsForFloor = building.modelPOIs;
                buildingModels = mapState.buildingModels[buildingID];
                for (i in modelsForFloor) {
                    poi = modelsForFloor[i];
                    if (poi._modelAnimation) {
                        poi._modelAnimation.stop();
                    }

                    var modelFarAwayZ = 200;
                    var modelPosition = poi.options('position');
                    var modelStartZ = modelPosition.z;
                    var modelEndZ = (buildingModels.visible) ? 0 : modelFarAwayZ;
                    var buildingModelDurationInSeconds = ((modelStartZ == 0) ? buildingModelAnimationDurationUp : buildingModelAnimationDurationDown) * Math.abs(modelStartZ - modelEndZ) / modelFarAwayZ;

                    var modelStartVisible = poi.visible;

                    if (modelStartVisible != buildingModels.visible) {
                        (function (poi, building, modelPosition, buildingModels) {
                            poi.visible = true;
                            poi._modelAnimation = mapviewer.animateValue(modelStartZ, modelEndZ, {
                                duration: buildingModelDurationInSeconds * 1000,
                                easing: 'linear',
                                step: function (z) {
                                    modelPosition.z = z;
                                    poi.options('position', modelPosition);
                                },
                                stop: function () {
                                    // modelPosition.z = modelEndZ;
                                    // poi.options('position', modelPosition);
                                    poi.visible = buildingModels.visible;
                                },
                                complete: function () {
                                    poi.visible = buildingModels.visible;
                                }
                            });
                        })(poi, building, modelPosition, buildingModels);
                    }
                }
            }
            else if (venueLayout.hasGlobalLayer) {
                console.log('WARNING no model for buildingID: ' + buildingID);
            }
        }
    }

    // manipulator
    switch (mapState.manipulator) {
        case 'map':
            mapviewer.camera.setManipulator('map');
            break;
            if (mapviewer.camera.getCustomPreManipulatorListener() === this.mapviewerCustomPreManipulatorListener) {
                mapviewer.camera.setCustomPreManipulatorListener(false);
            }

        case 'custom':
            // console.log('DEBUG setting manipulator none');
            // mapviewer.camera.setManipulator('map');
            mapviewer.camera.setManipulator('none');

            break;
            if (mapviewer.camera.getCustomPreManipulatorListener() === false) {
                mapviewer.camera.setCustomPreManipulatorListener(this.mapviewerCustomPreManipulatorListener.bind(this));
            }
        default:
            console.log('ERROR do not know how to handle manipulator ' + mapState.manipulator);
            break;
    }

    // Camera configuration
    if (mapState.cameraConfig) {
        // Position
        if (mapState.cameraConfig.position) {
            // change position, camera position animation
            var currentManipulator = mapviewer.camera.getManipulator();
            // we cnange the manipulator during the camera animation to avoid conflicts between the camera animation
            // the manipulator.  Normally the camera animation should be short not to be a problem.
            mapviewer.camera.setManipulator('none');
            mapviewer.camera.goTo(mapState.cameraConfig.position, {animationDuration: cameraPositionAnimationDuration * 1000/* in ms */})
                .done(function () {
                    mapviewer.camera.setManipulator(currentManipulator);
                    deferredCameraPositionAnimation.resolve();
                });
        }
        else {
            deferredCameraPositionAnimation.resolve();
        }
        // Pitch
        if (typeof(mapState.cameraConfig.pitch) !== 'undefined') {
            mapviewer.camera.maxPitch = Math.max(this.globalModePitch, Math.max(this.buildingModePitch, this.floorModePitch));
            // mapviewer.camera.minPitch = Math.min(this.globalModePitch, Math.min(this.buildingModePitch, this.floorModePitch));

            // mapviewer.camera.maxPitch = 10;
            mapviewer.camera.minPitch = -90;

            if (pitchAnimationDuration > 0) {
                this.animatePitch(mapState.cameraConfig.pitch, {durationInSeconds: pitchAnimationDuration}).done(function () {
                    deferredCameraPitchAnimation.resolve();
                });
            }
            else {
                mapviewer.camera.pitch = mapState.cameraConfig.pitch;
                deferredCameraPitchAnimation.resolve();
            }
        }
        else {
            deferredCameraPitchAnimation.resolve();
        }
        // Rotation
        if (typeof(mapState.cameraConfig.heading) !== 'undefined') {
            if (headingAnimationDuration > 0) {
                this.animateHeading(mapState.cameraConfig.heading, {durationInSeconds: headingAnimationDuration}).done(function () {
                    deferredCameraHeadingAnimation.resolve();
                });
            }
            else {
                mapviewer.camera.heading = mapState.cameraConfig.heading;
                deferredCameraHeadingAnimation.resolve();
            }
        }
        else {
            deferredCameraHeadingAnimation.resolve();
        }
    }
    else {
        deferredCameraPitchAnimation.resolve();
        deferredCameraPositionAnimation.resolve();
        deferredCameraHeadingAnimation.resolve();
    }

    jQuery.when(deferredFloorAnimation, deferredCameraPositionAnimation, deferredCameraPitchAnimation).done(function () {
        deferred.resolve();
    })
        .fail(function () {
            deferred.reject();
        });

    return result;
};

/**
 * @name getCurrentExploreState
 * @memberOf MyMultiBuildingView.prototype
 * @function
 *
 * @description
 * returns the current explore state.
 *
 * @param {ExploreState} Object with attributes mode, buildingID, floorID
 * @return {jQuery.Promise}
 *
 * @since 1.7.17
 */
MyMultiBuildingView.prototype.getCurrentExploreState = function () {
    // return copy of this.exploreState
    return jQuery.extend({}, this.exploreState);
};

/**
 * @name parseVenueLayout
 * @description
 * parse a description of a venue into a VgVenueLayout object which has all the information
 * already validated and processed.
 * @param {vg.mapviewer.web.MapViewer|vg.mapviewer.web2d.Mapviewer} mapviewer the viewer.
 * @param {Object} mapviewerFloorMap map of floorID to vg.mapviewer.web.Floor.
 * @param {Object} venueLayout usually from mapviewer.getExtraData().config.venue_layout.
 * @static
 * @return {Object} VgVenueLayout object
 */
MyMultiBuildingView.parseVenueLayout = function (mapviewer, mapviewerFloorMap, venueLayout) {
    var mapviewerFloor;

    // VgVenue constructor parametesr
    var buildings = [];
    var defaultBuildingIndex;
    var globalLayerID = false;

    // and it is
    if (typeof(venueLayout.layer) === 'string' && venueLayout.layer.length > 0) {
        if (typeof(mapviewerFloorMap[venueLayout.layer]) !== 'undefined') {
            globalLayerID = venueLayout.layer;
        }
        else {
            console.log('WARNING: venueLayout has layer: ' + venueLayout.layer + ' but non existant in map');
        }
    }

    // Create Buildings
    var l;
    var buildingID;
    var venueLayoutBuilding;
    var floorID;
    var venueLayoutFloor;
    var floors;
    var floor;
    var groundFloorIndex;
    var defaultFloorIndex;
    var modelPOIs;
    var poisForID;
    var found;
    var floorLevel0;
    for (buildingID in venueLayout.buildings) {
        floors = [];
        venueLayoutBuilding = venueLayout.buildings[buildingID];
        for (floorID in venueLayoutBuilding.floors) {
            venueLayoutFloor = venueLayoutBuilding.floors[floorID];

            mapviewerFloor = mapviewerFloorMap[floorID];
            if (typeof(mapviewerFloor) !== 'undefined') {
                // VgFloor constructor(id, levelIndex, stackHeight)
                floor = new MyMultiBuildingView.VgFloor(floorID, venueLayoutFloor.levelIndex);// , 10); //,venueLayoutFloor.stackHeightMax - venueLayoutFloor.stackHeightMin + venueLayoutFloor.stackGap);

                floor.stackHeightMax = venueLayoutFloor.stackHeightMax || 0;
                floor.stackHeightMin = venueLayoutFloor.stackHeightMin || 0;
                floor.stackGap = venueLayoutFloor.stackGap || 0;

                floors.push(floor);
                if (floor.levelIndex === 0) {
                    floorLevel0 = floor;
                }
            }
            else {
                console.log('WARNING: venueLayout building has floorID : ' + floorID + ' but non existant in map');
            }
        }
        // sort floors by levelIndex
        floors.sort(function (a, b) {
            return parseInt(a.levelIndex, 10) - parseInt(b.levelIndex, 10);
        });

        groundFloorIndex = false;
        defaultFloorIndex = false;

        // find defaultFloorIndex
        if (typeof(venueLayoutBuilding.defaultFloor) !== 'undefined') {
            found = false;
            for (let i = 0, l = floors.length; i < l; i++) {
                if (floors[i].id == venueLayoutBuilding.defaultFloor) {
                    defaultFloorIndex = i;
                    found = true;
                    break;
                }
            }
            if (!found) {
                console.log('WARNING, there is a defaultFloor: ' + venueLayoutBuilding.defaultFloor + ' but no floor found for it');
                // use defaultFloorIndex = 0
            }
        }

        // find the groundFloorIndex
        found = false;
        for (let i = 0, l = floors.length; i < l; i++) {
            if (floors[i].levelIndex == 0) {
                groundFloorIndex = i;
                found = true;
                break;
            }
        }
        if (!found) {
            console.log('WARNING, no groundFloor found (with levelIndex 0) for building ' + buildingID);
            groundFloorIndex = 0;
        }


        var cumulHeight = 0;
        var prevFloorThickness;
        var floorThickness;
        floors[groundFloorIndex].groundStackHeight = 0;
        for (let i = (groundFloorIndex + 1), l = floors.length; i < l; i++) {
            /*
             floor.stackHeightMax = venueLayoutFloor.stackHeightMax;
             floor.stackHeightMin = venueLayoutFloor.stackHeightMin;
             floor.stackGap = venueLayoutFloor.stackGap;
             */
            prevFloorThickness = floors[i - 1].stackHeightMax + floors[i - 1].stackGap - floors[i].stackHeightMin;
            cumulHeight += prevFloorThickness;
            floors[i].groundStackHeight = cumulHeight;
        }
        cumulHeight = 0;
        for (let i = groundFloorIndex - 1; i >= 0; i--) {
            floorThickness = floors[i].stackHeightMax + floors[i].stackGap - floors[i + 1].stackHeightMin;
            cumulHeight -= floorThickness;
            floors[i].groundStackHeight = cumulHeight;
        }

        // VgBuilding constructor (id, displayIndex, floors, groundFloorIndex, defaultFloorIndex)
        poisForID;
        modelPOIs = [];
        if (!this.isWeb2D) {
            // This will get all the POIs with that ID, we need to pick only those that are models.
            poisForID = mapviewer.getPoi(buildingID);
            if (typeof(poisForID) !== 'undefined') {
                for (let i = 0; i < poisForID.length; i++) {
                    if (poisForID[i].options('model')) {
                        modelPOIs.push(poisForID[i]);
                        // for debugging
                        // poisForID[i].hide();
                    }
                }
            }
        }
        buildings.push(new MyMultiBuildingView.VgBuilding(buildingID,
            venueLayoutBuilding.displayIndex,
            floors,
            groundFloorIndex,
            defaultFloorIndex,
            modelPOIs));
    }

    // sort buildings by displayIndex
    // TODO validate if displayIndex does not exist?
    buildings.sort(function (a, b) {
        return a.displayIndex - b.displayIndex;
    });

    // igure out defaultBuilding
    defaultBuildingIndex = false;
    if (typeof(venueLayout.defaultBuilding) !== 'undefined') {
        found = false;
        for (let i = 0, l = buildings.length; i < l; i++) {
            if (buildings[i].id == venueLayout.defaultBuilding) {
                defaultBuildingIndex = i;
                found = true;
                break;
            }
        }
        if (!found) {
            console.log('WARNING: no building found with venueLayout.defaultBuilding "' + venueLayout.defaultBuilding + '"');
            // defaulting to first building.
        }
    }

    // function(buildings, defaultBuildingIndex, globalLayerID)
    var venue = new MyMultiBuildingView.VgVenueLayout(buildings, defaultBuildingIndex, globalLayerID);
    return venue;
};

/**
 * @name animatePitch
 * @memberOf MyMultiBuildingView.prototype
 * @function
 *
 * @description
 * This method is used to animate the pitch of the camera.
 *
 * @param {number} value target pitch
 * @param {Object} [options]
 * @param {number} [options.durationInSeconds] duration in seconds, if not constant degrees at 4 degrees per second.
 * @return {jQuery.Deferred.Promise} where a done() or fail() callback can be added.
 * @example
 multiBuildingView.animatePitch(-85, {durationInSeconds: 2})
 .done(function() { ... update 2D labels})
 .fail(function() { alert('error'); });
 */
MyMultiBuildingView.prototype.animatePitch = function (value, options) {
    options = options || {};
    var mapviewer = this.mapviewer;
    var deferred = jQuery.Deferred();
    var result = deferred.promise();

    var currentPitch = mapviewer.camera.pitch;
    var delta = value - currentPitch;
    var speedDegreesPerSecond = 4;
    var duration = options.durationInSeconds || (delta / speedDegreesPerSecond);
    var durationInMilli = duration * 1000;

    if (this.currentPitchAnimation && this.currentPitchAnimation.stop) {
        this.currentPitchAnimation.stop();
    }
    this.currentPitchAnimation = mapviewer.animateValue(parseFloat(currentPitch), parseFloat(value), {
        duration: durationInMilli,
        easing: 'linear',
        step: function (pitch) {
            mapviewer.camera.pitch = pitch;
        },
        complete: function () {
            deferred.resolve();
        }
    });
    return result;
};


/**
 * @name animateHeading
 * @memberOf MyMultiBuildingView.prototype
 * @function
 *
 * @description
 * This method is used to animate the pitch of the camera.
 *
 * @param {number} value target rotation
 * @param {number} [options.durationInSeconds] duration in seconds, if not constant degrees at 4 degrees per second.
 * @param {Object} [options]
 * @return {jQuery.Deferred.Promise} where a done() or fail() callback can be added.
 * @example
 multiBuildingView.animateHeading(30, {durationInSeconds: 2})
 .done(function() { ... update something})
 .fail(function() { alert('error'); });
 */
MyMultiBuildingView.prototype.animateHeading = function (value, options) {
    options = options || {};
    var mapviewer = this.mapviewer;
    var deferred = jQuery.Deferred();
    var result = deferred.promise();

    var currentHeading = mapviewer.camera.heading;
    currentHeading = currentHeading % 360;
    if (currentHeading < 0) {
        currentHeading += 360;
    }

    var delta = value - currentHeading;
    var speedDegreesPerSecond = 4;
    var duration = options.durationInSeconds || (delta / speedDegreesPerSecond);
    var durationInMilli = duration * 1000;

    var targetHeading = parseFloat(value);
    targetHeading = targetHeading % 360;
    if (targetHeading < 0) {
        targetHeading += 360;
    }

    if (Math.abs(currentHeading - targetHeading) > 180) {
        if (currentHeading > targetHeading) {
            currentHeading -= 360;
        }
        else {
            targetHeading -= 360;
        }
    }
    // var headingAnimation = jQuery({heading: parseFloat(currentHeading)}).animate({heading: targetHeading }, {
    if (this.currentHeadingAnimation && this.currentHeadingAnimation.stop) {
        this.currentHeadingAnimation.stop();
    }
    this.currentHeadingAnimation = mapviewer.animateValue(parseFloat(currentHeading), targetHeading, {
        duration: durationInMilli,
        easing: 'linear',
        step: function (heading, fx) {
            // console.log('step: ' + floorIndex);
            mapviewer.camera.heading = heading;
        },
        complete: function () {
            deferred.resolve();
        }
    });

    return result;
};

/**
 * @name changeFloorOverride
 * @memberOf MyMultiBuildingView.prototype
 * @function
 *
 * @description
 * Used (carefully) to override mapviewer's original changeFloor function in case it is use elsewhere in the application.
 * For example by MyNavigation or MyRoute
 *
 * @param {string} floorName The floor to change to.
 * If it is the same as the current floor, the done() function is called directly.
 * @param {Object}[options] Additional options to change floor.
 * @param {number}[options.animationDuration=this.floorAnimationDuration] Duration of the change floor animation in milliseconds like found in vg.mapviewer.Mapviewer.Web or Web2D, other animation durations are in seconds.
 * @return {jQuery.Deferred.Promise} where a done() or fail() callback can be added.
 * @since 1.7.21 updated to not change viewpoint, to be more similar to SDK's changeFloor implementation.
 */
MyMultiBuildingView.prototype.changeFloorOverride = function (floorName, options) {
    var goToParameters;
    var result;

    if (floorName == this.venueLayout.globalLayerID) {
        goToParameters = {
            mode: 'global',
            noViewpoint: true
        };
    }
    else if (this.venueLayout.buildingByID[floorName]) {
        // we hijack the changeFloor when the 'floorname' is a building.
        goToParameters = {
            mode: 'building',
            buildingID: floorName
        };
    }
    else {
        var targetFloorID = this.venueLayout.buildingByFloorID[floorName];
        goToParameters = {
            mode: 'floor',
            buildingID: targetFloorID && targetFloorID.id,
            floorID: floorName,
            noViewpoint: true
        };
    }

    if (options && typeof(options.animationDuration) !== 'undefined') {
        // note that goToParameters take time in seconds, standard mapviewer.changeFloor takes in milliseconds
        goToParameters.floorAnimationDuration = options.animationDuration / 1000;
    }

    result = this.goTo(goToParameters);
    return result;
};
/**
 * @private
 * @name getCurrentFloorOverride
 * @memberOf MyMultiBuildingView.prototype
 * @function
 *
 * @description
 * Used (carefully) to override mapviewer's original getCurrentFloor function since the internal current floor is no longer valid.
 * For example by MyNavigation or MyRoute
 *
 * @return {string} if it is in global mode, it return the globalLayerID, otherwise the current exploreState floorID.
 */
MyMultiBuildingView.prototype.getCurrentFloorOverride = function () {
    if (this.exploreState.mode === 'global') {
        return this.venueLayout.globalLayerID;
    }
    else {
        return this.exploreState.floorID;
    }
};

/**
 * @name getCurrentFloor
 * @memberOf MyMultiBuildingView.prototype
 * @function
 *
 * @description
 * Returns the current floor.
 * @return {string} if it is in global mode, it return the globalLayerID, otherwise the current exploreState floorID.
 * @since 1.7.21
 */
MyMultiBuildingView.prototype.getCurrentFloor = function () {
    return this.getCurrentFloorOverride();
};

/**
 * @name mapviewerCustomPreManipulatorListener
 * @memberOf MyMultiBuildingView.prototype
 * @function
 * @description
 * handles custom manipulation to be able to swipe up/down to change floor, and tap to go into floor view.
 * @param {Object} ev incoming event.
 * @return {boolean}
 */
MyMultiBuildingView.prototype.mapviewerCustomPreManipulatorListener = function (ev) {
    // console.log('mapviewerCustomPreManipulatorListener event: '+ev.type);
    var i;
    var l;
    var floors;
    var found;

    if (this.exploreState.mode != 'building') {
        // HBXX are we forgetting to remove it?
        // console.log('ERROR custom manipulator set, but not in building mode');
        return;
    }

    var goToNext = false;
    var goToPrev = false;

    if (ev.type === 'wheel') {
        ev.delta = ev.delta || 0;
        // This could be switching floors, or maybe switching mode?
        if (ev.delta > 0) {
            goToNext = true;
        }
        else if (ev.delta < 0) {
            goToPrev = true;
        }
        else {
            return false;
        }
    }
    else {
        var offset = this.container[0].getBoundingClientRect();
        var center = {left: ev.center.x - offset.left, top: ev.center.y - offset.top};
        // fetch position before rotating
        // var panCenterPoint = mapviewer.convertScreenToPoint(center);
        // console.log('panCenterPoint: '+panCenterPoint.x + ','+ panCenterPoint.y);

        // console.log('ev '+ev.type);
        // console.log(' center '+center.left + ','+center.top);
        switch (ev.type) {
            // case 'pinchmove':
            // // if(ev.scale);
            // this.goTo({mode: (ev.scale > 1.0) ? 'floor' : 'global', buildingID: this.exploreState.buildingID, floorID: this.exploreState.floorID, noViewpoint: false, animationDuration: 0});
            // return;
            // break;

            case 'panstart':
                this.customPreManipulatorStartCenter = center;
                break;
            case 'panmove': {
                // we only care about relative move
                var verticalDelta = (center.top - this.customPreManipulatorStartCenter.top);
                // console.log(' pan verticalDelta: '+verticalDelta);
                if (Math.abs(verticalDelta) > this.verticalPanChangeFloorThreshold) {
                    if (verticalDelta > 0) {
                        goToNext = true;
                    }
                    else {
                        goToPrev = true;
                    }
                    this.customPreManipulatorStartCenter = center;
                }
            }
                break;
            case 'tap': {
                this.goTo({mode: 'floor'});

                return false;
            }
                break;
        }
    }
    if ((goToNext || goToPrev) &&
        typeof(this.exploreState.buildingID) !== 'undefined' &&
        typeof(this.exploreState.floorID) !== 'undefined') {
        var currentFloorID = this.exploreState.floorID;
        // figure out floorIndex
        floors = this.venueLayout.buildingByID[this.exploreState.buildingID].floors;
        l = floors.length;
        found = false;
        for (i = 0; i < l; i++) {
            if (floors[i].id == currentFloorID) {
                found = true;
                break;
            }
        }
        if (found) {
            if (goToNext && i < (l - 1)) {
                this.goTo({mode: 'building', buildingID: this.exploreState.buildingID, floorID: floors[i + 1].id});
            }
            else if (goToPrev && i > 0) {
                this.goTo({mode: 'building', buildingID: this.exploreState.buildingID, floorID: floors[i - 1].id});
            }
        }
        else {
            console.log('ERROR: this.exploreState.floorID not found!: ' + this.exploreState.floorID);
        }
    }

    // let the mapviewer's handle the event
    return false;
};


/**
 * @name intersects2D
 * @memberOf MyMultiBuildingView
 * @function
 * @description
 * Determines if a point {x:,y:} is inside a polygon (Array of points), ignore z attribute.
 * @param {point} point
 * @param {Array} polygon array of points
 * @return {boolean} true if point is inside polygon
 */
MyMultiBuildingView.intersects2D = function (point, polygon) {
    // ray-casting algorithm based on
    // http:// www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html
    // latlng, thus x is in [1]
    var x = point.x;
    var y = point.y;

    var inside = false;
    var points = polygon;
    for (var i = 0, j = points.length - 1; i < points.length; j = i++) {
        var xi = points[i].x;
        var yi = points[i].y;
        var xj = points[j].x;
        var yj = points[j].y;

        var intersect = ((yi > y) !== (yj > y)) &&
            (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) {
            inside = !inside;
        }
    }
    if (inside) {
        return inside;
    }
    return inside;
};

/**
 * @name setLocalizationData
 * @memberOf MyMultiBuildingView.prototype
 * @function
 * @description
 * Set the localization data for floor and building names
 * @param {Object} venueLayoutLocalization localization data of the form {'B3': { name: 'building 3', description: 'my building', shortName: 'bldg3'}, 'B2'....}
 */
MyMultiBuildingView.prototype.setVenueLayoutLocalization = function (venueLayoutLocalization) {
    this.venueLayoutLocalization = venueLayoutLocalization || {};
};

/**
 * @name getLocalizedName
 * @memberOf MyMultiBuildingView.prototype
 * @function
 *
 * @description
 * get the localized name for an ID
 * @param {string} id
 * @return {string}
 */
MyMultiBuildingView.prototype.getLocalizedName = function (id) {
    if (this.venueLayoutLocalization[id]) {
        return this.venueLayoutLocalization[id].name || id;
    }
    return id;
};

/**
 * @name setupActiveBuildingMarkerPOIs
 * @memberOf MyMultiBuildingView.prototype
 * @function
 *
 * @description
 * setup handlers so put markers on the global view for the focused building. Should only be called once.
 * if there is no global layer, it will do nothing.
 *
 */
MyMultiBuildingView.prototype.setupActiveBuildingMarkerPOIs = function () {
    var imagePath = vg.imagePath || '../media';
    var mapviewer = this.mapviewer;

    var venueLayout = this.venueLayout;
    if (!venueLayout.hasGlobalLayer) {
        return;
    }

    // Needs center for buildings in order to work.
    // height is hard coded?
    var buildings = this.venueLayout.buildings;
    var i;
    var poiActive;
    var poiInactive;
    var point;
    var buildingID;
    for (var i in buildings) {
        buildingID = buildings[i].id;
        point = mapviewer.getPoint(buildingID);
        // HBXX for the moment the HEIGHT is hardcoded
        if (point) {
            // VisioWeb: when creating POIs with id, we will know they are clicked
            // on the "mouseup" event or on global onObjectMouseUp() callback.
            // console.log('adding building marker '+buildingID + ' x: '+point.x + ' y: '+point.y);
            poiActive = mapviewer.addPOI({
                id: buildingID,
                url: imagePath + '/building_focused.png',
                // text: buildingID,
                position: {x: point.x, y: point.y, z: this.buildingMarkerHeight},
                floor: venueLayout.globalLayerID,
                alignment: {x: 0, y: 1},
                scale: this.buildingMarkerScale,
                visible: false,
                overlay: true
            });
            poiInactive = mapviewer.addPOI({
                id: buildingID,
                url: imagePath + '/building.png',
                // text: buildingID,
                position: {x: point.x, y: point.y, z: this.buildingMarkerHeight},
                floor: venueLayout.globalLayerID,
                alignment: {x: 0, y: 1},
                scale: this.buildingMarkerScale,
                visible: false,
                overlay: true
            });
            if (poiActive && poiInactive) {
                this.activeBuildingMarkerPOIs[buildingID] = poiActive;
                this.inactiveBuildingMarkerPOIs[buildingID] = poiInactive;
            }
        }
    }
    // If we are going to go into a mode that is not global
    // hide all markers.
    // If we go into global mode, put markers on all buildings
    // if there is focused building, then put focused marker.
    mapviewer.on('MyMultiBuildingView.exploreStateWillChange', function (event) {
        var view = event.args.view;
        var target = event.args.target;
        var i;
        var focusedBuilding = target.buildingID;
        var hasFocusedBuilding = (typeof(focusedBuilding) !== 'undefined');

        if (target.mode == 'global') {
            for (i in view.activeBuildingMarkerPOIs) {
                if (hasFocusedBuilding && i == focusedBuilding) {
                    view.activeBuildingMarkerPOIs[i].show();
                    view.inactiveBuildingMarkerPOIs[i].hide();
                }
                else {
                    view.activeBuildingMarkerPOIs[i].hide();
                    view.inactiveBuildingMarkerPOIs[i].show();
                }
            }
        }
        else {
            if (view.isWeb2D) {
                for (i in view.activeBuildingMarkerPOIs) {
                    if (i == focusedBuilding) {
                        view.activeBuildingMarkerPOIs[i].hide();
                        view.inactiveBuildingMarkerPOIs[i].hide();
                    }
                    else {
                        view.activeBuildingMarkerPOIs[i].hide();
                        view.inactiveBuildingMarkerPOIs[i].show();
                    }
                }
            }
            else {
                // hide all markers in VisioWeb, you can click in the building if you want.
                for (i in view.activeBuildingMarkerPOIs) {
                    view.activeBuildingMarkerPOIs[i].hide();
                    view.inactiveBuildingMarkerPOIs[i].hide();
                }
            }
            // hide all markers
        }
        // target: resolvedExploreState,
        // current: this.getCurrentExploreState(),
        // view: this
    });


    // mapviewer.on('MyMultiBuildingView.exploreStateChanged',function(event){
    //     var view = event.args.view;
    //     var current = event.args.current;
    //     if (current.mode == 'global')
    //     {
    //
    //     }
    // });
};


// Attributes
// .groundStackHeight can be negative, it will be 0 for levelIndex 0.
//
MyMultiBuildingView.VgFloor = function (id, levelIndex) {
    this.id = id;
    this.levelIndex = parseInt(levelIndex, 10);
};

// modelPOIs can be undefined.
MyMultiBuildingView.VgBuilding = function (id, displayIndex, floors, groundFloorIndex, defaultFloorIndex, modelPOIs) {
    this.id = id;
    this.displayIndex = displayIndex;
    this.floors = floors;
    this.groundFloorIndex = groundFloorIndex; // index into floors
    this.defaultFloorIndex = defaultFloorIndex; // index into floors

    this.floorByID = {};

    var i;
    var l;
    var floor;
    for (i = 0, l = this.floors.length; i < l; i++) {
        floor = this.floors[i];
        this.floorByID[floor.id] = floor;
    }
    this.modelPOIs = jQuery.isArray(modelPOIs) ? modelPOIs : [];
};

MyMultiBuildingView.VgVenueLayout = function (buildings, defaultBuildingIndex, globalLayerID) {
    this.buildings = buildings;
    this.defaultBuildingIndex = defaultBuildingIndex;

    if (typeof(globalLayerID) !== 'undefined' && globalLayerID.length > 0) {
        this.hasGlobalLayer = true;
        this.globalLayerID = globalLayerID;
    }
    else {
        this.hasGlobalLayer = false;
    }

    this.buildingByID = {};
    this.buildingByFloorID = {};

    var i;
    var l;
    var building;
    var j;
    var fl;
    for (i = 0, l = this.buildings.length; i < l; i++) {
        building = this.buildings[i];
        this.buildingByID[building.id] = building;

        for (j = 0, fl = building.floors.length; j < fl; j++) {
            this.buildingByFloorID[building.floors[j].id] = building;
        }
    }
};


/*
 Assumes global functions: updateActiveFloorLabel, and div's #stack_button, #change_floor
 */
/**
 * @name setupMultibuildingFloorUI
 * @memberOf MyMultiBuildingView.prototype
 * @function
 *
 * @description
 * Setup selectors and listeners to update UI for current mode, building and floor.  It expects div #floor_container, #global_mode_button, #floor_mode_button, #change_building_select, #change_floor_select
 *
 */
MyMultiBuildingView.prototype.setupMultibuildingFloorUI = function () {
    // remove old buttons just in case.
    jQuery('#change_floor').empty();
    jQuery('#floor_container').show();

    var mapviewer = this.mapviewer;
    var _this = this;

    /*
     * Setup UI Buttons, assumes global functions
     * resetActiveShop()
     */
    var globalModeButton = jQuery('#global_mode_button');
    var buildingModeButton = jQuery('#building_mode_button');
    var floorModeButton = jQuery('#floor_mode_button');

    var buildingSelector = jQuery('#change_building_select');
    var floorSelector = jQuery('#change_floor_select');

    var venueLayout = _this.venueLayout;

    globalModeButton.on('click', function () {
        // go always to global mode to reset the view.
        var currentExploreState = _this.getCurrentExploreState();
        // if (currentExploreState.mode !== 'global')
        {
            _this.goTo({
                mode: 'global',
                buildingID: currentExploreState.buildingID || MyMultiBuildingView.DEFAULT
            });
        }
    });
    buildingModeButton.on('click', function () {
        // var currentExploreState = _this.getCurrentExploreState();
        // if (currentExploreState.mode !== 'building')
        {
            _this.goTo({
                mode: 'building',
                buildingID: (buildingSelector.val() === '' ? MyMultiBuildingView.DEFAULT : buildingSelector.val()),
                floorID: (floorSelector.val() === '' ? MyMultiBuildingView.DEFAULT : floorSelector.val())
            });
        }
    });
    buildingSelector.on('change', function () {
        if (this.value !== '') {
            _this.goTo({
                mode: 'building',
                buildingID: this.value,
                floorID: MyMultiBuildingView.DEFAULT
            });
        }
    });
    floorModeButton.on('click', function () {
        var currentExploreState = _this.getCurrentExploreState();
        // if (currentExploreState.mode !== 'floor')
        {
            _this.goTo({
                mode: 'floor',
                buildingID: currentExploreState.buildingID,
                floorID: currentExploreState.floorID
            });
        }
    });
    floorSelector.on('change', function () {
        if (this.value !== '') {
            var currentExploreState = _this.getCurrentExploreState();
            _this.goTo({
                mode: ((currentExploreState.mode == 'global') ? 'building' : currentExploreState.mode),
                buildingID: currentExploreState.buildingID,
                floorID: this.value,
                noViewpoint: true
                // , viewpoint: {
                //         position: _this.mapviewer.camera.position,
                //         heading: _this.mapviewer.camera.heading
                //      }
            });
        }
    });

    /*
     * Setup mode buttons: global, building, floor
     * Setup selectors: buildings, floor
     */


    var anyBuildingManyFloors = false;
    var hasManyBuildings = false;
    var hasOneBuilding = false;

    for (i in venueLayout.buildings) {
        if (venueLayout.buildings[i].floors.length > 1) {
            anyBuildingManyFloors = true;
            break;
        }
    }

    if (venueLayout.buildings.length > 1) {
        hasManyBuildings = true;
    }
    else if (venueLayout.buildings.length == 1) {
        hasOneBuilding = true;
    }

    // Global mode button
    if (venueLayout.hasGlobalLayer) {
        globalModeButton.show();
    }
    else {
        globalModeButton.hide();
    }

    // Building mode button (only for VisioWeb)
    if (anyBuildingManyFloors && this.buildingModeEnabled === true) {
        buildingModeButton.show();
    }
    else {
        buildingModeButton.hide();
    }

    // Building Selector
    if (hasManyBuildings || anyBuildingManyFloors) {
        buildingSelector.show();
    }
    else {
        buildingSelector.hide();
    }

    // Floor mode button and Floor Selector
    if (hasOneBuilding || hasManyBuildings) {
        floorModeButton.show();
        floorSelector.show();
    }
    else {
        floorModeButton.hide();
        floorSelector.hide();
    }

    var buildingsSorted = [];
    var i;
    for (i in multiBuildingView.venueLayout.buildingByID) {
        buildingsSorted.push(_this.venueLayout.buildingByID[i]);
    }
    // descending displayIndex, since the order will be revered by selector
    buildingsSorted.sort(function (a, b) {
        return ((a.displayIndex || 0) - (b.displayIndex || 0));
    });

    var f;
    buildingSelector.append(jQuery('<option/>', {value: '', text: 'Select building'}));
    for (i in buildingsSorted) {
        buildingSelector.append(jQuery('<option/>', {
            value: buildingsSorted[i].id,
            text: _this.getLocalizedName(buildingsSorted[i].id)
        }));
    }

    mapviewer.on('MyMultiBuildingView.exploreStateWillChange', function (ev) {
        var targetExploreState = ev.args.target;
        switch (targetExploreState.mode) {
            case 'global':
                globalModeButton.addClass('selected');
                buildingModeButton.removeClass('selected');
                floorModeButton.removeClass('selected');
                break;
            case 'building':
                globalModeButton.removeClass('selected');
                buildingModeButton.addClass('selected');
                floorModeButton.removeClass('selected');
                break;
            case 'floor':
                globalModeButton.removeClass('selected');
                buildingModeButton.removeClass('selected');
                floorModeButton.addClass('selected');
                break;
        }

        // fill floors
        floorSelector.empty();
        if (typeof(targetExploreState.buildingID) !== 'undefined') {
            buildingSelector.val(targetExploreState.buildingID);
            floorSelector.empty();

            var building = _this.venueLayout.buildingByID[targetExploreState.buildingID];
            if (building) {
                // floorSelector.append(jQuery('<option/>',{value: '', text: 'Select floor'}));
                for (f = (building.floors.length - 1); f >= 0; f--) {
                    var floorID = building.floors[f].id;
                    floorSelector.append(jQuery('<option/>', {value: floorID, text: _this.getLocalizedName(floorID)}));
                }

                if (typeof(targetExploreState.floorID) !== 'undefined') {
                    floorSelector.val(targetExploreState.floorID);
                }
                else {
                    floorSelector.val('');
                }
            }
        }
        else {
            buildingSelector.val('');
        }
    });

    /*
     In global mode, clicking on building will look for the first footprint that matches.
     In Floor mode, clicking on a building, if it overlaps with active building, do notthing
     otherwise go to that building.
     */
    if (this.isWeb2D && this.venueLayout.hasGlobalLayer && this.venueLayout.buildings.length > 0) {
        var mouseUpTooLong = false;
        // this will work on both touch and mouse devices.  Thus initial value is false
        jQuery(this.container[0]).on('mousedown', function () {
            // console.log('mousedown');
            mouseUpTooLong = false;
            setTimeout(function () {
                // console.log('mousedown timedout');
                mouseUpTooLong = true;
            }, 300);
        });

        jQuery(this.container[0]).on('mouseup click', function (event) {
            if (mouseUpTooLong) {
                return;
            }
            var exploreState = _this.getCurrentExploreState();

            var offset = _this.container[0].getBoundingClientRect();
            var center = {left: event.clientX - offset.left, top: event.clientY - offset.top};
            var point = mapviewer.convertScreenToPoint(center);

            var i;
            var l;
            var footprint;
            var building;
            var found = false;
            for (i = 0, l = _this.venueLayout.buildings.length; i < l; i++) {
                building = _this.venueLayout.buildings[i];
                footprint = mapviewer.getFootprint(building.id);
                if (footprint && MyMultiBuildingView.intersects2D(point, footprint.points)) {
                    if (exploreState.mode === 'global') {
                        _this.goTo({
                            mode: 'building',
                            buildingID: building.id,
                            floorID: MyMultiBuildingView.DEFAULT,
                            animationDuration: 0
                        });
                        return;
                    }
                    else {
                        // we are in floor mode, if it is the same building we are on, we do nothing.
                        if (exploreState.buildingID === building.id) {
                            return;
                        }
                    }
                    found = building.id;
                }
            }

            if (found !== false) {
                _this.goTo({
                    mode: 'building',
                    buildingID: found,
                    floorID: MyMultiBuildingView.DEFAULT,
                    animationDuration: 0
                });
                return;
            }
        });
    }


    // This code switches building as a function of zoom.
    if (!this.isWeb2D && this.venueLayout.hasGlobalLayer) {
        // in building mode we have a different manipulator
        this.buildingModeEnabled = false;

        // make active building, building whose center is closest once you are below a certain radius.
        // note below a certain radius there will always be a building active.

        // Known issues:  if a building whose default floor is below ground or way above ground, there will be a jump since the outside layer no longer will be at altitude 0.
        // There is no memory of last active floor, so if you change buildings and come back, it will not be the same floor.

        var buildingViewpoints = {};
        var buildingFootprints = {};
        // want to find out a viewpointCenter and viewpointRadius for each building.
        var maxViewpointRadius = 0;

        /*
         Updates:
         maxViewpointRadius to determine when to switch between global and floor
         this is done by computing getViewpointFromPositions using footprints of buidlings, and taking the max radius.
         buildingViewpoints to determine center of footprints
         buildingFootprints footprints of buildings.

         */
        var updateBuildingViewpoints = function () {
            maxViewpointRadius = 0;
            for (var building in _this.venueLayout.buildings) {
                var buildingID = _this.venueLayout.buildings[building].id;
                var footprint = mapviewer.getFootprint(buildingID);
                var pointDescriptor = mapviewer.getPoint(buildingID);
                var paddingFactor = _this.floorModePaddingFactor;

                // set the pitch when calculating the getViewPointFromPositions
                var getViewpointParameters = {
                    points: footprint.points,
                    top: paddingFactor * _this.containerHeight,
                    bottom: paddingFactor * _this.containerHeight,
                    left: paddingFactor * _this.containerWidth,
                    right: paddingFactor * _this.containerWidth,
                    pitch: _this.floorModePitch,
                    heading: pointDescriptor.headingInDegrees
                };

                var viewpoint = mapviewer.getViewpointFromPositions(getViewpointParameters);
                // buildingViewpoints[buildingID] = viewpoint;
                buildingViewpoints[buildingID] = pointDescriptor;
                buildingFootprints[buildingID] = footprint.points;

                if (this.debug) {
                    console.log(buildingID + ' viewpoint ' + viewpoint.x + ',' + viewpoint.y + ', r: ' + viewpoint.radius);
                }

                if (viewpoint && viewpoint.radius > maxViewpointRadius) {
                    maxViewpointRadius = viewpoint.radius;
                }
            }
            // The maxViewpointRadius should always be greater that the maximum to avoid being in "Floor" mode when
            // setting the viewpoint for that building manually.
            maxViewpointRadius *= 2;
            if (this.debug) {
                console.log('MAX VIEWPOINT RADIUS (*2)' + maxViewpointRadius);
            }
        };

        updateBuildingViewpoints();
        // we need to update maxRadius and footprints

        // leave extra room to avoid switching to global if you clicked on building and just moved a bit

        var counter = 0;
        var isAnimating = false;

        var checkModeChangeForZoom = function () {
            if (this.debug) {
                console.log('***** setCustomPostManipulatorListener ************** ' + counter++ + 'animating: ' + isAnimating + ' ');
            }

            if (isAnimating) {
                return false;
            }
            var position = mapviewer.camera.position;
            var radius = mapviewer.camera.position.radius;
            var pitch = mapviewer.camera.pitch;
            var heading = mapviewer.camera.heading;
            var found = false;
            var currentExploreState = _this.getCurrentExploreState();

            var buildingID;
            var bestDistance = 1e99;
            var foundBuildingID;

            if (radius < maxViewpointRadius) {
                for (buildingID in buildingViewpoints) {
                    var viewpoint = buildingViewpoints[buildingID];

                    var distance = mapviewer.computeDistance(position, viewpoint);

                    if (this.debug) {
                        console.log('building ' + buildingID + ' distance ' + distance + ' viewpointRadius: ' + viewpoint.radius);
                    }

                    if (distance < bestDistance) {
                        if (this.debug) {
                            console.log('Found building ' + buildingID + ' distance ' + distance + ' viewpoint.radius: ' + viewpoint.radius + ' bestDistance ' + bestDistance);
                        }

                        foundBuildingID = buildingID;
                        bestDistance = distance;
                        found = true;
                    }
                }
                // do a second pass using footprints, in case building is small.
                for (buildingID in buildingViewpoints) {
                    if (MyMultiBuildingView.intersects2D(position, buildingFootprints[buildingID])) {
                        foundBuildingID = buildingID;
                        found = true;
                        // assumes building footprints dont overlap
                        break;
                    }
                }
            }

            if (this.debug) {
                console.log('currentExploreState mode: ' + currentExploreState.mode + ' buildingID: ' + currentExploreState.buildingID + 'found ' + found + ' foundBuildingID: ' + foundBuildingID);
            }

            var goToParameters = false;
            if (!found && currentExploreState.mode != 'global') {
                goToParameters = {
                    mode: 'global',
                    buildingID: currentExploreState.buildingID,
                    floorID: currentExploreState.floorID,
                    viewpoint: {
                        position: mapviewer.camera.position,
                        heading: heading,
                        pitch: pitch
                    }
                };
            }
            else if (found &&
                (
                    currentExploreState.mode == 'global' ||
                    (currentExploreState.mode == 'floor' && currentExploreState.buildingID != foundBuildingID)
                )
            ) {
                // you would want an animation if the floor.levelIndex is not 0
                goToParameters = {
                    mode: 'floor',
                    buildingID: foundBuildingID,
                    floorID: (foundBuildingID == currentExploreState.buildingID) ? currentExploreState.floorID : MyMultiBuildingView.DEFAULT,
                    viewpoint: {
                        position: mapviewer.camera.position,
                        heading: heading,
                        pitch: pitch
                    }
                };
            }

            if (goToParameters) {
                goToParameters.animationDuration = 0.5;
                goToParameters.noViewpoint = true;

                isAnimating = true;
                _this.goTo(goToParameters).done(function () {
                    isAnimating = false;
                });
            }
        };
        mapviewer.camera.setCustomPostManipulatorListener(checkModeChangeForZoom);

        mapviewer.on('resize', function (ev) {
            updateBuildingViewpoints();
            checkModeChangeForZoom();
        });
    }

    /*
     // Any UI updates after the state changed.
     mapviewer.on('MyMultiBuildingView.exploreStateChanged', function(ev)
     {
     var exploreState = ev.args.current;
     // switch(exploreState.mode)
     // {
     //     case 'global':
     //         globalModeButton.addClass('selected');
     //         currentRoute && currentRoute.hideLinks();
     //         break;
     //     case 'building':
     //         globalModeButton.removeClass('selected');
     //         currentRoute && currentRoute.showLinks();
     //         break;
     //     case 'floor':
     //         break;
     // }
     });
     */

    // in compatibility mode hide route links in floor mode.
    if (this.multifloorCompatibilityMode) {
        MyRoute.prototype.use_links = true;
        mapviewer.on('MyMultiBuildingView.exploreStateWillChange', function (event) {
            if (typeof(currentRoute) !== 'undefined' && currentRoute) {
                var target = event.args.target;
                if (target.mode === 'floor') {
                    currentRoute.hideLinks();
                }
                else {
                    currentRoute.showLinks();
                }
            }
        });
    }
};

/**
 * @name synthesizeVenueLayout
 * @memberOf MyMultiBuildingView
 * @function
 *
 * @description
 * Experimental: Create a single building with no outside to have multifloor like view of a non-multibuilding dataset.
 *
 * @param {vg.mapviewer.web.Mapviewer|vg.mapviewer.web2d.Mapviewer} mapviewer
 * @return {Object} object that will look like the result of mapviewer.getExtraData() of a multi-building dataset.
 *
 * @since 1.7.18
 */
MyMultiBuildingView.synthesizeVenueLayout = function (mapviewer) {
    var floorGapDefault = 100;

    var query = (jQuery.deparam && jQuery.deparam.querystring()) || {};
    if (typeof(query.gap) !== 'undefined') {
        floorGapDefault = parseFloat(query.gap);
    }


    var originalMapFloors = mapviewer.getFloors();
    if (originalMapFloors.length === 0) {
        console.log('ERROR: no floors found!');
        return false;
    }
    // copy originalMapFloors before sorting in-place
    var mapFloors = [];
    for (var i in originalMapFloors) {
        mapFloors.push(originalMapFloors[i]);
    }
    // sort by min height
    mapFloors.sort(function (a, b) {
        return a.heightMin - b.heightMin;
    });
    var defaultBuildingName = 'default';

    var data = {
        config: {
            venue_layout: {
                buildings: {},
                defaultBuilding: defaultBuildingName,
                version: 1,
                layer: '' // no global layer
            }
        },
        // resources: {}
    };
    var building = {
        defaultFloor: mapFloors[0].name,
        displayIndex: 0,
        floors: {}
    };
    var floors = {};

    var levelIndex = 0;
    var levelIndexOffset = 0; // will be used later to correct floors
    for (var i in mapFloors) {
        var mapFloor = mapFloors[i];
        floors[mapFloor.name] = {
            layer: mapFloor.name,
            levelIndex: levelIndex,
            stackGap: floorGapDefault,
            stackHeightMax: mapFloor.heightMax - mapFloor.heightMin,
            stackHeightMin: 0,
        };

        // there is a defined floor 0
        if ((mapFloor.heightMax + mapFloor.heightMin) / 2.0 === 0.0) {
            building.defaultFloor = mapFloor.name;
            levelIndexOffset = levelIndex;
        }
        levelIndex++;
    }

    // would like to correct levelIndex if we detected a floor 0
    if (levelIndexOffset != 0) {
        for (var i in floors) {
            floors[i].levelIndex -= levelIndexOffset;
        }
    }

    building.floors = floors;

    data.config.venue_layout.buildings[defaultBuildingName] = building;
    return data;
};


/**
 * @name setupMultiBuilding
 * @memberOf MyMultiBuildingView
 * @function
 *
 * @description
 * Setup listerners and UI for Multi-Building storyboard.
 *
 * @param {vg.mapviewer.web.Mapviewer|vg.mapviewer.web2d.Mapviewer} mapviewer
 * @return {boolean} true mapviewer.getExtraData() has correct multi building data (venue_layout)
 */
MyMultiBuildingView.setupMultiBuilding = function (mapviewer) {
    // getExtraData available from 1.7.17
    var data = mapviewer.getExtraData();
    var synthesizeMultibuildingData = true;

    if (!data || !data.config || !data.config.venue_layout) {
        if (synthesizeMultibuildingData) {
            data = MyMultiBuildingView.synthesizeVenueLayout(mapviewer);
            if (data === false) {
                console.log('ERROR: no vg_venue_layout, mode not supported, you need data setup for multibuilding on map editor AND synthesizeVenueLayout failed.');
                return false;
            }
            // turn on multi-floor for non-multibuilding maps?
            MyMultiBuildingView.prototype.multifloorCompatibilityMode = true;
        }
        else {
            console.log('ERROR: no vg_venue_layout, mode not supported, you need data setup for multibuilding on map editor.');
            return false;
        }
    }

    var venueLayoutLocalization;
    var language;
    // TODO also use navigator.languages
    if (data && data.resources) {
        var navigatorLanguage = window.navigator.userLanguage || window.navigator.language; // first is for IE
        var languagesToTry = [];
        if (typeof(navigatorLanguage) === 'string') {
            navigatorLanguage = navigatorLanguage.replace(/-.*/, '');
            languagesToTry.push(navigatorLanguage);
        }
        languagesToTry.push('default');

        for (var i in languagesToTry) {
            language = languagesToTry[i];
            if (data.resources[language] &&
                data.resources[language].localized &&
                data.resources[language].localized.version == 1 &&
                data.resources[language].localized.locale &&
                data.resources[language].localized.locale[language] &&
                data.resources[language].localized.locale[language].venueLayout
            ) {
                venueLayoutLocalization = data.resources[language].localized.locale[language].venueLayout;
                break;
            }
        }
    }

    var venueLayout = data.config.venue_layout;
    // for the most part, we go for the defaults
    var parameters = {
        'containerDivSelector': '#container'
    };

    multiBuildingView = new MyMultiBuildingView(mapviewer, venueLayout, venueLayoutLocalization, parameters);
    //multiBuildingView.setupMultibuildingFloorUI();

    // for debugging floor at a lower level
    mapviewer.highlight(mapviewer.getPlace('B3-UL0-ID0077'), 0x00ff0000);


    var query = (jQuery.deparam && jQuery.deparam.querystring()) || {};


    if (typeof(query.initialfloor) != 'undefined') {
        var initialFloorName = query.initialfloor;
        // start in an specific floor in multibuilding mode.
        multiBuildingView.goTo({
            mode: 'floor',
            floorID: initialFloorName,
            animationDuration: 0
        })
            .fail(function () {
                // if for example that floor does not exist, fallback to "global" which will always do something.
                multiBuildingView.goTo({
                    mode: 'global',
                    buildingID: MyMultiBuildingView.DEFAULT,
                    floorID: MyMultiBuildingView.DEFAULT,
                    animationDuration: 0
                });
            });
    }
    else {
        // start in global
        multiBuildingView.goTo({
            mode: 'global',
            buildingID: MyMultiBuildingView.DEFAULT,
            floorID: MyMultiBuildingView.DEFAULT,
            animationDuration: 0
        });
    }

    // multiBuildingView.goTo({
    //     mode: 'floor',
    //     floorID: 'B4-UL04',
    //     animationDuration: 0,
    //     viewpoint: {
    //         position: {x: -127.8117136719601, y: -135.464972367098, radius: 64.24722758526218}
    //     }
    // });

    // multiBuildingView.goTo({
    //     mode: 'floor',
    //     floorID: 'outside',
    //     animationDuration: 0,
    //     viewpoint: {
    //         position: {x: -127.8117136719601, y: -135.464972367098, radius: 64.24722758526218}
    //     }
    // });

    // multiBuildingView.goTo({
    //     mode: 'floor',
    //     floorID: 'outside',
    //     animationDuration: 0,
    //     viewpoint: {
    //         position: {x: -29.461311719562296, y: -66.63238231415653, radius: 156.8535829718315}
    //     }
    // });

    // multiBuildingView.goTo({
    //     place: 'B4-UL02-ID0026'
    // });

    return multiBuildingView;
};
MyMultiBuildingView.prototype.setDefaultView = function () {
    let _this = this;
    let currentExploreState = _this.getCurrentExploreState();
    {
        _this.goTo({
            mode: 'global',
            buildingID: currentExploreState.buildingID || MyMultiBuildingView.DEFAULT
        });
    }
};
