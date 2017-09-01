/**
 * Created by Nekrasov on 5/11/2017.
 */
(function () {
    "use strict";
    angular.module('app').directive("fileSystemImage", ['settings', function (settings) {
        return {
            restrict: 'A',
            scope: {
                model: '@fileSystemImage'
            },
            link: function (scope, element, attributes, ctrl) {
                //var e1 = element.val();
                element.attr('src', attributes.default);
                scope.$watch('model', function () {
                    if (scope.model && /\.(png|jpg|ico|gif)$/.test(scope.model))
                        element.attr("src", settings.resourceFolder + '/' + scope.model);
                });
                element.bind('error', function (error) {
                    element.attr('src', attributes.default);
                });
            }
        }
    }]);
})();