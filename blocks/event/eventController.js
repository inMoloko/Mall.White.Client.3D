(function () {
    "use strict";

    class EventController {
        constructor($state, eventService) {
            var self = this;
            eventService.get($state.params.EventID).then(i => {
                self.item = i;
            });
        };
    }

    EventController.$inject = ['$state', 'eventService'];
    angular.module('app').controller('eventController', EventController);
})();