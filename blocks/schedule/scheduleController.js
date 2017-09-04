(function () {
    "use strict";

    const constants = {
        Terminal: 0,
        Link: 1,
        Service: 2
    };

    class ScheduleController {
        constructor($linq, $state, customerService) {
            this.$linq = $linq;
            this.$state = $state;
            this.customerService = customerService;
        }

        $onInit() {
            let self = this;
            self.customerService.getSchedule().then(i => {
                self.schedule = i;
            });
        }
    }

    ScheduleController.$inject = ['$linq', '$state', 'customerService'];
    angular.module('app').controller('scheduleController', ScheduleController);
})();