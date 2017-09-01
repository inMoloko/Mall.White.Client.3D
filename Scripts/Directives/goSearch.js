/**
 * Created by Nekrasov on 29.03.2017.
 */
(function () {
    "use strict";
    angular.module('app').directive('goSearch', ['$rootScope', '$state', function ($rootScope, $state) {
        return {
            restrict: 'A',
            link: function (scope, element, attributes, ctrl) {
                element.on('click', function (e) {
                    let state = attributes.state || ".organization";
                    let parts = $state.current.name.split('.');

                    if ($state.current.name.endsWith(state)) {
                        let index = parts.length - 1;
                        while (parts[index] != "searchResult") {
                            index--;
                            if (index < 0)
                                break;
                        }
                        if (index == -1) {
                            $state.go("^.searchResult");
                        }
                        else
                            $state.go(parts.slice(0, index + 1).join('.'));
                    }
                    else {
                        $state.go(".searchResult");
                    }
                });
            }
        };
    }]);
})();