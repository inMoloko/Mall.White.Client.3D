(function () {
    "use strict";
    angular.module('app').directive("molokoImageSource", function () {
        return {
            restrict: 'A',
            scope: {
                model: '=molokoImageSource'
            },
            link: function (scope, element, attributes, ctrl) {
                //var e1 = element.val();
                scope.$watch('model', function () {
                    element.attr("src", scope.model ? 'data:image/jpeg;base64,' + scope.model : '');
                });
            }
        }
    });
})();