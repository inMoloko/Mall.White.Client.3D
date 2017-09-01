(function () {
    "use strict";
    var app = angular.module('app');
    app.factory('arrayHelper', function () {
        return {
            nextItem: function (arr, value) {
                return arr[($.inArray(value, arr) + 1) % arr.length];
            }
        }
    });
})();


