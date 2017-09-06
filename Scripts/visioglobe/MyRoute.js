/**
 * Created by Nekrasov on 7/18/2017.
 */
/**
 * @public
 * @name MyRoute
 * @class
 * @constructor MyRoute
 * @description
 * It allows the rendering of a route if available from computeRoute().
 * Creates a route object to simplify the display of line routes, start/end/change floor icons.
 * It uses for the media directory the value of vg.imagePath (by default "../media"), which contains:
 * <ul>
 * <li>image for route style: 2d_track_blue_boomerang.png
 * <li>images for pins for start, end of route and change floor
 * </ul>
 *
 * @see vg.mapviewer.Mapviewer.html#computeRoute
 * @param {vg.mapviewer.Mapviewer} pViewer
 * @param {Object} pRouteData result of vg.mapviewer.Mapviewer.computeRoute()
 *
 * @example
 pRouteData will have the form
 {
     "name" : "Route Result",
     "src" : "LG002",
     "dst" : "LG011",
     "status" : "200",
     "legs" :[
      {
          "dataset" : "L",
          "points" : [{ "lat" : "5.1980516","lon" : "45.2789357" }, ... ]
      }
      , ...
     ],
      "length": "62.7925949"
 }
 */
class MyRoute {
    constructor(pViewer, pRouteData) {
        var imagePath = vg.imagePath || 'Content/images';

        var trackImage = imagePath + '/2d_track_blue_boomerang.png';
        var startImage = imagePath + '/track_start.png';
        var endImage = imagePath + '/track_end.png';
        var waypointImage = imagePath + '/track_intermediate_destination.png';
        var upImage = imagePath + '/track_up.png';
        var downImage = imagePath + '/track_down.png';
        var modalityChangeImage = imagePath + '/track_modality_change.png';
        var layerChangeImage = imagePath + '/track_layer_change.png';
        // TODO have image for each modality, have RoutingServer also give you that information on the route.

        var showStartPin = true;
        var showEndPin = true;

        var routePinHeight = 3;


        this.initialFloor = false;
        this.initialFloorPoints = [];

        // This is used to get an approximation of the floor height
        // assumes floors are ordered by height.
        var getFloorIndex = function (pName) {
            for (fi in mFloors) {
                var f = mFloors[fi];
                if (f.name == pName) {
                    return f.index;
                }
            }
            return 0;
        };


        var getFloorHeight = function (pRouteDataLeg) {
            if (typeof(pRouteDataLeg.height) !== 'undefined') {
                return pRouteDataLeg.height;
            }
            // otherwise use approximation
            return getFloorIndex(pRouteDataLeg.dataset);
        };

        var mapviewer = pViewer;

        var mFloors = mapviewer.getFloors();

        var mOverlayRouteLines = [];
        var mOverlayRouteLinks = [];
        var mOverlayRoutePOIs = [];

        var mValid = false;

        var mModalityChangeCounter = 0;
        var mLayerChangeCounter = 0;

        /**
         * @public
         * @name addStartPOI
         * @function
         * @memberOf MyRoute#
         * @description
         * Create a start POI at a given floor name and position.
         *  It is used when creating a route,
         * but can also be used separately, for example creating start POI after setting the start.
         * @param {string} floorName
         * @param {position} position object with {x:,y:,z:}
         * @example
         var routeStartEnd = new MyRoute(mapviewer);
         ...
         routeStartEnd.remove();
         ...
         var place = mapviewer.getPlace(id);
         if (place)
         {
             var position = {x: place.vg.position.x, y: place.vg.position.y, z: 3};
             routeStartEnd.addStartPOI(place.vg.floor, position);
         }
         * @since 1.7.14
         */
        this['addStartPOI'] = function (floorName, position) {
            mOverlayRoutePOIs.push(
                mapviewer.addPOI({
                    floor: floorName,
                    url: startImage,
                    onObjectMouseUp: function () {
                        alert('start');
                        return false; // return false to avoid calling global onObjectMouseUp function
                    },
                    // text: 'START',
                    id: 'START',
                    position: position,
                    scale: 4.0,
                    overlay: true
                })
            );
        };

        /**
         * @public
         * @name addEndPOI
         * @function
         * @memberOf MyRoute#
         * @description
         * Create a end POI at a given floor name and position.
         *  It is used when creating a route,
         * but can also be used separately, for example creating start POI after setting the start.
         * @param {string} floorName
         * @param {position} position object with {x:,y:,z:}
         * @example
         var routeStartEnd = new MyRoute(mapviewer);
         ...
         routeStartEnd.remove();
         ...
         var place = mapviewer.getPlace(id);
         if (place)
         {
             var position = {x: place.vg.position.x, y: place.vg.position.y, z: 3};
             routeStartEnd.addEndPOI(place.vg.floor, position);
         }
         * @since 1.7.14
         */
        this['addEndPOI'] = function (floorName, position) {
            mOverlayRoutePOIs.push(
                mapviewer.addPOI({
                    floor: floorName,
                    url: endImage,
                    onObjectMouseUp: function () {
                        alert('end');
                        return false; // return false to avoid calling global onObjectMouseUp function
                    },
                    // text: 'START',
                    id: 'END',
                    position: position,
                    scale: 4.0,
                    overlay: true
                })
            );
        };

        /**
         * @public
         * @name addWaypointPOI
         * @function
         * @memberOf MyRoute#
         * @description
         * Create a waypoint POI at a given floor name and position.
         *  It is used when creating a route,
         * but can also be used separately, for example creating start POI after setting the start.
         * @param {string} floorName
         * @param {position} position object with {x:,y:,z:}
         * @example
         var routeStartEnd = new MyRoute(mapviewer);
         ...
         routeStartEnd.remove();
         ...
         var place = mapviewer.getPlace(id);
         if (place)
         {
             var position = {x: place.vg.position.x, y: place.vg.position.y, z: 3};
             routeStartEnd.addWaypointPOI(place.vg.floor, position);
         }
         * @since 1.7.15
         */
        this['addWaypointPOI'] = function (floorName, position) {
            mOverlayRoutePOIs.push(
                mapviewer.addPOI({
                    floor: floorName,
                    url: waypointImage,
                    onObjectMouseUp: function () {
                        alert('waypoint');
                        return false; // return false to avoid calling global onObjectMouseUp function
                    },
                    clickable: false,
                    // text: 'START',
                    id: 'WAYPOINT',
                    position: position,
                    scale: 4.0,
                    overlay: true
                })
            );
        };

        var routeDataLegs = pRouteData && pRouteData['legs'];
        if (routeDataLegs !== undefined) {
            // console.log("New Route, length: "+pRouteData['length']);

            for (var l = 0, ll = routeDataLegs.length; l < ll; l++) {
                var routeDataLeg = routeDataLegs[l];
                var overlayPoints = [];
                var lCurrentFloorName = routeDataLeg['dataset'];
                var lCurrentFloorHeight = getFloorHeight(routeDataLeg);
                var lCurrentFloorModality = routeDataLeg['modality'];
                var lCurrentDestinationIndex = routeDataLeg['destinationIndex'];

                var routeDataLegPoints = routeDataLeg['points'];
                for (var j = 0, jl = routeDataLegPoints.length; j < jl; j++) {
                    var point = routeDataLegPoints[j];
                    // transfor to new coordinates
                    point = mapviewer.convertLatLonToPoint(point);
                    // point.z = 0.5;
                    overlayPoints.push(point);
                }

                var pathBase;
                var pathAnimated;

                // For the first leg
                // Update Initial Floor Information
                if (this.initialFloor === false) {
                    this.initialFloor = lCurrentFloorName;
                }
                // collect all positions that are on the initial floor from all route legs
                if (this.initialFloor == lCurrentFloorName) {
                    this.initialFloorPoints = this.initialFloorPoints.concat(overlayPoints);
                }

                if (overlayPoints.length > 1) {
                    var lSpeed = 1.0;
                    // APM, travelator
                    var lModality = routeDataLeg['modality'];
                    switch (lModality) {
                        case 'APM':
                            lSpeed = 5.0;
                            break;
                        case 'shuttle':
                            lSpeed = 5.0;
                            break;
                        case 'travelator':
                            lSpeed = 3.0;
                            break;
                    }

                    // Reset speed to avoid CPU usage
                    // lSpeed = 0;

                    // Configure how the line looks
                    var path_options = {
                        floor: lCurrentFloorName,
                        url: trackImage, // only available on vg.mapviewer.web.Mapviewer
                        speed: lSpeed, // only available on vg.mapviewer.web.Mapviewer
                        repeat: -1, // only available on vg.mapviewer.web.Mapviewer
                        thickness: 2.0,

                        // color: "#f00", // change the color of the line
                        points: overlayPoints,

                        // only available on vg.mapviewer.web.Mapviewer, this makes it looks
                        // better for sharp turns. Negative values will try to adapt the number of
                        // segments to the length of the route, such that the absolute value
                        // indicates the number of segments per "??unit??"
                        segments: 1000,
                        overlay: true // available in VisioWeb 1.7.16+, true so arrows appear in front of geometries
                    };

                    if (mapviewer.sdkType === 'web2d') {
                        // for VisioWeb2D the thickness is in pixels, so we increase it
                        path_options.thickness = 8.0;
                        path_options.color = '#19E0FF';

                        // Use this to color different segments different shades of red.
                        if (false && typeof(routeDataLeg.destinationIndex) == 'number') {   // assume maximum 8
                            var hex_red = Number(255 - routeDataLeg.destinationIndex * 32).toString(16);
                            if (hex_red.length == 1) {
                                hex_red = '0' + hex_red;
                            }
                            path_options.color = '#' + hex_red + '0000';
                            // path_options.color = '#E019FF';
                        }

                        path_options.opacity = 0.7;
                        pathBase = mapviewer.addRoutingPath(path_options);
                        if (pathBase !== false) {
                            mOverlayRouteLines.push(pathBase);
                        }
                    }
                    else {
                        // create two lines, one animated and another one as a base.
                        var overlayPointsBase = [];
                        for (var i in overlayPoints) {
                            var pt = overlayPoints[i];
                            overlayPointsBase.push({x: pt.x, y: pt.y, z: pt.z - 0.2});
                        }
                        // Base
                        var path_options_base = {
                            floor: lCurrentFloorName,
                            thickness: 1.5,

                            color: '#19E0FF', // change the color of the line
                            points: overlayPointsBase,
                            opacity: 0.7,
                            // only available on vg.mapviewer.web.Mapviewer, this makes it looks
                            // better for sharp turns. Negative values will try to adapt the number of
                            // segments to the length of the route, such that the absolute value
                            // indicates the number of segments per "??unit??"
                            segments: 1000,
                            overlay: false // so the base appears behind geoemtries
                        };

                        // add arrows over them.
                        pathAnimated = mapviewer.addRoutingPath(path_options);
                        if (pathAnimated !== false) {
                            mOverlayRouteLines.push(pathAnimated);
                        }
                        // add back support
                        pathBase = mapviewer.addRoutingPath(path_options_base);
                        if (pathBase !== false) {
                            mOverlayRouteLines.push(pathBase);
                        }
                    }
                }

                // Start, first leg, first point
                if (l == 0 && showStartPin) {
                    /* A start */
                    this.addStartPOI(lCurrentFloorName, {
                        x: overlayPoints[0].x,
                        y: overlayPoints[0].y,
                        z: routePinHeight
                    });
                }
                var lastPointIndex = overlayPoints.length - 1;
                if (l == (routeDataLegs.length - 1) && showEndPin) {
                    /* B end */
                    this.addEndPOI(lCurrentFloorName, {
                        x: overlayPoints[lastPointIndex].x,
                        y: overlayPoints[lastPointIndex].y,
                        z: routePinHeight
                    });
                }

                // console.log('lCurrentFloorHeight '+lCurrentFloorHeight);
                if (routeDataLegs.length > 1) {
                    if (l > 0) {
                        // There are legs before us
                        var lPrevFloorName = routeDataLegs[l - 1]['dataset'];
                        var lPrevFloorHeight = getFloorHeight(routeDataLegs[l - 1]);
                        // console.log('lPrevFloorHeight '+lPrevFloorHeight);

                        // go to previous, at beginning of line
                        if (lPrevFloorHeight != lCurrentFloorHeight) {
                            if (this.add_go_back_pois) {
                                (function (prevFloorName, prevFloorHeight) {
                                    mOverlayRoutePOIs.push(
                                        mapviewer.addPOI({
                                            floor: lCurrentFloorName,
                                            url: (prevFloorHeight > lCurrentFloorHeight) ? upImage : downImage,
                                            id: 'GO TO PREV ' + lCurrentFloorName + '->' + prevFloorName,
                                            onObjectMouseUp: function () {
                                                mapviewer.changeFloor(prevFloorName);

                                                return false;
                                            },
                                            position: {x: overlayPoints[0].x, y: overlayPoints[0].y, z: routePinHeight},
                                            alignment: {x: -1, y: 0},
                                            scale: 4.0,
                                            overlay: true
                                        })
                                    );
                                })(lPrevFloorName, lPrevFloorHeight);
                            }


                            //
                            // Multibuilding link
                            //
                            // needs VisioKiosk (now named VisioWeb) 1.7.14
                            if (this.use_links && typeof(mapviewer.addRoutingLink) === 'function') {
                                var lPrevFloorDataLegPoints = routeDataLegs[l - 1]['points'];
                                var lPrevFloorPointStart = mapviewer.convertLatLonToPoint(lPrevFloorDataLegPoints[lPrevFloorDataLegPoints.length - 1]);
                                var lCurFloorPointEnd = overlayPoints[0];

                                var link_options = {
                                    floor: lPrevFloorName,
                                    url: trackImage, // only available on vg.mapviewer.web.Mapviewer
                                    speed: lSpeed, // only available on vg.mapviewer.web.Mapviewer
                                    repeat: -1, // only available on vg.mapviewer.web.Mapviewer
                                    thickness: 5.0,
                                    startFloor: lPrevFloorName,
                                    endFloor: lCurrentFloorName,
                                    // color: "#f00", // change the color of the line
                                    startPoint: lPrevFloorPointStart,
                                    endPoint: lCurFloorPointEnd,

                                    // interpolationEnd: 0.03,
                                    // only available on vg.mapviewer.web.Mapviewer, this makes it looks
                                    // better for sharp turns. Negative values will try to adapt the number of
                                    // segments to the length of the route, such that the absolute value
                                    // indicates the number of segments per "??unit??"
                                    segments: 1000,
                                    fixed: false
                                };
                                var link = mapviewer.addRoutingLink(link_options);
                                mOverlayRouteLinks.push(link);

                                // For fun
                                // (function(link) {
                                // 	jQuery({start: 0}).animate({start: 1},{
                                // 		duration: 3000,
                                // 		step: function (s) {
                                // 			link.setInterpolatedStartEnd(0,s);
                                // 		} });

                                // })(link);
                            }
                        }
                        else {
                            if (this.add_go_back_pois && lPrevFloorName != lCurrentFloorName) {
                                // if the names of the floors are different, but have the same height
                                // then we are on a change building scenario
                                (function (prevFloorName, prevFloorHeight) {
                                    mOverlayRoutePOIs.push(
                                        mapviewer.addPOI({
                                            floor: lCurrentFloorName,
                                            url: layerChangeImage,
                                            id: 'LAYERCHANGE ' + mLayerChangeCounter++,
                                            onObjectMouseUp: function () {
                                                mapviewer.changeFloor(prevFloorName);
                                                return false;
                                            },
                                            position: {x: overlayPoints[0].x, y: overlayPoints[0].y, z: routePinHeight},
                                            alignment: {x: 1, y: 0},
                                            scale: 4.0,
                                            overlay: true
                                        })
                                    );
                                })(lPrevFloorName, lPrevFloorHeight);
                            }

                            // no need to do modality, since it is only done once
                            // when legs ahead of us
                        }
                    }
                    if (l < (routeDataLegs.length - 1)) {
                        // There are legs ahead of us.
                        var lNextLeg = routeDataLegs[l + 1];
                        var lNextFloorName = lNextLeg['dataset'];
                        var lNextFloorHeight = getFloorHeight(lNextLeg);
                        var lNextFloorModality = lNextLeg['modality'];
                        var lNextDestinationIndex = lNextLeg['destinationIndex'];

                        // console.log('lNextFloorHeight '+lNextFloorHeight);

                        if (lNextDestinationIndex != lCurrentDestinationIndex) {
                            mOverlayRoutePOIs.push(
                                mapviewer.addPOI({
                                    floor: lCurrentFloorName,
                                    url: waypointImage,
                                    id: 'WAYPOINT',
                                    position: {
                                        x: overlayPoints[lastPointIndex].x,
                                        y: overlayPoints[lastPointIndex].y,
                                        z: routePinHeight
                                    },
                                    alignment: {x: 0, y: 1},
                                    scale: 4.0,
                                    overlay: true,
                                    clickable: false
                                })
                            );
                        }


                        if (lNextFloorHeight != lCurrentFloorHeight) {
                            (function (nextFloorName, nextFloorHeight) {
                                console.log(lNextDestinationIndex, lNextLeg);
                                // go to next
                                mOverlayRoutePOIs.push(
                                    mapviewer.addPOI({
                                        floor: lCurrentFloorName,
                                        url: (nextFloorHeight > lCurrentFloorHeight) ? upImage : downImage,
                                        id: 'GO TO NEXT ' + lCurrentFloorName + '->' + nextFloorName,
                                        onObjectMouseUp: function () {
                                            mapviewer.changeFloor(nextFloorName);
                                            return false;
                                        },
                                        position: {
                                            x: overlayPoints[lastPointIndex].x,
                                            y: overlayPoints[lastPointIndex].y,
                                            z: routePinHeight
                                        },
                                        alignment: {x: 0, y: 1},
                                        scale: 4.0,
                                        overlay: true
                                    })
                                );
                            })(lNextFloorName, lNextFloorHeight);
                        }
                        else {
                            if (lNextFloorName != lCurrentFloorName) {
                                // if the names of the floors are different, but have the same height
                                // then we are on a change building scenario
                                (function (nextFloorName, nextFloorHeight) {
                                    // go to next
                                    mOverlayRoutePOIs.push(
                                        mapviewer.addPOI({
                                            floor: lCurrentFloorName,
                                            url: layerChangeImage,
                                            id: 'LAYERCHANGE ' + mLayerChangeCounter++,
                                            onObjectMouseUp: function () {
                                                mapviewer.changeFloor(nextFloorName);
                                                return false;
                                            },
                                            position: {
                                                x: overlayPoints[lastPointIndex].x,
                                                y: overlayPoints[lastPointIndex].y,
                                                z: routePinHeight
                                            },
                                            alignment: {x: 0, y: -1},
                                            scale: 4.0,
                                            overlay: true
                                        })
                                    );
                                })(lNextFloorName, lNextFloorHeight);
                            }
                            else if (lNextFloorModality != lCurrentFloorModality) {
                                mOverlayRoutePOIs.push(
                                    mapviewer.addPOI({
                                        floor: lCurrentFloorName,
                                        url: modalityChangeImage,
                                        id: 'MODALITYCHANGE ' + mModalityChangeCounter++,
                                        position: {
                                            x: overlayPoints[lastPointIndex].x,
                                            y: overlayPoints[lastPointIndex].y,
                                            z: routePinHeight
                                        },
                                        alignment: {x: 0, y: -1},
                                        scale: 4.0,
                                        overlay: true,
                                        clickable: false
                                    })
                                );
                            }
                        }
                    }
                }
            }
            mValid = true;
        }

        /**
         * @public
         * @name isValid
         * @function
         * @memberOf MyRoute#
         * @description
         * Determine if the object has been succesfully created AND is currently
         * valid.
         * @return {Boolean} True if the object is valid, otherwise false.
         */
        this['isValid'] = function () {
            return mValid;
        };

        /**
         * @public
         * @name show
         * @function
         * @memberOf MyRoute#
         * @description
         * Display the route if hidden
         */
        this['show'] = function () {
            for (var i in mOverlayRoutePOIs) {
                mOverlayRoutePOIs[i].show();
            }
            for (var i in mOverlayRouteLines) {
                mOverlayRouteLines[i].show();
            }
        };

        /**
         * @public
         * @name hide
         * @function
         * @memberOf MyRoute#
         * @description
         * Hides the route if visible
         */
        this['hide'] = function () {
            for (var i in mOverlayRoutePOIs) {
                mOverlayRoutePOIs[i].hide();
            }
            for (var i in mOverlayRouteLines) {
                mOverlayRouteLines[i].hide();
            }
        };


        /**
         * @public
         * @name showLinks
         * @function
         * @memberOf MyRoute#
         * @description
         * Display the links between floors
         * @since 1.7.14
         */
        this['showLinks'] = function () {
            for (var i in mOverlayRouteLinks) {
                mOverlayRouteLinks[i].show();
            }
        };

        /**
         * @public
         * @name hideLinks
         * @function
         * @memberOf MyRoute#
         * @description
         * Hide the links between floors
         * @since 1.7.14
         */
        this['hideLinks'] = function () {
            for (var i in mOverlayRouteLinks) {
                mOverlayRouteLinks[i].hide();
            }
        };

        /**
         * @public
         * @name remove
         * @function
         * @memberOf MyRoute#
         * @description
         * removes the route and its links
         */
        this['remove'] = function () {
            for (var i in mOverlayRoutePOIs) {
                mOverlayRoutePOIs[i].remove();
            }

            for (var i in mOverlayRouteLines) {
                mOverlayRouteLines[i].remove();
            }
            for (var i in mOverlayRouteLinks) {
                mOverlayRouteLinks[i].remove();
            }

            // Since it is a remove, clear the arrays to avoid calling remove twice.
            mOverlayRoutePOIs = [];
            mOverlayRouteLines = [];
            mOverlayRouteLinks = [];
        };


        /**
         * @public
         * @name getInitialFloor
         * @function
         * @memberOf MyRoute#
         * @return {string} the floor name of the first floor of the route
         */
        this['getInitialFloor'] = function () {
            return this.initialFloor;
        };

        /**
         * @public
         * @name getInitialViewpointPosition
         * @function
         * @memberOf MyRoute#
         * @return {string} the floor name of the first floor of the route
         */
        this['getInitialViewpointPosition'] = function () {
            var viewAllRouteOnFirstFloor = true;
            var viewpoint;
            if (viewAllRouteOnFirstFloor) {
                viewpoint = mapviewer.getViewpointFromPositions({
                    points: this.initialFloorPoints,
                    top: 50,
                    bottom: 50,
                    left: 50,
                    right: 50
                });
            }
            else {
                // start the view at the start position
                viewpoint = mapviewer.getViewpointFromPositions({
                    points: [this.initialFloorPoints[0]]
                });
            }

            return viewpoint;
        };
    };

    /**
     * @public
     * @name use_links
     * @field
     * @type number
     * @memberOf MyRoute.prototype
     * @description use links between floors, useful only if useing MyMultiBuildingView.multifloorCompatibilityMode. default is false.
     * @since 1.7.17
     * @since 1.7.18 moved it outside as a class variable.
     */
    static get  use_links() {
        return false;
    }// draw links between floors, available since VisioKiosk (now named VisioWeb) 1.7.14

    /**
     * @public
     * @name add_go_back_pois
     * @field
     * @type number
     * @memberOf MyRoute.prototype
     * @description Show pois that allow you to back on the route (like the previous floor). default is false.
     * @since 1.7.17
     * @since 1.7.18 moved it as a prototype variable.
     */
    static get add_go_back_pois() {
        return false;
    } // add POIs to the previous layer you were coming from.
}