/**
 * Created by Nekrasov on 17.03.2017.
 */
(function () {
    "use strict";
    let controller = function ($scope, $http, settings, $rootScope, $state, $stateParams, $timeout) {
        let self = this;
        self._$state = $state;
        self._$rootScope = $rootScope;
        self._$scope = $scope;

        $scope.currentFilter = $state.params.Filter;

        $scope.placeholder = "Ашан, ИКЕА, джинсы...";
        if ($state.current.name) {
            if ($state.current.name.includes("shop")) {
                $scope.placeholder = "Ашан, стокман ...";
            }
            if ($state.current.name.includes("proposal")) {
                $scope.placeholder = "Название акции...";
            }
            if ($state.current.name.includes("event")) {
                $scope.placeholder = "Название события...";
            }
            if ($state.current.name.includes("restaurant")) {
                $scope.placeholder = "KFC, Кофе, суши...";
            }
        }
        self._$rootScope.currentFilter = $state.Filter;

        // $scope.$watch("currentFilter", function (n, o) {
        //     if (n == o)
        //         return;
        //     if ($state.current.name == "navigation.mainMenu" && $scope.currentFilter == undefined)
        //         return;
        //     if (!$state.current.name.includes("searchResult")) {
        //         $state.go('.searchResult', {
        //             CategoryID: $state.params.CategoryID,
        //             Filter: $scope.currentFilter
        //         }, {reload: true});
        //         return;
        //     }
        //     $state.go('.', {CategoryID: $state.params.CategoryID, Filter: $scope.currentFilter}, {reload: false});
        //
        // });

        $timeout(function () {
            var $firstInput = $('#filter');
            $firstInput.focus();
            $firstInput.bind('click', function () {
                jsKeyboard.show();
            });

            jsKeyboard.currentElement = $firstInput;
            jsKeyboard.currentElement.val($state.params.Filter);
            jsKeyboard.currentElementCursorPosition = $firstInput.val().length || 0;
            $firstInput.bind('writeKeyboard', function (event, a) {
                $scope.currentFilter = $firstInput.val();
                if (!$state.current.name.includes("searchResult")) {
                    $state.go('.searchResult', {
                        CategoryID: $state.params.CategoryID,
                        Filter: $scope.currentFilter
                    }, {reload: true});
                    return;
                }
                $state.go('.', {CategoryID: $state.params.CategoryID, Filter: $scope.currentFilter});
                if (!$scope.$$phase)
                    $scope.$apply();
            });
        }, 0);

        $scope.$watch('currentFilter', function (n, o) {
            if (n == o)
                return;
            $('#keyboardHeader>span').text(jsKeyboard.currentElement.val());
            if (!$state.current.name.includes("searchResult")) {
                $state.go('.searchResult', {
                    CategoryID: $state.params.CategoryID,
                    Filter: $scope.currentFilter
                }, {reload: true});
                return;
            }
            $state.go('.', {CategoryID: $state.params.CategoryID, Filter: $scope.currentFilter});
        });
        jsKeyboard.show();

        $scope.$on('$destroy', function () {
            jsKeyboard.hide();
            $('#keyboardHeader>span').text(null);
            $('#filter').unbind();
        });
    };
    controller.prototype.clear = function () {
        let $firstInput = $('#filter');
        $firstInput.val('');
        $firstInput.trigger('writeKeyboard');
    };
    controller.prototype.change = function () {
        console.log('change');
    };
    controller.prototype.refresh = function () {
        console.log('refresh');
    };
    controller.prototype.goSearch = function () {
        let self = this;
        self._$state.go('navigation.searchResult');
    };
    controller.prototype.goBack = function () {
        let self = this;
        self._$scope.currentFilter = null;
        self._$state.go('navigation.mainMenu');
    };
    controller.$inject = ['$scope', '$http', 'settings', '$rootScope', '$state', '$stateParams', '$timeout'];
    angular.module('app').controller('searchControlFilterController', controller);
})();