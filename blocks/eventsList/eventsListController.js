/**
 * Created by Nekrasov on 20.03.2017.
 */
(function () {
    "use strict";

    class EventsListController {
        constructor($state, eventService) {
            var self = this;
            self.filter = $state.params.Filter;
            eventService.getFilter($state.params.Filter).then(i => {
                self.items = i;
            });
        };
    }

    EventsListController.$inject = ['$state', 'eventService'];
    angular.module('app').controller('eventsListController', EventsListController);
})();