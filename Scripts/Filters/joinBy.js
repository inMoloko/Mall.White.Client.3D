(function () {
    "use strict";

    function getModel(object, path) {
        var segs = angular.isString(path) ? path.split('.') : path;
        var root = object;

        while (segs.length > 0) {
            if (angular.isArray(root)) {
                var array = root.map(function (item) {
                    return getModel(item, angular.copy(segs));
                });
                return array.join(',');
            }
            var pathStep = segs.shift();
            if (typeof root[pathStep] === 'undefined') {
                root[pathStep] = segs.length === 0 ? {value: ''} : {};
            }
            root = root[pathStep];
        }
        return root;
    };

    angular.module('app').filter('joinBy', function () {
        return function (input, delimiter, field) {
            var array = input || [];
            if (field !== undefined) {
                array = array.map(function (item) {
                    return getModel(item, field);
                });
            }
            return array.join(delimiter || ',');
        }
    });
})();