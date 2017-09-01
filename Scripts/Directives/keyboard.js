(function () {
    "use strict";
    angular.module('app').directive("keyboard", ['$timeout', 'settings', function ($timeout, settings) {
        return {
            restrict: 'A',
            scope: {
                ngModel: '='
            },
            link: function (scope, element, attributes, ctrl) {
                function refresh(time = 400) {
                    if (scope.timeout) {
                        $timeout.cancel(scope.timeout);
                    }
                    scope.timeout = $timeout(function () {
                        jsKeyboard.hide();
                    }, time);
                };
                if (settings.displayKeyboard === false)
                    return;

                var jElement = $(element);
                //jsKeyboard.init("virtualKeyboard");
                var event = function () {
                    jsKeyboard.currentElement = jElement;
                    jsKeyboard.currentElementCursorPosition = jElement.val().length || 0;
                    jsKeyboard.show();
                    console.log('event', jsKeyboard.currentElement);
                }
                var timeout;
                jElement.on('focusin', function () {
                    jsKeyboard.show();
                    console.log('focusin', jsKeyboard.currentElement);
                });
                jElement.on('focusout', function (e) {
                    refresh();
                    console.log('focusout', jsKeyboard.currentElement);
                });
                jElement.on('focus, focusin, click', event);
                jElement.on('show', function () {
                    refresh(5000);
                    console.log('show');
                });

                jElement.on('writeKeyboard', function () {
                    scope.ngModel = jElement[0].value;
                    refresh(5000);
                    scope.$apply();
                    console.log('writeKeyboard');
                });
                // $timeout(function () {
                //     jElement.focus();
                // }, 200);
                scope.$on("$destroy", function () {
                    jsKeyboard.hide();
                    jElement.unbind();
                    console.log('$destroy');
                    // if (scope.timeout) {
                    //     $timeout.cancel(scope.timeout);
                    //     delete scope.timeout;
                    // }
                });
            }
        };
    }]);
})();