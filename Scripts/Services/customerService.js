(function () {
    'use strict';

    class CustomerService {
        constructor($http, $q, settings, dbService, $linq) {
            this.$http = $http;
            this.settings = settings;
            this.dbService = dbService;
            this.$linq = $linq;
        }

        get() {
            let self = this;
            return self.dbService.getData().then(data => data.Customer);
        }

        getSchedule() {
            let self = this;
            return self.get().then(customer => {
                let date = new Date().getDay() - 1;
                if (date < 0)
                    date = 6;
                return customer.Schedule[date];
            });
        }
    }

    angular
        .module('app')
        .service('customerService', CustomerService);

    CustomerService.$inject = ['$http', '$q', 'settings', 'dbService', '$linq'];
})();