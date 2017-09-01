(function () {
    "use strict";

    class FeedbackController {
        constructor($scope, $http, settings, $state, $rootScope, eventService, feedbackService) {
            var self = this;
            self.$state = $state;
            self.item = {};
            self.ratings = [1, 2, 3, 4, 5];
            self.feedbackService = feedbackService;

            var $firstInput = $('#filter');
            $firstInput.focus();
            jsKeyboard.currentElement = $firstInput;
            jsKeyboard.currentElement.val($state.params.Filter);
            jsKeyboard.currentElementCursorPosition = $firstInput.val().length || 0;
            $firstInput.bind('writeKeyboard', function (event, a) {
                self.item.text = $firstInput.val();
                $scope.$apply();
            });
            jsKeyboard.show();

            $scope.$on('$destroy', function () {
                jsKeyboard.hide();
                $('#keyboardHeader>span').text(null);
                $('#filter').unbind();
            });

        };

        submit() {
            var self = this;
            self.feedbackService.post(self.item).then(function () {

                self.$state.go(".final", {feedback: self.item});

            });
        };
    }

    FeedbackController.$inject = ['$scope', '$http', 'settings', '$state', '$rootScope', 'eventService', 'feedbackService'];
    angular.module('app').controller('feedbackController', FeedbackController);
})();