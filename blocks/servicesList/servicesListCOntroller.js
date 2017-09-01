(function () {
    "use strict";
    var controller = function ($scope, $http, settings, $rootScope, $state, $stateParams, $linq, dbService) {

        this.$state = $state;

        // if ($rootScope.organizations === undefined) {
        //     let event = $rootScope.$on('floorLoad', function () {
        //         filter();
        //         event();
        //     });
        //
        // }
        // else {
        //     filter();
        // }

        dbService.organizationGetFilter($stateParams.Filter, $stateParams.CategoryID).then(data => {
            $rootScope.currentOrganizations = data;
            $state.go($state.current.name, {Organizations: data, CategoryID: $stateParams.CategoryID});
        });

        function filter() {
            let categoryID = $stateParams.CategoryID;
            $scope.searchText = $stateParams.Filter == undefined ? "" : $stateParams.Filter.toLowerCase();
            var tmp = $rootScope.organizations;
            var tmpCat = $rootScope.categories;
            if ($scope.searchText) {
                var tmpCatIds = [];
                angular.forEach(tmpCat, function (item) {
                    if (item.Name && item.Name.toLowerCase().includes($scope.searchText))
                        tmpCatIds.push(item.CategoryID);
                });

                let ln = $linq.Enumerable().From(tmpCatIds);
                tmp = tmp.filter(item => {
                    return (item.Name && item.Name.toLowerCase().includes($scope.searchText)) || (item.KeyWords && item.KeyWords.toLowerCase().includes($scope.searchText)) || ln.Intersect(item.CategoryOrganization.map(i => i.CategoryID)).Count() !== 0;
                });

            }
            $rootScope.otherCurrentOrganizations = tmp;

            if (categoryID && categoryID != -1) {
                categoryID = parseInt(categoryID);

                let cats = $rootScope.categories.find(i => i.CategoryID == categoryID).ChildrenIds;
                cats.push(categoryID);
                let ln = $linq.Enumerable().From(cats);
                tmp = tmp.filter(item => {
                    return ln.Intersect(item.CategoryOrganization.map(i => i.CategoryID)).Count() !== 0;
                });
            }

            $rootScope.currentOrganizations = tmp;
            $state.go($state.current.name, {Organizations: tmp, CategoryID: categoryID});
            //Нечеткий поиск на сервере
            //if ($scope.searchText) {

            //    let url = settings.webApiBaseUrl + '/organization/FuzzySearch/' + $scope.searchText + '/?CustomerID=' + settings.customerID || '';
            //    if (categoryID && categoryID != -1) {
            //        let cats = $rootScope.categories.find(i => i.CategoryID == categoryID).ChildrenIds;
            //        cats.push(categoryID);
            //        url += '&Categories=' + cats.join(',');
            //    }

            //    $http.get(url).then(function (response) {
            //        if (response.data.ReducedResult) {
            //            let ids = response.data.ReducedResult.map(i => i.ID);
            //            $rootScope.currentOrganizations = $rootScope.organizations.filter(i => ids.includes(i.OrganizationID));
            //        }
            //        if (response.data.FullResult) {
            //            let ids = response.data.FullResult.map(i => i.ID);
            //            $rootScope.otherCurrentOrganizations = $rootScope.organizations.filter(i => ids.includes(i.OrganizationID));
            //        }
            //    });
            //}
            //else {
            //$rootScope.otherCurrentOrganizations = tmp;
            //if (categoryID && categoryID != -1) {
            //    categoryID = parseInt(categoryID);

            //    let cats = $rootScope.categories.find(i => i.CategoryID == categoryID).ChildrenIds;
            //    cats.push(categoryID);
            //    let ln = $linq.Enumerable().From(cats);
            //    tmp = tmp.filter(item => {
            //        return ln.Intersect(item.CategoryOrganization.map(i => i.CategoryID)).Count() !== 0;
            //    });
            //}
            //$rootScope.currentOrganizations = tmp;
            //}
        };

        $scope.home = function () {
            $state.go('navigation.mainMenu');
        };
        $scope.select = function (item) {
            $state.go('navigation.organization', {
                OrganizationID: item.OrganizationID,
                Filter: $stateParams.Filter,
                CategoryID: $stateParams.CategoryID
            }, {inherit: true});
        };
        // $scope.megacard = function (item) {
        //     // CategoryOrganization[0].CategoryID
        //     return item.CategoryOrganization.map(i => i.CategoryID).includes(1704);
        // };
        //$scope.hide = function () {
        //    $state.go("navigation.closedResult", { CategoryID: $stateParams.CategoryID, Filter: $stateParams.Filter, OrganizationType: $stateParams.OrganizationType });
        //};
        $scope.hide = function () {
            $rootScope.currentStateName = $state.current.name;
            $rootScope.currentStateParam = $state.params;
            $rootScope.closeResultTitle = 'Найдено ' + $rootScope.currentOrganizations.length;
            $state.go("navigation.closedResult", {
                CategoryID: $stateParams.CategoryID,
                Filter: $stateParams.Filter,
                OrganizationType: $stateParams.OrganizationType
            });
        };
        let stateChangeHandler = $rootScope.$on('$stateChangeSuccess',
            function (event, toState, toParams, fromState, fromParams) {
                if (toState.name === 'navigation.searchResult' && fromState.name === 'navigation.searchResult.organization') {
                    $rootScope.currentOrganization = undefined;
                    filter();
                }
                ;
            });
        // $scope.$watch("$state.params", function (n, o) {
        //    console.log(n,o);
        // });
        $scope.$on("$destroy", function () {
            stateChangeHandler();
            locationChangeHandler();
        });
        let locationChangeHandler = $scope.$on('$locationChangeSuccess', function () {
            //filter();
        });
        $scope.getFloors = function (item) {
            if (!item)
                return;
            return item.OrganizationMapObject.map(i => {
                return $rootScope.floorsDic[i.MapObject.FloorID].Number;
            }).join(',');
        };
    };
    controller.prototype.isActive = function (organizationID) {
        var self = this;
        return self.$state.params.OrganizationID == organizationID;
    }
    controller.$inject = ['$scope', '$http', 'settings', '$rootScope', '$state', '$stateParams', '$linq', 'dbService'];
    angular.module('app').controller('servicesListController', controller);
})();