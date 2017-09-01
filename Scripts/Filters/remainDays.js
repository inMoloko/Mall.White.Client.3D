(function () {
    "use strict";
    angular.module('app').filter('remainDays', [function () {
        var day = function (days) {
            let expressions = ['день', 'дня', 'дней'];
            let result;
            let count = days % 100;
            if (count >= 5 && count <= 20) {
                result = expressions[2];
            } else {
                count = count % 10;
                if (count == 1) {
                    result = expressions[0];
                } else if (count >= 2 && count <= 4) {
                    result = expressions[1];
                } else {
                    result = expressions[2];
                }
            }
            return result;
        };

        return function (date, keyname) {
            if (!date)
                return;
            var result = moment(date).diff(moment(), 'days');


            return `${result} ${day(result)}`;
        };
    }]);
})();