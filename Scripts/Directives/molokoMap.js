(function () {
    "use strict";

    const constants = {
        Terminal: 0,
        Link: 1,
        Service: 2
    };

    class MolokoMapController {
        constructor($rootScope, settings, $linq, $state, $stateParams, $timeout, $element, vgIdService, $scope, dbService, $q, organizationService) {
            this.$rootScope = $rootScope;
            this.organizationService = organizationService;
            this.$q = $q;
            this.dbService = dbService;
            this.$scope = $scope;
            this.vgIdService = vgIdService;
            this.settings = settings;
            this.$linq = $linq;
            this.$state = $state;
            this.$stateParams = $stateParams;
            this.$timeout = $timeout;
            this.$element = $element;
            vg.imagePath = settings.visioglobeImagePath;
            this.mapviewer = new vg.mapviewer.Mapviewer();
            this.currentNavigation = null;
            this.paddings = {
                left: 50,
                top: 50,
                bottom: 50,
                right: 50
            }
        }

        resetCamera() {
            let self = this;
            let positions = this.$linq.Enumerable().From(this.mapviewer.getAllPlaces()).Select(i => i.Value.vg.position).ToArray();
            let viewpoint_options = Object.assign({
                points: positions
            }, self.paddings);

            if (self.TerminalMapObject) {
                self.mapviewer.camera.rotation = self.TerminalMapObject.Params.LookDirectionAngleDegrees;
            }
            else {
                self.mapviewer.camera.rotation = 0.047;
            }
            self.mapviewer.camera.pitch = -50;
            self.mapviewer.camera.position = self.mapviewer.getViewpointFromPositions(viewpoint_options);
        }

        reset() {
            let self = this;

            if (self.TerminalMapObject !== undefined) {
                self.setFloor(self.mapFloors.find(floor => floor.number === self.TerminalMapObject.Number).name);
            }
            else {
                this.setFloor('outside');
            }
            self.resetCamera();
            if (this.currentRoute != null) {
                this.currentRoute.remove();
                this.currentRoute = null;
            }
            if (this.currentNavigation != null) {
                this.currentNavigation.remove();
                this.currentNavigation = null;
            }
            if (this.active_shop !== null) {
                this.mapviewer.removeHighlight(this.active_shop);
                this.active_shop = null;
            }
            if (self.selectedShops && self.selectedShops.length !== 0) {
                self.selectedShops.forEach(i => self.mapviewer.removeHighlight(i));
            }
            delete self.selectedOrganizations;
        }

        zoomIn() {
            let position = this.mapviewer.camera.position;
            position.radius -= 300;
            this.mapviewer.camera.goTo(position, {animationDuration: 300});
        }

        zoomInDisabled() {
            return this.mapviewer.camera.position.radius <= this.mapviewer.camera.minRadius;
        }

        zoomOut() {
            let position = this.mapviewer.camera.position;
            position.radius += 300;
            this.mapviewer.camera.goTo(position, {animationDuration: 300});
        }

        zoomOutDisabled() {
            return this.mapviewer.camera.position.radius >= this.mapviewer.camera.maxRadius;
        };

        setFloor(floor) {
            if (this.mapviewer.getCurrentFloor() === floor)
                return;
            this.mapviewer.changeFloor(floor, {animationDuration: 300});
            this.$timeout(() => {
                this.currentMapFloor = floor;
            });

        }

        onObjectMouseUp(event, element) {
            let shop, idSrc, self = this;
            if (element.vg) {
                idSrc = element.options ? element.options('id') : element.vg.id; //'KSK-15';
                shop = this.mapviewer.getPlace(idSrc);
                if (shop === false) {
                    return;
                }
            }
            self.organizationService.getByVisioglobeId(idSrc).then(organization => {
                if (!organization) {
                    console.error('Нет соответтсвия организации для VisioglobeID', idSrc);
                    return;
                }
                self.$state.go('navigation.' + organization.OrganizationType, {
                    OrganizationID: organization.OrganizationID,
                });
            });
            // if (this.active_shop !== null) {
            //     this.mapviewer.removeHighlight(this.active_shop);
            //     this.active_shop = null;
            // }
            // this.mapviewer.highlight(shop, 0x00FF00, {opacity: 0.5});
            // this.active_shop = shop;
            //
            // this.doRouting(self.TerminalMapObject.Organization.VisioglobeID, idSrc);
        }

        displayPrevInstruction() {
            if (this.currentNavigation) {
                this.currentNavigation.displayPrevInstruction();
            }
        }

        displayNextInstruction() {
            if (this.currentNavigation) {
                this.currentNavigation.displayNextInstruction();
            }
        }

        doRouting(shop_src, shop_dst) {
            let self = this;

            let lRouteRequest = {src: shop_src, dst: shop_dst, language: 'ru'};

            lRouteRequest.routingParameters = {};
            lRouteRequest.computeNavigation = true;
            // Override certain navigation parameters
            lRouteRequest.navigationParameters = lRouteRequest.navigationParameters || {};
            lRouteRequest.navigationParameters.modalityParameters = lRouteRequest.navigationParameters.mModalityParameters || {};
            lRouteRequest.navigationParameters.modalityParameters.shuttle = lRouteRequest.navigationParameters.modalityParameters.shuttle || {};
            lRouteRequest.navigationParameters.modalityParameters.shuttle.straightAngleThreshold = lRouteRequest.navigationParameters.modalityParameters.shuttle.straightAngleThreshold || 180.0;
            lRouteRequest.navigationParameters.modalityParameters.shuttle.distanceFromCouloirThreshold = lRouteRequest.navigationParameters.modalityParameters.shuttle.distanceFromCouloirThreshold || 1000.0;

            // reset start end pins
            if (this.routeStartEnd != null) {
                this.routeStartEnd.remove();
            }

            this.mapviewer.computeRoute(lRouteRequest)
                .fail(function (pRouteRequest) {
                    alert('Sorry, there are problems with Routing Server');
                })
                .done(function (pRouteRequest, pRouteData) {
                    // alert('Success '+ pRouteData);

                    if (self.currentRoute != null) {
                        self.currentRoute.remove();
                    }
                    if (self.currentNavigation != null) {
                        self.currentNavigation.remove();
                    }

                    if (pRouteData.status && pRouteData.status != 200) {
                        alert('Sorry, no route available between ' + pRouteRequest.src + ' and ' + pRouteRequest.dst + '.');
                        return;
                    }

                    self.currentRoute = new MyRoute(self.mapviewer, pRouteData);
                    if (self.currentRoute.isValid()) {
                        self.currentRoute.show();
                    }
                    else {
                        alert('Problems rendering the route between ' + pRouteRequest.src + ' and ' + pRouteRequest.dst + '.');
                    }
                    self.currentNavigation = new MyNavigation(self.mapviewer, pRouteData, self.ids);
                    self.currentNavigation.goToCurrentInstruction();
                    //self.$scope.$digest();
                    //instructions_overlay_visible = true;
                    //updateToggleInstructions();
                });
        }


        $onInit() {
            let self = this;

            let dataPromise = this.dbService.getData();
            dataPromise.then(data => {
                let floor = data.Floors.find(i => i.TerminalMapObject);
                self.TerminalMapObject = floor.TerminalMapObject;
                self.TerminalMapObject.Organization.VisioglobeID = 'KSK-15';
                if (self.TerminalMapObject !== undefined) {
                    self.TerminalMapObject.Number = data.Floors.find(flr => flr.FloorID == self.TerminalMapObject.FloorID).Number;
                }
            });

            let elm = this.$element[0].children[0].children[0];
            let mapURL = 'Content/visioglobe/descriptor.json';
            let mapviewer_parameters = {
                path: mapURL,
                onObjectMouseUp: (event, element) => self.onObjectMouseUp(event, element)
            };

            // this.vgIdService.get().then(i => {
            //     this.ids = i;
            //
            // });
            let mapPromise = this.$q.defer();
            this.mapviewer.initialize(elm, mapviewer_parameters)
                .done(function () {
                    self.mapviewer.start();
                    let index = 1;
                    self.mapFloors = self.mapviewer.getFloors().filter(i => i.name !== 'outside').map(i => {
                        return {
                            name: i.name,
                            number: index++
                        }
                    });
                    self.multiBuildingView = MyMultiBuildingView.setupMultiBuilding(self.mapviewer);

                    let viewpoint_options = {points: [self.mapviewer.camera.position], left: 500};
                    self.mapviewer.camera.position = self.mapviewer.getViewpointFromPositions(viewpoint_options);

                    self.mapviewer.setPlaceName('KSK-15', 'Terminal');

                    mapPromise.resolve();

                    let r = self.mapviewer.getPlace('iPoint2');
                });
            this.$q.all([dataPromise, mapPromise.promise]).then(i => {
                self.reset();
            });

            this.mapviewer.on('MyMultiBuildingView.exploreStateWillChange', function (event) {
                // console.log(event);
                if (event.args.current.mode === "global" && event.args.target.mode === "building") {
                    self.setFloor(event.args.target.floorID);
                    return false;
                }
            });
            self.$rootScope.$on('$stateChangeSuccess',
                function (event, toState, toParams, fromState, fromParams) {
                    if (toState.resetMap)
                        self.reset();
                    if (self.$state.params.OrganizationID) {
                        if (self.selectedShops && self.selectedShops.length !== 0) {
                            self.selectedShops.forEach(i => self.mapviewer.removeHighlight(i));
                        }
                        self.dbService.organizationGetById(self.$state.params.OrganizationID).then(org => {
                            self.selectedOrganizations = [org];
                            if (!org.VisioglobeID) {
                                console.error('Нет VisioglobeID у организации', org.OrganizationID);
                                return;
                            }
                            if (self.mapviewer.isLoaded()) {
                                // let places = self.mapviewer.getAllPlaces();
                                // let r = Math.floor(Math.random() * (Object.keys(places).length));
                                // let key = places[Object.keys(places)[r]];
                                let key = self.mapviewer.getPlace(org.VisioglobeID);
                                if (self.active_shop !== null) {
                                    self.mapviewer.removeHighlight(self.active_shop);
                                    self.active_shop = null;
                                }
                                self.mapviewer.highlight(key, 0x00FF00, {opacity: 0.5});
                                self.active_shop = key;
                                self.setFloor(key.vg.floor);
                                self.doRouting(self.TerminalMapObject.Organization.VisioglobeID || 'KSK-15', key.vg.id);
                            }
                        });
                    } else if (self.$state.params.Organizations) {
                        self.selectOrganizations(self.$state.params.Organizations);
                    }
                    else {
                        self.reset();
                    }

                });
            self.$rootScope.$on('resetMap', function () {
                self.reset();
            });
        }

        getCount(floor) {
            let self = this;
            if (!this.selectedOrganizations || !self.currentMapFloor)
                return;
            let count = this.$linq.Enumerable().From(this.selectedOrganizations).Count(i => i.Floors.map(j => j.Number).includes(floor.number));
            return count === 0 ? undefined : count;
        }

        selectOrganizations(organizations) {
            let self = this;
            self.selectedOrganizations = organizations;
            if (self.selectedShops && self.selectedShops.length !== 0) {
                self.selectedShops.forEach(i => self.mapviewer.removeHighlight(i));
            }
            if (organizations && organizations.length !== 0) {
                self.selectedShops = organizations.filter(i => i.VisioglobeID).map(i => self.mapviewer.getPlace(i.VisioglobeID)).filter(i => i !== false);
                self.selectedShops.forEach(i => {
                    this.mapviewer.highlight(i, 0x00FF00, {opacity: 0.5});
                });
                let positions = self.selectedShops.map(i => i.vg.position);
                let viewpoint_options = Object.assign({
                    points: positions
                }, self.paddings);
                self.mapviewer.camera.position = self.mapviewer.getViewpointFromPositions(viewpoint_options);
            }
        }
    }

    MolokoMapController.$inject = ['$rootScope', 'settings', '$linq', '$state', '$stateParams', '$timeout', '$element', 'vgIdService', '$scope', 'dbService', '$q', 'organizationService'];
    angular.module('app').component('molokoMap', {
        templateUrl: 'blocks/mapControl/molokoMap.html',
        controller: MolokoMapController
    });
})();