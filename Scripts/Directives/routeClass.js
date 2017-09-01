(function () {
    "use strict";
    angular.module('app').directive('routeClass', ['$rootScope', '$state', function ($rootScope, $state) {
        return {
            restrict: 'A',
            scope: {
                routeClass: '<'
            },
            link: function (scope, element, attributes, ctrl) {
                function calculate(event, toState, toParams, fromState, fromParams) {
                    for (let key in scope.routeClass) {
                        element.removeClass(scope.routeClass[key]);
                    }
                    element.addClass(scope.routeClass[toState.name]);
                };
                calculate(undefined, $state.current);
                var handler = $rootScope.$on('$stateChangeSuccess', calculate);
                scope.$on("$destroy", function () {
                    handler();
                });
            }
        }
    }]);
})();