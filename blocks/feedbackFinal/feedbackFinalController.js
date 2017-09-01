(function () {
    "use strict";

    class FeedbackFinalController {
        constructor($scope, $http, settings, $state, $rootScope, eventService, $timeout) {
            var self = this;
            self.$state = $state;
            self.item = $state.params.feedback;
            $timeout(function () {
                $state.go('navigation');
            }, 5000);
        };

        getRating() {
            var self = this;
            var rating = self.$state.params.feedback.rating || 1;
            var input = [];
            for (var i = 1; i <= rating; i++) {
                input.push(i);
            }
            return input;
        };
    }

    FeedbackFinalController.$inject = ['$scope', '$http', 'settings', '$state', '$rootScope', 'eventService', '$timeout'];
    angular.module('app').controller('feedbackFinalController', FeedbackFinalController);
})();