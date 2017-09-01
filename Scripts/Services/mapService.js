(function () {
    'use strict';
    var service = function ($rootScope) {
        let self = this;
        $rootScope.$watchCollection('organizations', function () {
            if ($rootScope.organizations === undefined) {
                return;
            }
            ;
            self.mapFloors = {};
            self.mapOrganizations = {};
            var promises = [];
            $rootScope.floors.forEach(item => {
                var image = getImage(item.File);
                promises.push(image);
                image.then(function (value) {
                    var southWest = map.unproject([-value.width / 2, value.height / 2], map.getMaxZoom());
                    var northEast = map.unproject([value.width / 2, -value.height / 2], map.getMaxZoom());
                    item.layer = L.imageOverlay(value.src, [southWest, northEast]);
                    item.layerGroup = L.featureGroup();
                    item.pathGroup = L.layerGroup();
                    $scope.mapFloors[item.FloorID] = item;
                    southWest = map.unproject([-value.width / 2, value.height / 2], 18);
                    northEast = map.unproject([value.width / 2, -value.height / 2], 18);
                    item.boundSmall = new L.LatLngBounds(southWest, northEast);
                    southWest = map.unproject([-value.width / 1, value.height / 1], map.getMaxZoom());
                    northEast = map.unproject([value.width / 1, -value.height / 1], map.getMaxZoom());
                    item.bound = new L.LatLngBounds(southWest, northEast);
                });
            });
            $q.all(promises).then(function () {
                //Наносим организации
                $scope.options.zoom = map.getZoom();
                $rootScope.organizations.forEach(item => {
                    var position = map.unproject([item.Longitude, item.Latitude], map.getMaxZoom());
                    let markerIcon = getIcon(item, false);
                    item.marker = L.marker(position, {
                        icon: markerIcon,
                        title: item.Name,
                        iconSize: [16, 16],
                        zIndexOffset: getZIndex(item)
                    });
                    //item.marker.setZIndexOffset($rootScope.currentTerminal.OrganizationID === item.OrganizationID ? 100 : 20);
                    //item.marker.setRadius(5);
                    $scope.mapFloors[item.FloorID].layerGroup.addLayer(item.marker, {pane: 'tilePane'});
                    $scope.mapOrganizations[item.OrganizationID] = item;
                    //Добавляем оргии с надписями поверх

                    if (item.SignPointLongitude && item.SignPointLatitude && item.SignPointRadius) {
                        $scope.mapFloors[item.FloorID].layerGroup.addLayer(L.Marker.zoomingMarker(item));
                    }

                });
                //Устанавливаем терминал
                $scope.setFloor($rootScope.currentTerminal.Organization.Floor.FloorID);
                map.setBearing($rootScope.currentTerminal.LookDirectionAngleDegrees);
                setView();
                init();
            });

        });
    };

    service.$inject = ['$rootScope'];
    angular.module('app').service('mapService', service);
});